// src/pages/quiz/QuizList.jsx
import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Card from "../../components/ui/Card";
import Button from "../../components/ui/Button";
import api from "../../services/api";

export default function QuizList() {
  const { skillId } = useParams();
  const nav = useNavigate();
  const [skill, setSkill] = useState(null);
  const [quizzes, setQuizzes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");

  useEffect(() => {
    (async () => {
      try {
        const [skills, qs] = await Promise.all([
          api.getSkills(),
          api.getQuizzesBySkill(skillId),
        ]);
        setSkill(skills.find((s) => String(s.id) === String(skillId)) || null);
        setQuizzes(qs);
      } catch (e) {
        setErr(e?.response?.data?.message || e.message);
      } finally {
        setLoading(false);
      }
    })();
  }, [skillId]);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">
          {skill ? `Quizzes: ${skill.name}` : "Quizzes"}
        </h2>
        <Button onClick={() => nav("/quiz")}>← Change Skill</Button>
      </div>

      <Card title="Available Quizzes">
        {loading ? (
          <div className="text-gray-500">Loading…</div>
        ) : err ? (
          <div className="text-red-600">{err}</div>
        ) : quizzes.length === 0 ? (
          <div className="text-gray-500">
            No quizzes published for this skill yet.
          </div>
        ) : (
          <div className="grid md:grid-cols-2 gap-3">
            {quizzes.map((q) => (
              <div key={q.id} className="rounded-2xl border p-4">
                <div className="text-lg font-semibold">{q.title}</div>
                <div className="text-sm text-gray-600 mt-1">
                  {q.description || "—"}
                </div>
                <div className="flex items-center justify-between mt-3">
                  <div className="text-xs text-gray-500">
                    {q.is_published ? "Published" : "Draft"} •{" "}
                    {q.time_limit_sec
                      ? `${q.time_limit_sec}s`
                      : "No time limit"}
                  </div>
                  <Button
                    className="!bg-indigo-600 !text-white border-indigo-600"
                    onClick={() => nav(`/quizzes/${q.id}/play`)}
                  >
                    Start
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
