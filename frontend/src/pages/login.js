import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { useUser } from "@/contexts/UserContext";
import { useWallet } from "@/contexts/WalletContext";
import Head from "next/head";

export default function LoginPage() {
  const { currentUser, signInWithGithub, linkWallet, loading: authLoading } = useUser();
  const {
    connected: evmConnected,
    address: evmAddress,
    connect: connectEvm,
    connecting: evmConnecting,
    provider,
    solanaConnected,
    solanaAddress,
    connectSolana,
    solanaConnecting,
    solanaWallet,
  } = useWallet();

  const router = useRouter();
  const { redirect } = router.query;

  const [error, setError] = useState(null);
  const [isSigningIn, setIsSigningIn] = useState(false);
  const [isLinking, setIsLinking] = useState(false);
  const [linked, setLinked] = useState(false);
  const [walletFamily, setWalletFamily] = useState(null);

  const anyWalletConnected = evmConnected || solanaConnected;
  const activeWalletAddress = walletFamily === 'solana' ? solanaAddress : evmAddress;
  const isFullyAuthed = !!currentUser && anyWalletConnected && linked;

  useEffect(() => {
    if (isFullyAuthed) {
      const timer = setTimeout(() => {
        router.push(redirect || "/build");
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, [isFullyAuthed, redirect, router]);

  const handleGithubLogin = async () => {
    try {
      setError(null);
      setIsSigningIn(true);
      await signInWithGithub();
    } catch (err) {
      setError("Failed to sign in with GitHub.");
    } finally {
      setIsSigningIn(false);
    }
  };

  const handleConnectEvm = async () => {
    try {
      setError(null);
      await connectEvm();
      setWalletFamily('evm');
    } catch (err) {
      setError("Failed to connect wallet.");
    }
  };

  const handleConnectSolana = async () => {
    try {
      setError(null);
      await connectSolana();
      setWalletFamily('solana');
    } catch (err) {
      setError("Failed to connect Solana wallet.");
    }
  };

  const handleLinkIdentity = async () => {
    if (!currentUser || !anyWalletConnected || !activeWalletAddress) return;
    try {
      setError(null);
      setIsLinking(true);

      const githubUsername = currentUser.providerData?.find(p => p.providerId === 'github.com')?.uid;
      const message = `Proof of Ship - Link Identity\n\nGitHub: ${githubUsername}\nWallet: ${activeWalletAddress}\nTimestamp: ${Date.now()}`;

      let signature;
      if (walletFamily === 'solana') {
        if (!solanaWallet?.signMessage) throw new Error('Solana wallet does not support message signing');
        const encoded = new TextEncoder().encode(message);
        const sigBytes = await solanaWallet.signMessage(encoded);
        signature = Buffer.from(sigBytes).toString('base64');
      } else {
        if (!provider) throw new Error('EVM provider not available');
        signature = await provider.request({ method: 'personal_sign', params: [message, activeWalletAddress] });
      }

      await linkWallet(activeWalletAddress, signature, message, walletFamily);
      setLinked(true);
    } catch (err) {
      setError(err.message || "Failed to verify wallet ownership.");
    } finally {
      setIsLinking(false);
    }
  };

  return (
    <div className="min-h-[80vh] flex flex-col justify-center py-12 sm:px-6 lg:px-8 bg-background">
      <Head>
        <title>Identity - Proof of Ship</title>
      </Head>

      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <img className="mx-auto h-16 w-16 rounded shadow-lg" src="/POS.png" alt="Proof of Ship" />
        <h2 className="mt-6 text-center text-3xl font-extrabold text-primary">
          Complete Your Identity
        </h2>
        <p className="mt-2 text-center text-sm text-secondary">
          Link your GitHub and Wallet to prove your ship and get funded.
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-lg">
        <div className="bg-surface py-8 px-4 shadow-xl border border-gray-100 sm:rounded-xl sm:px-10">
          {error && (
            <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4 text-sm text-red-700">
              {error}
            </div>
          )}

          <div className="space-y-6">
            {/* Step 1: GitHub */}
            <div className={`p-4 rounded-lg border-2 transition-all ${currentUser ? 'border-green-500 bg-green-50' : 'border-gray-200'}`}>
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <div className={`p-2 rounded-full ${currentUser ? 'bg-green-500 text-white' : 'bg-gray-100 text-gray-400'}`}>
                    {currentUser ? (
                      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                    ) : (
                      <span className="text-xs font-bold">1</span>
                    )}
                  </div>
                  <div className="ml-3">
                    <p className="text-sm font-bold text-primary">GitHub Profile</p>
                    <p className="text-xs text-secondary">{currentUser ? `Connected as ${currentUser.displayName}` : 'Verify your shipping history'}</p>
                  </div>
                </div>
                {!currentUser && (
                  <button onClick={handleGithubLogin} disabled={isSigningIn}
                    className="px-4 py-2 bg-gray-900 text-white text-xs font-bold rounded-md hover:bg-gray-800 disabled:opacity-50">
                    {isSigningIn ? '...' : 'Connect'}
                  </button>
                )}
              </div>
            </div>

            {/* Step 2: Wallet */}
            <div className={`p-4 rounded-lg border-2 transition-all ${anyWalletConnected ? 'border-green-500 bg-green-50' : 'border-gray-200'}`}>
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <div className={`p-2 rounded-full ${anyWalletConnected ? 'bg-green-500 text-white' : 'bg-gray-100 text-gray-400'}`}>
                    {anyWalletConnected ? (
                      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                    ) : (
                      <span className="text-xs font-bold">2</span>
                    )}
                  </div>
                  <div className="ml-3">
                    <p className="text-sm font-bold text-primary">Web3 Wallet</p>
                    <p className="text-xs text-secondary">
                      {anyWalletConnected && activeWalletAddress
                        ? `${activeWalletAddress.slice(0,6)}...${activeWalletAddress.slice(-4)}`
                        : 'Destination for your funding'}
                    </p>
                  </div>
                </div>
                {!anyWalletConnected && (
                  <div className="flex gap-2">
                    <button onClick={handleConnectEvm} disabled={evmConnecting}
                      className="px-4 py-2 bg-blue-600 text-white text-xs font-bold rounded-md hover:bg-blue-700 disabled:opacity-50">
                      {evmConnecting ? '...' : 'EVM'}
                    </button>
                    <button onClick={handleConnectSolana} disabled={solanaConnecting}
                      className="px-4 py-2 bg-purple-600 text-white text-xs font-bold rounded-md hover:bg-purple-700 disabled:opacity-50">
                      {solanaConnecting ? '...' : 'Solana'}
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Step 3: Link */}
            <div className={`p-6 rounded-lg border-2 border-dashed transition-all text-center ${isFullyAuthed ? 'border-green-500 bg-green-50' : 'border-gray-300'}`}>
              {isFullyAuthed ? (
                <div className="space-y-2">
                  <p className="text-sm font-bold text-green-700">Identities Linked Successfully!</p>
                  <p className="text-xs text-green-600">Redirecting to dashboard...</p>
                </div>
              ) : (
                <div className="space-y-4">
                  <p className="text-sm text-secondary">Once both are connected, sign a message to link them forever.</p>
                  <button onClick={handleLinkIdentity} disabled={!currentUser || !anyWalletConnected || isLinking}
                    className="w-full py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-bold rounded-lg shadow-md hover:from-blue-700 hover:to-purple-700 disabled:opacity-30 disabled:grayscale transition-all">
                    {isLinking ? 'Verifying...' : 'Verify & Link Identity'}
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
