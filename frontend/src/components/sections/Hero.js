/**
 * Hero — landing page above-the-fold section.
 *
 * Title, subtitle, two CTAs, and the live-leaderboard / score / activity
 * preview strip. Pure presentation + click handlers.
 */
import Button from "@/components/common/Button";
import ScorePreviewCard from "@/components/common/ScorePreviewCard";
import LiveActivityFeed from "@/components/common/LiveActivityFeed";
import LeaderboardStrip from "@/components/common/LeaderboardStrip";
import {
  ArrowRightIcon,
  MagnifyingGlassIcon,
  SparklesIcon as SparklesIconOutline,
  TrophyIcon,
} from "@heroicons/react/24/outline";

export default function Hero({ currentUser, onGetStarted, onExploreFleet }) {
  return (
    <div className="relative overflow-hidden">
      <div className="absolute top-0 left-0 w-full h-full pointer-events-none opacity-20">
        <div className="absolute top-20 left-[10%] w-64 h-64 bg-blue-400 rounded-full blur-[100px] animate-wave"></div>
        <div className="absolute bottom-20 right-[10%] w-80 h-80 bg-cyan-400 rounded-full blur-[120px] animate-wave" style={{ animationDelay: '-5s' }}></div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-16 relative">
        <div className="text-center relative z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300 rounded-full text-xs font-bold uppercase tracking-wider mb-6 animate-fade-in-up">
            <TrophyIcon className="w-3.5 h-3.5" />
            Exclusive to Past Hackathon Winners
          </div>
          <h1 className="font-[family-name:var(--font-display)] text-3xl sm:text-4xl md:text-5xl lg:text-6xl xl:text-7xl font-extrabold text-primary mb-4 sm:mb-6 leading-tight tracking-tight animate-fade-in-up" style={{ animationDelay: '100ms' }}>
            Built by Winners,
            <br />
            <span className="bg-gradient-to-r from-amber-500 to-yellow-500 bg-clip-text text-transparent drop-shadow-sm">
              Funded on Proof
            </span>
          </h1>

          <p             className="text-sm sm:text-base md:text-lg lg:text-xl text-secondary mb-6 sm:mb-8 max-w-2xl mx-auto px-4 sm:px-0 animate-fade-in-up" style={{ animationDelay: '150ms' }}>
            The only platform where past hackathon winners continue the projects
            they already proved worth building. AI agents verify milestones, backers
            stake USDC, and payout speed is public data.
          </p>

          <div className="flex flex-col gap-3 sm:gap-4 justify-center px-4 sm:px-0 animate-fade-in-up" style={{ animationDelay: '200ms' }}>
            <div className="flex flex-col sm:flex-row gap-3 justify-center items-center">
              <Button
                onClick={onGetStarted}
                className="bg-gradient-to-r from-primary-500 to-primary-600 hover:from-primary-600 hover:to-primary-700 text-white px-4 sm:px-8 py-2.5 sm:py-4 text-sm sm:text-base md:text-lg font-semibold shadow-lg border border-primary-200 tide-button maritime-depth min-h-touch w-full sm:w-auto"
              >
                <SparklesIconOutline className="w-4 sm:w-5 h-4 sm:h-5 mr-2" />
                {currentUser ? "Get Funded" : "Start Shipping"}
                <ArrowRightIcon className="w-4 sm:w-5 h-4 sm:h-5 ml-2" />
              </Button>

              <Button
                onClick={onExploreFleet}
                variant="outline"
                className="px-4 sm:px-8 py-2.5 sm:py-4 text-sm sm:text-base md:text-lg font-semibold min-h-touch w-full sm:w-auto"
              >
                <MagnifyingGlassIcon className="w-4 sm:w-5 h-4 sm:h-5 mr-2" />
                Explore projects
              </Button>
            </div>
          </div>

          <div className="mt-8 sm:mt-10 animate-fade-in-up" style={{ animationDelay: '250ms' }}>
            <LeaderboardStrip />
          </div>

          <div className="mt-8 sm:mt-12 flex flex-col lg:flex-row gap-8 items-center justify-center animate-fade-in-up" style={{ animationDelay: '300ms' }}>
            <ScorePreviewCard
              className="max-w-md w-full"
              onGetStarted={onGetStarted}
            />
            <LiveActivityFeed />
          </div>
        </div>
      </div>
    </div>
  );
}
