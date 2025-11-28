import React, { useState } from "react";
import { Copy, Check } from "lucide-react";

const TranscriptBox = ({ transcript, loading }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    if (!transcript) return;
    navigator.clipboard.writeText(transcript);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div
      className="p-4 border rounded-xl bg-white shadow-sm h-[24rem] flex flex-col relative group"
      role="log"
      aria-live="polite"
      tabIndex={0}
    >
      <div className="flex justify-between items-center mb-2">
        <h3 className="text-lg font-semibold text-gray-800">Transcript</h3>
        {transcript && !loading && (
          <button
            onClick={handleCopy}
            className="p-1.5 rounded-md hover:bg-gray-100 text-gray-500 transition-colors"
            title="Copy to clipboard"
          >
            {copied ? <Check size={18} className="text-green-600" /> : <Copy size={18} />}
          </button>
        )}
      </div>
      
      <div className="flex-1 overflow-y-auto custom-scrollbar pr-2">
        {loading ? (
          <div className="flex flex-col items-center justify-center h-full text-gray-500 animate-pulse">
            <span className="text-3xl mb-2">⏳</span> 
            <p>Fetching transcript...</p>
            <p className="text-xs text-gray-400 mt-2">Trying multiple sources...</p>
          </div>
        ) : transcript ? (
          <pre className="whitespace-pre-wrap text-sm text-gray-700 font-sans leading-relaxed">
            {transcript}
          </pre>
        ) : (
          <div className="flex flex-col items-center justify-center h-full text-gray-400">
            <span className="text-3xl mb-2">📝</span>
            <p>No transcript available.</p>
            <p className="text-xs mt-1">Try another video or check back later.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default TranscriptBox;
