import { getDefaultConfig } from 'connectkit';
import { createConfig, http } from 'wagmi';
import { mainnet, polygon, optimism, arbitrum, celo, base } from 'wagmi/chains';

export const wagmiConfig = createConfig(
  getDefaultConfig({
    chains: [mainnet, polygon, optimism, arbitrum, base, celo],
    transports: {
      [mainnet.id]: http(),
      [polygon.id]: http('https://polygon-rpc.com/'),
      [optimism.id]: http('https://mainnet.optimism.io'),
      [arbitrum.id]: http('https://arb1.arbitrum.io/rpc'),
      [base.id]: http('https://mainnet.base.org'),
      [celo.id]: http('https://forno.celo.org'),
    },
    walletConnectProjectId: process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID || '',
    appName: 'Proof of Ship',
    appDescription: 'On-chain builder credit backed by reputation',
    appUrl: 'https://proof-of-ship.vercel.app',
  })
);
