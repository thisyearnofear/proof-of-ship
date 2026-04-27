import { Connection, PublicKey, SystemProgram, Keypair } from '@solana/web3.js';
import * as anchor from '@coral-xyz/anchor';
import { Program, BN } from '@coral-xyz/anchor';
import { SOLANA_MAINNET_USDC, SOLANA_DEVNET_USDC } from '../config/tokens';
import IDL from '../idl/blockchain_solana.json';
import { TOKEN_PROGRAM_ID } from '@solana/spl-token';

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

    private getConfigPda(): PublicKey {
        const [configPda] = PublicKey.findProgramAddressSync([Buffer.from('config')], this.PROGRAM_ID);
        return configPda;
    }

    private getProgram(connection: Connection, anchorWallet: any) {
        if (!anchorWallet) {
            throw new Error("Wallet not connected or not provided");
        }
        const provider = new anchor.AnchorProvider(connection, anchorWallet, {
            preflightCommitment: 'processed',
        });
        // Anchor >=0.30 expects idl.address (and constructor signature is Program(idl, provider)).
        const idlWithAddress = { ...(IDL as any), address: this.PROGRAM_ID.toBase58() };
        return new Program(idlWithAddress as any, provider);
    }

    private getReadOnlyProgram(connection: Connection) {
        // AnchorProvider requires a wallet interface, but read-only fetches don't need signing.
        const dummyKeypair = Keypair.generate();
        const dummyWallet = {
            publicKey: dummyKeypair.publicKey,
            signTransaction: async (tx: any) => tx,
            signAllTransactions: async (txs: any[]) => txs,
        };
        const provider = new anchor.AnchorProvider(connection, dummyWallet as any, {
            preflightCommitment: 'processed',
        });
        const idlWithAddress = { ...(IDL as any), address: this.PROGRAM_ID.toBase58() };
        return new Program(idlWithAddress as any, provider);
    }

    private async assertConfigInitialized(connection: Connection) {
        const program = this.getReadOnlyProgram(connection);
        try {
            await program.account.config.fetch(this.getConfigPda());
        } catch (e) {
            throw new Error(
                'Solana program is missing on-chain Config. After deploying, call solanaCreditService.initializeConfig() once to set the USDC mint.'
            );
        }
    }

    /**
     * One-time init after deploy: sets the USDC mint in the on-chain config PDA.
     */
    async initializeConfig(connection: Connection, anchorWallet: any) {
        const program = this.getProgram(connection, anchorWallet);
        const usdcMint = this.getUsdcMint();
        const config = this.getConfigPda();

        const tx = await program.methods.initializeConfig(usdcMint).accounts({
            config,
            authority: anchorWallet.publicKey,
            systemProgram: SystemProgram.programId,
        }).rpc();

        return { success: true, hash: tx, config: config.toBase58(), usdcMint: usdcMint.toBase58() };
    }

    /**
     * Request funding for a project on Solana
     */
    async requestFunding(connection: Connection, anchorWallet: any, projectData: ProjectData) {
        console.log('Solana: requestFunding', projectData);
        const publicKey = anchorWallet.publicKey;
        const program = this.getProgram(connection, anchorWallet);
        
        try {
            await this.assertConfigInitialized(connection);
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

            const payoutVault = anchor.utils.token.associatedAddress({
                mint: usdcMint,
                owner: vaultAuthorityPda,
            });

            const [treasuryAuthorityPda] = PublicKey.findProgramAddressSync(
                [Buffer.from('treasury_authority'), publicKey.toBuffer()],
                this.PROGRAM_ID
            );

            const treasuryVault = anchor.utils.token.associatedAddress({
                mint: usdcMint,
                owner: treasuryAuthorityPda,
            });

            const tx = await program.methods.requestFunding(
                projectData.hackathonIds.map(id => new BN(id)),
                projectData.githubUrl,
                projectData.projectName,
                projectData.milestoneDescriptions,
                projectData.milestoneAmounts.map(amt => new BN(amt)),
                verifier
            ).accounts({
                config,
                project: projectPda,
                creditLine: creditLinePda,
                usdcMint,
                vaultAuthority: vaultAuthorityPda,
                payoutVault,
                treasuryAuthority: treasuryAuthorityPda,
                treasuryVault,
                developer: publicKey,
                systemProgram: SystemProgram.programId,
                tokenProgram: TOKEN_PROGRAM_ID,
                associatedTokenProgram: anchor.utils.token.ASSOCIATED_PROGRAM_ID,
                rent: anchor.web3.SYSVAR_RENT_PUBKEY,
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
        anchorWallet: any,
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

            const resolvedBackerTokenAccount = backerTokenAccount || anchor.utils.token.associatedAddress({
                mint: usdcMint,
                owner: anchorWallet.publicKey
            });

            const payoutVault = anchor.utils.token.associatedAddress({
                mint: usdcMint,
                owner: vaultAuthorityPda
            });

            const tx = await program.methods.backProject(
                new BN(multiplier),
                new BN(amount)
            ).accounts({
                config,
                project: projectPda,
                developerCreditLine: devCreditLinePda,
                backer: anchorWallet.publicKey,
                backerTokenAccount: resolvedBackerTokenAccount,
                usdcMint,
                payoutVault,
                vaultAuthority: vaultAuthorityPda,
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
     * Repay a loan on Solana
     */
    async repayLoan(
        connection: Connection, 
        anchorWallet: any, 
        amount: string | number,
        developerTokenAccount?: PublicKey
    ) {
        console.log('Solana: repayLoan', amount);
        const publicKey = anchorWallet.publicKey;
        const program = this.getProgram(connection, anchorWallet);
        
        try {
            await this.assertConfigInitialized(connection);
            const usdcMint = this.getUsdcMint();
            const config = this.getConfigPda();

            // Derive Credit Line PDA
            const [creditLinePda] = PublicKey.findProgramAddressSync(
                [
                    Buffer.from("credit_line"),
                    publicKey.toBuffer()
                ],
                this.PROGRAM_ID
            );

            const [treasuryAuthorityPda] = PublicKey.findProgramAddressSync(
                [Buffer.from('treasury_authority'), publicKey.toBuffer()],
                this.PROGRAM_ID
            );

            const treasuryVault = anchor.utils.token.associatedAddress({
                mint: usdcMint,
                owner: treasuryAuthorityPda
            });

            const resolvedDeveloperTokenAccount = developerTokenAccount || anchor.utils.token.associatedAddress({
                mint: usdcMint,
                owner: publicKey
            });

            const tx = await program.methods.repayLoan(
                new BN(amount)
            ).accounts({
                config,
                creditLine: creditLinePda,
                developer: publicKey,
                usdcMint,
                developerTokenAccount: resolvedDeveloperTokenAccount,
                treasuryAuthority: treasuryAuthorityPda,
                treasuryVault,
                tokenProgram: TOKEN_PROGRAM_ID,
                systemProgram: SystemProgram.programId,
                associatedTokenProgram: anchor.utils.token.ASSOCIATED_PROGRAM_ID,
                rent: anchor.web3.SYSVAR_RENT_PUBKEY,
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
        anchorWallet: any, 
        projectPda: PublicKey,
        milestoneIndex: number
    ) {
        console.log('Solana: verifyMilestone', { projectPda: projectPda.toBase58(), milestoneIndex });
        const program = this.getProgram(connection, anchorWallet);

        try {
            await this.assertConfigInitialized(connection);
            const usdcMint = this.getUsdcMint();
            const config = this.getConfigPda();

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

            const payoutVault = anchor.utils.token.associatedAddress({
                mint: usdcMint,
                owner: vaultAuthorityPda
            });

            const developerTokenAccount = anchor.utils.token.associatedAddress({
                mint: usdcMint,
                owner: developerPublicKey
            });

            const tx = await program.methods.verifyMilestone(milestoneIndex)
                .accounts({
                    config,
                    project: projectPda,
                    developerTokenAccount: developerTokenAccount,
                    usdcMint,
                    payoutVault,
                    vaultAuthority: vaultAuthorityPda,
                    verifier: anchorWallet.publicKey,
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
        anchorWallet: any,
        projectPda: PublicKey,
        backingIndex: number
    ) {
        console.log('Solana: claimReward', { projectPda: projectPda.toBase58(), backingIndex });
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

            const payoutVault = anchor.utils.token.associatedAddress({
                mint: usdcMint,
                owner: vaultAuthorityPda
            });

            const backerTokenAccount = anchor.utils.token.associatedAddress({
                mint: usdcMint,
                owner: anchorWallet.publicKey
            });

            const tx = await program.methods.claimReward(backingIndex)
                .accounts({
                    config,
                    project: projectPda,
                    backer: anchorWallet.publicKey,
                    backerTokenAccount: backerTokenAccount,
                    usdcMint,
                    payoutVault,
                    vaultAuthority: vaultAuthorityPda,
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
     * Get project backing data for a Solana project
     */
    async getProjectBackingData(connection: Connection, projectId: string | number): Promise<ProjectBackingData> {
        try {
            let projectPubkey: PublicKey;
            try {
                projectPubkey = new PublicKey(projectId.toString());
            } catch {
                return { totalBacking: '0', backerCount: 0, maxMultiplier: 300, creditScore: 400 };
            }

            const program = this.getReadOnlyProgram(connection);
            
            const projectAccount = await program.account.project.fetch(projectPubkey) as any;
            const creditLine = await this.getDeveloperCreditLine(connection, new PublicKey(projectAccount.developer));
            const creditScore = creditLine?.reputation ? Number(creditLine.reputation) : 400;
            
            return {
                totalBacking: projectAccount.totalBacking.toString(),
                backerCount: projectAccount.backings.length,
                maxMultiplier: this.calculateMaxMultiplier(creditScore),
                creditScore
            };
        } catch (error) {
            console.error('Error fetching Solana project backing data:', error);
            return { totalBacking: '0', backerCount: 0, maxMultiplier: 300, creditScore: 400 };
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
            const creditScore = creditLine?.reputation ? Number(creditLine.reputation) : 400;
            
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
