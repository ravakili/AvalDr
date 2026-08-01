import { useEffect, useRef, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import GlassCard from '../../components/ui/GlassCard'
import PrimaryButton from '../../components/ui/PrimaryButton'
import Avatar from '../../components/ui/Avatar'
import Badge from '../../components/ui/Badge'
import Modal from '../../components/ui/Modal'
import EmptyState from '../../components/ui/EmptyState'
import InputField, { TextArea } from '../../components/ui/InputField'
import {
  IconCalendar,
  IconChat,
  IconCheck,
  IconClock,
  IconFile,
  IconMic,
  IconMicOff,
  IconPhone,
  IconPhoneOff,
  IconPrescription,
  IconScreenShare,
  IconSend,
  IconUpload,
  IconVideo,
} from '../../components/ui/icons'
import { appointments, drugSuggestions, getPatient } from '../../data/apiData'
import { doctorName, getDoctor, refreshBackendData } from '../../data/apiData'
import { api } from '../../lib/api'
import { useAuthStore } from '../../store/authStore'
import { cn, formatDateFa, toFa } from '../../lib/utils'
import type { ChatMessage } from '../../types'
import { MdOutlineKeyboardArrowRight } from 'react-icons/md'
import { User } from 'lucide-react'
import { toast } from '../../store/toastStore'

export default function Consultation() {
  const { appointmentId } = useParams()
  const navigate = useNavigate()
  const appt = appointments.find((a) => a.id === appointmentId)
  const user = useAuthStore((state) => state.user)
  const isDoctor = user?.role === 'doctor'
  const ME = user?.id || ''

  const [messages, setMessages] = useState<ChatMessage[]>(
    [],
  )
  const [draft, setDraft] = useState('')
  const [rxOpen, setRxOpen] = useState(false)
  const [endOpen, setEndOpen] = useState(false)
  const [rxItems, setRxItems] = useState<{ drug: string; usage: string }[]>([
    { drug: '', usage: '' },
  ])
  const [rxNotes, setRxNotes] = useState('')
  const [videoActive, setVideoActive] = useState(false)
  const [callTimer, setCallTimer] = useState(0)
  const [muted, setMuted] = useState(false)
  const [cameraOff, setCameraOff] = useState(false)
  const [screenSharing, setScreenSharing] = useState(false)
  const [drugQuery, setDrugQuery] = useState('')
  const scrollRef = useRef<HTMLDivElement>(null)
  const fileRef = useRef<HTMLInputElement>(null)

  // Call timer
  useEffect(() => {
    if (!videoActive) { setCallTimer(0); return }
    const id = setInterval(() => setCallTimer((t) => t + 1), 1000)
    return () => clearInterval(id)
  }, [videoActive])

  const callTime = `${toFa(String(Math.floor(callTimer / 60)).padStart(2, '0'))}:${toFa(String(callTimer % 60).padStart(2, '0'))}`

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' })
  }, [messages])

  useEffect(() => {
    if (!appointmentId) return
    let active = true
    const fetchMessages = () =>
      api
        .get<ChatMessage[]>(`/chat/appointments/${appointmentId}/messages/`)
        .then((msgs) => { if (active) setMessages(msgs) })
        .catch(() => {})
    fetchMessages()
    const interval = setInterval(fetchMessages, 3000)
    if (isDoctor && appt?.status === 'waiting') {
      api
        .post(`/appointments/${appointmentId}/start/`)
        .then(() => refreshBackendData('doctor'))
        .catch(console.error)
    }
    return () => { active = false; clearInterval(interval) }
  }, [appointmentId, isDoctor])

  if (!appt) {
    return (
      <EmptyState
        icon={<IconChat />}
        title="مشاوره‌ای یافت نشد"
        description="این نوبت دیگر معتبر نیست."
        action={<PrimaryButton onClick={() => navigate('/doctor/appointments')}>بازگشت</PrimaryButton>}
      />
    )
  }

  const patient = getPatient(appt.patientId)!
  const doctor = getDoctor(appt.doctorId)
  const counterpart = isDoctor ? patient : doctor
  if (!counterpart) return null

  const send = async () => {
    const text = draft.trim()
    if (!text) return
    try {
      const message = await api.post<ChatMessage>(
        `/chat/appointments/${appt.id}/messages/`,
        { text, type: 'text' },
      )
      setMessages((items) => [...items, message])
      setDraft('')
      toast.success('پیام ارسال شد')
    } catch (error) {
      toast.error('ارسال پیام انجام نشد', error instanceof Error ? error.message : undefined)
    }
  }

  const submitPrescription = async () => {
    const valid = rxItems.filter((i) => i.drug.trim())
    if (!valid.length) return
    try {
      await api.post('/prescriptions/', {
        appointmentId: appt.id,
        items: valid,
        notes: rxNotes,
      })
      const nextMessages = await api.get<ChatMessage[]>(
        `/chat/appointments/${appt.id}/messages/`,
      )
      setMessages(nextMessages)
      setRxOpen(false)
      setRxItems([{ drug: '', usage: '' }])
      setRxNotes('')
      await refreshBackendData('doctor')
      toast.success('نسخه ثبت شد', 'نسخه برای بیمار ارسال شد.')
    } catch (error) {
      toast.error('ثبت نسخه انجام نشد', error instanceof Error ? error.message : undefined)
    }
  }

  return (
    <div className="flex h-[calc(100vh-9rem)] flex-col gap-4">
      {/* Header */}
      <GlassCard className="flex flex-wrap items-center gap-4 p-4">
        <button
          onClick={() => navigate(isDoctor ? '/doctor/appointments' : '/user/appointments')}
          className="grid h-9 w-9 place-items-center rounded-lg text-ink-500 hover:bg-white/60"
          aria-label="بازگشت"
        >
          <MdOutlineKeyboardArrowRight />
        </button>
        <Avatar src={counterpart.avatar} size="md" ring online />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="truncate font-bold text-ink-800">{!isDoctor && doctor ? doctorName(doctor) : counterpart.name}</h2>
            <Badge tone="green" dot>
              آنلاین
            </Badge>
          </div>
          <p className="text-xs text-ink-400">
            {isDoctor && patient ? `${patient.gender === 'male' ? 'آقا' : 'خانم'} • ${toFa(patient.age)} سال` : doctor?.specialtyName || ''}
          </p>
        </div>
        <div className="flex items-center gap-4 text-xs text-ink-500">
          <span className="hidden items-center gap-1 sm:inline-flex">
            <IconCalendar className="h-3.5 w-3.5" />
            {formatDateFa(appt.date)}
          </span>
          <span className="inline-flex items-center gap-1 tabular">
            <IconClock className="h-3.5 w-3.5" />
            {toFa(appt.time)}
          </span>
        </div>
        <div className="flex gap-2">
          {!videoActive ? (
            <PrimaryButton
              icon={<IconVideo className="h-4 w-4" />}
              onClick={() => setVideoActive(true)}
            >
              شروع ویدئو
            </PrimaryButton>
          ) : (
            <PrimaryButton
              variant="danger"
              icon={<IconPhoneOff className="h-4 w-4" />}
              onClick={() => setVideoActive(false)}
            >
              قطع تماس ({callTime})
            </PrimaryButton>
          )}
          {isDoctor && (
            <>
              <PrimaryButton
                variant="ghost"
                icon={<IconPrescription />}
                onClick={() => setRxOpen(true)}
              >
                صدور نسخه
              </PrimaryButton>
              <PrimaryButton variant="danger" onClick={() => setEndOpen(true)}>
                پایان جلسه
              </PrimaryButton>
            </>
          )}
        </div>
      </GlassCard>

      {/* Video Call Panel */}
      {videoActive && (
        <GlassCard variant="dark" className="relative overflow-hidden p-0">
          <div className="grid grid-cols-1 gap-3 p-4 sm:grid-cols-2">
            {/* Remote (patient) */}
            <div className="flex aspect-video flex-col items-center justify-center rounded-2xl bg-ink-900 text-white">
              <Avatar src={counterpart.avatar} size="xl" />
              <p className="mt-3 font-semibold">{!isDoctor && doctor ? doctorName(doctor) : counterpart.name}</p>
              <p className="text-xs text-white/60">{isDoctor ? 'بیمار' : 'پزشک'}</p>
            </div>
            {/* Local (doctor) */}
            <div className="flex aspect-video flex-col items-center justify-center rounded-2xl bg-ink-800 text-white">
              {cameraOff ? (
                <div className="grid h-16 w-16 place-items-center rounded-full bg-ink-700 text-2xl">🩺</div>
              ) : (
                <Avatar src="https://i.pravatar.cc/300?u=doctor" size="xl" />
              )}
              <p className="mt-3 font-semibold">شما</p>
              <p className="text-xs text-white/60">دکتر سارا محمدی</p>
            </div>
          </div>
          {/* Call controls */}
          <div className="absolute inset-x-0 bottom-0 flex items-center justify-center gap-3 bg-gradient-to-t from-ink-900/80 to-transparent px-4 pb-4 pt-8">
            <button
              onClick={() => setMuted(!muted)}
              className={cn(
                'grid h-12 w-12 place-items-center rounded-full transition',
                muted ? 'bg-red-500 text-white' : 'bg-white/20 text-white hover:bg-white/30',
              )}
              title={muted ? 'فعال کردن میکروفون' : 'قطع میکروفون'}
            >
              {muted ? <IconMicOff /> : <IconMic />}
            </button>
            <button
              onClick={() => setCameraOff(!cameraOff)}
              className={cn(
                'grid h-12 w-12 place-items-center rounded-full transition',
                cameraOff ? 'bg-red-500 text-white' : 'bg-white/20 text-white hover:bg-white/30',
              )}
              title={cameraOff ? 'فعال کردن دوربین' : 'قطع دوربین'}
            >
              <IconVideo className={cameraOff ? 'h-6 w-6' : 'h-5 w-5'} />
            </button>
            <button
              onClick={() => setScreenSharing(!screenSharing)}
              className={cn(
                'grid h-12 w-12 place-items-center rounded-full transition',
                screenSharing ? 'bg-primary-500 text-white' : 'bg-white/20 text-white hover:bg-white/30',
              )}
              title="اشتراک‌گذاری صفحه"
            >
              <IconScreenShare />
            </button>
            {/* Call timer badge */}
            <div className="rounded-full bg-white/20 px-3 py-1 text-xs font-semibold text-white tabular">
              {callTime}
            </div>
          </div>
        </GlassCard>
      )}

      {/* Chat body */}
      <GlassCard className="flex min-h-0 flex-1 flex-col p-0">
        <div ref={scrollRef} className="flex-1 space-y-4 overflow-y-auto p-5">
          <div className="mx-auto w-fit rounded-full bg-white/50 px-3 py-1 text-[11px] text-ink-400">
            جلسه مشاوره آغاز شد • {formatDateFa(appt.date)}
          </div>
          {messages.map((m) => {
            const mine = m.senderId === ME
            return (
              <div
                key={m.id}
                className={cn('flex gap-2.5', mine ? 'flex-row-reverse' : 'flex-row')}
              >
                <Avatar
                  src={mine ? 'https://i.pravatar.cc/300?u=doctor' : patient.avatar}
                  size="sm"
                />
                <div className={cn('max-w-[75%]', mine ? 'items-end' : 'items-start')}>
                  <div
                    className={cn(
                      'rounded-2xl px-4 py-2.5 text-sm leading-7 shadow-sm',
                      m.type === 'prescription'
                        ? 'border border-primary-200 bg-primary-50/90 text-ink-800'
                        : mine
                          ? 'rounded-tr-sm bg-primary-500 text-white'
                          : 'rounded-tl-sm bg-white/80 text-ink-800',
                    )}
                  >
                    {m.type === 'prescription' && (
                      <p className="mb-1 flex items-center gap-1 text-xs font-bold text-primary-700">
                        <IconPrescription className="h-4 w-4" /> نسخه پزشکی
                      </p>
                    )}
                    <p className="whitespace-pre-line">{m.text}</p>
                  </div>
                  <p className={cn('mt-1 text-[10px] text-ink-400', mine ? 'text-left' : 'text-right')}>
                    {m.time}
                  </p>
                </div>
              </div>
            )
          })}
        </div>

        {/* Composer */}
        <div className="border-t border-white/50 p-3">
          <div className="glass-soft flex items-end gap-2 rounded-2xl p-2">
            {isDoctor && (
              <button
                onClick={() => setRxOpen(true)}
                className="grid h-10 w-10 shrink-0 place-items-center rounded-xl text-primary-600 transition hover:bg-primary-50"
                title="ارسال نسخه"
              >
                <IconPrescription />
              </button>
            )}
            <button
              onClick={() => fileRef.current?.click()}
              className="grid h-10 w-10 shrink-0 place-items-center rounded-xl text-ink-500 transition hover:bg-primary-50"
              title="آپلود فایل"
            >
              <IconUpload />
            </button>
            <input
              ref={fileRef}
              type="file"
              className="hidden"
              accept=".pdf,.jpg,.png,.doc"
              onChange={async (e) => {
                const f = e.target.files?.[0]
                if (!f) return
                const form = new FormData()
                form.append('file', f)
                form.append('text', `📎 ${f.name}`)
                form.append('type', 'file')
                const message = await api.post<ChatMessage>(
                  `/chat/appointments/${appt.id}/messages/`,
                  form,
                )
                setMessages((items) => [...items, message])
                e.target.value = ''
              }}
            />
            <textarea
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault()
                  send()
                }
              }}
              rows={1}
              placeholder="پیام خود را بنویسید…"
              className="max-h-32 flex-1 resize-none bg-transparent px-2 py-2 text-sm text-ink-800 placeholder:text-ink-400 outline-none"
            />
            <PrimaryButton
              size="sm"
              className="h-10 w-10 !px-0"
              onClick={send}
              disabled={!draft.trim()}
              icon={<IconSend className="h-5 w-5" />}
              aria-label="ارسال"
            />
          </div>
        </div>
      </GlassCard>

      {/* Prescription modal */}
      <Modal
        open={rxOpen}
        onClose={() => setRxOpen(false)}
        title="صدور نسخه پزشکی"
        size="lg"
        footer={
          <>
            <PrimaryButton icon={<IconCheck />} onClick={submitPrescription}>
              ثبت و ارسال نسخه
            </PrimaryButton>
            <PrimaryButton variant="ghost" onClick={() => setRxOpen(false)}>
              انصراف
            </PrimaryButton>
          </>
        }
      >
        <div className="space-y-4">
          <div className="rounded-xl bg-primary-50/60 p-3 text-xs text-primary-700">
            بیمار: <b>{patient.name}</b> • نسخه پس از ثبت در چت ارسال می‌شود.
          </div>
          {rxItems.map((item, idx) => (
            <div key={idx} className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div className="relative">
                <InputField
                  label={`داروی ${toFa(idx + 1)}`}
                  placeholder="مثلاً آتورواستاتین ۲۰ میلی‌گرم"
                  value={item.drug}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                    setRxItems((arr) => arr.map((x, i) => (i === idx ? { ...x, drug: e.target.value } : x)))
                    setDrugQuery(e.target.value)
                  }}
                />
                {drugQuery.length >= 2 && (
                  <div className="glass absolute left-0 right-0 top-full z-20 mt-1 max-h-40 overflow-y-auto rounded-xl p-1">
                    {drugSuggestions
                      .filter((d) => d.includes(drugQuery))
                      .slice(0, 6)
                      .map((d) => (
                        <button
                          key={d}
                          onMouseDown={() => {
                            setRxItems((arr) => arr.map((x, i) => (i === idx ? { ...x, drug: d } : x)))
                            setDrugQuery('')
                          }}
                          className="w-full rounded-lg px-3 py-2 text-right text-sm text-ink-700 transition hover:bg-primary-50"
                        >
                          💊 {d}
                        </button>
                      ))}
                  </div>
                )}
              </div>
              <InputField
                label="نحوه مصرف"
                placeholder="مثلاً هر شب بعد از شام"
                value={item.usage}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setRxItems((arr) =>
                    arr.map((x, i) => (i === idx ? { ...x, usage: e.target.value } : x)),
                  )
                }
              />
            </div>
          ))}
          <div className="flex items-center gap-2">
            <PrimaryButton
              variant="subtle"
              size="sm"
              onClick={() => setRxItems((arr) => [...arr, { drug: '', usage: '' }])}
            >
              + افزودن داروی دیگر
            </PrimaryButton>
            {rxItems.length > 1 && (
              <PrimaryButton
                variant="ghost"
                size="sm"
                onClick={() => setRxItems((arr) => arr.slice(0, -1))}
              >
                حذف آخرین
              </PrimaryButton>
            )}
          </div>
          <TextArea
            label="توضیحات / توصیه‌ها"
            rows={3}
            placeholder="مثلاً پیگیری هفتگی فشار خون، کاهش نمک…"
            value={rxNotes}
            onChange={(e) => setRxNotes(e.target.value)}
          />
        </div>
      </Modal>

      {/* End session modal */}
      <Modal
        open={endOpen}
        onClose={() => setEndOpen(false)}
        title="پایان جلسه مشاوره"
        footer={
          <>
            <PrimaryButton
              variant="danger"
              onClick={() => {
                api.post(`/appointments/${appt.id}/complete/`).then(async () => {
                  await refreshBackendData('doctor')
                  setEndOpen(false)
                  navigate('/doctor/appointments')
                })
              }}
            >
              بله، پایان جلسه
            </PrimaryButton>
            <PrimaryButton variant="ghost" onClick={() => setEndOpen(false)}>
              ادامه مشاوره
            </PrimaryButton>
          </>
        }
      >
        <p className="text-sm leading-7 text-ink-600">
          آیا از پایان جلسه با <b className="text-ink-800">{patient.name}</b> مطمئن هستید؟
          پس از پایان، وضعیت نوبت به «تکمیل شده» تغییر می‌کند و چات بایگانی می‌شود.
        </p>
      </Modal>
    </div>
  )
}
