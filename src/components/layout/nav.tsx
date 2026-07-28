import type { Role } from "../../types";
import {
  IconActivity,
  IconCalendar,
  IconChat,
  IconCog,
  IconHome,
  IconLog,
  IconSearch,
  IconSettings,
  IconShield,
  IconStethoscope,
  IconUser,
  IconUsers,
  IconWallet,
} from "../ui/icons";

export interface NavItem {
  label: string;
  to: string;
  icon: React.ReactNode;
}

export const navFor: Record<Role, NavItem[]> = {
  user: [
    { label: "خانه", to: "/user", icon: <IconHome /> },
    { label: "جستجوی پزشک", to: "/user/doctors", icon: <IconSearch /> },
    { label: "چت", to: "/user/consult", icon: <IconChat /> },
    { label: "نوبت‌های من", to: "/user/appointments", icon: <IconCalendar /> },
    { label: "پروفایل", to: "/user/profile", icon: <IconUser /> },
  ],
  doctor: [
    { label: "نمای کلی", to: "/doctor", icon: <IconHome /> },
    { label: "نوبت‌ها", to: "/doctor/appointments", icon: <IconCalendar /> },
    { label: "چت", to: "/doctor/consult", icon: <IconChat /> },
    { label: "بیماران", to: "/doctor/patients", icon: <IconUsers /> },
    { label: "پروفایل", to: "/doctor/profile", icon: <IconUser /> },
  ],
  admin: [
    { label: "نمای کلی", to: "/admin", icon: <IconActivity /> },
    { label: "مدیریت پزشکان", to: "/admin/doctors", icon: <IconStethoscope /> },
    { label: "مدیریت کاربران", to: "/admin/users", icon: <IconUsers /> },
    { label: "تعاریف", to: "/admin/definitions", icon: <IconShield /> },
    { label: "چت", to: "/admin/consult", icon: <IconChat /> },
    { label: "لاگ", to: "/admin/logs", icon: <IconLog /> },
    { label: "برداشت‌ها", to: "/admin/withdrawals", icon: <IconWallet /> },
    { label: "تنظیمات", to: "/admin/settings", icon: <IconSettings /> },
  ],
};

export const roleLabel: Record<Role, string> = {
  user: "پنل کاربر",
  doctor: "پنل پزشک",
  admin: "پنل مدیریت",
};
