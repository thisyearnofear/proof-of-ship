/**
 * Admin Payout Simulation Tool
 * Model and execute the "waterfall" payout distribution.
 */

import React, { useState, useMemo } from 'react';
import Head from 'next/head';
import { Card } from '@/components/common/Card';
import Button from '@/components/common/Button';
import { 
  CalculatorIcon, 
  ArrowPathIcon, 
  BanknotesIcon,
  UserGroupIcon,
  BeakerIcon,
  CheckBadgeIcon
} from '@heroicons/react/24/outline';

export default function PayoutSimulationPage() {
  const [prizePool, setPrizePool] = useState(10000);
  const [tiers, setTiers] = useState({
    tier1: { multiplier: 1.5, backers: 10, stakePerBacker: 100 },
    tier2: { multiplier: 2.0, backers: 5, stakePerBacker: 200 },
    tier3: { multiplier: 3.0, backers: 2, stakePerBacker: 500 },
  });

  const simulationResults = useMemo(() => {
    let remainingPool = prizePool;
    const distribution = {
      tier1: { totalRequested: 0, fulfilled: 0 },
      tier2: { totalRequested: 0, fulfilled: 0 },
      tier3: { totalRequested: 0, fulfilled: 0 },
      builder: 0,
      treasury: 0,
    };

    // Calculate Tiers
    ['tier1', 'tier2', 'tier3'].forEach(t => {
      const tierData = tiers[t];
      const totalRequested = tierData.backers * tierData.stakePerBacker * tierData.multiplier;
      distribution[t].totalRequested = totalRequested;
      
      const fulfilled = Math.min(remainingPool, totalRequested);
      distribution[t].fulfilled = fulfilled;
      remainingPool -= fulfilled;
    });

    // Remainder Waterfall
    if (remainingPool > 0) {
      distribution.builder = remainingPool * 0.7;
      distribution.treasury = remainingPool * 0.3;
    }

    return distribution;
  }, [prizePool, tiers]);

  const handleTriggerPayouts = () => {
    alert('Waterfall payout triggered! Processing distributions based on model.');
  };

  const resetModel = () => {
    setPrizePool(10000);
    setTiers({
      tier1: { multiplier: 1.5, backers: 10, stakePerBacker: 100 },
      tier2: { multiplier: 2.0, backers: 5, stakePerBacker: 200 },
      tier3: { multiplier: 3.0, backers: 2, stakePerBacker: 500 },
    });
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <Head>
        <title>Admin Payout Simulation | Builder Credit</title>
      </Head>

      <div className="max-w-6xl mx-auto">
        <header className="mb-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
              <CalculatorIcon className="w-8 h-8 text-blue-600" />
              Payout Waterfall Simulator
            </h1>
            <p className="text-gray-600 mt-2">Model prize distribution across backer tiers and builder rewards.</p>
          </div>
          <div className="flex gap-3">
            <Button variant="outline" className="bg-white min-h-touch min-w-touch" onClick={resetModel}>
              <ArrowPathIcon className="w-4 h-4 mr-2" />
              Reset Model
            </Button>
            <Button variant="primary" className="min-h-touch min-w-touch" onClick={handleTriggerPayouts}>
              <CheckBadgeIcon className="w-4 h-4 mr-2" />
              Execute Payouts
            </Button>
          </div>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Inputs Column */}
          <div className="space-y-6">
            <Card className="p-6">
              <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                <BanknotesIcon className="w-5 h-5 text-gray-500" />
                Prize Pool Input
              </h3>
              <div className="space-y-4">
                <div>
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Total USDC Pool</label>
                  <input 
                    type="number" 
                    value={prizePool}
                    onChange={(e) => setPrizePool(Number(e.target.value))}
                    className="w-full mt-1 px-4 py-3 rounded-xl border-gray-200 focus:ring-blue-500 text-lg font-bold min-h-touch"
                  />
                </div>
              </div>
            </Card>

            <Card className="p-6">
              <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                <UserGroupIcon className="w-5 h-5 text-gray-500" />
                Backer Tiers
              </h3>
              <div className="space-y-6">
                {Object.entries(tiers).map(([key, data]) => (
                  <div key={key} className="p-4 bg-gray-50 rounded-xl border border-gray-100">
                    <div className="flex justify-between items-center mb-3">
                      <span className="font-bold text-gray-700 capitalize">{key.replace('tier', 'Tier ')} ({data.multiplier}x)</span>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-[10px] font-bold text-gray-400 uppercase">Backers</label>
                        <input 
                          type="number" 
                          value={data.backers}
                          onChange={(e) => setTiers({...tiers, [key]: {...data, backers: Number(e.target.value)}})}
                          className="w-full mt-0.5 px-3 py-1.5 rounded-lg border-gray-200 text-sm min-h-touch"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] font-bold text-gray-400 uppercase">Avg Stake</label>
                        <input 
                          type="number" 
                          value={data.stakePerBacker}
                          onChange={(e) => setTiers({...tiers, [key]: {...data, stakePerBacker: Number(e.target.value)}})}
                          className="w-full mt-0.5 px-3 py-1.5 rounded-lg border-gray-200 text-sm min-h-touch"
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          </div>

          {/* Visualization Column */}
          <div className="lg:col-span-2 space-y-6">
            <Card className="p-8">
              <h3 className="font-bold text-gray-900 mb-8 flex items-center gap-2">
                <BeakerIcon className="w-5 h-5 text-gray-500" />
                Waterfall Distribution Model
              </h3>

              <div className="space-y-8">
                {/* Visual Bar */}
                <div className="relative pt-1">
                  <div className="flex mb-2 items-center justify-between">
                    <div>
                      <span className="text-xs font-semibold inline-block py-1 px-2 uppercase rounded-full text-blue-600 bg-blue-200">
                        Pool Utilization
                      </span>
                    </div>
                    <div className="text-right">
                      <span className="text-xs font-semibold inline-block text-blue-600">
                        {Math.round(((prizePool - (prizePool > (simulationResults.tier1.fulfilled + simulationResults.tier2.fulfilled + simulationResults.tier3.fulfilled) ? (prizePool - (simulationResults.tier1.fulfilled + simulationResults.tier2.fulfilled + simulationResults.tier3.fulfilled)) : 0)) / prizePool) * 100)}%
                      </span>
                    </div>
                  </div>
                  <div className="overflow-hidden h-12 mb-4 text-xs flex rounded-2xl bg-gray-100 shadow-inner">
                    <div style={{ width: `${(simulationResults.tier1.fulfilled / (prizePool || 1)) * 100}%` }} className="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-blue-500 border-r border-white/20">Tier 1</div>
                    <div style={{ width: `${(simulationResults.tier2.fulfilled / (prizePool || 1)) * 100}%` }} className="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-blue-600 border-r border-white/20">Tier 2</div>
                    <div style={{ width: `${(simulationResults.tier3.fulfilled / (prizePool || 1)) * 100}%` }} className="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-blue-700 border-r border-white/20">Tier 3</div>
                    <div style={{ width: `${(simulationResults.builder / (prizePool || 1)) * 100}%` }} className="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-green-500 border-r border-white/20">Builder</div>
                    <div style={{ width: `${(simulationResults.treasury / (prizePool || 1)) * 100}%` }} className="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-gray-400">Treasury</div>
                  </div>
                </div>

                {/* Table Breakdown */}
                <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead>
                      <tr className="border-b border-gray-100">
                        <th className="pb-3 text-xs font-bold text-gray-400 uppercase">Recipient Group</th>
                        <th className="pb-3 text-xs font-bold text-gray-400 uppercase text-right">Requested</th>
                        <th className="pb-3 text-xs font-bold text-gray-400 uppercase text-right">Fulfilled</th>
                        <th className="pb-3 text-xs font-bold text-gray-400 uppercase text-right">Coverage</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                      {['tier1', 'tier2', 'tier3'].map(t => (
                        <tr key={t}>
                          <td className="py-4 font-medium text-gray-700 capitalize">{t.replace('tier', 'Tier ')} Backers</td>
                          <td className="py-4 text-right text-gray-600">${simulationResults[t].totalRequested.toLocaleString()}</td>
                          <td className="py-4 text-right font-bold text-blue-600">${simulationResults[t].fulfilled.toLocaleString()}</td>
                          <td className="py-4 text-right text-xs">
                            {Math.round((simulationResults[t].fulfilled / (simulationResults[t].totalRequested || 1)) * 100)}%
                          </td>
                        </tr>
                      ))}
                      <tr className="bg-green-50/50">
                        <td className="py-4 font-bold text-green-700">Project Builder Reward</td>
                        <td className="py-4 text-right text-gray-400">-</td>
                        <td className="py-4 text-right font-bold text-green-600">${simulationResults.builder.toLocaleString()}</td>
                        <td className="py-4 text-right text-xs text-green-600">70% Remainder</td>
                      </tr>
                      <tr>
                        <td className="py-4 font-medium text-gray-500">Platform Treasury</td>
                        <td className="py-4 text-right text-gray-400">-</td>
                        <td className="py-4 text-right font-bold text-gray-600">${simulationResults.treasury.toLocaleString()}</td>
                        <td className="py-4 text-right text-xs text-gray-500">30% Remainder</td>
                      </tr>
                    </tbody>
                    <tfoot>
                      <tr className="border-t-2 border-gray-100">
                        <td className="py-4 font-black text-gray-900">Total Distribution</td>
                        <td className="py-4 text-right font-black text-gray-900" colSpan={2}>
                          ${(simulationResults.tier1.fulfilled + simulationResults.tier2.fulfilled + simulationResults.tier3.fulfilled + simulationResults.builder + simulationResults.treasury).toLocaleString()}
                        </td>
                        <td></td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </div>
            </Card>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card className="p-6 border-l-4 border-yellow-500">
                <h4 className="text-sm font-bold text-gray-500 uppercase mb-2">Simulation Warning</h4>
                <p className="text-sm text-gray-600 leading-relaxed">
                  Tier 3 fulfillment is currently at {Math.round((simulationResults.tier3.fulfilled / (simulationResults.tier3.totalRequested || 1)) * 100)}%. 
                  Insufficient pool to fully reward high-multiplier backers. Consider increasing the prize pool or adjusting builder share.
                </p>
              </Card>
              <Card className="p-6 border-l-4 border-blue-500">
                <h4 className="text-sm font-bold text-gray-500 uppercase mb-2">Next Steps</h4>
                <p className="text-sm text-gray-600 leading-relaxed">
                  Executing this payout will trigger {Object.values(tiers).reduce((a, b) => a + b.backers, 0)} Circle USDC transfers. 
                  Ensure the platform wallet has sufficient balance.
                </p>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
