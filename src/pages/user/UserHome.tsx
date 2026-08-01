import { useEffect, useMemo } from "react";
import { Link, useNavigate } from "react-router-dom";
import GlassCard from "../../components/ui/GlassCard";
import PrimaryButton from "../../components/ui/PrimaryButton";
import Avatar from "../../components/ui/Avatar";
import { StatusBadge } from "../../components/ui/Badge";
import StatCard from "../../components/ui/StatCard";
import Countdown from "../../components/ui/Countdown";
import {
  IconActivity,
  IconCalendar,
  IconChat,
  IconChevron,
  IconClock,
  IconDownload,
  IconFile,
  IconHeart,
  IconPlus,
  IconPrescription,
  IconSearch,
  IconVideo,
} from "../../components/ui/icons";
import { formatDateFa, relativeDay, shortDateFa, toFa } from "../../lib/utils";
import { useAuthStore } from "../../store/authStore";
import { useUserStore } from "../../store/userStore";
import { doctorName, getDoctor, prescriptions } from "../../data/apiData";
import type { Appointment } from "../../types";

export default function UserHome() {
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);
  const profile = useUserStore((s) => s.profile);
  const appointments = useUserStore((s) => s.appointments);
  const notifications = useUserStore((s) => s.notifications);
  const reports = useUserStore((s) => s.reports);
  const healthTips = useUserStore((s) => s.healthTips);
  const lastFetched = useUserStore((s) => s.lastFetched);
  const fetchAll = useUserStore((s) => s.fetchAll);

  useEffect(() => {
    if (!lastFetched || Date.now() - lastFetched > 60000) fetchAll();
  }, []);

  const mine = useMemo(
    () =>
      appointments
        .filter((a) => a.patientId === profile?.id)
        .sort(
          (a, b) =>
            a.date.localeCompare(b.date) || a.time.localeCompare(b.time),
        ),
    [appointments, profile],
  );
  const upcoming = mine.filter(
    (a) =>
      a.status === "waiting" ||
      a.status === "in-progress" ||
      a.status === "pending-payment" ||
      a.status === "pending-approval",
  );
  const completed = mine.filter((a) => a.status === "completed").length;
  const newMessages = notifications.filter((n) => !n.read).length;

  const nextAppt: Appointment | undefined = upcoming[0];
  const nextTarget = nextAppt ? `${nextAppt.date}T${nextAppt.time}:00` : null;

  const todayStr = new Date().toISOString().slice(0, 10);
  const todayAppts = upcoming.filter((a) => a.date === todayStr);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          title="نوبت‌های آینده"
          value={upcoming.length}
          delta="نوبت در انتظار ویزیت"
          trend="flat"
          tone="teal"
          icon={<IconCalendar />}
        />
        <StatCard
          title="ویزیت‌های انجام‌شده"
          value={completed}
          delta="کل ویزیت‌ها"
          trend="up"
          tone="blue"
          icon={<IconActivity />}
        />
        <StatCard
          title="پیام‌های جدید"
          value={newMessages}
          delta="از پزشکان"
          trend={newMessages > 0 ? "up" : "flat"}
          tone="violet"
          icon={<IconChat />}
        />
        <StatCard
          title="گزارش‌های پزشکی"
          value={reports.length}
          delta="فایل ذخیره شده"
          trend="flat"
          tone="rose"
          icon={<IconFile />}
        />
      </div>

      <GlassCard className="relative overflow-hidden p-6 sm:p-8">
        <div className="pointer-events-none absolute -left-10 -top-10 h-40 w-40 rounded-full bg-primary-300/40 blur-3xl" />
        <div className="relative flex flex-col items-start justify-between gap-5 md:flex-row md:items-center">
          <div className="max-w-lg">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-primary-100/70 px-3 py-1 text-xs font-medium text-primary-700">
              <IconHeart className="h-3.5 w-3.5" /> مشاوره آنلاین در کمتر از ۱۰
              دقیقه
            </span>
            <h2 className="mt-3 text-2xl font-bold text-ink-800">
              نیاز به مشاوره فوری دارید؟
            </h2>
            <p className="mt-2 text-sm leading-7 text-ink-500">
              بهترین پزشکان متخصص کشور در دسترس شما هستند. همین حالا جستجو کنید
              و نوبت بگیرید.
            </p>
          </div>
          <div className="flex shrink-0 gap-3">
            <Link to="/user/doctors">
              <PrimaryButton size="lg" icon={<IconSearch />}>
                جستجوی پزشک
              </PrimaryButton>
            </Link>
            <Link to="/user/appointments">
              <PrimaryButton size="lg" variant="ghost" icon={<IconPlus />}>
                نوبت جدید
              </PrimaryButton>
            </Link>
          </div>
        </div>
      </GlassCard>

      {nextAppt && nextTarget && (
        <GlassCard
          variant="soft"
          className="flex flex-col items-start justify-between gap-4 p-5 sm:flex-row sm:items-center"
        >
          <div className="flex items-center gap-4">
            <div className="grid h-12 w-12 place-items-center rounded-2xl bg-primary-500 text-white">
              <IconClock />
            </div>
            <div>
              <p className="text-xs text-ink-400">شمارش معکوس تا نوبت بعدی</p>
              <p className="font-bold text-ink-800">
                {doctorName(getDoctor(nextAppt.doctorId))} •{" "}
                <span className="tabular">{toFa(nextAppt.time)}</span>
              </p>
              <p className="text-xs text-ink-500">
                {relativeDay(nextAppt.date) || formatDateFa(nextAppt.date)}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <Countdown target={nextTarget} />
            <PrimaryButton
              size="sm"
              variant={nextAppt.consultType === "video" ? "primary" : "ghost"}
              icon={
                nextAppt.consultType === "video" ? (
                  <IconVideo className="h-4 w-4" />
                ) : (
                  <IconChat className="h-4 w-4" />
                )
              }
              onClick={() => navigate(`/user/consult/${nextAppt.id}`)}
            >
              شروع مشاوره
            </PrimaryButton>
          </div>
        </GlassCard>
      )}
      {/* 
      {todayAppts.length > 0 && (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {todayAppts.slice(0, 4).map((a) => {
            const doc = getDoctor(a.doctorId)
            return (
              <GlassCard key={a.id} hover className="flex items-center gap-3 p-4" onClick={() => navigate(`/user/consult/${a.id}`)}>
                <Avatar src={doc?.avatar} size="md" ring />
                <div className="min-w-0 flex-1">
                  <p className="truncate font-semibold text-ink-800">{doctorName(doc) || 'پزشک'}</p>
                  <p className="text-xs text-ink-400">{a.reason}</p>
                </div>
                <StatusBadge status={a.status} />
              </GlassCard>
            )
          })}
        </div>
      )} */}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <GlassCard className="p-6 lg:col-span-2">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h3 className="font-bold text-ink-800">نوبت‌های آینده</h3>
              <p className="text-xs text-ink-400">
                برنامه ویزیت‌های برنامه‌ریزی‌شده
              </p>
            </div>
            <Link
              to="/user/appointments"
              className="inline-flex items-center gap-1 text-sm font-medium text-primary-600 hover:underline"
            >
              مشاهده همه <IconChevron />
            </Link>
          </div>

          <div className="space-y-3">
            {upcoming.slice(0, 3).map((a) => {
              const doc = getDoctor(a.doctorId);
              const rel = relativeDay(a.date);
              const target = `${a.date}T${a.time}:00`;
              return (
                <div
                  key={a.id}
                  className="group flex flex-wrap items-center gap-4 rounded-2xl border border-white/50 bg-white/40 p-3 transition hover:bg-white/60 hover:cursor-pointer"
                  onClick={() => navigate(`/user/consult/${a.id}`)}
                >
                  <Avatar src={doc?.avatar} size="md" ring />
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="truncate font-semibold text-ink-800">
                        {doctorName(doc) || "پزشک"}
                      </p>
                      <StatusBadge status={a.status} />
                    </div>
                    <p className="truncate text-xs text-ink-400">
                      {doc?.hospital || ""} • {a.reason}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <Countdown target={target} compact />
                  </div>
                  <div className="text-left">
                    <p className="flex items-center justify-end gap-1 text-sm font-semibold text-ink-700 tabular">
                      <IconClock className="h-4 w-4 text-primary-500" />{" "}
                      {toFa(a.time)}
                    </p>
                    <p className="text-xs text-ink-400">
                      {rel || shortDateFa(a.date)}
                    </p>
                  </div>
                </div>
              );
            })}
            {upcoming.length === 0 && (
              <p className="py-8 text-center text-sm text-ink-400">
                نوبت آینده‌ای ندارید.
              </p>
            )}
          </div>
        </GlassCard>

        <GlassCard className="p-6">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="font-bold text-ink-800">پیام‌های اخیر</h3>
            {newMessages > 0 && (
              <span className="rounded-full bg-red-100 px-2 py-0.5 text-xs font-semibold text-red-600">
                {toFa(newMessages)} جدید
              </span>
            )}
          </div>
          <div className="space-y-3">
            {notifications.slice(0, 5).map((n) => (
              <div
                key={n.id}
                className="flex items-start gap-3 rounded-2xl border border-white/40 bg-white/40 p-3 transition hover:bg-white/60"
              >
                <div className="grid h-8 w-8 shrink-0 place-items-center rounded-xl bg-primary-50 text-primary-500">
                  <IconChat className="h-4 w-4" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-ink-800">
                    {n.title}
                  </p>
                  <p className="line-clamp-2 text-xs leading-5 text-ink-500">
                    {n.body}
                  </p>
                  <p className="mt-1 text-[10px] text-ink-400">
                    {relativeDay(n.createdAt.slice(0, 10)) ||
                      shortDateFa(n.createdAt)}
                  </p>
                </div>
                {!n.read && (
                  <span className="h-2 w-2 shrink-0 rounded-full bg-red-500" />
                )}
              </div>
            ))}
            {notifications.length === 0 && (
              <p className="py-6 text-center text-xs text-ink-400">
                پیامی وجود ندارد.
              </p>
            )}
          </div>
        </GlassCard>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <GlassCard className="p-6">
          <div className="mb-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <IconPrescription className="h-5 w-5 text-primary-500" />
              <h3 className="font-bold text-ink-800">نسخه‌های اخیر</h3>
            </div>
            <Link to="/user/appointments">
              <PrimaryButton size="sm" variant="ghost">
                مشاهده همه
              </PrimaryButton>
            </Link>
          </div>
          <div className="space-y-3">
            {prescriptions
              .filter((p) => p.patientId === (profile?.id || ""))
              .slice(0, 5)
              .map((rx) => {
                const doc = getDoctor(rx.doctorId);
                return (
                  <div
                    key={rx.id}
                    className="rounded-2xl border border-white/50 bg-white/40 p-3 transition hover:bg-white/60"
                  >
                    <div className="flex items-center justify-between mb-1">
                      <p className="text-xs font-semibold text-ink-700">
                        {doctorName(doc) || "پزشک"}
                      </p>
                      <p className="text-[10px] text-ink-400 tabular">
                        {shortDateFa(rx.createdAt)}
                      </p>
                    </div>
                    <div className="space-y-1">
                      {rx.items.map((item, i) => (
                        <p key={i} className="text-xs text-ink-600">
                          💊 {item.drug} — {item.usage}
                        </p>
                      ))}
                    </div>
                  </div>
                );
              })}
            {prescriptions.filter((p) => p.patientId === (profile?.id || ""))
              .length === 0 && (
              <p className="py-6 text-center text-sm text-ink-400">
                برای مشاهده نسخه‌ها به صفحه نوبت‌ها مراجعه کنید.
              </p>
            )}
          </div>
        </GlassCard>

        <GlassCard className="p-6">
          <div className="mb-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <IconActivity className="h-5 w-5 text-primary-500" />
              <h3 className="font-bold text-ink-800">گزارش‌های پزشکی</h3>
            </div>
            <Link to="/user/profile">
              <PrimaryButton size="sm" variant="ghost">
                مدیریت گزارش‌ها
              </PrimaryButton>
            </Link>
          </div>
          <div className="space-y-3">
            {reports.length > 0 ? (
              reports.slice(0, 5).map((r) => (
                <div
                  key={r.id}
                  className="flex items-center gap-3 rounded-2xl border border-white/50 bg-white/40 p-3 transition hover:bg-white/60"
                >
                  <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-white/70 text-xs font-bold text-primary-600">
                    {r.type?.toUpperCase() || "PDF"}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-ink-800">
                      {r.name}
                    </p>
                    <p className="truncate text-xs text-ink-400">
                      <span className="tabular">
                        {shortDateFa(r.uploadedAt)}
                      </span>
                    </p>
                  </div>
                  {r.url && (
                    <a
                      href={r.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="grid h-8 w-8 place-items-center rounded-lg text-ink-400 transition hover:bg-primary-50 hover:text-primary-600"
                    >
                      <IconDownload className="h-4 w-4" />
                    </a>
                  )}
                </div>
              ))
            ) : (
              <p className="py-4 text-center text-xs text-ink-400">
                گزارشی ثبت نشده است.
              </p>
            )}
          </div>
        </GlassCard>
      </div>

      <div>
        <div className="mb-3 flex items-center justify-between">
          <div>
            <h3 className="font-bold text-ink-800">نکات سلامتی روزانه</h3>
            <p className="text-xs text-ink-400">
              توصیه‌های کوتاه برای زندگی سالم‌تر
            </p>
          </div>
        </div>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          {healthTips.map((t) => (
            <GlassCard key={t.id} variant="soft" hover className="p-5">
              <div className="flex items-center gap-3">
                <div className="grid h-12 w-12 place-items-center rounded-2xl bg-white/70 text-2xl">
                  {t.icon || "💡"}
                </div>
                <div>
                  <p className="font-bold text-ink-800">{t.title}</p>
                  <p className="mt-0.5 text-xs leading-5 text-ink-500">
                    {t.text}
                  </p>
                </div>
              </div>
            </GlassCard>
          ))}
        </div>
      </div>
    </div>
  );
}
