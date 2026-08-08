import { useCallback, useState } from "react";
import { Outlet, useLocation } from "react-router-dom";
import Sidebar from "./Sidebar";
import Topbar from "./Topbar";
import MobileBottomNav from "./MobileBottomNav";
import PushSetup from "../PushSetup";
import type { Role } from "../../types";
import { useBackendData } from "../../data/apiData";
import { useAuthStore } from "../../store/authStore";

const greetings: Record<Role, string> = {
  user: "سلام",
  doctor: "سلام",
  admin: "سلام",
};

const subtitles: Record<Role, string> = {
  user: "امروز چه کمکی از ما ساخته است؟",
  doctor: "برنامه امروز شما آماده است",
  admin: "نمای کلی سیستم اول دکتر",
};

const titles: Record<string, { title: string; subtitle?: string }> = {
  "/user": {
    title: "داشبورد",
    subtitle: "امروز چه کمکی از ما ساخته است؟",
  },
  "/doctor": {
    title: "داشبورد",
    subtitle: "برنامه امروز شما آماده است",
  },
  "/user/doctors": {
    title: "جستجوی پزشک",
    subtitle: "بهترین متخصص‌ها را پیدا کنید",
  },
  "/user/book": {
    title: "دریافت نوبت",
    subtitle: "روز و ساعت مناسب خود را انتخاب کنید",
  },
  "/user/appointments": {
    title: "نوبت‌های من",
    subtitle: "مدیریت نوبت‌های قبلی و آینده",
  },
  "/user/profile": {
    title: "پروفایل",
    subtitle: "اطلاعات حساب کاربری و پرونده",
  },
  "/user/consult": { title: "اتاق مشاوره", subtitle: "گفتگو با پزشک" },
  "/doctor/appointments": {
    title: "نوبت‌ها",
    subtitle: "لیست بیماران و زمان نوبت‌ها",
  },
  "/doctor/consult": {
    title: "اتاق مشاوره",
    subtitle: "گفتگو با بیمار و صدور نسخه",
  },
  "/doctor/patients": {
    title: "مدیریت بیماران",
    subtitle: "پرونده و سوابق بیماران شما",
  },
  "/doctor/profile": {
    title: "پروفایل حرفه‌ای",
    subtitle: "تنظیمات کاری و تخصص",
  },
  "/admin": { title: "داشبورد مدیریت", subtitle: "نمای کلی سیستم اول‌دکتر" },
  "/admin/doctors": {
    title: "مدیریت پزشکان",
    subtitle: "تأیید، تعلیق و مدیریت پزشکان",
  },
  "/admin/users": { title: "مدیریت کاربران", subtitle: "حساب‌های بیماران" },
  "/admin/definitions": {
    title: "تعاریف سیستم",
    subtitle: "مدیریت تخصص‌ها، تشخیص‌ها، داروها و ...",
  },
  "/admin/logs": { title: "لاگ نوبت‌ها", subtitle: "سوابق و گزارش فعالیت‌ها" },
  "/admin/withdrawals": {
    title: "درخواست‌های برداشت",
    subtitle: "مدیریت تسویه پزشکان",
  },
  "/admin/settings": { title: "تنظیمات سیستم", subtitle: "پیکربندی پلتفرم" },
};

interface Props {
  role: Role;
}

export default function DashboardLayout({ role }: Props) {
  const backendVersion = useBackendData(role);
  const user = useAuthStore((s) => s.user);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(
    () => localStorage.getItem("sidebar-collapsed") === "1",
  );
  const toggleSidebar = useCallback(() => {
    setSidebarCollapsed((collapsed) => {
      localStorage.setItem("sidebar-collapsed", collapsed ? "0" : "1");
      return !collapsed;
    });
  }, []);
  const { pathname } = useLocation();

  // Match the longest prefix we know about (handles nested routes like /user/book/:id)
  const key =
    Object.keys(titles)
      .filter((k) => pathname.startsWith(k))
      .sort((a, b) => b.length - a.length)[0] || `/${role}`;

  const meta = titles[key] || titles[`/${role}`];
  const title =
    key === `/${role}`
      ? `${greetings[role]}${user?.name ? `، ${user.name.split(" ")[0]}` : ""} 👋`
      : meta.title;
  const subtitle =
    key === `/${role}` ? meta.subtitle || subtitles[role] : meta.subtitle;

  return (
    <div className="flex min-h-screen gap-5 p-4 lg:p-6">
      <PushSetup />
      {/* Sidebar (desktop) */}
      <div className="sticky top-6 hidden h-[calc(100vh-3rem)] shrink-0 lg:block">
        <Sidebar
          role={role}
          collapsed={sidebarCollapsed}
          onToggle={toggleSidebar}
        />
      </div>


      {/* Main */}
      <main className="flex min-w-0 flex-1 flex-col">
        <Topbar
          role={role}
          title={title}
          subtitle={subtitle}
          onMenu={() => setMobileOpen(true)}
        />
        <div className="flex-1 animate-fade-in pb-20 lg:pb-0 ">
          <Outlet key={`${role}-${backendVersion}`} />
        </div>
      </main>

      {/* Mobile bottom navbar */}
      <MobileBottomNav role={role} />
    </div>
  );
}
