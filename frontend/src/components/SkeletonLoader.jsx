import React from "react";

const SkeletonLoader = ({ className }) => {
  return (
    <div className={`animate-pulse bg-gray-200 rounded-lg ${className}`}></div>
  );
};

export default SkeletonLoader;
