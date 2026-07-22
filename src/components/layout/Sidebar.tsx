import { NavLink } from "react-router-dom";
import { cn } from "../../lib/utils";
import { useAuthStore } from "../../store/authStore";
import { navFor, roleLabel } from "./nav";
import { IconLogout } from "../ui/icons";
import Avatar from "../ui/Avatar";
import type { Role } from "../../types";

interface Props {
  role: Role;
  onNavigate?: () => void;
}

export default function Sidebar({ role, onNavigate }: Props) {
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);
  const items = navFor[role];

  return (
    <aside className="glass flex h-full w-72 flex-col rounded-3xl p-5">
      {/* Brand */}
      <div className="flex items-center gap-3 px-2 py-3">
        <div className="grid h-11 w-11 place-items-center rounded-2xl bg-gradient-to-br from-primary-400 to-primary-700 text-white shadow-glass-sm">
          <span className="text-xl font-black">🧑🏻‍⚕️</span>
        </div>
        <div>
          <p className="text-lg font-extrabold leading-tight text-ink-800">
            اول دکتر
          </p>
          <p className="text-xs text-ink-400">{roleLabel[role]}</p>
        </div>
      </div>

      {/* Nav */}
      <nav className="mt-4 flex-1 space-y-1.5">
        {items.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.to === `/${role}`}
            onClick={onNavigate}
            className={({ isActive }) =>
              cn(
                "group flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-medium transition-all",
                isActive
                  ? "bg-primary-500 text-white shadow-glass-sm"
                  : "text-ink-600 hover:bg-white/60 hover:text-primary-700",
              )
            }
          >
            <span className="shrink-0">{item.icon}</span>
            {item.label}
          </NavLink>
        ))}
      </nav>

      {/* User box */}
      <div className="mt-4 rounded-2xl border border-white/40 bg-white/40 p-3 backdrop-blur-md">
        <div className="flex items-center gap-3">
          <Avatar src={user?.avatar || ""} size="sm" ring />
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold text-ink-800">
              {user?.name}
            </p>
            <p className="truncate text-xs text-ink-400">{roleLabel[role]}</p>
          </div>
          <button
            onClick={logout}
            className="grid h-8 w-8 shrink-0 place-items-center rounded-lg text-ink-400 transition hover:bg-red-50 hover:text-red-500"
            title="خروج"
          >
            <IconLogout />
          </button>
        </div>
      </div>
    </aside>
  );
}
