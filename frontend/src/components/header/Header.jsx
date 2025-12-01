// frontend/src/components/header/Header.jsx
import React, { useEffect, useRef, useState } from "react";
import { useAuth } from "../../hooks/useAuth";
import UserDropdown from "./UserDropdown.jsx";

import Logo from "../../../assets/LS_logo.png";

const TAGLINES = [
  "Your AI Companion for Smarter Learning",
  "From Watching to Understanding",
  "Learn, Summarize, Master",
  "Where Curiosity Meets Intelligence",
  "AI That Learns How You Learn",
  "AI Powered Ed-Tech Platform",
];

function randAnim() {
  const a = ["typing", "slide", "flip"];
  return a[Math.floor(Math.random() * a.length)];
}

function AnimatedTaglineInline({ taglines = TAGLINES, style }) {
  const [index, setIndex] = useState(0);
  const [anim, setAnim] = useState(randAnim());
  const [display, setDisplay] = useState("");
  const [phase, setPhase] = useState("enter");
  const timer = useRef(null);

  const reduced =
    typeof window !== "undefined" &&
    window.matchMedia &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  const typingCharMs = 34;
  const holdFull = 1600;
  const slideHold = 2400;

  useEffect(() => {
    return () => timer.current && clearTimeout(timer.current);
  }, []);

  useEffect(() => {
    if (reduced) {
      setDisplay(taglines[index]);
      timer.current = setTimeout(
        () => setIndex((s) => (s + 1) % taglines.length),
        3000
      );
      return;
    }

    const full = taglines[index];
    if (anim === "typing") {
      let i = 0;
      setDisplay("");
      setPhase("enter");
      function tick() {
        i++;
        setDisplay(full.slice(0, i));
        if (i >= full.length) {
          timer.current = setTimeout(() => {
            setPhase("exit");
            timer.current = setTimeout(() => {
              setIndex((s) => (s + 1) % taglines.length);
              setAnim(randAnim());
              setDisplay("");
              setPhase("enter");
            }, 420);
          }, holdFull);
          return;
        }
        timer.current = setTimeout(tick, typingCharMs);
      }
      timer.current = setTimeout(tick, 120);
      return;
    }

    setDisplay(full);
    setPhase("enter");
    timer.current = setTimeout(() => {
      setPhase("exit");
      timer.current = setTimeout(() => {
        setIndex((s) => (s + 1) % taglines.length);
        setAnim(randAnim());
        setPhase("enter");
      }, 420);
    }, slideHold);
  }, [index, anim, taglines, reduced]);

  const typingStyle = {
    transition: "opacity 550ms ease, transform 550ms ease",
    opacity: phase === "enter" ? 1 : 0,
    transform: phase === "enter" ? "translateY(0)" : "translateY(-6px)",
  };
  const slideStyle = {
    transition: "transform 550ms cubic-bezier(.2,.9,.2,1), opacity 550ms ease",
    transform: phase === "enter" ? "translateY(0)" : "translateY(-8px)",
    opacity: phase === "enter" ? 1 : 0,
  };
  const flipStyle = {
    transition: "transform 550ms cubic-bezier(.2,.9,.2,1), opacity 550ms ease",
    transformOrigin: "top",
    transform: phase === "enter" ? "rotateX(0deg)" : "rotateX(72deg)",
    opacity: phase === "enter" ? 1 : 0,
  };

  const combinedStyle =
    anim === "typing"
      ? { ...typingStyle, ...style }
      : anim === "slide"
      ? { ...slideStyle, ...style }
      : { ...flipStyle, ...style };

  return (
    <span
      aria-live="polite"
      className="text-slate-700 font-medium text-[14px] sm:text-[16px] md:text-[20px] leading-tight"
      style={combinedStyle}
    >
      {display}
    </span>
  );
}

export default function Header() {
  const { isAuthenticated, user, startGoogleSignIn, signOut } = useAuth();

  return (
    <header className="sticky top-0 z-40 bg-gradient-to-br from-blue-200/30 via-indigo-200/30 to-purple-200/30 backdrop-blur border-b border-white/20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="relative flex h-14 items-center justify-between">
          {/* LEFT: Logo Icon Only */}
          <div className="flex items-center shrink-0 z-10">
            <a href="/" className="flex items-center">
              <img
                src={Logo}
                alt="LearnStream"
                className="w-8 h-8 rounded-lg shadow-sm object-cover bg-white"
              />
            </a>
          </div>

          {/* CENTER: Title (+ Tagline on Desktop) */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="flex items-center gap-2 pointer-events-auto">
              <span className="font-bold text-lg text-gray-900 tracking-tight">
                LearnStream
              </span>
              <div className="hidden md:block">
                <span className="text-gray-400 mr-2">-</span>
                <AnimatedTaglineInline />
              </div>
            </div>
          </div>

          {/* RIGHT: User Menu */}
          <div className="flex items-center gap-3 shrink-0 z-10">
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
