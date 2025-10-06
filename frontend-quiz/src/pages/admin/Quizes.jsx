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
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");

  // create form
  const [form, setForm] = useState({
    title: "",
    description: "",
    time_limit_sec: 0,
    is_published: false,
  });

  // edit modal state
  const [editing, setEditing] = useState(null); // row being edited
  const [editForm, setEditForm] = useState(null); // {title, description, ...}
  const [saving, setSaving] = useState(false);

  const load = async () => {
    setLoading(true);
    setErr("");
    try {
      const list = await api.getQuizzesBySkill(skillId);
      setRows(list || []);
    } catch (e) {
      setErr(e?.response?.data?.message || e.message || "Failed to load");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load(); // eslint-disable-next-line
  }, [skillId]);

  async function create() {
    if (!form.title.trim()) return alert("Title required");
    try {
      await api.createQuiz(skillId, form);
      setForm({
        title: "",
        description: "",
        time_limit_sec: 0,
        is_published: false,
      });
      load();
    } catch (e) {
      alert(e?.response?.data?.message || e.message || "Create failed");
    }
  }

  async function togglePublish(row) {
    try {
      await api.updateQuiz(row.id, { is_published: !row.is_published });
      load();
    } catch (e) {
      alert(e?.response?.data?.message || e.message || "Update failed");
    }
  }

  async function del(id) {
    if (!window.confirm("Delete this quiz?")) return;
    try {
      await api.deleteQuiz(id);
      load();
    } catch (e) {
      alert(e?.response?.data?.message || e.message || "Delete failed");
    }
  }

  function openEdit(row) {
    setEditing(row);
    setEditForm({
      title: row.title || "",
      description: row.description || "",
      time_limit_sec: Number(row.time_limit_sec || 0),
      is_published: !!row.is_published,
    });
  }
  function closeEdit() {
    setEditing(null);
    setEditForm(null);
    setSaving(false);
  }

  async function saveEdit() {
    if (!editing) return;
    if (!editForm.title.trim()) return alert("Title is required");
    setSaving(true);
    try {
      await api.updateQuiz(editing.id, {
        title: editForm.title.trim(),
        description: editForm.description || "",
        time_limit_sec: Number(editForm.time_limit_sec || 0),
        is_published: !!editForm.is_published,
      });
      closeEdit();
      load();
    } catch (e) {
      alert(e?.response?.data?.message || e.message || "Save failed");
      setSaving(false);
    }
  }

  // Precompute table-friendly fields
  const tableRows = rows.map((r) => ({
    ...r,
    publishedText: r.is_published ? "Yes" : "No",
    timeLimitText: r.time_limit_sec ? `${r.time_limit_sec}s` : "—",
    actionsNode: (
      <div className="flex flex-wrap gap-2">
        <Button onClick={() => openEdit(r)}>Edit</Button>
        <Button
          onClick={() => togglePublish(r)}
          className={
            r.is_published
              ? "!bg-yellow-50 border-yellow-200 text-yellow-700 hover:!bg-yellow-100"
              : "!bg-green-600 !text-white border-green-600"
          }
          title={r.is_published ? "Unpublish" : "Publish"}
        >
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
  }));

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
        ) : err ? (
          <div className="text-red-600">{err}</div>
        ) : tableRows.length === 0 ? (
          <div className="text-gray-500">No quizzes yet.</div>
        ) : (
          <DataTable
            columns={[
              { header: "ID", accessor: "id" },
              { header: "Title", accessor: "title" },
              { header: "Published", accessor: "publishedText" },
              { header: "Time Limit", accessor: "timeLimitText" },
              { header: "Actions", accessor: "actionsNode" },
            ]}
            rows={tableRows}
          />
        )}
      </Card>

      {/* Edit Modal */}
      {editing && editForm && (
        <div className="fixed inset-0 z-40 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/30" onClick={closeEdit} />
          <div className="relative z-50 w-full max-w-2xl rounded-2xl bg-white shadow-xl border p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Edit Quiz #{editing.id}</h3>
            </div>

            <div className="grid md:grid-cols-2 gap-3">
              <Input
                label="Title"
                value={editForm.title}
                onChange={(e) =>
                  setEditForm((f) => ({ ...f, title: e.target.value }))
                }
              />
              <Input
                label="Time limit (sec, 0 = none)"
                type="number"
                value={editForm.time_limit_sec}
                onChange={(e) =>
                  setEditForm((f) => ({
                    ...f,
                    time_limit_sec: Number(e.target.value),
                  }))
                }
              />
              <div className="md:col-span-2">
                <Input
                  label="Description"
                  value={editForm.description}
                  onChange={(e) =>
                    setEditForm((f) => ({
                      ...f,
                      description: e.target.value,
                    }))
                  }
                />
              </div>
              <label className="text-sm text-gray-600">
                Published
                <input
                  type="checkbox"
                  className="ml-2"
                  checked={editForm.is_published}
                  onChange={(e) =>
                    setEditForm((f) => ({
                      ...f,
                      is_published: e.target.checked,
                    }))
                  }
                />
              </label>
            </div>

            <div className="mt-5 flex justify-end gap-2">
              <Button onClick={closeEdit}>Cancel</Button>
              <Button
                onClick={saveEdit}
                disabled={saving}
                className="!bg-indigo-600 !text-white border-indigo-600"
              >
                {saving ? "Saving…" : "Save"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
