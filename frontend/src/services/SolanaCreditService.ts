import { Connection, PublicKey, SystemProgram, Keypair } from '@solana/web3.js';
import * as anchor from '@coral-xyz/anchor';
import { Program, BN } from '@coral-xyz/anchor';
import { SOLANA_MAINNET_USDC, SOLANA_DEVNET_USDC } from '../config/tokens';
import IDL from '../idl/blockchain_solana.json';
import { TOKEN_PROGRAM_ID, getAssociatedTokenAddressSync } from '@solana/spl-token';

/**
 * Solana Credit Service
 * Handles Solana-specific credit operations (Phase 8: Full AI Integration)
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

    private getProgram(connection: Connection, anchorWallet: anchor.Wallet) {
        if (!anchorWallet) {
            throw new Error("Wallet not connected or not provided");
        }
        const provider = new anchor.AnchorProvider(connection, anchorWallet, {
            preflightCommitment: 'processed',
        });
        return new Program(IDL, provider);
    }

    private getReadOnlyProgram(connection: Connection) {
        // AnchorProvider requires a wallet interface, but read-only fetches don't need signing.
        const dummyKeypair = Keypair.generate();
        const dummyWallet: anchor.Wallet = {
            publicKey: dummyKeypair.publicKey,
            signTransaction: async (tx) => tx,
            signAllTransactions: async (txs) => txs,
        };
        const provider = new anchor.AnchorProvider(connection, dummyWallet, {
            preflightCommitment: 'processed',
        });
        return new Program(IDL, provider);
    }

    /**
     * Initialize treasury (one-time setup to create protocol treasury ATA)
     */
    async initializeTreasury(connection: Connection, anchorWallet: any) {
        const program = this.getProgram(connection, anchorWallet);
        const usdcMint = this.getUsdcMint();

        const [treasuryAuthorityPda] = PublicKey.findProgramAddressSync(
            [Buffer.from('treasury')],
            this.PROGRAM_ID
        );

        const treasuryTokenAccount = getAssociatedTokenAddressSync(
            usdcMint,
            treasuryAuthorityPda,
            true
        );

        const tx = await program.methods.initializeTreasury().accounts({
            treasury_authority: treasuryAuthorityPda,
            usdc_mint: usdcMint,
            treasury_token_account: treasuryTokenAccount,
            authority: anchorWallet.publicKey,
            systemProgram: SystemProgram.programId,
            tokenProgram: TOKEN_PROGRAM_ID,
            associatedTokenProgram: anchor.utils.token.ASSOCIATED_PROGRAM_ID,
        }).rpc();

        return { success: true, hash: tx, treasuryAuthority: treasuryAuthorityPda.toBase58(), usdcMint: usdcMint.toBase58() };
    }

    /**
     * Request funding for a project on Solana
     */
    async requestFunding(connection: Connection, anchorWallet: anchor.Wallet, projectData: ProjectData) {
        console.log('Solana: requestFunding', projectData);
        const publicKey = anchorWallet.publicKey;
        const program = this.getProgram(connection, anchorWallet);
        
        try {
            if (Buffer.from(projectData.projectName).length > 32) {
                throw new Error('Solana projectName must be <= 32 bytes (PDA seed limit). Shorten the name.');
            }
            // Derive Project PDA
            const [projectPda] = PublicKey.findProgramAddressSync(
                [
                    Buffer.from("project"),
                    publicKey.toBuffer(),
                    Buffer.from(projectData.projectName) // must be <= 32 bytes (enforced on-chain)
                ],
                this.PROGRAM_ID
            );

            // Derive Credit Line PDA
            const [creditLinePda] = PublicKey.findProgramAddressSync(
                [
                    Buffer.from("credit_line"),
                    publicKey.toBuffer()
                ],
                this.PROGRAM_ID
            );

            const verifier = new PublicKey(projectData.verifier || publicKey.toBase58());
            const usdcMint = this.getUsdcMint();
            const config = this.getConfigPda();

            const [vaultAuthorityPda] = PublicKey.findProgramAddressSync(
                [Buffer.from('vault_authority'), projectPda.toBuffer()],
                this.PROGRAM_ID
            );

            const vaultTokenAccount = getAssociatedTokenAddressSync(
                usdcMint,
                vaultAuthorityPda,
                true
            );

            const [treasuryAuthorityPda] = PublicKey.findProgramAddressSync(
                [Buffer.from('treasury')],
                this.PROGRAM_ID
            );

            const treasuryTokenAccount = getAssociatedTokenAddressSync(
                usdcMint,
                treasuryAuthorityPda,
                true
            );

            const tx = await program.methods.requestFunding(
                projectData.hackathonIds.map(id => new BN(id)),
                projectData.githubUrl,
                projectData.projectName,
                projectData.milestoneDescriptions,
                projectData.milestoneAmounts.map(amt => new BN(amt)),
                verifier
            ).accounts({
                project: projectPda,
                credit_line: creditLinePda,
                vault_authority: vaultAuthorityPda,
                vault_token_account: vaultTokenAccount,
                treasury_authority: treasuryAuthorityPda,
                treasury_token_account: treasuryTokenAccount,
                developer: publicKey,
                usdc_mint: usdcMint,
                system_program: SystemProgram.programId,
                token_program: TOKEN_PROGRAM_ID,
                associated_token_program: anchor.utils.token.ASSOCIATED_PROGRAM_ID,
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
        anchorWallet: anchor.Wallet,
        projectPda: PublicKey,
        amount: string | number,
        multiplier: number,
        backerTokenAccount?: PublicKey
    ) {
        console.log('Solana: backProject', { projectPda: projectPda.toBase58(), amount });
        const program = this.getProgram(connection, anchorWallet);

        try {
            await this.assertConfigInitialized(connection);
            const usdcMint = this.getUsdcMint();
            const config = this.getConfigPda();

            // Derive Vault Authority PDA
            const [vaultAuthorityPda] = PublicKey.findProgramAddressSync(
                [
                    Buffer.from("vault_authority"),
                    projectPda.toBuffer()
                ],
                this.PROGRAM_ID
            );

            // Actually, we need the developer's public key to derive their credit line
            // Let's fetch the project account first to get the developer's key
            const projectAccount = await program.account.project.fetch(projectPda) as any;
            const developerPublicKey = projectAccount.developer;

            const [devCreditLinePda] = PublicKey.findProgramAddressSync(
                [
                    Buffer.from("credit_line"),
                    developerPublicKey.toBuffer()
                ],
                this.PROGRAM_ID
            );

            const resolvedBackerTokenAccount = backerTokenAccount || getAssociatedTokenAddressSync(
                usdcMint,
                anchorWallet.publicKey,
                false
            );

            const vaultTokenAccount = getAssociatedTokenAddressSync(
                usdcMint,
                vaultAuthorityPda,
                true
            );

            const tx = await program.methods.backProject(
                new BN(multiplier),
                new BN(amount)
            ).accounts({
                project: projectPda,
                developer_credit_line: devCreditLinePda,
                backer: anchorWallet.publicKey,
                backer_token_account: resolvedBackerTokenAccount,
                vault_token_account: vaultTokenAccount,
                vault_authority: vaultAuthorityPda,
                usdc_mint: usdcMint,
                token_program: TOKEN_PROGRAM_ID,
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
     * Repay a loan on Solana
     */
    async repayLoan(
        connection: Connection, 
        anchorWallet: anchor.Wallet, 
        projectPda: PublicKey,
        amount: string | number,
        developerTokenAccount?: PublicKey
    ) {
        console.log('Solana: repayLoan', amount);
        const publicKey = anchorWallet.publicKey;
        const program = this.getProgram(connection, anchorWallet);
        
        try {
            const usdcMint = this.getUsdcMint();

            // Derive Credit Line PDA (per developer)
            const [creditLinePda] = PublicKey.findProgramAddressSync(
                [Buffer.from("credit_line"), publicKey.toBuffer()],
                this.PROGRAM_ID
            );

            // Derive Vault Authority PDA (per project)
            const [vaultAuthorityPda] = PublicKey.findProgramAddressSync(
                [Buffer.from("vault_authority"), projectPda.toBuffer()],
                this.PROGRAM_ID
            );

            // Derive Treasury Authority PDA (global)
            const [treasuryAuthorityPda] = PublicKey.findProgramAddressSync(
                [Buffer.from('treasury')],
                this.PROGRAM_ID
            );

            const treasuryTokenAccount = getAssociatedTokenAddressSync(
                usdcMint,
                treasuryAuthorityPda,
                true
            );

            const resolvedDeveloperTokenAccount = developerTokenAccount || getAssociatedTokenAddressSync(
                usdcMint,
                publicKey,
                false
            );

            const tx = await program.methods.repayLoan(
                new BN(amount)
            ).accounts({
                credit_line: creditLinePda,
                developer: publicKey,
                developer_token_account: resolvedDeveloperTokenAccount,
                treasury_token_account: treasuryTokenAccount,
                treasury_authority: treasuryAuthorityPda,
                project: projectPda,
                usdc_mint: usdcMint,
                token_program: TOKEN_PROGRAM_ID,
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

    /**
     * Verify a milestone and trigger payout
     */
    async verifyMilestone(
        connection: Connection, 
        anchorWallet: anchor.Wallet, 
        projectPda: PublicKey,
        milestoneIndex: number
    ) {
        console.log('Solana: verifyMilestone', { projectPda: projectPda.toBase58(), milestoneIndex });
        const program = this.getProgram(connection, anchorWallet);

        try {
            const usdcMint = this.getUsdcMint();

            const projectAccount = await program.account.project.fetch(projectPda) as any;
            const developerPublicKey = new PublicKey(projectAccount.developer);

            // Derive Vault Authority PDA
            const [vaultAuthorityPda] = PublicKey.findProgramAddressSync(
                [
                    Buffer.from("vault_authority"),
                    projectPda.toBuffer()
                ],
                this.PROGRAM_ID
            );

            const vaultTokenAccount = getAssociatedTokenAddressSync(
                usdcMint,
                vaultAuthorityPda,
                true
            );

            const developerTokenAccount = getAssociatedTokenAddressSync(
                usdcMint,
                developerPublicKey,
                false
            );

            const tx = await program.methods.verifyMilestone(milestoneIndex)
                .accounts({
                    project: projectPda,
                    developer_token_account: developerTokenAccount,
                    vault_token_account: vaultTokenAccount,
                    vault_authority: vaultAuthorityPda,
                    verifier: anchorWallet.publicKey,
                    usdc_mint: usdcMint,
                    token_program: TOKEN_PROGRAM_ID,
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
        anchorWallet: anchor.Wallet,
        projectPda: PublicKey,
        backingIndex: number
    ) {
        console.log('Solana: claimReward', { projectPda: projectPda.toBase58(), backingIndex });
        const program = this.getProgram(connection, anchorWallet);

        try {
            const usdcMint = this.getUsdcMint();

            // Derive Vault Authority PDA
            const [vaultAuthorityPda] = PublicKey.findProgramAddressSync(
                [
                    Buffer.from("vault_authority"),
                    projectPda.toBuffer()
                ],
                this.PROGRAM_ID
            );

            const vaultTokenAccount = getAssociatedTokenAddressSync(
                usdcMint,
                vaultAuthorityPda,
                true
            );

            const backerTokenAccount = getAssociatedTokenAddressSync(
                usdcMint,
                anchorWallet.publicKey,
                false
            );

            const tx = await program.methods.claimReward(backingIndex)
                .accounts({
                    project: projectPda,
                    backer: anchorWallet.publicKey,
                    backer_token_account: backerTokenAccount,
                    vault_token_account: vaultTokenAccount,
                    vault_authority: vaultAuthorityPda,
                    usdc_mint: usdcMint,
                    token_program: TOKEN_PROGRAM_ID,
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
            
            const projectAccount = await program.account.project.fetch(projectPubkey) as any;
            const creditLine = await this.getDeveloperCreditLine(connection, new PublicKey(projectAccount.developer));
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
            
            const projectAccount = await program.account.project.fetch(projectPubkey) as any;
            const creditLine = await this.getDeveloperCreditLine(connection, new PublicKey(projectAccount.developer));
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
            const [creditLinePda] = PublicKey.findProgramAddressSync(
                [Buffer.from('credit_line'), developer.toBuffer()],
                this.PROGRAM_ID
            );
            return await program.account.creditLine.fetch(creditLinePda) as any;
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
