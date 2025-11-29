import React, { useState } from "react";
import { Copy, Check } from "lucide-react";
// eslint-disable-next-line no-unused-vars
import { motion } from "framer-motion";

const TranscriptBox = ({ transcript, loading }) => {
  const [copied, setCopied] = useState(false);

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
      className="p-5 border rounded-2xl bg-white shadow-lg shadow-indigo-50/50 flex flex-col relative group min-h-[200px]"
      role="log"
      aria-live="polite"
      tabIndex={0}
    >
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-xl font-bold text-gray-800 flex items-center gap-2">
          <span className="text-indigo-500">📖</span> Transcript
        </h3>
        {transcript && !loading && (
          <button
            onClick={handleCopy}
            className="p-2 rounded-lg hover:bg-indigo-50 text-gray-500 hover:text-indigo-600 transition-all active:scale-95"
            title="Copy to clipboard"
          >
            {copied ? (
              <Check size={20} className="text-green-600" />
            ) : (
              <Copy size={20} />
            )}
          </button>
        )}
      </div>

      <div className="flex-1">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-12 text-gray-500">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
              className="text-4xl mb-4"
            >
              ⏳
            </motion.div>
            <p className="font-medium text-gray-600">Fetching transcript...</p>
            <p className="text-xs text-gray-400 mt-2 bg-gray-50 px-3 py-1 rounded-full">
              Trying multiple sources...
            </p>
          </div>
        ) : transcript ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
          >
            <pre className="whitespace-pre-wrap text-sm text-gray-700 font-sans leading-relaxed tracking-wide">
              {transcript}
            </pre>
          </motion.div>
        ) : (
          <div className="flex flex-col items-center justify-center py-12 text-gray-400">
            <span className="text-4xl mb-3 opacity-50">📝</span>
            <p className="font-medium">No transcript available.</p>
            <p className="text-xs mt-1 opacity-70">
              Try another video or check back later.
            </p>
          </div>
        )}
      </div>
    </motion.div>
  );
};

export default TranscriptBox;
