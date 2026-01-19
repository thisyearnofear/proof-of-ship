import React, { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { db } from '@/lib/firebase/clientApp';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import ethosService from '@/services/EthosService';
import { EthosScoreBadge, EthosProfileLink } from '@/components/ethos';

export default function UserProfile() {
  const { currentUser, logout, userPermissions } = useAuth();

  const [githubUsername, setGithubUsername] = useState('');
  const [walletAddress, setWalletAddress] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [ethosUser, setEthosUser] = useState(null);
  const [ethosLoading, setEthosLoading] = useState(false);

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
          const wallet = String(data.walletAddress || '');
          setWalletAddress(wallet);
          
          // Fetch Ethos score if wallet address exists
          if (wallet && !cancelled) {
            setEthosLoading(true);
            try {
              const ethosData = await ethosService.getScoresByAddress(wallet);
              if (!cancelled) setEthosUser(ethosData);
            } catch (e) {
              console.error('Failed to fetch Ethos score:', e);
            } finally {
              if (!cancelled) setEthosLoading(false);
            }
          }
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

  const handleLogout = async () => {
    try { await logout(); } catch (error) { console.error('Failed to log out', error); }
  };

  const onSave = async (e) => {
    e.preventDefault();
    if (!currentUser?.uid) return;
    try {
      setSaving(true); setError(null); setSuccess(null);
      // Basic validation
      const gh = githubUsername.trim();
      const wa = walletAddress.trim();
      if (gh && !/^([A-Za-z0-9-]{1,39})$/.test(gh)) {
        setError('Invalid GitHub username format');
        setSaving(false);
        return;
      }
      if (wa && !/^0x[a-fA-F0-9]{40}$/.test(wa)) {
        setError('Invalid wallet address');
        setSaving(false);
        return;
      }

      const userRef = doc(db, 'users', currentUser.uid);
      await setDoc(userRef, {
        githubUsername: gh || null,
        walletAddress: wa || null,
      }, { merge: true });

      setSuccess('Profile updated');
      
      // Fetch Ethos score for new wallet address
      if (wa) {
        setEthosLoading(true);
        try {
          const ethosData = await ethosService.getScoresByAddress(wa);
          setEthosUser(ethosData);
        } catch (e) {
          console.error('Failed to fetch Ethos score:', e);
        } finally {
          setEthosLoading(false);
        }
      } else {
        setEthosUser(null);
      }
    } catch (e) {
      console.error(e);
      setError('Failed to save profile');
    } finally {
      setSaving(false);
    }
  };

  if (!currentUser) return null;

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex items-center space-x-4 mb-6">
        {currentUser.photoURL && (
          <img src={currentUser.photoURL} alt={currentUser.displayName || 'User'} className="w-16 h-16 rounded-full" />
        )}
        <div className="flex-1">
          <h2 className="text-xl font-semibold">{currentUser.displayName}</h2>
          <p className="text-gray-600">{currentUser.email}</p>
          {githubUsername && (
            <p className="text-sm text-gray-500">
              Portfolio: <a href={`/u/${githubUsername}`} className="text-blue-600 underline">/u/{githubUsername}</a>
            </p>
          )}
          
          {/* Ethos Credibility Score */}
          {walletAddress && (
            <div className="mt-2">
              {ethosLoading ? (
                <div className="text-sm text-gray-500">Loading Ethos score...</div>
              ) : ethosUser ? (
                <div className="flex items-center gap-2">
                  <EthosScoreBadge 
                    score={ethosUser.score} 
                    ethosUser={ethosUser}
                    size="sm"
                  />
                  <EthosProfileLink 
                    address={walletAddress}
                    username={ethosUser.username}
                    className="text-xs"
                  >
                    View Details
                  </EthosProfileLink>
                </div>
              ) : (
                <div className="text-sm text-gray-500">
                  <EthosScoreBadge score={null} size="sm" />
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      <form onSubmit={onSave} className="space-y-4 mb-6">
        {error && <div className="text-sm text-red-600">{error}</div>}
        {success && <div className="text-sm text-green-700">{success}</div>}

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

        <div>
          <label className="block text-sm font-medium text-gray-700">Wallet address</label>
          <input
            className="mt-1 block w-full border rounded p-2 font-mono"
            placeholder="0x..."
            value={walletAddress}
            onChange={(e) => setWalletAddress(e.target.value)}
          />
          <p className="text-xs text-gray-500 mt-1">Saved for payouts and auto-fill in approvals.</p>
        </div>

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
