export default function Button({ children, className = "", ...props }) {
  return (
    <button
      className={`px-4 py-2 rounded-2xl shadow-sm border border-gray-200 hover:shadow bg-white ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}
