/**
 * EcosystemsGrid — landing-page ecosystem cards (Celo, Base, Arc, etc.).
 *
 * Clicking a card routes to /explore?ecosystem=<id>.
 */
import { Card } from "@/components/common/Card";

export default function EcosystemsGrid({ ecosystems, onEcosystemClick }) {
  return (
    <div className="py-12 sm:py-16 bg-surface-secondary">
      <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-8">
        <div className="text-center mb-8 sm:mb-12">
          <h2 className="text-2xl sm:text-3xl font-bold text-primary mb-3 sm:mb-4">
            🗺️ Explore Ecosystems
          </h2>
          <p className="text-sm sm:text-base md:text-lg text-secondary px-4 sm:px-0">
            Track builder activity across {ecosystems.length} blockchain ecosystems
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-5">
          {ecosystems.map((ecosystem) => (
            <Card
              key={ecosystem.id}
              className="p-4 sm:p-6 hover:shadow-lg transition-all cursor-pointer border border-default hover:border-primary-300 bg-surface"
              onClick={() => onEcosystemClick(ecosystem.id)}
            >
              <div className="flex items-start sm:items-center gap-3 sm:gap-4 mb-4">
                <div
                  className="w-10 sm:w-12 h-10 sm:h-12 rounded-lg flex items-center justify-center text-white text-lg sm:text-xl flex-shrink-0 shadow-md"
                  style={{ backgroundColor: ecosystem.rawColor || ecosystem.color }}
                >
                  {ecosystem.icon}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-primary text-sm sm:text-base break-words">
                    {ecosystem.name}
                  </h3>
                  <p className="text-xs sm:text-sm text-secondary">{ecosystem.count}</p>
                </div>
              </div>
              <p className="text-secondary text-xs sm:text-sm mb-4">
                {ecosystem.description}
              </p>
              <div className="flex items-center text-blue-600 text-xs sm:text-sm font-medium min-h-touch">
                Explore →
              </div>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
