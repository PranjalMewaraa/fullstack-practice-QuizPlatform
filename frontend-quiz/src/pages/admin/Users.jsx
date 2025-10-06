import { useEffect, useState } from "react";
import Card from "../../components/ui/Card";
import Button from "../../components/ui/Button";
import Input from "../../components/ui/Input";
import api from "../../services/api";
import { Edit2, Trash2, X } from "lucide-react";

export default function Users() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");

  const [editing, setEditing] = useState(null);
  const [eName, setEName] = useState("");
  const [eEmail, setEEmail] = useState("");
  const [eRole, setERole] = useState("user");
  const [ePassword, setEPassword] = useState("");
  const [eErr, setEErr] = useState("");
  const [saving, setSaving] = useState(false);

  async function load() {
    setLoading(true);
    setErr("");
    try {
      const res = await api.getUsers();
      setRows(res);
    } catch (e) {
      setErr(e?.response?.data?.message || e.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  function openEdit(row) {
    setEditing(row);
    setEName(row.name || "");
    setEEmail(row.email || "");
    setERole(row.role || "user");
    setEPassword("");
    setEErr("");
  }

  function closeEdit() {
    setEditing(null);
    setEName("");
    setEEmail("");
    setERole("user");
    setEPassword("");
    setEErr("");
  }

  function isValidEmail(v) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
  }

  async function saveEdit() {
    if (!eName.trim()) return setEErr("Name is required.");
    if (!eEmail.trim() || !isValidEmail(eEmail))
      return setEErr("Valid email is required.");
    if (!["user", "admin"].includes(eRole))
      return setEErr("Role must be user or admin.");

    try {
      setSaving(true);
      const body = {
        name: eName.trim(),
        email: eEmail.trim(),
        role: eRole,
      };
      if (ePassword.trim()) body.password = ePassword.trim();

      const resp = await api.updateUser(editing.id, body);
      const updated = resp.user || editing;
      setRows((list) => list.map((u) => (u.id === editing.id ? updated : u)));
      closeEdit();
    } catch (e) {
      setEErr(e?.response?.data?.message || e.message);
    } finally {
      setSaving(false);
    }
  }

  async function remove(id) {
    const ok = window.confirm("Delete this user?");
    if (!ok) return;
    try {
      await api.deleteUser(id);
      setRows((list) => list.filter((u) => u.id !== id));
    } catch (e) {
      alert(e?.response?.data?.message || e.message);
    }
  }

  return (
    <div className="space-y-4">
      <Card title="All Users">
        {loading ? (
          <div className="text-gray-500">Loading users…</div>
        ) : err ? (
          <div className="text-red-600">{err}</div>
        ) : rows.length === 0 ? (
          <div className="text-gray-500">No users found.</div>
        ) : (
          <>
            {/* Desktop Table */}
            <div className="hidden md:block overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead>
                  <tr className="text-left border-b">
                    <th className="py-2 px-3">ID</th>
                    <th className="py-2 px-3">Name</th>
                    <th className="py-2 px-3">Email</th>
                    <th className="py-2 px-3">Role</th>
                    <th className="py-2 px-3">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((r) => (
                    <tr key={r.id} className="border-b hover:bg-gray-50">
                      <td className="py-2 px-3">{r.id}</td>
                      <td className="py-2 px-3">{r.name}</td>
                      <td className="py-2 px-3">{r.email}</td>
                      <td className="py-2 px-3">{r.role}</td>
                      <td className="py-2 px-3">
                        <div className="flex gap-2">
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

            {/* Mobile Cards */}
            <div className="flex flex-col gap-3 md:hidden">
              {rows.map((r) => (
                <div
                  key={r.id}
                  className="bg-white/70 backdrop-blur-md shadow-md rounded-2xl p-4 flex flex-col gap-2 border border-gray-100"
                >
                  <div className="text-sm text-gray-500">User #{r.id}</div>
                  <div className="text-lg font-semibold">{r.name}</div>
                  <div className="text-sm text-gray-400">{r.email}</div>
                  <div className="text-sm text-gray-400 capitalize">
                    {r.role}
                  </div>
                  <div className="flex gap-2 mt-2">
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
                </div>
              ))}
            </div>
          </>
        )}
      </Card>

      {/* Edit Modal */}
      {editing && (
        <div className="fixed inset-0 z-[10000px] flex items-center justify-center">
          <div className="absolute inset-0 bg-black/30" onClick={closeEdit} />
          <div className="relative z-50 w-full max-w-lg rounded-2xl bg-white shadow-xl border p-5">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-lg font-semibold">Edit User #{editing.id}</h3>
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
                value={eName}
                onChange={(e) => setEName(e.target.value)}
              />
              <Input
                label="Email"
                value={eEmail}
                onChange={(e) => setEEmail(e.target.value)}
              />
              <label className="text-sm text-gray-600">
                Role
                <select
                  className="mt-1 w-full rounded-xl border px-3 py-2"
                  value={eRole}
                  onChange={(e) => setERole(e.target.value)}
                >
                  <option value="user">user</option>
                  <option value="admin">admin</option>
                </select>
              </label>
              <Input
                label="Reset Password (optional)"
                type="password"
                value={ePassword}
                onChange={(e) => setEPassword(e.target.value)}
                placeholder="Leave blank to keep current password"
              />
              {eErr && <div className="text-sm text-red-600">{eErr}</div>}

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
