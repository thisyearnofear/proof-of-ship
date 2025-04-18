import { useState } from 'react';
import { Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Legend,
  Tooltip
} from 'chart.js';
import { useGithub } from '@/providers/Github/Github';

ChartJS.register(CategoryScale, LinearScale, BarElement, Legend, Tooltip);

export default function Overview() {
  const { repos, dataMap } = useGithub();
  const metricsOptions = ['Total Commits', 'Open Issues', 'Open PRs'];
  const [selectedMetrics, setSelectedMetrics] = useState(['Total Commits']);

  const labels = repos.map(r => r.slug);
  const datasets = selectedMetrics.map(metric => {
    let data = [];
    let label = metric;
    let backgroundColor;

    if (metric === 'Total Commits') {
      data = repos.map(r =>
        (dataMap[r.slug].commits || []).reduce((sum, week) => sum + (week.total || 0), 0)
      );
      backgroundColor = repos.map(r => {
        const total = (dataMap[r.slug].commits || []).reduce((sum, week) => sum + (week.total || 0), 0);
        return total >= 1000 ? 'rgba(255, 193, 7, 0.5)' : 'rgba(75, 192, 192, 0.5)';
      });
    } else if (metric === 'Open Issues') {
      data = repos.map(r => (dataMap[r.slug].issues || []).length);
      backgroundColor = 'rgba(255, 99, 132, 0.5)';
    } else if (metric === 'Open PRs') {
      data = repos.map(r => (dataMap[r.slug].prs || []).filter(p => p.state === 'open').length);
      backgroundColor = 'rgba(54, 162, 235, 0.5)';
    }

    return { label, data, backgroundColor };
  });

  const toggleMetric = (metric) => {
    setSelectedMetrics(curr =>
      curr.includes(metric)
        ? curr.filter(m => m !== metric)
        : [...curr, metric]
    );
  };

  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold mb-6">Overview</h1>
      <div className="mb-4">
        {metricsOptions.map(metric => (
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
      <div className="bg-white shadow rounded-lg p-4">
        <Bar
          data={{ labels, datasets }}
          options={{
            responsive: true,
            plugins: {
              legend: { position: 'bottom' }
            }
          }}
        />
      </div>
    </div>
  );
}
