import { Connection, PublicKey, SystemProgram, Keypair, Ed25519Program, SYSVAR_INSTRUCTIONS_PUBKEY } from '@solana/web3.js';
import * as anchor from '@coral-xyz/anchor';
import { Program, BN } from '@coral-xyz/anchor';
import { SOLANA_MAINNET_USDC, SOLANA_DEVNET_USDC } from '../config/tokens';
import IDL from '../idl/blockchain_solana.json';
import { TOKEN_PROGRAM_ID, getAssociatedTokenAddressSync, ASSOCIATED_TOKEN_PROGRAM_ID } from '@solana/spl-token';
import { BagsSDK } from '@bagsfm/bags-sdk';
import { getDomainKeySync } from '@bonfida/spl-name-service';
import { snsService } from './SnsService';

/**
 * Solana Credit Service
 * Handles Solana-specific credit operations (Phase 8: Full AI Integration)
 * Enhanced with Bags SDK for creator finance integrations.
 *
 * Account names match the on-chain IDL exactly:
 *   request_funding: project, creditLine, vaultAuthority, usdcMint, vaultTokenAccount, developer, snsNameAccount, instructionsSysvar, systemProgram, tokenProgram, associatedTokenProgram
 *   back_project:   project, developerCreditLine, backer, backerTokenAccount, vaultTokenAccount, vaultAuthority, usdcMint, tokenProgram
 *   verify_milestone: project, developerTokenAccount, vaultTokenAccount, vaultAuthority, verifier, usdcMint, tokenProgram
 *   claim_reward:   project, backer, backerTokenAccount, vaultTokenAccount, vaultAuthority, usdcMint, tokenProgram
 *   repay_loan:     creditLine, developer, developerTokenAccount, treasuryTokenAccount, treasuryAuthority, project, usdcMint, tokenProgram
 *   initialize_treasury: treasuryAuthority, usdcMint, treasuryTokenAccount, authority, systemProgram, tokenProgram, associatedTokenProgram
 */

interface ProjectData {
    hackathonIds: number[];
    githubUrl: string;
    projectName: string;
    milestoneDescriptions: string[];
    milestoneAmounts: string[] | number[];
    verifier?: string;
    builderSnsDomain?: string;
    builderSnsNameAccount?: string;
    launchOnBags?: boolean;
    bagsTokenMetadata?: {
        name: string;
        symbol: string;
        description: string;
    };
}

interface ProjectBackingData {
    totalBacking: string;
    backerCount: number;
    maxMultiplier: number;
    creditScore: number;
}

interface ProjectDetails {
    isActive: boolean;
    creditScore: number;
    fundingAmount: string;
    milestonesCompleted: number;
    milestonesCount: number;
    builderSnsDomain?: string;
    builderSnsNameAccount?: string;
    bagsTokenAddress?: string;
}

class SolanaCreditService {
    // Program ID is injected via env in production. Fall back to the current IDL address
    // Program ID from env var, falling back to the IDL's deployed address.
    // IDL address is baked at build time from the deployed program — safe for devnet.
    // For mainnet: always set NEXT_PUBLIC_SOLANA_PROGRAM_ID explicitly in env.
    private PROGRAM_ID = new PublicKey(
        process.env.NEXT_PUBLIC_SOLANA_PROGRAM_ID || (IDL as any).address
    );

    private bagsClient: BagsSDK | null = null;

    constructor() {
        const apiKey = process.env.NEXT_PUBLIC_BAGS_API_KEY;
        if (apiKey) {
            const rpcUrl = process.env.NEXT_PUBLIC_SOLANA_RPC_URL || 'https://api.devnet.solana.com';
            this.bagsClient = new BagsSDK(
                apiKey,
                new Connection(rpcUrl),
            );
        }
    }

    private getCluster(): string {
        return (process.env.NEXT_PUBLIC_SOLANA_CLUSTER || 'devnet').toLowerCase();
    }

    private getUsdcMint(): PublicKey {
        const cluster = this.getCluster();
        if (cluster === 'mainnet' || cluster === 'mainnet-beta') return new PublicKey(SOLANA_MAINNET_USDC);
        return new PublicKey(SOLANA_DEVNET_USDC);
    }

    private getProgram(connection: Connection, wallet: { publicKey: PublicKey; signTransaction: any; signAllTransactions: any }) {
        if (!wallet) {
            throw new Error("Wallet not connected or not provided");
        }
        const provider = new anchor.AnchorProvider(connection, wallet, {
            preflightCommitment: 'processed',
        });
        const idlWithAddress = {
            ...(IDL as any),
            address: this.PROGRAM_ID.toBase58(),
        };
        return new Program(idlWithAddress as anchor.Idl, provider);
    }

    private getReadOnlyProgram(connection: Connection) {
        const dummyKeypair = Keypair.generate();
        const provider = new anchor.AnchorProvider(connection, {
            publicKey: dummyKeypair.publicKey,
            signTransaction: async (tx: any) => tx,
            signAllTransactions: async (txs: any[]) => txs,
        } as any, {
            preflightCommitment: 'processed',
        });
        const idlWithAddress = {
            ...(IDL as any),
            address: this.PROGRAM_ID.toBase58(),
        };
        return new Program(idlWithAddress as anchor.Idl, provider);
    }

    // ── PDA helpers ──────────────────────────────────────────────────

    private getProjectPda(developer: PublicKey, projectName: string): PublicKey {
        const [pda] = PublicKey.findProgramAddressSync(
            [Buffer.from("project"), developer.toBuffer(), Buffer.from(projectName)],
            this.PROGRAM_ID,
        );
        return pda;
    }

    private getCreditLinePda(developer: PublicKey): PublicKey {
        const [pda] = PublicKey.findProgramAddressSync(
            [Buffer.from("credit_line"), developer.toBuffer()],
            this.PROGRAM_ID,
        );
        return pda;
    }

    private getVaultAuthorityPda(projectPda: PublicKey): PublicKey {
        const [pda] = PublicKey.findProgramAddressSync(
            [Buffer.from("vault_authority"), projectPda.toBuffer()],
            this.PROGRAM_ID,
        );
        return pda;
    }

    private getTreasuryAuthorityPda(): PublicKey {
        // Global protocol treasury PDA — seeds are [b"treasury"], NOT per-developer
        const [pda] = PublicKey.findProgramAddressSync(
            [Buffer.from("treasury")],
            this.PROGRAM_ID,
        );
        return pda;
    }

    private getVaultTokenAccount(usdcMint: PublicKey, vaultAuthority: PublicKey): PublicKey {
        // allowOwnerOffCurve = true because vaultAuthority is a PDA
        return getAssociatedTokenAddressSync(usdcMint, vaultAuthority, true);
    }

    private getTreasuryTokenAccount(usdcMint: PublicKey): PublicKey {
        const treasuryAuthority = this.getTreasuryAuthorityPda();
        // allowOwnerOffCurve = true because treasuryAuthority is a PDA
        return getAssociatedTokenAddressSync(usdcMint, treasuryAuthority, true);
    }

    private getAssociatedTokenAccount(usdcMint: PublicKey, owner: PublicKey): PublicKey {
        // For PDA owners, call with allowOwnerOffCurve=true via getVaultTokenAccount / getTreasuryTokenAccount.
        // This helper is for regular (non-PDA) owners only.
        return getAssociatedTokenAddressSync(usdcMint, owner);
    }

    private normalizeSnsDomain(domain: string): string {
        return domain.endsWith('.sol') ? domain : `${domain}.sol`;
    }

    private buildIdentityClaimMessage(
        developer: PublicKey,
        snsNameAccount: PublicKey,
        builderSnsDomain: string,
        projectName: string,
        githubUrl: string
    ): Uint8Array {
        return new TextEncoder().encode(
            `proof-of-ship:sns-identity:v1:${developer.toBase58()}:${snsNameAccount.toBase58()}:${builderSnsDomain}:${projectName}:${githubUrl}`
        );
    }

    // ── Instructions ─────────────────────────────────────────────────

    /**
     * One-time setup: create the protocol treasury ATA so repay_loan has
     * somewhere to send USDC that isn't the project's milestone vault.
     */
    async initializeTreasury(connection: Connection, wallet: any) {
        const program = this.getProgram(connection, wallet);
        const usdcMint = this.getUsdcMint();
        const treasuryAuthority = this.getTreasuryAuthorityPda();
        const treasuryTokenAccount = this.getTreasuryTokenAccount(usdcMint);

        const tx = await program.methods.initializeTreasury().accounts({
            treasuryAuthority,
            usdcMint,
            treasuryTokenAccount,
            authority: wallet.publicKey,
            systemProgram: SystemProgram.programId,
            tokenProgram: TOKEN_PROGRAM_ID,
            associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
        }).rpc();

        return { success: true, hash: tx, treasuryAuthority: treasuryAuthority.toBase58(), treasuryTokenAccount: treasuryTokenAccount.toBase58() };
    }

    /**
     * Launch a token on Bags for a project (Phase 8: Bags Hackathon)
     */
    async launchBagsToken(projectData: ProjectData, wallet: any) {
        if (!this.bagsClient) {
            throw new Error("Bags SDK not initialized (API Key missing)");
        }

        if (!projectData.bagsTokenMetadata) {
            throw new Error("Bags token metadata missing");
        }

        try {
            console.log('Bags: Launching token', projectData.bagsTokenMetadata);
            const launchResult = await (this.bagsClient as any).token.launchV2({
                metadata: {
                    name: projectData.bagsTokenMetadata.name,
                    symbol: projectData.bagsTokenMetadata.symbol,
                    description: projectData.bagsTokenMetadata.description,
                },
            });

            return {
                success: true,
                mint: launchResult.mint,
                signature: launchResult.signature
            };
        } catch (error) {
            console.error('Bags token launch error:', error);
            throw error;
        }
    }

    /**
     * Get claimable fees for the current user
     */
    async getClaimableFees(walletPublicKey: PublicKey) {
        if (!this.bagsClient) return [];
        return await (this.bagsClient as any).fee.getAllClaimablePositions(walletPublicKey.toBase58());
    }

    /**
     * Claim fees from Bags Fee Share V2
     */
    async claimFees(wallet: any, positions: any[]) {
        if (!this.bagsClient) throw new Error("Bags SDK not initialized");
        
        const tx = await (this.bagsClient as any).fee.getClaimTransactions({
            wallet: wallet.publicKey.toBase58(),
            positions: positions.map(p => p.id),
        });

        // Sign and send transaction (via wallet adapter)
        const signed = await wallet.signAllTransactions(tx);
        // ... (broadcast via connection)
        return signed;
    }

    /**
     * Request funding for a project on Solana
     */
    async requestFunding(connection: Connection, wallet: any, projectData: ProjectData) {
        console.log('Solana: requestFunding', projectData);
        const publicKey = wallet.publicKey;
        const program = this.getProgram(connection, wallet);

        try {
            if (Buffer.from(projectData.projectName).length > 32) {
                throw new Error('Solana projectName must be <= 32 bytes (PDA seed limit). Shorten the name.');
            }

            let bagsTokenAddress: string | undefined;
            if (projectData.launchOnBags && this.bagsClient) {
                try {
                    const bagsResult = await this.launchBagsToken(projectData, wallet);
                    bagsTokenAddress = bagsResult.mint;
                    console.log('Bags token launched successfully:', bagsTokenAddress);
                } catch (err) {
                    console.error('Bags launch failed, continuing with standard funding:', err);
                }
            }

            // Derive PDAs
            const projectPda = this.getProjectPda(publicKey, projectData.projectName);
            const creditLinePda = this.getCreditLinePda(publicKey);
            const vaultAuthorityPda = this.getVaultAuthorityPda(projectPda);
            const usdcMint = this.getUsdcMint();
            const vaultTokenAccount = this.getVaultTokenAccount(usdcMint, vaultAuthorityPda);

            const verifier = new PublicKey(projectData.verifier || publicKey.toBase58());
            if (!wallet.signMessage) {
                throw new Error('Connected Solana wallet must support message signing for SNS identity proof.');
            }

            const resolvedSnsDomain = projectData.builderSnsDomain
                || await snsService.resolveAddressToName(publicKey.toBase58());

            if (!resolvedSnsDomain) {
                throw new Error('A registered .sol identity is required to create a Solana project. Connect a wallet that owns an SNS domain first.');
            }

            const builderSnsDomain = this.normalizeSnsDomain(resolvedSnsDomain);
            const { pubkey: snsNameAccount } = getDomainKeySync(builderSnsDomain);
            const identityMessage = this.buildIdentityClaimMessage(
                publicKey,
                snsNameAccount,
                builderSnsDomain,
                projectData.projectName,
                projectData.githubUrl
            );
            const identitySignature = await wallet.signMessage(identityMessage);
            const identityProofIx = Ed25519Program.createInstructionWithPublicKey({
                publicKey: publicKey.toBytes(),
                message: identityMessage,
                signature: identitySignature,
            });

            const tx = await program.methods.requestFunding(
                projectData.hackathonIds.map(id => new BN(id)),
                projectData.githubUrl,
                projectData.projectName,
                projectData.milestoneDescriptions,
                projectData.milestoneAmounts.map(amt => new BN(amt)),
                verifier,
                builderSnsDomain,
                Array.from(identitySignature)
            ).accounts({
                project: projectPda,
                creditLine: creditLinePda,
                vaultAuthority: vaultAuthorityPda,
                usdcMint,
                vaultTokenAccount,
                developer: publicKey,
                snsNameAccount,
                instructionsSysvar: SYSVAR_INSTRUCTIONS_PUBKEY,
                systemProgram: SystemProgram.programId,
                tokenProgram: TOKEN_PROGRAM_ID,
                associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
            }).preInstructions([identityProofIx]).rpc();

            return {
                success: true,
                hash: tx,
                projectPda: projectPda.toBase58(),
                projectData: {
                    ...projectData,
                    builderSnsDomain,
                    builderSnsNameAccount: snsNameAccount.toBase58(),
                    bagsTokenAddress
                }
            };
        } catch (error) {
            console.error('Solana requestFunding error:', error);
            throw error;
        }
    }

    /**
     * Back a project on Solana
     */
    async backProject(
        connection: Connection,
        wallet: any,
        projectPda: PublicKey,
        amount: string | number,
        multiplier: number,
        backerTokenAccount?: PublicKey
    ) {
        console.log('Solana: backProject', { projectPda: projectPda.toBase58(), amount });
        const program = this.getProgram(connection, wallet);

        try {
            const usdcMint = this.getUsdcMint();

            // Fetch project to get developer's public key for credit line derivation
            const projectAccount = await (program.account as any).project.fetch(projectPda);
            const developerPublicKey = projectAccount.developer as PublicKey;

            const creditLinePda = this.getCreditLinePda(developerPublicKey);
            const vaultAuthorityPda = this.getVaultAuthorityPda(projectPda);
            const vaultTokenAccount = this.getVaultTokenAccount(usdcMint, vaultAuthorityPda);

            const resolvedBackerTokenAccount = backerTokenAccount || this.getAssociatedTokenAccount(usdcMint, wallet.publicKey);

            const tx = await program.methods.backProject(
                new BN(multiplier),
                new BN(amount)
            ).accounts({
                project: projectPda,
                developerCreditLine: creditLinePda,
                backer: wallet.publicKey,
                backerTokenAccount: resolvedBackerTokenAccount,
                vaultTokenAccount,
                vaultAuthority: vaultAuthorityPda,
                usdcMint,
                tokenProgram: TOKEN_PROGRAM_ID,
            }).rpc();

            return {
                success: true,
                hash: tx,
                projectPda: projectPda.toBase58()
            };
        } catch (error) {
            console.error('Solana backProject error:', error);
            throw error;
        }
    }

    /**
     * Verify a milestone and trigger payout
     */
    async verifyMilestone(
        connection: Connection,
        wallet: any,
        projectPda: PublicKey,
        milestoneIndex: number
    ) {
        console.log('Solana: verifyMilestone', { projectPda: projectPda.toBase58(), milestoneIndex });
        const program = this.getProgram(connection, wallet);
        
        try {
            const usdcMint = this.getUsdcMint();

            const projectAccount = await (program.account as any).project.fetch(projectPda);
            const developerPublicKey = projectAccount.developer as PublicKey;

            const vaultAuthorityPda = this.getVaultAuthorityPda(projectPda);
            const vaultTokenAccount = this.getVaultTokenAccount(usdcMint, vaultAuthorityPda);
            const developerTokenAccount = this.getAssociatedTokenAccount(usdcMint, developerPublicKey);

            const tx = await program.methods.verifyMilestone(milestoneIndex)
                .accounts({
                    project: projectPda,
                    developerTokenAccount,
                    vaultTokenAccount,
                    vaultAuthority: vaultAuthorityPda,
                    verifier: wallet.publicKey,
                    usdcMint,
                    tokenProgram: TOKEN_PROGRAM_ID,
                })
                .rpc();

            return {
                success: true,
                hash: tx,
                projectPda: projectPda.toBase58(),
                milestoneIndex
            };
        } catch (error) {
            console.error('Solana verifyMilestone error:', error);
            throw error;
        }
    }

    /**
     * Claim a reward as a backer
     */
    async claimReward(
        connection: Connection,
        wallet: any,
        projectPda: PublicKey,
        backingIndex: number
    ) {
        console.log('Solana: claimReward', { projectPda: projectPda.toBase58(), backingIndex });
        const program = this.getProgram(connection, wallet);
        
        try {
            const usdcMint = this.getUsdcMint();
            const vaultAuthorityPda = this.getVaultAuthorityPda(projectPda);
            const vaultTokenAccount = this.getVaultTokenAccount(usdcMint, vaultAuthorityPda);
            const backerTokenAccount = this.getAssociatedTokenAccount(usdcMint, wallet.publicKey);

            const tx = await program.methods.claimReward(backingIndex)
                .accounts({
                    project: projectPda,
                    backer: wallet.publicKey,
                    backerTokenAccount,
                    vaultTokenAccount,
                    vaultAuthority: vaultAuthorityPda,
                    usdcMint,
                    tokenProgram: TOKEN_PROGRAM_ID,
                })
                .rpc();

            return {
                success: true,
                hash: tx,
                projectPda: projectPda.toBase58(),
                backingIndex
            };
        } catch (error) {
            console.error('Solana claimReward error:', error);
            throw error;
        }
    }

    /**
     * Repay a loan on Solana — sends USDC to the protocol treasury (not the project vault).
     * Requires projectPda so the on-chain program can identify the credit line.
     */
    async repayLoan(
        connection: Connection,
        wallet: any,
        amount: string | number,
        projectPda: PublicKey,
        developerTokenAccount?: PublicKey
    ) {
        console.log('Solana: repayLoan', amount);
        const publicKey = wallet.publicKey;
        const program = this.getProgram(connection, wallet);

        try {
            const usdcMint = this.getUsdcMint();
            const creditLinePda = this.getCreditLinePda(publicKey);
            const treasuryAuthorityPda = this.getTreasuryAuthorityPda();
            const treasuryTokenAccount = this.getTreasuryTokenAccount(usdcMint);

            const resolvedDeveloperTokenAccount = developerTokenAccount || this.getAssociatedTokenAccount(usdcMint, publicKey);

            const tx = await program.methods.repayLoan(
                new BN(amount)
            ).accounts({
                creditLine: creditLinePda,
                developer: publicKey,
                developerTokenAccount: resolvedDeveloperTokenAccount,
                treasuryTokenAccount,
                treasuryAuthority: treasuryAuthorityPda,
                project: projectPda,
                usdcMint,
                tokenProgram: TOKEN_PROGRAM_ID,
            }).rpc();

            return {
                success: true,
                hash: tx,
                creditLinePda: creditLinePda.toBase58(),
                amount
            };
        } catch (error) {
            console.error('Solana repayLoan error:', error);
            throw error;
        }
    }

    // ── Read helpers ─────────────────────────────────────────────────

    /**
     * Get project backing data for a Solana project
     */
    async getProjectBackingData(connection: Connection, projectId: string | number): Promise<ProjectBackingData> {
        try {
            let projectPubkey: PublicKey;
            try {
                projectPubkey = new PublicKey(projectId.toString());
            } catch {
                return { totalBacking: '0', backerCount: 0, maxMultiplier: this.calculateMaxMultiplier(0), creditScore: 0 };
            }

            const program = this.getReadOnlyProgram(connection);

            const projectAccount = await (program.account as any).project.fetch(projectPubkey);
            const developerPublicKey = projectAccount.developer as PublicKey;
            const creditLine = await this.getDeveloperCreditLine(connection, developerPublicKey);
            const creditScore = creditLine?.reputation ? Number(creditLine.reputation) : 0;

            return {
                totalBacking: projectAccount.totalBacking.toString(),
                backerCount: projectAccount.backings.length,
                maxMultiplier: this.calculateMaxMultiplier(creditScore),
                creditScore
            };
        } catch (error) {
            console.error('Error fetching Solana project backing data:', error);
            return { totalBacking: '0', backerCount: 0, maxMultiplier: this.calculateMaxMultiplier(0), creditScore: 0 };
        }
    }

    /**
     * Get details for a Solana project
     */
    async getProjectDetails(connection: Connection, projectId: string | number): Promise<ProjectDetails | null> {
        try {
            let projectPubkey: PublicKey;
            try {
                projectPubkey = new PublicKey(projectId.toString());
            } catch {
                return null;
            }

            const program = this.getReadOnlyProgram(connection);

            const projectAccount = await (program.account as any).project.fetch(projectPubkey);
            const developerPublicKey = projectAccount.developer as PublicKey;
            const creditLine = await this.getDeveloperCreditLine(connection, developerPublicKey);
            const creditScore = creditLine?.reputation ? Number(creditLine.reputation) : 0;

            return {
                isActive: projectAccount.isActive,
                creditScore,
                fundingAmount: projectAccount.fundingAmount.toString(),
                milestonesCompleted: projectAccount.milestonesCompleted,
                milestonesCount: projectAccount.milestonesCount,
                builderSnsDomain: projectAccount.builderSnsDomain || undefined,
                builderSnsNameAccount: projectAccount.builderSnsNameAccount
                    ? projectAccount.builderSnsNameAccount.toBase58()
                    : undefined,
            };
        } catch (error) {
            console.error('Error fetching Solana project details:', error);
            return null;
        }
    }

    async getDeveloperCreditLine(connection: Connection, developer: PublicKey) {
        try {
            const program = this.getReadOnlyProgram(connection);
            const creditLinePda = this.getCreditLinePda(developer);
            return await (program.account as any).creditLine.fetch(creditLinePda);
        } catch {
            return null;
        }
    }

    calculateMaxMultiplier(creditScore: number): number {
        if (creditScore >= 800) return 150;
        if (creditScore >= 700) return 200;
        if (creditScore >= 600) return 250;
        return 300;
    }
}

export const solanaCreditService = new SolanaCreditService();
export default solanaCreditService;
