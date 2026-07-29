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
  const [payingId, setPayingId] = useState<string | null>(null)
  const [paymentStep, setPaymentStep] = useState<'form' | 'processing' | 'success' | 'failed'>('form')
  const [cardNumber, setCardNumber] = useState('')

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
      const apptTime = new Date(`${appt.date}T${appt.time}`).getTime()
      const now = Date.now()
      const hoursDiff = (apptTime - now) / 3600000
      const hasPenalty = hoursDiff < 4
      if (hasPenalty) {
        const fee = 100000
        const penalty = Math.round(fee * 0.15)
        alert(`لغو نوبت با کسر ۱۵٪ جریمه (${formatToman(penalty)}) انجام شد.`)
      }
      await api.post(`/appointments/${cancelId}/cancel/`)
      updateAppt(cancelId, { status: 'cancelled' })
      setCancelId(null)
    } catch { alert('خطا در لغو نوبت') }
  }

  const handlePayment = async (apptId: string) => {
    setPayingId(apptId)
    setPaymentStep('form')
    setCardNumber('')
  }

  const submitPayment = async () => {
    if (!payingId) return
    setPaymentStep('processing')
    try {
      const payment = await api.post<{ id: string }>(`/appointments/${payingId}/payment/`)
      const success = Math.random() > 0.15
      await api.post(`/payments/${payment.id}/verify/`, { success, cardNumber })
      if (success) {
        updateAppt(payingId, { status: 'waiting' })
        setPaymentStep('success')
      } else {
        setPaymentStep('failed')
      }
    } catch {
      setPaymentStep('failed')
    }
  }

  const closePayment = () => {
    setPayingId(null)
    setPaymentStep('form')
  }

  const formatCard = (v: string) => {
    const d = v.replace(/\D/g, '').slice(0, 16)
    return d.replace(/(.{4})/g, '$1 ').trim()
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

      {/* Payment Modal */}
      <Modal
        open={!!payingId}
        onClose={closePayment}
        title="پرداخت نوبت"
        footer={
          paymentStep === 'failed' ? (
            <>
              <PrimaryButton onClick={submitPayment}>تلاش مجدد</PrimaryButton>
              <PrimaryButton variant="ghost" onClick={closePayment}>بازگشت</PrimaryButton>
            </>
          ) : paymentStep === 'success' ? (
            <PrimaryButton onClick={closePayment}>تأیید</PrimaryButton>
          ) : undefined
        }
      >
        {paymentStep === 'form' && (
          <div className="space-y-4">
            <div className="text-center">
              <div className="mx-auto mb-2 grid h-12 w-12 place-items-center rounded-2xl bg-primary-100 text-primary-600">
                <IconWallet className="h-6 w-6" />
              </div>
              <p className="text-xs text-ink-400">مبلغ: {formatToman(100000)}</p>
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-ink-600">شماره کارت</label>
              <input
                type="text"
                inputMode="numeric"
                placeholder="6037 9981 2345 6789"
                value={formatCard(cardNumber)}
                onChange={(e) => setCardNumber(e.target.value.replace(/\D/g, '').slice(0, 16))}
                className="glass-input w-full rounded-xl px-4 py-2.5 text-left text-sm tabular text-ink-800 outline-none transition focus:border-primary-300 focus:ring-2 focus:ring-primary-200"
                dir="ltr"
              />
            </div>
            <PrimaryButton className="w-full" disabled={cardNumber.length < 16} onClick={submitPayment} icon={<IconWallet className="h-4 w-4" />}>
              پرداخت
            </PrimaryButton>
            <button onClick={closePayment} className="w-full text-center text-xs text-ink-400 hover:text-ink-600">انصراف</button>
          </div>
        )}
        {paymentStep === 'processing' && (
          <div className="flex flex-col items-center gap-4 py-6 text-center">
            <svg className="h-12 w-12 animate-spin text-primary-500" viewBox="0 0 24 24" fill="none">
              <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" strokeDasharray="31.4 31.4" strokeLinecap="round" />
            </svg>
            <p className="font-medium text-ink-700">در حال اتصال به درگاه پرداخت...</p>
          </div>
        )}
        {paymentStep === 'success' && (
          <div className="flex flex-col items-center gap-3 py-4 text-center">
            <div className="grid h-16 w-16 place-items-center rounded-full bg-emerald-100 text-emerald-600">
              <IconCheck className="h-8 w-8" />
            </div>
            <h3 className="text-lg font-bold text-ink-800">پرداخت با موفقیت انجام شد</h3>
            <p className="text-sm text-ink-500">نوبت شما تأیید شد.</p>
          </div>
        )}
        {paymentStep === 'failed' && (
          <div className="flex flex-col items-center gap-3 py-4 text-center">
            <div className="grid h-16 w-16 place-items-center rounded-full bg-red-100 text-red-500">
              <IconClose className="h-8 w-8" />
            </div>
            <h3 className="text-lg font-bold text-ink-800">پرداخت ناموفق</h3>
            <p className="text-sm text-ink-500">تراکنش با خطا مواجه شد. مجدداً تلاش کنید.</p>
          </div>
        )}
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
                } catch { alert('خطا در تغییر زمان') }
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
