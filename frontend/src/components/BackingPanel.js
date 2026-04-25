/**
 * Backing Panel Component
 * Allows backers to bet on projects with multipliers
 */

import React, { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import { useWallet } from '../contexts/WalletContext';
import { useBuilderCredit } from '../contexts/WalletContext';
import { Card } from './common/Card';
import Button from './common/Button';
import { LoadingSpinner } from './common/LoadingStates';
import {
  BanknotesIcon,
  ChartBarIcon,
  RocketLaunchIcon,
  ShieldCheckIcon
} from '@heroicons/react/24/outline';

export default function BackingPanel({ projectId, developerAddress }) {
  const { account, signer, getUSDCBalance, getCurrentUSDCAddress } = useMetaMask();
  const { coreContract, usdcContract } = useBuilderCredit();

  const [amount, setAmount] = useState('');
  const [multiplier, setMultiplier] = useState(200); // Default 2x (200)
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [userBalance, setUserBalance] = useState('0');
  const [totalBacking, setTotalBacking] = useState('0');
  const [maxAllowedMultiplier, setMaxAllowedMultiplier] = useState(300);

  useEffect(() => {
    if (account) {
      loadUserBalance();
    }
  }, [account]);

  useEffect(() => {
    if (projectId && coreContract) {
      loadProjectBacking();
      loadMaxMultiplier();
    }
  }, [projectId, coreContract, loadProjectBacking, loadMaxMultiplier]);

  const loadUserBalance = async () => {
    try {
      const balance = await getUSDCBalance();
      setUserBalance(balance);
    } catch (err) {
      console.error("Failed to load USDC balance:", err);
    }
  };

  const loadMaxMultiplier = async () => {
    try {
      const project = await coreContract.projects(projectId);
      const maxMult = await coreContract.getMaxMultiplier(project.creditScore);
      setMaxAllowedMultiplier(maxMult.toNumber());
      // Adjust selected multiplier if it exceeds max
      if (multiplier > maxMult.toNumber()) {
        setMultiplier(maxMult.toNumber());
      }
    } catch (err) {
      console.error("Failed to load max multiplier:", err);
    }
  };

  const loadProjectBacking = async () => {
    try {
      const backing = await coreContract.totalProjectBacking(projectId);
      setTotalBacking(ethers.utils.formatUnits(backing, 6));
    } catch (err) {
      console.error("Failed to load project backing:", err);
    }
  };

  const handleBackProject = async () => {
    if (!account) {
      setError("Please connect your wallet");
      return;
    }

    if (!amount || parseFloat(amount) <= 0) {
      setError("Please enter a valid amount");
      return;
    }

    if (!coreContract || !usdcContract) {
      setError("Contracts not initialized");
      return;
    }

    try {
      setLoading(true);
      setError(null);
      setSuccess(null);

      const amountInUnits = ethers.utils.parseUnits(amount, 6);

      // Check allowance
      const allowance = await usdcContract.allowance(account, coreContract.address);
      if (allowance.lt(amountInUnits)) {
        const approveTx = await usdcContract.approve(coreContract.address, ethers.constants.MaxUint256);
        await approveTx.wait();
      }

      // Back project
      const tx = await coreContract.backProject(projectId, multiplier, amountInUnits);
      await tx.wait();

      setSuccess(`Successfully backed project with ${amount} USDC at ${multiplier/100}x multiplier!`);
      setAmount('');
      loadUserBalance();
      loadProjectBacking();
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
        <h3 className="text-lg font-bold text-gray-900">Backer-Driven Liquidity</h3>
      </div>

      <p className="text-sm text-gray-600 mb-6">
        Boost this builder&apos;s credit limit and earn rewards. Your stake is repaid with interest when the builder wins prizes.
      </p>

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
          `Back Project (${multiplier/100}x Reward)`
        )}
      </Button>

      <div className="mt-6 pt-6 border-t border-gray-100">
        <div className="flex justify-between items-center">
          <div className="flex items-center text-sm text-gray-500">
            <ShieldCheckIcon className="w-4 h-4 mr-1 text-green-500" />
            Market Confidence
          </div>
          <div className="text-sm font-bold text-gray-900">
            ${parseFloat(totalBacking).toFixed(2)} USDC
          </div>
        </div>
        <div className="mt-2 w-full bg-gray-100 rounded-full h-2">
          <div 
            className="bg-indigo-500 h-2 rounded-full" 
            style={{ width: `${Math.min(100, (parseFloat(totalBacking) / 5000) * 100)}%` }}
          ></div>
        </div>
      </div>
    </Card>
  );
}
