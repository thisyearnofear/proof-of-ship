/**
 * Wallet Service
 * Handles Circle wallet operations via API routes (BFF)
 * Migrated to TypeScript (Phase 3A)
 */

interface WalletConfig {
    name?: string;
    description?: string;
    userId?: string;
    metadata?: Record<string, any>;
}

interface TransferRequest {
    walletId: string;
    amount: string;
    destinationAddress: string;
    metadata?: Record<string, any>;
}

class WalletService {
    private baseUrl: string;

    constructor() {
        this.baseUrl = '/api/circle';
    }

    async getConfig() {
        const response = await fetch(`${this.baseUrl}/config`);
        return await response.json();
    }

    async getStatus() {
        const response = await fetch(`${this.baseUrl}/status`);
        return await response.json();
    }

    async getWallets(walletSetId?: string) {
        const url = walletSetId ? `${this.baseUrl}/wallets?walletSetId=${walletSetId}` : `${this.baseUrl}/wallets`;
        const response = await fetch(url);
        return await response.json();
    }

    async getWalletById(walletId: string) {
        const response = await fetch(`${this.baseUrl}/wallets/${walletId}`);
        return await response.json();
    }

    async createWallet(config: WalletConfig = {}) {
        const response = await fetch(`${this.baseUrl}/wallets`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(config)
        });
        return await response.json();
    }

    async transferUSDC(config: TransferRequest) {
        const response = await fetch(`${this.baseUrl}/transfer`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(config)
        });
        return await response.json();
    }

    async createTransaction(config: Record<string, any>) {
        const response = await fetch(`${this.baseUrl}/transactions`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(config)
        });
        return await response.json();
    }
}

export const walletService = new WalletService();
export default walletService;
