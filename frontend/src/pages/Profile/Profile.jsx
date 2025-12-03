import { useAuth } from "../../hooks/useAuth";
import { useLocation, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { Edit2, Save, X, User, Mail, Camera } from "lucide-react";

export default function Profile() {
  const {
    user,
    isAuthenticated,
    startGoogleSignIn,
    loading: authLoading,
  } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const redirectTo = location.state?.redirectTo || "/";

  const [isEditing, setIsEditing] = useState(false);
  const [name, setName] = useState("");
  const [accountType, setAccountType] = useState("Learner");
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState(null);

  useEffect(() => {
    if (user) {
      setName(user.name || "");
      setAccountType(user.accountType || "Learner");
    }
  }, [user]);

  // If logged in, optionally auto-redirect back
  useEffect(() => {
    if (
      !authLoading &&
      isAuthenticated &&
      redirectTo &&
      redirectTo !== "/profile" &&
      redirectTo !== "/"
    ) {
      // navigate(redirectTo, { replace: true });
    }
  }, [authLoading, isAuthenticated, redirectTo, navigate]);

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    setMessage(null);

    try {
      const BASE_URL = "";
      const res = await fetch(`${BASE_URL}/api/user/profile`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ name, accountType }),
        credentials: "include", // Important for cookies
      });

      const data = await res.json();

      if (res.ok) {
        setMessage({ type: "success", text: "Profile updated successfully!" });
        setIsEditing(false);
        // Ideally, update the global user context here, but a refresh works for now
        window.location.reload();
      } else {
        setMessage({
          type: "error",
          text: data.error || "Failed to update profile",
        });
      }
    } catch (error) {
      setMessage({
        type: "error",
        text: "An error occurred. Please try again.",
      });
    } finally {
      setIsSaving(false);
    }
  };

  if (authLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] p-8">
        <div className="bg-white p-8 rounded-2xl shadow-xl text-center max-w-md w-full border border-gray-100">
          <div className="w-16 h-16 bg-indigo-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <User className="w-8 h-8 text-indigo-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Sign in to view profile
          </h2>
          <p className="text-gray-500 mb-8">
            Access your learning progress, stats, and settings.
          </p>
          <button
            onClick={startGoogleSignIn}
            className="w-full py-3 px-4 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-xl transition-all shadow-lg shadow-indigo-200 flex items-center justify-center gap-2"
          >
            <img
              src="https://www.google.com/favicon.ico"
              alt="G"
              className="w-5 h-5 bg-white rounded-full p-0.5"
            />
            Continue with Google
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl mx-auto">
        <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
          {/* Header Background */}
          <div className="h-32 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 relative">
            <div className="absolute -bottom-12 left-8">
              <div className="relative group">
                <img
                  src={user.picture}
                  alt="profile"
                  className="w-24 h-24 rounded-full border-4 border-white shadow-md object-cover bg-white"
                />
                {/* Placeholder for future avatar upload feature */}
                <div className="absolute inset-0 bg-black/30 rounded-full opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center cursor-not-allowed">
                  <Camera className="text-white w-6 h-6" />
                </div>
              </div>
            </div>
          </div>

          <div className="pt-16 pb-8 px-8">
            <div className="flex justify-between items-start mb-6">
              <div>
                <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                  {user.name}
                  {!isEditing && (
                    <button
                      onClick={() => setIsEditing(true)}
                      className="text-gray-400 hover:text-indigo-600 transition-colors p-1"
                      title="Edit Profile"
                    >
                      <Edit2 size={16} />
                    </button>
                  )}
                </h1>
                <p className="text-gray-500 flex items-center gap-1.5 mt-1">
                  <Mail size={14} />
                  {user.email}
                </p>
              </div>
              {/* Stats or Badges could go here */}
            </div>

            {message && (
              <div
                className={`p-4 rounded-lg mb-6 text-sm ${
                  message.type === "success"
                    ? "bg-green-50 text-green-700"
                    : "bg-red-50 text-red-700"
                }`}
              >
                {message.text}
              </div>
            )}

            {isEditing ? (
              <form
                onSubmit={handleUpdateProfile}
                className="bg-gray-50 p-6 rounded-xl border border-gray-200 animate-in fade-in slide-in-from-top-4 duration-300"
              >
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  Edit Profile
                </h3>

                <div className="mb-4">
                  <label
                    htmlFor="name"
                    className="block text-sm font-medium text-gray-700 mb-1"
                  >
                    Display Name
                  </label>
                  <input
                    type="text"
                    id="name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
                    placeholder="Enter your name"
                    required
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    This is how you'll appear to other users.
                  </p>
                </div>

                <div className="mb-4">
                  <label
                    htmlFor="accountType"
                    className="block text-sm font-medium text-gray-700 mb-1"
                  >
                    Account Type
                  </label>
                  <select
                    id="accountType"
                    value={accountType}
                    onChange={(e) => setAccountType(e.target.value)}
                    className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all bg-white"
                  >
                    <option value="Learner">Learner</option>
                    <option value="Student">Student</option>
                    <option value="Teacher">Teacher</option>
                    <option value="Developer">Developer</option>
                    <option value="Other">Other</option>
                  </select>
                </div>

                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Email Address
                  </label>
                  <input
                    type="email"
                    value={user.email}
                    disabled
                    className="w-full px-4 py-2 rounded-lg border border-gray-200 bg-gray-100 text-gray-500 cursor-not-allowed"
                  />
                  <p className="text-xs text-gray-400 mt-1">
                    Email cannot be changed.
                  </p>
                </div>

                <div className="flex items-center gap-3 justify-end mt-6">
                  <button
                    type="button"
                    onClick={() => {
                      setIsEditing(false);
                      setName(user.name || "");
                      setAccountType(user.accountType || "Learner");
                      setMessage(null);
                    }}
                    className="px-4 py-2 text-gray-600 hover:bg-gray-200 rounded-lg font-medium transition-colors flex items-center gap-2"
                  >
                    <X size={18} />
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSaving}
                    className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-medium transition-colors flex items-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
                  >
                    {isSaving ? (
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    ) : (
                      <Save size={18} />
                    )}
                    Save Changes
                  </button>
                </div>
              </form>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8">
                <div className="p-4 bg-indigo-50 rounded-xl border border-indigo-100">
                  <h3 className="font-semibold text-indigo-900 mb-1">
                    Account Type
                  </h3>
                  <p className="text-indigo-700 text-sm">
                    {user.accountType || "Learner"}
                  </p>
                </div>
                <div className="p-4 bg-purple-50 rounded-xl border border-purple-100">
                  <h3 className="font-semibold text-purple-900 mb-1">
                    Member Since
                  </h3>
                  <p className="text-purple-700 text-sm">
                    {new Date(
                      user.createdAt || user.lastLogin
                    ).toLocaleDateString(undefined, {
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    })}
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
