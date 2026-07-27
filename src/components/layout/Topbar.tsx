import { useState } from "react";
import Avatar from "../ui/Avatar";
import { IconBell, IconMenu, IconSearch } from "../ui/icons";
import { useAuthStore } from "../../store/authStore";
import { roleLabel } from "./nav";
import type { Role } from "../../types";
import { Link, NavLink } from "react-router-dom";
import { cn } from "@/lib/utils";
import { Moon, Palette, Sun } from "lucide-react";
import { Tooltip, TooltipContent, TooltipTrigger } from "../ui/tooltip";
import { useTheme } from "../../lib/theme";

interface Props {
  role: Role;
  title: string;
  subtitle?: string;
  onMenu?: () => void;
}

export default function Topbar({ role, title, subtitle, onMenu }: Props) {
  const user = useAuthStore((s) => s.user);
  const [open, setOpen] = useState(false);
  const { mode, accent, toggleMode, cycleAccent } = useTheme();

  return (
    <header className="glass sticky top-6 z-20 mb-6 flex items-center gap-2 rounded-2xl px-3 py-3.5 sm:gap-4 sm:px-5">
      {/* <button
        className="grid h-9 w-9 place-items-center rounded-lg text-ink-500 hover:bg-white/60 hidden"
        onClick={onMenu}
        aria-label="منو"
      >
        <IconMenu />
      </button> */}

      <div className="min-w-0 flex-1">
        <h1 className="truncate text-lg font-bold text-ink-800 sm:text-xl">
          {title}
        </h1>
        {subtitle && (
          <p className="truncate text-xs text-ink-400">{subtitle}</p>
        )}
      </div>

      {/* Search (decorative on small screens) */}
      <div className="hidden md:block">
        <div className="glass-soft flex w-72 items-center gap-2 rounded-xl px-3 py-2">
          <span className="text-ink-400">
            <IconSearch />
          </span>
          <input
            placeholder="جستجو…"
            className="w-full bg-transparent text-sm text-ink-700 placeholder:text-ink-400 outline-none"
          />
        </div>
      </div>

      <Tooltip>
        <TooltipTrigger asChild>
          <button
            type="button"
            onClick={toggleMode}
            className="glass-soft relative grid h-10 w-10 shrink-0 place-items-center rounded-xl text-ink-600 transition hover:bg-white/70"
            aria-label={mode === "dark" ? "فعال‌کردن حالت روشن" : "فعال‌کردن حالت تاریک"}
          >
            {mode === "dark" ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
          </button>
        </TooltipTrigger>
        <TooltipContent>
          {mode === "dark" ? "حالت روشن" : "حالت تاریک"}
        </TooltipContent>
      </Tooltip>

      <Tooltip>
        <TooltipTrigger asChild>
          <button
            type="button"
            onClick={cycleAccent}
            className="glass-soft relative grid h-10 w-10 shrink-0 place-items-center rounded-xl text-primary-600 transition hover:bg-white/70"
            aria-label={`تغییر رنگ اصلی؛ رنگ فعلی ${accent}`}
          >
            <Palette className="h-5 w-5" />
            <span className="absolute bottom-1.5 right-1.5 h-2 w-2 rounded-full bg-primary-500 ring-1 ring-white" />
          </button>
        </TooltipTrigger>
        <TooltipContent>تغییر رنگ اصلی</TooltipContent>
      </Tooltip>

      {/* Notifications */}
      <div className="relative">
        <button
          onClick={() => setOpen((v) => !v)}
          className="glass-soft relative grid h-10 w-10 place-items-center rounded-xl text-ink-600 transition hover:bg-white/70"
          aria-label="اعلان‌ها"
        >
          <IconBell />
          <span className="absolute right-2.5 top-2.5 h-2 w-2 rounded-full bg-red-500 ring-2 ring-white" />
        </button>
        {open && (
          <div className="glass-soft bg-white/90 absolute left-0 mt-2 w-72 animate-pop-in rounded-2xl p-3">
            <p className="px-1 pb-2 text-xs font-semibold text-ink-500">
              اعلان‌های اخیر
            </p>
            {[
              "نوبت شما فردا ساعت ۱۷:۰۰ است",
              "پزشک پاسخ پیام شما را داد",
              "نسخه جدید برای شما صادر شد",
            ].map((t, i) => (
              <div
                key={i}
                className="rounded-xl px-2 py-2 text-sm text-ink-700 hover:bg-primary-200/60 hover:cursor-pointer"
              >
                {t}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Profile chip */}
      <Link
        to={`/${role}/profile`}
        className="flex items-center gap-2.5 rounded-xl border border-white/40 bg-white/40 py-1.5 pe-3 ps-1.5 backdrop-blur-md hover:border-white/60 transition-all"
      >
        <Avatar src={user?.avatar || ""} size="xs" ring />
        <div className="hidden sm:block">
          <p className="text-xs font-semibold leading-tight text-ink-800">
            {user?.name}
          </p>
          <p className="text-[10px] text-ink-400">{roleLabel[role]}</p>
        </div>
      </Link>
    </header>
  );
}
