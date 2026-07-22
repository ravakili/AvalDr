import { useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import GlassCard from '../../components/ui/GlassCard'
import PrimaryButton from '../../components/ui/PrimaryButton'
import Avatar from '../../components/ui/Avatar'
import Badge from '../../components/ui/Badge'
import { TextArea } from '../../components/ui/InputField'
import Modal from '../../components/ui/Modal'
import {
  IconCalendar,
  IconChat,
  IconCheck,
  IconClock,
  IconPhone,
  IconPin,
  IconStar,
  IconVideo,
} from '../../components/ui/icons'
import { doctors, getDoctor, getSpecialty } from '../../data/mockData'
import { cn, formatToman, toFa } from '../../lib/utils'
import type { ConsultType } from '../../types'

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

  const [day, setDay] = useState(nextDays[0])
  const [time, setTime] = useState('')
  const [reason, setReason] = useState('')
  const [consultType, setConsultType] = useState<ConsultType>('video')
  const [confirm, setConfirm] = useState(false)

  const dayCards = useMemo(() => nextDays.map((iso, i) => ({ iso, ...dayLabel(iso, i) })), [])

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
            <span className="inline-flex items-center gap-1">
              <IconPin className="h-3.5 w-3.5" /> {doctor.city}
            </span>
            <span className="inline-flex items-center gap-1">
              <IconCalendar className="h-3.5 w-3.5" /> {toFa(doctor.experienceYears)} سال تجربه
            </span>
            <span className="inline-flex items-center gap-1">
              <IconClock className="h-3.5 w-3.5" /> {doctor.hospital}
            </span>
          </div>
        </div>
        <div className="rounded-2xl border border-white/50 bg-white/50 px-5 py-3 text-center">
          <p className="text-xs text-ink-400">تعرفه ویزیت</p>
          <p className="text-lg font-bold text-ink-800 tabular">{formatToman(doctor.fee)}</p>
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
                    <span
                      className={`rounded-full px-1.5 text-[9px] ${
                        active ? 'bg-white/20' : 'bg-primary-100 text-primary-700'
                      }`}
                    >
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
            <Row
              label="روز"
              value={
                new Intl.DateTimeFormat('fa-IR', {
                  weekday: 'long',
                  day: 'numeric',
                  month: 'long',
                }).format(new Date(day))
              }
            />
            <Row label="ساعت" value={time ? `${toFa(time)}` : '—'} highlight />
            <Row
              label="نوع مشاوره"
              value={consultType === 'video' ? 'ویدئویی' : consultType === 'audio' ? 'صوتی' : 'متنی'}
            />
            <Row label="تعرفه" value={formatToman(doctor.fee)} />
          </dl>

          <PrimaryButton
            className="mt-6 w-full"
            size="lg"
            disabled={!time}
            icon={<IconCheck />}
            onClick={() => setConfirm(true)}
          >
            تأیید و ثبت نوبت
          </PrimaryButton>
          <p className="mt-3 text-center text-xs text-ink-400">
            پرداخت پس از تأیید پزشک انجام می‌شود.
          </p>
        </GlassCard>
      </div>

      <Modal
        open={confirm}
        onClose={() => setConfirm(false)}
        title="نوبت با موفقیت ثبت شد"
        footer={
          <>
            <PrimaryButton
              icon={<IconCheck />}
              onClick={() => navigate('/user/appointments')}
            >
              مشاهده نوبت‌های من
            </PrimaryButton>
            <PrimaryButton variant="ghost" onClick={() => setConfirm(false)}>
              بستن
            </PrimaryButton>
          </>
        }
      >
        <div className="flex flex-col items-center gap-3 py-2 text-center">
          <div className="grid h-16 w-16 place-items-center rounded-full bg-emerald-100 text-emerald-600">
            <IconCheck className="h-8 w-8" />
          </div>
          <p className="text-ink-700">
            نوبت شما با <b>{doctor.name}</b> برای روز{' '}
            <b>
              {new Intl.DateTimeFormat('fa-IR', { day: 'numeric', month: 'long' }).format(
                new Date(day),
              )}
            </b>{' '}
            ساعت <b className="tabular">{toFa(time)}</b> ثبت شد.
          </p>
          <p className="text-xs text-ink-400">کد پیگیری: {toFa(Math.floor(Math.random() * 90000) + 10000)}</p>
        </div>
      </Modal>
    </div>
  )
}

function Row({
  label,
  value,
  highlight,
}: {
  label: string
  value: string
  highlight?: boolean
}) {
  return (
    <div className="flex items-center justify-between gap-3 border-b border-white/50 pb-3 last:border-0 last:pb-0">
      <dt className="text-ink-400">{label}</dt>
      <dd className={`font-semibold ${highlight ? 'text-primary-700' : 'text-ink-800'}`}>
        {value}
      </dd>
    </div>
  )
}
