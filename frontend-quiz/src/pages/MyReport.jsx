// src/pages/MyReports.jsx
import { useEffect, useMemo, useState } from "react";
import api from "../services/api";
import { useAuth } from "../context/AuthContext";
import StatCard from "../components/ui/StatCard";
import Card from "../components/ui/Card";
import SkillCard from "../components/ui/ProgressCard";
import Button from "../components/ui/Button";
import Input from "../components/ui/Input";

export default function MyReports() {
  const { user } = useAuth();

  // Top overview (existing)
  const [overview, setOverview] = useState(null);

  // Attempts list
  const [attempts, setAttempts] = useState({
    items: [],
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 1,
  });
  const [aPage, setAPage] = useState(1);
  const [aLimit, setALimit] = useState(5); // default 5/page
  const [withAnswers, setWithAnswers] = useState(false);
  const [loadingAttempts, setLoadingAttempts] = useState(true);
  const [aErr, setAErr] = useState("");

  // Client-side filters
  const [q, setQ] = useState(""); // quiz title search
  const filteredItems = useMemo(() => {
    const term = q.trim().toLowerCase();
    if (!term) return attempts.items;
    return attempts.items.filter((it) =>
      (it.quizTitle || "").toLowerCase().includes(term)
    );
  }, [attempts.items, q]);

  useEffect(() => {
    api.userOverview(user.id).then(setOverview);
  }, [user.id]);

  // Fetch attempts
  const loadAttempts = async () => {
    setLoadingAttempts(true);
    setAErr("");
    try {
      const res = await api.getAttemptsByUser(user.id, {
        page: aPage,
        limit: aLimit,
        withAnswers,
      });
      setAttempts(res);
    } catch (e) {
      setAErr(
        e?.response?.data?.message || e.message || "Failed to load attempts"
      );
    } finally {
      setLoadingAttempts(false);
    }
  };

  useEffect(() => {
    loadAttempts(); // eslint-disable-next-line
  }, [user.id, aPage, aLimit, withAnswers]);

  return (
    <div className="space-y-6">
      {/* ===== Overview ===== */}
      <div className="grid md:grid-cols-3 gap-4">
        <StatCard label="Attempts" value={overview?.totalAttempts ?? 0} />
        <StatCard label="Avg Score" value={overview?.avgScore ?? 0} />
        <StatCard
          label="Last Attempt"
          value={
            overview?.lastAttemptAt
              ? new Date(overview.lastAttemptAt).toLocaleString()
              : "—"
          }
        />
      </div>

      {/* ===== Skill Accuracy ===== */}
      <Card title="Skill Accuracy">
        <div className="grid md:grid-cols-3 lg:grid-cols-5 gap-3">
          {overview?.skills?.map((s, i) => (
            <SkillCard
              key={i}
              skill={s.skill}
              accuracy={s.accuracy}
              correct={s.correct}
              total={s.total}
            />
          ))}
          {!overview?.skills?.length && (
            <div className="text-gray-500">No answers yet.</div>
          )}
        </div>
      </Card>

      {/* ===== My Attempts ===== */}
      <Card
        title="My Attempts"
        right={
          <div className="flex flex-wrap items-end gap-2">
            <label className="text-sm text-gray-600">
              Show question breakdown
              <input
                type="checkbox"
                className="ml-2"
                checked={withAnswers}
                onChange={(e) => {
                  setWithAnswers(e.target.checked);
                  setAPage(1);
                }}
              />
            </label>
            <label className="text-sm text-gray-600">
              Page size
              <select
                className="mt-1 ml-2 rounded-xl border px-3 py-2"
                value={aLimit}
                onChange={(e) => {
                  setALimit(Number(e.target.value));
                  setAPage(1);
                }}
              >
                <option value={5}>5</option>
                <option value={10}>10</option>
                <option value={20}>20</option>
              </select>
            </label>
          </div>
        }
      >
        {/* Filters */}
        <div className="mb-3 grid gap-2 md:grid-cols-3">
          <Input
            label="Search by quiz title"
            placeholder="e.g., React Basics"
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
        </div>

        {loadingAttempts ? (
          <div className="text-gray-500">Loading attempts…</div>
        ) : aErr ? (
          <div className="text-red-600">{aErr}</div>
        ) : attempts.total === 0 ? (
          <div className="text-gray-500">No attempts yet.</div>
        ) : (
          <>
            {/* Desktop table */}
            <div className="hidden md:block overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead>
                  <tr className="text-left border-b">
                    <th className="py-2 px-3">Date</th>
                    <th className="py-2 px-3">Quiz</th>
                    <th className="py-2 px-3">Skill</th>
                    <th className="py-2 px-3">Score</th>
                    <th className="py-2 px-3">Attempted</th>
                    <th className="py-2 px-3">Percent</th>
                    <th className="py-2 px-3">Duration</th>
                    {withAnswers && <th className="py-2 px-3">Details</th>}
                  </tr>
                </thead>
                <tbody>
                  {filteredItems.map((a) => (
                    <AttemptRow
                      key={a.attemptId}
                      a={a}
                      withAnswers={withAnswers}
                    />
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile cards */}
            <div className="md:hidden grid gap-3">
              {filteredItems.map((a) => (
                <AttemptCard
                  key={a.attemptId}
                  a={a}
                  withAnswers={withAnswers}
                />
              ))}
            </div>

            {/* Pager */}
            <div className="mt-3 flex items-center justify-between">
              <div className="text-sm text-gray-600">
                Page {attempts.page} / {attempts.totalPages} • Showing{" "}
                {filteredItems.length} of {attempts.limit} items on this page
              </div>
              <div className="flex gap-2">
                <Button
                  disabled={aPage <= 1}
                  onClick={() => setAPage((p) => Math.max(1, p - 1))}
                >
                  ← Prev
                </Button>
                <Button
                  disabled={aPage >= attempts.totalPages}
                  onClick={() =>
                    setAPage((p) => Math.min(attempts.totalPages, p + 1))
                  }
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

/* ===== Helpers / child components ===== */

function fmtMs(ms) {
  if (!ms || ms <= 0) return "—";
  const s = Math.floor(ms / 1000);
  const m = Math.floor(s / 60);
  const sec = s % 60;
  return `${m}m ${sec}s`;
}

function AttemptRow({ a, withAnswers }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <tr className="border-b align-top">
        <td className="py-2 px-3">{new Date(a.createdAt).toLocaleString()}</td>
        <td className="py-2 px-3">
          <div className="font-medium">{a.quizTitle || "—"}</div>
          {a.quizDescription && (
            <div className="text-xs text-gray-500">{a.quizDescription}</div>
          )}
        </td>
        <td className="py-2 px-3">{a.skillName || "—"}</td>
        <td className="py-2 px-3">
          {a.score} / {a.maxScore}
        </td>
        <td className="py-2 px-3">
          {a.attemptedQuestions} / {a.numQuestions}
        </td>
        <td className="py-2 px-3">{a.percent}%</td>
        <td className="py-2 px-3">{fmtMs(a.durationMs)}</td>
        {withAnswers && (
          <td className="py-2 px-3">
            <Button onClick={() => setOpen((v) => !v)}>
              {open ? "Hide" : "View"}
            </Button>
          </td>
        )}
      </tr>
      {withAnswers && open && Array.isArray(a.answers) && (
        <tr className="bg-gray-50">
          <td colSpan={8} className="px-3 py-3">
            {a.answers.length === 0 ? (
              <div className="text-gray-500">No answers recorded.</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full text-xs">
                  <thead>
                    <tr className="text-left border-b">
                      <th className="py-2 px-2">#</th>
                      <th className="py-2 px-2">Question</th>
                      <th className="py-2 px-2">Selected</th>
                      <th className="py-2 px-2">Correct</th>
                      <th className="py-2 px-2">Points</th>
                    </tr>
                  </thead>
                  <tbody>
                    {a.answers.map((ans, i) => (
                      <tr key={ans.answerId} className="border-b">
                        <td className="py-2 px-2">{i + 1}</td>
                        <td className="py-2 px-2">{ans.questionText}</td>
                        <td className="py-2 px-2">{ans.selectedOption}</td>
                        <td className="py-2 px-2">
                          <span
                            className={
                              ans.isCorrect ? "text-green-700" : "text-red-700"
                            }
                          >
                            {ans.correctOption}
                          </span>
                        </td>
                        <td className="py-2 px-2">{ans.pointsEarned}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </td>
        </tr>
      )}
    </>
  );
}

function AttemptCard({ a, withAnswers }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="bg-white rounded-2xl shadow border p-4 space-y-2">
      <div className="text-xs text-gray-500">
        {new Date(a.createdAt).toLocaleString()}
      </div>
      <div className="text-base font-semibold">{a.quizTitle || "—"}</div>
      {a.quizDescription && (
        <div className="text-xs text-gray-500">{a.quizDescription}</div>
      )}
      <div className="grid grid-cols-2 gap-2 text-sm">
        <div>
          <div className="text-gray-500">Skill</div>
          <div>{a.skillName || "—"}</div>
        </div>
        <div>
          <div className="text-gray-500">Score</div>
          <div>
            {a.score} / {a.maxScore} ({a.percent}%)
          </div>
        </div>
        <div>
          <div className="text-gray-500">Attempted</div>
          <div>
            {a.attemptedQuestions} / {a.numQuestions}
          </div>
        </div>
        <div>
          <div className="text-gray-500">Duration</div>
          <div>{fmtMs(a.durationMs)}</div>
        </div>
      </div>

      {withAnswers && (
        <>
          <Button className="mt-2" onClick={() => setOpen((v) => !v)}>
            {open ? "Hide answers" : "View answers"}
          </Button>
          {open && Array.isArray(a.answers) && (
            <div className="mt-2 grid gap-2">
              {a.answers.map((ans, i) => (
                <div
                  key={ans.answerId}
                  className={`rounded-xl border p-2 ${
                    ans.isCorrect
                      ? "border-green-200 bg-green-50"
                      : "border-red-200 bg-red-50"
                  }`}
                >
                  <div className="text-xs text-gray-500 mb-1">Q{i + 1}</div>
                  <div className="text-sm font-medium">{ans.questionText}</div>
                  <div className="text-xs mt-1">
                    Selected: <b>{ans.selectedOption}</b>
                  </div>
                  <div className="text-xs">
                    Correct: <b>{ans.correctOption}</b>
                  </div>
                  <div className="text-xs">Points: {ans.pointsEarned}</div>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
