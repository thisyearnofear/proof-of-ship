/**
 * ReasoningTraces — list of recent reasoning-trace cards linking to
 * /scout/trace/[runId].
 */
import Link from "next/link";
import { Card } from "@/components/common/Card";
import { LightBulbIcon } from "@heroicons/react/24/outline";

function TraceRow({ trace, idx }) {
  return (
    <Link key={`${trace.runId}-${idx}`} href={`/scout/trace/${trace.runId}`} className="block">
      <Card className="bg-slate-900 border-slate-800 p-4 hover:border-cyan-500/30 transition-colors cursor-pointer">
        <div className="flex items-center gap-2 mb-2">
          <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-purple-900/50 text-purple-400">
            {trace.project}
          </span>
          <span className="text-[10px] text-slate-500 dark:text-slate-400 font-mono">
            {trace.timestamp ? new Date(trace.timestamp).toLocaleString() : ""}
          </span>
        </div>
        <p className="text-sm text-slate-300 dark:text-slate-500 leading-relaxed line-clamp-3">{trace.trace}</p>
        <div className="mt-2 text-[10px] text-cyan-400 dark:text-cyan-500 hover:underline">View full trace →</div>
      </Card>
    </Link>
  );
}

export default function ReasoningTraces({ traces }) {
  if (!traces.length) return null;

  return (
    <section>
      <h2 className="text-sm font-black text-slate-300 dark:text-slate-500 uppercase tracking-widest mb-4 flex items-center gap-2">
        <LightBulbIcon className="w-4 h-4 text-amber-400" />
        Latest Reasoning Traces
      </h2>
      <div className="space-y-3">
        {traces.map((t, idx) => (
          <TraceRow key={`${t.runId}-${idx}`} trace={t} idx={idx} />
        ))}
      </div>
    </section>
  );
}
