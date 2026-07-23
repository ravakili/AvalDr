import { useMemo, useState, useRef, useEffect, useCallback } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import GlassCard from '../../components/ui/GlassCard'
import PrimaryButton from '../../components/ui/PrimaryButton'
import Avatar from '../../components/ui/Avatar'
import Badge from '../../components/ui/Badge'
import { TextArea } from '../../components/ui/InputField'
import { cn, formatToman, toFa } from '../../lib/utils'
import { doctors, getDoctor, getSpecialty, appointments } from '../../data/mockData'
import {
  IconCalendar,
  IconChat,
  IconCheck,
  IconClock,
  IconClose,
  IconPhone,
  IconPin,
  IconStar,
  IconVideo,
  IconWallet,
} from '../../components/ui/icons'
import { useAuthStore } from '../../store/authStore'
import type { ConsultType, Appointment } from '../../types'

const today = new Date()
const nextDays = Array.from({ length: 7 }, (_, i) => {
  const d = new Date(today)
  d.setDate(d.getDate() + i)
  return d.toISOString().slice(0, 10)
})

const dayLabel = (iso: string, idx: number) => {
  const d = new Date(iso)
  const wd = new Intl.DateTimeFormat('fa-IR', { weekday: 'short' }).format(d)
  const dm = new Intl.DateTimeFormat('fa-IR', { day: 'numeric', month: 'numeric' }).format(d)
  return { wd, dm, isToday: idx === 0 }
}

const slots = ['09:00', '10:30', '12:00', '14:30', '16:00', '17:30', '19:00']

export default function BookAppointment() {
  const { doctorId } = useParams()
  const navigate = useNavigate()
  const doctor = doctorId ? getDoctor(doctorId) : undefined
  const user = useAuthStore((s) => s.user)

  const [day, setDay] = useState(nextDays[0])
  const [time, setTime] = useState('')
  const [reason, setReason] = useState('')
  const [consultType, setConsultType] = useState<ConsultType>('video')

  const [showPayment, setShowPayment] = useState(false)
  const [paymentStep, setPaymentStep] = useState<'form' | 'processing' | 'success' | 'failed'>('form')
  const [cardNumber, setCardNumber] = useState('')
  const [cardMonth, setCardMonth] = useState('')
  const [cardCvv, setCardCvv] = useState('')

  const pendingApptRef = useRef<Appointment | null>(null)
  const cancelTimerRef = useRef<ReturnType<typeof setTimeout>>()
  const [timeLeft, setTimeLeft] = useState(300)

  const dayCards = useMemo(() => nextDays.map((iso, i) => ({ iso, ...dayLabel(iso, i) })), [])

  // Auto-cancel timer
  const startCancelTimer = useCallback(() => {
    setTimeLeft(300)
    const interval = setInterval(() => {
      setTimeLeft((t) => {
        if (t <= 1) {
          clearInterval(interval)
          return 0
        }
        return t - 1
      })
    }, 1000)
    cancelTimerRef.current = setTimeout(() => {
      if (pendingApptRef.current) {
        pendingApptRef.current.status = 'cancelled'
      }
      setShowPayment(false)
      setPaymentStep('form')
      setCardNumber('')
      setCardMonth('')
      setCardCvv('')
    }, 300000)
    return () => {
      clearInterval(interval)
      clearTimeout(cancelTimerRef.current)
    }
  }, [])

  useEffect(() => {
    return () => {
      clearTimeout(cancelTimerRef.current)
    }
  }, [])

  if (!doctor) {
    return (
      <GlassCard className="p-8 text-center text-ink-500">
        پزشک یافت نشد.{' '}
        <button className="text-primary-600 hover:underline" onClick={() => navigate(-1)}>
          بازگشت
        </button>
      </GlassCard>
    )
  }

  const specialty = getSpecialty(doctor.specialtyId)

  const handleSubmit = () => {
    if (!time || !user) return
    const appt: Appointment = {
      id: `appt-${Date.now()}`,
      patientId: user.refId || 'pat-1',
      doctorId: doctor.id,
      date: day,
      time,
      status: 'pending-payment',
      reason,
      consultType,
      createdAt: new Date().toISOString(),
    }
    appointments.push(appt)
    pendingApptRef.current = appt
    setShowPayment(true)
    setPaymentStep('form')
    startCancelTimer()
  }

  const simulatePayment = () => {
    setPaymentStep('processing')
    setTimeout(() => {
      const success = Math.random() > 0.15
      if (success && pendingApptRef.current) {
        pendingApptRef.current.status = 'waiting'
        setPaymentStep('success')
        clearTimeout(cancelTimerRef.current)
      } else {
        if (pendingApptRef.current) pendingApptRef.current.status = 'cancelled'
        setPaymentStep('failed')
        clearTimeout(cancelTimerRef.current)
      }
    }, 2000)
  }

  const closePayment = () => {
    setShowPayment(false)
    setPaymentStep('form')
    setCardNumber('')
    setCardMonth('')
    setCardCvv('')
    if (paymentStep === 'success') navigate('/user/appointments')
  }

  const formatCard = (v: string) => {
    const d = v.replace(/\D/g, '').slice(0, 16)
    return d.replace(/(.{4})/g, '$1 ').trim()
  }

  const commFee = {
    chat: 100000,
    audio: 150000,
    video: 250000,
  }

  return (
    <div className="space-y-6">
      {/* Doctor summary */}
      <GlassCard className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center">
        <Avatar src={doctor.avatar} size="xl" ring />
        <div className="flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="text-xl font-bold text-ink-800">{doctor.name}</h2>
            <Badge tone="amber">
              <IconStar className="h-3 w-3" /> {toFa(doctor.rating.toFixed(1))}
            </Badge>
          </div>
          <p className="mt-1 text-sm text-primary-600">
            {specialty?.icon} {specialty?.name}
          </p>
          <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-ink-500">
            <span className="inline-flex items-center gap-1"><IconPin className="h-3.5 w-3.5" /> {doctor.city}</span>
            <span className="inline-flex items-center gap-1"><IconCalendar className="h-3.5 w-3.5" /> {toFa(doctor.experienceYears)} سال تجربه</span>
            <span className="inline-flex items-center gap-1"><IconClock className="h-3.5 w-3.5" /> {doctor.hospital}</span>
          </div>
        </div>
        <div className="rounded-2xl border border-white/50 bg-white/50 px-5 py-3 text-center">
          <p className="text-xs text-ink-400">تعرفه ویزیت</p>
          <p className="text-lg font-bold text-ink-800 tabular">{formatToman(commFee[consultType])}</p>
        </div>
      </GlassCard>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Day picker */}
        <GlassCard className="p-6 lg:col-span-2">
          <h3 className="mb-1 font-bold text-ink-800">انتخاب روز</h3>
          <p className="mb-4 text-xs text-ink-400">هفت روز آینده</p>
          <div className="grid grid-cols-3 gap-3 sm:grid-cols-7">
            {dayCards.map((d) => {
              const active = d.iso === day
              return (
                <button
                  key={d.iso}
                  onClick={() => setDay(d.iso)}
                  className={`flex flex-col items-center gap-1 rounded-2xl border p-3 transition-all ${
                    active
                      ? 'border-primary-400 bg-primary-500 text-white shadow-glass-sm'
                      : 'border-white/50 bg-white/40 text-ink-600 hover:bg-white/60'
                  }`}
                >
                  <span className="text-xs font-medium">{d.wd}</span>
                  <span className="text-base font-bold tabular">{d.dm}</span>
                  {d.isToday && (
                    <span className={`rounded-full px-1.5 text-[9px] ${active ? 'bg-white/20' : 'bg-primary-100 text-primary-700'}`}>
                      امروز
                    </span>
                  )}
                </button>
              )
            })}
          </div>

          {/* Time slots */}
          <h3 className="mb-1 mt-6 font-bold text-ink-800">انتخاب ساعت</h3>
          <p className="mb-4 text-xs text-ink-400">ساعات خالی</p>
          <div className="grid grid-cols-3 gap-3 sm:grid-cols-4">
            {slots.map((s) => {
              const active = s === time
              return (
                <button
                  key={s}
                  onClick={() => setTime(s)}
                  className={`rounded-xl border py-2.5 text-sm font-semibold tabular transition-all ${
                    active
                      ? 'border-primary-400 bg-primary-500 text-white shadow-glass-sm'
                      : 'border-white/50 bg-white/40 text-ink-700 hover:bg-white/60'
                  }`}
                >
                  {toFa(s)}
                </button>
              )
            })}
          </div>

          {/* Reason */}
          <div className="mt-6">
            <TextArea
              label="شرح حال (اختیاری)"
              name="reason"
              rows={3}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="علت مراجعه یا سوال خود را کوتاه بنویسید…"
            />
          </div>

          {/* Consultation type */}
          <div className="mt-6">
            <p className="mb-1.5 block text-sm font-medium text-ink-700">نوع مشاوره</p>
            <div className="grid grid-cols-3 gap-3">
              {(
                [
                  { key: 'video', label: 'ویدئویی', icon: <IconVideo /> },
                  { key: 'audio', label: 'صوتی', icon: <IconPhone /> },
                  { key: 'chat', label: 'متنی', icon: <IconChat /> },
                ] as { key: ConsultType; label: string; icon: React.ReactNode }[]
              ).map((c) => (
                <button
                  key={c.key}
                  type="button"
                  onClick={() => setConsultType(c.key)}
                  className={cn(
                    'flex flex-col items-center gap-1.5 rounded-2xl border p-3 transition-all',
                    consultType === c.key
                      ? 'border-primary-400 bg-primary-50 text-primary-700 shadow-glass-sm'
                      : 'border-white/50 bg-white/40 text-ink-500 hover:bg-white/60',
                  )}
                >
                  <span>{c.icon}</span>
                  <span className="text-xs font-medium">{c.label}</span>
                </button>
              ))}
            </div>
          </div>
        </GlassCard>

        {/* Summary */}
        <GlassCard variant="soft" className="h-fit p-6">
          <h3 className="font-bold text-ink-800">خلاصه نوبت</h3>
          <dl className="mt-4 space-y-3 text-sm">
            <Row label="پزشک" value={doctor.name} />
            <Row label="تخصص" value={`${specialty?.icon} ${specialty?.name}`} />
            <Row label="روز" value={new Intl.DateTimeFormat('fa-IR', { weekday: 'long', day: 'numeric', month: 'long' }).format(new Date(day))} />
            <Row label="ساعت" value={time ? `${toFa(time)}` : '—'} highlight />
            <Row label="نوع مشاوره" value={consultType === 'video' ? 'ویدئویی' : consultType === 'audio' ? 'صوتی' : 'متنی'} />
            <Row label="تعرفه" value={formatToman(commFee[consultType])} />
          </dl>

          <PrimaryButton
            className="mt-6 w-full"
            size="lg"
            disabled={!time}
            icon={<IconCheck />}
            onClick={handleSubmit}
          >
            تأیید و ثبت نوبت
          </PrimaryButton>
          <p className="mt-3 text-center text-xs text-ink-400">
            برای تکمیل نوبت به درگاه پرداخت هدایت می‌شوید
          </p>
        </GlassCard>
      </div>

      {/* Payment Modal */}
      {showPayment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-ink-900/40 backdrop-blur-sm animate-fade-in" onClick={closePayment} />
          <GlassCard variant="default" className="relative z-10 w-full max-w-sm animate-pop-in p-6">
            {/* Timer */}
            {paymentStep === 'form' && (
              <div className="mb-4 text-center">
                <span className="text-xs text-ink-400">زمان باقی‌مانده برای پرداخت: </span>
                <span className={`tabular text-sm font-bold ${timeLeft <= 60 ? 'text-red-500' : 'text-ink-700'}`}>
                  {toFa(Math.floor(timeLeft / 60))}:{toFa(String(timeLeft % 60).padStart(2, '0'))}
                </span>
              </div>
            )}

            {/* Step: Form */}
            {paymentStep === 'form' && (
              <div className="space-y-4">
                <div className="text-center">
                  <div className="mx-auto mb-2 grid h-12 w-12 place-items-center rounded-2xl bg-primary-100 text-primary-600">
                    <IconWallet className="h-6 w-6" />
                  </div>
                  <h3 className="font-bold text-ink-800">پرداخت الکترونیک</h3>
                  <p className="mt-1 text-xs text-ink-400">مبلغ {formatToman(commFee[consultType])}</p>
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
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="mb-1 block text-xs font-medium text-ink-600">ماه/سال</label>
                    <input
                      type="text"
                      inputMode="numeric"
                      placeholder="12/28"
                      value={cardMonth}
                      onChange={(e) => setCardMonth(e.target.value.replace(/\D/g, '').slice(0, 4))}
                      className="glass-input w-full rounded-xl px-4 py-2.5 text-left text-sm tabular text-ink-800 outline-none transition focus:border-primary-300 focus:ring-2 focus:ring-primary-200"
                      dir="ltr"
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-xs font-medium text-ink-600">CVV2</label>
                    <input
                      type="text"
                      inputMode="numeric"
                      placeholder="1234"
                      value={cardCvv}
                      onChange={(e) => setCardCvv(e.target.value.replace(/\D/g, '').slice(0, 4))}
                      className="glass-input w-full rounded-xl px-4 py-2.5 text-left text-sm tabular text-ink-800 outline-none transition focus:border-primary-300 focus:ring-2 focus:ring-primary-200"
                      dir="ltr"
                    />
                  </div>
                </div>

                <button
                  onClick={simulatePayment}
                  disabled={cardNumber.length < 16}
                  className="flex w-full items-center justify-center gap-2 rounded-2xl bg-primary-500 py-3 text-sm font-bold text-white shadow-glass-sm transition hover:bg-primary-600 active:scale-[.98] disabled:bg-ink-300 disabled:cursor-not-allowed"
                >
                  <IconWallet className="h-5 w-5" />
                  پرداخت {formatToman(commFee[consultType])}
                </button>
                <button onClick={closePayment} className="w-full text-center text-xs text-ink-400 hover:text-ink-600">انصراف و بازگشت</button>
              </div>
            )}

            {/* Step: Processing */}
            {paymentStep === 'processing' && (
              <div className="flex flex-col items-center gap-4 py-6 text-center">
                <svg className="h-12 w-12 animate-spin text-primary-500" viewBox="0 0 24 24" fill="none">
                  <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" strokeDasharray="31.4 31.4" strokeLinecap="round" />
                </svg>
                <p className="font-medium text-ink-700">در حال اتصال به درگاه پرداخت...</p>
                <p className="text-xs text-ink-400">لطفاً صبر کنید</p>
              </div>
            )}

            {/* Step: Success */}
            {paymentStep === 'success' && (
              <div className="flex flex-col items-center gap-3 py-4 text-center">
                <div className="grid h-16 w-16 place-items-center rounded-full bg-emerald-100 text-emerald-600">
                  <IconCheck className="h-8 w-8" />
                </div>
                <h3 className="text-lg font-bold text-ink-800">پرداخت با موفقیت انجام شد</h3>
                <p className="text-sm text-ink-500">
                  نوبت شما با <b>{doctor.name}</b> در {new Intl.DateTimeFormat('fa-IR', { day: 'numeric', month: 'long' }).format(new Date(day))} ساعت <b className="tabular">{toFa(time)}</b> تایید شد.
                </p>
                <p className="text-xs text-ink-400">کد پیگیری: {toFa(Math.floor(Math.random() * 90000) + 10000)}</p>
                <PrimaryButton className="mt-2 w-full" icon={<IconCheck />} onClick={closePayment}>
                  مشاهده نوبت‌های من
                </PrimaryButton>
              </div>
            )}

            {/* Step: Failed */}
            {paymentStep === 'failed' && (
              <div className="flex flex-col items-center gap-3 py-4 text-center">
                <div className="grid h-16 w-16 place-items-center rounded-full bg-red-100 text-red-500">
                  <IconClose className="h-8 w-8" />
                </div>
                <h3 className="text-lg font-bold text-ink-800">پرداخت ناموفق</h3>
                <p className="text-sm text-ink-500">متأسفانه تراکنش با خطا مواجه شد. لطفاً مجدداً تلاش کنید.</p>
                <div className="mt-2 flex w-full flex-col gap-2">
                  <PrimaryButton className="w-full" onClick={() => setPaymentStep('form')}>
                    تلاش مجدد
                  </PrimaryButton>
                  <PrimaryButton variant="ghost" className="w-full" onClick={closePayment}>
                    بازگشت به صفحه نوبت
                  </PrimaryButton>
                </div>
              </div>
            )}
          </GlassCard>
        </div>
      )}
    </div>
  )
}

function Row({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div className="flex items-center justify-between gap-3 border-b border-white/50 pb-3 last:border-0 last:pb-0">
      <dt className="text-ink-400">{label}</dt>
      <dd className={`font-semibold ${highlight ? 'text-primary-700' : 'text-ink-800'}`}>{value}</dd>
    </div>
  )
}
