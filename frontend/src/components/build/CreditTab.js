import Link from "next/link";
import { Card } from "@/components/common/Card";
import ScoreBar from "@/components/common/ScoreBar";
import {
  ChartBarIcon,
  CurrencyDollarIcon,
  RocketLaunchIcon,
  ArrowTrendingUpIcon,
  CheckCircleIcon,
} from "@heroicons/react/24/outline";

export default function CreditTab({
  creditProfile,
  usdcBalance,
  activeChainFamily,
  developerProjects,
  projectDetails,
  setActiveTab,
}) {
  const score = creditProfile?.creditScore || 0;
  const totalCredit = parseFloat(creditProfile?.totalAmount || "0");
  const usedCredit = parseFloat(creditProfile?.usedAmount || "0");
  const reputation = creditProfile?.reputation || 0;
  const tier = score >= 800 ? "Elite" : score >= 700 ? "Proven" : score >= 550 ? "Rising" : score >= 400 ? "New" : "Unscored";

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="p-6 md:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-sm text-secondary">Credit Score</p>
              <p className="text-4xl font-bold text-primary">{score || "—"}</p>
              <span className={`text-xs font-medium px-2 py-1 rounded-full ${
                tier === "Elite" ? "bg-secondary-50 text-secondary-700" :
                tier === "Proven" ? "bg-success-50 text-success-700" :
                tier === "Rising" ? "bg-warning-50 text-warning-700" :
                "bg-surface-secondary text-secondary"
              }`}>{tier} Builder</span>
            </div>
            <ChartBarIcon className="w-12 h-12 text-primary-500" />
          </div>
          <ScoreBar score={score} />
          <div className="flex justify-between text-xs text-secondary mt-1">
            <span>400</span><span>550</span><span>700</span><span>850</span>
          </div>
        </Card>
        <Card className="p-6">
          <p className="text-sm text-secondary">{activeChainFamily === 'solana' ? 'SOL Balance' : 'USDC Balance'}</p>
          <p className="text-2xl font-bold text-primary mt-1">
            {activeChainFamily === 'solana' ? '' : '$'}{usdcBalance || "0.00"}{activeChainFamily === 'solana' ? ' SOL' : ''}
          </p>
          <div className="mt-4">
            <p className="text-sm text-secondary">Reputation</p>
            <p className="text-lg font-semibold text-primary">{reputation}</p>
          </div>
        </Card>
      </div>

      <Card className="p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-lg font-semibold text-primary flex items-center gap-2">
            <CurrencyDollarIcon className="w-5 h-5 text-success-600" /> Funding Capacity
          </h2>
          <div className="text-right">
            <p className="text-xs text-secondary uppercase font-bold tracking-wider">Total Available</p>
            <p className="text-2xl font-black text-primary">${totalCredit.toFixed(2)}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span className="text-secondary font-medium">Utilization</span>
                <span className="text-primary font-bold">
                  {totalCredit > 0 ? Math.round((usedCredit / totalCredit) * 100) : 0}%
                </span>
              </div>
              <div className="w-full bg-gray-100 rounded-full h-3 overflow-hidden flex">
                <div 
                  className="bg-warning-500 h-full transition-all duration-500" 
                  style={{ width: `${totalCredit > 0 ? (usedCredit / totalCredit) * 100 : 0}%` }}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="p-3 bg-surface-secondary rounded-xl border border-default">
                <p className="text-[10px] text-secondary uppercase font-bold mb-1">Used</p>
                <p className="text-lg font-bold text-warning-600">${usedCredit.toFixed(2)}</p>
              </div>
              <div className="p-3 bg-success-50 rounded-xl border border-success-100">
                <p className="text-[10px] text-success-600 uppercase font-bold mb-1">Remaining</p>
                <p className="text-lg font-bold text-success-700">
                  ${(totalCredit - usedCredit).toFixed(2)}
                </p>
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <div className="p-4 bg-primary-50/50 rounded-xl border border-primary-100">
              <div className="flex justify-between items-center mb-1">
                <span className="text-sm font-semibold text-primary">Base Limit</span>
                <span className="text-sm font-bold text-primary">${creditProfile?.baseAmount || "0"}</span>
              </div>
              <p className="text-[10px] text-primary-600">Calculated from your on-chain reputation and GitHub history.</p>
            </div>

            <div className="p-4 bg-secondary-50/50 rounded-xl border border-secondary-100">
              <div className="flex justify-between items-center mb-1">
                <span className="text-sm font-semibold text-secondary">Market Boost</span>
                <span className="text-sm font-bold text-secondary">+${creditProfile?.marketBoost || "0"}</span>
              </div>
              <p className="text-[10px] text-secondary-600">2x multiplier bonus from backer confidence in your projects.</p>
            </div>
          </div>
        </div>
      </Card>

      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-primary flex items-center gap-2">
            <RocketLaunchIcon className="w-5 h-5 text-primary-500" />
            Your Projects ({developerProjects?.length || 0})
          </h2>
          <button onClick={() => setActiveTab("projects")} className="text-sm text-primary-500 hover:underline">
            View all →
          </button>
        </div>
        {(!projectDetails || projectDetails.length === 0) ? (
          <div className="text-center py-6 text-secondary">
            <p>No projects yet.</p>
            <Link href="/projects/new" className="text-primary-500 hover:underline text-sm mt-2 inline-block">
              Submit your first project →
            </Link>
          </div>
        ) : (
          <div className="space-y-2">
            {projectDetails.slice(0, 5).map((p) => (
              <div key={p.id} className="flex items-center justify-between p-3 bg-surface-secondary rounded-lg">
                <div>
                  <p className="font-medium text-primary">{p.name}</p>
                  <p className="text-xs text-secondary">
                    {p.milestonesCompleted}/{p.milestonesCount} milestones • ${p.fundingAmount} USDC
                  </p>
                </div>
                <span className={`text-xs px-2 py-1 rounded-full ${
                  p.isActive ? "bg-success-50 text-success-700" : "bg-surface-secondary text-secondary"
                }`}>
                  {p.isActive ? "Active" : "Done"}
                </span>
              </div>
            ))}
          </div>
        )}
      </Card>

      <Card className="p-6 bg-primary-50 border-primary-200">
        <h2 className="text-lg font-semibold text-primary mb-3 flex items-center gap-2">
          <ArrowTrendingUpIcon className="w-5 h-5 text-primary-500" /> How to Improve Your Credit
        </h2>
        <ul className="space-y-2 text-sm text-secondary">
          <li className="flex items-center gap-2"><CheckCircleIcon className="w-4 h-4 text-success-500" /> Complete project milestones to increase reputation</li>
          <li className="flex items-center gap-2"><CheckCircleIcon className="w-4 h-4 text-success-500" /> Get backers to stake on your projects</li>
          <li className="flex items-center gap-2"><CheckCircleIcon className="w-4 h-4 text-success-500" /> Win prizes to repay backers and boost your reputation</li>
          <li className="flex items-center gap-2"><CheckCircleIcon className="w-4 h-4 text-success-500" /> Ship consistently across hackathons</li>
        </ul>
      </Card>
    </div>
  );
}
