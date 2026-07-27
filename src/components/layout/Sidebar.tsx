import { useEffect, useMemo, useState } from "react";
import { NavLink } from "react-router-dom";
import { Player } from "@lottiefiles/react-lottie-player";
import { cn } from "../../lib/utils";
import { useAuthStore } from "../../store/authStore";
import { navFor, roleLabel } from "./nav";
import { IconLogout } from "../ui/icons";
import Avatar from "../ui/Avatar";
import type { Role } from "../../types";
import spinnerRaw from "../../assets/HealthTap-Spinner.json";

function toStr(v: number) { return v.toFixed(4) }

function buildSpinner() {
  const html = document.documentElement;
  const style = getComputedStyle(html);
  const isDark = html.classList.contains("dark");

  const p500 = style.getPropertyValue("--color-primary-500").trim().split(" ").map(Number);
  let light: number[];
  if (isDark) {
    light = [16, 21, 27]; // ink-900
  } else {
    light = style.getPropertyValue("--color-primary-50").trim().split(" ").map(Number);
  }

  return JSON.parse(
    JSON.stringify(spinnerRaw)
      .replace(/1,0,0,1(?=\])/g, `${toStr(p500[0] / 255)},${toStr(p500[1] / 255)},${toStr(p500[2] / 255)},1`)
      .replace(
        /1,0.995999983245,0.995999983245,1(?=\])/g,
        `${toStr(light[0] / 255)},${toStr(light[1] / 255)},${toStr(light[2] / 255)},1`,
      ),
  );
}

interface Props {
  role: Role;
  onNavigate?: () => void;
}

export default function Sidebar({ role, onNavigate }: Props) {
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);
  const items = navFor[role];
  const [themeVer, setThemeVer] = useState(0);

  useEffect(() => {
    const html = document.documentElement;
    const observer = new MutationObserver(() => setThemeVer((v) => v + 1));
    observer.observe(html, { attributes: true, attributeFilter: ["data-accent", "class"] });
    return () => observer.disconnect();
  }, []);

  const spinnerSrc = useMemo(() => buildSpinner(), [themeVer]);

  return (
    <aside className="glass flex h-full w-72 flex-col rounded-3xl p-5">
      {/* Brand */}
      <div className="flex items-center gap-3 px-2 py-3">
        <div className="grid h-20 w-20 place-items-center ">
          <Player
            src={spinnerSrc}
            loop
            autoplay
            className="h-full w-full"
          />
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
