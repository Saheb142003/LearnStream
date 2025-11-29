import React from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";

const ActivityChart = ({ data }) => {
  // Transform data for chart if needed, or assume data is passed in correct format
  // Expected data: [{ date: '2023-10-27', watchTime: 120, appOpenTime: 300 }]

  return (
    <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 h-[400px] flex flex-col">
      <h3 className="text-lg font-bold text-gray-800 mb-6">Daily Activity</h3>
      <div className="flex-1 min-h-0">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={data}
            margin={{
              top: 5,
              right: 30,
              left: 20,
              bottom: 5,
            }}
          >
            <CartesianGrid
              strokeDasharray="3 3"
              vertical={false}
              stroke="#f0f0f0"
            />
            <XAxis
              dataKey="date"
              axisLine={false}
              tickLine={false}
              tick={{ fill: "#9ca3af", fontSize: 12 }}
              dy={10}
            />
            <YAxis
              axisLine={false}
              tickLine={false}
              tick={{ fill: "#9ca3af", fontSize: 12 }}
              tickFormatter={(val) => `${Math.round(val / 60)}m`}
            />
            <Tooltip
              cursor={{ fill: "#f9fafb" }}
              contentStyle={{
                borderRadius: "12px",
                border: "none",
                boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)",
              }}
              formatter={(value, name) => [
                `${Math.floor(value / 60)}m ${value % 60}s`,
                name,
              ]}
            />
            <Legend wrapperStyle={{ paddingTop: "20px" }} />
            <Bar
              dataKey="watchTime"
              name="Watch Time (sec)"
              fill="#6366f1"
              radius={[4, 4, 0, 0]}
              barSize={30}
            />
            <Bar
              dataKey="appOpenTime"
              name="App Open Time (sec)"
              fill="#e0e7ff"
              radius={[4, 4, 0, 0]}
              barSize={30}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default ActivityChart;
