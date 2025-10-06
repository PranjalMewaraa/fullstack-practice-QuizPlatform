export default function StatCard({ label, value, sub }) {
  return (
    <div className="bg-white rounded-2xl p-6 shadow-md border border-gray-100 hover:shadow-lg hover:-translate-y-1 transition-all duration-300 ease-out">
      <div className="flex flex-col">
        <span className="text-sm font-medium text-gray-500 tracking-wide">
          {label}
        </span>
        <span className="text-4xl font-bold text-gray-900 mt-2">{value}</span>
        {sub && (
          <span className="text-xs text-gray-400 mt-1 italic">{sub}</span>
        )}
      </div>
    </div>
  );
}
