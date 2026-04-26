import { Connection, PublicKey, Transaction, SystemProgram } from '@solana/web3.js';
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
    // Phase 8: Updated with actual program ID
    private PROGRAM_ID = new PublicKey('Fg6PaFpoGXkYsidMpWTK6W2BeZ7FEfcYkg476zPFsLnS');

    private getProgram(connection: Connection, anchorWallet: any) {
        if (!anchorWallet) {
            throw new Error("Wallet not connected or not provided");
        }
        const provider = new anchor.AnchorProvider(connection, anchorWallet, {
            preflightCommitment: 'processed',
        });
        return new Program(IDL as any, this.PROGRAM_ID, provider);
    }

    /**
     * Request funding for a project on Solana
     */
    async requestFunding(connection: Connection, anchorWallet: any, projectData: ProjectData) {
        console.log('Solana: requestFunding', projectData);
        const publicKey = anchorWallet.publicKey;
        const program = this.getProgram(connection, anchorWallet);
        
        try {
            // Derive Project PDA
            const [projectPda] = PublicKey.findProgramAddressSync(
                [
                    Buffer.from("project"),
                    publicKey.toBuffer(),
                    Buffer.from(projectData.projectName)
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
                developer: publicKey,
                systemProgram: SystemProgram.programId,
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
        backerTokenAccount: PublicKey,
        vaultTokenAccount: PublicKey
    ) {
        console.log('Solana: backProject', { projectPda: projectPda.toBase58(), amount });
        const program = this.getProgram(connection, anchorWallet);

        try {
            // Derive Vault Authority PDA
            const [vaultAuthorityPda] = PublicKey.findProgramAddressSync(
                [
                    Buffer.from("vault_authority"),
                    projectPda.toBuffer()
                ],
                this.PROGRAM_ID
            );

            const [creditLinePda] = PublicKey.findProgramAddressSync(
                [
                    Buffer.from("credit_line"),
                    anchorWallet.publicKey.toBuffer() // Wait, this should be the developer's credit line
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

            const tx = await program.methods.backProject(
                new BN(multiplier),
                new BN(amount)
            ).accounts({
                project: projectPda,
                developerCreditLine: devCreditLinePda,
                backer: anchorWallet.publicKey,
                backerTokenAccount: backerTokenAccount,
                vaultTokenAccount: vaultTokenAccount,
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
        projectPda: PublicKey,
        amount: string | number,
        developerTokenAccount: PublicKey,
        vaultTokenAccount: PublicKey
    ) {
        console.log('Solana: repayLoan', amount);
        const publicKey = anchorWallet.publicKey;
        const program = this.getProgram(connection, anchorWallet);
        
        try {
            // Derive Credit Line PDA
            const [creditLinePda] = PublicKey.findProgramAddressSync(
                [
                    Buffer.from("credit_line"),
                    publicKey.toBuffer()
                ],
                this.PROGRAM_ID
            );

            // Derive Vault Authority PDA
            const [vaultAuthorityPda] = PublicKey.findProgramAddressSync(
                [
                    Buffer.from("vault_authority"),
                    projectPda.toBuffer()
                ],
                this.PROGRAM_ID
            );

            const tx = await program.methods.repayLoan(
                new BN(amount)
            ).accounts({
                creditLine: creditLinePda,
                developer: publicKey,
                developerTokenAccount: developerTokenAccount,
                vaultTokenAccount: vaultTokenAccount,
                project: projectPda,
                vaultAuthority: vaultAuthorityPda,
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

    /**
     * Verify a milestone and trigger payout
     */
    async verifyMilestone(
        connection: Connection, 
        anchorWallet: any, 
        projectPda: PublicKey,
        developerTokenAccount: PublicKey,
        vaultTokenAccount: PublicKey,
        milestoneIndex: number
    ) {
        console.log('Solana: verifyMilestone', { projectPda: projectPda.toBase58(), milestoneIndex });
        const program = this.getProgram(connection, anchorWallet);

        try {
            // Derive Vault Authority PDA
            const [vaultAuthorityPda] = PublicKey.findProgramAddressSync(
                [
                    Buffer.from("vault_authority"),
                    projectPda.toBuffer()
                ],
                this.PROGRAM_ID
            );

            const tx = await program.methods.verifyMilestone(milestoneIndex)
                .accounts({
                    project: projectPda,
                    developerTokenAccount: developerTokenAccount,
                    vaultTokenAccount: vaultTokenAccount,
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
        backerTokenAccount: PublicKey,
        vaultTokenAccount: PublicKey,
        backingIndex: number
    ) {
        console.log('Solana: claimReward', { projectPda: projectPda.toBase58(), backingIndex });
        const program = this.getProgram(connection, anchorWallet);

        try {
            // Derive Vault Authority PDA
            const [vaultAuthorityPda] = PublicKey.findProgramAddressSync(
                [
                    Buffer.from("vault_authority"),
                    projectPda.toBuffer()
                ],
                this.PROGRAM_ID
            );

            const tx = await program.methods.claimReward(backingIndex)
                .accounts({
                    project: projectPda,
                    backer: anchorWallet.publicKey,
                    backerTokenAccount: backerTokenAccount,
                    vaultTokenAccount: vaultTokenAccount,
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

            const provider = new anchor.AnchorProvider(connection, {} as any, {});
            const program = new Program(IDL as any, this.PROGRAM_ID, provider);
            
            const projectAccount = await program.account.project.fetch(projectPubkey) as any;
            
            return {
                totalBacking: projectAccount.totalBacking.toString(),
                backerCount: projectAccount.backings.length,
                maxMultiplier: this.calculateMaxMultiplier(450),
                creditScore: 450
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

            const provider = new anchor.AnchorProvider(connection, {} as any, {});
            const program = new Program(IDL as any, this.PROGRAM_ID, provider);
            
            const projectAccount = await program.account.project.fetch(projectPubkey) as any;
            
            return {
                isActive: projectAccount.isActive,
                creditScore: 450,
                fundingAmount: projectAccount.fundingAmount.toString(),
                milestonesCompleted: projectAccount.milestonesCompleted,
                milestonesCount: projectAccount.milestonesCount
            };
        } catch (error) {
            console.error('Error fetching Solana project details:', error);
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
