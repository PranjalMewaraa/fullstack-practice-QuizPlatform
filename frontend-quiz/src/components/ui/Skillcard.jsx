<div className="p-5 rounded-2xl border border-gray-100 bg-white shadow-sm hover:shadow-md transition-all duration-300 ease-out">
  <div className="flex items-center justify-between">
    <span className="text-sm font-medium text-gray-600">{s.skill}</span>
    <span className="text-sm font-semibold text-gray-800">{s.accuracy}%</span>
  </div>

  <div className="w-full bg-gray-100 h-2 rounded-full mt-3">
    <div
      className={`h-2 rounded-full ${
        s.accuracy > 80
          ? "bg-green-500"
          : s.accuracy > 60
          ? "bg-blue-500"
          : s.accuracy > 40
          ? "bg-yellow-500"
          : "bg-red-500"
      }`}
      style={{ width: `${s.accuracy}%` }}
    ></div>
  </div>

  <div className="text-xs text-gray-500 mt-2">
    {s.correct}/{s.total} correct
  </div>
</div>;
