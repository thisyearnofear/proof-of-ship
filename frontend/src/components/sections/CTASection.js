/**
 * CTASection — closing CTA aligned to the post-win wedge.
 */
import Button from "@/components/common/Button";
import { ClockIcon, TrophyIcon } from "@heroicons/react/24/outline";

export default function CTASection({ onClaimWin, onSeePayouts }) {
  return (
    <div className="bg-slate-900 py-12 sm:py-16 relative overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative">
        <h2 className="text-2xl sm:text-3xl font-bold text-white mb-3 sm:mb-4">
          Turn the win into a packet
        </h2>
        <p className="text-sm sm:text-base text-slate-300 mb-6 sm:mb-8 max-w-2xl mx-auto">
          Claim your hackathon result, see how long that org takes to pay, and generate an
          Underwriter packet you can forward to ecosystems and angels.
        </p>

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Button
            onClick={onClaimWin}
            className="bg-amber-500 hover:bg-amber-400 text-slate-900 px-6 sm:px-8 py-3 text-base font-semibold min-h-touch w-full sm:w-auto"
          >
            <TrophyIcon className="w-5 h-5 mr-2" />
            Claim your win
          </Button>

          <Button
            onClick={onSeePayouts}
            variant="outline"
            className="border-slate-500 text-white hover:bg-slate-800 px-6 sm:px-8 py-3 text-base font-semibold min-h-touch w-full sm:w-auto"
          >
            <ClockIcon className="w-5 h-5 mr-2" />
            See payout speeds
          </Button>
        </div>
      </div>
    </div>
  );
}
