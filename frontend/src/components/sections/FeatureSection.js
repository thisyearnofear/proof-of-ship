import React from "react";
import { Card } from "@/components/common/Card";

/**
 * FeatureSection - Displays platform features in a responsive grid
 * @param {Object} props - Component props
 * @param {Array<{icon: React.ElementType, title: string, description: string}>} props.features - Array of feature objects
 * @param {React.ElementType} props.features[].icon - Icon component
 * @param {string} props.features[].title - Feature title
 * @param {string} props.features[].description - Feature description
 */
export function FeatureSection({ features = [] }) {
  return (
    <div className="bg-surface py-12 sm:py-16 border-t border-default">
      <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-8">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          {features.map((feature, index) => (
            <Card
              key={index}
              className="p-4 sm:p-6 text-center border border-default bg-surface hover:shadow-lg transition-all duration-200"
              variant="default"
            >
              <div className="flex flex-col items-center text-center">
                <div className="flex items-center justify-center w-12 h-12 sm:w-14 sm:h-14 rounded-xl bg-primary-50 text-primary-600 mb-4">
                  {feature.icon && (
                    <feature.icon className="w-6 h-6 sm:w-7 sm:h-7" />
                  )}
                </div>
                <h3 className="text-base sm:text-lg font-semibold text-primary mb-2">
                  {feature.title}
                </h3>
                <p className="text-xs sm:text-sm text-secondary leading-relaxed">
                  {feature.description}
                </p>
              </div>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
