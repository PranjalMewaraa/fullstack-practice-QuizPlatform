import { Link, useLocation } from "react-router-dom";

export default function SidebarLink({ to, label, icon }) {
  const loc = useLocation();
  const active = loc.pathname === to;

  return (
    <Link
      to={to}
      className={`flex items-center gap-3 px-4 py-2 rounded-xl transition-all duration-300 
        ${
          active
            ? "bg-gradient-to-r from-indigo-500/10 to-indigo-500/5 text-indigo-600 font-semibold shadow-sm"
            : "hover:bg-gradient-to-r hover:from-gray-100/60 hover:to-gray-50/50 text-gray-700"
        }`}
    >
      {icon && (
        <span
          className={`transition-transform duration-300 ${
            active
              ? "text-indigo-600 scale-110"
              : "text-gray-500 group-hover:text-indigo-600"
          }`}
        >
          {icon}
        </span>
      )}
      <span className="tracking-wide">{label}</span>
    </Link>
  );
}
