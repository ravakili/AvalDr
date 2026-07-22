import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import GlassCard from '../../components/ui/GlassCard'
import Avatar from '../../components/ui/Avatar'
import Badge from '../../components/ui/Badge'
import PrimaryButton from '../../components/ui/PrimaryButton'
import InputField from '../../components/ui/InputField'
import EmptyState from '../../components/ui/EmptyState'
import Modal from '../../components/ui/Modal'
import { IconChevronDown, IconChevronUp, IconChat, IconFile, IconCalendar, IconSearch, IconUsers } from '../../components/ui/icons'
import { appointments, doctors, getDoctor, getPatient, patients } from '../../data/mockData'
import { cn, formatDateFa, toFa } from '../../lib/utils'

const ME = 'doc-1'

export default function PatientManagement() {
  const navigate = useNavigate()
  const [search, setSearch] = useState('')
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [followUpId, setFollowUpId] = useState<string | null>(null)

  // Get unique patient IDs from my appointments
  const myPatientIds = [...new Set(appointments.filter((a) => a.doctorId === ME).map((a) => a.patientId))]
  const myPatients = myPatientIds.map((id) => getPatient(id)!).filter(Boolean)

  const filtered = search.trim()
    ? myPatients.filter((p) => p.name.includes(search.trim()) || p.city.includes(search.trim()))
    : myPatients

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
                            <Badge tone={a.status === 'completed' ? 'green' : a.status === 'cancelled' ? 'red' : 'amber'}>
                              {a.status === 'completed' ? 'تکمیل' : a.status === 'cancelled' ? 'لغو' : 'فعال'}
                            </Badge>
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
                      >
                        ارسال پیام
                      </PrimaryButton>
                      <PrimaryButton
                        size="sm"
                        icon={<IconCalendar className="h-4 w-4" />}
                        onClick={() => setFollowUpId(p.id)}
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
        size="sm"
        footer={
          <>
            <PrimaryButton icon={<IconCalendar />} onClick={() => setFollowUpId(null)}>ثبت نوبت</PrimaryButton>
            <PrimaryButton variant="ghost" onClick={() => setFollowUpId(null)}>انصراف</PrimaryButton>
          </>
        }
      >
        <p className="mb-3 text-sm text-ink-500">
          زمان و تاریخ پیگیری را مشخص کنید.
        </p>
        <div className="space-y-3">
          <InputField label="تاریخ" type="date" name="fdate" />
          <InputField label="ساعت" type="time" name="ftime" />
          <InputField label="توضیحات" placeholder="مثلاً بررسی نتیجه آزمایش" name="fnote" />
        </div>
      </Modal>
    </div>
  )
}
