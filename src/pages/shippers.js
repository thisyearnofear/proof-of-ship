/**
 * Projects Page - Multi-Ecosystem Project Explorer
 * Clean, organized view of all projects across different blockchain ecosystems
 */

import React from "react";
import { useRouter } from "next/router";
import { useEnhancedGithub } from "@/providers/Github/EnhancedGithubProvider";
import { useDecentralizedAuth } from "@/contexts/DecentralizedAuthContext";
import { Navbar, Footer } from "@/components/common/layout";
import HybridDashboard from "@/components/dashboard/HybridDashboard";
import { LoadingSpinner } from "@/components/common/LoadingStates";
import { Card } from "@/components/common/Card";
import { ExclamationTriangleIcon } from "@heroicons/react/24/outline";

export default function ProjectsPage() {
  const router = useRouter();
  const { projectData, loading, errors } = useEnhancedGithub();
  const { userProfile } = useDecentralizedAuth();

  const handleProjectClick = (project) => {
    // Navigate to project detail page
    router.push(`/projects/${project.ecosystem}/${project.slug}`);
  };

  // Error state
  if (Object.keys(errors).length > 0) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <Card className="p-8 text-center">
            <ExclamationTriangleIcon className="w-16 h-16 text-red-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              Unable to Load Projects
            </h2>
            <p className="text-gray-600 mb-6">
              We encountered an error while loading project data. Please try
              refreshing the page.
            </p>
            <div className="text-left bg-red-50 border border-red-200 rounded-lg p-4 max-w-md mx-auto">
              <h3 className="font-medium text-red-900 mb-2">Error Details:</h3>
              <ul className="text-sm text-red-700 space-y-1">
                {Object.entries(errors).map(([key, error]) => (
                  <li key={key}>
                    • {key}: {error}
                  </li>
                ))}
              </ul>
            </div>
          </Card>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <HybridDashboard
          projects={projectData}
          loading={loading}
          userProfile={userProfile}
          onProjectClick={handleProjectClick}
        />
      </div>

      <Footer />
    </div>
  );
}
