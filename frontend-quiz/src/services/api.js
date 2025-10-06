// src/lib/api.js
import axios from "axios";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE || "http://localhost:8000",
});

// ---- Auth header handling ----
let jwt = "";
api.setToken = (t) => {
  jwt = t || "";
  if (jwt) {
    api.defaults.headers.common.Authorization = `Bearer ${jwt}`;
  } else {
    delete api.defaults.headers.common.Authorization;
  }
};
api.clearToken = () => api.setToken("");

// Ensure header applied for any already-created instance
api.interceptors.request.use((cfg) => {
  if (jwt) cfg.headers.Authorization = `Bearer ${jwt}`;
  return cfg;
});

// ---- Helper to build query strings safely ----
const qs = (obj = {}) => {
  const p = new URLSearchParams();
  Object.entries(obj).forEach(([k, v]) => {
    if (v === undefined || v === null || v === "") return;
    p.set(k, String(v));
  });
  const s = p.toString();
  return s ? `?${s}` : "";
};

export default {
  // token utils
  setToken: api.setToken,
  clearToken: api.clearToken,

  // ---------- AUTH ----------
  register: (data) => api.post("/api/auth/register", data).then((r) => r.data),
  login: (data) => api.post("/api/auth/login", data).then((r) => r.data),

  // ---------- SKILLS ----------
  getSkills: () => api.get("/api/skills").then((r) => r.data),
  createSkill: (d) => api.post("/api/skills", d).then((r) => r.data),

  // ---------- QUESTIONS ----------
  /**
   * Backend: GET /api/questions
   * Supports pagination + optional filters.
   * Params:
   *  - page=1, limit=20, sort="createdAt", dir="DESC"
   *  - q (search in question_text)
   *  - skillId (filter by skill)
   */
  // services/api.js
  getAttemptsByUser: (
    userId,
    { page = 1, limit = 20, withAnswers = false, quizId } = {}
  ) =>
    api
      .get(`/api/quiz/attempts/${userId}`, {
        params: { page, limit, withAnswers, quizId },
      })
      .then((r) => r.data),

  getQuizzesBySkill: (skillId) =>
    api.get(`/api/skills/${skillId}/quizzes`).then((r) => r.data),
  createQuiz: (skillId, d) =>
    api.post(`/api/skills/${skillId}/quizzes`, d).then((r) => r.data),
  getQuiz: (quizId) => api.get(`/api/quizzes/${quizId}`).then((r) => r.data),
  updateQuiz: (quizId, d) =>
    api.put(`/api/quizzes/${quizId}`, d).then((r) => r.data),
  deleteQuiz: (quizId) =>
    api.delete(`/api/quizzes/${quizId}`).then((r) => r.data),
  getQuestions: ({
    page = 1,
    limit = 20,
    sort = "createdAt",
    dir = "DESC",
    q,
    skillId,
  } = {}) =>
    api
      .get(`/api/questions${qs({ page, limit, sort, dir, q, skillId })}`)
      .then((r) => r.data),

  /**
   * Backend: GET /api/questions/skill/:skillId
   * Params:
   *  - page=1, limit=20, shuffle=false
   * NOTE: This endpoint (by default) hides correct_answer for non-admins.
   */
  getQuestionsBySkill: (
    skillId,
    { page = 1, limit = 20, shuffle = false } = {}
  ) =>
    api
      .get(`/api/questions/skill/${skillId}${qs({ page, limit, shuffle })}`)
      .then((r) => r.data),

  createQuestion: (d) => api.post("/api/questions", d).then((r) => r.data),

  // ---------- QUIZ ----------
  submitQuiz: (d) => api.post("/api/quiz/submit", d).then((r) => r.data),

  // ---------- REPORTS ----------
  userOverview: (id) => api.get(`/api/reports/user/${id}`).then((r) => r.data),
  userSkillAccuracy: (id, min = 0) =>
    api
      .get(`/api/reports/user/${id}/skills${qs({ minAttempts: min })}`)
      .then((r) => r.data),
  groupSkillGaps: (params = { minAnswers: 5, limit: 100 }) =>
    api.get(`/api/reports/skills/gaps${qs(params)}`).then((r) => r.data),
  updateQuestion: (id, data) =>
    api.put(`/api/questions/${id}`, data).then((r) => r.data),
  deleteQuestion: (id) =>
    api.delete(`/api/questions/${id}`).then((r) => r.data),
  bulkDeleteQuestions: (ids) =>
    api.delete(`/api/questions`, { data: { ids } }).then((r) => r.data),
  // services/api.js
  updateSkill: (id, data) =>
    api.put(`/api/skills/${id}`, data).then((r) => r.data),
  deleteSkill: (id, params = {}) =>
    api.delete(`/api/skills/${id}`, { params }).then((r) => r.data),
  // Users (admin)

  updateUser: (id, data) =>
    api.put(`/api/users/${id}`, data).then((r) => r.data),
  deleteUser: (id) => api.delete(`/api/users/${id}`).then((r) => r.data),

  timeTrend: (
    params = { period: "week", groupBy: "day", skillId: undefined }
  ) => api.get(`/api/reports/time${qs(params)}`).then((r) => r.data),
  groupOverview: (params = { page: 1, limit: 10, orderBy: "avgScore" }) =>
    api.get(`/api/reports/group${qs(params)}`).then((r) => r.data),
  // services/api.js (ensure this exists)
  skillLeaderboard: (skillId, { minAnswers = 3, limit = 20 } = {}) =>
    api
      .get(`/api/reports/skill/${skillId}/leaderboard`, {
        params: { minAnswers, limit },
      })
      .then((r) => r.data),

  getUsers: () => api.get("/api/users").then((r) => r.data),
};
