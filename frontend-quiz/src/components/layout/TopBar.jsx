import { Menu } from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import logo from "../../assets/logo.svg";

export default function Topbar({ onMenuClick }) {
  const { user, logout } = useAuth();

  return (
    <div className="h-20 shadow-md rounded-2xl bg-white flex items-center justify-between px-4 md:px-8">
      <div className="flex items-center gap-3">
        {/* 📱 Hamburger for mobile */}
        <button
          onClick={onMenuClick}
          className="md:hidden p-2 rounded-lg border border-gray-200 hover:bg-gray-100 transition"
        >
          <Menu size={20} />
        </button>

        {/* 🧩 Logo */}
        <img src={logo} alt="Logo" className="h-10" />
      </div>

      {/* 👤 User Info */}
      <div className="flex items-center gap-3">
        <span className="hidden md:flex text-sm text-gray-600">
          {user?.name}{" "}
          <span className="px-2 py-0.5 text-xs rounded bg-gray-100 border ml-2">
            {user?.role}
          </span>
        </span>
        <button
          onClick={logout}
          className="px-3 py-1.5 rounded-xl border bg-red-50 border-red-200 text-red-600 hover:bg-red-100 transition"
        >
          Logout
        </button>
      </div>
    </div>
  );
}
