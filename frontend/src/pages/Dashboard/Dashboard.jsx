import React, { useEffect, useState } from "react";
import ActivityChart from "./components/ActivityChart";
import StatsCards from "./components/StatsCards";
import QuizHistory from "./components/QuizHistory";
import SkeletonLoader from "../../components/SkeletonLoader";
import { useAuth } from "../../hooks/useAuth";

const BASE_URL = "";

const Dashboard = () => {
  const {
    isAuthenticated,
    loading: authLoading,
    startGoogleSignIn,
  } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (authLoading) return;

    if (!isAuthenticated) {
      startGoogleSignIn();
      return;
    }

    const fetchDashboardData = async () => {
      try {
        const res = await fetch(`${BASE_URL}/api/user/dashboard`, {
          credentials: "include",
        });
        if (!res.ok) throw new Error("Failed to load dashboard data");
        const jsonData = await res.json();
        setData(jsonData);
      } catch (err) {
        console.error(err);
        setError("Failed to load dashboard. Please try again.");
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, [authLoading, isAuthenticated, startGoogleSignIn]);

  if (loading) {
    return (
      <div className="p-6 lg:p-10 max-w-7xl mx-auto space-y-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => (
            <SkeletonLoader key={i} className="h-32 rounded-2xl" />
          ))}
        </div>
        <SkeletonLoader className="h-96 rounded-2xl" />
        <SkeletonLoader className="h-64 rounded-2xl" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-[50vh] text-red-500">
        {error}
      </div>
    );
  }

  const getAggregatedChartData = () => {
    if (!data) return [];

    const chartMap = {};

    // Process Daily Activity
    (data.dailyActivity || []).forEach((activity) => {
      chartMap[activity.date] = {
        date: activity.date,
        watchTime: activity.watchTime || 0,
        appOpenTime: activity.appOpenTime || 0,
        videosWatched: Array.isArray(activity.videosWatched)
          ? activity.videosWatched.length
          : 0,
        quizzesSolved: 0,
      };
    });

    // Process Quiz History
    (data.quizHistory || []).forEach((quiz) => {
      const dateStr = new Date(quiz.date).toISOString().split("T")[0];
      if (!chartMap[dateStr]) {
        chartMap[dateStr] = {
          date: dateStr,
          watchTime: 0,
          appOpenTime: 0,
          videosWatched: 0,
          quizzesSolved: 0,
        };
      }
      chartMap[dateStr].quizzesSolved += 1;
    });

    let aggregatedData = Object.values(chartMap).sort(
      (a, b) => new Date(a.date) - new Date(b.date),
    );

    return aggregatedData;
  };

  const getInsights = () => {
    if (!data) return { avgScore: 0, activeDays: 0, avgWatchMins: 0 };

    // Average Quiz Score
    let avgScore = 0;
    if (data.quizHistory && data.quizHistory.length > 0) {
      const totalPercentage = data.quizHistory.reduce((acc, q) => {
        return (
          acc + (q.totalQuestions > 0 ? (q.score / q.totalQuestions) * 100 : 0)
        );
      }, 0);
      avgScore = Math.round(totalPercentage / data.quizHistory.length);
    }

    // Active Days
    const activeDays = data.dailyActivity?.length || 0;

    // Average Watch Time per active day
    const avgWatchTimeUser =
      (data.stats?.totalWatchTime || 0) / (activeDays || 1);
    const avgWatchMins = Math.round(avgWatchTimeUser / 60);

    return {
      avgScore,
      activeDays,
      avgWatchMins,
    };
  };

  const insights = getInsights();

  return (
    <div className="min-h-screen bg-[#F8FAFC] p-4 sm:p-6 lg:p-10 relative overflow-hidden font-sans">
      {/* Decorative ambient background */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden z-0 pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] bg-indigo-500/10 rounded-full blur-[100px]" />
        <div className="absolute bottom-[-10%] right-[-5%] w-[500px] h-[500px] bg-violet-500/10 rounded-full blur-[100px]" />
      </div>

      <div className="max-w-7xl mx-auto space-y-8 md:space-y-10 relative z-10">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <p className="text-sm sm:text-base font-bold text-slate-500 tracking-wider uppercase mb-1">
              Overview
            </p>
            <h2 className="text-3xl sm:text-5xl font-extrabold text-slate-900 tracking-tight">
              Welcome back,{" "}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-800 via-blue-500 to-blue-400">
                {data?.user?.name}
              </span>
            </h2>
          </div>
          <div className="text-xs sm:text-sm font-medium text-slate-500 bg-white/60 backdrop-blur-md px-4 py-2 rounded-full border border-slate-200 shadow-sm">
            Last seen {new Date(data?.user?.lastLogin).toLocaleDateString()}
          </div>
        </div>

        {/* Stats Cards */}
        <StatsCards
          stats={{
            ...data?.stats,
            streak: data?.streak || 0,
            totalVideosWatched: (data?.dailyActivity || []).reduce(
              (acc, act) =>
                acc +
                (Array.isArray(act.videosWatched)
                  ? act.videosWatched.length
                  : 0),
              0,
            ),
          }}
        />

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">
          {/* Left Column: Chart */}
          <div className="lg:col-span-2">
            <ActivityChart data={getAggregatedChartData()} />
          </div>

          {/* Right Column: Insights Panel */}
          <div className="lg:col-span-1 h-auto lg:h-[450px]">
            <div className="bg-white/80 backdrop-blur-xl rounded-[2rem] p-6 lg:p-8 h-full flex flex-col shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100 relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-48 h-48 bg-indigo-500/5 rounded-full blur-3xl -mr-10 -mt-10 pointer-events-none transition-transform duration-700 group-hover:scale-150" />

              <h3 className="text-xl sm:text-2xl font-extrabold text-slate-800 tracking-tight mb-6 flex items-center gap-3 relative z-10">
                <span className="p-2.5 bg-indigo-50 text-indigo-600 rounded-2xl shadow-sm border border-indigo-100/50">
                  <svg
                    className="w-5 h-5"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2.5}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M13 10V3L4 14h7v7l9-11h-7z"
                    />
                  </svg>
                </span>
                Quick Insights
              </h3>

              <div className="flex-1 flex flex-col justify-center gap-4 sm:gap-5 relative z-10">
                {/* Insight 1: Avg Score */}
                <div className="bg-slate-50/80 rounded-2xl p-4 sm:p-5 border border-slate-100/80 flex items-center justify-between group/card hover:bg-white hover:border-slate-200 transition-all hover:shadow-sm">
                  <div>
                    <p className="text-[10px] sm:text-xs font-bold text-slate-500 uppercase tracking-wider mb-0.5 sm:mb-1">
                      Avg Score
                    </p>
                    <p className="text-xl sm:text-2xl font-extrabold text-slate-800">
                      {insights.avgScore}%
                    </p>
                  </div>
                  <div className="w-12 h-12 rounded-full flex items-center justify-center relative bg-indigo-50 text-indigo-600">
                    <svg
                      className="absolute inset-0 w-full h-full -rotate-90"
                      viewBox="0 0 36 36"
                    >
                      <circle
                        cx="18"
                        cy="18"
                        r="16"
                        fill="none"
                        className="stroke-indigo-100"
                        strokeWidth="3"
                      ></circle>
                      <path
                        className="stroke-indigo-500 transition-all duration-1000 ease-out"
                        strokeDasharray={`${insights.avgScore}, 100`}
                        d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                        fill="none"
                        strokeLinecap="round"
                        strokeWidth="3"
                      />
                    </svg>
                    <span className="text-[10px] font-bold text-indigo-600">
                      {insights.avgScore}%
                    </span>
                  </div>
                </div>

                {/* Insight 2: Daily Focus */}
                <div className="bg-slate-50/80 rounded-2xl p-4 sm:p-5 border border-slate-100/80 flex items-center justify-between group/card hover:bg-white hover:border-slate-200 transition-all hover:shadow-sm">
                  <div>
                    <p className="text-[10px] sm:text-xs font-bold text-slate-500 uppercase tracking-wider mb-0.5 sm:mb-1">
                      Daily Focus
                    </p>
                    <p className="text-xl sm:text-2xl font-extrabold text-slate-800 flex items-baseline gap-1">
                      {insights.avgWatchMins}
                      <span className="text-xs sm:text-sm text-slate-500 font-bold uppercase tracking-wider">
                        min
                      </span>
                    </p>
                  </div>
                  <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl border border-emerald-100/50 group-hover/card:scale-105 transition-transform duration-300">
                    <svg
                      className="w-6 h-6"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={2.5}
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                  </div>
                </div>

                {/* Insight 3: Completion Rate */}
                <div className="bg-slate-50/80 rounded-2xl p-4 sm:p-5 border border-slate-100/80 flex items-center justify-between group/card hover:bg-white hover:border-slate-200 transition-all hover:shadow-sm">
                  <div>
                    <p className="text-[10px] sm:text-xs font-bold text-slate-500 uppercase tracking-wider mb-0.5 sm:mb-1">
                      Active Days
                    </p>
                    <p className="text-xl sm:text-2xl font-extrabold text-slate-800 flex items-baseline gap-1">
                      {insights.activeDays}
                      <span className="text-xs sm:text-sm text-slate-500 font-bold uppercase tracking-wider">
                        sessions
                      </span>
                    </p>
                  </div>
                  <div className="p-3 bg-orange-50 text-orange-600 rounded-xl border border-orange-100/50 group-hover/card:scale-105 transition-transform duration-300">
                    <svg
                      className="w-6 h-6"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={2.5}
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                      />
                    </svg>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Quiz History Section */}
        <div className="mt-8">
          <QuizHistory history={data?.quizHistory || []} />
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
