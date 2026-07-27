import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import GlassCard from '../../components/ui/GlassCard'
import Avatar from '../../components/ui/Avatar'
import PrimaryButton from '../../components/ui/PrimaryButton'
import Modal from '../../components/ui/Modal'
import { StatusBadge } from '../../components/ui/Badge'
import EmptyState from '../../components/ui/EmptyState'
import Tabs from '../../components/ui/Tabs'
import {
  IconCalendar,
  IconChat,
  IconCheck,
  IconClock,
  IconPlus,
  IconRefresh,
  IconVideo,
} from '../../components/ui/icons'
import { appointments, getDoctor } from '../../data/mockData'
import { cn, formatDateFa, relativeDay, toFa } from '../../lib/utils'
import type { AppointmentStatus } from '../../types'

const ME = 'pat-1'

export default function MyAppointments() {
  const navigate = useNavigate()
  const [tab, setTab] = useState<AppointmentStatus | 'all'>('all')
  const [dateFilter, setDateFilter] = useState<'all' | 'past' | 'upcoming'>('all')
  const [search, setSearch] = useState('')
  const [rescheduleId, setRescheduleId] = useState<string | null>(null)

  const todayStr = new Date().toISOString().slice(0, 10)

  const mine = useMemo(
    () =>
      appointments
        .filter((a) => a.patientId === ME)
        .filter((a) => (tab === 'all' ? true : a.status === tab))
        .filter((a) => {
          if (dateFilter === 'all') return true
          if (dateFilter === 'past') return a.date < todayStr
          return a.date >= todayStr
        })
        .filter((a) => {
          if (!search.trim()) return true
          return getDoctor(a.doctorId)?.name.includes(search.trim())
        })
        .sort((a, b) => (a.date < b.date ? -1 : 1)),
    [tab, dateFilter, search, todayStr],
  )

  return (
    <div className="space-y-5">
      {/* Tabs + filters */}
      <Tabs
        active={tab}
        onChange={(k) => setTab(k as AppointmentStatus | 'all')}
        tabs={[
          { key: 'all', label: 'همه', count: appointments.filter((a) => a.patientId === ME).length },
          { key: 'waiting', label: 'در انتظار' },
          { key: 'in-progress', label: 'در حال انجام' },
          { key: 'completed', label: 'تکمیل شده' },
          { key: 'cancelled', label: 'لغو شده' },
        ]}
      />

      <GlassCard className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap gap-1.5">
          {([
            { k: 'all', l: 'همه تاریخ‌ها' },
            { k: 'upcoming', l: 'آینده' },
            { k: 'past', l: 'گذشته' },
          ] as const).map((d) => (
            <button
              key={d.k}
              onClick={() => setDateFilter(d.k)}
              className={cn(
                'rounded-xl px-3 py-1.5 text-xs font-medium transition',
                dateFilter === d.k
                  ? 'bg-primary-500 text-white shadow-glass-sm'
                  : 'bg-white/40 text-ink-500 hover:bg-white/60',
              )}
            >
              {d.l}
            </button>
          ))}
        </div>
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="🔎 جستجو با نام پزشک…"
          className="glass-input w-full rounded-xl px-4 py-2 text-sm text-ink-800 outline-none focus:ring-2 focus:ring-primary-200 sm:w-56"
        />
      </GlassCard>

      {mine.length ? (
        <div className="space-y-3">
          {mine.map((a) => {
            const doc = getDoctor(a.doctorId)!
            const rel = relativeDay(a.date)
            const ConsultIcon = a.consultType === 'video' ? IconVideo : IconChat
            return (
              <GlassCard key={a.id} hover className="p-4 sm:p-5">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
                  <div className="flex min-w-0 flex-1 items-center gap-4">
                    <Avatar src={doc.avatar} size="md" ring />
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="truncate font-bold text-ink-800">{doc.name}</p>
                        <StatusBadge status={a.status} />
                        {a.consultType && (
                          <span className="inline-flex items-center gap-1 rounded-full bg-primary-50 px-2 py-0.5 text-[10px] font-medium text-primary-700">
                            <ConsultIcon className="h-3 w-3" />
                            {a.consultType === 'video' ? 'ویدئویی' : a.consultType === 'audio' ? 'صوتی' : 'متنی'}
                          </span>
                        )}
                      </div>
                      <p className="mt-0.5 truncate text-xs text-ink-400">{a.reason}</p>
                      <div className="mt-1.5 flex flex-wrap gap-x-3 gap-y-1 text-xs text-ink-500">
                        <span className="inline-flex items-center gap-1">
                          <IconCalendar className="h-3.5 w-3.5" />
                          {rel || formatDateFa(a.date)}
                        </span>
                        <span className="inline-flex items-center gap-1 tabular">
                          <IconClock className="h-3.5 w-3.5" />
                          {toFa(a.time)}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex shrink-0 flex-wrap gap-2">
                    {(a.status === 'waiting' || a.status === 'in-progress') && (
                      <PrimaryButton size="sm" variant="ghost" icon={<ConsultIcon className="h-4 w-4" />} onClick={() => navigate(`/doctor/consult/${a.id}`)}>
                        ورود به مشاوره
                      </PrimaryButton>
                    )}
                    {a.status === 'waiting' && (
                      <>
                        <PrimaryButton
                          size="sm"
                          variant="subtle"
                          icon={<IconRefresh className="h-4 w-4" />}
                          onClick={() => setRescheduleId(a.id)}
                        >
                          تغییر زمان
                        </PrimaryButton>
                        <PrimaryButton size="sm" variant="danger">
                          لغو نوبت
                        </PrimaryButton>
                      </>
                    )}
                    {a.status === 'completed' && (
                      <PrimaryButton size="sm" variant="subtle">
                        مشاهده نسخه
                      </PrimaryButton>
                    )}
                  </div>
                </div>
              </GlassCard>
            )
          })}
        </div>
      ) : (
        <EmptyState
          icon={<IconCalendar />}
          title="نوبتی در این دسته وجود ندارد"
          description="یک نوبت جدید رزرو کنید تا اینجا دیده شود."
          action={
            <PrimaryButton icon={<IconPlus />} onClick={() => navigate('/user/doctors')}>
              دریافت نوبت
            </PrimaryButton>
          }
        />
      )}

      {/* Reschedule modal */}
      <Modal
        open={!!rescheduleId}
        onClose={() => setRescheduleId(null)}
        title="تغییر زمان نوبت"
        footer={
          <>
            <PrimaryButton icon={<IconCheck />} onClick={() => setRescheduleId(null)}>
              تأیید تغییر
            </PrimaryButton>
            <PrimaryButton variant="ghost" onClick={() => setRescheduleId(null)}>
              انصراف
            </PrimaryButton>
          </>
        }
      >
        <p className="mb-4 text-sm text-ink-500">
          یک زمان جدید برای نوبت انتخاب کنید. تغییر پس از تأیید پزشک نهایی می‌شود.
        </p>
        <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
          {['09:00', '10:30', '12:00', '14:30', '16:00', '17:30', '19:00', '20:30'].map((s) => (
            <button
              key={s}
              className="rounded-xl border border-white/50 bg-white/40 py-2.5 text-sm font-semibold tabular text-ink-700 transition hover:border-primary-400 hover:bg-primary-50 hover:text-primary-700"
            >
              {toFa(s)}
            </button>
          ))}
        </div>
      </Modal>
    </div>
  )
}
