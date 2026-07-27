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
import {
  appointments,
  auditLogs,
  doctors,
  getDoctor,
  getPatient,
  patients,
  revenueData,
  userGrowthData,
} from '../../data/mockData'
import { useNavigate } from 'react-router-dom'
import { formatDateFa, toFa } from '../../lib/utils'

const todayIso = new Date().toISOString().slice(0, 10)

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

const tooltipStyle = {
  borderRadius: 12,
  border: '1px solid rgba(255,255,255,0.5)',
  fontFamily: 'Vazirmatn',
  fontSize: 12,
}

export default function AdminOverview() {
  const navigate = useNavigate()
  const approvedDocs = doctors.filter((d) => d.status === 'approved').length
  const pendingDocs = doctors.filter((d) => d.status === 'pending')
  const todayAppts = appointments.filter((a) => a.date === todayIso)
  const recent = [...appointments].sort((a, b) => (a.date < b.date ? 1 : -1)).slice(0, 6)

  return (
    <div className="space-y-6">
      {/* KPIs */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          title="کل کاربران"
          value={1750}
          delta="۸٪ رشد این ماه"
          trend="up"
          tone="blue"
          icon={<IconUsers />}
        />
        <StatCard
          title="پزشکان فعال"
          value={approvedDocs}
          delta={`${pendingDocs.length} در انتظار تأیید`}
          trend="up"
          tone="teal"
          icon={<IconStethoscope />}
        />
        <StatCard
          title="نوبت‌های امروز"
          value={todayAppts.length}
          delta="در حال انجام"
          trend="flat"
          tone="amber"
          icon={<IconCalendar />}
        />
        <StatCard
          title="درآمد ماه"
          value={`${toFa(130)}میلیون`}
          delta="۱۲٪ نسبت به ماه قبل"
          trend="up"
          tone="violet"
          icon={<IconActivity />}
        />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <ChartCard title="رشد کاربران و پزشکان" subtitle="۹ ماه اخیر" className="lg:col-span-2">
          <div className="h-72" dir="ltr">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={userGrowthData} margin={{ top: 8, right: 8, bottom: 0, left: -8 }}>
                <defs>
                  <linearGradient id="usersGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#2196b3" stopOpacity={0.4} />
                    <stop offset="100%" stopColor="#2196b3" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="docsGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#a78bfa" stopOpacity={0.4} />
                    <stop offset="100%" stopColor="#a78bfa" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.06)" vertical={false} />
                <XAxis dataKey="month" tick={{ fontSize: 11, fontFamily: 'Vazirmatn' }} stroke="#7a8898" />
                <YAxis tick={{ fontSize: 11 }} stroke="#7a8898" tickFormatter={(v) => toFa(v)} />
                <Tooltip contentStyle={tooltipStyle} formatter={(v) => toFa(Number(v))} />
                <Legend wrapperStyle={{ fontFamily: 'Vazirmatn', fontSize: 12 }} />
                <Area type="monotone" dataKey="users" name="کاربران" stroke="#2196b3" strokeWidth={2} fill="url(#usersGrad)" />
                <Area type="monotone" dataKey="doctors" name="پزشکان" stroke="#a78bfa" strokeWidth={2} fill="url(#docsGrad)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </ChartCard>

        <ChartCard title="درآمد ماهانه" subtitle="میلیون تومان">
          <div className="h-64" dir="ltr">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={revenueData} margin={{ top: 8, right: 8, bottom: 0, left: -16 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.06)" vertical={false} />
                <XAxis dataKey="month" tick={{ fontSize: 10, fontFamily: 'Vazirmatn' }} stroke="#7a8898" />
                <YAxis tick={{ fontSize: 11 }} stroke="#7a8898" tickFormatter={(v) => toFa(v)} />
                <Tooltip contentStyle={tooltipStyle} formatter={(v) => [`${toFa(Number(v))} میلیون`, 'درآمد']} />
                <Bar dataKey="revenue" fill="#2196b3" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </ChartCard>

        <ChartCard title="روند نوبت‌ها" subtitle="هفتگی">
          <div className="h-64" dir="ltr">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={[
                  { day: 'شنبه', count: 12 },
                  { day: 'یکشنبه', count: 18 },
                  { day: 'دوشنبه', count: 15 },
                  { day: 'سه‌شنبه', count: 22 },
                  { day: 'چهارشنبه', count: 19 },
                  { day: 'پنجشنبه', count: 25 },
                  { day: 'جمعه', count: 8 },
                ]}
                margin={{ top: 8, right: 8, bottom: 0, left: -16 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.06)" vertical={false} />
                <XAxis dataKey="day" tick={{ fontSize: 10, fontFamily: 'Vazirmatn' }} stroke="#7a8898" />
                <YAxis tick={{ fontSize: 11 }} stroke="#7a8898" tickFormatter={(v) => toFa(v)} />
                <Tooltip contentStyle={tooltipStyle} formatter={(v) => [toFa(Number(v)), 'نوبت']} />
                <Line type="monotone" dataKey="count" stroke="#2196b3" strokeWidth={3} dot={{ r: 4, fill: '#2196b3' }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </ChartCard>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Recent appointments */}
        <GlassCard className="p-6 lg:col-span-2">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="font-bold text-ink-800">آخرین نوبت‌ها</h3>
            <Badge tone="teal">{toFa(appointments.length)} کل</Badge>
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
                {recent.map((a) => {
                  const pat = getPatient(a.patientId)!
                  const doc = getDoctor(a.doctorId)!
                  return (
                    <tr key={a.id} className="text-ink-700">
                      <td className="py-3">
                        <div className="flex items-center gap-2">
                          <Avatar src={pat.avatar} size="xs" />
                          <span className="font-medium">{pat.name}</span>
                        </div>
                      </td>
                      <td className="py-3 text-ink-500">{doc.name}</td>
                      <td className="py-3 text-ink-500">{formatDateFa(a.date)}</td>
                      <td className="py-3">
                        <Badge tone={a.status === 'completed' ? 'green' : a.status === 'cancelled' ? 'red' : a.status === 'in-progress' ? 'teal' : 'amber'} dot>
                          {a.status === 'completed' ? 'تکمیل' : a.status === 'cancelled' ? 'لغو' : a.status === 'in-progress' ? 'در حال انجام' : 'در انتظار'}
                        </Badge>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </GlassCard>

        {/* Activity log */}
        <GlassCard className="p-6">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="font-bold text-ink-800">لاگ فعالیت‌ها</h3>
            <Badge tone="gray">{toFa(auditLogs.length)}</Badge>
          </div>
          <div className="space-y-2 max-h-80 overflow-y-auto pl-1">
            {auditLogs.slice(0, 6).map((log) => (
              <div key={log.id} className="rounded-xl border border-white/50 bg-white/40 p-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-ink-700">
                    {actionLabels[log.action] || log.action}
                  </span>
                  <span className="text-[10px] text-ink-400">
                    {new Intl.DateTimeFormat('fa-IR', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }).format(new Date(log.timestamp))}
                  </span>
                </div>
                <p className="mt-1 text-[11px] text-ink-500">{log.details}</p>
                <p className="mt-0.5 text-[10px] text-ink-400">توسط {log.actorName}</p>
              </div>
            ))}
          </div>
        </GlassCard>
      </div>

      {/* Pending approvals CTA */}
      {pendingDocs.length > 0 && (
        <GlassCard className="flex flex-wrap items-center justify-between gap-3 border border-amber-200/60 bg-amber-50/40 p-5">
          <div className="flex items-center gap-3">
            <div className="grid h-11 w-11 place-items-center rounded-xl bg-amber-100 text-amber-600">
              <IconStethoscope />
            </div>
            <div>
              <p className="font-semibold text-ink-800">{toFa(pendingDocs.length)} درخواست تأیید پزشک در انتظار</p>
              <p className="text-xs text-ink-400">برای بررسی به مدیریت پزشکان مراجعه کنید</p>
            </div>
          </div>
          <PrimaryButton variant="ghost" onClick={() => navigate('/admin/doctors?tab=pending')}>بررسی درخواست‌ها</PrimaryButton>
        </GlassCard>
      )}
    </div>
  )
}
