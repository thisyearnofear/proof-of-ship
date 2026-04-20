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

class CreditService {
    getContracts(chainId: number, signerOrProvider: Signer | providers.Provider): Contracts | null {
        if (!chainId || !signerOrProvider) return null;
        const coreAddress = BUILDER_CREDIT_CORE_ADDRESSES[chainId];
        const usdcAddress = TESTNET_USDC_ADDRESSES[chainId];
        const registryAddress = HACKATHON_REGISTRY_ADDRESSES[chainId];
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
}
export const creditService = new CreditService();
export default creditService;
