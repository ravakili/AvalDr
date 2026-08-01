import { useMemo, useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import GlassCard from '../../components/ui/GlassCard'
import PrimaryButton from '../../components/ui/PrimaryButton'
import Avatar from '../../components/ui/Avatar'
import Badge from '../../components/ui/Badge'
import { TextArea } from '../../components/ui/InputField'
import { cn, formatToman, toFa } from '../../lib/utils'
import { doctorName, getDoctor, getSpecialty, refreshBackendData } from '../../data/apiData'
import { api } from '../../lib/api'
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
import { toast } from '../../store/toastStore'

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

const nowTimeStr = () => {
  const d = new Date()
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
}

const fallbackSlots = ['09:00', '10:30', '12:00', '14:30', '16:00', '17:30', '19:00']

export default function BookAppointment() {
  const { doctorId } = useParams()
  const navigate = useNavigate()
  const doctor = doctorId ? getDoctor(doctorId) : undefined
  const user = useAuthStore((s) => s.user)

  const [day, setDay] = useState(nextDays[0])
  const [time, setTime] = useState('')
  const [reason, setReason] = useState('')
  const [consultType, setConsultType] = useState<ConsultType>('video')
  const [rawSlots, setRawSlots] = useState<{ time: string; available: boolean }[]>([])

  const isToday = day === nextDays[0]
  const currentTime = nowTimeStr()

  const dayCards = useMemo(() => nextDays.map((iso, i) => ({ iso, ...dayLabel(iso, i) })), [])

  const slots = useMemo(() => {
    return rawSlots
      .filter((s) => s.available)
      .filter((s) => !isToday || s.time >= currentTime)
      .map((s) => s.time)
  }, [rawSlots, isToday, currentTime])

  useEffect(() => {
    if (!doctor) return
    api
      .get<{ slots: { time: string; available: boolean }[] }>(
        `/doctors/${doctor.id}/slots/?date=${day}`,
        false,
      )
      .then((response) => {
        setRawSlots(response.slots)
        setTime((current) => (response.slots.some((s) => s.time === current && s.available) ? current : ''))
      })
      .catch(() => {
        setRawSlots(fallbackSlots.map((t) => ({ time: t, available: true })))
      })
  }, [doctor, day])

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

  const handleSubmit = async () => {
    if (!time || !user) return
    let createdAppointment: Appointment | null = null
    try {
      const appt = await api.post<Appointment>('/appointments/', {
        doctorId: doctor.id,
        date: day,
        time,
        reason,
        consultType,
      })
      createdAppointment = appt
      const payment = await api.post<{ id: string; gatewayUrl: string }>(`/appointments/${appt.id}/payment/`)
      toast.info('انتقال به درگاه', 'برای تکمیل رزرو به سندباکس زرین‌پال منتقل می‌شوید.')
      window.location.assign(payment.gatewayUrl)
    } catch (error) {
      if (createdAppointment) {
        toast.error(
          'انتقال به درگاه ناموفق بود',
          'نوبت شما ذخیره شد و از بخش «نوبت‌های من» می‌توانید پرداخت را مجدداً انجام دهید.',
        )
        return
      }
      toast.error('ثبت نوبت انجام نشد', error instanceof Error ? error.message : undefined)
    }
  }

  const commFee = {
    chat: 100000,
    audio: 150000,
    video: 250000,
  }

  return (
    <div className="space-y-6">
      <GlassCard className="p-5">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
          <Avatar src={doctor.avatar} size="xl" ring />
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-xl font-bold text-ink-800">{doctorName(doctor)}</h2>
              <Badge tone="amber">
                <IconStar className="h-3 w-3" /> {toFa(doctor.rating.toFixed(1))}
              </Badge>
              {doctor.verified && <Badge tone="green">تأیید شده</Badge>}
            </div>
            <p className="mt-1 text-sm text-primary-600">
              {specialty?.icon} {specialty?.name}
            </p>
            <p className="mt-2 text-sm leading-6 text-ink-500">{doctor.bio}</p>
            <div className="mt-3 flex flex-wrap gap-x-5 gap-y-2 text-xs text-ink-500">
              <span className="inline-flex items-center gap-1"><IconPin className="h-3.5 w-3.5" /> {doctor.city}</span>
              <span className="inline-flex items-center gap-1"><IconCalendar className="h-3.5 w-3.5" /> {toFa(doctor.experienceYears)} سال تجربه</span>
              <span className="inline-flex items-center gap-1"><IconStar className="h-3.5 w-3.5" /> {toFa(doctor.rating.toFixed(1))} ({toFa(doctor.reviewsCount)} نظر)</span>
            </div>
            <div className="mt-3 flex flex-wrap items-center gap-2 rounded-xl border border-white/50 bg-white/40 p-3">
              <IconPin className="h-4 w-4 shrink-0 text-primary-500" />
              <div>
                <p className="text-sm font-medium text-ink-800">{doctor.hospital}</p>
                <p className="text-xs text-ink-400">{doctor.city}</p>
              </div>
            </div>
          </div>
          <div className="shrink-0 rounded-2xl border border-white/50 bg-white/50 px-5 py-3 text-center">
            <p className="text-xs text-ink-400">تعرفه ویزیت</p>
            <p className="text-lg font-bold text-ink-800 tabular">{formatToman(commFee[consultType])}</p>
          </div>
        </div>

        {doctor.workingHours.length > 0 && (
          <div className="mt-4 border-t border-white/50 pt-4">
            <p className="mb-2 text-sm font-medium text-ink-700">روزها و ساعات در دسترس</p>
            <div className="flex flex-wrap gap-2">
              {doctor.workingHours.map((wh, i) => (
                <div key={i} className="rounded-xl border border-white/50 bg-white/40 px-3 py-2 text-xs">
                  <span className="font-semibold text-ink-800">{wh.day}</span>
                  <span className="mx-1 text-ink-300">|</span>
                  <span className="tabular text-ink-600">{toFa(wh.from)} تا {toFa(wh.to)}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </GlassCard>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <GlassCard className="p-6 lg:col-span-2">
          <h3 className="mb-1 font-bold text-ink-800">انتخاب روز</h3>
          <p className="mb-4 text-xs text-ink-400">هفت روز آینده</p>
          <div className="grid grid-cols-3 gap-3 sm:grid-cols-7">
            {dayCards.map((d) => {
              const active = d.iso === day
              return (
                <button
                  key={d.iso}
                  onClick={() => { setDay(d.iso); setTime('') }}
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

          <h3 className="mb-1 mt-6 font-bold text-ink-800">انتخاب ساعت</h3>
          <p className="mb-4 text-xs text-ink-400">ساعات خالی</p>
          <div className="grid grid-cols-3 gap-3 sm:grid-cols-4">
            {slots.length > 0 ? slots.map((s) => {
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
            }) : (
              <p className="col-span-full py-4 text-center text-sm text-ink-400">هیچ ساعتی در این روز خالی نیست.</p>
            )}
          </div>

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

        <GlassCard variant="soft" className="h-fit p-6">
          <h3 className="font-bold text-ink-800">خلاصه نوبت</h3>
          <dl className="mt-4 space-y-3 text-sm">
            <Row label="پزشک" value={doctorName(doctor)} />
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
