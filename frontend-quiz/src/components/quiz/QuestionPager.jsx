export default function QuestionPager({ total, index, setIndex }) {
  return (
    <div className="flex items-center gap-2 flex-wrap">
      <button
        onClick={() => setIndex(Math.max(0, index - 1))}
        className="px-3 py-1 rounded-lg border"
      >
        Prev
      </button>
      {Array.from({ length: total }).map((_, i) => (
        <button
          key={i}
          onClick={() => setIndex(i)}
          className={`w-8 h-8 rounded-lg border text-sm ${
            i === index
              ? "bg-indigo-600 text-white border-indigo-600"
              : "bg-white"
          }`}
        >
          {i + 1}
        </button>
      ))}
      <button
        onClick={() => setIndex(Math.min(total - 1, index + 1))}
        className="px-3 py-1 rounded-lg border"
      >
        Next
      </button>
    </div>
  );
}
