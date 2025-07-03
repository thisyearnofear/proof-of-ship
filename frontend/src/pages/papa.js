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

export default function papa() {
  const { repos, dataMap, loading } = useGithub();
  if (loading) {
    return (
      <div className="p-8 text-center text-gray-400">Loading project data…</div>
    );
  }

  // Filter only Papa projects
  const papaProjects = repos.filter((r) => r.season === "papa");

  const metricsOptions = ["Total Commits", "Open Issues", "Open PRs"];
  const [selectedMetrics, setSelectedMetrics] = useState(["Total Commits"]);
  const [chartType, setChartType] = useState("line");

  const labels = papaProjects.map((r) => r.slug);
  const datasets = selectedMetrics.map((metric) => {
    let data = [];
    let label = metric;
    let backgroundColor;

    if (metric === "Total Commits") {
      data = papaProjects.map((r) => {
        const commitsArr = Array.isArray(dataMap[r.slug]?.commits)
          ? dataMap[r.slug].commits
          : [];
        return commitsArr.reduce((sum, week) => sum + (week.total || 0), 0);
      });
      backgroundColor = papaProjects.map((r) => {
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
      data = papaProjects.map((r) => (dataMap[r.slug]?.issues || []).length);
      backgroundColor = "rgba(255, 99, 132, 0.5)";
    } else if (metric === "Open PRs") {
      data = papaProjects.map(
        (r) =>
          (dataMap[r.slug]?.prs || []).filter((p) => p.state === "open").length
      );
      backgroundColor = "rgba(54, 162, 235, 0.5)";
    }

    return { label, data, backgroundColor };
  });

  // Prepare line chart data for weekly commit activity
  let sampleCommits = [];
  for (const r of papaProjects) {
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
  const lineDatasets = papaProjects.map((r) => {
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

  // Project URLs
  const projectUrls = {
    famile: "https://famile.xyz/",
    imperfect: "https://imperfectform.fun/",
    amacast: "https://amacast.netlify.app/",
    megavibe: "http://megavibe.vercel.app/",
    coupondj: "http://coupondj.vercel.app/",
  };

  return (
    <div className="p-6 min-h-screen flex flex-col">
      <h1 className="text-3xl font-bold mb-6">Papa Dashboard</h1>
      <div className="mb-4 flex flex-wrap items-center gap-6">
        <div>
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

      {/* Project Links */}
      <div className="bg-white shadow rounded-lg p-4 mb-6">
        <h2 className="text-xl font-semibold mb-3">Projects by Chain</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {papaProjects.map((project) => (
            <a
              key={project.slug}
              href={projectUrls[project.slug]}
              target="_blank"
              rel="noopener noreferrer"
              className="border rounded-lg p-3 flex items-center hover:bg-gray-50 transition-colors"
            >
              <div className="w-3 h-3 rounded-full bg-amber-500 mr-2"></div>
              <div>
                <div className="font-medium">{project.slug}</div>
                <div className="text-sm text-gray-500">{project.chain}</div>
              </div>
            </a>
          ))}
        </div>
      </div>
    </div>
  );
}
