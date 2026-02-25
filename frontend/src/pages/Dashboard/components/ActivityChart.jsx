import React, { useState, useRef, useEffect } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

const ActivityChart = ({ data }) => {
  const [activeTab, setActiveTab] = useState("watchTime");

  const tabs = [
    { id: "watchTime", label: "Watch Time", color: "#6366f1", format: "time" },
    {
      id: "appOpenTime",
      label: "App Opened Time",
      color: "#8b5cf6",
      format: "time",
    },
    {
      id: "videosWatched",
      label: "Videos Watched",
      color: "#10b981",
      format: "count",
    },
    {
      id: "quizzesSolved",
      label: "Quizzes Solved",
      color: "#f59e0b",
      format: "count",
    },
  ];

  const [timeRange, setTimeRange] = useState("month");
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);
  const [chartReady, setChartReady] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setChartReady(true), 150);
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      clearTimeout(timer);
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const timeFilters = [
    { id: "month", label: "1M" },
    { id: "3months", label: "3M" },
    { id: "year", label: "1Y" },
    { id: "all", label: "All" },
  ];

  const currentTab = tabs.find((t) => t.id === activeTab);

  // Format tooltips for time values (seconds to minutes)
  const formatTimeValue = (value) =>
    `${Math.floor(value / 60)}m ${value % 60}s`;

  // Apply Time Range Filter
  const filteredData = React.useMemo(() => {
    if (timeRange === "all" || !data) return data;

    const now = new Date();
    let cutoffDate = new Date();

    if (timeRange === "month") {
      cutoffDate.setMonth(now.getMonth() - 1);
    } else if (timeRange === "3months") {
      cutoffDate.setMonth(now.getMonth() - 3);
    } else if (timeRange === "year") {
      cutoffDate.setFullYear(now.getFullYear() - 1);
    }

    const cutoffTime = cutoffDate.getTime();
    return data.filter((d) => new Date(d.date).getTime() >= cutoffTime);
  }, [data, timeRange]);

  return (
    <div className="bg-white/80 backdrop-blur-xl p-5 sm:p-8 rounded-[2rem] shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100 h-[400px] sm:h-[450px] flex flex-col relative overflow-hidden">
      {/* Header Container */}
      <div className="flex flex-wrap items-center justify-between gap-y-4 gap-x-4 mb-6 sm:mb-8">
        <h3 className="text-xl sm:text-2xl font-extrabold text-slate-800 flex-shrink-0 order-1 tracking-tight">
          Daily Activity
        </h3>

        {/* Dropdown Container */}
        <div
          className="relative z-20 flex-shrink-0 order-2 lg:order-3 ml-auto"
          ref={dropdownRef}
        >
          <div className="relative">
            <button
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              className="flex items-center gap-1.5 sm:gap-2 appearance-none bg-slate-50 hover:bg-slate-100 text-slate-600 font-bold rounded-xl transition-all px-3 sm:px-4 py-2 cursor-pointer outline-none focus:outline-none border border-slate-200"
            >
              <span className="text-xs sm:text-sm">
                {timeFilters.find((f) => f.id === timeRange)?.label ||
                  "30 Days"}
              </span>
              <svg
                className={`w-4 h-4 text-slate-400 transition-transform duration-300 ${isDropdownOpen ? "rotate-180" : ""}`}
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2.5}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M19 9l-7 7-7-7"
                />
              </svg>
            </button>

            {isDropdownOpen && (
              <div className="absolute right-0 mt-2 w-32 sm:w-36 bg-white/90 backdrop-blur-xl rounded-2xl shadow-[0_10px_40px_rgba(0,0,0,0.1)] border border-slate-100 p-1.5 overflow-hidden origin-top-right z-50">
                {timeFilters.map((filter) => (
                  <button
                    key={filter.id}
                    onClick={() => {
                      setTimeRange(filter.id);
                      setIsDropdownOpen(false);
                    }}
                    className={`block w-full text-left px-3 sm:px-4 py-2.5 text-xs sm:text-sm font-bold rounded-xl transition-all ${
                      timeRange === filter.id
                        ? "bg-indigo-50 text-indigo-600"
                        : "text-slate-500 hover:bg-slate-50 hover:text-slate-800"
                    }`}
                  >
                    {filter.label}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Metric Tabs */}
        <div className="flex bg-slate-100/70 p-1 rounded-xl sm:rounded-2xl border border-slate-200/50 overflow-x-auto hide-scrollbar sm:custom-scrollbar w-full lg:w-auto flex-nowrap order-3 lg:order-2">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-3 sm:px-4 py-2 text-[11px] sm:text-sm font-bold rounded-lg sm:rounded-xl whitespace-nowrap transition-all duration-300 flex-1 lg:flex-none text-center ${
                activeTab === tab.id
                  ? "bg-white text-slate-800 shadow-[0_2px_10px_rgba(0,0,0,0.06)] scale-100"
                  : "text-slate-500 hover:text-slate-700 hover:bg-slate-200/50 scale-95 opacity-80"
              }`}
            >
              <div className="flex items-center justify-center gap-1.5 sm:gap-2">
                <span
                  className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full flex-shrink-0 shadow-inner"
                  style={{
                    backgroundColor:
                      activeTab === tab.id ? tab.color : "#cbd5e1",
                  }}
                />
                <span>{tab.label}</span>
              </div>
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 w-full relative mt-4">
        <div className="absolute inset-0">
          {chartReady && (
            <ResponsiveContainer width="99%" height="99%">
              <LineChart
                data={filteredData}
                style={{
                  outline: "none",
                  WebkitTapHighlightColor: "transparent",
                }}
                margin={{
                  top: 5,
                  right: 10,
                  left: -20,
                  bottom: 25,
                }}
              >
                <CartesianGrid
                  strokeDasharray="4 4"
                  vertical={false}
                  stroke="#e2e8f0"
                  opacity={0.6}
                />
                <XAxis
                  dataKey="date"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: "#64748b", fontSize: 13, fontWeight: 600 }}
                  dy={15}
                />
                <YAxis
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: "#64748b", fontSize: 13, fontWeight: 600 }}
                  tickFormatter={(val) =>
                    currentTab.format === "time"
                      ? `${Math.round(val / 60)}m`
                      : val
                  }
                />
                <Tooltip
                  cursor={{
                    stroke: "#94a3b8",
                    strokeWidth: 1.5,
                    strokeDasharray: "4 4",
                  }}
                  contentStyle={{
                    borderRadius: "16px",
                    border: "1px solid #e2e8f0",
                    boxShadow:
                      "0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)",
                    backgroundColor: "rgba(255, 255, 255, 0.95)",
                    backdropFilter: "blur(8px)",
                    padding: "12px 16px",
                  }}
                  formatter={(value) => {
                    if (currentTab.format === "time") {
                      return [formatTimeValue(value), currentTab.label];
                    }
                    return [value, currentTab.label];
                  }}
                  labelStyle={{
                    color: "#0f172a",
                    fontWeight: 800,
                    fontSize: "14px",
                    marginBottom: "6px",
                  }}
                  itemStyle={{
                    fontWeight: 700,
                    fontSize: "13px",
                  }}
                />
                <Line
                  type="monotone"
                  dataKey={currentTab.id}
                  name={currentTab.label}
                  stroke={currentTab.color}
                  strokeWidth={4.5}
                  dot={false}
                  activeDot={{
                    r: 7,
                    stroke: "#fff",
                    strokeWidth: 3,
                    fill: currentTab.color,
                    boxShadow: "0 0 15px rgba(0,0,0,0.2)",
                  }}
                  animationDuration={800}
                  animationEasing="ease-out"
                />
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>
    </div>
  );
};

export default ActivityChart;
