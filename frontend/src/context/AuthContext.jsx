// frontend/src/context/AuthContext.jsx
import { createContext, useEffect, useState } from "react";
import React from "react";
import axios from "axios";

// eslint-disable-next-line react-refresh/only-export-components
export const AuthContext = createContext();

const BASE_URL = "";
const AUTH_CACHE_KEY = "ls_auth_user"; // sessionStorage key

// ─── helpers ────────────────────────────────────────────────────────────────
function readCache() {
  try {
    const raw = sessionStorage.getItem(AUTH_CACHE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function writeCache(user) {
  try {
    if (user) sessionStorage.setItem(AUTH_CACHE_KEY, JSON.stringify(user));
    else sessionStorage.removeItem(AUTH_CACHE_KEY);
  } catch {
    /* quota — silent */
  }
}

// ─── Provider ────────────────────────────────────────────────────────────────
export function AuthProvider({ children }) {
  // Start from cache so authenticated users see their avatar immediately
  // (no loading spinner / flash on every page navigation).
  const [user, setUser] = useState(() => readCache());
  const [loading, setLoading] = useState(!readCache()); // skip spinner if cached

  useEffect(() => {
    // Re-validate the session with the server in the background.
    // If the cache had a stale value (cookie expired / logged out elsewhere)
    // this will correct it without blocking the UI.
    axios
      .get(`${BASE_URL}/auth/login/success`, { withCredentials: true })
      .then((res) => {
        const freshUser = res.data?.user || null;
        setUser(freshUser);
        writeCache(freshUser);
      })
      .catch((err) => {
        // 401 means unauthenticated — clear cache so UI reflects reality
        if (err.response?.status === 401) {
          setUser(null);
          writeCache(null);
        } else {
          // Network / server error — keep whatever state we already have
          // (don't log out the user just because the server hiccuped)
          console.error("Auth check failed:", err);
        }
      })
      .finally(() => setLoading(false));
  }, []); // runs once per page load

  // 🔹 Trigger Google Login
  const startGoogleSignIn = () => {
    try {
      sessionStorage.setItem("afterAuthRedirect", window.location.pathname);
    } catch {
      null;
    }
    window.open(`${BASE_URL}/auth/google`, "_self");
  };

  // 🔹 Logout — clear cache so next render doesn't show stale user
  const signOut = () => {
    writeCache(null);
    setUser(null);
    window.open(`${BASE_URL}/auth/logout`, "_self");
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
