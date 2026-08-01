import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Avatar from "../ui/Avatar";
import { IconBell, IconMenu, IconSearch } from "../ui/icons";
import { useAuthStore } from "../../store/authStore";
import { roleLabel } from "./nav";
import type { Role } from "../../types";
import { Link, NavLink } from "react-router-dom";
import { cn } from "../../lib/utils";
import { CheckCheck, Moon, Palette, Sun } from "lucide-react";
import { Tooltip, TooltipContent, TooltipTrigger } from "../ui/tooltip";
import { useTheme } from "../../lib/theme";
import { api } from "../../lib/api";
import type { UserNotification } from "../../types";

interface Props {
  role: Role;
  title: string;
  subtitle?: string;
  onMenu?: () => void;
}

export default function Topbar({ role, title, subtitle, onMenu }: Props) {
  const user = useAuthStore((s) => s.user);
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState<UserNotification[]>([]);
  const notificationRef = useRef<HTMLDivElement>(null);
  const { mode, accent, toggleMode, cycleAccent } = useTheme();
  const unreadCount = useMemo(
    () => notifications.filter((notification) => !notification.read).length,
    [notifications],
  );

  const fetchNotifications = useCallback(async () => {
    try {
      const response = await api.get<UserNotification[] | { results: UserNotification[] }>("/notifications/");
      setNotifications("results" in response ? response.results : response);
    } catch {
      // Authentication refresh is handled by apiRequest; keep the last successful list on transient failures.
    }
  }, []);

  useEffect(() => {
    fetchNotifications();
    const interval = window.setInterval(fetchNotifications, 30000);
    const onFocus = () => fetchNotifications();
    window.addEventListener("focus", onFocus);
    return () => {
      window.clearInterval(interval);
      window.removeEventListener("focus", onFocus);
    };
  }, [fetchNotifications]);

  useEffect(() => {
    const onPointerDown = (event: MouseEvent) => {
      if (!notificationRef.current?.contains(event.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onPointerDown);
    return () => document.removeEventListener("mousedown", onPointerDown);
  }, []);

  const markAllRead = async () => {
    const unread = notifications.filter((notification) => !notification.read);
    if (!unread.length) return;
    setNotifications((items) => items.map((item) => ({ ...item, read: true })));
    try {
      await api.post("/notifications/mark-all-read/");
    } catch {
      fetchNotifications();
    }
  };

  const openNotification = async (notification: UserNotification) => {
    if (!notification.read) {
      setNotifications((items) =>
        items.map((item) => item.id === notification.id ? { ...item, read: true } : item),
      );
      try {
        await api.post("/notifications/mark-read/", { ids: [notification.id] });
      } catch {
        fetchNotifications();
      }
    }
    setOpen(false);
  };

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
      <div className="relative" ref={notificationRef}>
        <button
          onClick={() => setOpen((v) => !v)}
          className="glass-soft relative grid h-10 w-10 place-items-center rounded-xl text-ink-600 transition hover:bg-white/70"
          aria-label="اعلان‌ها"
        >
          <IconBell />
          {unreadCount > 0 && (
            <span className="absolute -right-1 -top-1 grid min-h-5 min-w-5 place-items-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white ring-2 ring-white">
              {unreadCount > 9 ? "۹+" : unreadCount.toLocaleString("fa-IR")}
            </span>
          )}
        </button>
        {open && (
          <div className="glass-soft absolute left-0 mt-2 w-[min(22rem,calc(100vw-2rem))] animate-pop-in overflow-hidden rounded-lg border border-white/60 bg-white/95 shadow-xl">
            <div className="flex items-center justify-between border-b border-ink-100 px-3 py-3">
              <div>
                <p className="text-sm font-bold text-ink-800">اعلان‌ها</p>
                <p className="text-[11px] text-ink-400">{unreadCount.toLocaleString("fa-IR")} خوانده‌نشده</p>
              </div>
              <button type="button" onClick={markAllRead} disabled={!unreadCount} className="grid h-8 w-8 place-items-center rounded-md text-primary-600 transition hover:bg-primary-50 disabled:opacity-40" title="خواندن همه">
                <CheckCheck className="h-4 w-4" />
              </button>
            </div>
            <div className="max-h-96 overflow-y-auto p-2">
              {notifications.slice(0, 12).map((notification) => (
                <button
                  type="button"
                  key={notification.id}
                  onClick={() => openNotification(notification)}
                  className={cn(
                    "relative block w-full rounded-md px-3 py-2.5 text-right transition hover:bg-primary-50",
                    !notification.read && "bg-primary-50/70",
                  )}
                >
                  {!notification.read && <span className="absolute right-1.5 top-4 h-2 w-2 rounded-full bg-primary-500" />}
                  <p className="pr-2 text-sm font-semibold text-ink-800">{notification.title}</p>
                  {notification.body && <p className="mt-1 pr-2 text-xs leading-5 text-ink-500">{notification.body}</p>}
                  <p className="mt-1 pr-2 text-[10px] text-ink-400">
                    {new Intl.DateTimeFormat("fa-IR", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" }).format(new Date(notification.createdAt))}
                  </p>
                </button>
              ))}
              {!notifications.length && (
                <p className="px-3 py-8 text-center text-sm text-ink-400">اعلان جدیدی وجود ندارد.</p>
              )}
            </div>
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
