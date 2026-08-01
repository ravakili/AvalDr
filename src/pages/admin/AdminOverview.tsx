import { useEffect, useState } from 'react'
import GlassCard from '../../components/ui/GlassCard'
import Avatar from '../../components/ui/Avatar'
import StatCard from '../../components/ui/StatCard'
import Badge from '../../components/ui/Badge'
import ChartCard from '../../components/ui/ChartCard'
import PrimaryButton from '../../components/ui/PrimaryButton'
import {
  IconActivity,
  IconCalendar,
  IconStethoscope,
  IconUsers,
} from '../../components/ui/icons'
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { useNavigate } from 'react-router-dom'
import { formatDateFa, toFa } from '../../lib/utils'
import { api } from '../../lib/api'
import { doctorName } from '../../data/apiData'

const tooltipStyle = {
  borderRadius: 12,
  border: '1px solid rgb(var(--color-primary-300) / 0.35)',
  backgroundColor: 'rgb(15 23 42 / 0.96)',
  color: '#f8fafc',
  fontFamily: 'Vazirmatn',
  fontSize: 12,
}
const primaryChartColor = 'rgb(var(--color-primary-500))'
const primaryChartLight = 'rgb(var(--color-primary-300))'
const chartGridColor = 'rgb(148 163 184 / 0.24)'
const chartAxisColor = '#94a3b8'

interface DashboardData {
  totalUsers: number
  totalDoctors: number
  approvedDoctors: number
  pendingDoctors: number
  totalAppointments: number
  completedAppointments: number
  pendingWithdrawals: number
  revenue: number
}

function extractResults<T>(response: T | { results: T }): T {
  if (response && typeof response === 'object' && 'results' in response) {
    return (response as { results: T }).results
  }
  return response as T
}

const actionLabels: Record<string, string> = {
  'appointment.created': 'ثبت نوبت',
  'appointment.cancelled': 'لغو نوبت',
  'appointment.completed': 'تکمیل نوبت',
  'doctor.verified': 'تأیید پزشک',
  'doctor.suspended': 'تعلیق پزشک',
  'prescription.issued': 'صدور نسخه',
  'user.registered': 'ثبت‌نام کاربر',
  'specialty.added': 'افزودن تخصص',
  'withdrawal.approved': 'تأیید برداشت',
}

export default function AdminOverview() {
  const navigate = useNavigate()
  const [dashboard, setDashboard] = useState<DashboardData | null>(null)
  const [recentAppts, setRecentAppts] = useState<any[]>([])
  const [logs, setLogs] = useState<any[]>([])

  useEffect(() => {
    Promise.all([
      api.get<DashboardData>('/admin/dashboard/'),
      api.get<any[]>('/appointments/'),
      api.get<any[]>('/admin/audit-logs/'),
    ]).then(([dash, appts, audit]) => {
      const appointmentItems = extractResults(appts)
      const auditItems = extractResults(audit)
      setDashboard(dash)
      setRecentAppts([...appointmentItems].sort((a: any, b: any) => (a.date < b.date ? 1 : -1)).slice(0, 6))
      setLogs(auditItems.slice(0, 6))
    }).catch(() => {})
  }, [])

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard title="کل کاربران" value={dashboard?.totalUsers ?? '—'} delta="کاربران ثبت‌نامی" trend="up" tone="blue" icon={<IconUsers />} />
        <StatCard title="پزشکان فعال" value={dashboard?.approvedDoctors ?? '—'} delta={`${dashboard?.pendingDoctors ?? 0} در انتظار تأیید`} trend="up" tone="teal" icon={<IconStethoscope />} />
        <StatCard title="نوبت‌های امروز" value={recentAppts.filter((a) => a.date === new Date().toISOString().slice(0, 10)).length} delta="در حال انجام" trend="flat" tone="amber" icon={<IconCalendar />} />
        <StatCard title="درآمد کل" value={`${toFa(Math.round((dashboard?.revenue ?? 0) / 1000000))}میلیون`} delta="درآمد واریزی" trend="up" tone="violet" icon={<IconActivity />} />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <ChartCard title="رشد کاربران و پزشکان" subtitle="آمار لحظه‌ای" className="lg:col-span-2">
          <div className="h-72 flex items-center justify-center text-ink-400 text-sm">
            داده‌های نمودار در نمای کلی به زودی اضافه می‌شود.
          </div>
        </ChartCard>

        <ChartCard title="درآمد ماهانه" subtitle="میلیون تومان">
          <div className="h-64 flex items-center justify-center text-ink-400 text-sm">
            داده‌های درآمد در نمودار ماهانه به زودی اضافه می‌شود.
          </div>
        </ChartCard>

        <ChartCard title="روند نوبت‌ها" subtitle="هفتگی">
          <div className="h-64" dir="ltr">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={[
                { day: 'شنبه', count: 12 }, { day: 'یکشنبه', count: 18 },
                { day: 'دوشنبه', count: 15 }, { day: 'سه‌شنبه', count: 22 },
                { day: 'چهارشنبه', count: 19 }, { day: 'پنجشنبه', count: 25 },
                { day: 'جمعه', count: 8 },
              ]} margin={{ top: 8, right: 8, bottom: 0, left: -16 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={chartGridColor} vertical={false} />
                <XAxis dataKey="day" tick={{ fontSize: 10, fontFamily: 'Vazirmatn' }} stroke={chartAxisColor} />
                <YAxis tick={{ fontSize: 11 }} stroke={chartAxisColor} tickFormatter={(v) => toFa(v)} />
                <Tooltip contentStyle={tooltipStyle} formatter={(v) => [toFa(Number(v)), 'نوبت']} />
                <Line type="monotone" dataKey="count" stroke={primaryChartColor} strokeWidth={3} dot={{ r: 4, fill: primaryChartColor }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </ChartCard>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <GlassCard className="p-6 lg:col-span-2">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="font-bold text-ink-800">آخرین نوبت‌ها</h3>
            <Badge tone="teal">{toFa(dashboard?.totalAppointments ?? 0)} کل</Badge>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[520px] text-right text-sm">
              <thead>
                <tr className="border-b border-white/60 text-xs text-ink-400">
                  <th className="pb-3 font-medium">بیمار</th>
                  <th className="pb-3 font-medium">پزشک</th>
                  <th className="pb-3 font-medium">تاریخ</th>
                  <th className="pb-3 font-medium">وضعیت</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/40">
                {recentAppts.map((a: any) => (
                  <tr key={a.id} className="text-ink-700">
                    <td className="py-3"><span className="font-medium">{a.patient?.name || a.patientName || 'کاربر'}</span></td>
                    <td className="py-3 text-ink-500">{doctorName(a.doctor) || a.doctorName || 'پزشک'}</td>
                    <td className="py-3 text-ink-500">{formatDateFa(a.date)}</td>
                    <td className="py-3">
                      <Badge tone={a.status === 'completed' ? 'green' : a.status === 'cancelled' ? 'red' : a.status === 'in-progress' ? 'teal' : 'amber'} dot>
                        {a.status === 'completed' ? 'تکمیل' : a.status === 'cancelled' ? 'لغو' : a.status === 'in-progress' ? 'در حال انجام' : 'در انتظار'}
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </GlassCard>

        <GlassCard className="p-6">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="font-bold text-ink-800">لاگ فعالیت‌ها</h3>
            <Badge tone="gray">{toFa(logs.length)}</Badge>
          </div>
          <div className="space-y-2 max-h-80 overflow-y-auto pl-1">
            {logs.map((log: any) => (
              <div key={log.id} className="rounded-xl border border-white/50 bg-white/40 p-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-ink-700">{actionLabels[log.action] || log.action}</span>
                  <span className="text-[10px] text-ink-400">{new Intl.DateTimeFormat('fa-IR', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }).format(new Date(log.timestamp))}</span>
                </div>
                <p className="mt-1 text-[11px] text-ink-500">{log.details}</p>
                <p className="mt-0.5 text-[10px] text-ink-400">توسط {log.actorName}</p>
              </div>
            ))}
          </div>
        </GlassCard>
      </div>

      {(dashboard?.pendingDoctors ?? 0) > 0 && (
        <GlassCard className="flex flex-wrap items-center justify-between gap-3 border border-amber-200/60 bg-amber-50/40 p-5">
          <div className="flex items-center gap-3">
            <div className="grid h-11 w-11 place-items-center rounded-xl bg-amber-100 text-amber-600"><IconStethoscope /></div>
            <div>
              <p className="font-semibold text-ink-800">{toFa(dashboard!.pendingDoctors)} درخواست تأیید پزشک در انتظار</p>
              <p className="text-xs text-ink-400">برای بررسی به مدیریت پزشکان مراجعه کنید</p>
            </div>
          </div>
          <PrimaryButton variant="ghost" onClick={() => navigate('/admin/doctors?tab=pending')}>بررسی درخواست‌ها</PrimaryButton>
        </GlassCard>
      )}
    </div>
  )
}
