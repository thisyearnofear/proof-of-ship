/**
 * CTASection — final amber call-to-action on the landing page.
 *
 * Two buttons: "Start Shipping" and "Explore Projects".
 */
import Button from "@/components/common/Button";

export default function CTASection({ onGetStarted, onExplore }) {
  return (
    <div className="bg-gradient-to-r from-amber-600 to-yellow-600 py-12 sm:py-16 relative overflow-hidden">
      <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-8 text-center relative">
        <h2 className="text-2xl sm:text-3xl font-bold text-white mb-3 sm:mb-4">
          Won a Hackathon? Keep Shipping.
        </h2>
        <p className="text-sm sm:text-base md:text-lg lg:text-xl text-amber-100 mb-6 sm:mb-8 max-w-2xl mx-auto px-4 sm:px-0">
          The platform for past hackathon winners. Prove your win, continue your project,
          and access credit backed by your reputation.
        </p>

        <div className="flex flex-col gap-3 sm:gap-4 justify-center px-4 sm:px-0">
          <Button
            onClick={onGetStarted}
            className="bg-surface text-amber-800 hover:bg-gray-100 px-4 sm:px-8 py-2.5 sm:py-4 text-sm sm:text-base md:text-lg font-semibold shadow-lg min-h-touch w-full sm:w-auto"
          >
            🏆 Start Shipping
          </Button>

          <Button
            onClick={onExplore}
            variant="outline"
            className="border-white text-white hover:bg-surface hover:text-amber-600 px-4 sm:px-8 py-2.5 sm:py-4 text-sm sm:text-base md:text-lg font-semibold min-h-touch w-full sm:w-auto"
          >
            📖 Explore Projects
          </Button>
        </div>
      </div>
    </div>
  );
}
