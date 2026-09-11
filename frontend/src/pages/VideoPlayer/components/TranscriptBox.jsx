import React, { useState } from "react";
import { Copy, Check, Eye, EyeOff } from "lucide-react";
// eslint-disable-next-line no-unused-vars
import { motion } from "framer-motion";

const TranscriptBox = ({ transcript, loading }) => {
  const [copied, setCopied] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);

  const handleCopy = () => {
    if (!transcript) return;
    navigator.clipboard.writeText(transcript);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className="p-0 lg:p-3 border-0 lg:border rounded-none lg:rounded-2xl bg-transparent lg:bg-white shadow-none lg:shadow-lg lg:shadow-indigo-50/50 flex flex-col relative group transition-all duration-300 min-h-[80px] lg:min-h-[200px]"
      role="log"
      aria-live="polite"
      tabIndex={0}
    >
      <div className="flex-1">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-6 sm:py-12 text-gray-500">
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
                className="text-3xl mb-3"
              >
                ⏳
              </motion.div>
              <p className="font-medium text-xs sm:text-sm text-gray-600">Fetching transcript...</p>
              <p className="text-[10px] sm:text-xs text-gray-400 mt-1.5 bg-gray-50 px-3 py-0.5 rounded-full">
                Trying multiple sources...
              </p>
            </div>
          ) : transcript ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2 }}
            >
              <pre className="whitespace-pre-wrap text-xs sm:text-sm text-gray-700 font-sans leading-relaxed tracking-wide">
                {transcript}
              </pre>
            </motion.div>
          ) : (
            <div className="flex flex-col items-center justify-center py-6 sm:py-12 text-gray-400">
              <span className="text-3xl mb-2 opacity-50">📝</span>
              <p className="font-medium text-xs sm:text-sm">No transcript available.</p>
              <p className="text-[10px] sm:text-xs mt-0.5 opacity-70">
                Try another video or check back later.
              </p>
            </div>
          )}
        </div>
    </motion.div>
  );
};

export default TranscriptBox;
