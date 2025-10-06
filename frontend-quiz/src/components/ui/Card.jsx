export default function Card({ title, right, children }) {
  return (
    <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
      <div className="flex items-center w-full justify-between mb-3">
        <h3 className="font-semibold text-gray-800">{title}</h3>
        {right}
      </div>
      {children}
    </div>
  );
}
