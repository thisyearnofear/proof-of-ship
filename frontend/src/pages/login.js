import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import Link from "next/link";
import { useUser } from "@/contexts/UserContext";
import { useWallet } from "@/contexts/WalletContext";
import Head from "next/head";

export default function LoginPage() {
  const { currentUser, signInWithGithub, signInWithWallet, linkWallet, linkedWallets, userRole } = useUser();
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
  const [role, setRole] = useState(null);

  const anyWalletConnected = evmConnected || solanaConnected;
  const activeWalletAddress = walletFamily === 'solana' ? solanaAddress : evmAddress;
  const alreadyLinked = activeWalletAddress && linkedWallets.some(w => w.address.toLowerCase() === activeWalletAddress.toLowerCase());

  // Builder: needs GitHub + wallet linked. Backer: needs wallet signed in.
  const isFullyAuthed = role === 'backer'
    ? !!currentUser && anyWalletConnected && linked
    : !!currentUser && anyWalletConnected && linked;

  // Redirect after fully authed
  useEffect(() => {
    if (isFullyAuthed) {
      const dest = redirect || (role === 'backer' ? '/credit' : '/build');
      const timer = setTimeout(() => router.push(dest), 1500);
      return () => clearTimeout(timer);
    }
  }, [isFullyAuthed, redirect, router, role]);

  // If already logged in with a role, skip to the right flow
  useEffect(() => {
    if (userRole && !role) setRole(userRole);
  }, [userRole, role]);

  const signWalletMessage = async () => {
    if (!anyWalletConnected || !activeWalletAddress) throw new Error('No wallet connected');

    const identifier = currentUser?.providerData?.find(p => p.providerId === 'github.com')?.uid
      || currentUser?.displayName
      || activeWalletAddress;
    const message = `Proof of Ship - Verify Identity\n\nIdentifier: ${identifier}\nWallet: ${activeWalletAddress}\nTimestamp: ${Date.now()}`;

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

    return { signature, message };
  };

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

  // Builder flow: link wallet to existing GitHub session
  const handleLinkIdentity = async () => {
    if (!currentUser || !anyWalletConnected || !activeWalletAddress) return;
    try {
      setError(null);
      setIsLinking(true);
      const { signature, message } = await signWalletMessage();
      await linkWallet(activeWalletAddress, signature, message, walletFamily);
      setLinked(true);
    } catch (err) {
      setError(err.message || "Failed to verify wallet ownership.");
    } finally {
      setIsLinking(false);
    }
  };

  // Backer flow: sign in with wallet (creates Firebase session + links wallet)
  const handleWalletSignIn = async () => {
    if (!anyWalletConnected || !activeWalletAddress) return;
    try {
      setError(null);
      setIsLinking(true);
      const { signature, message } = await signWalletMessage();
      await signInWithWallet(activeWalletAddress, signature, message, walletFamily);
      setLinked(true);
    } catch (err) {
      setError(err.message || "Failed to verify wallet ownership.");
    } finally {
      setIsLinking(false);
    }
  };

  // Step 0: Role selection
  if (!role) {
    return (
      <div className="min-h-[80vh] flex flex-col justify-center py-12 sm:px-6 lg:px-8 bg-background">
        <Head><title>Sign In - Proof of Ship</title></Head>

        <div className="sm:mx-auto sm:w-full sm:max-w-md">
          <img className="mx-auto h-16 w-16 rounded shadow-lg" src="/POS.png" alt="Proof of Ship" />
          <h2 className="mt-6 text-center text-3xl font-extrabold text-primary">
            Welcome to Proof of Ship
          </h2>
          <p className="mt-2 text-center text-sm text-secondary">
            How do you want to participate?
          </p>
        </div>

        <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-lg">
          <div className="grid grid-cols-2 gap-4">
            <button
              onClick={() => setRole('builder')}
              className="p-6 bg-surface rounded-xl border-2 border-gray-200 hover:border-blue-500 hover:bg-blue-50 transition-all text-left"
            >
              <div className="text-2xl mb-2">{'\u{1F680}'}</div>
              <h3 className="text-lg font-bold text-primary">Builder</h3>
              <p className="text-sm text-secondary mt-1">
                Ship projects, get verified, and receive funding.
              </p>
              <p className="text-xs text-gray-400 mt-3">Requires GitHub + Wallet</p>
            </button>

            <button
              onClick={() => setRole('backer')}
              className="p-6 bg-surface rounded-xl border-2 border-gray-200 hover:border-purple-500 hover:bg-purple-50 transition-all text-left"
            >
              <div className="text-2xl mb-2">{'\u{1F4B0}'}</div>
              <h3 className="text-lg font-bold text-primary">Backer</h3>
              <p className="text-sm text-secondary mt-1">
                Fund builders and earn returns on shipping history.
              </p>
              <p className="text-xs text-gray-400 mt-3">Wallet only</p>
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Backer flow: wallet-only
  if (role === 'backer') {
    return (
      <div className="min-h-[80vh] flex flex-col justify-center py-12 sm:px-6 lg:px-8 bg-background">
        <Head><title>Sign In - Proof of Ship</title></Head>

        <div className="sm:mx-auto sm:w-full sm:max-w-md">
          <img className="mx-auto h-16 w-16 rounded shadow-lg" src="/POS.png" alt="Proof of Ship" />
          <h2 className="mt-6 text-center text-3xl font-extrabold text-primary">
            Sign In as Backer
          </h2>
          <p className="mt-2 text-center text-sm text-secondary">
            Connect your wallet and sign a message to verify ownership.
          </p>
        </div>

        <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-lg">
          <div className="bg-surface py-8 px-4 shadow-xl border border-gray-100 sm:rounded-xl sm:px-10">
            {error && (
              <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4 text-sm text-red-700">{error}</div>
            )}

            <div className="space-y-6">
              {/* Connect Wallet */}
              <div className={`p-4 rounded-lg border-2 transition-all ${anyWalletConnected ? 'border-green-500 bg-green-50' : 'border-gray-200'}`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <div className={`p-2 rounded-full ${anyWalletConnected ? 'bg-green-500 text-white' : 'bg-gray-100 text-gray-400'}`}>
                      {anyWalletConnected ? (
                        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                      ) : <span className="text-xs font-bold">1</span>}
                    </div>
                    <div className="ml-3">
                      <p className="text-sm font-bold text-primary">Connect Wallet</p>
                      <p className="text-xs text-secondary">
                        {anyWalletConnected && activeWalletAddress
                          ? `${activeWalletAddress.slice(0,6)}...${activeWalletAddress.slice(-4)}`
                          : 'Your identity for funding'}
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

              {/* Sign In */}
              <div className={`p-6 rounded-lg border-2 border-dashed transition-all text-center ${isFullyAuthed ? 'border-green-500 bg-green-50' : 'border-gray-300'}`}>
                {isFullyAuthed ? (
                  <div className="space-y-2">
                    <p className="text-sm font-bold text-green-700">Signed in successfully!</p>
                    <p className="text-xs text-green-600">Redirecting...</p>
                  </div>
                ) : alreadyLinked ? (
                  <div className="space-y-2">
                    <p className="text-sm font-bold text-green-700">This wallet is already linked to an account.</p>
                    <Link href="/profile" className="text-xs text-blue-600 underline">Manage wallets in your profile</Link>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <p className="text-sm text-secondary">Sign a message to prove you own this wallet.</p>
                    <button onClick={handleWalletSignIn} disabled={!anyWalletConnected || isLinking}
                      className="w-full py-3 bg-gradient-to-r from-purple-600 to-blue-600 text-white font-bold rounded-lg shadow-md hover:from-purple-700 hover:to-blue-700 disabled:opacity-30 disabled:grayscale transition-all">
                      {isLinking ? 'Verifying...' : 'Sign In with Wallet'}
                    </button>
                  </div>
                )}
              </div>

              <button onClick={() => setRole(null)} className="text-sm text-gray-500 hover:text-gray-700">
                {'\u2190'} Back
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Builder flow: GitHub + Wallet
  return (
    <div className="min-h-[80vh] flex flex-col justify-center py-12 sm:px-6 lg:px-8 bg-background">
      <Head><title>Identity - Proof of Ship</title></Head>

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
            <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4 text-sm text-red-700">{error}</div>
          )}

          <div className="space-y-6">
            {/* Step 1: GitHub */}
            <div className={`p-4 rounded-lg border-2 transition-all ${currentUser ? 'border-green-500 bg-green-50' : 'border-gray-200'}`}>
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <div className={`p-2 rounded-full ${currentUser ? 'bg-green-500 text-white' : 'bg-gray-100 text-gray-400'}`}>
                    {currentUser ? (
                      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                    ) : <span className="text-xs font-bold">1</span>}
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
                    ) : <span className="text-xs font-bold">2</span>}
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
            <div className={`p-6 rounded-lg border-2 border-dashed transition-all text-center ${isFullyAuthed || alreadyLinked ? 'border-green-500 bg-green-50' : 'border-gray-300'}`}>
              {isFullyAuthed ? (
                <div className="space-y-2">
                  <p className="text-sm font-bold text-green-700">Identities Linked Successfully!</p>
                  <p className="text-xs text-green-600">Redirecting to dashboard...</p>
                </div>
              ) : alreadyLinked ? (
                <div className="space-y-2">
                  <p className="text-sm font-bold text-green-700">This wallet is already linked to your account.</p>
                  <Link href="/profile" className="text-xs text-blue-600 underline">Manage wallets in your profile</Link>
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

            <button onClick={() => setRole(null)} className="text-sm text-gray-500 hover:text-gray-700">
              {'\u2190'} Back
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
