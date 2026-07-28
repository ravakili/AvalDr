import { useMemo, useState } from 'react'
import GlassCard from '../../components/ui/GlassCard'
import Avatar from '../../components/ui/Avatar'
import Badge from '../../components/ui/Badge'
import PrimaryButton from '../../components/ui/PrimaryButton'
import InputField, { SelectField } from '../../components/ui/InputField'
import EmptyState from '../../components/ui/EmptyState'
import { IconDownload, IconLog } from '../../components/ui/icons'
import { appointments, auditLogs, doctors, getDoctor, getPatient, patients } from '../../data/apiData'
import { formatDateFa, toFa } from '../../lib/utils'

const actionLabels: Record<string, { label: string; tone: 'gray' | 'green' | 'amber' | 'red' | 'blue' | 'teal' }> = {
  'appointment.created': { label: 'ثبت نوبت', tone: 'blue' },
  'appointment.cancelled': { label: 'لغو نوبت', tone: 'red' },
  'appointment.completed': { label: 'تکمیل نوبت', tone: 'green' },
  'doctor.verified': { label: 'تأیید پزشک', tone: 'green' },
  'doctor.suspended': { label: 'تعلیق پزشک', tone: 'red' },
  'prescription.issued': { label: 'صدور نسخه', tone: 'teal' },
  'user.registered': { label: 'ثبت‌نام', tone: 'blue' },
  'specialty.added': { label: 'افزودن تخصص', tone: 'gray' },
  'withdrawal.approved': { label: 'تأیید برداشت', tone: 'green' },
}

export default function AppointmentLogs() {
  const [actionFilter, setActionFilter] = useState('all')
  const [actorFilter, setActorFilter] = useState('all')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')

  const filtered = useMemo(
    () =>
      auditLogs
        .filter((l) => (actionFilter === 'all' ? true : l.action === actionFilter))
        .filter((l) => (actorFilter === 'all' ? true : l.actor === actorFilter || l.actorName.includes(actorFilter)))
        .filter((l) => (dateFrom ? l.timestamp >= dateFrom : true))
        .filter((l) => (dateTo ? l.timestamp <= `${dateTo}T23:59:59` : true))
        .sort((a, b) => (a.timestamp < b.timestamp ? 1 : -1)),
    [actionFilter, actorFilter, dateFrom, dateTo],
  )

  const exportCsv = () => {
    const rows = [
      ['عملیات', 'بازیگر', 'هدف', 'جزئیات', 'زمان'],
      ...filtered.map((l) => [
        actionLabels[l.action]?.label || l.action,
        l.actorName,
        l.targetName,
        l.details,
        new Date(l.timestamp).toLocaleString('fa-IR'),
      ]),
    ]
    const csv = rows.map((r) => r.map((c) => `"${c}"`).join(',')).join('\n')
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'audit-logs.csv'
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="space-y-5">
      <GlassCard className="space-y-4 p-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="font-bold text-ink-800">لاگ نوبت‌ها و فعالیت‌ها</h2>
            <p className="text-xs text-ink-400">{toFa(filtered.length)} رکورد</p>
          </div>
          <PrimaryButton variant="ghost" size="sm" icon={<IconDownload className="h-4 w-4" />} onClick={exportCsv}>
            خروجی گزارش
          </PrimaryButton>
        </div>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <SelectField value={actionFilter} onChange={(e) => setActionFilter(e.target.value)}>
            <option value="all">همه عملیات</option>
            {Object.entries(actionLabels).map(([k, v]) => (
              <option key={k} value={k}>{v.label}</option>
            ))}
          </SelectField>
          <SelectField value={actorFilter} onChange={(e) => setActorFilter(e.target.value)}>
            <option value="all">همه کاربران</option>
            <option value="admin">مدیر سیستم</option>
            {patients.map((p) => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
            {doctors.map((d) => (
              <option key={d.id} value={d.id}>{d.name}</option>
            ))}
          </SelectField>
          <InputField type="date" label="" name="from" value={dateFrom} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setDateFrom(e.target.value)} placeholder="از تاریخ" />
          <InputField type="date" label="" name="to" value={dateTo} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setDateTo(e.target.value)} placeholder="تا تاریخ" />
        </div>
      </GlassCard>

      {filtered.length ? (
        <GlassCard className="overflow-hidden p-0">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px] text-right text-sm">
              <thead className="bg-white/40 text-xs text-ink-500">
                <tr>
                  <th className="px-5 py-3.5 font-medium">عملیات</th>
                  <th className="px-5 py-3.5 font-medium">انجام‌دهنده</th>
                  <th className="px-5 py-3.5 font-medium">هدف</th>
                  <th className="px-5 py-3.5 font-medium">جزئیات</th>
                  <th className="px-5 py-3.5 font-medium">زمان</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/40">
                {filtered.map((log) => {
                  const meta = actionLabels[log.action] || { label: log.action, tone: 'gray' as const }
                  return (
                    <tr key={log.id} className="text-ink-700 transition hover:bg-white/40">
                      <td className="px-5 py-3">
                        <Badge tone={meta.tone}>{meta.label}</Badge>
                      </td>
                      <td className="px-5 py-3 text-ink-600">{log.actorName}</td>
                      <td className="px-5 py-3 text-ink-600">{log.targetName}</td>
                      <td className="px-5 py-3 text-xs text-ink-500">{log.details}</td>
                      <td className="px-5 py-3 text-xs text-ink-400 tabular">
                        {new Intl.DateTimeFormat('fa-IR', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }).format(new Date(log.timestamp))}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </GlassCard>
      ) : (
        <EmptyState icon={<IconLog />} title="رکوردی یافت نشد" description="فیلترها را تغییر دهید." />
      )}
    </div>
  )
}
