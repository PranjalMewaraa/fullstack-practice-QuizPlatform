import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../services/api";
import Card from "../../components/ui/Card";
import Button from "../../components/ui/Button";

const PAGE_SIZE = 5;

export default function SkillSelect() {
  const nav = useNavigate();
  const [skills, setSkills] = useState([]);
  const [loading, setLoading] = useState(true);

  // pagination
  const [page, setPage] = useState(1);
  const totalPages = useMemo(
    () => Math.max(1, Math.ceil((skills?.length || 0) / PAGE_SIZE)),
    [skills]
  );

  useEffect(() => {
    (async () => {
      try {
        const data = await api.getSkills();
        setSkills(data || []);
        setPage(1); // reset page whenever the dataset refreshes
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const paged = useMemo(() => {
    const start = (page - 1) * PAGE_SIZE;
    return skills.slice(start, start + PAGE_SIZE);
  }, [skills, page]);

  function goto(p) {
    setPage((prev) => {
      const next = Math.min(Math.max(p, 1), totalPages);
      return next;
    });
  }

  return (
    <div className="space-y-4">
      <Card
        title="Select a Skill to Start a Quiz"
        right={
          !loading &&
          skills.length > 0 && (
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <span>
                Showing {(skills.length && (page - 1) * PAGE_SIZE + 1) || 0}–
                {Math.min(page * PAGE_SIZE, skills.length)} of {skills.length}
              </span>
              <div className="flex items-center gap-2">
                <Button disabled={page <= 1} onClick={() => goto(page - 1)}>
                  ← Prev
                </Button>
                <span className="px-2 py-1 rounded-lg bg-gray-100">
                  Page {page} / {totalPages}
                </span>
                <Button
                  disabled={page >= totalPages}
                  onClick={() => goto(page + 1)}
                >
                  Next →
                </Button>
              </div>
            </div>
          )
        }
      >
        {loading ? (
          <div className="text-gray-500">Loading skills…</div>
        ) : skills.length === 0 ? (
          <div className="text-gray-500">No skills yet</div>
        ) : (
          <>
            {/* Desktop Table */}
            <div className="hidden md:block">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="bg-gray-100 text-left text-gray-600">
                    <th className="px-4 py-2">ID</th>
                    <th className="px-4 py-2">Skill</th>
                    <th className="px-4 py-2">Description</th>
                    <th className="px-4 py-2">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {paged.map((s) => (
                    <tr key={s.id} className="border-b">
                      <td className="px-4 py-2">{s.id}</td>
                      <td className="px-4 py-2">{s.name}</td>
                      <td className="px-4 py-2">{s.description}</td>
                      <td className="px-4 py-2">
                        <Button
                          className="!bg-indigo-600 !text-white border-indigo-600"
                          onClick={() => nav(`/skills/${s.id}/quizzes`)}
                        >
                          Start Quiz
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile Cards */}
            <div className="flex flex-col gap-3 md:hidden">
              {paged.map((s) => (
                <div
                  key={s.id}
                  className="bg-white/70 backdrop-blur-md shadow-md rounded-2xl p-4 flex flex-col gap-2 border border-gray-100"
                >
                  <div className="text-sm text-gray-500">Skill #{s.id}</div>
                  <div className="text-lg font-semibold">{s.name}</div>
                  <div className="text-sm text-gray-400">{s.description}</div>
                  <Button
                    className="!bg-indigo-600 !text-white border-indigo-600 mt-2"
                    onClick={() => nav(`/skills/${s.id}/quizzes`)}
                  >
                    Start Quiz
                  </Button>
                </div>
              ))}
            </div>

            {/* Pager (duplicate bottom controls for convenience on long lists) */}
            <div className="mt-4 flex items-center justify-between">
              <div className="text-sm text-gray-600">
                Page {page} / {totalPages}
              </div>
              <div className="flex items-center gap-2">
                <Button disabled={page <= 1} onClick={() => goto(page - 1)}>
                  ← Prev
                </Button>
                <Button
                  disabled={page >= totalPages}
                  onClick={() => goto(page + 1)}
                >
                  Next →
                </Button>
              </div>
            </div>
          </>
        )}
      </Card>
    </div>
  );
}
