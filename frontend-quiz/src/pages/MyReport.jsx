import { useEffect, useState } from "react";
import api from "../services/api";
import { useAuth } from "../context/AuthContext";
import StatCard from "../components/ui/StatCard";
import Card from "../components/ui/Card";
import SkillCard from "../components/ui/ProgressCard";

export default function MyReports() {
  const { user } = useAuth();
  const [overview, setOverview] = useState(null);

  useEffect(() => {
    api.userOverview(user.id).then(setOverview);
  }, [user.id]);

  return (
    <div className="space-y-6">
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
      <Card title="Skill Accuracy">
        <div className="grid md:grid-cols-3 lg:grid-cols-5 gap-3">
          {overview?.skills?.map((s) => (
            <SkillCard
              skill={s.skill}
              accuracy={s.accuracy}
              correct={s.correct}
              total={s.total}
            />
          ))}
        </div>
      </Card>
    </div>
  );
}
