import React from "react";

export default function SkillCard({ skill, accuracy, correct, total }) {
  const radius = 40;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (accuracy / 100) * circumference;

  const getColor = (val) => {
    if (val > 80) return "text-green-500 stroke-green-500";
    if (val > 60) return "text-blue-500 stroke-blue-500";
    if (val > 40) return "text-yellow-500 stroke-yellow-500";
    return "text-red-500 stroke-red-500";
  };

  return (
    <div className="p-5 rounded-2xl border border-gray-100 bg-white shadow-sm hover:shadow-md transition-all duration-300 ease-out flex flex-col items-center justify-center text-center">
      <div className="relative w-24 h-24">
        {/* Background circle */}
        <svg className="w-full h-full -rotate-90">
          <circle
            cx="50%"
            cy="50%"
            r={radius}
            strokeWidth="8"
            className="stroke-gray-200"
            fill="transparent"
          />
          {/* Foreground progress circle */}
          <circle
            cx="50%"
            cy="50%"
            r={radius}
            strokeWidth="8"
            className={`${getColor(
              accuracy
            )} transition-all duration-700 ease-out`}
            fill="transparent"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            strokeLinecap="round"
          />
        </svg>

        {/* Percentage text */}
        <div className="absolute inset-0 flex items-center justify-center">
          <span className={`text-lg font-semibold ${getColor(accuracy)}`}>
            {accuracy}%
          </span>
        </div>
      </div>

      {/* Skill name */}
      <div className="mt-3 text-sm font-medium text-gray-700">{skill}</div>

      {/* Correct answers */}
      <div className="text-xs text-gray-500 mt-1">
        {correct}/{total} correct
      </div>
    </div>
  );
}
