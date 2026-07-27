import { useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import GlassCard from '../../components/ui/GlassCard'
import PrimaryButton from '../../components/ui/PrimaryButton'
import Avatar from '../../components/ui/Avatar'
import { StatusBadge } from '../../components/ui/Badge'
import StatCard from '../../components/ui/StatCard'
import Countdown from '../../components/ui/Countdown'
import {
  IconActivity,
  IconCalendar,
  IconChat,
  IconChevron,
  IconClock,
  IconDownload,
  IconHeart,
  IconPin,
  IconPlus,
  IconPrescription,
  IconSearch,
  IconUpload,
  IconVideo,
} from '../../components/ui/icons'
import {
  appointments,
  doctors,
  getDoctor,
  prescriptions,
} from '../../data/mockData'
import { formatDateFa, relativeDay, shortDateFa, toFa } from '../../lib/utils'

const ME = 'pat-1'

const tips = [
  {
    icon: '💧',
    title: 'روزانه ۸ لیوان آب',
    desc: 'هیدراته نگه‌داشتن بدن به عملکرد بهتر قلب کمک می‌کند.',
  },
  {
    icon: '🚶',
    title: '۳۰ دقیقه پیاده‌روی',
    desc: 'فعالیت سبک روزانه، فشار خون را تنظیم می‌کند.',
  },
  {
    icon: '😴',
    title: 'خواب کافی',
    desc: '۷ تا ۸ ساعت خواب، رمز سلامت سیستم ایمنی است.',
  },
]

export default function UserHome() {
  const navigate = useNavigate()
  const mine = appointments
    .filter((a) => a.patientId === ME)
    .sort((a, b) => a.date.localeCompare(b.date))
  const upcoming = mine.filter(
    (a) => a.status === 'waiting' || a.status === 'in-progress',
  )
  const completed = mine.filter((a) => a.status === 'completed').length
  const myPrescriptions = prescriptions.filter((p) => p.patientId === ME)

  const nextAppt = upcoming[0]
  const nextTarget = nextAppt ? `${nextAppt.date}T${nextAppt.time}:00` : null

  const [pendingReports, setPendingReports] = useState<{ name: string; saved: boolean }[]>([])
  const reportInputRef = useRef<HTMLInputElement>(null)

  const handleReportSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setPendingReports(prev => [...prev, { name: file.name, saved: false }])
    e.target.value = ''
  }

  const saveReport = (idx: number) => {
    setPendingReports(prev => prev.map((r, i) => i === idx ? { ...r, saved: true } : r))
  }

  return (
    <div className="space-y-6">
      {/* Stats */}
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
          delta="در ۳۰ روز گذشته"
          trend="up"
          tone="blue"
          icon={<IconActivity />}
        />
        <StatCard
          title="پیام‌های جدید"
          value={2}
          delta="از پزشکان"
          trend="up"
          tone="violet"
          icon={<IconChat />}
        />
        <StatCard
          title="امتیاز سلامتی"
          value="۸۲٪"
          delta="روند رو به رشد"
          trend="up"
          tone="rose"
          icon={<IconHeart />}
        />
      </div>

      {/* Hero CTA */}
      <GlassCard className="relative overflow-hidden p-6 sm:p-8">
        <div className="pointer-events-none absolute -left-10 -top-10 h-40 w-40 rounded-full bg-primary-300/40 blur-3xl" />
        <div className="relative flex flex-col items-start justify-between gap-5 md:flex-row md:items-center">
          <div className="max-w-lg">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-primary-100/70 px-3 py-1 text-xs font-medium text-primary-700">
              <IconHeart className="h-3.5 w-3.5" /> مشاوره آنلاین در کمتر از ۱۰ دقیقه
            </span>
            <h2 className="mt-3 text-2xl font-bold text-ink-800">
              نیاز به مشاوره فوری دارید؟
            </h2>
            <p className="mt-2 text-sm leading-7 text-ink-500">
              بهترین پزشکان متخصص کشور در دسترس شما هستند. همین حالا جستجو کنید و نوبت
              بگیرید.
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

      {/* Next appointment with countdown */}
      {nextAppt && nextTarget && (
        <GlassCard variant="soft" className="flex flex-col items-start justify-between gap-4 p-5 sm:flex-row sm:items-center">
          <div className="flex items-center gap-4">
            <div className="grid h-12 w-12 place-items-center rounded-2xl bg-primary-500 text-white">
              <IconClock />
            </div>
            <div>
              <p className="text-xs text-ink-400">شمارش معکوس تا نوبت بعدی</p>
              <p className="font-bold text-ink-800">
                {getDoctor(nextAppt.doctorId)?.name} •{' '}
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
              variant={nextAppt.consultType === 'video' ? 'primary' : 'ghost'}
              icon={
                nextAppt.consultType === 'video' ? <IconVideo className="h-4 w-4" /> : <IconChat className="h-4 w-4" />
              }
              onClick={() => navigate(`/doctor/consult/${nextAppt.id}`)}
            >
              شروع مشاوره
            </PrimaryButton>
          </div>
        </GlassCard>
      )}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Upcoming appointments */}
        <GlassCard className="p-6 lg:col-span-2">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h3 className="font-bold text-ink-800">نوبت‌های آینده</h3>
              <p className="text-xs text-ink-400">برنامه ویزیت‌های برنامه‌ریزی‌شده</p>
            </div>
            <Link
              to="/user/appointments"
              className="inline-flex items-center gap-1 text-sm font-medium text-primary-600 hover:underline"
            >
              مشاهده همه <IconChevron className="h-4 w-4" />
            </Link>
          </div>

          <div className="space-y-3">
            {upcoming.slice(0, 3).map((a) => {
              const doc = getDoctor(a.doctorId)!
              const rel = relativeDay(a.date)
              const target = `${a.date}T${a.time}:00`
              return (
                <div
                  key={a.id}
                  className="group flex flex-wrap items-center gap-4 rounded-2xl border border-white/50 bg-white/40 p-3 transition hover:bg-white/60"
                >
                  <Avatar src={doc.avatar} size="md" ring />
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="truncate font-semibold text-ink-800">{doc.name}</p>
                      <StatusBadge status={a.status} />
                    </div>
                    <p className="truncate text-xs text-ink-400">
                      {doc.hospital} • {a.reason}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <Countdown target={target} compact />
                  </div>
                  <div className="text-left">
                    <p className="flex items-center justify-end gap-1 text-sm font-semibold text-ink-700 tabular">
                      <IconClock className="h-4 w-4 text-primary-500" /> {toFa(a.time)}
                    </p>
                    <p className="text-xs text-ink-400">{rel || shortDateFa(a.date)}</p>
                  </div>
                </div>
              )
            })}
            {upcoming.length === 0 && (
              <p className="py-8 text-center text-sm text-ink-400">
                نوبت آینده‌ای ندارید.
              </p>
            )}
          </div>
        </GlassCard>

        {/* Messages */}
        <GlassCard className="p-6">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="font-bold text-ink-800">پیام‌های اخیر</h3>
            <span className="rounded-full bg-red-100 px-2 py-0.5 text-xs font-semibold text-red-600">
              {toFa(2)} جدید
            </span>
          </div>
          <div className="space-y-3">
            {[
              {
                doc: doctors[0],
                text: 'نسخه شما آماده شد. لطفاً داروها را طبق دستور مصرف کنید.',
                time: '۱۰ دقیقه پیش',
              },
              {
                doc: doctors[7],
                text: 'جلسه مشاوره فردا ساعت ۱۵:۰۰ برگزار می‌شود.',
                time: '۲ ساعت پیش',
              },
              {
                doc: doctors[2],
                text: 'نتیجه آزمایش شما طبیعی بود. نگران نباشید.',
                time: 'دیروز',
              },
            ].map((m, i) => (
              <div
                key={i}
                className="flex items-start gap-3 rounded-2xl border border-white/40 bg-white/40 p-3 transition hover:bg-white/60"
              >
                <Avatar src={m.doc.avatar} size="sm" />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-ink-800">{m.doc.name}</p>
                  <p className="line-clamp-2 text-xs leading-5 text-ink-500">{m.text}</p>
                  <p className="mt-1 text-[10px] text-ink-400">{m.time}</p>
                </div>
              </div>
            ))}
          </div>
        </GlassCard>
      </div>

      {/* Prescriptions & reports */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <GlassCard className="p-6">
          <div className="mb-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <IconPrescription className="h-5 w-5 text-primary-500" />
              <h3 className="font-bold text-ink-800">نسخه‌های اخیر</h3>
            </div>
            <span className="rounded-full bg-primary-50 px-2 py-0.5 text-xs font-semibold text-primary-700">
              {toFa(myPrescriptions.length)} نسخه
            </span>
          </div>
          <div className="space-y-3">
            {myPrescriptions.length ? (
              myPrescriptions.map((rx) => (
                <div
                  key={rx.id}
                  className="rounded-2xl border border-primary-200/60 bg-primary-50/50 p-4"
                >
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-semibold text-ink-800">
                      نسخه {getDoctor(rx.doctorId)?.name}
                    </p>
                    <span className="text-xs text-ink-400">{shortDateFa(rx.createdAt)}</span>
                  </div>
                  <ul className="mt-2 space-y-1 text-xs text-ink-600">
                    {rx.items.map((it, i) => (
                      <li key={i} className="flex items-center gap-2">
                        <span className="h-1 w-1 rounded-full bg-primary-400" />
                        {it.drug} — <span className="text-ink-400">{it.usage}</span>
                      </li>
                    ))}
                  </ul>
                  <div className="mt-3 flex gap-2">
                    <PrimaryButton size="sm" variant="ghost" icon={<IconDownload className="h-4 w-4" />}>
                      دانلود
                    </PrimaryButton>
                  </div>
                </div>
              ))
            ) : (
              <p className="py-6 text-center text-sm text-ink-400">نسخه‌ای ثبت نشده است.</p>
            )}
          </div>
        </GlassCard>

        {/* Medical reports */}
        <GlassCard className="p-6">
          <div className="mb-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <IconActivity className="h-5 w-5 text-primary-500" />
              <h3 className="font-bold text-ink-800">گزارش‌های پزشکی</h3>
            </div>
            <input ref={reportInputRef} type="file" className="hidden" onChange={handleReportSelect} accept=".pdf,.jpg,.png,.doc,.docx" />
            <PrimaryButton size="sm" variant="ghost" icon={<IconPlus className="h-4 w-4" />} onClick={() => reportInputRef.current?.click()}>
              افزودن گزارش پزشکی
            </PrimaryButton>
          </div>
          <div className="space-y-3">
            {[
              { name: 'آزمایش خون کامل', doc: 'آزمایشگاه پارسیان', date: '۱۴۰۳/۰۹/۱۰', type: 'PDF' },
              { name: 'نوار قلب (ECG)', doc: 'بیمارستان دی', date: '۱۴۰۳/۰۹/۰۵', type: 'JPG' },
              { name: 'سونوگرافی قلب', doc: 'مرکز تصویربرداری نور', date: '۱۴۰۳/۰۸/۲۸', type: 'PDF' },
            ].map((r, i) => (
              <div
                key={i}
                className="flex items-center gap-3 rounded-2xl border border-white/50 bg-white/40 p-3 transition hover:bg-white/60"
              >
                <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-white/70 text-xs font-bold text-primary-600">
                  {r.type}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-ink-800">{r.name}</p>
                  <p className="truncate text-xs text-ink-400">
                    {r.doc} • <span className="tabular">{r.date}</span>
                  </p>
                </div>
                <button className="grid h-8 w-8 place-items-center rounded-lg text-ink-400 transition hover:bg-primary-50 hover:text-primary-600">
                  <IconDownload className="h-4 w-4" />
                </button>
              </div>
            ))}
            {pendingReports.map((r, idx) => (
              <div
                key={idx}
                className="flex items-center gap-3 rounded-2xl border border-dashed border-primary-300/60 bg-primary-50/40 p-3 transition"
              >
                <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-white/70 text-primary-600">
                  <IconUpload className="h-5 w-5" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-ink-800">{r.name}</p>
                  <p className="text-xs text-ink-400">آماده ذخیره</p>
                </div>
                <PrimaryButton
                  size="sm"
                  disabled={r.saved}
                  onClick={() => saveReport(idx)}
                >
                  {r.saved ? 'ذخیره شد' : 'ذخیره'}
                </PrimaryButton>
              </div>
            ))}
          </div>
        </GlassCard>
      </div>

      {/* Health tips */}
      <div>
        <div className="mb-3 flex items-center justify-between">
          <div>
            <h3 className="font-bold text-ink-800">نکات سلامتی روزانه</h3>
            <p className="text-xs text-ink-400">توصیه‌های کوتاه برای زندگی سالم‌تر</p>
          </div>
        </div>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          {tips.map((t) => (
            <GlassCard key={t.title} variant="soft" hover className="p-5">
              <div className="flex items-center gap-3">
                <div className="grid h-12 w-12 place-items-center rounded-2xl bg-white/70 text-2xl">
                  {t.icon}
                </div>
                <div>
                  <p className="font-bold text-ink-800">{t.title}</p>
                  <p className="mt-0.5 text-xs leading-5 text-ink-500">{t.desc}</p>
                </div>
              </div>
            </GlassCard>
          ))}
        </div>
      </div>
    </div>
  )
}
