import React, { useEffect, useRef, useState } from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js';
import { Line } from 'react-chartjs-2';
import { Card, CardHeader, CardTitle, CardContent, Button } from '@/components/common';
import { CalendarIcon, ArrowTrendingUpIcon, ArrowTrendingDownIcon } from '@heroicons/react/24/outline';

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

// Generate mock historical data
const generateMockHistoryData = (months = 12) => {
  const data = [];
  const now = new Date();
  
  for (let i = months - 1; i >= 0; i--) {
    const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const baseScore = 650 + Math.random() * 150; // Random score between 650-800
    
    data.push({
      date: date.toISOString().split('T')[0],
      totalScore: Math.round(baseScore),
      github: Math.round(baseScore * 0.4 + Math.random() * 20),
      social: Math.round(baseScore * 0.3 + Math.random() * 15),
      onchain: Math.round(baseScore * 0.2 + Math.random() * 10),
      identity: Math.round(baseScore * 0.1 + Math.random() * 5),
      events: i === 0 ? ['GitHub streak started'] : i === 3 ? ['First DeFi transaction'] : []
    });
  }
  
  return data;
};

// Time range options
const timeRanges = [
  { label: '3M', value: 3, description: '3 months' },
  { label: '6M', value: 6, description: '6 months' },
  { label: '1Y', value: 12, description: '1 year' },
  { label: 'All', value: 24, description: 'All time' }
];

export const ScoreHistoryChart = ({ 
  historyData = null,
  className = '',
  showBreakdown = true,
  interactive = true 
}) => {
  const [timeRange, setTimeRange] = useState(6);
  const [selectedMetric, setSelectedMetric] = useState('totalScore');
  const [data, setData] = useState([]);
  const chartRef = useRef(null);

  // Use mock data if no real data provided
  useEffect(() => {
    const mockData = historyData || generateMockHistoryData(timeRange);
    setData(mockData.slice(-timeRange));
  }, [historyData, timeRange]);

  // Calculate trend
  const calculateTrend = (data, metric) => {
    if (data.length < 2) return { change: 0, percentage: 0, direction: 'neutral' };
    
    const latest = data[data.length - 1][metric];
    const previous = data[data.length - 2][metric];
    const change = latest - previous;
    const percentage = ((change / previous) * 100).toFixed(1);
    
    return {
      change: Math.round(change),
      percentage: Math.abs(percentage),
      direction: change > 0 ? 'up' : change < 0 ? 'down' : 'neutral'
    };
  };

  const trend = calculateTrend(data, selectedMetric);

  // Chart configuration
  const chartData = {
    labels: data.map(item => {
      const date = new Date(item.date);
      return date.toLocaleDateString('en-US', { month: 'short', year: '2-digit' });
    }),
    datasets: [
      {
        label: getMetricLabel(selectedMetric),
        data: data.map(item => item[selectedMetric]),
        borderColor: getMetricColor(selectedMetric),
        backgroundColor: `${getMetricColor(selectedMetric)}20`,
        borderWidth: 3,
        fill: true,
        tension: 0.4,
        pointBackgroundColor: getMetricColor(selectedMetric),
        pointBorderColor: '#ffffff',
        pointBorderWidth: 2,
        pointRadius: 6,
        pointHoverRadius: 8,
        pointHoverBackgroundColor: getMetricColor(selectedMetric),
        pointHoverBorderColor: '#ffffff',
        pointHoverBorderWidth: 3
      }
    ]
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: {
      intersect: false,
      mode: 'index'
    },
    plugins: {
      legend: {
        display: false
      },
      tooltip: {
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        titleColor: '#ffffff',
        bodyColor: '#ffffff',
        borderColor: getMetricColor(selectedMetric),
        borderWidth: 1,
        cornerRadius: 8,
        displayColors: false,
        callbacks: {
          title: (context) => {
            const dataIndex = context[0].dataIndex;
            const date = new Date(data[dataIndex].date);
            return date.toLocaleDateString('en-US', { 
              month: 'long', 
              year: 'numeric' 
            });
          },
          label: (context) => {
            const value = context.parsed.y;
            const dataIndex = context.dataIndex;
            const events = data[dataIndex].events;
            
            let label = `${getMetricLabel(selectedMetric)}: ${value}`;
            if (events && events.length > 0) {
              label += `\n• ${events.join('\n• ')}`;
            }
            return label;
          }
        }
      }
    },
    scales: {
      x: {
        grid: {
          display: false
        },
        border: {
          display: false
        },
        ticks: {
          color: '#6b7280',
          font: {
            size: 12
          }
        }
      },
      y: {
        beginAtZero: false,
        grid: {
          color: '#f3f4f6',
          borderDash: [2, 2]
        },
        border: {
          display: false
        },
        ticks: {
          color: '#6b7280',
          font: {
            size: 12
          },
          callback: function(value) {
            return Math.round(value);
          }
        }
      }
    },
    elements: {
      point: {
        hoverRadius: 8
      }
    }
  };

  return (
    <div className={`space-y-6 ${className}`}>
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
            <div>
              <CardTitle className="flex items-center space-x-2">
                <CalendarIcon className="h-5 w-5" />
                <span>Score History</span>
              </CardTitle>
              <p className="text-sm text-secondary mt-1">
                Track your credit score progress over time
              </p>
            </div>
            
            {/* Time range selector */}
            <div className="flex space-x-1 bg-background-secondary rounded-lg p-1">
              {timeRanges.map((range) => (
                <button
                  key={range.value}
                  onClick={() => setTimeRange(range.value)}
                  className={`
                    px-3 py-1 text-sm font-medium rounded-md transition-colors
                    ${timeRange === range.value
                      ? 'bg-surface text-primary shadow-sm'
                      : 'text-secondary hover:text-primary hover:bg-surface-hover'
                    }
                  `}
                >
                  {range.label}
                </button>
              ))}
            </div>
          </div>
        </CardHeader>
        
        <CardContent>
          {/* Metric selector and trend */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6 space-y-4 sm:space-y-0">
            <div className="flex flex-wrap gap-2">
              {[
                { key: 'totalScore', label: 'Total Score' },
                { key: 'github', label: 'GitHub' },
                { key: 'social', label: 'Social' },
                { key: 'onchain', label: 'On-Chain' },
                { key: 'identity', label: 'Identity' }
              ].map((metric) => (
                <button
                  key={metric.key}
                  onClick={() => setSelectedMetric(metric.key)}
                  className={`
                    px-3 py-1 text-sm font-medium rounded-full transition-colors
                    ${selectedMetric === metric.key
                      ? 'text-white shadow-sm'
                      : 'bg-surface text-secondary hover:text-primary hover:bg-surface-hover'
                    }
                  `}
                  style={{
                    backgroundColor: selectedMetric === metric.key ? getMetricColor(metric.key) : undefined
                  }}
                >
                  {metric.label}
                </button>
              ))}
            </div>
            
            {/* Trend indicator */}
            <div className="flex items-center space-x-2">
              {trend.direction === 'up' && (
                <div className="flex items-center space-x-1 text-success-600">
                  <ArrowTrendingUpIcon className="h-4 w-4" />
                  <span className="text-sm font-medium">+{trend.change}</span>
                  <span className="text-xs">({trend.percentage}%)</span>
                </div>
              )}
              {trend.direction === 'down' && (
                <div className="flex items-center space-x-1 text-error-600">
                  <ArrowTrendingDownIcon className="h-4 w-4" />
                  <span className="text-sm font-medium">{trend.change}</span>
                  <span className="text-xs">({trend.percentage}%)</span>
                </div>
              )}
              {trend.direction === 'neutral' && (
                <div className="text-sm text-secondary">No change</div>
              )}
            </div>
          </div>
          
          {/* Chart */}
          <div className="h-80">
            <Line ref={chartRef} data={chartData} options={chartOptions} />
          </div>
          
          {/* Key insights */}
          <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center p-4 bg-surface-secondary rounded-lg">
              <div className="text-2xl font-bold text-primary">
                {data.length > 0 ? Math.round(data[data.length - 1].totalScore) : 0}
              </div>
              <div className="text-sm text-secondary">Current Score</div>
            </div>
            
            <div className="text-center p-4 bg-surface-secondary rounded-lg">
              <div className="text-2xl font-bold text-primary">
                {data.length > 0 ? Math.round(Math.max(...data.map(d => d.totalScore))) : 0}
              </div>
              <div className="text-sm text-secondary">Highest Score</div>
            </div>
            
            <div className="text-center p-4 bg-surface-secondary rounded-lg">
              <div className="text-2xl font-bold text-primary">
                {data.length > 1 ? Math.round(data[data.length - 1].totalScore - data[0].totalScore) : 0}
              </div>
              <div className="text-sm text-secondary">Total Change</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

// Helper functions
const getMetricLabel = (metric) => {
  const labels = {
    totalScore: 'Total Score',
    github: 'GitHub Score',
    social: 'Social Score',
    onchain: 'On-Chain Score',
    identity: 'Identity Score'
  };
  return labels[metric] || 'Score';
};

const getMetricColor = (metric) => {
  const colors = {
    totalScore: '#3b82f6',
    github: '#3b82f6',
    social: '#8b5cf6',
    onchain: '#10b981',
    identity: '#f59e0b'
  };
  return colors[metric] || '#3b82f6';
};

export default ScoreHistoryChart;
