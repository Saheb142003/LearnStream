import { createContext, useEffect, useState } from "react";
import React from "react";
import axios from "axios";

// 1️⃣ Create & Export Context
// eslint-disable-next-line react-refresh/only-export-components
export const AuthContext = createContext();

// 2️⃣ Provider Component
export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Prefer env, fallback to local
  const BASE_URL =
    import.meta.env.VITE_API_URL || "http://localhost:5000";

  // 🔹 Fetch user on mount
  useEffect(() => {
    axios
      .get(`${BASE_URL}/auth/login/success`, {
        withCredentials: true,
      })
      .then((res) => {
        if (res.data.user) {
          setUser(res.data.user);
        } else {
          setUser(null);
        }
      })
      .catch(() => setUser(null))
      .finally(() => setLoading(false));
  }, [BASE_URL]);

  // 🔹 Trigger Google Login
  const startGoogleSignIn = () => {
    window.open(`${BASE_URL}/auth/google`, "_self"); // ✅ fixed (removed extra /auth)
  };

  // 🔹 Logout
  const signOut = () => {
    window.open(`${BASE_URL}/auth/logout`, "_self");
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        loading,
        startGoogleSignIn,
        signOut,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}
