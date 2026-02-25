import React from "react";
import { Clock, CheckCircle, BookOpen, Flame, PlayCircle } from "lucide-react";

const colorStyles = {
  indigo: { wrapper: "bg-indigo-50 text-indigo-600", dot: "#6366f1" },
  emerald: { wrapper: "bg-emerald-50 text-emerald-600", dot: "#10b981" },
  blue: { wrapper: "bg-blue-50 text-blue-600", dot: "#3b82f6" },
  orange: { wrapper: "bg-orange-50 text-orange-600", dot: "#f97316" },
};

// eslint-disable-next-line no-unused-vars
const StatCard = ({ title, value, icon: IconComponent, colorName }) => (
  <div className="relative overflow-hidden bg-white/80 backdrop-blur-xl p-5 sm:p-7 rounded-[2rem] shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100 flex flex-col justify-between transition-all duration-300 hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)] hover:-translate-y-1 group">
    <div
      className="absolute top-0 right-0 -mr-8 -mt-8 w-32 h-32 rounded-full opacity-20 blur-2xl transition-all duration-500 group-hover:scale-150 group-hover:opacity-30"
      style={{ backgroundColor: colorStyles[colorName].dot }}
    />

    <div className="relative z-10 flex items-center justify-between w-full mb-6 mt-1">
      <div
        className={`p-3.5 rounded-2xl ${colorStyles[colorName].wrapper} flex items-center justify-center`}
      >
        <IconComponent className="w-6 h-6 sm:w-7 sm:h-7" strokeWidth={2.5} />
      </div>
    </div>

    <div className="relative z-10">
      <h3 className="text-3xl sm:text-4xl font-extrabold text-slate-800 tracking-tight leading-none mb-2">
        {value}
      </h3>
      <p className="text-[11px] sm:text-xs font-bold text-slate-500 tracking-wider uppercase">
        {title}
      </p>
    </div>
  </div>
);

const StatsCards = ({ stats }) => {
  const formatTotalTime = (seconds) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    return `${hours}h ${minutes}m`;
  };

  const calculateStreak = () => {
    return stats.streak || 0;
  };

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5 lg:gap-8 mb-8">
      <StatCard
        title="Watch Time"
        value={formatTotalTime(stats.totalWatchTime)}
        icon={Clock}
        colorName="indigo"
      />
      <StatCard
        title="Quizzes"
        value={stats.totalQuizzesSolved}
        icon={CheckCircle}
        colorName="emerald"
      />
      <StatCard
        title="Videos"
        value={stats.totalVideosWatched || 0}
        icon={PlayCircle}
        colorName="blue"
      />
      <StatCard
        title="Streak"
        value={`${calculateStreak()} Days`}
        icon={Flame}
        colorName="orange"
      />
    </div>
  );
};

export default StatsCards;
