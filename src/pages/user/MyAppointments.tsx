import { useMemo, useState, useEffect } from 'react'
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
  IconClose,
  IconPlus,
  IconRefresh,
  IconVideo,
  IconWallet,
} from '../../components/ui/icons'
import { doctorName, getDoctor } from '../../data/apiData'
import { cn, formatDateFa, formatToman, relativeDay, toFa } from '../../lib/utils'
import type { AppointmentStatus } from '../../types'
import { useAuthStore } from '../../store/authStore'
import { useUserStore } from '../../store/userStore'
import { api } from '../../lib/api'
import { toast } from '../../store/toastStore'

export default function MyAppointments() {
  const navigate = useNavigate()
  const ME = useAuthStore((state) => state.user?.refId || '')
  const profile = useUserStore((s) => s.profile)
  const appointments = useUserStore((s) => s.appointments)
  const fetchAppointments = useUserStore((s) => s.fetchAppointments)
  const updateAppt = useUserStore((s) => s.updateAppointment)

  const [tab, setTab] = useState<AppointmentStatus | 'all'>('all')
  const [dateFilter, setDateFilter] = useState<'all' | 'past' | 'upcoming'>('all')
  const [search, setSearch] = useState('')
  const [rescheduleId, setRescheduleId] = useState<string | null>(null)
  const [rescheduleTime, setRescheduleTime] = useState('')
  const [cancelId, setCancelId] = useState<string | null>(null)

  const todayStr = new Date().toISOString().slice(0, 10)

  useEffect(() => { fetchAppointments() }, [])

  const mine = useMemo(
    () =>
      appointments
        .filter((a) => a.patientId === (profile?.id || ME))
        .filter((a) => (tab === 'all' ? true : a.status === tab))
        .filter((a) => {
          if (dateFilter === 'all') return true
          if (dateFilter === 'past') return a.date < todayStr
          return a.date >= todayStr
        })
        .filter((a) => {
          if (!search.trim()) return true
          return doctorName(getDoctor(a.doctorId))?.includes(search.trim())
        })
        .sort((a, b) => (a.date < b.date ? -1 : 1)),
    [appointments, tab, dateFilter, search, todayStr, profile],
  )

  const handleCancel = async () => {
    if (!cancelId) return
    try {
      const appt = appointments.find((a) => a.id === cancelId)
      if (!appt) return
      const result = await api.post<{ refundStatus?: string }>(`/appointments/${cancelId}/cancel/`)
      updateAppt(cancelId, { status: 'cancelled', refundStatus: result.refundStatus })
      setCancelId(null)
      if (result.refundStatus === 'refunded') {
        toast.success('نوبت لغو شد', 'مبلغ پرداختی از طریق زرین‌پال بازپرداخت شد.')
      } else if (result.refundStatus === 'refund-failed') {
        toast.warning('نوبت لغو شد', 'بازپرداخت ناموفق بود و برای پیگیری به ادمین اطلاع داده شد.')
      } else {
        toast.success('نوبت لغو شد')
      }
    } catch (error) {
      toast.error('خطا در لغو نوبت', error instanceof Error ? error.message : undefined)
    }
  }

  const handlePayment = async (apptId: string) => {
    try {
      const payment = await api.post<{ gatewayUrl: string }>(`/appointments/${apptId}/payment/`)
      toast.info('انتقال به درگاه', 'برای پرداخت به سندباکس زرین‌پال منتقل می‌شوید.')
      window.location.assign(payment.gatewayUrl)
    } catch (error) {
      toast.error('اتصال به درگاه انجام نشد', error instanceof Error ? error.message : undefined)
    }
  }

  return (
    <div className="space-y-5">
      <Tabs
        active={tab}
        onChange={(k) => setTab(k as AppointmentStatus | 'all')}
        tabs={[
          { key: 'all', label: 'همه', count: appointments.filter((a) => a.patientId === (profile?.id || ME)).length },
          { key: 'waiting', label: 'در انتظار' },
          { key: 'pending-payment', label: 'در انتظار پرداخت' },
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
            const doc = getDoctor(a.doctorId)
            const rel = relativeDay(a.date)
            const ConsultIcon = a.consultType === 'video' ? IconVideo : IconChat
            const isPast = a.date < todayStr || (a.date === todayStr && a.time < new Date().toTimeString().slice(0, 5))
            return (
              <GlassCard key={a.id} hover className="p-4 sm:p-5">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
                  <div className="flex min-w-0 flex-1 items-center gap-4">
                    <Avatar src={doc?.avatar} size="md" ring />
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="truncate font-bold text-ink-800">{doctorName(doc) || 'پزشک'}</p>
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
                        <span className="inline-flex items-center gap-1">
                          بیمه: {profile?.insuranceType || '—'}
                        </span>
                        <span className="inline-flex items-center gap-1">
                          تکمیلی: {profile?.supplementaryInsurance || '—'}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex shrink-0 flex-wrap gap-2">
                    {(a.status === 'in-progress' || a.status === 'completed' || (a.status === 'waiting' && !isPast)) && (
                      <PrimaryButton size="sm" variant="ghost" icon={<ConsultIcon className="h-4 w-4" />} onClick={() => navigate(`/user/consult/${a.id}`)}>
                        ورود به مشاوره
                      </PrimaryButton>
                    )}
                    {a.status === 'pending-payment' && (
                      <PrimaryButton size="sm" variant="primary" icon={<IconWallet className="h-4 w-4" />} onClick={() => handlePayment(a.id)}>
                        پرداخت
                      </PrimaryButton>
                    )}
                    {a.status === 'waiting' && !isPast && (
                      <>
                        <PrimaryButton
                          size="sm"
                          variant="subtle"
                          icon={<IconRefresh className="h-4 w-4" />}
                          onClick={() => setRescheduleId(a.id)}
                        >
                          تغییر زمان
                        </PrimaryButton>
                        <PrimaryButton
                          size="sm"
                          variant="danger"
                          onClick={() => setCancelId(a.id)}
                        >
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

      {/* Cancel confirmation */}
      <Modal
        open={!!cancelId}
        onClose={() => setCancelId(null)}
        title="لغو نوبت"
        footer={
          <>
            <PrimaryButton variant="danger" onClick={handleCancel}>
              تأیید لغو
            </PrimaryButton>
            <PrimaryButton variant="ghost" onClick={() => setCancelId(null)}>
              انصراف
            </PrimaryButton>
          </>
        }
      >
        <p className="mb-3 text-sm text-ink-600">
          آیا از لغو این نوبت مطمئن هستید؟
        </p>
        <div className="rounded-xl bg-amber-50 border border-amber-200 p-3 text-xs text-amber-700">
          <p className="font-medium">قوانین لغو نوبت:</p>
          <ul className="mt-1 list-disc list-inside space-y-1">
            <li>لغو تا ۴ ساعت قبل از ویزیت: بدون کسر وجه</li>
            <li>لغو کمتر از ۴ ساعت قبل از ویزیت: کسر ۱۵٪ جریمه</li>
            <li>مبلغ پس از کسر جریمه به کیف پول شما بازمی‌گردد</li>
          </ul>
        </div>
      </Modal>

      {/* Reschedule modal */}
      <Modal
        open={!!rescheduleId}
        onClose={() => setRescheduleId(null)}
        title="تغییر زمان نوبت"
        footer={
          <>
            <PrimaryButton
              icon={<IconCheck />}
              disabled={!rescheduleTime}
              onClick={async () => {
                if (!rescheduleId || !rescheduleTime) return
                try {
                  await api.post(`/appointments/${rescheduleId}/reschedule/`, { time: rescheduleTime })
                  await fetchAppointments()
                  setRescheduleId(null)
                  setRescheduleTime('')
                  toast.success('زمان نوبت تغییر کرد')
                } catch (error) {
                  toast.error('خطا در تغییر زمان', error instanceof Error ? error.message : undefined)
                }
              }}
            >
              تأیید تغییر
            </PrimaryButton>
            <PrimaryButton variant="ghost" onClick={() => setRescheduleId(null)}>
              انصراف
            </PrimaryButton>
          </>
        }
      >
        <p className="mb-4 text-sm text-ink-500">
          یک زمان جدید برای نوبت انتخاب کنید.
        </p>
        <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
          {['09:00', '10:30', '12:00', '14:30', '16:00', '17:30', '19:00', '20:30'].map((s) => (
            <button
              key={s}
              onClick={() => setRescheduleTime(s)}
              className={`rounded-xl border py-2.5 text-sm font-semibold tabular transition ${
                rescheduleTime === s
                  ? 'border-primary-400 bg-primary-50 text-primary-700'
                  : 'border-white/50 bg-white/40 text-ink-700 hover:border-primary-400 hover:bg-primary-50'
              }`}
            >
              {toFa(s)}
            </button>
          ))}
        </div>
      </Modal>
    </div>
  )
}
