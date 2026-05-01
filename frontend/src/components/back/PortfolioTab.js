import React, { useState, useEffect } from "react";
import { ethers } from "ethers";
import { useWallet, useBuilderCredit } from "@/contexts/WalletContext";
import { calculateCompassScore, getCompassTier } from "@/utils/compassScore";
import { Card } from "@/components/common/Card";
import Button from "@/components/common/Button";
import { LoadingSpinner } from "@/components/common/LoadingStates";
import {
  BanknotesIcon,
  RocketLaunchIcon,
  ShieldCheckIcon,
  TrophyIcon,
} from "@heroicons/react/24/outline";

export default function PortfolioTab({ setTab }) {
  const wallet = useWallet();
  const { getBackerProjects, chainId, signer } = useBuilderCredit();
  const [loading, setLoading] = useState(true);
  const [backedDetails, setBackedDetails] = useState([]);
  const [compassScore, setCompassScore] = useState(400);

  useEffect(() => {
    let cancelled = false;
    
    async function load() {
      if (!wallet.account || !signer || typeof chainId !== 'number') {
        if (!cancelled) setLoading(false);
        return;
      }
      try {
        if (!cancelled) setLoading(true);
        const projectIds = await getBackerProjects(wallet.account);
        if (cancelled) return;
        
        if (!projectIds || projectIds.length === 0) {
          setBackedDetails([]);
          setCompassScore(400);
          setLoading(false);
          return;
        }
        
        const { creditService } = await import('@/services/creditService');
        const contracts = creditService.getContracts(chainId, signer);
        if (!contracts || cancelled) {
          if (!cancelled) setLoading(false);
          return;
        }
        
        const details = [];
        const roiHistory = [];
        for (const id of projectIds) {
          if (cancelled) return;
          try {
            const project = await contracts.core.projects(id);
            const backings = [];
            let idx = 0;
            try {
              while (true) {
                const b = await contracts.core.projectBackings(id, idx);
                backings.push(b);
                idx++;
              }
            } catch (e) { /* end of array */ }

            const myBacking = backings.find(
              (b) => b.backer.toLowerCase() === wallet.account?.toLowerCase()
            );
            const stakeAmount = myBacking
              ? parseFloat(ethers.utils.formatUnits(myBacking.amount, 6))
              : 0;
            const multiplier = myBacking
              ? myBacking.multiplier.toNumber() / 100
              : 0;

            const detail = {
              id: id.toString(),
              name: project.name,
              developer: project.developer,
              isActive: project.isActive,
              milestonesCompleted: project.milestonesCompleted.toNumber(),
              milestonesCount: project.milestonesCount.toNumber(),
              fundingAmount: ethers.utils.formatUnits(project.fundingAmount, 6),
              myStake: stakeAmount.toFixed(2),
              myMultiplier: multiplier.toFixed(1),
              potentialReturn: (stakeAmount * multiplier).toFixed(2),
              claimed: myBacking?.claimed || false,
            };
            details.push(detail);
            if (!project.isActive && stakeAmount > 0) {
              roiHistory.push({ projectId: detail.id, amountStaked: stakeAmount, amountReturned: parseFloat(detail.potentialReturn), timestamp: new Date().toISOString() });
            }
          } catch (err) { /* skip failed project */ }
        }
        
        if (!cancelled) {
          setBackedDetails(details);
          setCompassScore(calculateCompassScore(roiHistory));
        }
      } catch (err) { /* portfolio load failed */ }
      finally { if (!cancelled) setLoading(false); }
    }
    
    load();
    return () => { cancelled = true; };
  }, [wallet.account, signer, chainId, getBackerProjects]);

  const compassTier = getCompassTier(compassScore);

  if (loading) return <div className="flex justify-center py-16"><LoadingSpinner size="lg" /></div>;

  if (!wallet.account) {
    return (
      <Card className="p-8 text-center">
        <ShieldCheckIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900">Connect Wallet</h3>
        <p className="text-gray-500 mt-2">Connect your wallet to view your backed positions.</p>
        <Button onClick={() => wallet.connect()} className="mt-4">Connect Wallet</Button>
      </Card>
    );
  }

  if (backedDetails.length === 0) {
    return (
      <Card className="p-8 text-center">
        <RocketLaunchIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900">No Positions Yet</h3>
        <p className="text-gray-500 mt-2">You haven&apos;t backed any projects yet.</p>
        <Button onClick={() => setTab('discover')} variant="primary" className="mt-4">
          Discover Projects to Back
        </Button>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-5 bg-indigo-50 border-indigo-100">
          <div className="flex items-center gap-3">
            <span className="text-2xl">{compassTier.icon}</span>
            <div>
              <p className="text-xs font-bold text-indigo-600 uppercase">Compass Score</p>
              <p className="text-2xl font-black text-indigo-900">{compassScore}</p>
              <p className={`text-xs font-bold ${compassTier.color}`}>{compassTier.name}</p>
            </div>
          </div>
        </Card>
        <Card className="p-5">
          <BanknotesIcon className="w-5 h-5 text-blue-600 mb-1" />
          <p className="text-xs text-gray-500 uppercase">Total Staked</p>
          <p className="text-xl font-bold">${backedDetails.reduce((s, p) => s + parseFloat(p.myStake), 0).toFixed(2)}</p>
        </Card>
        <Card className="p-5">
          <TrophyIcon className="w-5 h-5 text-green-600 mb-1" />
          <p className="text-xs text-gray-500 uppercase">Potential Returns</p>
          <p className="text-xl font-bold">${backedDetails.reduce((s, p) => s + parseFloat(p.potentialReturn), 0).toFixed(2)}</p>
        </Card>
        <Card className="p-5">
          <RocketLaunchIcon className="w-5 h-5 text-purple-600 mb-1" />
          <p className="text-xs text-gray-500 uppercase">Active Stakes</p>
          <p className="text-xl font-bold">{backedDetails.length}</p>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {backedDetails.map((project) => {
          const progress = (project.milestonesCompleted / project.milestonesCount) * 100;
          return (
            <Card key={project.id} className="border-l-4 border-l-indigo-500 hover:shadow-md transition-shadow">
              <div className="p-5">
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <h3 className="font-bold text-gray-900">{project.name}</h3>
                    <p className="text-xs text-gray-500 font-mono truncate max-w-[180px]">{project.developer}</p>
                  </div>
                  <span className={`text-xs px-2 py-1 rounded-full font-medium ${project.isActive ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800"}`}>
                    {project.isActive ? "Active" : "Done"}
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-3 mb-4">
                  <div className="p-2 bg-blue-50 rounded-lg">
                    <p className="text-[10px] text-blue-600 font-bold uppercase">Stake</p>
                    <p className="text-lg font-bold text-blue-900">${project.myStake}</p>
                  </div>
                  <div className="p-2 bg-indigo-50 rounded-lg">
                    <p className="text-[10px] text-indigo-600 font-bold uppercase">Return (est.)</p>
                    <p className="text-lg font-bold text-indigo-900">${project.potentialReturn}</p>
                  </div>
                </div>
                <div className="mb-3">
                  <div className="flex justify-between text-xs text-gray-600 mb-1">
                    <span>Progress</span>
                    <span>{project.milestonesCompleted}/{project.milestonesCount}</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-1.5">
                    <div className="bg-indigo-600 h-1.5 rounded-full" style={{ width: `${progress}%` }} />
                  </div>
                </div>
                <div className="flex items-center justify-between text-xs text-gray-500">
                  <span className={`font-medium ${project.claimed ? "text-green-600" : "text-gray-500"}`}>
                    {project.claimed ? "✓ Claimed" : "Pending"}
                  </span>
                  <span className="font-medium text-indigo-600">{project.myMultiplier}x</span>
                </div>
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
