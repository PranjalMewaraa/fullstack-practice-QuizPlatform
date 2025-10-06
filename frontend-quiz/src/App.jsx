import { Routes, Route, Navigate } from "react-router-dom";
import AppShell from "./components/layout/AppShell";

import Login from "./pages/Login";
import Register from "./pages/Register";
import Dashboard from "./pages/Dashboard";
import Quiz from "./pages/Quiz";

import Users from "./pages/admin/Users";
import Skills from "./pages/admin/Skills";

import ProtectedRoute from "./routes/protectedRoutes";
import AdminRoute from "./routes/AdminRoutes";
import MyReports from "./pages/MyReport";
import Questions from "./pages/admin/Question";
import Reports from "./pages/admin/Report";
import SkillSelect from "./pages/quiz/SkillSelect";
import SkillQuiz from "./pages/quiz/SkillQuiz";
import QuizPlayer from "./pages/quiz/QuizPlayer";
import QuizList from "./pages/quiz/QuizList";
import Quizzes from "./pages/admin/Quizes";

export default function App() {
  return (
    <Routes>
      {/* Public */}
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />

      {/* Protected (wrap AppShell for layout) */}
      <Route
        element={
          <ProtectedRoute>
            <AppShell />
          </ProtectedRoute>
        }
      >
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="/dashboard" element={<Dashboard />} />

        <Route path="/reports/analytics" element={<MyReports />} />
        <Route path="/quiz" element={<SkillSelect />} />
        <Route path="/quiz/:skillId" element={<SkillQuiz />} />
        <Route path="/skills/:skillId/quizzes" element={<QuizList />} />
        <Route path="/quizzes/:quizId/play" element={<QuizPlayer />} />
        {/* Admin */}
        <Route element={<AdminRoute />}>
          <Route path="/admin/users" element={<Users />} />
          <Route path="/admin/skills" element={<Skills />} />
          <Route path="/admin/questions" element={<Questions />} />
          <Route path="/admin/reports" element={<Reports />} />
          <Route path="/admin/:skill/:skillId/quizes" element={<Quizzes />} />
        </Route>
      </Route>

      {/* 404 */}
      <Route path="*" element={<div className="p-8">Not Found</div>} />
    </Routes>
  );
}
