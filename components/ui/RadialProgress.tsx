
import React from 'react';

interface RadialProgressProps {
  progress: number;
  className?: string;
  strokeWidth?: number;
}

const RadialProgress: React.FC<RadialProgressProps> = ({ progress, className, strokeWidth = 10 }) => {
  const radius = 50;
  const normalizedRadius = radius - strokeWidth / 2;
  const circumference = normalizedRadius * 2 * Math.PI;
  const offset = circumference - (progress / 100) * circumference;

  let colorClass = 'text-green-500';
  if (progress < 75) colorClass = 'text-yellow-500';
  if (progress < 40) colorClass = 'text-red-500';
  
  return (
    <div className={`relative inline-flex items-center justify-center overflow-hidden rounded-full ${className}`}>
      <svg className="w-full h-full" viewBox="0 0 120 120">
        <circle
          className="text-gray-200"
          strokeWidth={strokeWidth}
          stroke="currentColor"
          fill="transparent"
          r={normalizedRadius}
          cx="60"
          cy="60"
        />
        <circle
          className={`${colorClass} transition-all duration-1000 ease-out`}
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          stroke="currentColor"
          fill="transparent"
          r={normalizedRadius}
          cx="60"
          cy="60"
          style={{ transform: 'rotate(-90deg)', transformOrigin: '50% 50%' }}
        />
      </svg>
      <span className="absolute text-2xl font-bold text-gray-700">{`${progress}`}</span>
    </div>
  );
};

export default RadialProgress;
