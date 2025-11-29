// frontend/src/context/AuthContext.jsx
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

  // Prefer env, fallback to
  const BASE_URL = import.meta.env.VITE_API_URL;

  // 🔹 Fetch user on mount
  useEffect(() => {
    axios
      .get(`${BASE_URL}/auth/login/success`, {
        withCredentials: true,
      })
      .then((res) => {
        setUser(res.data?.user || null);
      })
      .catch((err) => {
        // ⚠️ 401 is normal when not logged in → don't log error, just set user = null
        if (err.response?.status !== 401) {
          console.error("Auth check failed:", err);
        }
        setUser(null);
      })
      .finally(() => setLoading(false));
  }, [BASE_URL]);

  // 🔹 Trigger Google Login
  const startGoogleSignIn = () => {
    try {
      sessionStorage.setItem("afterAuthRedirect", window.location.pathname);
    } catch {
      null;
    }
    window.location.href = "/auth/google"; // ✅ Use relative path to leverage Vite proxy
  };

  // 🔹 Logout
  const signOut = () => {
    window.location.href = "/auth/logout";
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
