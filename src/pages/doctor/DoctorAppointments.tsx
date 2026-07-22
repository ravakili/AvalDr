import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import GlassCard from '../../components/ui/GlassCard'
import Avatar from '../../components/ui/Avatar'
import PrimaryButton from '../../components/ui/PrimaryButton'
import { StatusBadge } from '../../components/ui/Badge'
import { SelectField } from '../../components/ui/InputField'
import EmptyState from '../../components/ui/EmptyState'
import { cn, formatDateFa, toFa } from '../../lib/utils'
import {
  IconCalendar,
  IconChat,
  IconChevron,
  IconChevronDown,
  IconClock,
  IconList,
} from '../../components/ui/icons'
import { appointments, getPatient } from '../../data/mockData'
import type { AppointmentStatus } from '../../types'

const ME = 'doc-1'

const filterOptions: { key: AppointmentStatus | 'all'; label: string }[] = [
  { key: 'all', label: 'همه' },
  { key: 'waiting', label: 'در انتظار' },
  { key: 'in-progress', label: 'در حال انجام' },
  { key: 'completed', label: 'تکمیل شده' },
  { key: 'cancelled', label: 'لغو شده' },
]

export default function DoctorAppointments() {
  const navigate = useNavigate()
  const [status, setStatus] = useState<AppointmentStatus | 'all'>('all')
  const [view, setView] = useState<'list' | 'calendar'>('list')
  const [expanded, setExpanded] = useState<string | null>(null)

  const mine = appointments
    .filter((a) => a.doctorId === ME)
    .filter((a) => (status === 'all' ? true : a.status === status))
    .sort((a, b) => (a.date < b.date ? -1 : 1))

  // Group by date for calendar view
  const byDate: Record<string, typeof mine> = {}
  for (const a of mine) {
    ;(byDate[a.date] ??= []).push(a)
  }

  return (
    <div className="space-y-5">
      {/* Toolbar */}
      <GlassCard className="flex flex-wrap items-center justify-between gap-3 p-4">
        <div>
          <h2 className="font-bold text-ink-800">نوبت‌های من</h2>
          <p className="text-xs text-ink-400">مدیریت بیماران و جلسات مشاوره</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="w-44">
            <SelectField
              value={status}
              onChange={(e) => setStatus(e.target.value as AppointmentStatus | 'all')}
            >
              {filterOptions.map((o) => (
                <option key={o.key} value={o.key}>{o.label}</option>
              ))}
            </SelectField>
          </div>
          {/* View toggle */}
          <div className="flex rounded-xl border border-white/60 bg-white/50 p-0.5">
            <button
              onClick={() => setView('list')}
              className={cn(
                'flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition',
                view === 'list' ? 'bg-primary-500 text-white shadow-glass-sm' : 'text-ink-500',
              )}
            >
              <IconList className="h-4 w-4" /> لیست
            </button>
            <button
              onClick={() => setView('calendar')}
              className={cn(
                'flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition',
                view === 'calendar' ? 'bg-primary-500 text-white shadow-glass-sm' : 'text-ink-500',
              )}
            >
              <IconCalendar className="h-4 w-4" /> تقویم
            </button>
          </div>
        </div>
      </GlassCard>

      {mine.length ? (
        view === 'list' ? (
          /* ===== LIST VIEW ===== */
          <div className="space-y-3">
            {mine.map((a) => {
              const pat = getPatient(a.patientId)!
              const isExpanded = expanded === a.id
              return (
                <GlassCard key={a.id} hover className="p-0 overflow-hidden">
                  <button
                    onClick={() => setExpanded(isExpanded ? null : a.id)}
                    className="flex w-full flex-col gap-4 p-4 text-right sm:flex-row sm:items-center"
                  >
                    <div className="flex min-w-0 flex-1 items-center gap-4">
                      <Avatar src={pat.avatar} size="md" online={a.status === 'in-progress'} />
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="truncate font-bold text-ink-800">{pat.name}</p>
                          <StatusBadge status={a.status} />
                        </div>
                        <p className="mt-0.5 truncate text-xs text-ink-400">
                          {pat.gender === 'male' ? 'آقا' : 'خانم'} • {toFa(pat.age)} سال • {pat.city}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 text-xs text-ink-500">
                      <span className="inline-flex items-center gap-1">
                        <IconCalendar className="h-3.5 w-3.5" />
                        {formatDateFa(a.date)}
                      </span>
                      <span className="inline-flex items-center gap-1 tabular">
                        <IconClock className="h-3.5 w-3.5" />
                        {toFa(a.time)}
                      </span>
                      <span className={cn('transition-transform', isExpanded && 'rotate-180')}>
                        <IconChevronDown className="h-4 w-4" />
                      </span>
                    </div>
                  </button>

                  {/* Expandable details */}
                  {isExpanded && (
                    <div className="animate-fade-in border-t border-white/40 p-4">
                      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
                        <div>
                          <p className="text-[11px] text-ink-400">شماره تماس</p>
                          <p className="text-sm font-medium text-ink-700" dir="ltr">{pat.phone}</p>
                        </div>
                        <div>
                          <p className="text-[11px] text-ink-400">ایمیل</p>
                          <p className="text-sm font-medium text-ink-700" dir="ltr">{pat.email}</p>
                        </div>
                        <div>
                          <p className="text-[11px] text-ink-400">علائم</p>
                          <p className="text-sm font-medium text-ink-700">{a.reason}</p>
                        </div>
                        <div>
                          <p className="text-[11px] text-ink-400">سوابق بیماری</p>
                          <p className="text-sm text-ink-700">
                            {pat.medicalHistory?.diagnoses.length
                              ? pat.medicalHistory.diagnoses.join('، ')
                              : 'ثبت نشده'}
                          </p>
                        </div>
                      </div>
                      <div className="mt-3 flex gap-2">
                        {(a.status === 'waiting' || a.status === 'in-progress') && (
                          <PrimaryButton
                            size="sm"
                            icon={<IconChat className="h-4 w-4" />}
                            onClick={(e) => {
                              e.stopPropagation()
                              navigate(`/doctor/consult/${a.id}`)
                            }}
                          >
                            {a.status === 'in-progress' ? 'ادامه مشاوره' : 'شروع مشاوره'}
                          </PrimaryButton>
                        )}
                        {a.status === 'waiting' && (
                          <PrimaryButton
                            size="sm"
                            variant="danger"
                            onClick={(e) => e.stopPropagation()}
                          >
                            لغو
                          </PrimaryButton>
                        )}
                        {a.status === 'completed' && (
                          <PrimaryButton size="sm" variant="subtle">
                            مشاهده نسخه
                          </PrimaryButton>
                        )}
                        <PrimaryButton
                          size="sm"
                          variant="ghost"
                          onClick={() => navigate('/doctor/patients')}
                        >
                          پرونده بیمار
                        </PrimaryButton>
                      </div>
                    </div>
                  )}
                </GlassCard>
              )
            })}
          </div>
        ) : (
          /* ===== CALENDAR VIEW ===== */
          <div className="space-y-4">
            {Object.entries(byDate).map(([date, appts]) => (
              <div key={date}>
                <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold text-ink-700">
                  <IconCalendar className="h-4 w-4 text-primary-500" />
                  {formatDateFa(date)}
                  <span className="rounded-full bg-primary-50 px-2 py-0.5 text-[10px] text-primary-700">
                    {toFa(appts.length)} نوبت
                  </span>
                </h3>
                <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
                  {appts.map((a) => {
                    const pat = getPatient(a.patientId)!
                    return (
                      <GlassCard key={a.id} hover className="flex items-center gap-3 p-3">
                        <Avatar src={pat.avatar} size="sm" />
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-semibold text-ink-800">{pat.name}</p>
                          <p className="text-[11px] text-ink-400">{a.reason}</p>
                        </div>
                        <div className="text-left">
                          <p className="text-sm font-bold text-primary-700 tabular">{toFa(a.time)}</p>
                          <StatusBadge status={a.status} />
                        </div>
                        <button
                          onClick={() => navigate(`/doctor/consult/${a.id}`)}
                          className="text-primary-600 hover:underline text-xs"
                        >
                          <IconChevron className="h-4 w-4" />
                        </button>
                      </GlassCard>
                    )
                  })}
                </div>
              </div>
            ))}
          </div>
        )
      ) : (
        <EmptyState
          icon={<IconCalendar />}
          title="نوبتی با این وضعیت وجود ندارد"
          description="فیلتر را تغییر دهید."
        />
      )}
    </div>
  )
}
