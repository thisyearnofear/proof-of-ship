import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import Link from "next/link";
import { useUser } from "@/contexts/UserContext";
import { useWallet } from "@/contexts/WalletContext";
import Head from "next/head";

function detectWallets() {
  if (typeof window === 'undefined') return { metamask: false, phantom: false };
  return {
    metamask: !!(window.ethereum?.isMetaMask),
    phantom: !!(window.solana?.isPhantom || window.phantom?.solana?.isPhantom),
  };
}

function WalletButtons({ onConnectEvm, onConnectSolana, evmConnecting, solanaConnecting, detected }) {
  const { metamask, phantom } = detected;
  const both = metamask && phantom;
  const neither = !metamask && !phantom;

  return (
    <div className={`flex ${both ? 'flex-col' : 'flex-row'} gap-2`}>
      <button onClick={onConnectEvm} disabled={evmConnecting}
        className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 text-white text-sm font-medium rounded-lg transition-all disabled:opacity-50 ${metamask ? 'bg-orange-500 hover:bg-orange-600' : 'bg-blue-600 hover:bg-blue-700'}`}>
        {evmConnecting ? (
          <span className="animate-spin">{'\u23F3'}</span>
        ) : (
          <>
            <span>{'\u{1F42E}'}</span>
            {metamask ? 'MetaMask' : neither ? 'MetaMask' : 'Ethereum Wallet'}
          </>
        )}
      </button>
      <button onClick={onConnectSolana} disabled={solanaConnecting}
        className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 text-white text-sm font-medium rounded-lg transition-all disabled:opacity-50 ${phantom ? 'bg-purple-600 hover:bg-purple-700' : 'bg-purple-500 hover:bg-purple-600'}`}>
        {solanaConnecting ? (
          <span className="animate-spin">{'\u23F3'}</span>
        ) : (
          <>
            <span>{'\u{1F47B}'}</span>
            {phantom ? 'Phantom' : neither ? 'Phantom' : 'Solana Wallet'}
          </>
        )}
      </button>
    </div>
  );
}

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
  const [detected, setDetected] = useState({ metamask: false, phantom: false });

  useEffect(() => {
    setDetected(detectWallets());
  }, []);

  const anyWalletConnected = evmConnected || solanaConnected;
  const activeWalletAddress = walletFamily === 'solana' ? solanaAddress : evmAddress;
  const alreadyLinked = activeWalletAddress && linkedWallets.some(w => w.address.toLowerCase() === activeWalletAddress.toLowerCase());
  const isFullyAuthed = !!currentUser && anyWalletConnected && linked;

  useEffect(() => {
    if (isFullyAuthed) {
      const dest = redirect || (role === 'backer' ? '/credit' : '/build');
      const timer = setTimeout(() => router.push(dest), 1500);
      return () => clearTimeout(timer);
    }
  }, [isFullyAuthed, redirect, router, role]);

  useEffect(() => {
    if (userRole && !role) setRole(userRole);
  }, [userRole, role]);

  const signWalletMessage = async () => {
    if (!anyWalletConnected || !activeWalletAddress) throw new Error('No wallet connected');
    const identifier = currentUser?.providerData?.find(p => p.providerId === 'github.com')?.uid
      || currentUser?.displayName || activeWalletAddress;
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
      setError("GitHub sign-in was cancelled or failed.");
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
      setError("Could not connect to MetaMask. Is it installed?");
    }
  };

  const handleConnectSolana = async () => {
    try {
      setError(null);
      await connectSolana();
      setWalletFamily('solana');
    } catch (err) {
      setError("Could not connect to Phantom. Is it installed?");
    }
  };

  const handleLinkIdentity = async () => {
    if (!currentUser || !anyWalletConnected || !activeWalletAddress) return;
    try {
      setError(null);
      setIsLinking(true);
      const { signature, message } = await signWalletMessage();
      await linkWallet(activeWalletAddress, signature, message, walletFamily);
      setLinked(true);
    } catch (err) {
      setError(err.message || "Wallet verification failed. Try again.");
    } finally {
      setIsLinking(false);
    }
  };

  const handleWalletSignIn = async () => {
    if (!anyWalletConnected || !activeWalletAddress) return;
    try {
      setError(null);
      setIsLinking(true);
      const { signature, message } = await signWalletMessage();
      await signInWithWallet(activeWalletAddress, signature, message, walletFamily);
      setLinked(true);
    } catch (err) {
      setError(err.message || "Wallet verification failed. Try again.");
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
          <h2 className="mt-6 text-center text-3xl font-extrabold text-primary">Welcome to Proof of Ship</h2>
          <p className="mt-2 text-center text-sm text-secondary">Choose how you want to participate.</p>
        </div>
        <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-lg">
          <div className="grid grid-cols-2 gap-4">
            <button onClick={() => setRole('builder')}
              className="p-6 bg-surface rounded-xl border-2 border-gray-200 hover:border-blue-500 hover:bg-blue-50 transition-all text-left group">
              <div className="text-2xl mb-2">{'\u{1F680}'}</div>
              <h3 className="text-lg font-bold text-primary group-hover:text-blue-700">I&apos;m Building</h3>
              <p className="text-sm text-secondary mt-1">Ship projects and get funded based on your track record.</p>
              <p className="text-xs text-gray-400 mt-3">Connects GitHub + Wallet</p>
            </button>
            <button onClick={() => setRole('backer')}
              className="p-6 bg-surface rounded-xl border-2 border-gray-200 hover:border-purple-500 hover:bg-purple-50 transition-all text-left group">
              <div className="text-2xl mb-2">{'\u{1F4B0}'}</div>
              <h3 className="text-lg font-bold text-primary group-hover:text-purple-700">I&apos;m Backing</h3>
              <p className="text-sm text-secondary mt-1">Fund builders and track your portfolio.</p>
              <p className="text-xs text-gray-400 mt-3">Wallet only — no GitHub needed</p>
            </button>
          </div>
          <p className="mt-6 text-center text-xs text-gray-400">You can always add more later in your profile.</p>
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
          <h2 className="mt-6 text-center text-3xl font-extrabold text-primary">Connect Your Wallet</h2>
          <p className="mt-2 text-center text-sm text-secondary">
            This is your identity on Proof of Ship. You&apos;ll sign a message to prove you own it.
          </p>
        </div>
        <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-lg">
          <div className="bg-surface py-8 px-4 shadow-xl border border-gray-100 sm:rounded-xl sm:px-10">
            {error && <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4 text-sm text-red-700">{error}</div>}
            <div className="space-y-6">
              <div className={`p-4 rounded-lg border-2 transition-all ${anyWalletConnected ? 'border-green-500 bg-green-50' : 'border-gray-200'}`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <div className={`p-2 rounded-full ${anyWalletConnected ? 'bg-green-500 text-white' : 'bg-gray-100 text-gray-400'}`}>
                      {anyWalletConnected ? (
                        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                      ) : <span className="text-xs font-bold">1</span>}
                    </div>
                    <div className="ml-3">
                      <p className="text-sm font-bold text-primary">Your Wallet</p>
                      <p className="text-xs text-secondary">
                        {anyWalletConnected && activeWalletAddress
                          ? `Connected: ${activeWalletAddress.slice(0,6)}...${activeWalletAddress.slice(-4)}`
                          : 'Where you receive funds'}
                      </p>
                    </div>
                  </div>
                  {!anyWalletConnected && (
                    <WalletButtons onConnectEvm={handleConnectEvm} onConnectSolana={handleConnectSolana}
                      evmConnecting={evmConnecting} solanaConnecting={solanaConnecting} detected={detected} />
                  )}
                </div>
              </div>

              <div className={`p-6 rounded-lg border-2 border-dashed transition-all text-center ${isFullyAuthed ? 'border-green-500 bg-green-50' : 'border-gray-300'}`}>
                {isFullyAuthed ? (
                  <div className="space-y-2">
                    <p className="text-sm font-bold text-green-700">You&apos;re in!</p>
                    <p className="text-xs text-green-600">Taking you to your dashboard...</p>
                  </div>
                ) : alreadyLinked ? (
                  <div className="space-y-2">
                    <p className="text-sm font-bold text-green-700">This wallet is already linked to your account.</p>
                    <Link href="/profile" className="text-xs text-blue-600 underline">Manage your wallets</Link>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <p className="text-sm text-secondary">Prove you own this wallet by signing a quick message. Nothing is sent on-chain.</p>
                    <button onClick={handleWalletSignIn} disabled={!anyWalletConnected || isLinking}
                      className="w-full py-3 bg-gradient-to-r from-purple-600 to-blue-600 text-white font-bold rounded-lg shadow-md hover:from-purple-700 hover:to-blue-700 disabled:opacity-30 disabled:grayscale transition-all">
                      {isLinking ? 'Waiting for wallet...' : 'Sign In with Wallet'}
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
      <Head><title>Sign In - Proof of Ship</title></Head>
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <img className="mx-auto h-16 w-16 rounded shadow-lg" src="/POS.png" alt="Proof of Ship" />
        <h2 className="mt-6 text-center text-3xl font-extrabold text-primary">Set Up Your Builder Profile</h2>
        <p className="mt-2 text-center text-sm text-secondary">
          Two quick steps to verify your identity and start shipping.
        </p>
      </div>
      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-lg">
        <div className="bg-surface py-8 px-4 shadow-xl border border-gray-100 sm:rounded-xl sm:px-10">
          {error && <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4 text-sm text-red-700">{error}</div>}
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
                    <p className="text-sm font-bold text-primary">GitHub</p>
                    <p className="text-xs text-secondary">
                      {currentUser
                        ? `Signed in as ${currentUser.displayName}`
                        : 'We read your public repos to verify your shipping history.'}
                    </p>
                  </div>
                </div>
                {!currentUser && (
                  <button onClick={handleGithubLogin} disabled={isSigningIn}
                    className="px-4 py-2 bg-gray-900 text-white text-xs font-bold rounded-md hover:bg-gray-800 disabled:opacity-50">
                    {isSigningIn ? 'Opening GitHub...' : 'Connect GitHub'}
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
                    <p className="text-sm font-bold text-primary">Wallet</p>
                    <p className="text-xs text-secondary">
                      {anyWalletConnected && activeWalletAddress
                        ? `Connected: ${activeWalletAddress.slice(0,6)}...${activeWalletAddress.slice(-4)}`
                        : 'Where you receive funding payouts.'}
                    </p>
                  </div>
                </div>
                {!anyWalletConnected && (
                  <WalletButtons onConnectEvm={handleConnectEvm} onConnectSolana={handleConnectSolana}
                    evmConnecting={evmConnecting} solanaConnecting={solanaConnecting} detected={detected} />
                )}
              </div>
            </div>

            {/* Step 3: Confirm */}
            <div className={`p-6 rounded-lg border-2 border-dashed transition-all text-center ${isFullyAuthed || alreadyLinked ? 'border-green-500 bg-green-50' : 'border-gray-300'}`}>
              {isFullyAuthed ? (
                <div className="space-y-2">
                  <p className="text-sm font-bold text-green-700">All set!</p>
                  <p className="text-xs text-green-600">Taking you to your dashboard...</p>
                </div>
              ) : alreadyLinked ? (
                <div className="space-y-2">
                  <p className="text-sm font-bold text-green-700">This wallet is already linked to your account.</p>
                  <Link href="/profile" className="text-xs text-blue-600 underline">Manage your wallets</Link>
                </div>
              ) : (
                <div className="space-y-4">
                  <p className="text-sm text-secondary">Sign a message to confirm your wallet. Nothing is sent on-chain — this just proves you own it.</p>
                  <button onClick={handleLinkIdentity} disabled={!currentUser || !anyWalletConnected || isLinking}
                    className="w-full py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-bold rounded-lg shadow-md hover:from-blue-700 hover:to-purple-700 disabled:opacity-30 disabled:grayscale transition-all">
                    {isLinking ? 'Waiting for wallet...' : 'Confirm & Continue'}
                  </button>
                  {!currentUser && <p className="text-xs text-gray-400">Connect GitHub first (step 1)</p>}
                  {currentUser && !anyWalletConnected && <p className="text-xs text-gray-400">Connect a wallet (step 2)</p>}
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
