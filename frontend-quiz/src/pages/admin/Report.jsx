import { useEffect, useMemo, useState } from "react";
import Card from "../../components/ui/Card";
import DataTable from "../../components/ui/DataTable";
import Input from "../../components/ui/Input";
import Button from "../../components/ui/Button";
import api from "../../services/api";

// Simple tabs config
const TABS = [
  { key: "group", label: "Group Overview" },
  { key: "gaps", label: "Skill Gaps" },
  { key: "user", label: "User-wise" },
  { key: "trend", label: "Time Trend" },
];

export default function Reports() {
  const [active, setActive] = useState("group");

  // ----------------- GROUP OVERVIEW -----------------
  const [group, setGroup] = useState({ items: [], page: 1, limit: 10 });
  const [gPage, setGPage] = useState(1);
  const [gLimit, setGLimit] = useState(10);
  const [gOrderBy, setGOrderBy] = useState("avgScore");
  const [gDir, setGDir] = useState("DESC");
  const [gLoading, setGLoading] = useState(true);
  const [gErr, setGErr] = useState("");
  const [gFiltersOpen, setGFiltersOpen] = useState(false); // mobile filters toggle

  const fetchGroup = async () => {
    setGLoading(true);
    setGErr("");
    try {
      const res = await api.groupOverview({
        page: gPage,
        limit: gLimit,
        orderBy: gOrderBy,
        dir: gDir,
      });
      setGroup(res);
    } catch (e) {
      setGErr(e?.response?.data?.message || e.message);
    } finally {
      setGLoading(false);
    }
  };

  const gTotalPages = useMemo(
    () => gPage + (group.items.length < gLimit ? 0 : 1),
    [group.items.length, gPage, gLimit]
  );

  useEffect(() => {
    if (active === "group") fetchGroup();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active, gPage, gLimit, gOrderBy, gDir]);

  // ----------------- SKILL GAPS -----------------
  const [gaps, setGaps] = useState([]);
  const [minAnswers, setMinAnswers] = useState(5);
  const [gapsLoading, setGapsLoading] = useState(true);
  const [gapsErr, setGapsErr] = useState("");
  const [gapFiltersOpen, setGapFiltersOpen] = useState(false);

  const fetchGaps = async () => {
    setGapsLoading(true);
    setGapsErr("");
    try {
      const res = await api.groupSkillGaps({ minAnswers, limit: 100 });
      setGaps(res);
    } catch (e) {
      setGapsErr(e?.response?.data?.message || e.message);
    } finally {
      setGapsLoading(false);
    }
  };

  useEffect(() => {
    if (active === "gaps") fetchGaps();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active, minAnswers]);

  // ----------------- USER-WISE -----------------
  const [users, setUsers] = useState([]);
  const [userId, setUserId] = useState("");
  const [userOverview, setUserOverview] = useState(null);
  const [userSkills, setUserSkills] = useState([]);
  const [uMin, setUMin] = useState(1);
  const [uLoading, setULoading] = useState(false);
  const [uErr, setUErr] = useState("");
  const [userFiltersOpen, setUserFiltersOpen] = useState(false);

  const fetchUserPerf = async () => {
    if (!userId) {
      setUserOverview(null);
      setUserSkills([]);
      return;
    }
    setULoading(true);
    setUErr("");
    try {
      const [ov, sk] = await Promise.all([
        api.userOverview(userId),
        api.userSkillAccuracy(userId, uMin),
      ]);
      setUserOverview(ov);
      setUserSkills(sk.skills || []);
    } catch (e) {
      setUErr(e?.response?.data?.message || e.message);
    } finally {
      setULoading(false);
    }
  };

  useEffect(() => {
    if (active === "user") fetchUserPerf();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active, userId, uMin]);

  // preload users list (and skills for trend tab)
  const [skills, setSkills] = useState([]);
  useEffect(() => {
    (async () => {
      try {
        const [us, sks] = await Promise.all([api.getUsers(), api.getSkills()]);
        setUsers(us);
        setSkills(sks);
      } catch {
        // ignore
      }
    })();
  }, []);

  // ----------------- TIME TREND -----------------
  const [period, setPeriod] = useState("week");
  const [groupBy, setGroupBy] = useState("day");
  const [start, setStart] = useState("");
  const [end, setEnd] = useState("");
  const [trendSkillId, setTrendSkillId] = useState("");
  const [trend, setTrend] = useState({ points: [] });
  const [tLoading, setTLoading] = useState(true);
  const [tErr, setTErr] = useState("");
  const [trendFiltersOpen, setTrendFiltersOpen] = useState(false);

  const fetchTrend = async () => {
    setTLoading(true);
    setTErr("");
    try {
      let params;
      if (period === "custom" && start && end) {
        params = { start, end, groupBy, skillId: trendSkillId || undefined };
      } else {
        params = { period, groupBy, skillId: trendSkillId || undefined };
      }
      const res = await api.timeTrend(params);
      setTrend(res);
    } catch (e) {
      setTErr(e?.response?.data?.message || e.message);
    } finally {
      setTLoading(false);
    }
  };

  useEffect(() => {
    if (active === "trend") fetchTrend();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active, period, groupBy, start, end, trendSkillId]);

  // ----------------- UI -----------------
  return (
    <div className="space-y-6">
      {/* Tabs bar */}
      <div className="sticky top-0 z-10 bg-white/70 backdrop-blur supports-[backdrop-filter]:bg-white/50 border-b">
        <div className="flex overflow-x-auto no-scrollbar gap-2 px-1 py-2">
          {TABS.map((t) => (
            <button
              key={t.key}
              onClick={() => setActive(t.key)}
              className={`whitespace-nowrap rounded-full px-4 py-2 text-sm border transition
                ${
                  active === t.key
                    ? "bg-indigo-600 text-white border-indigo-600"
                    : "bg-white hover:bg-gray-50 text-gray-700 border-gray-200"
                }
              `}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* GROUP OVERVIEW TAB */}
      {active === "group" && (
        <Card
          title="Group Overview (with Best/Worst Skill)"
          right={
            <div className="hidden md:flex gap-2 items-end">
              <label className="text-sm text-gray-600">
                Order by
                <select
                  className="mt-1 ml-2 rounded-xl border px-3 py-2"
                  value={gOrderBy}
                  onChange={(e) => setGOrderBy(e.target.value)}
                >
                  <option value="avgScore">Avg Score</option>
                  <option value="attempts">Attempts</option>
                </select>
              </label>
              <label className="text-sm text-gray-600">
                Dir
                <select
                  className="mt-1 ml-2 rounded-xl border px-3 py-2"
                  value={gDir}
                  onChange={(e) => setGDir(e.target.value)}
                >
                  <option value="DESC">DESC</option>
                  <option value="ASC">ASC</option>
                </select>
              </label>
              <label className="text-sm text-gray-600">
                Page size
                <select
                  className="mt-1 ml-2 rounded-xl border px-3 py-2"
                  value={gLimit}
                  onChange={(e) => {
                    setGLimit(Number(e.target.value));
                    setGPage(1);
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
          {/* Mobile filters */}
          <div className="md:hidden mb-3">
            <Button
              onClick={() => setGFiltersOpen((v) => !v)}
              className="w-full flex items-center justify-center"
            >
              {gFiltersOpen ? "Hide Filters ▲" : "Show Filters ▼"}
            </Button>
            {gFiltersOpen && (
              <div className="grid gap-3 rounded-2xl border p-3 mt-2">
                <label className="text-sm text-gray-600">
                  Order by
                  <select
                    className="mt-1 w-full rounded-xl border px-3 py-2"
                    value={gOrderBy}
                    onChange={(e) => setGOrderBy(e.target.value)}
                  >
                    <option value="avgScore">Avg Score</option>
                    <option value="attempts">Attempts</option>
                  </select>
                </label>
                <label className="text-sm text-gray-600">
                  Dir
                  <select
                    className="mt-1 w-full rounded-xl border px-3 py-2"
                    value={gDir}
                    onChange={(e) => setGDir(e.target.value)}
                  >
                    <option value="DESC">DESC</option>
                    <option value="ASC">ASC</option>
                  </select>
                </label>
                <label className="text-sm text-gray-600">
                  Page size
                  <select
                    className="mt-1 w-full rounded-xl border px-3 py-2"
                    value={gLimit}
                    onChange={(e) => {
                      setGLimit(Number(e.target.value));
                      setGPage(1);
                    }}
                  >
                    <option value={5}>5</option>
                    <option value={10}>10</option>
                    <option value={20}>20</option>
                  </select>
                </label>
              </div>
            )}
          </div>

          {gLoading ? (
            <div className="text-gray-500">Loading…</div>
          ) : gErr ? (
            <div className="text-red-600">{gErr}</div>
          ) : (
            <>
              <DataTable
                columns={[
                  { header: "User", accessor: "name" },
                  { header: "Email", accessor: "email" },
                  { header: "Attempts", accessor: "attempts" },
                  { header: "Avg Score", accessor: "avgScore" },
                  { header: "Skills Covered", accessor: "skillsCovered" },
                  { header: "Best Skill", accessor: "bestSkillName" },
                  { header: "Best Acc (%)", accessor: "bestSkillAcc" },
                  { header: "Weakest Skill", accessor: "weakestSkillName" },
                  { header: "Weak Acc (%)", accessor: "weakestSkillAcc" },
                  { header: "Last Attempt", accessor: "lastAttemptAt" },
                ]}
                rows={group.items}
              />
              <div className="mt-3 flex items-center justify-between">
                <div className="text-sm text-gray-600">Page {gPage}</div>
                <div className="flex gap-2">
                  <Button
                    disabled={gPage <= 1}
                    onClick={() => setGPage((p) => Math.max(1, p - 1))}
                  >
                    ← Prev
                  </Button>
                  <Button
                    disabled={group.items.length < gLimit}
                    onClick={() => setGPage((p) => p + 1)}
                  >
                    Next →
                  </Button>
                </div>
              </div>
            </>
          )}
        </Card>
      )}

      {/* SKILL GAPS TAB */}
      {active === "gaps" && (
        <Card
          title="Skill Gap Identification"
          right={
            <div className="hidden md:flex gap-2 items-end">
              <label className="text-sm text-gray-600">
                Min answers/skill
                <select
                  className="mt-1 ml-2 rounded-xl border px-3 py-2"
                  value={minAnswers}
                  onChange={(e) => setMinAnswers(Number(e.target.value))}
                >
                  <option value={1}>1</option>
                  <option value={3}>3</option>
                  <option value={5}>5</option>
                  <option value={10}>10</option>
                </select>
              </label>
            </div>
          }
        >
          {/* Mobile filters */}
          <div className="md:hidden mb-3">
            <Button
              onClick={() => setGapFiltersOpen((v) => !v)}
              className="w-full flex items-center justify-center"
            >
              {gapFiltersOpen ? "Hide Filters ▲" : "Show Filters ▼"}
            </Button>
            {gapFiltersOpen && (
              <div className="grid gap-3 rounded-2xl border p-3 mt-2">
                <label className="text-sm text-gray-600">
                  Min answers/skill
                  <select
                    className="mt-1 w-full rounded-xl border px-3 py-2"
                    value={minAnswers}
                    onChange={(e) => setMinAnswers(Number(e.target.value))}
                  >
                    <option value={1}>1</option>
                    <option value={3}>3</option>
                    <option value={5}>5</option>
                    <option value={10}>10</option>
                  </select>
                </label>
              </div>
            )}
          </div>

          {gapsLoading ? (
            <div className="text-gray-500">Loading…</div>
          ) : gapsErr ? (
            <div className="text-red-600">{gapsErr}</div>
          ) : gaps.length === 0 ? (
            <div className="text-gray-500">No data yet.</div>
          ) : (
            <DataTable
              columns={[
                { header: "Skill", accessor: "skill" },
                { header: "Total Answers", accessor: "total" },
                { header: "Correct", accessor: "correct" },
                { header: "Avg Accuracy (%)", accessor: "avgAccuracy" },
                { header: "Users", accessor: "users" },
                { header: "Last Activity", accessor: "lastActivity" },
              ]}
              rows={gaps}
            />
          )}
        </Card>
      )}

      {/* USER-WISE TAB */}
      {active === "user" && (
        <Card
          title="User-wise Performance"
          right={
            <div className="hidden md:flex gap-2 items-end">
              <label className="text-sm text-gray-600">
                User
                <select
                  className="mt-1 ml-2 rounded-xl border px-3 py-2"
                  value={userId}
                  onChange={(e) => setUserId(e.target.value)}
                >
                  <option value="">Select user</option>
                  {users.map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.name} — {u.email}
                    </option>
                  ))}
                </select>
              </label>
              <label className="text-sm text-gray-600">
                Min attempts/skill
                <select
                  className="mt-1 ml-2 rounded-xl border px-3 py-2"
                  value={uMin}
                  onChange={(e) => setUMin(Number(e.target.value))}
                >
                  <option value={0}>0</option>
                  <option value={1}>1</option>
                  <option value={3}>3</option>
                </select>
              </label>
            </div>
          }
        >
          {/* Mobile filters */}
          <div className="md:hidden mb-3">
            <Button
              onClick={() => setUserFiltersOpen((v) => !v)}
              className="w-full flex items-center justify-center"
            >
              {userFiltersOpen ? "Hide Filters ▲" : "Show Filters ▼"}
            </Button>
            {userFiltersOpen && (
              <div className="grid gap-3 rounded-2xl border p-3 mt-2">
                <label className="text-sm text-gray-600">
                  User
                  <select
                    className="mt-1 w-full rounded-xl border px-3 py-2"
                    value={userId}
                    onChange={(e) => setUserId(e.target.value)}
                  >
                    <option value="">Select user</option>
                    {users.map((u) => (
                      <option key={u.id} value={u.id}>
                        {u.name} — {u.email}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="text-sm text-gray-600">
                  Min attempts/skill
                  <select
                    className="mt-1 w-full rounded-xl border px-3 py-2"
                    value={uMin}
                    onChange={(e) => setUMin(Number(e.target.value))}
                  >
                    <option value={0}>0</option>
                    <option value={1}>1</option>
                    <option value={3}>3</option>
                  </select>
                </label>
              </div>
            )}
          </div>

          {uLoading ? (
            <div className="text-gray-500">Loading…</div>
          ) : uErr ? (
            <div className="text-red-600">{uErr}</div>
          ) : !userId ? (
            <div className="text-gray-500">
              Pick a user to view performance.
            </div>
          ) : (
            <>
              {userOverview && (
                <div className="grid md:grid-cols-3 gap-3 mb-3">
                  <div className="rounded-xl border px-4 py-3">
                    <div className="text-sm text-gray-500">Total Attempts</div>
                    <div className="text-xl font-semibold">
                      {userOverview.totalAttempts}
                    </div>
                  </div>
                  <div className="rounded-xl border px-4 py-3">
                    <div className="text-sm text-gray-500">Avg Score</div>
                    <div className="text-xl font-semibold">
                      {userOverview.avgScore}
                    </div>
                  </div>
                  <div className="rounded-xl border px-4 py-3">
                    <div className="text-sm text-gray-500">Last Attempt</div>
                    <div className="text-sm">
                      {userOverview.lastAttemptAt
                        ? new Date(userOverview.lastAttemptAt).toLocaleString()
                        : "—"}
                    </div>
                  </div>
                </div>
              )}
              <DataTable
                columns={[
                  { header: "Skill", accessor: "skill" },
                  { header: "Total", accessor: "total" },
                  { header: "Correct", accessor: "correct" },
                  { header: "Accuracy (%)", accessor: "accuracy" },
                ]}
                rows={userSkills}
              />
            </>
          )}
        </Card>
      )}

      {/* TIME TREND TAB */}
      {active === "trend" && (
        <Card
          title="Time-based Reports"
          right={
            <div className="hidden md:flex gap-2 items-end">
              <label className="text-sm text-gray-600">
                Period
                <select
                  className="mt-1 ml-2 rounded-xl border px-3 py-2"
                  value={period}
                  onChange={(e) => setPeriod(e.target.value)}
                >
                  <option value="week">Last 7 days</option>
                  <option value="month">Last 30 days</option>
                  <option value="custom">Custom</option>
                </select>
              </label>
              <label className="text-sm text-gray-600">
                Group by
                <select
                  className="mt-1 ml-2 rounded-xl border px-3 py-2"
                  value={groupBy}
                  onChange={(e) => setGroupBy(e.target.value)}
                >
                  <option value="day">Day</option>
                  <option value="week">Week</option>
                </select>
              </label>
              <label className="text-sm text-gray-600">
                Skill
                <select
                  className="mt-1 ml-2 rounded-xl border px-3 py-2"
                  value={trendSkillId}
                  onChange={(e) => setTrendSkillId(e.target.value)}
                >
                  <option value="">All</option>
                  {skills.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name}
                    </option>
                  ))}
                </select>
              </label>
              {period === "custom" && (
                <>
                  <Input
                    label="Start"
                    type="date"
                    value={start}
                    onChange={(e) => setStart(e.target.value)}
                  />
                  <Input
                    label="End"
                    type="date"
                    value={end}
                    onChange={(e) => setEnd(e.target.value)}
                  />
                </>
              )}
              <Button onClick={fetchTrend}>Refresh</Button>
            </div>
          }
        >
          {/* Mobile filters */}
          <div className="md:hidden mb-3">
            <Button
              onClick={() => setTrendFiltersOpen((v) => !v)}
              className="w-full flex items-center justify-center"
            >
              {trendFiltersOpen ? "Hide Filters ▲" : "Show Filters ▼"}
            </Button>
            {trendFiltersOpen && (
              <div className="grid gap-3 rounded-2xl border p-3 mt-2">
                <label className="text-sm text-gray-600">
                  Period
                  <select
                    className="mt-1 w-full rounded-xl border px-3 py-2"
                    value={period}
                    onChange={(e) => setPeriod(e.target.value)}
                  >
                    <option value="week">Last 7 days</option>
                    <option value="month">Last 30 days</option>
                    <option value="custom">Custom</option>
                  </select>
                </label>
                <label className="text-sm text-gray-600">
                  Group by
                  <select
                    className="mt-1 w-full rounded-xl border px-3 py-2"
                    value={groupBy}
                    onChange={(e) => setGroupBy(e.target.value)}
                  >
                    <option value="day">Day</option>
                    <option value="week">Week</option>
                  </select>
                </label>
                <label className="text-sm text-gray-600">
                  Skill
                  <select
                    className="mt-1 w-full rounded-xl border px-3 py-2"
                    value={trendSkillId}
                    onChange={(e) => setTrendSkillId(e.target.value)}
                  >
                    <option value="">All</option>
                    {skills.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name}
                      </option>
                    ))}
                  </select>
                </label>
                {period === "custom" && (
                  <>
                    <Input
                      label="Start"
                      type="date"
                      value={start}
                      onChange={(e) => setStart(e.target.value)}
                    />
                    <Input
                      label="End"
                      type="date"
                      value={end}
                      onChange={(e) => setEnd(e.target.value)}
                    />
                  </>
                )}
                <Button onClick={fetchTrend}>Refresh</Button>
              </div>
            )}
          </div>

          {tLoading ? (
            <div className="text-gray-500">Loading…</div>
          ) : tErr ? (
            <div className="text-red-600">{tErr}</div>
          ) : (
            <>
              {/* Top stats row */}
              <div className="grid md:grid-cols-3 gap-3 mb-3">
                <div className="rounded-xl border px-4 py-3">
                  <div className="text-sm text-gray-500">Range</div>
                  <div className="text-sm">
                    {trend.start
                      ? new Date(trend.start).toLocaleDateString()
                      : "—"}{" "}
                    →{" "}
                    {trend.end ? new Date(trend.end).toLocaleDateString() : "—"}
                  </div>
                </div>

                <div className="rounded-xl border px-4 py-3">
                  <div className="text-sm text-gray-500">Buckets</div>
                  <div className="text-xl font-semibold">
                    {trend.points?.length || 0}
                  </div>
                </div>

                {trend.skillId ? (
                  <div className="rounded-xl border px-4 py-3">
                    <div className="text-sm text-gray-500">
                      Unique Users (this skill)
                    </div>
                    <div className="text-xl font-semibold">
                      {trend.usersAttemptedForSkill ?? 0}
                    </div>
                  </div>
                ) : (
                  <div className="rounded-xl border px-4 py-3">
                    <div className="text-sm text-gray-500">Grouping</div>
                    <div className="text-xl font-semibold uppercase">
                      {trend.groupBy}
                    </div>
                  </div>
                )}
              </div>

              {/* Trend table */}
              {trend.points?.length ? (
                <DataTable
                  columns={[
                    {
                      header: groupBy === "week" ? "Week" : "Date",
                      accessor: "bucket",
                    },
                    { header: "Attempts", accessor: "attempts" },
                    { header: "Avg Score", accessor: "avgScore" },
                  ]}
                  rows={trend.points}
                />
              ) : (
                <div className="text-gray-500">
                  No trend data for selected filters.
                </div>
              )}

              {/* Skills vs Unique Users table when no skill filter is applied */}
              {!trend.skillId && Array.isArray(trend.skillsUsers) && (
                <div className="mt-6">
                  <div className="mb-2 text-sm text-gray-600">
                    Unique users who attempted each skill in this period:
                  </div>
                  {trend.skillsUsers.length ? (
                    <DataTable
                      columns={[
                        { header: "Skill", accessor: "skill" },
                        { header: "Unique Users", accessor: "users" },
                      ]}
                      rows={trend.skillsUsers}
                    />
                  ) : (
                    <div className="text-gray-500">
                      No skill usage in this period.
                    </div>
                  )}
                </div>
              )}
            </>
          )}
        </Card>
      )}
    </div>
  );
}
