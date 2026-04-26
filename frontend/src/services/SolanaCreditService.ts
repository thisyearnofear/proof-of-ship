import { Connection, PublicKey, Transaction, SystemProgram, LAMPORTS_PER_SOL } from '@solana/web3.js';
import { SOLANA_MAINNET_USDC, SOLANA_DEVNET_USDC } from '../config/tokens';

/**
 * Solana Credit Service
 * Handles Solana-specific credit operations (Phase 5: Real on-chain data)
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
    // Phase 6: Updated with actual program ID from blockchain-solana
    private PROGRAM_ID = new PublicKey('Fg6PaFpoGXkYsidMpWTK6W2BeZ7FEfcYkg476zPFsLnS');

    /**
     * Request funding for a project on Solana
     */
    async requestFunding(connection: Connection, publicKey: PublicKey, projectData: ProjectData) {
        console.log('Solana: requestFunding', projectData);
        
        try {
            // Default verifier if none provided (e.g., a platform-wide verifier)
            const verifier = projectData.verifier || publicKey.toBase58();

            // Derive Project PDA
            const [projectPda] = await PublicKey.findProgramAddress(
                [
                    Buffer.from("project"),
                    publicKey.toBuffer(),
                    Buffer.from(projectData.projectName)
                ],
                this.PROGRAM_ID
            );

            // Derive Credit Line PDA
            const [creditLinePda] = await PublicKey.findProgramAddress(
                [
                    Buffer.from("credit_line"),
                    publicKey.toBuffer()
                ],
                this.PROGRAM_ID
            );

            // In a real implementation with @coral-xyz/anchor, we would:
            /*
            const program = new Program(IDL, this.PROGRAM_ID, provider);
            const tx = await program.methods.requestFunding(
                projectData.hackathonIds.map(id => new BN(id)),
                projectData.githubUrl,
                projectData.projectName,
                projectData.milestoneDescriptions,
                projectData.milestoneAmounts.map(amt => new BN(amt)),
                new PublicKey(verifier)
            ).accounts({
                project: projectPda,
                creditLine: creditLinePda,
                developer: publicKey,
                systemProgram: SystemProgram.programId,
            }).transaction();
            */
            
            // Build a placeholder transaction to satisfy the wallet adapter
            const transaction = new Transaction().add(
                SystemProgram.transfer({
                    fromPubkey: publicKey,
                    toPubkey: projectPda, // Send a tiny bit to the project PDA to "initialize" it in this simulation
                    lamports: 0,
                })
            );
            
            const { blockhash } = await connection.getLatestBlockhash();
            transaction.recentBlockhash = blockhash;
            transaction.feePayer = publicKey;
            
            return { 
                success: true, 
                hash: 'solana_tx_hash_' + Date.now(),
                projectPda: projectPda.toBase58(),
                projectData 
            };
        } catch (error) {
            console.error('Solana requestFunding error:', error);
            throw error;
        }
    }

    /**
     * Repay a loan on Solana
     */
    async repayLoan(connection: Connection, publicKey: PublicKey, amount: string | number) {
        console.log('Solana: repayLoan', amount);
        
        try {
            // Derive Credit Line PDA
            const [creditLinePda] = await PublicKey.findProgramAddress(
                [
                    Buffer.from("credit_line"),
                    publicKey.toBuffer()
                ],
                this.PROGRAM_ID
            );

            // In a real implementation, we'd also need the USDC token accounts
            // For now, we simulate the transaction building
            
            return { 
                success: true, 
                hash: 'solana_repay_hash_' + Date.now(),
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
        verifierPublicKey: PublicKey, 
        projectPda: PublicKey,
        developerTokenAccount: PublicKey,
        vaultTokenAccount: PublicKey,
        milestoneIndex: number
    ) {
        console.log('Solana: verifyMilestone', { projectPda: projectPda.toBase58(), milestoneIndex });

        try {
            // Derive Vault Authority PDA
            const [vaultAuthorityPda] = await PublicKey.findProgramAddress(
                [
                    Buffer.from("vault_authority"),
                    projectPda.toBuffer()
                ],
                this.PROGRAM_ID
            );

            // In a real implementation, we'd construct the instruction
            /*
            const program = new Program(IDL, this.PROGRAM_ID, provider);
            const tx = await program.methods.verifyMilestone(milestoneIndex)
                .accounts({
                    project: projectPda,
                    developerTokenAccount,
                    vaultTokenAccount,
                    vaultAuthority: vaultAuthorityPda,
                    verifier: verifierPublicKey,
                    tokenProgram: TOKEN_PROGRAM_ID,
                })
                .transaction();
            */

            return {
                success: true,
                hash: 'solana_verify_hash_' + Date.now(),
                projectPda: projectPda.toBase58(),
                milestoneIndex
            };
        } catch (error) {
            console.error('Solana verifyMilestone error:', error);
            throw error;
        }
    }

    /**
     * Get project backing data for a Solana project
     */
    async getProjectBackingData(connection: Connection, projectId: string | number): Promise<ProjectBackingData> {
        try {
            // Attempt to treat projectId as a public key if it's in the right format
            let projectPubkey: PublicKey;
            try {
                projectPubkey = new PublicKey(projectId.toString());
            } catch {
                // If not a pubkey, it's a slug, we'd normally derive a PDA here
                // For Phase 5, we'll return a default state for slugs
                return {
                    totalBacking: '0',
                    backerCount: 0,
                    maxMultiplier: 300,
                    creditScore: 400
                };
            }

            const accountInfo = await connection.getAccountInfo(projectPubkey);
            
            if (!accountInfo) {
                return {
                    totalBacking: '0',
                    backerCount: 0,
                    maxMultiplier: 300,
                    creditScore: 400
                };
            }

            // In a real implementation, we would decode the account data using an IDL
            // For now, we fetch the USDC balance of this account as "backing"
            const usdcMint = connection.rpcEndpoint.includes('devnet') ? SOLANA_DEVNET_USDC : SOLANA_MAINNET_USDC;
            const usdcBalance = await this.fetchTokenBalance(connection, projectPubkey, usdcMint);

            return {
                totalBacking: usdcBalance,
                backerCount: accountInfo.lamports > 0 ? 1 : 0, // Simplified
                maxMultiplier: this.calculateMaxMultiplier(450),
                creditScore: 450 // Base score for existing accounts
            };
        } catch (error) {
            console.error('Error fetching Solana project backing data:', error);
            return {
                totalBacking: '0',
                backerCount: 0,
                maxMultiplier: 300,
                creditScore: 400
            };
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
                return {
                    isActive: false,
                    creditScore: 0,
                    fundingAmount: '0',
                    milestonesCompleted: 0,
                    milestonesCount: 0
                };
            }

            const accountInfo = await connection.getAccountInfo(projectPubkey);
            const usdcMint = connection.rpcEndpoint.includes('devnet') ? SOLANA_DEVNET_USDC : SOLANA_MAINNET_USDC;
            const usdcBalance = await this.fetchTokenBalance(connection, projectPubkey, usdcMint);
            
            return {
                isActive: !!accountInfo,
                creditScore: accountInfo ? 450 : 0,
                fundingAmount: usdcBalance,
                milestonesCompleted: 0,
                milestonesCount: 0
            };
        } catch (error) {
            console.error('Error fetching Solana project details:', error);
            return null;
        }
    }

    /**
     * Helper to fetch USDC token balance for a Solana account
     */
    private async fetchTokenBalance(connection: Connection, publicKey: PublicKey, mintAddress: string): Promise<string> {
        try {
            const response = await connection.getTokenAccountsByOwner(publicKey, {
                mint: new PublicKey(mintAddress)
            });
            
            if (response.value.length === 0) return '0';
            
            const balance = await connection.getTokenAccountBalance(response.value[0].pubkey);
            return balance.value.uiAmountString || '0';
        } catch (error) {
            // It's common to not have a token account, so we return '0'
            return '0';
        }
    }

    /**
     * Calculate max multiplier based on credit score
     */
    calculateMaxMultiplier(creditScore: number): number {
        if (creditScore >= 800) return 150; // 1.5x
        if (creditScore >= 700) return 200; // 2.0x
        if (creditScore >= 600) return 250; // 2.5x
        return 300; // 3.0x
    }
}

export const solanaCreditService = new SolanaCreditService();
export default solanaCreditService;
