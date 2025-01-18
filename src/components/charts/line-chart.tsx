"use client"

import { Line } from "react-chartjs-2"
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Filler,
} from "chart.js"

// Register ChartJS components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Filler
)

// Chart options
const options = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: {
      display: false,
    },
    tooltip: {
      enabled: false,
    },
  },
  scales: {
    x: {
      display: false,
    },
    y: {
      display: false,
    },
  },
  elements: {
    line: {
      tension: 0.4,
    },
    point: {
      radius: 0,
    },
  },
}

// Mock data
const labels = ["Jan", "Feb", "Mar", "Apr", "May", "Jun"]
const mockData = {
  labels,
  datasets: [
    {
      fill: true,
      data: [30, 55, 45, 60, 40, 50],
      borderColor: "#60a5fa",
      backgroundColor: "rgba(96, 165, 250, 0.1)",
      borderWidth: 2,
    },
  ],
}

export function LineChart() {
  return <Line options={options} data={mockData} />
} 