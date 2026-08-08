import { useMemo, useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import DatePicker from 'react-multi-date-picker'
import persian from 'react-date-object/calendars/persian'
import persian_fa from 'react-date-object/locales/persian_fa'
import type { Value } from 'react-multi-date-picker'
import GlassCard from '../../components/ui/GlassCard'
import Avatar from '../../components/ui/Avatar'
import Badge from '../../components/ui/Badge'
import PrimaryButton from '../../components/ui/PrimaryButton'
import InputField from '../../components/ui/InputField'
import EmptyState from '../../components/ui/EmptyState'
import Modal from '../../components/ui/Modal'
import { IconChevronDown, IconChevronUp, IconChat, IconFile, IconCalendar, IconSearch, IconUsers, IconClock, IconPlus } from '../../components/ui/icons'
import { appointments, doctors, getPatient, patients } from '../../data/apiData'
import { cn, formatDateFa, toFa } from '../../lib/utils'
import { useAuthStore } from '../../store/authStore'
import { api } from '../../lib/api'
import { refreshBackendData } from '../../data/apiData'
const daysOfWeek = ['شنبه', 'یکشنبه', 'دوشنبه', 'سه‌شنبه', 'چهارشنبه', 'پنجشنبه', 'جمعه']

function toGregorian(year: number, month: number, day: number): string {
  // Simple Persian-to-Gregorian conversion
  const persianEpoch = 226899;
  const totalDays = (year - 1) * 365 + Math.floor((year - 1) / 4) + persianEpoch + (month > 7 ? (month - 1) * 30 + 6 : (month - 1) * 31) + day;
  const gYear = Math.floor((totalDays - 1) / 365);
  const remaining = (totalDays - 1) % 365;
  const gMonth = remaining < 31 ? 3 : remaining < 59 ? 4 : remaining < 90 ? 5 : remaining < 120 ? 6 : remaining < 151 ? 7 : remaining < 181 ? 8 : remaining < 212 ? 9 : remaining < 243 ? 10 : remaining < 273 ? 11 : remaining < 304 ? 12 : remaining < 334 ? 1 : remaining < 365 ? 2 : 0;
  const gDay = remaining - (gMonth > 2 ? (gMonth <= 7 ? (gMonth - 3) * 31 + 30 : (gMonth - 8) * 30 + 31 * 5 - 2) : gMonth === 3 ? 30 : 0) + 1;
  return `${gYear}-${String(gMonth).padStart(2, '0')}-${String(gDay).padStart(2, '0')}`;
}

export default function PatientManagement() {
  const navigate = useNavigate()
  const ME = useAuthStore((state) => state.user?.refId || '')
  const [search, setSearch] = useState('')
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [followUpId, setFollowUpId] = useState<string | null>(null)
  const [fuDate, setFuDate] = useState<Date | null>(null)
  const [fuDateStr, setFuDateStr] = useState('')
  const [fuTime, setFuTime] = useState('')
  const [fuNote, setFuNote] = useState('')
  const [fuType, setFuType] = useState('video')

  const fuMe = doctors.find((d) => d.id === ME)
  const followUpTypeOptions = (
    [
      { value: 'chat', label: 'متنی' },
      { value: 'audio', label: 'صوتی' },
      { value: 'video', label: 'تصویری' },
    ] as const
  ).filter((t) => {
    const conf = fuMe?.communication?.[t.value]
    return conf ? conf.enabled : true
  })

  useEffect(() => {
    if (
      followUpTypeOptions.length &&
      !followUpTypeOptions.some((t) => t.value === fuType)
    ) {
      setFuType(followUpTypeOptions[0].value)
    }
  }, [followUpTypeOptions, fuType])

  useEffect(() => {
    refreshBackendData('doctor').catch(() => {})
  }, [])

  // Get unique patient IDs from my appointments
  const myPatientIds = [...new Set(appointments.filter((a) => a.doctorId === ME).map((a) => a.patientId))]
  const myPatients = myPatientIds.map((id) => getPatient(id)!).filter(Boolean)

  const filtered = search.trim()
    ? myPatients.filter((p) => p.name.includes(search.trim()) || p.city.includes(search.trim()))
    : myPatients

  const followUpPatient = followUpId ? getPatient(followUpId) : null

  const me = doctors.find((d) => d.id === ME)
  // Generate available time slots for the selected date based on doctor's working hours
  const availableSlots = useMemo(() => {
    if (!fuDateStr || !me) return []
    const persianDays = ['شنبه', 'یکشنبه', 'دوشنبه', 'سه‌شنبه', 'چهارشنبه', 'پنجشنبه', 'جمعه']
    const dateDayIndex = new Date(fuDateStr).getDay()
    const persianIndex = dateDayIndex === 6 ? 0 : dateDayIndex + 1
    const persianDay = persianDays[persianIndex]
    const daySlots = me.workingHours.filter((h) => h.day === persianDay)
    if (!daySlots.length) return []
    const slots: string[] = []
    for (const slot of daySlots) {
      const [sh, sm] = slot.from.split(':').map(Number)
      const [eh, em] = slot.to.split(':').map(Number)
      let h = sh, m = sm
      while (h < eh || (h === eh && m < em)) {
        slots.push(`${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`)
        m += 30
        if (m >= 60) { h++; m = 0 }
      }
    }
    const booked = appointments
      .filter((a) => a.doctorId === ME && a.date === fuDateStr)
      .map((a) => a.time)
    const isToday = fuDateStr === new Date().toISOString().split('T')[0]
    const nowTime = new Date().toTimeString().slice(0, 5)
    return slots.filter(
      (s) => !booked.includes(s) && (!isToday || s >= nowTime),
    )
  }, [fuDateStr, me])

  return (
    <div className="space-y-5">
      <GlassCard className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="font-bold text-ink-800">مدیریت بیماران</h2>
          <p className="text-xs text-ink-400">{toFa(myPatients.length)} بیمار ثبت‌شده</p>
        </div>
        <div className="w-72">
          <InputField
            name="q"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="جستجوی بیمار…"
            icon={<IconSearch />}
          />
        </div>
      </GlassCard>

      {filtered.length ? (
        <div className="space-y-3">
          {filtered.map((p) => {
            const isExpanded = expandedId === p.id
            const patAppts = appointments.filter((a) => a.doctorId === ME && a.patientId === p.id)
            const completedAppts = patAppts.filter((a) => a.status === 'completed').length

            return (
              <GlassCard key={p.id} hover className="overflow-hidden p-0">
                <button
                  onClick={() => setExpandedId(isExpanded ? null : p.id)}
                  className="flex w-full items-center gap-4 p-4 text-right"
                >
                  <Avatar src={p.avatar} size="md" ring />
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-bold text-ink-800">{p.name}</p>
                    <p className="truncate text-xs text-ink-400">
                      {p.gender === 'male' ? 'آقا' : 'خانم'} • {toFa(p.age)} سال • {p.city}
                    </p>
                  </div>
                  <div className="hidden gap-6 text-center sm:flex">
                    <div>
                      <p className="text-base font-bold tabular text-ink-800">{toFa(patAppts.length)}</p>
                      <p className="text-[10px] text-ink-400">نوبت</p>
                    </div>
                    <div>
                      <p className="text-base font-bold tabular text-ink-800">{toFa(completedAppts)}</p>
                      <p className="text-[10px] text-ink-400">ویزیت</p>
                    </div>
                  </div>
                  {isExpanded ? <IconChevronUp className="h-4 w-4 text-ink-400" /> : <IconChevronDown className="h-4 w-4 text-ink-400" />}
                </button>

                  {isExpanded && (
                    <div className="animate-fade-in space-y-4 border-t border-white/40 p-4">
                      {/* Insurance */}
                      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                        <div>
                          <p className="mb-1 text-[11px] text-ink-400">نوع بیمه</p>
                          <p className="text-sm font-semibold text-ink-700">{p.insuranceType || '—'}</p>
                        </div>
                        <div>
                          <p className="mb-1 text-[11px] text-ink-400">بیمه تکمیلی</p>
                          <p className="text-sm font-semibold text-ink-700">{p.supplementaryInsurance || '—'}</p>
                        </div>
                      </div>
                      {/* Medical history */}
                      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                      <div>
                        <p className="mb-1 text-[11px] text-ink-400">تشخیص‌ها</p>
                        <div className="flex flex-wrap gap-1.5">
                          {p.medicalHistory?.diagnoses.length ? (
                            p.medicalHistory.diagnoses.map((d) => (
                              <Badge key={d} tone="blue">{d}</Badge>
                            ))
                          ) : (
                            <span className="text-xs text-ink-400">—</span>
                          )}
                        </div>
                      </div>
                      <div>
                        <p className="mb-1 text-[11px] text-ink-400">حساسیت‌ها</p>
                        <div className="flex flex-wrap gap-1.5">
                          {p.medicalHistory?.allergies.length ? (
                            p.medicalHistory.allergies.map((d) => (
                              <Badge key={d} tone="red">{d}</Badge>
                            ))
                          ) : (
                            <span className="text-xs text-ink-400">—</span>
                          )}
                        </div>
                      </div>
                      <div>
                        <p className="mb-1 text-[11px] text-ink-400">داروها</p>
                        <div className="flex flex-wrap gap-1.5">
                          {p.medicalHistory?.medications.length ? (
                            p.medicalHistory.medications.map((d) => (
                              <Badge key={d} tone="teal">{d}</Badge>
                            ))
                          ) : (
                            <span className="text-xs text-ink-400">—</span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Documents */}
                    <div>
                      <p className="mb-1 text-[11px] text-ink-400">مدارک</p>
                      {p.medicalHistory?.documents?.length ? (
                        <div className="flex flex-wrap gap-2">
                          {p.medicalHistory.documents.map((doc) => (
                            <span key={doc.id} className="inline-flex items-center gap-1.5 rounded-lg bg-white/60 px-3 py-1.5 text-xs text-ink-600">
                              <IconFile className="h-3.5 w-3.5" />
                              {doc.name}
                            </span>
                          ))}
                        </div>
                      ) : (
                        <span className="text-xs text-ink-400">مدرکی بارگذاری نشده.</span>
                      )}
                    </div>

                    {/* Appointment log */}
                    <div>
                      <p className="mb-1 text-[11px] text-ink-400">سوابق نوبت</p>
                      <div className="space-y-1.5 max-h-32 overflow-y-auto">
                        {patAppts.map((a) => (
                          <div key={a.id} className="flex items-center justify-between rounded-lg bg-white/40 px-3 py-1.5 text-xs">
                            <span className="text-ink-600">{formatDateFa(a.date)} — {toFa(a.time)}</span>
                            <span className="text-ink-400">{a.reason}</span>
                            <div className="flex items-center gap-2">
                              <Badge tone={a.status === 'completed' ? 'green' : a.status === 'cancelled' ? 'red' : 'amber'}>
                                {a.status === 'completed' ? 'تکمیل' : a.status === 'cancelled' ? 'لغو' : 'فعال'}
                              </Badge>
                              {a.paymentStatus && (
                                <span className="text-[10px] text-ink-400">{a.paymentStatus === 'paid' ? 'پرداخت شده' : 'پرداخت نشده'}</span>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-2">
                      <PrimaryButton
                        size="sm"
                        variant="ghost"
                        icon={<IconChat className="h-4 w-4" />}
                        onClick={() => {
                          const appt = appointments.find((a) => a.doctorId === ME && a.patientId === p.id)
                          if (appt) navigate(`/doctor/consult/${appt.id}`)
                        }}
                      >
                        ارسال پیام
                      </PrimaryButton>
                      <PrimaryButton
                        size="sm"
                        icon={<IconCalendar className="h-4 w-4" />}
                        onClick={() => {
                          setFollowUpId(p.id)
                          setFuDate(null)
                          setFuDateStr('')
                          setFuTime('')
                          setFuNote('')
                        }}
                      >
                        نوبت پیگیری
                      </PrimaryButton>
                    </div>
                  </div>
                )}
              </GlassCard>
            )
          })}
        </div>
      ) : (
        <EmptyState
          icon={<IconUsers />}
          title="بیماری یافت نشد"
          description="جستجو را تغییر دهید."
        />
      )}

      <Modal
        open={!!followUpId}
        onClose={() => setFollowUpId(null)}
        title="نوبت پیگیری"
        size="lg"
        footer={
          <>
            <PrimaryButton
              icon={<IconCalendar />}
              disabled={!fuDateStr || !fuTime}
              onClick={async () => {
                if (!followUpId || !fuDateStr || !fuTime) return
                await api.post('/appointments/', {
                  patientId: followUpId,
                  doctorId: ME,
                  date: fuDateStr,
                  time: fuTime,
                  reason: fuNote || 'نوبت پیگیری',
                  consultType: fuType,
                  paymentStatus: 'pending',
                  isFollowUp: true,
                })
                await refreshBackendData('doctor')
                setFollowUpId(null)
              }}
            >
              ثبت نوبت
            </PrimaryButton>
            <PrimaryButton variant="ghost" onClick={() => setFollowUpId(null)}>انصراف</PrimaryButton>
          </>
        }
      >
        {followUpPatient && (
          <div className="mb-4 rounded-xl bg-primary-50/60 p-3 text-sm">
            <div className="flex items-center gap-3">
              <Avatar src={followUpPatient.avatar} size="sm" />
              <div>
                <p className="font-medium text-ink-800">{followUpPatient.name}</p>
                <p className="text-xs text-ink-500">کد: {followUpPatient.id}</p>
              </div>
            </div>
          </div>
        )}
        <p className="mb-4 text-sm text-ink-500">
          تاریخ و ساعت پیگیری را از روی ساعات کاری خود انتخاب کنید.
        </p>
        <div className="space-y-4">
          <div>
            <label className="mb-1.5 block text-sm font-medium text-ink-700">
              نوع نوبت
            </label>
            <select
              value={fuType}
              onChange={(e) => setFuType(e.target.value)}
              className="glass-input w-full rounded-xl px-4 py-2.5 text-sm text-ink-800 outline-none focus:ring-2 focus:ring-primary-200"
            >
              {followUpTypeOptions.map((t) => (
                <option key={t.value} value={t.value}>
                  {t.label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-ink-700">تاریخ (شمسی)</label>
            <DatePicker
              value={fuDate}
              onChange={(value: Value) => {
                if (value && typeof value === 'object' && 'toDate' in value) {
                  const d = (value as { toDate: () => Date }).toDate()
                  setFuDate(d)
                  setFuDateStr(d.toISOString().split('T')[0])
                  setFuTime('')
                }
              }}
              calendar={persian}
              locale={persian_fa}
              calendarPosition="bottom-right"
              inputClass="glass-input w-full rounded-xl px-4 py-2.5 text-sm text-ink-800 outline-none focus:ring-2 focus:ring-primary-200"
              containerClassName="w-full"
              format="YYYY/MM/DD"
              placeholder="انتخاب تاریخ"
            />
          </div>
          {fuDateStr && (
            <div>
              <p className="mb-2 text-sm font-medium text-ink-700">ساعت‌های در دسترس</p>
              {availableSlots.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {availableSlots.map((t) => (
                    <button
                      key={t}
                      onClick={() => setFuTime(t)}
                      className={cn(
                        'rounded-xl border px-3.5 py-2 text-xs font-medium transition',
                        fuTime === t
                          ? 'border-primary-400 bg-primary-50 text-primary-700'
                          : 'border-white/60 bg-white/50 text-ink-600 hover:bg-white/70',
                      )}
                    >
                      {toFa(t)}
                    </button>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-ink-400">برای این روز ساعات کاری تعریف نشده یا همگی رزرو شده‌اند.</p>
              )}
            </div>
          )}
          <InputField
            label="توضیحات"
            placeholder="مثلاً بررسی نتیجه آزمایش"
            name="fnote"
            value={fuNote}
            onChange={(e) => setFuNote(e.target.value)}
          />
          <p className="rounded-xl bg-amber-50/60 p-3 text-xs text-amber-700">
            پس از ثبت، نوبت با وضعیت «در انتظار پرداخت» در پروفایل بیمار نمایش داده می‌شود.
          </p>
        </div>
      </Modal>
    </div>
  )
}
