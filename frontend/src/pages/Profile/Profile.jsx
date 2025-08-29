import { useAuth } from "../../hooks/useAuth";
import { useLocation, useNavigate } from "react-router-dom";
import { useEffect } from "react";

export default function Profile() {
  const { user, isAuthenticated, startGoogleSignIn, loading } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const redirectTo = location.state?.redirectTo || "/";

  // If logged in, optionally auto-redirect back
  useEffect(() => {
    if (!loading && isAuthenticated && redirectTo) {
      // navigate(redirectTo, { replace: true });
    }
  }, [loading, isAuthenticated, redirectTo, navigate]);

  if (loading) {
    return <div className="p-8 text-center">Checking session…</div>;
  }

  if (!isAuthenticated) {
    return (
      <div className="flex flex-col items-center justify-center p-8">
        <h2 className="text-3xl font-bold mb-4">Sign in to continue</h2>
        <button
          onClick={startGoogleSignIn}
          className="px-6 py-3 rounded-lg bg-indigo-600 text-white font-semibold shadow hover:opacity-90"
        >
          Continue with Google
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center p-8">
      <h2 className="text-3xl font-bold mb-6">👤 Profile</h2>
      <img
        src={user.picture}
        alt="profile"
        className="w-28 h-28 rounded-full shadow-md mb-4"
      />
      <p className="text-lg">
        <b>Name:</b> {user.name}
      </p>
      <p className="text-lg">
        <b>Email:</b> {user.email}
      </p>
    </div>
  );
}
