import { useEffect, useState } from "react";
import Card from "../../components/ui/Card";
import Input from "../../components/ui/Input";
import Button from "../../components/ui/Button";
import api from "../../services/api";
import { Edit2, Trash2, X } from "lucide-react";
import { useNavigate } from "react-router-dom";

export default function Skills() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");
  const nav = useNavigate();
  // create form
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [creating, setCreating] = useState(false);

  // edit modal
  const [editing, setEditing] = useState(null); // skill row
  const [editName, setEditName] = useState("");
  const [editDesc, setEditDesc] = useState("");
  const [editErr, setEditErr] = useState("");
  const [saving, setSaving] = useState(false);

  async function load() {
    setLoading(true);
    setErr("");
    try {
      const s = await api.getSkills();
      setRows(s);
    } catch (e) {
      setErr(e?.response?.data?.message || e.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function add() {
    if (!name.trim()) {
      alert("Name is required");
      return;
    }
    try {
      setCreating(true);
      const s = await api.createSkill({
        name: name.trim(),
        description: description.trim(),
      });
      setRows((r) => [...r, s]);
      setName("");
      setDescription("");
    } catch (e) {
      alert(e?.response?.data?.message || e.message);
    } finally {
      setCreating(false);
    }
  }

  function openEdit(row) {
    setEditing(row);
    setEditName(row.name || "");
    setEditDesc(row.description || "");
    setEditErr("");
  }

  function closeEdit() {
    setEditing(null);
    setEditName("");
    setEditDesc("");
    setEditErr("");
  }

  async function saveEdit() {
    if (!editName.trim()) {
      setEditErr("Name is required.");
      return;
    }
    try {
      setSaving(true);
      const updated = await api.updateSkill(editing.id, {
        name: editName.trim(),
        description: editDesc.trim(),
      });
      setRows((list) => list.map((r) => (r.id === editing.id ? updated : r)));
      closeEdit();
    } catch (e) {
      setEditErr(e?.response?.data?.message || e.message);
    } finally {
      setSaving(false);
    }
  }

  async function remove(id) {
    // 1st try: safe delete (no cascade)
    const yes = window.confirm(
      "Delete this skill? This will fail if questions reference it."
    );
    if (!yes) return;

    try {
      await api.deleteSkill(id);
      setRows((r) => r.filter((x) => x.id !== id));
      return;
    } catch (e) {
      const status = e?.response?.status;
      const msg = e?.response?.data?.message || e.message;

      // If backend says there are linked questions (409), offer force delete
      if (status === 409) {
        const qCount = e?.response?.data?.questions;
        const confirmForce = window.confirm(
          `This skill has ${qCount ?? "some"} linked question(s). ` +
            `Do you want to delete the skill AND all its questions?`
        );
        if (!confirmForce) return;

        try {
          await api.deleteSkill(id, { force: true });
          setRows((r) => r.filter((x) => x.id !== id));
          return;
        } catch (e2) {
          alert(e2?.response?.data?.message || e2.message);
          return;
        }
      }

      alert(msg);
    }
  }

  return (
    <div className="space-y-4">
      {/* Create */}
      <Card
        title="Add Skill"
        right={
          <Button
            onClick={add}
            disabled={creating}
            className="!bg-indigo-600 !text-white border-indigo-600"
            title="Create"
          >
            {creating ? "Creating…" : "Create"}
          </Button>
        }
      >
        <div className="grid md:grid-cols-2 gap-4">
          <Input
            label="Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g., JavaScript"
          />
          <Input
            label="Description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Optional description"
          />
        </div>
      </Card>

      {/* List */}
      <Card title="Skills">
        {loading ? (
          <div className="text-gray-500">Loading…</div>
        ) : err ? (
          <div className="text-red-600">{err}</div>
        ) : rows.length === 0 ? (
          <div className="text-gray-500">No skills yet.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="text-left border-b">
                  <th className="py-2 px-3">ID</th>
                  <th className="py-2 px-3">Name</th>
                  <th className="py-2 px-3">Description</th>
                  <th className="py-2 px-3">Actions</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => (
                  <tr key={r.id} className="border-b hover:bg-gray-50">
                    <td className="py-2 px-3">{r.id}</td>
                    <td className="py-2 px-3">{r.name}</td>
                    <td className="py-2 px-3">{r.description || "—"}</td>
                    <td className="py-2 px-3">
                      <div className="flex gap-2">
                        <Button
                          title="Create Quiz"
                          onClick={() => nav(`/admin/${r.name}/${r.id}/quizes`)}
                          className="bg-blue-500 p-4"
                        >
                          Create Quiz
                        </Button>
                        <Button
                          className="!px-3"
                          onClick={() => openEdit(r)}
                          title="Edit"
                        >
                          <Edit2 size={16} />
                        </Button>
                        <Button
                          className="!px-3 !bg-red-50 border-red-200 text-red-700 hover:!bg-red-100"
                          onClick={() => remove(r.id)}
                          title="Delete"
                        >
                          <Trash2 size={16} />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* Edit Modal */}
      {editing && (
        <div className="fixed inset-0 z-40 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/30" onClick={closeEdit} />
          <div className="relative z-50 w-full max-w-lg rounded-2xl bg-white shadow-xl border p-5">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-lg font-semibold">
                Edit Skill #{editing.id}
              </h3>
              <button
                onClick={closeEdit}
                className="p-2 rounded-xl hover:bg-gray-100"
              >
                <X size={18} />
              </button>
            </div>

            <div className="grid gap-3">
              <Input
                label="Name"
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
              />
              <Input
                label="Description"
                value={editDesc}
                onChange={(e) => setEditDesc(e.target.value)}
              />
              {editErr && <div className="text-sm text-red-600">{editErr}</div>}

              <div className="flex justify-end gap-2 pt-2">
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
        </div>
      )}
    </div>
  );
}
