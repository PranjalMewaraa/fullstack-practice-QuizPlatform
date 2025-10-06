export default function QuestionCard({ q, selected, onSelect }) {
  console.log("s", q);
  return (
    <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 space-y-3">
      <div className="font-medium">Q- {q?.question_text}</div>
      <div className="grid gap-2">
        {q?.options.map((opt, i) => (
          <label
            key={i}
            className={`flex items-center gap-3 border rounded-xl px-3 py-2 cursor-pointer ${
              selected === opt
                ? "border-indigo-400 bg-indigo-50"
                : "border-gray-200 hover:bg-gray-50"
            }`}
          >
            <input
              type="radio"
              name={`q-${q.id}`}
              checked={selected === opt}
              onChange={() => onSelect(opt)}
            />
            <span>{opt}</span>
          </label>
        ))}
      </div>
    </div>
  );
}
