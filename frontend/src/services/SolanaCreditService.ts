import { Connection, PublicKey, SystemProgram, Keypair, Ed25519Program, SYSVAR_INSTRUCTIONS_PUBKEY } from '@solana/web3.js';
import * as anchor from '@coral-xyz/anchor';
import { Program, BN } from '@coral-xyz/anchor';
import { SOLANA_MAINNET_USDC, SOLANA_DEVNET_USDC } from '../config/tokens';
import IDL from '../idl/blockchain_solana.json';
import { TOKEN_PROGRAM_ID, getAssociatedTokenAddressSync, ASSOCIATED_TOKEN_PROGRAM_ID } from '@solana/spl-token';
import { BagsSDK } from '@bagsfm/bags-sdk';
import { getDomainKeySync } from '@bonfida/spl-name-service';
import { snsService } from './SnsService';
import { getSolanaConnection } from '../lib/chains/solanaConnection';
import type { ProjectData, ProjectBackingData, ProjectDetails } from '../lib/chains/types';

/**
 * Solana Credit Service
 * Handles Solana-specific credit operations.
 *
 * VULTURE ARCHITECTURE (Post-Fix):
 * Each project has TWO separate vault ATAs to prevent insolvency:
 *   1. milestone_vault       — holds milestone funding, paid out via verify_milestone
 *   2. backer_escrow_vault   — holds backer stakes, paid out via claim_reward
 * The protocol treasury funds multiplier premiums into the backer escrow vault.
 *
 * Account names matching the on-chain IDL:
 *   request_funding:    project, creditLine, milestoneVaultAuthority, milestoneVault,
 *                       backerVaultAuthority, backerEscrowVault, usdcMint,
 *                       developer, snsNameAccount, instructionsSysvar,
 *                       systemProgram, tokenProgram, associatedTokenProgram
 *   back_project:       project, developerCreditLine, backer, backerTokenAccount,
 *                       backerEscrowVault, backerVaultAuthority, usdcMint, tokenProgram
 *   verify_milestone:   project, developerTokenAccount, milestoneVault,
 *                       milestoneVaultAuthority, verifier, usdcMint, tokenProgram
 *   claim_reward:       project, backer, backerTokenAccount, backerEscrowVault,
 *                       backerVaultAuthority, usdcMint, tokenProgram
 *   repay_loan:         creditLine, developer, developerTokenAccount,
 *                       treasuryTokenAccount, treasuryAuthority, project,
 *                       usdcMint, tokenProgram
 *   initialize_treasury: treasuryAuthority, usdcMint, treasuryTokenAccount,
 *                        authority, systemProgram, tokenProgram, associatedTokenProgram
 */

class SolanaCreditService {
    private PROGRAM_ID = new PublicKey(
        process.env.NEXT_PUBLIC_SOLANA_PROGRAM_ID || (IDL as any).address
    );

    private bagsClient: BagsSDK | null = null;

    constructor() {
        const apiKey = process.env.NEXT_PUBLIC_BAGS_API_KEY;
        if (apiKey) {
            this.bagsClient = new BagsSDK(
                apiKey,
                getSolanaConnection(),
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

    public deriveProjectPda(developer: PublicKey, projectName: string): PublicKey {
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

    private getMilestoneVaultAuthorityPda(projectPda: PublicKey): PublicKey {
        const [pda] = PublicKey.findProgramAddressSync(
            [Buffer.from("milestone_vault_authority"), projectPda.toBuffer()],
            this.PROGRAM_ID,
        );
        return pda;
    }

    private getBackerVaultAuthorityPda(projectPda: PublicKey): PublicKey {
        const [pda] = PublicKey.findProgramAddressSync(
            [Buffer.from("backer_vault_authority"), projectPda.toBuffer()],
            this.PROGRAM_ID,
        );
        return pda;
    }

    private getTreasuryAuthorityPda(): PublicKey {
        const [pda] = PublicKey.findProgramAddressSync(
            [Buffer.from("treasury")],
            this.PROGRAM_ID,
        );
        return pda;
    }

    private getVaultTokenAccount(usdcMint: PublicKey, vaultAuthority: PublicKey): PublicKey {
        return getAssociatedTokenAddressSync(usdcMint, vaultAuthority, true);
    }

    private getTreasuryTokenAccount(usdcMint: PublicKey): PublicKey {
        const treasuryAuthority = this.getTreasuryAuthorityPda();
        return getAssociatedTokenAddressSync(usdcMint, treasuryAuthority, true);
    }

    private getAssociatedTokenAccount(usdcMint: PublicKey, owner: PublicKey): PublicKey {
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
            `pledgebond:sns-identity:v1:${developer.toBase58()}:${snsNameAccount.toBase58()}:${builderSnsDomain}:${projectName}:${githubUrl}`
        );
    }

    // ── Instructions ─────────────────────────────────────────────────

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

    async getClaimableFees(walletPublicKey: PublicKey) {
        if (!this.bagsClient) return [];
        return await (this.bagsClient as any).fee.getAllClaimablePositions(walletPublicKey.toBase58());
    }

    async claimFees(wallet: any, positions: any[]) {
        if (!this.bagsClient) throw new Error("Bags SDK not initialized");
        const tx = await (this.bagsClient as any).fee.getClaimTransactions({
            wallet: wallet.publicKey.toBase58(),
            positions: positions.map(p => p.id),
        });
        const signed = await wallet.signAllTransactions(tx);
        return signed;
    }

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
            const projectPda = this.deriveProjectPda(publicKey, projectData.projectName);
            const creditLinePda = this.getCreditLinePda(publicKey);
            const milestoneVaultAuthority = this.getMilestoneVaultAuthorityPda(projectPda);
            const backerVaultAuthority = this.getBackerVaultAuthorityPda(projectPda);
            const usdcMint = this.getUsdcMint();
            const milestoneVault = this.getVaultTokenAccount(usdcMint, milestoneVaultAuthority);
            const backerEscrowVault = this.getVaultTokenAccount(usdcMint, backerVaultAuthority);

            // Prevent self-verification: the verifier must not be the developer.
            // The on-chain program accepts any signer as verifier, so this guard
            // is enforced client-side. A self-verifier could mark their own
            // milestones as complete without independent review.
            const verifier = new PublicKey(projectData.verifier || publicKey.toBase58());
            if (verifier.equals(publicKey)) {
                throw new Error(
                    'Self-verification is not allowed. Specify a different verifier address for milestone review.'
                );
            }
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
                milestoneVaultAuthority,
                milestoneVault,
                backerVaultAuthority,
                backerEscrowVault,
                usdcMint,
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

            const projectAccount = await (program.account as any).project.fetch(projectPda);
            const developerPublicKey = projectAccount.developer as PublicKey;

            const creditLinePda = this.getCreditLinePda(developerPublicKey);
            const backerVaultAuthority = this.getBackerVaultAuthorityPda(projectPda);
            const backerEscrowVault = this.getVaultTokenAccount(usdcMint, backerVaultAuthority);

            const resolvedBackerTokenAccount = backerTokenAccount || this.getAssociatedTokenAccount(usdcMint, wallet.publicKey);

            const tx = await program.methods.backProject(
                new BN(multiplier),
                new BN(amount)
            ).accounts({
                project: projectPda,
                developerCreditLine: creditLinePda,
                backer: wallet.publicKey,
                backerTokenAccount: resolvedBackerTokenAccount,
                backerEscrowVault,
                backerVaultAuthority,
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

            const milestoneVaultAuthority = this.getMilestoneVaultAuthorityPda(projectPda);
            const milestoneVault = this.getVaultTokenAccount(usdcMint, milestoneVaultAuthority);
            const developerTokenAccount = this.getAssociatedTokenAccount(usdcMint, developerPublicKey);

            const tx = await program.methods.verifyMilestone(milestoneIndex)
                .accounts({
                    project: projectPda,
                    developerTokenAccount,
                    milestoneVault,
                    milestoneVaultAuthority,
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
            const backerVaultAuthority = this.getBackerVaultAuthorityPda(projectPda);
            const backerEscrowVault = this.getVaultTokenAccount(usdcMint, backerVaultAuthority);
            const backerTokenAccount = this.getAssociatedTokenAccount(usdcMint, wallet.publicKey);

            const tx = await program.methods.claimReward(backingIndex)
                .accounts({
                    project: projectPda,
                    backer: wallet.publicKey,
                    backerTokenAccount,
                    backerEscrowVault,
                    backerVaultAuthority,
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
