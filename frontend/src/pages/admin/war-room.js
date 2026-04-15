import React, { useState, useMemo, useEffect } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import { useAuth } from '@/contexts/AuthContext';
import { useBuilderCredit } from '@/contexts/BuilderCreditContext';
import { useWarRoomData } from '@/hooks/useWarRoomData';
import { Card } from '@/components/common/Card';
import Button from '@/components/common/Button';
import { LoadingSpinner } from '@/components/common/LoadingStates';
import VerifierQueue from '@/components/admin/VerifierQueue';
import CrossCommitteeView from '@/components/admin/CrossCommitteeView';
import EvidenceFeed from '@/components/admin/EvidenceFeed';
import { 
  ShieldCheckIcon, 
  QueueListIcon, 
  PresentationChartLineIcon,
  RssIcon,
  FunnelIcon,
  MagnifyingGlassIcon
} from '@heroicons/react/24/outline';

export default function WarRoomPage() {
  const router = useRouter();
  const { currentUser } = useAuth();
  const { coreContract, account } = useBuilderCredit();
  const { 
    loading, 
    error, 
    assignedHackathons, 
    pendingMilestones, 
    expeditions,
    evidence,
    refresh 
  } = useWarRoomData();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedHackathon, setSelectedHackathon] = useState('all');
  const [loadingMilestoneId, setLoadingMilestoneId] = useState(null);
  const [actionSuccess, setActionSuccess] = useState(null);
  const [actionError, setActionError] = useState(null);

  // Check verifier access - simplified for demo
  useEffect(() => {
    if (currentUser === false) {
      router.push('/login?redirectTo=/admin/war-room');
    }
  }, [currentUser, router]);

  const filteredMilestones = useMemo(() => {
    return pendingMilestones.filter(m => {
      const matchesSearch = m.projectName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          m.description.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesHackathon = selectedHackathon === 'all' || 
                             m.assignedHackathons.some(h => h.id === selectedHackathon);
      return matchesSearch && matchesHackathon;
    });
  }, [pendingMilestones, searchQuery, selectedHackathon]);

  const handleApprove = async (projectId, milestoneId) => {
    if (!coreContract) return;

    setLoadingMilestoneId(`${projectId}-${milestoneId}`);
    setActionError(null);
    setActionSuccess(null);

    try {
      const tx = await coreContract.approveMilestone(projectId, milestoneId);
      await tx.wait();
      
      setActionSuccess(`Milestone approved successfully!`);
      refresh(); // Refresh data from chain and firestore
    } catch (err) {
      console.error('Approval failed:', err);
      setActionError(err.message || 'Failed to approve milestone');
    } finally {
      setLoadingMilestoneId(null);
    }
  };

  // Mock Evidence Feed Data - in a real app, this would be fetched from GitHub API & Contract Events
  const mockEvidence = useMemo(() => [
    {
      type: 'pr',
      title: 'feat: implement core auth logic',
      description: 'Connected Firebase auth to the main dashboard and added protected routes.',
      project: 'Project Alpha',
      timestamp: '2h ago',
      url: 'https://github.com'
    },
    {
      type: 'contract',
      title: 'Contract Deployed',
      description: 'AlphaRegistry.sol deployed to Base Sepolia at 0x1234...5678',
      project: 'Project Alpha',
      timestamp: '5h ago',
      url: 'https://basescan.org'
    },
    {
      type: 'pr',
      title: 'fix: resolve cross-chain latency',
      description: 'Optimized CCIP message handling to reduce finality time by 40%.',
      project: 'OmniChain Protocol',
      timestamp: '1d ago',
      url: 'https://github.com'
    },
    {
      type: 'ship',
      title: 'Mainnet Demo Live',
      description: 'The production-ready demo is now live at alpha-demo.io',
      project: 'Project Alpha',
      timestamp: '2d ago',
      url: 'https://google.com'
    }
  ], []);

  if (loading && !pendingMilestones.length) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <LoadingSpinner size="lg" />
          <p className="mt-4 text-gray-500 font-medium">Entering the War Room...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f1f5f9]">
      <Head>
        <title>Verification War Room | Builder Credit</title>
      </Head>

      {/* War Room Header */}
      <div className="bg-slate-900 text-white border-b border-slate-800">
        <div className="max-w-[1600px] mx-auto px-4 py-6">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-blue-600 rounded-xl shadow-lg shadow-blue-500/20">
                <ShieldCheckIcon className="w-8 h-8 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-black tracking-tight">VERIFICATION WAR ROOM</h1>
                <p className="text-slate-400 text-sm font-medium flex items-center gap-2">
                  <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                  Active Session: Verifier {account?.substring(0, 6)}...{account?.substring(account.length - 4)}
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <div className="bg-slate-800 rounded-lg p-3 border border-slate-700">
                <div className="text-[10px] uppercase font-bold text-slate-500 mb-1">Assigned Hackathons</div>
                <div className="text-xl font-black">{assignedHackathons.length}</div>
              </div>
              <div className="bg-slate-800 rounded-lg p-3 border border-slate-700">
                <div className="text-[10px] uppercase font-bold text-slate-500 mb-1">Pending Approvals</div>
                <div className="text-xl font-black text-blue-400">{pendingMilestones.length}</div>
              </div>
              <div className="bg-slate-800 rounded-lg p-3 border border-slate-700">
                <div className="text-[10px] uppercase font-bold text-slate-500 mb-1">Committee Rank</div>
                <div className="text-xl font-black text-yellow-500">Lead</div>
              </div>
              <Button onClick={refresh} variant="outline" className="border-slate-700 text-slate-300 hover:bg-slate-800">
                Sync Real-time
              </Button>
            </div>
          </div>
        </div>
      </div>

      <main className="max-w-[1600px] mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* Left Sidebar: Filters & Expeditions */}
          <div className="lg:col-span-3 space-y-8">
            <section>
              <div className="flex items-center gap-2 mb-4 text-slate-900">
                <FunnelIcon className="w-5 h-5 font-bold" />
                <h2 className="font-black text-sm uppercase tracking-wider">Filters</h2>
              </div>
              <Card className="p-4">
                <div className="space-y-4">
                  <div>
                    <label className="text-[10px] font-black uppercase text-gray-400 mb-1.5 block">Search Projects</label>
                    <div className="relative">
                      <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <input 
                        type="text" 
                        placeholder="Search..."
                        className="w-full pl-9 pr-3 py-2 text-sm rounded-lg border-gray-200 focus:ring-blue-500 focus:border-blue-500"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                      />
                    </div>
                  </div>
                  <div>
                    <label className="text-[10px] font-black uppercase text-gray-400 mb-1.5 block">Hackathon Filter</label>
                    <select 
                      className="w-full p-2 text-sm rounded-lg border-gray-200"
                      value={selectedHackathon}
                      onChange={(e) => setSelectedHackathon(e.target.value)}
                    >
                      <option value="all">All Hackathons</option>
                      {assignedHackathons.map(h => (
                        <option key={h.id} value={h.id}>{h.name}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </Card>
            </section>

            <section>
              <div className="flex items-center gap-2 mb-4 text-slate-900">
                <PresentationChartLineIcon className="w-5 h-5 font-bold" />
                <h2 className="font-black text-sm uppercase tracking-wider">Cross-Committee View</h2>
              </div>
              <CrossCommitteeView expeditions={expeditions} />
            </section>
          </div>

          {/* Main Area: The Queue */}
          <div className="lg:col-span-6 space-y-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-slate-900">
                <QueueListIcon className="w-6 h-6 font-bold text-blue-600" />
                <h2 className="font-black text-lg uppercase tracking-tight">The Queue</h2>
                <span className="bg-blue-100 text-blue-600 px-2 py-0.5 rounded-full text-xs font-black">
                  {filteredMilestones.length}
                </span>
              </div>
            </div>

            {actionSuccess && (
              <div className="bg-green-50 border border-green-200 text-green-800 p-4 rounded-xl text-sm font-medium flex items-center gap-3 animate-in fade-in slide-in-from-top-2">
                <ShieldCheckIcon className="w-5 h-5 text-green-500" />
                {actionSuccess}
              </div>
            )}

            {actionError && (
              <div className="bg-red-50 border border-red-200 text-red-800 p-4 rounded-xl text-sm font-medium">
                {actionError}
              </div>
            )}

            <VerifierQueue 
              milestones={filteredMilestones} 
              onApprove={handleApprove}
              loadingMilestoneId={loadingMilestoneId}
            />
          </div>

          {/* Right Sidebar: Evidence Feed */}
          <div className="lg:col-span-3 space-y-6">
            <div className="flex items-center gap-2 text-slate-900">
              <RssIcon className="w-5 h-5 font-bold" />
              <h2 className="font-black text-sm uppercase tracking-wider">Evidence Feed</h2>
            </div>
            <Card className="p-4 bg-slate-50 border-gray-200">
              <EvidenceFeed events={evidence.length > 0 ? evidence : mockEvidence} />
              <Button variant="outline" className="w-full mt-4 text-xs font-bold bg-white">
                Load More History
              </Button>
            </Card>

            <Card className="p-4 bg-blue-600 text-white border-none shadow-xl shadow-blue-500/20">
              <h4 className="font-black text-sm uppercase mb-2">Proof of Ship</h4>
              <p className="text-blue-100 text-xs leading-relaxed mb-4">
                Verification requires analyzing both GitHub activity and on-chain contract events. Ensure the milestone description matches the submitted evidence.
              </p>
              <div className="flex items-center gap-2 text-[10px] font-black uppercase text-blue-200">
                <div className="w-1.5 h-1.5 bg-blue-200 rounded-full"></div>
                V2 Multi-Sig Logic Enabled
              </div>
            </Card>
          </div>

        </div>
      </main>
    </div>
  );
}
