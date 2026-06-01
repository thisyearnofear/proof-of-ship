/**
 * CopyScoutModal — opt-in modal for the "Copy Scout" subscription flow.
 *
 * Three checkmark bullets + Close / Start Copying buttons. Subscribing
 * triggers the parent-provided handler.
 */
import { Card } from "@/components/common/Card";
import Button from "@/components/common/Button";
import { CheckCircleIcon } from "@heroicons/react/24/outline";

const BULLETS = [
  "Deposit USDC into your copy-trade balance",
  "Auto-back every project the scout recommends",
  "1% agent fee on each fill (paid to Scout)",
];

export default function CopyScoutModal({ onClose, onConfirm, loading }) {
  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <Card className="bg-slate-900 border-slate-700 max-w-md w-full p-6">
        <h3 className="text-lg font-bold text-white mb-2">Copy the Scout</h3>
        <p className="text-sm text-slate-400 dark:text-slate-500 mb-4">
          When you copy the Scout, your wallet automatically backs the same projects the agent recommends. You keep full custody — the agent just signals, your wallet executes.
        </p>
        <ul className="space-y-3 mb-4">
          {BULLETS.map((b) => (
            <li key={b} className="flex items-center gap-2 text-sm text-slate-300 dark:text-slate-500">
              <CheckCircleIcon className="w-4 h-4 text-emerald-400" />
              <span>{b}</span>
            </li>
          ))}
        </ul>
        <div className="flex gap-2">
          <Button onClick={onClose} variant="outline" className="flex-1 text-xs">
            Close
          </Button>
          <Button
            onClick={onConfirm}
            disabled={loading}
            className="flex-1 bg-cyan-500 hover:bg-cyan-600 text-white text-xs"
          >
            {loading ? "Subscribing..." : "Start Copying"}
          </Button>
        </div>
      </Card>
    </div>
  );
}
