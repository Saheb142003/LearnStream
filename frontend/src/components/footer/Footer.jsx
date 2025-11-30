import React from "react";
import { Sparkles } from "lucide-react";
import { Link } from "react-router-dom";

const Footer = () => {
  return (
    <footer className="border-t border-gray-100 bg-white py-12 px-6">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center">
            <Sparkles className="w-4 h-4 text-white" />
          </div>
          <span className="font-bold text-lg text-gray-900">LearnStream</span>
        </div>
        <div className="text-gray-500 text-sm">
          &copy; {new Date().getFullYear()} LearnStream. All rights reserved.
        </div>
        <div className="flex gap-6">
          <Link
            to="/privacy"
            className="text-gray-500 hover:text-indigo-600 transition-colors"
          >
            Privacy
          </Link>
          <Link
            to="/terms"
            className="text-gray-500 hover:text-indigo-600 transition-colors"
          >
            Terms
          </Link>
          <Link
            to="/contact"
            className="text-gray-500 hover:text-indigo-600 transition-colors"
          >
            Contact
          </Link>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
