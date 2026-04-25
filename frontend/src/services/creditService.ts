/**
 * Credit Service
 * Plain TS module for contract interactions (Phase 3A)
 */
import { ethers, Signer, providers } from 'ethers';
import { BUILDER_CREDIT_CORE_ABI, ERC20_ABI, HACKATHON_REGISTRY_ABI } from '../constants/abis';
import { BUILDER_CREDIT_CORE_ADDRESSES, TESTNET_USDC_ADDRESSES, HACKATHON_REGISTRY_ADDRESSES } from '../config/tokens';

interface ProjectData {
    hackathonIds: number[];
    githubUrl: string;
    projectName: string;
    milestoneDescriptions: string[];
    milestoneAmounts: string[] | number[];
}

interface Contracts {
    core: ethers.Contract;
    usdc: ethers.Contract;
    registry: ethers.Contract;
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

class CreditService {
    getContracts(chainId: number | undefined, signerOrProvider: Signer | providers.Provider): Contracts | null {
        if (!chainId || !signerOrProvider) return null;
        const coreAddress = (BUILDER_CREDIT_CORE_ADDRESSES as Record<number, string>)[chainId];
        const usdcAddress = (TESTNET_USDC_ADDRESSES as Record<number, string>)[chainId];
        const registryAddress = (HACKATHON_REGISTRY_ADDRESSES as Record<number, string>)[chainId];
        if (!coreAddress || !usdcAddress || !registryAddress) {
            throw new Error(`Platform not supported on network ${chainId}`);
        }
        return {
            core: new ethers.Contract(coreAddress, BUILDER_CREDIT_CORE_ABI, signerOrProvider),
            usdc: new ethers.Contract(usdcAddress, ERC20_ABI, signerOrProvider),
            registry: new ethers.Contract(registryAddress, HACKATHON_REGISTRY_ABI, signerOrProvider)
        };
    }

    async requestFunding(chainId: number, signer: Signer, projectData: ProjectData) {
        const contracts = this.getContracts(chainId, signer);
        if (!contracts) throw new Error("Contracts not found");
        const { core } = contracts;
        const { hackathonIds, githubUrl, projectName, milestoneDescriptions, milestoneAmounts } = projectData;
        const amounts = milestoneAmounts.map(a => ethers.utils.parseUnits(a.toString(), 6));
        const tx = await core.requestFunding(hackathonIds, githubUrl, projectName, milestoneDescriptions, amounts);
        return await tx.wait();
    }

    async repayLoan(chainId: number, signer: Signer, amount: string | number) {
        const contracts = this.getContracts(chainId, signer);
        if (!contracts) throw new Error("Contracts not found");
        const { core, usdc } = contracts;
        const amountUnits = ethers.utils.parseUnits(amount.toString(), 6);
        const account = await signer.getAddress();
        const allowance = await usdc.allowance(account, core.address);
        if (allowance.lt(amountUnits)) {
            const tx = await usdc.approve(core.address, ethers.constants.MaxUint256);
            await tx.wait();
        }
        const tx = await core.repayLoan(amountUnits);
        return await tx.wait();
    }

    async getProjectBackingData(chainId: number, signer: Signer, projectId: string | number): Promise<ProjectBackingData> {
        const contracts = this.getContracts(chainId, signer);
        if (!contracts) throw new Error("Contracts not found");
        
        const projectIdNum = typeof projectId === 'string' ? parseInt(projectId, 10) : projectId;
        
        try {
            // Get total backing from contract
            const totalBacking = await contracts.core.totalProjectBacking(projectIdNum);
            
            // Get project details for credit score and max multiplier
            const project = await contracts.core.projects(projectIdNum);
            const creditScore = project.creditScore?.toNumber() || 400;
            
            // Get max allowed multiplier based on credit score
            const maxMultiplier = this.calculateMaxMultiplier(creditScore);
            
            // Get backing count from projectBackings array
            const backerCount = await this.getBackerCount(chainId, signer, projectIdNum);
            
            return {
                totalBacking: ethers.utils.formatUnits(totalBacking || 0, 6),
                backerCount,
                maxMultiplier,
                creditScore
            };
        } catch (err) {
            console.warn('Failed to load project backing data:', err);
            return {
                totalBacking: '0',
                backerCount: 0,
                maxMultiplier: 300,
                creditScore: 400
            };
        }
    }

    async getBackerCount(chainId: number, signer: Signer, projectId: number): Promise<number> {
        const contracts = this.getContracts(chainId, signer);
        if (!contracts) return 0;
        
        try {
            const count = await contracts.core.getProjectBackerCount(projectId);
            return count?.toNumber ? count.toNumber() : 0;
        } catch {
            return 0;
        }
    }

    calculateMaxMultiplier(creditScore: number): number {
        if (creditScore >= 800) return 150; // 1.5x
        if (creditScore >= 700) return 200; // 2.0x
        if (creditScore >= 600) return 250; // 2.5x
        return 300; // 3.0x
    }

    async getProjectDetails(chainId: number, signer: Signer, projectId: string | number): Promise<ProjectDetails | null> {
        const contracts = this.getContracts(chainId, signer);
        if (!contracts) return null;
        
        try {
            const projectIdNum = typeof projectId === 'string' ? parseInt(projectId, 10) : projectId;
            const project = await contracts.core.projects(projectIdNum);
            
            if (!project.developer || project.developer === '0x0000000000000000000000000000000000000000') {
                return null;
            }
            
            return {
                isActive: project.isActive,
                creditScore: project.creditScore?.toNumber() || 400,
                fundingAmount: ethers.utils.formatUnits(project.fundingAmount || 0, 6),
                milestonesCompleted: project.milestonesCompleted?.toNumber() || 0,
                milestonesCount: project.milestonesCount?.toNumber() || 0
            };
        } catch (err) {
            console.warn('Failed to load project details:', err);
            return null;
        }
    }
}
export const creditService = new CreditService();
export default creditService;
