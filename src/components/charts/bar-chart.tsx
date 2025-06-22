"use client";

import {
  BarElement,
  CategoryScale,
  Chart as ChartJS,
  Legend,
  LinearScale,
  Title,
  Tooltip,
} from "chart.js";
import { Bar } from "react-chartjs-2";

// Register ChartJS components
ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

// Chart options
const options = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: {
      position: "top" as const,
      labels: {
        boxWidth: 8,
        usePointStyle: true,
        pointStyle: "circle",
      },
    },
  },
  scales: {
    x: {
      grid: {
        display: false,
      },
    },
    y: {
      grid: {
        color: "#f3f4f6",
      },
      ticks: {
        stepSize: 100,
      },
    },
  },
};

interface BarChartProps {
  data: {
    months: string[];
    data2022: number[];
    data2023: number[];
  };
}

export function BarChart({ data }: BarChartProps) {
  const chartData = {
    labels: data.months,
    datasets: [
      {
        label: "2023",
        data: data.data2023,
        backgroundColor: "#60a5fa",
        borderRadius: 4,
      },
      {
        label: "2022",
        data: data.data2022,
        backgroundColor: "#93c5fd",
        borderRadius: 4,
      },
    ],
  };

  return <Bar options={options} data={chartData} />;
}
