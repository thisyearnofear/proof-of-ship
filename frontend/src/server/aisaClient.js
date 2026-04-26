/**
 * AIsa x402-paid fetch client for Arc Testnet
 *
 * ⚠️  SERVER-ONLY — this file MUST NEVER be imported from client-side code.
 *     It reads OWS_MNEMONIC from process.env, which must never reach the browser.
 *
 *     A runtime guard throws if accidentally imported on the client.
 */

if (typeof window !== 'undefined') {
  throw new Error(
    'aisaClient.js must only be imported from server-side code. ' +
    'It contains secrets (OWS_MNEMONIC) that must never reach the browser.'
  );
}

import { createWalletClient, createPublicClient, http, getAddress, toHex } from "viem";
import { mnemonicToAccount } from "viem/accounts";
import { toClientEvmSigner } from "@x402/evm";
import { wrapFetchWithPayment, x402Client } from "@x402/fetch";

const arcTestnet = {
  id: 5042002,
  name: "Arc Testnet",
  nativeCurrency: { name: "USDC", symbol: "USDC", decimals: 18 },
  rpcUrls: { default: { http: ["https://rpc.testnet.arc.network"] } },
};

const authorizationTypes = {
  TransferWithAuthorization: [
    { name: "from", type: "address" },
    { name: "to", type: "address" },
    { name: "value", type: "uint256" },
    { name: "validAfter", type: "uint256" },
    { name: "validBefore", type: "uint256" },
    { name: "nonce", type: "bytes32" },
  ],
};

class GatewayEvmScheme {
  constructor(signer) {
    this.signer = signer;
    this.scheme = "exact";
  }

  async createPaymentPayload(x402Version, paymentRequirements) {
    const nonce = toHex(crypto.getRandomValues(new Uint8Array(32)));
    const now = Math.floor(Date.now() / 1e3);

    const authorization = {
      from: this.signer.address,
      to: getAddress(paymentRequirements.payTo),
      value: paymentRequirements.amount,
      validAfter: (now - 600).toString(),
      validBefore: (now + paymentRequirements.maxTimeoutSeconds).toString(),
      nonce,
    };

    const chainId = parseInt(paymentRequirements.network.split(":")[1], 10);
    const extra = paymentRequirements.extra || {};

    const domain = {
      name: extra.name || "GatewayWalletBatched",
      version: extra.version || "1",
      chainId,
      verifyingContract: getAddress(extra.verifyingContract || paymentRequirements.asset),
    };

    const message = {
      from: getAddress(authorization.from),
      to: getAddress(authorization.to),
      value: BigInt(authorization.value),
      validAfter: BigInt(authorization.validAfter),
      validBefore: BigInt(authorization.validBefore),
      nonce: authorization.nonce,
    };

    const signature = await this.signer.signTypedData({
      domain,
      types: authorizationTypes,
      primaryType: "TransferWithAuthorization",
      message,
    });

    return { x402Version, payload: { authorization, signature } };
  }
}

let _payingFetch = null;

export function getAisaFetch() {
  if (_payingFetch) return _payingFetch;

  const mnemonic = process.env.OWS_MNEMONIC;
  if (!mnemonic) {
    throw new Error("OWS_MNEMONIC environment variable is required for AIsa x402 payments");
  }

  const account = mnemonicToAccount(mnemonic);
  const walletClient = createWalletClient({ account, chain: arcTestnet, transport: http() });
  const publicClient = createPublicClient({ chain: arcTestnet, transport: http() });

  const signer = toClientEvmSigner(walletClient, publicClient);
  const scheme = new GatewayEvmScheme(signer);

  const client = new x402Client((_, accepts) => {
    const preferred = accepts.find((a) => a.network === "eip155:5042002");
    return preferred || accepts[0];
  });

  const networks = ["eip155:5042002", "eip155:11155111", "eip155:84532", "eip155:421614"];
  networks.forEach((network) => client.register(network, scheme));

  _payingFetch = wrapFetchWithPayment(fetch, client);
  return _payingFetch;
}

export function isAisaConfigured() {
  return !!process.env.OWS_MNEMONIC;
}

export const AISA_BASE_URL = "https://api.aisa.one/apis/v2";