import { useState } from "react";
import { Outlet, useLocation } from "react-router-dom";
import Topbar from "./TopBar";
import SidebarLink from "./SidebarLink";
import { useAuth } from "../../context/AuthContext";
import {
  LayoutDashboard,
  FileQuestion,
  BarChart3,
  Users,
  Brain,
  ListChecks,
  FileBarChart,
  X,
} from "lucide-react";

export default function AppShell() {
  const { user } = useAuth();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const getPageTitle = (path) => {
    if (path === "/") return "Home";
    const parts = path.split("/").filter(Boolean);
    const last = parts[parts.length - 1];
    return last.charAt(0).toUpperCase() + last.slice(1).replace(/-/g, " ");
  };

  const pageTitle = getPageTitle(location.pathname);

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-[#fdfbfb] via-[#ebedee] to-[#dfe9f3] text-gray-800">
      {/* 🔝 Topbar */}
      <div className="sticky top-0 z-50 p-4">
        <Topbar onMenuClick={() => setSidebarOpen(true)} />
      </div>

      <div className="grid flex-1 h-full grid-cols-1 md:grid-cols-[260px_1fr] relative">
        {/* 🧭 Sidebar */}
        <aside className=" md:py-2 md:pl-4">
          <aside
            className={`fixed md:static top-0 left-0 h-full z-50 bg-white/90 backdrop-blur-md border-r border-gray-200 shadow-xl transform transition-transform duration-300 ease-in-out ${
              sidebarOpen ? "translate-x-0" : "-translate-x-full"
            } md:translate-x-0 md:flex flex-col w-64 p-4 space-y-2 rounded-none md:rounded-3xl`}
          >
            {/* ❌ Close button (mobile only) */}
            <div className="flex items-center justify-between md:hidden mb-4">
              <h2 className="text-lg font-semibold">Menu</h2>
              <button
                onClick={() => setSidebarOpen(false)}
                className="p-2 rounded-full hover:bg-gray-100"
              >
                <X size={20} />
              </button>
            </div>

            <div className="text-xs font-semibold uppercase tracking-wider text-gray-500 px-2 mb-2">
              Main
            </div>

            <SidebarLink
              to="/dashboard"
              label="Dashboard"
              icon={<LayoutDashboard size={18} />}
            />
            <SidebarLink
              to="/quiz"
              label="Take Quiz"
              icon={<FileQuestion size={18} />}
            />
            <SidebarLink
              to="/reports/analytics"
              label="My Reports"
              icon={<BarChart3 size={18} />}
            />

            {user?.role === "admin" && (
              <>
                <div className="text-xs font-semibold uppercase tracking-wider text-gray-500 px-2 pt-4">
                  Admin
                </div>
                <SidebarLink
                  to="/admin/users"
                  label="Users"
                  icon={<Users size={18} />}
                />
                <SidebarLink
                  to="/admin/skills"
                  label="Skills"
                  icon={<Brain size={18} />}
                />

                <SidebarLink
                  to="/admin/questions"
                  label="Questions"
                  icon={<ListChecks size={18} />}
                />
                <SidebarLink
                  to="/admin/reports"
                  label="Reports"
                  icon={<FileBarChart size={18} />}
                />
              </>
            )}
          </aside>
        </aside>

        {/* 🧩 Main Content */}
        <main className="relative h-full py-2 pl-6 md:pl-8 pr-4 w-full mx-auto">
          <div className="absolute inset-0 bg-gradient-to-br from-white/40 via-transparent to-white/10 rounded-3xl pointer-events-none"></div>

          <div className="relative z-10 rounded-3xl h-full bg-white/70 backdrop-blur-xl shadow-lg p-6 md:p-8">
            <h1 className="text-2xl md:text-3xl font-semibold bg-gradient-to-r from-indigo-600 to-purple-500 bg-clip-text text-transparent mb-6">
              {pageTitle}
            </h1>

            <Outlet />
          </div>
        </main>

        {/* 🕶 Overlay for mobile */}
        {sidebarOpen && (
          <div
            onClick={() => setSidebarOpen(false)}
            className="fixed inset-0 bg-black/30 backdrop-blur-sm z-40 md:hidden"
          />
        )}
      </div>
    </div>
  );
}
