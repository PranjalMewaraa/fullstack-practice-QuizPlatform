export default function SkillFilter({ skills = [], value = "", onChange }) {
  return (
    <div className="flex items-center gap-3">
      <span className="text-sm text-gray-600">Skill</span>
      <select
        className="rounded-xl border px-3 py-2"
        value={value}
        onChange={(e) => onChange(e.target.value)}
      >
        <option value="">All</option>
        {skills.map((s) => (
          <option key={s.id} value={s.id}>
            {s.name}
          </option>
        ))}
      </select>
    </div>
  );
}
