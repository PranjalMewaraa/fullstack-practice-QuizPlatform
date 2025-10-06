import { useEffect, useMemo, useState } from "react";
import Card from "../../components/ui/Card";
import Input from "../../components/ui/Input";
import Button from "../../components/ui/Button";
import api from "../../services/api";
import { ChevronUp, PlusCircle, Trash2, Plus, Edit2, X } from "lucide-react";

const MIN_OPTS = 2;
const MAX_OPTS = 6;

export default function Questions() {
  // -------- list state / filters --------
  const [skills, setSkills] = useState([]);
  const [skillId, setSkillId] = useState("");
  const [quizzes, setQuizzes] = useState([]); // NEW: quizzes for selected skill
  const [quizId, setQuizId] = useState(""); // NEW: primary filter

  const [sort, setSort] = useState("createdAt");
  const [dir, setDir] = useState("DESC");
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [rows, setRows] = useState([]);
  const [total, setTotal] = useState(0);
  const totalPages = useMemo(
    () => Math.max(1, Math.ceil(total / limit)),
    [total, limit]
  );
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");
  const [filtersOpen, setFiltersOpen] = useState(false); // mobile filters

  // selection (bulk)
  const [checked, setChecked] = useState({});
  const allChecked = rows.length > 0 && rows.every((r) => checked[r.id]);
  const anyChecked = Object.values(checked).some(Boolean);
  const selectedIds = Object.entries(checked)
    .filter(([, v]) => v)
    .map(([k]) => Number(k));

  // -------- create form (collapsible) --------
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    question_text: "",
    options: ["", "", "", ""],
    SkillId: "",
    QuizId: "", // NEW
  });
  const [correctIndex, setCorrectIndex] = useState(null);
  const [formErrs, setFormErrs] = useState({});

  // -------- edit modal --------
  const [editing, setEditing] = useState(null); // the row object being edited
  const [editForm, setEditForm] = useState(null); // {question_text, options, SkillId, QuizId}
  const [editCorrectIndex, setEditCorrectIndex] = useState(null);
  const [editErrs, setEditErrs] = useState({});
  const [editQuizzes, setEditQuizzes] = useState([]); // quizzes for the selected skill in edit modal

  // ---------- helpers ----------
  const trimOptions = (opts) => opts.map((o) => String(o).trim());
  const hasDuplicates = (opts) => {
    const t = trimOptions(opts).filter(Boolean);
    return new Set(t).size !== t.length;
  };

  const validate = (draft, correctIdx) => {
    const errs = {};
    if (!draft.question_text?.trim())
      errs.question_text = "Question is required.";
    if (!draft.SkillId) errs.SkillId = "Please select a skill.";
    if (!draft.QuizId) errs.QuizId = "Please select a quiz.";
    if (draft.options.some((o) => !String(o || "").trim()))
      errs.options = "All options must be filled.";
    if (hasDuplicates(draft.options))
      errs.duplicate = "Options must be unique.";
    if (correctIdx === null) errs.correct = "Select the correct option.";
    else if (!draft.options[correctIdx]?.trim())
      errs.correct = "Correct option cannot be empty.";
    return errs;
  };

  // ---------- data fetch ----------
  async function fetchQuestions() {
    setLoading(true);
    setErr("");
    try {
      const res = await api.getQuestions({
        page,
        limit,
        sort,
        dir,
        quizId: quizId || undefined, // PRIMARY FILTER
        // (optional) you can also pass skillId if your backend supports extra filtering
        // skillId: skillId || undefined,
      });
      setRows(res.items ?? []);
      setTotal(res.total ?? 0);
      setChecked({});
      if ((res.items ?? []).length === 0 && res.total > 0 && page > 1) {
        setPage(1);
      }
    } catch (e) {
      setErr(e?.response?.data?.message || e.message || "Failed to load");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    (async () => {
      try {
        const s = await api.getSkills();
        setSkills(s);
      } catch {}
    })();
  }, []);

  // When skill changes, load quizzes & auto-select first quiz
  useEffect(() => {
    (async () => {
      if (!skillId) {
        setQuizzes([]);
        setQuizId("");
        return;
      }
      try {
        const qz = await api.getQuizzesBySkill(skillId);
        setQuizzes(qz);
        setQuizId(qz[0]?.id ? String(qz[0].id) : "");
        setPage(1);
      } catch {}
    })();
  }, [skillId]);

  // Fetch questions whenever paging/sort/dir OR quizId changes
  useEffect(() => {
    fetchQuestions(); // eslint-disable-next-line
  }, [page, limit, sort, dir, quizId]);

  // ---------- create ----------
  function setOpt(i, v) {
    setForm((f) => {
      const next = {
        ...f,
        options: f.options.map((o, idx) => (idx === i ? v : o)),
      };
      if (correctIndex === null) {
        const firstFilled = next.options.findIndex((x) => x.trim());
        if (firstFilled !== -1) setCorrectIndex(firstFilled);
      }
      return next;
    });
  }
  const addOption = () =>
    setForm((f) =>
      f.options.length >= MAX_OPTS ? f : { ...f, options: [...f.options, ""] }
    );
  const removeOption = (idx) =>
    setForm((f) => {
      if (f.options.length <= MIN_OPTS) return f;
      const nextOpts = f.options.filter((_, i) => i !== idx);
      if (correctIndex !== null) {
        if (idx === correctIndex) {
          const firstFilled = nextOpts.findIndex((x) => x.trim());
          setCorrectIndex(firstFilled !== -1 ? firstFilled : null);
        } else if (idx < correctIndex) {
          setCorrectIndex(correctIndex - 1);
        }
      }
      return { ...f, options: nextOpts };
    });

  async function createQuestion() {
    const errs = validate(form, correctIndex);
    setFormErrs(errs);
    if (Object.keys(errs).length) return;

    const payload = {
      question_text: form.question_text.trim(),
      options: trimOptions(form.options),
      correct_answer: form.options[correctIndex].trim(),
      SkillId: Number(form.SkillId),
      QuizId: Number(form.QuizId), // NEW
    };
    await api.createQuestion(payload);
    await fetchQuestions();
    setForm({
      question_text: "",
      options: ["", "", "", ""],
      SkillId: "",
      QuizId: "",
    });
    setCorrectIndex(null);
    setShowForm(false);
  }

  // ---------- edit ----------
  const openEdit = (row) => {
    setEditing(row);
    const ci = row.options?.findIndex((o) => o === row.correct_answer);
    setEditForm({
      question_text: row.question_text,
      options: [...(row.options || [])],
      SkillId: row.SkillId ?? row.Skill?.id ?? "",
      QuizId: row.QuizId ?? row.Quiz?.id ?? "",
    });
    setEditCorrectIndex(ci >= 0 ? ci : null);
    setEditErrs({});
    // load quizzes for the current skill in edit modal
    (async () => {
      const sid = row.SkillId ?? row.Skill?.id;
      if (sid) {
        try {
          const qz = await api.getQuizzesBySkill(sid);
          setEditQuizzes(qz);
        } catch {
          setEditQuizzes([]);
        }
      } else {
        setEditQuizzes([]);
      }
    })();
  };
  const closeEdit = () => {
    setEditing(null);
    setEditForm(null);
    setEditCorrectIndex(null);
    setEditErrs({});
    setEditQuizzes([]);
  };

  const editSetOpt = (i, v) => {
    setEditForm((f) => {
      const next = {
        ...f,
        options: f.options.map((o, idx) => (idx === i ? v : o)),
      };
      if (editCorrectIndex === null) {
        const firstFilled = next.options.findIndex((x) => x.trim());
        if (firstFilled !== -1) setEditCorrectIndex(firstFilled);
      }
      return next;
    });
  };
  const editAddOpt = () =>
    setEditForm((f) =>
      f.options.length >= MAX_OPTS ? f : { ...f, options: [...f.options, ""] }
    );
  const editRemoveOpt = (idx) =>
    setEditForm((f) => {
      if (f.options.length <= MIN_OPTS) return f;
      const nextOpts = f.options.filter((_, i) => i !== idx);
      if (editCorrectIndex !== null) {
        if (idx === editCorrectIndex) {
          const firstFilled = nextOpts.findIndex((x) => x.trim());
          setEditCorrectIndex(firstFilled !== -1 ? firstFilled : null);
        } else if (idx < editCorrectIndex) {
          setEditCorrectIndex(editCorrectIndex - 1);
        }
      }
      return { ...f, options: nextOpts };
    });

  async function saveEdit() {
    const errs = validate(editForm, editCorrectIndex);
    setEditErrs(errs);
    if (Object.keys(errs).length) return;

    const payload = {
      question_text: editForm.question_text.trim(),
      options: trimOptions(editForm.options),
      correct_answer: editForm.options[editCorrectIndex].trim(),
      SkillId: Number(editForm.SkillId),
      QuizId: Number(editForm.QuizId), // NEW
    };
    await api.updateQuestion(editing.id, payload);
    await fetchQuestions();
    closeEdit();
  }

  // When changing skill in edit modal, reload quizzes for that skill
  async function onEditSkillChange(sid) {
    setEditForm((f) => ({ ...f, SkillId: Number(sid), QuizId: "" }));
    try {
      const qz = await api.getQuizzesBySkill(sid);
      setEditQuizzes(qz);
    } catch {
      setEditQuizzes([]);
    }
  }

  // ---------- delete ----------
  async function confirmDelete(id) {
    if (!window.confirm("Delete this question?")) return;
    await api.deleteQuestion(id);
    await fetchQuestions();
  }
  async function confirmBulkDelete() {
    if (!selectedIds.length) return;
    if (!window.confirm(`Delete ${selectedIds.length} selected question(s)?`))
      return;
    await api.bulkDeleteQuestions(selectedIds);
    await fetchQuestions();
  }

  return (
    <div className="space-y-6">
      {/* --- Create (collapsible) --- */}
      <Card
        title={
          <div className="flex items-center justify-between w-full">
            <span>Add Question</span>
            <button
              onClick={() => setShowForm((v) => !v)}
              className="flex items-center gap-1 text-sm text-indigo-600 hover:text-indigo-800"
            >
              {showForm ? (
                <>
                  <ChevronUp size={16} /> Hide
                </>
              ) : (
                <>
                  <PlusCircle size={16} /> Add New
                </>
              )}
            </button>
          </div>
        }
      >
        <div
          className={`grid gap-3 transition-all duration-500 ease-in-out overflow-hidden ${
            showForm ? "max-h-[1500px] opacity-100" : "max-h-0 opacity-0"
          }`}
        >
          {/* Skill & Quiz pickers */}
          <div className="grid md:grid-cols-2 gap-3">
            <label className="text-sm text-gray-600">
              Skill
              <select
                className="mt-1 w-full rounded-xl border px-3 py-2"
                value={form.SkillId}
                onChange={async (e) => {
                  const sid = e.target.value;
                  setForm((f) => ({ ...f, SkillId: sid, QuizId: "" }));
                  if (sid) {
                    const qz = await api.getQuizzesBySkill(sid);
                    setQuizzes(qz);
                  } else {
                    setQuizzes([]);
                  }
                }}
              >
                <option value="">Select skill</option>
                {skills.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
            </label>

            <label className="text-sm text-gray-600">
              Quiz
              <select
                className="mt-1 w-full rounded-xl border px-3 py-2"
                value={form.QuizId}
                onChange={(e) =>
                  setForm((f) => ({ ...f, QuizId: Number(e.target.value) }))
                }
                disabled={!form.SkillId}
              >
                <option value="">Select quiz</option>
                {quizzes.map((q) => (
                  <option key={q.id} value={q.id}>
                    {q.title}
                  </option>
                ))}
              </select>
            </label>
          </div>
          {(formErrs.SkillId || formErrs.QuizId) && (
            <div className="text-sm text-red-600">
              {formErrs.SkillId || formErrs.QuizId}
            </div>
          )}

          {/* Question text */}
          <Input
            label="Question"
            value={form.question_text}
            onChange={(e) =>
              setForm((f) => ({ ...f, question_text: e.target.value }))
            }
            placeholder="Type the question here…"
          />
          {formErrs.question_text && (
            <div className="text-sm text-red-600">{formErrs.question_text}</div>
          )}

          {/* Options */}
          <div className="grid gap-2">
            <div className="text-sm text-gray-600">
              Options (pick one correct)
            </div>
            {form.options.map((o, i) => (
              <div
                key={i}
                className="flex items-center gap-3 rounded-xl border px-3 py-2"
              >
                <input
                  type="radio"
                  name="correctOptionCreate"
                  className="h-4 w-4"
                  checked={correctIndex === i}
                  onChange={() => setCorrectIndex(i)}
                  title="Mark as correct"
                />
                <Input
                  label={`Option ${i + 1}`}
                  value={o}
                  onChange={(e) => setOpt(i, e.target.value)}
                  className="flex-1"
                  placeholder={`Enter option ${i + 1}`}
                />
                <Button
                  type="button"
                  onClick={() => removeOption(i)}
                  disabled={form.options.length <= MIN_OPTS}
                  className="!px-3"
                  title={
                    form.options.length <= MIN_OPTS
                      ? "Minimum 2 options"
                      : "Remove option"
                  }
                >
                  <Trash2 size={16} />
                </Button>
              </div>
            ))}
            <div className="flex items-center justify-between">
              <div className="text-xs text-gray-500">
                {form.options.length} / {MAX_OPTS} options
              </div>
              <Button
                type="button"
                onClick={addOption}
                disabled={form.options.length >= MAX_OPTS}
                className="!px-3 flex items-center gap-2"
              >
                <Plus size={16} /> Add option
              </Button>
            </div>
            {(formErrs.options || formErrs.duplicate || formErrs.correct) && (
              <div className="text-sm text-red-600">
                {formErrs.options || formErrs.duplicate || formErrs.correct}
              </div>
            )}
          </div>

          <div className="flex items-center justify-between pt-2">
            <div className="text-xs text-gray-500">
              Tip: select the quiz first; 2–6 options; no duplicates.
            </div>
            <Button
              onClick={createQuestion}
              className="!bg-indigo-600 !text-white border-indigo-600"
            >
              Create
            </Button>
          </div>
        </div>
      </Card>

      {/* --- Mobile Filters (collapsible) --- */}
      <div className="md:hidden">
        <Button
          onClick={() => setFiltersOpen((v) => !v)}
          className="w-full flex items-center justify-center gap-2"
        >
          {filtersOpen ? "Hide Filters ▲" : "Show Filters ▼"}
        </Button>

        <div
          className={`mt-2 grid gap-3 rounded-2xl border p-3 transition-all duration-300 ${
            filtersOpen ? "block" : "hidden"
          }`}
        >
          <label className="text-sm text-gray-600">
            Skill
            <select
              className="mt-1 w-full rounded-xl border px-3 py-2"
              value={skillId}
              onChange={async (e) => {
                const sid = e.target.value;
                setSkillId(sid);
                setPage(1);
                if (sid) {
                  const qz = await api.getQuizzesBySkill(sid);
                  setQuizzes(qz);
                  setQuizId(qz[0]?.id ? String(qz[0].id) : "");
                } else {
                  setQuizzes([]);
                  setQuizId("");
                }
              }}
            >
              <option value="">All</option>
              {skills.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          </label>

          <label className="text-sm text-gray-600">
            Quiz
            <select
              className="mt-1 w-full rounded-xl border px-3 py-2"
              value={quizId}
              onChange={(e) => {
                setQuizId(e.target.value);
                setPage(1);
              }}
              disabled={!skillId}
            >
              <option value="">All</option>
              {quizzes.map((q) => (
                <option key={q.id} value={q.id}>
                  {q.title}
                </option>
              ))}
            </select>
          </label>

          <div className="grid grid-cols-2 gap-3">
            <label className="text-sm text-gray-600">
              Sort
              <select
                className="mt-1 w-full rounded-xl border px-3 py-2"
                value={sort}
                onChange={(e) => setSort(e.target.value)}
              >
                <option value="createdAt">Created</option>
                <option value="question_text">Question</option>
                <option value="SkillId">Skill</option>
              </select>
            </label>

            <label className="text-sm text-gray-600">
              Dir
              <select
                className="mt-1 w-full rounded-xl border px-3 py-2"
                value={dir}
                onChange={(e) => setDir(e.target.value)}
              >
                <option value="DESC">DESC</option>
                <option value="ASC">ASC</option>
              </select>
            </label>
          </div>

          <label className="text-sm text-gray-600">
            Page size
            <select
              className="mt-1 w-full rounded-xl border px-3 py-2"
              value={limit}
              onChange={(e) => {
                setLimit(Number(e.target.value));
                setPage(1);
              }}
            >
              <option value={5}>5</option>
              <option value={10}>10</option>
              <option value={20}>20</option>
              <option value={50}>50</option>
            </select>
          </label>

          <Button
            onClick={confirmBulkDelete}
            disabled={!anyChecked}
            className={
              anyChecked
                ? "!bg-red-600 !text-white border-red-600"
                : "!bg-gray-200 !text-gray-500 border-gray-200 cursor-not-allowed"
            }
            title={anyChecked ? "Delete selected" : "Select rows to delete"}
          >
            Delete Selected
          </Button>
        </div>
      </div>

      {/* --- List & Bulk Actions --- */}
      <Card
        title="Questions"
        right={
          <div className="hidden md:flex items-center gap-2">
            <label className="text-sm text-gray-600">
              Skill
              <select
                className="mt-1 mx-2 rounded-xl border px-3 py-2"
                value={skillId}
                onChange={async (e) => {
                  const sid = e.target.value;
                  setSkillId(sid);
                  setPage(1);
                  if (sid) {
                    const qz = await api.getQuizzesBySkill(sid);
                    setQuizzes(qz);
                    setQuizId(qz[0]?.id ? String(qz[0].id) : "");
                  } else {
                    setQuizzes([]);
                    setQuizId("");
                  }
                }}
              >
                <option value="">All</option>
                {skills.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
            </label>

            <label className="text-sm text-gray-600">
              Quiz
              <select
                className="mt-1 mx-2 rounded-xl border px-3 py-2"
                value={quizId}
                onChange={(e) => {
                  setQuizId(e.target.value);
                  setPage(1);
                }}
                disabled={!skillId}
              >
                <option value="">All</option>
                {quizzes.map((q) => (
                  <option key={q.id} value={q.id}>
                    {q.title}
                  </option>
                ))}
              </select>
            </label>

            <label className="text-sm text-gray-600">
              Sort
              <select
                className="mt-1 mx-2 rounded-xl border px-3 py-2"
                value={sort}
                onChange={(e) => setSort(e.target.value)}
              >
                <option value="createdAt">Created</option>
                <option value="question_text">Question</option>
                <option value="SkillId">Skill</option>
              </select>
            </label>

            <label className="text-sm text-gray-600">
              Dir
              <select
                className="mt-1 mx-2 rounded-xl border px-3 py-2"
                value={dir}
                onChange={(e) => setDir(e.target.value)}
              >
                <option value="DESC">DESC</option>
                <option value="ASC">ASC</option>
              </select>
            </label>

            <label className="text-sm text-gray-600">
              Page size
              <select
                className="mt-1 mx-2 rounded-xl border px-3 py-2"
                value={limit}
                onChange={(e) => {
                  setLimit(Number(e.target.value));
                  setPage(1);
                }}
              >
                <option value={5}>5</option>
                <option value={10}>10</option>
                <option value={20}>20</option>
                <option value={50}>50</option>
              </select>
            </label>

            <Button
              onClick={confirmBulkDelete}
              disabled={!anyChecked}
              className={
                anyChecked
                  ? "!bg-red-600 flex items-center gap-3 !text-white border-red-600"
                  : "!bg-gray-200 flex items-center gap-3 !text-gray-500 border-gray-200 cursor-not-allowed"
              }
              title={anyChecked ? "Delete selected" : "Select rows to delete"}
            >
              <Trash2 size={16} /> Bulk delete
            </Button>
          </div>
        }
      >
        {loading ? (
          <div className="text-gray-500">Loading…</div>
        ) : err ? (
          <div className="text-red-600">{err}</div>
        ) : rows.length === 0 ? (
          <div className="text-gray-500">No questions found.</div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead>
                  <tr className="text-left border-b">
                    <th className="py-2 px-3">
                      <input
                        type="checkbox"
                        checked={allChecked}
                        onChange={(e) => {
                          const ck = {};
                          rows.forEach((r) => (ck[r.id] = e.target.checked));
                          setChecked(ck);
                        }}
                      />
                    </th>
                    <th className="py-2 px-3">ID</th>
                    <th className="py-2 px-3">Question</th>
                    <th className="py-2 px-3">Skill</th>
                    <th className="py-2 px-3">Quiz</th>
                    <th className="py-2 px-3">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((r) => (
                    <tr key={r.id} className="border-b hover:bg-gray-50">
                      <td className="py-2 px-3">
                        <input
                          type="checkbox"
                          checked={!!checked[r.id]}
                          onChange={(e) =>
                            setChecked((c) => ({
                              ...c,
                              [r.id]: e.target.checked,
                            }))
                          }
                        />
                      </td>
                      <td className="py-2 px-3">{r.id}</td>
                      <td className="py-2 px-3">{r.question_text}</td>
                      <td className="py-2 px-3">
                        {r.Skill?.name ?? r.SkillId ?? "—"}
                      </td>
                      <td className="py-2 px-3">
                        {r.Quiz?.title ?? r.QuizId ?? "—"}
                      </td>
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
                            onClick={() => confirmDelete(r.id)}
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

            {/* Pager */}
            <div className="mt-3 flex items-center justify-between">
              <div className="text-sm text-gray-600">
                Showing {(rows.length && (page - 1) * limit + 1) || 0}–
                {(page - 1) * limit + rows.length} of {total}
              </div>
              <div className="flex gap-2">
                <Button
                  disabled={page <= 1}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                >
                  ← Prev
                </Button>
                <span className="px-2 py-1 flex justify-center items-center text-sm rounded-lg bg-gray-100">
                  Page {page} / {totalPages}
                </span>
                <Button
                  disabled={page >= totalPages}
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                >
                  Next →
                </Button>
              </div>
            </div>
          </>
        )}
      </Card>

      {/* --- Edit Modal --- */}
      {editing && editForm && (
        <div className="fixed inset-0 z-40 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/30" onClick={closeEdit} />
          <div className="relative z-50 w-full max-w-3xl rounded-2xl bg-white shadow-xl border p-5">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-lg font-semibold">
                Edit Question #{editing.id}
              </h3>
              <button
                onClick={closeEdit}
                className="p-2 rounded-xl hover:bg-gray-100"
              >
                <X size={18} />
              </button>
            </div>

            <div className="grid gap-3">
              {/* Skill & Quiz selectors in edit */}
              <div className="grid md:grid-cols-2 gap-3">
                <label className="text-sm text-gray-600">
                  Skill
                  <select
                    className="mt-1 w-full rounded-xl border px-3 py-2"
                    value={editForm.SkillId}
                    onChange={async (e) => {
                      const sid = e.target.value;
                      await onEditSkillChange(sid);
                    }}
                  >
                    <option value="">Select skill</option>
                    {skills.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="text-sm text-gray-600">
                  Quiz
                  <select
                    className="mt-1 w-full rounded-xl border px-3 py-2"
                    value={editForm.QuizId}
                    onChange={(e) =>
                      setEditForm((f) => ({
                        ...f,
                        QuizId: Number(e.target.value),
                      }))
                    }
                    disabled={!editForm.SkillId}
                  >
                    <option value="">Select quiz</option>
                    {editQuizzes.map((q) => (
                      <option key={q.id} value={q.id}>
                        {q.title}
                      </option>
                    ))}
                  </select>
                </label>
              </div>
              {(editErrs.SkillId || editErrs.QuizId) && (
                <div className="text-sm text-red-600">
                  {editErrs.SkillId || editErrs.QuizId}
                </div>
              )}

              <Input
                label="Question"
                value={editForm.question_text}
                onChange={(e) =>
                  setEditForm((f) => ({ ...f, question_text: e.target.value }))
                }
              />
              {editErrs.question_text && (
                <div className="text-sm text-red-600">
                  {editErrs.question_text}
                </div>
              )}

              <div className="grid gap-2">
                <div className="text-sm text-gray-600">
                  Options (pick one correct)
                </div>
                {editForm.options.map((o, i) => (
                  <div
                    key={i}
                    className="flex items-center gap-3 rounded-xl border px-3 py-2"
                  >
                    <input
                      type="radio"
                      name="correctOptionEdit"
                      className="h-4 w-4 mt-6"
                      checked={editCorrectIndex === i}
                      onChange={() => setEditCorrectIndex(i)}
                      title="Mark as correct"
                    />
                    <Input
                      label={`Option ${i + 1}`}
                      value={o}
                      onChange={(e) => editSetOpt(i, e.target.value)}
                      className="flex-1"
                    />
                    <Button
                      type="button"
                      onClick={() => editRemoveOpt(i)}
                      disabled={editForm.options.length <= MIN_OPTS}
                      className="!px-3"
                      title={
                        editForm.options.length <= MIN_OPTS
                          ? "Minimum 2 options"
                          : "Remove option"
                      }
                    >
                      <Trash2 size={16} />
                    </Button>
                  </div>
                ))}
                <div className="flex items-center justify-between">
                  <div className="text-xs text-gray-500">
                    {editForm.options.length} / {MAX_OPTS} options
                  </div>
                  <Button
                    type="button"
                    onClick={editAddOpt}
                    disabled={editForm.options.length >= MAX_OPTS}
                    className="!px-3"
                  >
                    <Plus size={16} /> Add option
                  </Button>
                </div>
                {(editErrs.options ||
                  editErrs.duplicate ||
                  editErrs.correct) && (
                  <div className="text-sm text-red-600">
                    {editErrs.options || editErrs.duplicate || editErrs.correct}
                  </div>
                )}
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <Button onClick={closeEdit}>Cancel</Button>
                <Button
                  onClick={saveEdit}
                  className="!bg-indigo-600 !text-white border-indigo-600"
                >
                  Save
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
