import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useUser } from '@/contexts/UserContext';
import { useWallet } from '@/contexts/WalletContext';
import { sdk } from '@farcaster/miniapp-sdk';
import { db } from '@/lib/firebase/clientApp';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import ethosService from '@/services/EthosService';
import { EthosScoreBadge, EthosProfileLink } from '@/components/ethos';

export default function UserProfile() {
  const { currentUser, logout, userPermissions, linkedWallets, unlinkWallet, userRole } = useUser();
  const { disconnect: disconnectEvm, disconnectSolana } = useWallet();

  const [githubUsername, setGithubUsername] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [ethosUser, setEthosUser] = useState(null);
  const [ethosLoading, setEthosLoading] = useState(false);
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);
  const [isFrame, setIsFrame] = useState(false);
  const [unlinking, setUnlinking] = useState(null);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setIsFrame(true);
    }
  }, []);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      if (!currentUser?.uid) { setLoading(false); return; }
      try {
        setError(null);
        const userRef = doc(db, 'users', currentUser.uid);
        const snap = await getDoc(userRef);
        if (!cancelled && snap.exists()) {
          const data = snap.data();
          setGithubUsername(String(data.githubUsername || ''));
          setNotificationsEnabled(!!data.notificationsEnabled);
        }
      } catch (e) {
        if (!cancelled) setError('Failed to load profile');
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => { cancelled = true; };
  }, [currentUser?.uid]);

  // Fetch Ethos score when linked wallets change
  useEffect(() => {
    if (linkedWallets.length === 0) { setEthosUser(null); return; }
    let cancelled = false;
    const primary = linkedWallets[0];
    setEthosLoading(true);
    ethosService.getScoresByAddress(primary.address)
      .then(data => { if (!cancelled) setEthosUser(data); })
      .catch(() => {})
      .finally(() => { if (!cancelled) setEthosLoading(false); });
    return () => { cancelled = true; };
  }, [linkedWallets]);

  const handleLogout = async () => {
    try {
      disconnectEvm();
      disconnectSolana();
      await logout();
    } catch (error) {
      console.error('Failed to log out', error);
    }
  };

  const handleUnlink = async (address) => {
    try {
      setUnlinking(address);
      setError(null);
      await unlinkWallet(address);
      setSuccess('Wallet unlinked');
    } catch (e) {
      setError('Failed to unlink wallet');
    } finally {
      setUnlinking(null);
    }
  };

  const onSave = async (e) => {
    e.preventDefault();
    if (!currentUser?.uid) return;
    try {
      setSaving(true); setError(null); setSuccess(null);
      const gh = githubUsername.trim();
      if (gh && !/^([A-Za-z0-9-]{1,39})$/.test(gh)) {
        setError('Invalid GitHub username format');
        setSaving(false);
        return;
      }

      const userRef = doc(db, 'users', currentUser.uid);
      await setDoc(userRef, {
        githubUsername: gh || null,
        notificationsEnabled,
      }, { merge: true });

      setSuccess('Profile updated');
    } catch (e) {
      console.error(e);
      setError('Failed to save profile');
    } finally {
      setSaving(false);
    }
  };

  const handleToggleNotifications = async () => {
    try {
      if (!notificationsEnabled) {
        const context = sdk.context;
        await sdk.actions.addMiniApp();
        const userRef = doc(db, 'users', currentUser.uid);
        await setDoc(userRef, {
          notificationsEnabled: true,
          farcasterFid: context?.user?.fid || null,
        }, { merge: true });
        setNotificationsEnabled(true);
        setSuccess('Farcaster notifications enabled');
      } else {
        const userRef = doc(db, 'users', currentUser.uid);
        await setDoc(userRef, { notificationsEnabled: false }, { merge: true });
        setNotificationsEnabled(false);
        setSuccess('Notifications disabled');
      }
    } catch (e) {
      console.error('Notification toggle failed:', e);
      setError('Failed to update notification settings');
    }
  };

  const formatAddress = (addr, chainFamily) => {
    if (chainFamily === 'solana') return `${addr.slice(0, 4)}...${addr.slice(-4)}`;
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
  };

  if (!currentUser) return null;

  const isBacker = userRole === 'backer';
  const primaryWallet = linkedWallets[0]?.address;
  const displayName = currentUser.displayName || (primaryWallet ? formatAddress(primaryWallet, linkedWallets[0]?.chainFamily) : 'User');

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex items-center space-x-4 mb-6">
        {currentUser.photoURL ? (
          <img src={currentUser.photoURL} alt={displayName} className="w-16 h-16 rounded-full" />
        ) : primaryWallet ? (
          <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white text-xl font-bold">
            {primaryWallet.slice(2, 4).toUpperCase()}
          </div>
        ) : null}
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-semibold">{displayName}</h2>
            {userRole && (
              <span className={`px-2 py-0.5 text-xs font-medium rounded ${isBacker ? 'bg-purple-100 text-purple-800' : 'bg-blue-100 text-blue-800'}`}>
                {isBacker ? 'Backer' : 'Builder'}
              </span>
            )}
          </div>
          {!isBacker && currentUser.email && <p className="text-gray-600">{currentUser.email}</p>}
          {githubUsername && (
            <p className="text-sm text-gray-500">
              Portfolio: <a href={`/u/${githubUsername}`} className="text-blue-600 underline">/u/{githubUsername}</a>
            </p>
          )}

          {ethosLoading ? (
            <div className="text-sm text-gray-500 mt-2">Loading Ethos score...</div>
          ) : ethosUser ? (
            <div className="flex items-center gap-2 mt-2">
              <EthosScoreBadge score={ethosUser.score} ethosUser={ethosUser} size="sm" />
              <EthosProfileLink address={linkedWallets[0]?.address} username={ethosUser.username} className="text-xs">
                View Details
              </EthosProfileLink>
            </div>
          ) : linkedWallets.length > 0 ? (
            <div className="mt-2">
              <EthosScoreBadge score={null} size="sm" />
            </div>
          ) : null}
        </div>
      </div>

      <form onSubmit={onSave} className="space-y-4 mb-6">
        {error && <div className="text-sm text-red-600">{error}</div>}
        {success && <div className="text-sm text-green-700">{success}</div>}

        {!isBacker && (
          <div>
            <label className="block text-sm font-medium text-gray-700">GitHub username</label>
            <input
              className="mt-1 block w-full border rounded p-2"
              placeholder="e.g. thisyearnofear"
              value={githubUsername}
              onChange={(e) => setGithubUsername(e.target.value)}
            />
            <p className="text-xs text-gray-500 mt-1">Used for your portfolio subdomain and project ownership verification.</p>
          </div>
        )}

        {/* Verified Wallets */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Verified Wallets</label>
          <p className="text-xs text-gray-400 mb-2">These were verified during sign-in. Used for payouts and identity.</p>
          {linkedWallets.length === 0 ? (
            <div className="text-sm text-gray-500 py-3">
              No wallets verified yet.{' '}
              <Link href="/login" className="text-blue-600 underline">Connect a wallet</Link>
            </div>
          ) : (
            <div className="space-y-2">
              {linkedWallets.map((w) => (
                <div key={w.address} className="flex items-center justify-between p-3 bg-gray-50 rounded border">
                  <div className="flex items-center gap-2">
                    <span className={`px-2 py-0.5 text-xs font-medium rounded ${w.chainFamily === 'solana' ? 'bg-purple-100 text-purple-800' : 'bg-blue-100 text-blue-800'}`}>
                      {w.chainFamily === 'solana' ? 'Phantom' : 'MetaMask'}
                    </span>
                    <span className="font-mono text-sm">{formatAddress(w.address, w.chainFamily)}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleUnlink(w.address)}
                    disabled={unlinking === w.address}
                    className="text-xs text-red-600 hover:text-red-800 disabled:opacity-50"
                  >
                    {unlinking === w.address ? 'Removing...' : 'Remove'}
                  </button>
                </div>
              ))}
            </div>
          )}
          {linkedWallets.length > 0 && (
            <Link href="/login" className="inline-block mt-2 text-sm text-blue-600 underline">Add another wallet</Link>
          )}
        </div>

        {isFrame && (
          <div className="flex items-center justify-between p-3 bg-gray-50 rounded border">
            <div>
              <h4 className="text-sm font-medium">Farcaster Notifications</h4>
              <p className="text-xs text-gray-500">Get notified when your ships are verified</p>
            </div>
            <button
              type="button"
              onClick={handleToggleNotifications}
              className={`px-3 py-1 rounded text-xs font-medium ${
                notificationsEnabled
                  ? 'bg-green-100 text-green-800 border border-green-200'
                  : 'bg-blue-600 text-white'
              }`}
            >
              {notificationsEnabled ? 'Enabled' : 'Enable'}
            </button>
          </div>
        )}

        <div className="flex items-center gap-3">
          <button type="submit" disabled={saving} className="px-4 py-2 bg-blue-600 text-white rounded disabled:opacity-50">
            {saving ? 'Saving…' : 'Save'}
          </button>
          <button type="button" onClick={handleLogout} className="px-4 py-2 bg-gray-200 text-gray-800 rounded">Sign Out</button>
        </div>
      </form>

      {Array.isArray(userPermissions) && userPermissions.length > 0 && (
        <div className="mb-2">
          <h3 className="text-lg font-medium mb-2">Your Projects</h3>
          <ul className="space-y-2">
            {userPermissions.map((permission) => (
              <li key={permission.projectSlug} className="flex items-center justify-between">
                <span>{permission.projectName}</span>
                <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">{permission.role}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
