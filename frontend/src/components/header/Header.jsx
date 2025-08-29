// frontend/src/components/header/Header.jsx
import React from "react";
import { PlaySquare } from "lucide-react";
import { useAuth } from "../../hooks/useAuth";
import UserDropdown from "./UserDropdown.jsx";

export default function Header() {
  const { isAuthenticated, user, startGoogleSignIn, signOut } = useAuth();

  return (
    <header className="sticky top-0 z-40  bg-gradient-to-br from-blue-200/30 via-indigo-200/30 to-purple-200/30 backdrop-blur">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          {/* Logo */}
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-tr from-blue-600 to-violet-600 text-white grid place-items-center shadow-sm">
              <PlaySquare className="w-5 h-5" />
            </div>
            <span className="sr-only">LearnStream Logo</span>
          </div>

          {/* App Name */}
          <h1 className="text-lg sm:text-xl md:text-2xl font-semibold tracking-tight text-gray-900">
            LearnStream
          </h1>

          {/* User Controls */}
          <div className="flex items-center gap-3">
            <UserDropdown
              isAuthenticated={isAuthenticated}
              onSignIn={startGoogleSignIn}
              onSignOut={signOut}
              user={user}
            />
          </div>
        </div>
      </div>
    </header>
  );
}
