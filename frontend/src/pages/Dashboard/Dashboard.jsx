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

  return (
    <div className="min-h-screen bg-gray-50/50 p-6 lg:p-10">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
            <p className="text-gray-500 mt-1">
              Welcome back, {data?.user?.name}! Here's your learning progress.
            </p>
          </div>
          <div className="text-sm text-gray-400">
            Last login: {new Date(data?.user?.lastLogin).toLocaleString()}
          </div>
        </div>

        {/* Stats Cards */}
        <StatsCards stats={{ ...data?.stats, streak: data?.streak || 0 }} />

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column: Chart */}
          <div className="lg:col-span-2">
            <ActivityChart data={data?.dailyActivity || []} />
          </div>

          {/* Right Column: Quiz History (or maybe something else later) */}
          <div className="lg:col-span-1">
            {/* Placeholder for future widgets like "Recommended for you" */}
            <div className="bg-gradient-to-br from-indigo-600 to-violet-600 rounded-2xl p-6 text-white h-full flex flex-col justify-center items-center text-center shadow-lg shadow-indigo-200">
              <h3 className="text-2xl font-bold mb-2">Keep Learning!</h3>
              <p className="opacity-90 mb-6">
                You're on a {data?.streak || 0}-day streak. Watch one more video
                to keep it going.
              </p>
              <button
                onClick={() => (window.location.href = "/feed")}
                className="bg-white text-indigo-600 px-6 py-2 rounded-full font-bold hover:bg-indigo-50 transition-colors"
              >
                Browse Feed
              </button>
            </div>
          </div>
        </div>

        {/* Quiz History Section */}
        <QuizHistory history={data?.quizHistory || []} />
      </div>
    </div>
  );
};

export default Dashboard;
