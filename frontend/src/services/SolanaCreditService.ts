import { Connection, PublicKey, SystemProgram, Keypair } from '@solana/web3.js';
import * as anchor from '@coral-xyz/anchor';
import { Program, BN } from '@coral-xyz/anchor';
import { SOLANA_MAINNET_USDC, SOLANA_DEVNET_USDC } from '../config/tokens';
import IDL from '../idl/blockchain_solana.json';
import { TOKEN_PROGRAM_ID, getAssociatedTokenAddressSync, ASSOCIATED_TOKEN_PROGRAM_ID } from '@solana/spl-token';

/**
 * Solana Credit Service
 * Handles Solana-specific credit operations (Phase 8: Full AI Integration)
 *
 * Account names match the on-chain IDL exactly:
 *   request_funding: project, creditLine, vaultAuthority, usdcMint, vaultTokenAccount, developer, systemProgram, tokenProgram, associatedTokenProgram
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
}

class SolanaCreditService {
    // Program id is injected via env in production. Fallback is the scaffold default.
    private PROGRAM_ID = new PublicKey(
        process.env.NEXT_PUBLIC_SOLANA_PROGRAM_ID || 'Fg6PaFpoGXkYsidMpWTK6W2BeZ7FEfcYkg476zPFsLnS'
    );

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
        return new Program(IDL as anchor.Idl, provider);
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
        return new Program(IDL as anchor.Idl, provider);
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

            // Derive PDAs
            const projectPda = this.getProjectPda(publicKey, projectData.projectName);
            const creditLinePda = this.getCreditLinePda(publicKey);
            const vaultAuthorityPda = this.getVaultAuthorityPda(projectPda);
            const usdcMint = this.getUsdcMint();
            const vaultTokenAccount = this.getVaultTokenAccount(usdcMint, vaultAuthorityPda);

            const verifier = new PublicKey(projectData.verifier || publicKey.toBase58());

            const tx = await program.methods.requestFunding(
                projectData.hackathonIds.map(id => new BN(id)),
                projectData.githubUrl,
                projectData.projectName,
                projectData.milestoneDescriptions,
                projectData.milestoneAmounts.map(amt => new BN(amt)),
                verifier
            ).accounts({
                project: projectPda,
                creditLine: creditLinePda,
                vaultAuthority: vaultAuthorityPda,
                usdcMint,
                vaultTokenAccount,
                developer: publicKey,
                systemProgram: SystemProgram.programId,
                tokenProgram: TOKEN_PROGRAM_ID,
                associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
            }).rpc();

            return {
                success: true,
                hash: tx,
                projectPda: projectPda.toBase58(),
                projectData
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
                milestonesCount: projectAccount.milestonesCount
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
