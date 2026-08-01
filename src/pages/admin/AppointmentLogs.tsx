import { useEffect, useMemo, useState } from 'react'
import DatePicker from 'react-multi-date-picker'
import persian from 'react-date-object/calendars/persian'
import persian_fa from 'react-date-object/locales/persian_fa'
import type { Value } from 'react-multi-date-picker'
import GlassCard from '../../components/ui/GlassCard'
import Badge from '../../components/ui/Badge'
import PrimaryButton from '../../components/ui/PrimaryButton'
import { SelectField } from '../../components/ui/InputField'
import EmptyState from '../../components/ui/EmptyState'
import { IconDownload, IconLog } from '../../components/ui/icons'
import { doctorName } from '../../data/apiData'
import { api } from '../../lib/api'
import { formatDateFa, toFa } from '../../lib/utils'
import type { AuditLog } from '../../types'
import { toast } from '../../store/toastStore'

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

function extractResults<T>(response: T | { results: T }): T {
  if (response && typeof response === 'object' && 'results' in response) {
    return (response as { results: T }).results
  }
  return response as T
}

export default function AppointmentLogs() {
  const [logs, setLogs] = useState<AuditLog[]>([])
  const [loading, setLoading] = useState(true)
  const [actionFilter, setActionFilter] = useState('all')
  const [actorFilter, setActorFilter] = useState('all')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')

  useEffect(() => {
    api.get<AuditLog[]>('/admin/audit-logs/')
      .then((data) => setLogs(extractResults(data)))
      .finally(() => setLoading(false))
  }, [])

  const actorOptions = useMemo(() => {
    const seen = new Set<string>()
    const options: { id: string; name: string }[] = []
    for (const l of logs) {
      const key = l.actor
      if (!seen.has(key)) {
        seen.add(key)
        options.push({ id: l.actor, name: l.actorName })
      }
    }
    return options.sort((a, b) => a.name.localeCompare(b.name))
  }, [logs])

  const filtered = useMemo(
    () =>
      logs
        .filter((l) => (actionFilter === 'all' ? true : l.action === actionFilter))
        .filter((l) => (actorFilter === 'all' ? true : l.actor === actorFilter || l.actorName.includes(actorFilter)))
        .filter((l) => (dateFrom ? l.timestamp >= dateFrom : true))
        .filter((l) => (dateTo ? l.timestamp <= `${dateTo}T23:59:59` : true))
        .sort((a, b) => (a.timestamp < b.timestamp ? 1 : -1)),
    [logs, actionFilter, actorFilter, dateFrom, dateTo],
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
    toast.success('خروجی گزارش آماده شد')
  }

  if (loading) return <div className="p-10 text-center text-ink-400">در حال بارگذاری...</div>

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
            {actorOptions.map((a) => (
              <option key={a.id} value={a.id}>{a.name}</option>
            ))}
          </SelectField>
          <DatePicker
            value={dateFrom || undefined}
            onChange={(value: Value) => {
              if (value && typeof value === 'object' && 'toDate' in value) {
                const d = (value as { toDate: () => Date }).toDate()
                setDateFrom(d.toISOString().split('T')[0])
              }
            }}
            calendar={persian}
            locale={persian_fa}
            calendarPosition="bottom-right"
            inputClass="glass-input w-full rounded-xl px-4 py-2.5 text-sm text-ink-800 outline-none focus:ring-2 focus:ring-primary-200"
            containerClassName="w-full"
            format="YYYY/MM/DD"
            placeholder="از تاریخ"
          />
          <DatePicker
            value={dateTo || undefined}
            onChange={(value: Value) => {
              if (value && typeof value === 'object' && 'toDate' in value) {
                const d = (value as { toDate: () => Date }).toDate()
                setDateTo(d.toISOString().split('T')[0])
              }
            }}
            calendar={persian}
            locale={persian_fa}
            calendarPosition="bottom-right"
            inputClass="glass-input w-full rounded-xl px-4 py-2.5 text-sm text-ink-800 outline-none focus:ring-2 focus:ring-primary-200"
            containerClassName="w-full"
            format="YYYY/MM/DD"
            placeholder="تا تاریخ"
          />
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
