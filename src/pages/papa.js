import { useState, useMemo } from "react";
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

export default function Papa() {
  const { repos, dataMap, loading } = useGithub();
  if (loading) {
    return (
      <div className="p-8 text-center text-gray-400">Loading project data…</div>
    );
  }

  // Filter only Papa's personal projects
  const papaProjects = repos.filter((r) => r.season === "papa");

  const metricsOptions = [
    "Total Commits",
    "Daily Commits",
    "Open Issues",
    "Open PRs",
  ];
  const [selectedMetrics, setSelectedMetrics] = useState(["Daily Commits"]);
  const [chartType, setChartType] = useState("line"); // 'bar' or 'line' (default is line)
  const [timeRange, setTimeRange] = useState("7d"); // '7d', '30d', 'all'

  // Daily commit data for progress tracking
  const getDailyCommits = (repoSlug, daysAgo = 7) => {
    const commitsArr = Array.isArray(dataMap[repoSlug]?.commits)
      ? dataMap[repoSlug].commits
      : [];
    // Return last X days of commit data
    return commitsArr
      .slice(-daysAgo)
      .map((week) => week.days)
      .flat();
  };

  // Calculate total commits across all projects per day
  const getDailyCombinedCommits = (daysAgo = 7) => {
    const dailyTotals = Array(daysAgo).fill(0);

    papaProjects.forEach((project) => {
      const dailyCommits = getDailyCommits(project.slug, daysAgo);
      // Add each project's daily commits to the total
      dailyCommits.forEach((count, i) => {
        if (i < dailyTotals.length) {
          dailyTotals[i] += count;
        }
      });
    });

    return dailyTotals;
  };

  // Calculate progress toward 100 commits per day
  const dailyCommits = getDailyCombinedCommits(
    timeRange === "7d" ? 7 : timeRange === "30d" ? 30 : 90
  );
  const totalDailyTargetMet = dailyCommits.filter(
    (count) => count >= 100
  ).length;
  const progressPercentage = (totalDailyTargetMet / dailyCommits.length) * 100;

  // Generate date labels for the chart
  const getDateLabels = (daysAgo) => {
    const labels = [];
    for (let i = daysAgo - 1; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      labels.push(
        d.toLocaleDateString(undefined, { month: "short", day: "numeric" })
      );
    }
    return labels;
  };

  const dateLabels = getDateLabels(
    timeRange === "7d" ? 7 : timeRange === "30d" ? 30 : 90
  );

  // Data for project comparison
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
    } else if (metric === "Daily Commits") {
      // Not used for bar chart, only for lineChart
      data = [];
      backgroundColor = "rgba(153, 102, 255, 0.5)";
    }

    return { label, data, backgroundColor };
  });

  // Daily commits line chart data
  const lineDatasets = useMemo(() => {
    // Dataset for 100 commit goal line
    const datasets = [
      {
        label: "100 Commit Goal",
        data: Array(dateLabels.length).fill(100),
        borderColor: "rgba(255, 99, 132, 1)",
        backgroundColor: "rgba(255, 99, 132, 0.2)",
        borderDash: [5, 5],
        pointRadius: 0,
        fill: false,
      },
      {
        label: "Total Daily Commits",
        data: dailyCommits,
        borderColor: "rgba(54, 162, 235, 1)",
        backgroundColor: "rgba(54, 162, 235, 0.2)",
        tension: 0.3,
        fill: true,
      },
    ];

    // Add individual project datasets if selected
    if (selectedMetrics.includes("Daily Commits")) {
      papaProjects.forEach((project) => {
        const projectDailyCommits = getDailyCommits(
          project.slug,
          timeRange === "7d" ? 7 : timeRange === "30d" ? 30 : 90
        );
        const hue = Math.floor(Math.random() * 360);

        datasets.push({
          label: `${project.slug} (${project.chain})`,
          data: projectDailyCommits,
          borderColor: `hsl(${hue}, 70%, 60%)`,
          backgroundColor: `hsl(${hue}, 70%, 80%, 0.1)`,
          tension: 0.3,
          pointRadius: 2,
          fill: false,
        });
      });
    }

    return datasets;
  }, [selectedMetrics, papaProjects, dailyCommits, timeRange, dateLabels]);

  const toggleMetric = (metric) => {
    setSelectedMetrics((curr) =>
      curr.includes(metric)
        ? curr.filter((m) => m !== metric)
        : [...curr, metric]
    );
  };

  return (
    <div className="p-6 min-h-screen flex flex-col">
      <h1 className="text-3xl font-bold mb-2">Papa's 100 Commit Challenge</h1>

      {/* Goal Progress */}
      <div className="bg-white shadow rounded-lg p-4 mb-6">
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-xl font-semibold">
            Progress toward 100 daily commits
          </h2>
          <div className="text-lg font-bold text-amber-600">
            {totalDailyTargetMet} / {dailyCommits.length} days
          </div>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-4">
          <div
            className="bg-amber-600 h-4 rounded-full"
            style={{ width: `${progressPercentage}%` }}
          ></div>
        </div>
        <div className="mt-2 text-gray-600 text-sm">
          {progressPercentage.toFixed(1)}% of days met the 100 commit target
        </div>
      </div>

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

        {/* Time Range Selector */}
        <div className="flex border rounded overflow-hidden">
          <button
            className={`px-3 py-1 ${
              timeRange === "7d"
                ? "bg-amber-600 text-white"
                : "bg-white text-gray-700"
            }`}
            onClick={() => setTimeRange("7d")}
          >
            7 Days
          </button>
          <button
            className={`px-3 py-1 border-l ${
              timeRange === "30d"
                ? "bg-amber-600 text-white"
                : "bg-white text-gray-700"
            }`}
            onClick={() => setTimeRange("30d")}
          >
            30 Days
          </button>
          <button
            className={`px-3 py-1 border-l ${
              timeRange === "all"
                ? "bg-amber-600 text-white"
                : "bg-white text-gray-700"
            }`}
            onClick={() => setTimeRange("all")}
          >
            All Time
          </button>
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
                tooltip: {
                  callbacks: {
                    footer: (tooltipItems) => {
                      const idx = tooltipItems[0].dataIndex;
                      return `Chain: ${papaProjects[idx].chain}`;
                    },
                  },
                },
              },
            }}
          />
        ) : (
          <Line
            data={{ labels: dateLabels, datasets: lineDatasets }}
            options={{
              responsive: true,
              plugins: {
                legend: { position: "bottom" },
                tooltip: {
                  callbacks: {
                    footer: (tooltipItems) => {
                      const value = tooltipItems[0].raw;
                      if (tooltipItems[0].datasetIndex === 1) {
                        // Total commits
                        return value >= 100
                          ? "✅ Daily goal met!"
                          : "❌ Below daily goal";
                      }
                      return "";
                    },
                  },
                },
              },
              scales: {
                y: {
                  beginAtZero: true,
                  title: {
                    display: true,
                    text: "Commits",
                  },
                },
              },
            }}
          />
        )}
      </div>

      {/* Project Chain Info */}
      <div className="bg-white shadow rounded-lg p-4 mb-6">
        <h2 className="text-xl font-semibold mb-3">Projects by Chain</h2>
        <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
          {papaProjects.map((project) => (
            <div
              key={project.slug}
              className="border rounded-lg p-3 flex items-center"
            >
              <div className="w-3 h-3 rounded-full bg-amber-500 mr-2"></div>
              <div>
                <div className="font-medium">{project.slug}</div>
                <div className="text-xs text-gray-500">{project.chain}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
