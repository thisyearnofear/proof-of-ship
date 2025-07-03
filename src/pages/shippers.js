/**
 * Projects Page - Multi-Ecosystem Project Explorer
 * Clean, organized view of all projects across different blockchain ecosystems
 */

import React from 'react';
import { useRouter } from 'next/router';
import { useEnhancedGithub } from '@/providers/Github/EnhancedGithubProvider';
import { useDecentralizedAuth } from '@/contexts/DecentralizedAuthContext';
import { Navbar, Footer } from '@/components/common/layout';
import HybridDashboard from '@/components/dashboard/HybridDashboard';
import { LoadingSpinner } from '@/components/common/LoadingStates';
import { Card } from '@/components/common/Card';
import {
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline';

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
              We encountered an error while loading project data. Please try refreshing the page.
            </p>
            <div className="text-left bg-red-50 border border-red-200 rounded-lg p-4 max-w-md mx-auto">
              <h3 className="font-medium text-red-900 mb-2">Error Details:</h3>
              <ul className="text-sm text-red-700 space-y-1">
                {Object.entries(errors).map(([key, error]) => (
                  <li key={key}>• {key}: {error}</li>
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
    return (
      <div className="p-8 text-center text-gray-400">Loading project data…</div>
    );
  }

  // Filter only Celo projects (season 1, 2, and 3)
  const celoProjects = repos.filter((r) => typeof r.season === "number");

  const metricsOptions = ["Total Commits", "Open Issues", "Open PRs"];
  const [selectedMetrics, setSelectedMetrics] = useState(["Total Commits"]);
  const [chartType, setChartType] = useState("line");
  const [selectedSeasons, setSelectedSeasons] = useState([3, 2, 1]);

  // Filter projects by selected seasons
  const filteredProjects = celoProjects.filter((p) =>
    selectedSeasons.includes(p.season)
  );

  const labels = filteredProjects.map((r) => r.slug);
  const datasets = selectedMetrics.map((metric) => {
    let data = [];
    let label = metric;
    let backgroundColor;

    if (metric === "Total Commits") {
      data = filteredProjects.map((r) => {
        const commitsArr = Array.isArray(dataMap[r.slug]?.commits)
          ? dataMap[r.slug].commits
          : [];
        return commitsArr.reduce((sum, week) => sum + (week.total || 0), 0);
      });
      backgroundColor = filteredProjects.map((r) => {
        const commitsArr = Array.isArray(dataMap[r.slug]?.commits)
          ? dataMap[r.slug].commits
          : [];
        const total = commitsArr.reduce(
          (sum, week) => sum + (week.total || 0),
          0
        );
        return total >= 1000
          ? "rgba(255, 193, 7, 0.5)"
          : "rgba(75, 192, 192, 0.5)";
      });
    } else if (metric === "Open Issues") {
      data = filteredProjects.map(
        (r) => (dataMap[r.slug]?.issues || []).length
      );
      backgroundColor = "rgba(255, 99, 132, 0.5)";
    } else if (metric === "Open PRs") {
      data = filteredProjects.map(
        (r) =>
          (dataMap[r.slug]?.prs || []).filter((p) => p.state === "open").length
      );
      backgroundColor = "rgba(54, 162, 235, 0.5)";
    }

    return { label, data, backgroundColor };
  });

  // Prepare line chart data for weekly commit activity
  let sampleCommits = [];
  for (const r of filteredProjects) {
    const arr = Array.isArray(dataMap[r.slug]?.commits)
      ? dataMap[r.slug].commits
      : [];
    if (arr.length >= 12) {
      sampleCommits = arr;
      break;
    }
  }
  const last12Weeks = sampleCommits.slice(-12);
  const lineLabels = last12Weeks.map((weekObj) => {
    const d = new Date(weekObj.week * 1000);
    return d.toLocaleDateString(undefined, { month: "short", day: "numeric" });
  });

  const lineDatasets = filteredProjects.map((r, idx) => {
    const commitsArr = Array.isArray(dataMap[r.slug]?.commits)
      ? dataMap[r.slug].commits
      : [];
    const last12 = commitsArr.slice(-12);
    const color = COLORS[idx % COLORS.length];
    return {
      label: r.slug,
      data: last12.map((week) => week.total),
      fill: false,
      borderColor: color,
      backgroundColor: color,
      tension: 0.3,
      pointRadius: 2,
      hidden: !visibleProjects.has(r.slug),
    };
  });

  const toggleMetric = (metric) => {
    setSelectedMetrics((curr) =>
      curr.includes(metric)
        ? curr.filter((m) => m !== metric)
        : [...curr, metric]
    );
  };

  const toggleSeason = (season) => {
    setSelectedSeasons((curr) =>
      curr.includes(season)
        ? curr.filter((s) => s !== season)
        : [...curr, season]
    );
  };

  const toggleProject = (slug) => {
    setVisibleProjects((curr) => {
      const newSet = new Set(curr);
      if (newSet.has(slug)) {
        newSet.delete(slug);
      } else {
        newSet.add(slug);
      }
      return newSet;
    });
  };

  // Function to get GitHub repo URL
  const getGithubUrl = (project) => {
    return `https://github.com/${project.owner}/${project.repo}`;
  };

  return (
    <div className="p-6 min-h-screen flex flex-col">
      <h1 className="text-3xl font-bold mb-6">Celo Proof Of Ship Projects</h1>
      <div className="mb-4">
        <h2 className="text-lg font-semibold mb-2">Filter by Season</h2>
        <div className="flex gap-4">
          {[3, 2, 1].map((season) => (
            <label key={season} className="inline-flex items-center">
              <input
                type="checkbox"
                checked={selectedSeasons.includes(season)}
                onChange={() => toggleSeason(season)}
                className="form-checkbox h-4 w-4 text-indigo-600"
              />
              <span className="ml-2 text-gray-700">Season {season}</span>
            </label>
          ))}
        </div>
      </div>
      <div className="mb-4 flex flex-wrap items-center gap-6">
        <div>
          <h2 className="text-lg font-semibold mb-2">Metrics</h2>
          {metricsOptions.map((metric) => (
            <label key={metric} className="inline-flex items-center mr-4">
              <input
                type="checkbox"
                checked={selectedMetrics.includes(metric)}
                onChange={() => toggleMetric(metric)}
                className="form-checkbox h-4 w-4 text-indigo-600"
              />
              <span className="ml-2 text-gray-700">{metric}</span>
            </label>
          ))}
        </div>
        <div className="ml-auto">
          <h2 className="text-lg font-semibold mb-2">Chart Type</h2>
          <button
            className={`px-3 py-1 rounded-l border ${
              chartType === "bar"
                ? "bg-amber-600 text-white"
                : "bg-white text-gray-700"
            }`}
            onClick={() => setChartType("bar")}
          >
            Bar
          </button>
          <button
            className={`px-3 py-1 rounded-r border-l-0 border ${
              chartType === "line"
                ? "bg-amber-600 text-white"
                : "bg-white text-gray-700"
            }`}
            onClick={() => setChartType("line")}
          >
            Line
          </button>
        </div>
      </div>
      <div className="bg-white shadow rounded-lg p-4 mb-10">
        {chartType === "bar" ? (
          <Bar
            data={{ labels, datasets }}
            options={{
              responsive: true,
              plugins: {
                legend: { display: false },
              },
            }}
          />
        ) : (
          <div className="relative">
            <Line
              data={{ labels: lineLabels, datasets: lineDatasets }}
              options={{
                responsive: true,
                plugins: {
                  legend: { display: false },
                },
                scales: {
                  y: { beginAtZero: true },
                },
              }}
            />
            <div className="absolute top-0 right-0 bg-white/90 p-2 rounded shadow-sm text-xs">
              {filteredProjects.map((project, idx) => (
                <div
                  key={project.slug}
                  className="flex items-center gap-1 cursor-pointer hover:bg-gray-50 px-1 py-0.5 rounded"
                  onClick={() => toggleProject(project.slug)}
                >
                  <div
                    className="w-2 h-2 rounded-full"
                    style={{ backgroundColor: COLORS[idx % COLORS.length] }}
                  ></div>
                  <span
                    className={
                      !visibleProjects.has(project.slug) ? "opacity-50" : ""
                    }
                  >
                    {project.slug.slice(0, 3).toUpperCase()}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Project Cards */}
      <div className="bg-white shadow rounded-lg p-4 mb-6">
        <h2 className="text-xl font-semibold mb-6 text-center">Projects</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-3">
          {celoProjects.map((project, idx) => (
            <div
              key={project.slug}
              className={`border rounded-lg p-2 flex items-center justify-between hover:bg-gray-50 transition-colors cursor-pointer ${
                !visibleProjects.has(project.slug) ? "opacity-50" : ""
              }`}
              onClick={() => toggleProject(project.slug)}
            >
              <div className="flex items-center gap-2 min-w-0">
                <div
                  className="w-2 h-2 rounded-full flex-shrink-0"
                  style={{ backgroundColor: COLORS[idx % COLORS.length] }}
                ></div>
                <div className="font-medium truncate">{project.slug}</div>
                <span className="px-1.5 py-0.5 text-xs rounded-full bg-amber-100 text-amber-800 flex-shrink-0">
                  S{project.season}
                </span>
              </div>
              <a
                href={getGithubUrl(project)}
                target="_blank"
                rel="noopener noreferrer"
                className="text-gray-500 hover:text-gray-700 flex-shrink-0 ml-2"
                onClick={(e) => e.stopPropagation()}
              >
                <svg
                  className="w-4 h-4"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path d="M12 0C5.37 0 0 5.37 0 12c0 5.3 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61-.546-1.387-1.333-1.756-1.333-1.756-1.09-.745.083-.73.083-.73 1.205.085 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.605-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 21.795 24 17.295 24 12c0-6.63-5.37-12-12-12" />
                </svg>
              </a>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
