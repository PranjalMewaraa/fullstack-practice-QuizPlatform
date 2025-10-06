// src/pages/quiz/QuizPlayer.jsx
import { useEffect, useMemo, useRef, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Card from "../../components/ui/Card";
import Button from "../../components/ui/Button";
import api from "../../services/api";
import { useAuth } from "../../context/AuthContext";

function OptionRow({ label, selected, onSelect }) {
  return (
    <label
      className={`flex items-center gap-3 rounded-xl border px-3 py-2 cursor-pointer ${
        selected ? "bg-indigo-50 border-indigo-200" : ""
      }`}
    >
      <input type="radio" checked={selected} onChange={onSelect} />
      <span>{label}</span>
    </label>
  );
}

export default function QuizPlayer() {
  const { quizId } = useParams();
  const nav = useNavigate();
  const { user } = useAuth();
  const [quiz, setQuiz] = useState(null);
  const [index, setIndex] = useState(0);
  const [answers, setAnswers] = useState({}); // { [questionId]: selected_option }
  const [score, setScore] = useState(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");
  const startTimeRef = useRef(Date.now());

  useEffect(() => {
    (async () => {
      try {
        const qz = await api.getQuiz(quizId); // includes Questions (no correct_answer)
        setQuiz(qz);
        startTimeRef.current = Date.now();
      } catch (e) {
        setErr(e?.response?.data?.message || e.message);
      } finally {
        setLoading(false);
      }
    })();
  }, [quizId]);

  const q = useMemo(() => quiz?.Questions?.[index], [quiz, index]);
  const total = quiz?.Questions?.length || 0;
  const attempted = Object.keys(answers).length;

  function onSelect(option) {
    if (!q) return;
    setAnswers((a) => ({ ...a, [q.id]: option }));
  }

  async function onSubmit() {
    if (!user?.id) return alert("Not logged in.");
    if (attempted < total) {
      const left = total - attempted;
      if (
        !window.confirm(
          `You haven't answered ${left} question(s). Submit anyway?`
        )
      )
        return;
    }
    const durationMs = Date.now() - startTimeRef.current;
    const payload = {
      userId: user.id,
      quizId: Number(quizId),
      durationMs,
      answers: Object.entries(answers).map(([questionId, selected_option]) => ({
        questionId: Number(questionId),
        selected_option,
      })),
    };
    const res = await api.submitQuiz(payload);
    setScore(res);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  if (loading) return <div className="text-gray-500">Loading quiz…</div>;
  if (err) return <div className="text-red-600">{err}</div>;
  if (!quiz) return <div className="text-gray-500">Quiz not found.</div>;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">{quiz.title}</h2>
        <Button onClick={() => nav(-1)}>← Back</Button>
      </div>

      {/* Summary (after submit) */}
      {score && (
        <Card title="Result">
          <div className="grid md:grid-cols-3 gap-3">
            <div className="rounded-xl border p-4">
              <div className="text-sm text-gray-500">Score</div>
              <div className="text-xl font-semibold">
                {score.score} / {score.maxScore} ({score.percent}%)
              </div>
            </div>
            <div className="rounded-xl border p-4">
              <div className="text-sm text-gray-500">Questions</div>
              <div className="text-xl font-semibold">
                {score.correct}/{score.numQuestions} correct
              </div>
            </div>
            <div className="rounded-xl border p-4">
              <div className="text-sm text-gray-500">Duration</div>
              <div className="text-xl font-semibold">
                {Math.round((score.durationMs ?? 0) / 1000)}s
              </div>
            </div>
          </div>
          <div className="mt-4 flex gap-2">
            <Button onClick={() => nav("/reports/analytics")}>
              View My Reports
            </Button>
            <Button onClick={() => window.location.reload()}>Retry Quiz</Button>
          </div>
        </Card>
      )}

      {/* Player */}
      {!score && (
        <Card
          title={`Question ${index + 1} of ${total}`}
          right={
            <div className="text-sm text-gray-500">
              Attempted: {attempted}/{total}
            </div>
          }
        >
          {q ? (
            <div className="space-y-4">
              <div className="text-base font-medium">{q.question_text}</div>
              <div className="grid gap-2">
                {(q.options || []).map((opt, i) => (
                  <OptionRow
                    key={i}
                    label={opt}
                    selected={answers[q.id] === opt}
                    onSelect={() => onSelect(opt)}
                  />
                ))}
              </div>

              <div className="flex items-center justify-between pt-2">
                <div className="text-sm text-gray-500">
                  {quiz.time_limit_sec
                    ? `Time limit: ${quiz.time_limit_sec}s`
                    : "No time limit"}
                </div>
                <div className="flex gap-2">
                  <Button
                    onClick={() => setIndex((v) => Math.max(0, v - 1))}
                    disabled={index === 0}
                  >
                    ← Prev
                  </Button>
                  <Button
                    onClick={() => setIndex((v) => Math.min(total - 1, v + 1))}
                    disabled={index >= total - 1}
                  >
                    Next →
                  </Button>
                  <Button
                    className="!bg-indigo-600 !text-white border-indigo-600"
                    onClick={onSubmit}
                  >
                    Submit quiz
                  </Button>
                </div>
              </div>
            </div>
          ) : (
            <div className="text-gray-500">No question</div>
          )}
        </Card>
      )}
    </div>
  );
}
