import { useState } from "react";
import { Bar, Line } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  Legend,
  Tooltip,
} from "chart.js";
import { useGithub } from "@/providers/Github/Github";

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  Legend,
  Tooltip
);

export default function shippers() {
  const { repos, dataMap, loading } = useGithub();
  if (loading) {
    return (
      <div className="p-8 text-center text-gray-400">Loading project data…</div>
    );
  }

  // Filter only Celo projects (season 1, 2, and 3)
  const celoProjects = repos.filter((r) => typeof r.season === "number");

  const metricsOptions = ["Total Commits", "Open Issues", "Open PRs"];
  const [selectedMetrics, setSelectedMetrics] = useState(["Total Commits"]);
  const [chartType, setChartType] = useState("line"); // 'bar' or 'line' (default is line)
  const [selectedSeasons, setSelectedSeasons] = useState([1, 2, 3]);

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
  // Only show last 12 weeks, use actual week start dates as labels
  // Find the repo with the most recent non-empty commits array
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
  const lineDatasets = filteredProjects.map((r) => {
    const commitsArr = Array.isArray(dataMap[r.slug]?.commits)
      ? dataMap[r.slug].commits
      : [];
    const last12 = commitsArr.slice(-12);
    return {
      label: r.slug,
      data: last12.map((week) => week.total),
      fill: false,
      borderColor: `hsl(${Math.floor(Math.random() * 360)},70%,60%)`,
      backgroundColor: `hsl(${Math.floor(Math.random() * 360)},70%,80%)`,
      tension: 0.3,
      pointRadius: 2,
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

  return (
    <div className="p-6 min-h-screen flex flex-col">
      <h1 className="text-3xl font-bold mb-6">Celo Proof Of Ship Projects</h1>
      <div className="mb-4">
        <h2 className="text-lg font-semibold mb-2">Filter by Season</h2>
        <div className="flex gap-4">
          {[1, 2, 3].map((season) => (
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
                legend: { position: "bottom" },
              },
            }}
          />
        ) : (
          <Line
            data={{ labels: lineLabels, datasets: lineDatasets }}
            options={{
              responsive: true,
              plugins: {
                legend: { position: "bottom" },
              },
              scales: {
                y: { beginAtZero: true },
              },
            }}
          />
        )}
      </div>

      {/* Project Season Info */}
      <div className="bg-white shadow rounded-lg p-4 mb-6">
        <h2 className="text-xl font-semibold mb-3">Projects by Season</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[1, 2, 3].map((season) => (
            <div key={season}>
              <h3 className="text-lg font-medium mb-2">Season {season}</h3>
              <div className="space-y-2">
                {celoProjects
                  .filter((p) => p.season === season)
                  .map((project) => (
                    <div
                      key={project.slug}
                      className="border rounded-lg p-3 flex items-center"
                    >
                      <div className="w-3 h-3 rounded-full bg-amber-500 mr-2"></div>
                      <div className="font-medium">{project.slug}</div>
                    </div>
                  ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
