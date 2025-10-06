import { useEffect, useMemo, useState } from "react";
import api from "../services/api";
import Card from "../components/ui/Card";
import SkillFilter from "../components/quiz/SkillFilter";
import QuestionCard from "../components/quiz/QuestionCard";
import QuestionPager from "../components/quiz/QuestionPager";
import SubmitBar from "../components/quiz/SubmitBar";
import { useAuth } from "../context/AuthContext";

export default function Quiz() {
  const { user } = useAuth();
  const [skills, setSkills] = useState([]);
  const [questions, setQuestions] = useState([]);
  const [skillId, setSkillId] = useState("");
  const [index, setIndex] = useState(0);
  const [answers, setAnswers] = useState({});
  const [score, setScore] = useState(null);

  useEffect(() => {
    api.getSkills().then(setSkills);
    api.getQuestions().then(setQuestions);
  }, []);
  const visible = useMemo(
    () =>
      skillId
        ? questions.filter((q) => String(q.SkillId) === String(skillId))
        : questions,
    [questions, skillId]
  );
  const q = visible[index];
  const attempted = Object.keys(answers).length;

  function onSelect(opt) {
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

  return (
    <div className="space-y-4">
      <Card
        title="Take a Quiz"
        right={
          <SkillFilter skills={skills} value={skillId} onChange={setSkillId} />
        }
      >
        {visible.length === 0 ? (
          <div className="text-gray-500">No questions yet</div>
        ) : (
          <div className="space-y-4">
            <QuestionCard q={q} selected={answers[q?.id]} onSelect={onSelect} />
            <QuestionPager
              total={visible.length}
              index={index}
              setIndex={setIndex}
            />
            <SubmitBar
              attempted={attempted}
              total={visible.length}
              onSubmit={onSubmit}
            />
            {score != null && (
              <div className="text-green-700">Submitted! Score: {score}</div>
            )}
          </div>
        )}
      </Card>
    </div>
  );
}
