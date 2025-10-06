// src/pages/admin/Quizzes.jsx
import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import Card from "../../components/ui/Card";
import Input from "../../components/ui/Input";
import Button from "../../components/ui/Button";
import DataTable from "../../components/ui/DataTable";
import api from "../../services/api";

export default function Quizzes() {
  const { skill, skillId } = useParams();
  const [rows, setRows] = useState([]);
  const [form, setForm] = useState({
    title: "",
    description: "",
    time_limit_sec: 0,
    is_published: false,
  });
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    const q = await api.getQuizzesBySkill(skillId);
    setRows(q);
    setLoading(false);
  };

  useEffect(() => {
    load(); // eslint-disable-next-line
  }, [skillId]);

  async function create() {
    if (!form.title.trim()) return alert("Title required");
    await api.createQuiz(skillId, form);
    setForm({
      title: "",
      description: "",
      time_limit_sec: 0,
      is_published: false,
    });
    load();
  }
  async function togglePublish(row) {
    await api.updateQuiz(row.id, { is_published: !row.is_published });
    load();
  }
  async function del(id) {
    if (!window.confirm("Delete this quiz?")) return;
    await api.deleteQuiz(id);
    load();
  }

  return (
    <div className="space-y-4">
      <Card
        title={`Create Quiz for ${skill}`}
        right={
          <Button
            onClick={create}
            className="!bg-indigo-600 !text-white border-indigo-600"
          >
            Create
          </Button>
        }
      >
        <div className="grid md:grid-cols-2 gap-3">
          <Input
            label="Title"
            value={form.title}
            onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
          />
          <Input
            label="Time limit (sec, 0 = none)"
            type="number"
            value={form.time_limit_sec}
            onChange={(e) =>
              setForm((f) => ({ ...f, time_limit_sec: Number(e.target.value) }))
            }
          />
          <Input
            label="Description"
            value={form.description}
            onChange={(e) =>
              setForm((f) => ({ ...f, description: e.target.value }))
            }
          />
          <label className="text-sm text-gray-600">
            Published
            <input
              type="checkbox"
              className="ml-2"
              checked={form.is_published}
              onChange={(e) =>
                setForm((f) => ({ ...f, is_published: e.target.checked }))
              }
            />
          </label>
        </div>
      </Card>

      <Card title="Quizzes">
        {loading ? (
          <div className="text-gray-500">Loading…</div>
        ) : (
          <DataTable
            columns={[
              { header: "ID", accessor: "id" },
              { header: "Title", accessor: "title" },
              {
                header: "Published",
                accessor: (r) => (r.is_published ? "Yes" : "No"),
              },
              { header: "Time Limit", accessor: "time_limit_sec" },
              { header: "Actions", accessor: (r) => r.id },
            ]}
            rows={rows.map((r) => ({
              ...r,
              Actions: (
                <div className="flex gap-2">
                  <Button onClick={() => togglePublish(r)}>
                    {r.is_published ? "Unpublish" : "Publish"}
                  </Button>
                  <Button
                    className="!bg-red-50 border-red-200 text-red-700 hover:!bg-red-100"
                    onClick={() => del(r.id)}
                  >
                    Delete
                  </Button>
                </div>
              ),
            }))}
          />
        )}
      </Card>
    </div>
  );
}
