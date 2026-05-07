/**
 * Backing Panel Component
 * Allows backers to stake on projects with multipliers
 */

import React, { useState, useEffect } from 'react';
import { useWallet, useBuilderCredit } from '../contexts/WalletContext';
import { Card } from './common/Card';
import Button from './common/Button';
import { LoadingSpinner, MarketConfidenceSkeleton } from './common/LoadingStates';
import SnsIdentityBadge from '@/components/common/SnsIdentityBadge';
import { BuilderTrustFull } from '@/components/common/BuilderTrust';
import { isValidSolanaAddress } from '@/utils/common';
import { useTorqueIncentives } from '@/hooks/useTorqueIncentives';
import {
  BanknotesIcon,
  RocketLaunchIcon,
  ShieldCheckIcon,
  UsersIcon
} from '@heroicons/react/24/outline';
import { PrivacyInline, PrivacyBadge } from './common/PrivacyShield';

export default function BackingPanel({ projectId, developerAddress, builderSnsDomain }) {
  const wallet = useWallet();
  const { getUSDCBalanceAsync, backProject: backProjectFn } = useBuilderCredit();
  const { incentives } = useTorqueIncentives();
  const showBuilderIdentity = isValidSolanaAddress(developerAddress || '');

  const [amount, setAmount] = useState('');
  const [multiplier, setMultiplier] = useState(200); // Default 2x (200)
  const [loading, setLoading] = useState(false);
  const [backingLoading, setBackingLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [userBalance, setUserBalance] = useState('0');
  const [totalBacking, setTotalBacking] = useState('0');
  const [backerCount, setBackerCount] = useState(0);
  const [maxAllowedMultiplier, setMaxAllowedMultiplier] = useState(300);
  const [privateMode, setPrivateMode] = useState(false);

  const loadUserBalance = async () => {
    try {
      const balance = await getUSDCBalanceAsync();
      setUserBalance(balance || '0');
    } catch (err) {
      console.error("Failed to load USDC balance:", err);
      setUserBalance('0');
    }
  };

  useEffect(() => {
    if (wallet.account) {
      loadUserBalance();
    }
  }, [wallet.account, getUSDCBalanceAsync]);

  // Load project backing data from contracts with proper cleanup
  useEffect(() => {
    if (!projectId || !wallet.account || typeof wallet.chainId !== 'number' || !wallet.signer) {
      return;
    }

    let cancelled = false;
    setBackingLoading(true);

    async function loadProjectData() {
      try {
        const { creditService } = await import('@/services/creditService');
        const backingData = await creditService.getProjectBackingData(
          wallet.chainId,
          wallet.signer,
          projectId
        );

        if (cancelled) return;

        setTotalBacking(backingData.totalBacking);
        setMaxAllowedMultiplier(backingData.maxMultiplier);
        setBackerCount(backingData.backerCount);

        // Update multiplier if currently selected exceeds new max
        setMultiplier(prev => {
          if (backingData.maxMultiplier && backingData.maxMultiplier < prev) {
            return backingData.maxMultiplier;
          }
          return prev;
        });
      } catch (err) {
        console.warn('Failed to load project backing data:', err);
        if (!cancelled) {
          // Set defaults on error
          setTotalBacking('0');
          setMaxAllowedMultiplier(300);
          setBackerCount(0);
        }
      } finally {
        if (!cancelled) {
          setBackingLoading(false);
        }
      }
    }

    loadProjectData();

    // Cleanup function to prevent state updates after unmount
    return () => { cancelled = true; };
  }, [projectId, wallet.account, wallet.chainId, wallet.signer]);

  const handleBackProject = async () => {
    if (!wallet.account) {
      setError("Please connect your wallet");
      return;
    }

    if (!amount || parseFloat(amount) <= 0) {
      setError("Please enter a valid amount");
      return;
    }

    if (!projectId) {
      setError("Project not available");
      return;
    }

    try {
      setLoading(true);
      setError(null);
      setSuccess(null);

      if (privateMode && wallet.solanaWallet) {
        // Cloak shielded staking — hide amounts from public ledger
        // Cloak's Groth16 proof generation requires a Keypair (not browser wallet adapter)
        // So we: 1) Generate ephemeral Keypair, 2) Fund it via browser wallet, 3) Use with Cloak
        const { cloakPaymentService } = await import('@/services/CloakPaymentService');
        const { Keypair: KP, SystemProgram, Transaction: Tx } = await import('@solana/web3.js');
        const ephemeral = KP.generate();
        const amountLamports = BigInt(Math.round(parseFloat(amount) * 1_000_000)); // USDC has 6 decimals
        const recipient = new (await import('@solana/web3.js')).PublicKey(developerAddress);

        // Fund the ephemeral keypair with SOL for tx fees via browser wallet
        const fundTx = new Tx().add(
          SystemProgram.transfer({
            fromPubkey: wallet.solanaWallet.publicKey,
            toPubkey: ephemeral.publicKey,
            lamports: 0.01 * 1e9, // 0.01 SOL for fees
          })
        );
        fundTx.recentBlockhash = (await wallet.solanaWallet.connection?.getRecentBlockhash?.())?.recentBlockhash;
        const signedFundTx = await wallet.solanaWallet.signTransaction(fundTx);
        const conn = (await import('@/contexts/wallet/constants')).getSolanaConnection();
        await conn.sendRawTransaction(signedFundTx.serialize());

        const result = await cloakPaymentService.privateStake(
          ephemeral,
          amountLamports,
          recipient,
        );
        setSuccess(`Private stake sent! Amount shielded via Cloak.`);
      } else {
        // Standard public staking
        const txHash = await backProjectFn(projectId, multiplier, amount);
        setSuccess(`Successfully backed project! Transaction: ${txHash.slice(0, 10)}...`);
      }

      setAmount('');
      loadUserBalance();
      // Reload project backing data after successful backing
      loadProjectBackingData();
      // Torque event — fire and forget
      import('@/services/TorqueService').then(({ torqueService }) => {
        torqueService.trackProjectBacked(wallet.account, {
          projectId,
          amountUsdc: amount,
        });
      }).catch(() => {});
    } catch (err) {
      console.error("Backing failed:", err);
      setError(err.message || "Failed to back project");
    } finally {
      setLoading(false);
    }
  };

  const multipliers = [
    { label: '1.5x', value: 150, risk: 'Low Risk' },
    { label: '2x', value: 200, risk: 'Medium Risk' },
    { label: '3x', value: 300, risk: 'High Risk' },
  ];

  return (
    <Card className="p-6">
      <div className="flex items-center mb-4">
        <RocketLaunchIcon className="w-6 h-6 text-indigo-600 mr-2" />
        <div className="flex-1">
          <h3 className="text-lg font-bold text-gray-900">Stake on This Builder</h3>
          {showBuilderIdentity && (
            <div className="text-sm text-gray-600 mt-1">
              Backing{" "}
              <SnsIdentityBadge
                address={developerAddress}
                snsNameOverride={builderSnsDomain || null}
                chainFamily="solana"
                showFallback={true}
                showLoading={true}
                className="text-sm"
              />
            </div>
          )}
        </div>
      </div>

      <p className="text-sm text-gray-600 mb-4">
        Boost this builder&apos;s credit limit and earn rewards. Your stake is repaid with interest when the builder wins prizes. Position amounts are shielded via Cloak.
      </p>

      {/* Trust signal — on-chain reputation before committing capital */}
      {showBuilderIdentity && (
        <BuilderTrustFull address={developerAddress} className="mb-5" />
      )}

      {/* Active Torque incentives — show what backers can earn */}
      {incentives.length > 0 && (
        <div className="mb-5 rounded-lg border border-emerald-200 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-900/20 p-3">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-emerald-700 dark:text-emerald-300 text-xs font-bold uppercase tracking-wider">
              Earn Rewards
            </span>
          </div>
          {incentives.slice(0, 2).map((inc) => (
            <div key={inc.id || inc.name} className="flex items-center gap-2 text-sm text-emerald-800 dark:text-emerald-200 mb-1 last:mb-0">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 flex-shrink-0" />
              <span className="font-medium">{inc.name || inc.title || "Active incentive"}</span>
              {inc.rewardToken && (
                <span className="text-xs text-emerald-600 dark:text-emerald-400 ml-auto">
                  {inc.rewardToken}
                </span>
              )}
            </div>
          ))}
        </div>
      )}

      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Select Your Reward Multiplier
        </label>
        <div className="grid grid-cols-3 gap-3">
          {multipliers.map((m) => {
            const isDisabled = m.value > maxAllowedMultiplier;
            return (
              <button
                key={m.value}
                onClick={() => !isDisabled && setMultiplier(m.value)}
                disabled={isDisabled}
                className={`p-3 border rounded-lg flex flex-col items-center transition-all min-h-touch ${
                  multiplier === m.value
                    ? 'border-indigo-600 bg-indigo-50 text-indigo-700 ring-1 ring-indigo-600'
                    : isDisabled
                      ? 'border-gray-100 bg-gray-50 text-gray-400 cursor-not-allowed'
                      : 'border-gray-200 hover:border-indigo-300 text-gray-600'
                }`}
              >
                <span className="text-lg font-bold">{m.label}</span>
                <span className="text-xs opacity-75">{isDisabled ? 'Locked' : m.risk}</span>
              </button>
            );
          })}
        </div>
        {maxAllowedMultiplier < 300 && (
          <p className="mt-2 text-xs text-amber-600">
            Higher multipliers are restricted based on this builder&apos;s current reputation.
          </p>
        )}
      </div>

      <div className="mb-6">
        <div className="flex justify-between mb-2">
          <label className="block text-sm font-medium text-gray-700">
            Amount to Stake (USDC)
          </label>
          <span className="text-xs text-gray-500">
            Balance: {parseFloat(userBalance).toFixed(2)} USDC
          </span>
        </div>
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <BanknotesIcon className="h-5 w-5 text-gray-400" />
          </div>
          <input
            type="number"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className="block w-full pl-10 pr-12 py-3 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
            placeholder="0.00"
          />
          <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
            <button
              onClick={() => setAmount(userBalance)}
              className="text-xs font-semibold text-indigo-600 hover:text-indigo-500"
            >
              MAX
            </button>
          </div>
        </div>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-50 text-red-700 text-sm rounded-lg border border-red-100">
          {error}
        </div>
      )}

      {success && (
        <div className="mb-4 p-3 bg-green-50 text-green-700 text-sm rounded-lg border border-green-100">
          {success}
        </div>
      )}

      {/* Privacy guarantee for Solana wallets — positions are shielded by default */}
      {wallet.solanaConnected && (
        <PrivacyInline isPrivate={true} className="mb-4" />
      )}

      <Button
        onClick={handleBackProject}
        disabled={loading}
        className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-3 rounded-lg font-bold min-h-touch"
      >
        {loading ? (
          <div className="flex items-center justify-center">
            <LoadingSpinner size="sm" className="mr-2" />
            Processing...
          </div>
        ) : (
          `Stake USDC (${multiplier/100}x Reward)`
        )}
      </Button>

      <div className="mt-6 pt-6 border-t border-gray-100">
        {backingLoading ? (
          <MarketConfidenceSkeleton />
        ) : (
          <>
            <div className="flex justify-between items-center">
              <div className="flex items-center text-sm text-gray-500">
                <ShieldCheckIcon className="w-4 h-4 mr-1 text-green-500" />
                Backer Confidence
              </div>
              <div className="text-sm font-bold text-gray-900">
                ${parseFloat(totalBacking || 0).toFixed(2)} USDC
              </div>
            </div>
            <div className="mt-2 w-full bg-gray-100 rounded-full h-2">
              <div 
                className="bg-indigo-500 h-2 rounded-full transition-all duration-500" 
                style={{ width: `${Math.min(100, (parseFloat(totalBacking || 0) / 5000) * 100)}%` }}
              ></div>
            </div>
            {backerCount > 0 && (
              <div className="mt-3 flex items-center text-xs text-gray-500">
                <UsersIcon className="w-3 h-3 mr-1" />
                {backerCount} backer{backerCount !== 1 ? 's' : ''} supporting this project
              </div>
            )}
          </>
        )}
      </div>
    </Card>
  );
}
