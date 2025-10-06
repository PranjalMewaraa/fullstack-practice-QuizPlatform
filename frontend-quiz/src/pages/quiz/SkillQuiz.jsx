import { useEffect, useMemo, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "../../services/api";
import Card from "../../components/ui/Card";
import QuestionCard from "../../components/quiz/QuestionCard";
import QuestionPager from "../../components/quiz/QuestionPager";
import SubmitBar from "../../components/quiz/SubmitBar";
import Button from "../../components/ui/Button";
import { useAuth } from "../../context/AuthContext";

export default function SkillQuiz() {
  const { skillId } = useParams();
  const nav = useNavigate();
  const { user } = useAuth();

  const [skill, setSkill] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [index, setIndex] = useState(0);
  const [answers, setAnswers] = useState({});
  const [score, setScore] = useState(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");

  useEffect(() => {
    let isMounted = true;
    (async () => {
      setLoading(true);
      setErr("");
      setScore(null);
      setAnswers({});
      setIndex(0);
      try {
        const [skillsAll, qs] = await Promise.all([
          api.getSkills(),
          // ask for a page worth of questions; shuffle optional
          api.getQuestionsBySkill(skillId, {
            page: 1,
            limit: 50,
            shuffle: true,
          }),
        ]);
        if (!isMounted) return;

        setSkill(
          skillsAll.find((s) => String(s.id) === String(skillId)) || null
        );

        // qs is a paginated object: { skillId, page, pageSize, total, items: [...] }
        const arr = Array.isArray(qs) ? qs : qs?.items || [];
        setQuestions(arr);
      } catch (e) {
        if (isMounted)
          setErr(
            e?.response?.data?.message || e.message || "Failed to load quiz"
          );
      } finally {
        if (isMounted) setLoading(false);
      }
    })();
    return () => {
      isMounted = false;
    };
  }, [skillId]);

  // keep index valid if list changes
  useEffect(() => {
    if (index >= questions.length) setIndex(0);
  }, [questions.length]); // eslint-disable-line react-hooks/exhaustive-deps

  const q = useMemo(() => questions[index], [questions, index]);
  const attempted = Object.keys(answers).length;

  function onSelect(opt) {
    if (!q) return;
    setAnswers((a) => ({ ...a, [q.id]: opt }));
  }

  async function onSubmit() {
    const payload = {
      userId: user.id,
      answers: Object.entries(answers).map(([qid, selected]) => ({
        questionId: Number(qid),
        selected_option: selected,
      })),
    };
    const res = await api.submitQuiz(payload);
    setScore(res.score);
  }

  if (loading) return <div className="text-gray-500">Loading quiz…</div>;
  if (err) return <div className="text-red-600">Error: {err}</div>;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">
          {skill ? `Quiz: ${skill.name}` : "Quiz"}
        </h2>
        <Button onClick={() => nav("/quiz")}>← Change Skill</Button>
      </div>

      <Card title={`Questions (${questions.length})`}>
        {questions.length === 0 ? (
          <div className="text-gray-500">
            No questions available for this skill.
          </div>
        ) : (
          <div className="space-y-4">
            <QuestionCard
              q={q}
              selected={q ? answers[q.id] : undefined}
              onSelect={onSelect}
            />
            <QuestionPager
              total={questions.length}
              index={index}
              setIndex={setIndex}
            />
            <SubmitBar
              attempted={attempted}
              total={questions.length}
              onSubmit={onSubmit}
            />
            {score != null && (
              <div className="flex items-center justify-between bg-green-50 border border-green-200 text-green-800 px-4 py-3 rounded-2xl">
                <div>
                  Submitted! Score: <b>{score}</b>
                </div>
                <div className="flex gap-2">
                  <Button
                    onClick={() => {
                      setAnswers({});
                      setIndex(0);
                      setScore(null);
                    }}
                  >
                    Retry
                  </Button>
                  <Button
                    className="!bg-indigo-600 !text-white border-indigo-600"
                    onClick={() => nav("/reports/analytics")}
                  >
                    View My Reports
                  </Button>
                </div>
              </div>
            )}
          </div>
        )}
      </Card>
    </div>
  );
}
