import React from "react";
import { Bar } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Tooltip,
  Legend,
} from "chart.js";

ChartJS.register(CategoryScale, LinearScale, BarElement, Tooltip, Legend);

/**
 * @param {Object[]} transactions - Array of transaction objects with timestamp and value
 * @param {boolean} loading
 */
export default function ContractUsageChart({ transactions, loading }) {
  if (loading) return <div className="py-6 text-center text-gray-400">Loading chart…</div>;
  if (!transactions || transactions.length === 0)
    return <div className="py-6 text-center text-gray-400">No transaction data.</div>;

  // Group transactions by day
  const txsByDay = {};
  transactions.forEach((tx) => {
    const date = tx.timestamp
      ? new Date(tx.timestamp * 1000).toLocaleDateString()
      : "Unknown";
    txsByDay[date] = (txsByDay[date] || 0) + 1;
  });
  const labels = Object.keys(txsByDay);
  const data = Object.values(txsByDay);

  const chartData = {
    labels,
    datasets: [
      {
        label: "Transactions per Day",
        data,
        backgroundColor: "rgba(75,192,192,0.6)",
      },
    ],
  };

  return (
    <div className="bg-white rounded-lg shadow p-4">
      <div className="text-md font-semibold mb-2">Recent Transaction Activity</div>
      <Bar data={chartData} options={{ responsive: true, plugins: { legend: { display: false } } }} />
    </div>
  );
}
