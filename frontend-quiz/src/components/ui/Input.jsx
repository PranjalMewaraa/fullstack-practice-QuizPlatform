export default function Input({ label, ...props }) {
  return (
    <label className="block text-sm w-full">
      <span className="text-gray-600 mr-4">{label}</span>
      <input
        className="mt-1 w-full rounded-xl border border-gray-300 px-3 py-2 focus:outline-none  "
        {...props}
      />
    </label>
  );
}
