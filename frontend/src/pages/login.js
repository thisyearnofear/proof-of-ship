import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/router";
import Link from "next/link";
import { useUser } from "@/contexts/UserContext";
import { useWallet } from "@/contexts/WalletContext";
import Head from "next/head";
import SnsIdentityBadge from "@/components/common/SnsIdentityBadge";
import { snsService } from "@/services/SnsService";

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
    syncEip6963Account,
  } = useWallet();

  const router = useRouter();
  const { redirect } = router.query;

  const [error, setError] = useState(null);
  const [isSigningIn, setIsSigningIn] = useState(false);
  const [isLinking, setIsLinking] = useState(false);
  const [linked, setLinked] = useState(false);
  const [walletFamily, setWalletFamily] = useState(() => {
    // Auto-detect wallet family from already-connected wallet
    if (typeof window !== 'undefined') {
      // Will be properly set once mounted and wallet state syncs
    }
    return null;
  });
  const [role, setRole] = useState(null);
  const [mounted, setMounted] = useState(false);
  const [evmProviders, setEvmProviders] = useState([]);
  const [evmPickerOpen, setEvmPickerOpen] = useState(false);
  const [connectedSnsName, setConnectedSnsName] = useState(null);

  useEffect(() => { setMounted(true); }, []);

  // Auto-detect walletFamily when wallet is already connected (nav showed it)
  useEffect(() => {
    if (!walletFamily) {
      if (solanaConnected && solanaAddress) {
        setWalletFamily('solana');
      } else if (evmConnected && evmAddress) {
        setWalletFamily('evm');
      }
    }
  }, [solanaConnected, solanaAddress, evmConnected, evmAddress, walletFamily]);

  // If wallet is already linked (returning user), mark as linked so redirect works
  useEffect(() => {
    if (alreadyLinked && currentUser && !linked) {
      setLinked(true);
    }
  }, [alreadyLinked, currentUser, linked]);

  // Resolve .sol name when a Solana wallet connects
  useEffect(() => {
    if (walletFamily === 'solana' && solanaAddress) {
      snsService.resolveAddressToName(solanaAddress).then(setConnectedSnsName).catch(() => {});
    } else {
      setConnectedSnsName(null);
    }
  }, [walletFamily, solanaAddress]);

  // EIP-6963 multi-wallet discovery for EVM. Many users have Rabby/Coinbase/Brave/etc.
  // alongside MetaMask; relying on `window.ethereum` alone is unreliable.
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const onAnnounce = (event) => {
      const detail = event.detail;
      if (!detail?.info?.uuid) return;
      setEvmProviders((prev) => {
        if (prev.find((p) => p.info.uuid === detail.info.uuid)) return prev;
        return [...prev, detail];
      });
    };
    window.addEventListener('eip6963:announceProvider', onAnnounce);
    window.dispatchEvent(new Event('eip6963:requestProvider'));
    return () => window.removeEventListener('eip6963:announceProvider', onAnnounce);
  }, []);

  const anyWalletConnected = evmConnected || solanaConnected;
  const activeWalletAddress = walletFamily === 'solana' ? solanaAddress : evmAddress;
  const alreadyLinked = activeWalletAddress && linkedWallets.some(w => w.address.toLowerCase() === activeWalletAddress.toLowerCase());
  const isFullyAuthed = !!currentUser && anyWalletConnected && linked;

  // ─── Render ───────────────────────────────────────────────────────────────
  if (evmPickerOpen) return (
    <>
      <Head><title>Choose Wallet - Proof of Ship</title></Head>
      {renderEvmPicker()}
    </>
  );

  // ─── Helpers used in render ────────────────────────────────────────────────
  const hasInjectedEvm = mounted && typeof window !== 'undefined' && !!window.ethereum;
  const evmWalletCount = Math.max(evmProviders.length, hasInjectedEvm ? 1 : 0);

  // Determine active address/provider for sign flows. When connected via EIP-6963
  // directly, the provider is not wrapped by the SDK, so we read from window.ethereum.
  const getEip6963Provider = () => {
    if (walletFamily !== 'evm') return null;
    return window.ethereum;
  };

  useEffect(() => {
    if (isFullyAuthed || (alreadyLinked && currentUser)) {
      const dest = redirect || (role === 'backer' ? '/back' : '/build');
      const timer = setTimeout(() => router.push(dest), 1500);
      return () => clearTimeout(timer);
    }
  }, [isFullyAuthed, alreadyLinked, currentUser, redirect, router, role]);

  useEffect(() => {
    if (userRole && !role) setRole(userRole);
  }, [userRole, role]);

  const signWalletMessage = useCallback(async () => {
    if (!anyWalletConnected || !activeWalletAddress) throw new Error('No wallet connected');
    const identifier = currentUser?.providerData?.find(p => p.providerId === 'github.com')?.uid
      || currentUser?.displayName || activeWalletAddress;
    const message = `Proof of Ship - Verify Identity\n\nIdentifier: ${identifier}\nWallet: ${activeWalletAddress}\nTimestamp: ${Date.now()}`;
    let signature;
    if (walletFamily === 'solana') {
      if (!solanaWallet?.signMessage) throw new Error('Your Solana wallet does not support message signing');
      const encoded = new TextEncoder().encode(message);
      const sigBytes = await solanaWallet.signMessage(encoded);
      signature = Buffer.from(sigBytes).toString('base64');
    } else {
      const signProvider = getEip6963Provider() || provider;
      if (!signProvider) throw new Error('Wallet provider not available. Try refreshing.');
      signature = await signProvider.request({ method: 'personal_sign', params: [message, activeWalletAddress] });
    }
    return { signature, message };
  }, [anyWalletConnected, activeWalletAddress, currentUser, walletFamily, solanaWallet, provider]);

  const handleGithubLogin = async () => {
    try { setError(null); setIsSigningIn(true); await signInWithGithub(); }
    catch { setError("GitHub sign-in was cancelled or failed."); }
    finally { setIsSigningIn(false); }
  };

  const handleConnectEvm = async () => {
    // If EIP-6963 detected multiple wallets, show picker instead of SDK
    if (evmProviders.length > 1) {
      setEvmPickerOpen(true);
      return;
    }
    try {
      setError(null);
      await connectEvm();
      setWalletFamily('evm');
    } catch {
      if (!hasInjectedEvm && evmProviders.length === 0) {
        setError("No EVM wallet detected. Install MetaMask, Rabby, or Coinbase Wallet to continue.");
      } else {
        setError("Could not connect. Make sure your wallet is unlocked and try again.");
      }
    }
  };

  const handleEip6963Connect = async (providerInfo) => {
    setEvmPickerOpen(false);
    try {
      setError(null);
      await providerInfo.provider.request({ method: 'eth_requestAccounts' });
      // Sync into WalletContext so `account`/`connected`/`provider` stay consistent
      await syncEip6963Account(providerInfo.provider);
      setWalletFamily('evm');
    } catch (err) {
      if (err.code === 4001) {
        setError("Connection was rejected. Open your wallet and try again.");
      } else {
        setError(err.message || "Could not connect to wallet. Try again.");
      }
    }
  };

  // ─── EIP-6963 wallet picker modal ─────────────────────────────────────────
  const renderEvmPicker = () => (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm mx-4 p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold text-primary">Choose EVM Wallet</h3>
          <button onClick={() => setEvmPickerOpen(false)}
            className="p-1 text-gray-400 hover:text-gray-600 transition-colors">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <p className="text-sm text-secondary mb-4">Multiple EVM wallets detected. Pick one:</p>
        <div className="space-y-2">
          {evmProviders.map((provider) => (
            <button
              key={provider.info.uuid}
              onClick={() => handleEip6963Connect(provider)}
              className="w-full flex items-center gap-3 p-3 rounded-xl border border-gray-200 hover:border-orange-400 hover:bg-orange-50 transition-all text-left group"
            >
              {provider.info.icon && (
                <img src={provider.info.icon} alt={provider.info.name} className="w-8 h-8 rounded-full" />
              )}
              <div>
                <p className="text-sm font-bold text-primary">{provider.info.name}</p>
                <p className="text-xs text-secondary">{provider.info.shortName || provider.info.name}</p>
              </div>
            </button>
          ))}
        </div>
        <button onClick={() => { setEvmPickerOpen(false); handleConnectEvm(); }}
          className="mt-4 w-full py-2 text-sm text-gray-500 hover:text-gray-700 transition-colors">
          Use any wallet (SDK fallback)
        </button>
      </div>
    </div>
  );

  const handleConnectSolana = async () => {
    try { setError(null); await connectSolana(); setWalletFamily('solana'); }
    catch { setError("Could not open the Solana wallet picker. Try refreshing the page."); }
  };

  const handleLinkIdentity = async () => {
    if (!currentUser || !anyWalletConnected || !activeWalletAddress) return;
    try { setError(null); setIsLinking(true); const { signature, message } = await signWalletMessage(); await linkWallet(activeWalletAddress, signature, message, walletFamily); setLinked(true); }
    catch (err) { setError(err.message || "Wallet verification failed. Try again."); }
    finally { setIsLinking(false); }
  };

  const handleWalletSignIn = async () => {
    if (!anyWalletConnected || !activeWalletAddress) return;
    try { setError(null); setIsLinking(true); const { signature, message } = await signWalletMessage(); await signInWithWallet(activeWalletAddress, signature, message, walletFamily); setLinked(true); }
    catch (err) { setError(err.message || "Wallet verification failed. Try again."); }
    finally { setIsLinking(false); }
  };

  const renderWalletButtons = () => {
    if (!mounted) return <div className="text-sm text-gray-400">Loading wallets...</div>;
    // Always show both options. Wallet detection is unreliable (extensions inject
    // asynchronously, multiple-wallet conflicts, Wallet-Standard / EIP-6963 quirks).
    // The wallet's own connect flow handles missing-extension cases gracefully:
    //   - MetaMask SDK falls through to any injected EVM provider, or shows install prompt.
    //   - Solana wallet-adapter opens a modal that auto-discovers Phantom/Solflare/Backpack
    //     and any Wallet-Standard wallet currently installed.
    return (
      <div className="flex flex-col items-stretch gap-2 w-full sm:w-auto sm:min-w-[260px]">
        <div className="flex gap-2">
          <button
            onClick={handleConnectEvm}
            disabled={evmConnecting}
            title="MetaMask, Rabby, Coinbase Wallet, Brave, Frame, etc."
            className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-orange-500 text-white text-sm font-medium rounded-lg hover:bg-orange-600 disabled:opacity-50 transition-all"
          >
            {evmConnecting ? <span className="animate-spin">{'\u23F3'}</span> : <>{'\u{1F98A}'} EVM Wallet</>}
          </button>
          <button
            onClick={handleConnectSolana}
            disabled={solanaConnecting}
            title="Phantom, Solflare, Backpack, etc."
            className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-purple-600 text-white text-sm font-medium rounded-lg hover:bg-purple-700 disabled:opacity-50 transition-all"
          >
            {solanaConnecting ? <span className="animate-spin">{'\u23F3'}</span> : <>{'\u{1F47B}'} Solana Wallet</>}
          </button>
        </div>
        <p className="text-[11px] text-gray-400 text-center leading-snug">
          {evmWalletCount > 0
            ? `${evmWalletCount} EVM wallet${evmWalletCount === 1 ? '' : 's'} detected · `
            : 'No EVM wallet detected · '}
          Solana wallets are picked from a list.{' '}
          <a href="https://metamask.io" target="_blank" rel="noopener noreferrer" className="text-blue-600 underline">Install MetaMask</a>
          {' · '}
          <a href="https://phantom.app" target="_blank" rel="noopener noreferrer" className="text-purple-600 underline">Install Phantom</a>
        </p>
      </div>
    );
  };

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
              <h3 className="text-lg font-bold text-primary group-hover:text-purple-700">I&apos;m Staking</h3>
              <p className="text-sm text-secondary mt-1">Fund builders and track your portfolio.</p>
              <p className="text-xs text-gray-400 mt-3">Wallet only — no GitHub needed</p>
            </button>
          </div>
          <p className="mt-6 text-center text-xs text-gray-400">You can always add more later in your profile.</p>
        </div>
      </div>
    );
  }

  if (role === 'backer') {
    return (
      <div className="min-h-[80vh] flex flex-col justify-center py-12 sm:px-6 lg:px-8 bg-background">
        <Head><title>Sign In - Proof of Ship</title></Head>
        <div className="sm:mx-auto sm:w-full sm:max-w-md">
          <img className="mx-auto h-16 w-16 rounded shadow-lg" src="/POS.png" alt="Proof of Ship" />
          <h2 className="mt-6 text-center text-3xl font-extrabold text-primary">Connect Your Wallet</h2>
          <p className="mt-2 text-center text-sm text-secondary">This is your identity on Proof of Ship. You&apos;ll sign a message to prove you own it.</p>
        </div>
        <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-lg">
          <div className="bg-surface py-8 px-4 shadow-xl border border-gray-100 sm:rounded-xl sm:px-10">
            {error && <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4 text-sm text-red-700">{error}</div>}
            <div className="space-y-6">
              <div className={`p-4 rounded-lg border-2 transition-all ${anyWalletConnected ? 'border-green-500 bg-green-50' : 'border-gray-200'}`}>
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center">
                    <div className={`p-2 rounded-full ${anyWalletConnected ? 'bg-green-500 text-white' : 'bg-gray-100 text-gray-400'}`}>
                      {anyWalletConnected ? (
                        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                      ) : <span className="text-xs font-bold">1</span>}
                    </div>
                    <div className="ml-3">
                      <p className="text-sm font-bold text-primary">Your Wallet</p>
                      <p className="text-xs text-secondary">
                        {anyWalletConnected && activeWalletAddress ? `Connected: ${connectedSnsName || `${activeWalletAddress.slice(0,6)}...${activeWalletAddress.slice(-4)}`}` : 'Where you receive funds'}
                      </p>
                    </div>
                  </div>
                  {!anyWalletConnected && renderWalletButtons()}
                </div>
              </div>

              <div className={`p-6 rounded-lg border-2 border-dashed transition-all text-center ${isFullyAuthed ? 'border-green-500 bg-green-50' : 'border-gray-300'}`}>
                {isFullyAuthed ? (
                  <div className="space-y-2">
                    <p className="text-sm font-bold text-green-700">You're in!</p>
                    <p className="text-xs text-green-600">Taking you to your dashboard...</p>
                  </div>
                ) : alreadyLinked ? (
                  <div className="space-y-2">
                    <p className="text-sm font-bold text-green-700">This wallet is already linked to your account.</p>
                    <Link href="/profile" className="text-xs text-blue-600 underline">Manage your wallets</Link>
                  </div>
                ) : anyWalletConnected ? (
                  <div className="space-y-3">
                    <p className="text-sm text-secondary">Your wallet is connected. Sign in:</p>
                    <button onClick={handleWalletSignIn} disabled={isLinking}
                      className="w-full py-3 bg-gradient-to-r from-purple-600 to-blue-600 text-white font-bold rounded-lg shadow-md hover:from-purple-700 hover:to-blue-700 disabled:opacity-30 disabled:grayscale transition-all">
                      {isLinking ? 'Waiting for wallet...' : 'Sign In with Wallet'}
                    </button>
                  </div>
                ) : (
                  <p className="text-sm text-secondary">Connect a wallet above to sign in.</p>
                )}
              </div>

              <button onClick={() => setRole(null)} className="text-sm text-gray-500 hover:text-gray-700">{'\u2190'} Back</button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[80vh] flex flex-col justify-center py-12 sm:px-6 lg:px-8 bg-background">
      <Head><title>Sign In - Proof of Ship</title></Head>
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <img className="mx-auto h-16 w-16 rounded shadow-lg" src="/POS.png" alt="Proof of Ship" />
        <h2 className="mt-6 text-center text-3xl font-extrabold text-primary">Set Up Your Builder Profile</h2>
        <p className="mt-2 text-center text-sm text-secondary">Two quick steps to verify your identity and start shipping.</p>
      </div>
      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-lg">
        <div className="bg-surface py-8 px-4 shadow-xl border border-gray-100 sm:rounded-xl sm:px-10">
          {error && <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4 text-sm text-red-700">{error}</div>}
          <div className="space-y-6">
            <div className={`p-4 rounded-lg border-2 transition-all ${currentUser ? 'border-green-500 bg-green-50' : 'border-gray-200'}`}>
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <div className={`p-2 rounded-full ${currentUser ? 'bg-green-500 text-white' : 'bg-gray-100 text-gray-400'}`}>
                    {currentUser ? <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg> : <span className="text-xs font-bold">1</span>}
                  </div>
                  <div className="ml-3">
                    <p className="text-sm font-bold text-primary">GitHub</p>
                    <p className="text-xs text-secondary">{currentUser ? `Signed in as ${currentUser.displayName}` : 'We read your public repos to verify your shipping history.'}</p>
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

            <div className={`p-4 rounded-lg border-2 transition-all ${anyWalletConnected ? 'border-green-500 bg-green-50' : 'border-gray-200'}`}>
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center">
                  <div className={`p-2 rounded-full ${anyWalletConnected ? 'bg-green-500 text-white' : 'bg-gray-100 text-gray-400'}`}>
                    {anyWalletConnected ? <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg> : <span className="text-xs font-bold">2</span>}
                  </div>
                  <div className="ml-3">
                    <p className="text-sm font-bold text-primary">Wallet</p>
                    <p className="text-xs text-secondary">{anyWalletConnected && activeWalletAddress ? `Connected: ${connectedSnsName || `${activeWalletAddress.slice(0,6)}...${activeWalletAddress.slice(-4)}`}` : 'Where you receive funding payouts.'}</p>
                  </div>
                </div>
                {!anyWalletConnected && renderWalletButtons()}
              </div>
            </div>

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

            <button onClick={() => setRole(null)} className="text-sm text-gray-500 hover:text-gray-700">{'\u2190'} Back</button>
          </div>
        </div>
      </div>
    </div>
  );
}
