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
  const nameRef = useRef(null);
  const centerWrapperRef = useRef(null);
  const [taglinePos, setTaglinePos] = useState({ left: "50%", gap: 12 });
  const xOffset = 150;

  // Desktop positioning logic only runs above md screen
  useEffect(() => {
    function measure() {
      if (window.innerWidth < 768) return; // skip on mobile
      const nameEl = nameRef.current;
      const wrapper = centerWrapperRef.current;
      if (!nameEl || !wrapper) return;
      const nameRect = nameEl.getBoundingClientRect();
      const wrapRect = wrapper.getBoundingClientRect();
      const gap = 12;
      const leftPx = Math.round(
        wrapRect.width / 2 + nameRect.width / 2 + gap - xOffset
      );
      setTaglinePos({ left: `${leftPx}px`, gap });
    }
    measure();
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
  }, [xOffset]);

  return (
    <header className="sticky top-0 z-40 bg-gradient-to-br from-blue-200/30 via-indigo-200/30 to-purple-200/30 backdrop-blur">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          {/* LEFT */}
          <div className="flex items-center gap-2">
            <a
              href="https://learnstream.netlify.app"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center"
            >
              <img
                src={Logo}
                alt="LearnStream"
                className="w-10 h-10 rounded-lg shadow-sm object-cover bg-white"
              />
            </a>
          </div>

          {/* CENTER */}
          {/* Desktop (md+): name + tagline inline */}
          <div
            ref={centerWrapperRef}
            className="relative hidden md:block flex-1"
          >
            <div
              ref={nameRef}
              style={{
                position: "absolute",
                left: "50%",
                top: "50%",
                transform: `translate(calc(-50% - ${xOffset}px), -50%)`,
                whiteSpace: "nowrap",
              }}
            >
              <h1 className="text-xl md:text-2xl font-semibold tracking-tight text-gray-900 flex items-center gap-2">
                <span className="leading-none">LearnStream</span>
                <span className="hidden md:inline text-gray-500">-</span>
              </h1>
            </div>

            <div
              style={{
                position: "absolute",
                left: taglinePos.left,
                top: "50%",
                transform: "translateY(-50%)",
                whiteSpace: "nowrap",
              }}
            >
              <AnimatedTaglineInline />
            </div>
          </div>

          {/* Mobile (below md): stacked name + tagline */}
          <div className="block md:hidden text-center flex-1">
            <h1 className="text-lg font-semibold text-gray-900 leading-tight">
              LearnStream
            </h1>
            <AnimatedTaglineInline />
          </div>

          {/* RIGHT */}
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
