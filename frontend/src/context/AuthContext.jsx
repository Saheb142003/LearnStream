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

  // Fetch user on mount
  useEffect(() => {
    axios
      .get("http://localhost:5000/auth/login/success", {
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
  }, []);

  // ✅ Trigger Google Login
  const startGoogleSignIn = () => {
    window.open("http://localhost:5000/auth/google", "_self");
  };

  // ✅ Logout
  const signOut = () => {
    window.open("http://localhost:5000/auth/logout", "_self");
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
