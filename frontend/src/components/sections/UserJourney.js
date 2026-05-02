import React from "react";

/**
 * UserJourneySection - Displays user journey steps for different personas
 * @param {Object} props - Component props
 * @param {Object} props.userJourneys - Journey data for different personas
 * @param {string} props.activeTab - Currently active persona tab
 * @param {Function} props.onTabChange - Callback when tab changes
 * @returns {JSX.Element} User journey section component
 */
export function UserJourney({ userJourneys = {}, activeTab = "developers", onTabChange = () => {} }) {
  const tabs = [
    { key: "developers", label: "Builders" },
    { key: "backers", label: "Backers" },
    { key: "organizers", label: "Organizers" },
  ];

  const currentJourney = userJourneys[activeTab] || userJourneys.developers || {};

  return (
    <div className="bg-surface-secondary py-12 sm:py-16">
      <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-8">
        <div className="text-center mb-8 sm:mb-12">
          <h2 className="text-2xl sm:text-3xl font-bold text-primary mb-3 sm:mb-4">
            Your Journey, Your Way
          </h2>
          <p className="text-sm sm:text-base text-secondary max-w-2xl mx-auto">
            Whether you&apos;re building, organizing, or backing — we have tools tailored for your role
          </p>
        </div>

        {/* Tab Navigation */}
        <div className="flex justify-center mb-8 sm:mb-12">
          <div
            className="inline-flex p-1 bg-surface rounded-xl border border-default"
            role="tablist"
            aria-label="User journey persona selection"
          >
            {tabs.map((tab) => {
              const isActive = activeTab === tab.key;
              return (
                <button
                  key={tab.key}
                  role="tab"
                  aria-selected={isActive}
                  aria-controls={`${tab.key}-panel`}
                  id={`${tab.key}-tab`}
                  onClick={() => onTabChange(tab.key)}
                  className={`
                    px-4 sm:px-6 py-2.5 rounded-lg font-medium text-sm sm:text-base
                    transition-all duration-200 whitespace-nowrap focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2
                    ${isActive
                      ? "bg-primary-500 text-white shadow-lg shadow-primary-500/20"
                      : "text-secondary hover:text-primary hover:bg-surface-hover"
                    }
                  `}
                >
                  {tab.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Journey Content */}
        <div className="max-w-4xl mx-auto">
          <div
            role="tabpanel"
            id={`${activeTab}-panel`}
            aria-labelledby={`${activeTab}-tab`}
            className="text-center mb-8 sm:mb-12"
          >
            <h3 className="text-xl sm:text-2xl font-semibold text-primary mb-2">
              {currentJourney.title}
            </h3>
            <p className="text-sm sm:text-base text-secondary">
              {currentJourney.subtitle}
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6">
            {currentJourney.steps?.map((step, index) => (
              <div
                key={index}
                className="bg-surface border border-default rounded-xl p-6 text-center hover:shadow-lg transition-all duration-200"
              >
                <div className="flex items-center justify-center w-12 h-12 sm:w-14 sm:h-14 rounded-xl bg-primary-50 text-primary-600 mx-auto mb-4">
                  {step.icon && (
                    <step.icon className="w-6 h-6 sm:w-7 sm:h-7" />
                  )}
                </div>
                <h4 className="text-base sm:text-lg font-semibold text-primary mb-2">
                  {step.title}
                </h4>
                <p className="text-xs sm:text-sm text-secondary leading-relaxed">
                  {step.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
