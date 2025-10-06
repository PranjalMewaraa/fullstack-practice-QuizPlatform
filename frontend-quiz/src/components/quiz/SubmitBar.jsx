export default function SubmitBar({ attempted, total, onSubmit }) {
  return (
    <div className="flex items-center justify-between gap-3 bg-white border rounded-2xl px-4 py-3">
      <div className="text-sm text-gray-600">
        Attempted: {attempted}/{total}
      </div>
      <button
        onClick={onSubmit}
        className="px-4 py-2 rounded-2xl bg-indigo-600 text-white"
      >
        Submit
      </button>
    </div>
  );
}
