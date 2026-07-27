import { Link } from 'react-router-dom'
import GlassCard from '../../components/ui/GlassCard'
import Avatar from '../../components/ui/Avatar'
import PrimaryButton from '../../components/ui/PrimaryButton'
import StatCard from '../../components/ui/StatCard'
import ChartCard from '../../components/ui/ChartCard'
import { StatusBadge } from '../../components/ui/Badge'
import EmptyState from '../../components/ui/EmptyState'
import {
  IconActivity,
  IconCalendar,
  IconChat,
  IconChevron,
  IconClock,
  IconWallet,
  IconUsers,
} from '../../components/ui/icons'
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { appointments, doctorEarnings, getPatient } from '../../data/mockData'
import { formatDateFa, formatToman, toFa } from '../../lib/utils'

const ME = 'doc-1'
const primaryChartColor = 'rgb(var(--color-primary-500))'
const chartGridColor = 'rgb(148 163 184 / 0.24)'
const chartAxisColor = '#94a3b8'

export default function DoctorOverview() {
  const mine = appointments.filter((a) => a.doctorId === ME)
  const today = mine.filter((a) => a.status === 'in-progress' || a.status === 'waiting')
  const pending = today.filter((a) => a.status === 'waiting')
  const monthTotal = mine.length
  const earningsDelta = Math.round(
    ((doctorEarnings.thisMonth - doctorEarnings.lastMonth) / doctorEarnings.lastMonth) * 100,
  )

  return (
    <div className="space-y-6">
      {/* KPIs */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          title="نوبت‌های امروز"
          value={today.length}
          delta={`${pending.length} در انتظار شروع`}
          trend="up"
          tone="teal"
          icon={<IconCalendar />}
        />
        <StatCard
          title="درخواست‌های در انتظار"
          value={pending.length}
          delta="نیازمند بررسی"
          trend="flat"
          tone="amber"
          icon={<IconClock />}
        />
        <StatCard
          title="بیماران این ماه"
          value={monthTotal}
          delta="۱۲٪ نسبت به ماه قبل"
          trend="up"
          tone="blue"
          icon={<IconUsers />}
        />
        <StatCard
          title="میانگین امتیاز"
          value="۴.۹"
          delta="بر اساس ۳۱۸ نظر"
          trend="up"
          tone="violet"
          icon={<IconActivity />}
        />
      </div>

      {/* Earnings summary */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <GlassCard className="bg-gradient-to-br from-primary-500 to-primary-700 p-6 text-white lg:col-span-1">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="grid h-10 w-10 place-items-center rounded-xl bg-white/20 backdrop-blur-md">
                <IconWallet />
              </div>
              <p className="font-semibold">درآمد این ماه</p>
            </div>
            <span className={`rounded-full px-2 py-0.5 text-xs font-bold ${earningsDelta >= 0 ? 'bg-emerald-400/30' : 'bg-red-400/30'}`}>
              {earningsDelta >= 0 ? '+' : ''}{toFa(earningsDelta)}٪
            </span>
          </div>
          <p className="mt-4 text-3xl font-bold tabular">{formatToman(doctorEarnings.thisMonth)}</p>
          <div className="mt-5 grid grid-cols-2 gap-3 border-t border-white/20 pt-4 text-sm">
            <div>
              <p className="text-white/70 text-xs">قابل برداشت</p>
              <p className="font-semibold tabular">{formatToman(doctorEarnings.pending).replace(' تومان', '')}</p>
            </div>
            <div>
              <p className="text-white/70 text-xs">برداشت‌شده</p>
              <p className="font-semibold tabular">{formatToman(doctorEarnings.withdrawn).replace(' تومان', '')}</p>
            </div>
          </div>
          <PrimaryButton
            variant="ghost"
            className="mt-4 w-full !bg-white/20 !text-white hover:!bg-white/30"
          >
            درخواست برداشت
          </PrimaryButton>
        </GlassCard>

        {/* Earnings chart */}
        <ChartCard
          title="درآمد هفتگی"
          subtitle="۴ هفته اخیر (میلیون تومان)"
          className="lg:col-span-2"
        >
          <div className="h-56" dir="ltr">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={doctorEarnings.weekly} margin={{ top: 8, right: 8, bottom: 0, left: -16 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={chartGridColor} vertical={false} />
                <XAxis dataKey="week" tick={{ fontSize: 12, fontFamily: 'Vazirmatn' }} stroke={chartAxisColor} />
                <YAxis tick={{ fontSize: 11 }} stroke={chartAxisColor} tickFormatter={(v) => toFa(v / 1000000)} />
                <Tooltip
                  cursor={{ fill: 'rgb(var(--color-primary-500) / 0.12)' }}
                  formatter={(v) => [formatToman(Number(v)), 'درآمد']}
                  contentStyle={{
                    borderRadius: 12,
                    border: '1px solid rgb(var(--color-primary-300) / 0.35)',
                    backgroundColor: 'rgb(15 23 42 / 0.96)',
                    color: '#f8fafc',
                    fontFamily: 'Vazirmatn',
                    fontSize: 12,
                  }}
                />
                <Bar dataKey="amount" fill={primaryChartColor} radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </ChartCard>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Today's schedule */}
        <GlassCard className="p-6 lg:col-span-2">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h3 className="font-bold text-ink-800">برنامه امروز</h3>
              <p className="text-xs text-ink-400">{formatDateFa(new Date().toISOString())}</p>
            </div>
            <Link
              to="/doctor/appointments"
              className="inline-flex items-center gap-1 text-sm font-medium text-primary-600 hover:underline"
            >
              همه نوبت‌ها <IconChevron className="h-4 w-4" />
            </Link>
          </div>

          <div className="space-y-3">
            {today.map((a) => {
              const pat = getPatient(a.patientId)!
              return (
                <div
                  key={a.id}
                  className="flex items-center gap-4 rounded-2xl border border-white/50 bg-white/40 p-3"
                >
                  <div className="flex w-16 shrink-0 flex-col items-center">
                    <span className="text-sm font-bold text-primary-700 tabular">
                      {toFa(a.time)}
                    </span>
                    <span className="text-[10px] text-ink-400">دقیقه ۳۰</span>
                  </div>
                  <div className="h-10 w-px bg-white/60" />
                  <Avatar src={pat.avatar} size="sm" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-semibold text-ink-800">{pat.name}</p>
                    <p className="truncate text-xs text-ink-400">{a.reason}</p>
                  </div>
                  <StatusBadge status={a.status} />
                  <Link to={`/doctor/consult/${a.id}`}>
                    <PrimaryButton size="sm" variant="ghost" icon={<IconChat className="h-4 w-4" />}>
                      شروع
                    </PrimaryButton>
                  </Link>
                </div>
              )
            })}
            {today.length === 0 && (
              <EmptyState
                icon={<IconCalendar />}
                title="نوبتی برای امروز ثبت نشده"
                description="وقتی بیماری نوبت بگیرد اینجا نمایش داده می‌شود."
              />
            )}
          </div>
        </GlassCard>

        {/* New visits (sorted by createdAt, newest first) */}
        <div className="space-y-6">
          <GlassCard className="p-6">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="font-bold text-ink-800">ویزیت‌های جدید</h3>
              <span className="rounded-full bg-primary-100 px-2 py-0.5 text-xs font-semibold text-primary-700">
                {toFa(mine.length)} ویزیت
              </span>
            </div>
            <div className="space-y-3">
              {[...mine]
                .sort((a, b) => {
                  const ta = a.createdAt || a.date
                  const tb = b.createdAt || b.date
                  return ta < tb ? 1 : -1
                })
                .slice(0, 6)
                .map((a) => {
                const pat = getPatient(a.patientId)!
                return (
                  <div
                    key={a.id}
                    className="rounded-2xl border border-white/50 bg-white/40 p-3"
                  >
                    <div className="flex items-center gap-3">
                      <Avatar src={pat.avatar} size="sm" />
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-semibold text-ink-800">{pat.name}</p>
                        <p className="text-[11px] text-ink-400">
                          {formatDateFa(a.date)} • {toFa(a.time)} • {a.reason}
                        </p>
                      </div>
                      <StatusBadge status={a.status} />
                    </div>
                  </div>
                )
              })}
              {mine.length === 0 && (
                <p className="py-6 text-center text-sm text-ink-400">ویزیتی ثبت نشده است.</p>
              )}
            </div>
          </GlassCard>

          {/* Follow-up reminders */}
          <GlassCard className="p-6">
            <h3 className="mb-3 font-bold text-ink-800">یادآوری پیگیری</h3>
            <div className="space-y-2">
              {[
                { name: 'زهرا موسوی', note: 'کنترل قند خون هفتگی', days: 3 },
                { name: 'نیلوفر احمدی', note: 'نتیجه آزمایش چربی', days: 5 },
              ].map((r, i) => (
                <div
                  key={i}
                  className="flex items-center gap-3 rounded-xl border border-white/50 bg-white/40 p-3"
                >
                  <div className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-amber-50 text-amber-600">
                    <IconClock className="h-4 w-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-ink-700">{r.name}</p>
                    <p className="truncate text-[11px] text-ink-400">{r.note}</p>
                  </div>
                  <span className="shrink-0 rounded-full bg-amber-50 px-2 py-0.5 text-[10px] font-medium text-amber-700">
                    {toFa(r.days)} روز دیگر
                  </span>
                </div>
              ))}
            </div>
          </GlassCard>
        </div>
      </div>
    </div>
  )
}
