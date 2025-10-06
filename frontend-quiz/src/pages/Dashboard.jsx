import { useAuth } from "../context/AuthContext";
import StatCard from "../components/ui/StatCard";
import Card from "../components/ui/Card";

export default function Dashboard() {
  const { user } = useAuth();
  return (
    <div className="space-y-6">
      <div className="grid md:grid-cols-3 gap-4">
        <StatCard
          label="Welcome"
          value={user?.name}
          sub={`Role: ${user?.role}`}
        />
        <StatCard label="Attempts" value={3} sub="Sample" />
        <StatCard label="Avg Score" value={80} sub="Sample" />
      </div>
      <Card title="Getting Started">
        <ol className="list-decimal ml-6 text-sm text-gray-700 space-y-1">
          <li>
            Go to <b>Quiz</b> to take a test.
          </li>
          <li>
            Open <b>My Reports</b> to view your performance.
          </li>
          <li>
            If you are admin, manage <b>Skills</b> and <b>Questions</b>.
          </li>
        </ol>
      </Card>
    </div>
  );
}
