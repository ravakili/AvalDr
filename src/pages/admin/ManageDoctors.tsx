import { useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import GlassCard from '../../components/ui/GlassCard'
import Avatar from '../../components/ui/Avatar'
import PrimaryButton from '../../components/ui/PrimaryButton'
import Badge from '../../components/ui/Badge'
import Modal from '../../components/ui/Modal'
import InputField, { SelectField } from '../../components/ui/InputField'
import EmptyState from '../../components/ui/EmptyState'
import {
  IconCheck,
  IconClose,
  IconEdit,
  IconFile,
  IconPlus,
  IconSearch,
  IconShield,
  IconStethoscope,
} from '../../components/ui/icons'
import { doctors as seed, getSpecialty, patients, specialties } from '../../data/mockData'
import { cn, toFa } from '../../lib/utils'
import type { Doctor } from '../../types'

type DocStatus = Doctor['status']

const statusMeta: Record<DocStatus, { tone: 'green' | 'amber' | 'red'; label: string }> = {
  approved: { tone: 'green', label: 'تأییدشده' },
  pending: { tone: 'amber', label: 'در انتظار' },
  suspended: { tone: 'red', label: 'معلق' },
}

export default function ManageDoctors() {
  const [list, setList] = useState<Doctor[]>(seed)
  const [q, setQ] = useState('')
  const [status, setStatus] = useState<DocStatus | 'all'>('all')
  const [searchParams] = useSearchParams()
  const [addOpen, setAddOpen] = useState(false)
  const [verifyId, setVerifyId] = useState<string | null>(null)

  // Add-doctor form
  const [step, setStep] = useState<'select' | 'documents'>('select')
  const [selectedUser, setSelectedUser] = useState<string | null>(null)
  const [specId, setSpecId] = useState('sp-gp')
  const [city, setCity] = useState('')
  const [hospital, setHospital] = useState('')
  const [years, setYears] = useState('')
  const [fee, setFee] = useState('')
  const [docs, setDocs] = useState({
    certificate: false,
    license: false,
    nationalId: false,
    photo: false,
  })

  useEffect(() => {
    const tab = searchParams.get('tab')
    if (tab === 'pending' || tab === 'approved' || tab === 'suspended') {
      setStatus(tab)
    }
  }, [])

  const verifyDoc = verifyId ? list.find((d) => d.id === verifyId) : null

  const filtered = useMemo(
    () =>
      list
        .filter((d) => (status === 'all' ? true : d.status === status))
        .filter((d) => (q ? d.name.includes(q) : true)),
    [list, q, status],
  )

  const availableUsers = useMemo(
    () => patients.filter((p) => !list.some((d) => d.name === p.name)).slice(0, 10),
    [list],
  )

  const setStatusOf = (id: string, s: DocStatus) =>
    setList((arr) => arr.map((d) => (d.id === id ? { ...d, status: s } : d)))

  const resetAdd = () => {
    setStep('select')
    setSelectedUser(null)
    setSpecId('sp-gp')
    setCity('')
    setHospital('')
    setYears('')
    setFee('')
    setDocs({ certificate: false, license: false, nationalId: false, photo: false })
  }

  const handleAdd = () => {
    if (!selectedUser) return
    const user = patients.find((p) => p.id === selectedUser)
    if (!user) return
    const allDocs = Object.values(docs).every(Boolean)
    const newDoc: Doctor = {
      id: `doc-${Date.now()}`,
      name: user.name,
      avatar: user.avatar,
      phone: user.phone,
      specialtyId: specId,
      city: city || user.city,
      hospital: hospital || '—',
      experienceYears: Number(years) || 0,
      rating: 0,
      reviewsCount: 0,
      fee: Number(fee) || 0,
      status: allDocs ? 'pending' : 'pending',
      bio: '',
      workingHours: [],
    }
    setList((arr) => [...arr, newDoc])
    setAddOpen(false)
    resetAdd()
  }

  return (
    <div className="space-y-5">
      {/* Toolbar */}
      <GlassCard className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-1 flex-col gap-3 sm:flex-row">
          <div className="sm:w-72">
            <InputField
              name="q"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="جستجوی پزشک…"
              icon={<IconSearch />}
            />
          </div>
          <div className="flex flex-wrap gap-1.5">
            {(['all', 'approved', 'pending', 'suspended'] as const).map((s) => (
              <button
                key={s}
                onClick={() => setStatus(s)}
                className={cn(
                  'rounded-xl px-3 py-2 text-xs font-medium transition',
                  status === s
                    ? 'bg-primary-500 text-white shadow-glass-sm'
                    : 'bg-white/40 text-ink-500 hover:bg-white/60',
                )}
              >
                {s === 'all'
                  ? 'همه'
                  : s === 'approved'
                    ? 'تأییدشده'
                    : s === 'pending'
                      ? 'در انتظار'
                      : 'معلق'}
              </button>
            ))}
          </div>
        </div>
        <PrimaryButton icon={<IconPlus />} onClick={() => { resetAdd(); setAddOpen(true) }}>
          افزودن پزشک
        </PrimaryButton>
      </GlassCard>

      {/* Table */}
      {filtered.length ? (
        <GlassCard className="overflow-hidden p-0">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[860px] text-right text-sm">
              <thead className="bg-white/40 text-xs text-ink-500">
                <tr>
                  <th className="px-5 py-3.5 font-medium">پزشک</th>
                  <th className="px-5 py-3.5 font-medium">تخصص</th>
                  <th className="px-5 py-3.5 font-medium">شهر</th>
                  <th className="px-5 py-3.5 font-medium">بیماران</th>
                  <th className="px-5 py-3.5 font-medium">وضعیت</th>
                  <th className="px-5 py-3.5 font-medium text-left">عملیات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/40">
                {filtered.map((d) => {
                  const sp = getSpecialty(d.specialtyId)
                  const meta = statusMeta[d.status]
                  return (
                    <tr key={d.id} className="text-ink-700 transition hover:bg-white/40">
                      <td className="px-5 py-3">
                        <div className="flex items-center gap-3">
                          <Avatar src={d.avatar} size="sm" ring />
                          <div className="min-w-0">
                            <p className="truncate font-semibold text-ink-800">{d.name}</p>
                            <p className="truncate text-[11px] text-ink-400">{d.phone}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-3 text-ink-500">
                        {sp?.icon} {sp?.name}
                      </td>
                      <td className="px-5 py-3 text-ink-500">{d.city}</td>
                      <td className="px-5 py-3 tabular text-ink-600">
                        {toFa(d.reviewsCount)}
                      </td>
                      <td className="px-5 py-3">
                        <Badge tone={meta.tone} dot>
                          {meta.label}
                        </Badge>
                      </td>
                      <td className="px-5 py-3">
                        <div className="flex items-center justify-end gap-1">
                          <IconAction title="مشاهده مدارک" onClick={() => setVerifyId(d.id)}>
                            <IconShield className="h-4 w-4" />
                          </IconAction>
                          {d.status === 'pending' && (
                            <IconAction
                              title="تأیید"
                              tone="green"
                              onClick={() => setStatusOf(d.id, 'approved')}
                            >
                              <IconCheck className="h-4 w-4" />
                            </IconAction>
                          )}
                          {d.status === 'approved' && (
                            <IconAction
                              title="تعلیق"
                              tone="amber"
                              onClick={() => setStatusOf(d.id, 'suspended')}
                            >
                              <IconClose className="h-4 w-4" />
                            </IconAction>
                          )}
                          {d.status === 'suspended' && (
                            <IconAction
                              title="رفع تعلیق"
                              tone="green"
                              onClick={() => setStatusOf(d.id, 'approved')}
                            >
                              <IconCheck className="h-4 w-4" />
                            </IconAction>
                          )}
                          <IconAction title="ویرایش">
                            <IconEdit className="h-4 w-4" />
                          </IconAction>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
          <div className="flex items-center justify-between border-t border-white/50 px-5 py-3 text-xs text-ink-400">
            <span>نمایش {toFa(filtered.length)} پزشک</span>
            <div className="flex items-center gap-1">
              <button className="rounded-lg px-2 py-1 hover:bg-white/60">قبلی</button>
              <span className="rounded-lg bg-primary-50 px-2.5 py-1 font-medium text-primary-700">
                {toFa(1)}
              </span>
              <button className="rounded-lg px-2 py-1 hover:bg-white/60">بعدی</button>
            </div>
          </div>
        </GlassCard>
      ) : (
        <EmptyState
          icon={<IconStethoscope />}
          title="پزشکی یافت نشد"
          description="فیلترها را تغییر دهید یا پزشک جدیدی اضافه کنید."
        />
      )}

      {/* Add doctor modal */}
      <Modal
        open={addOpen}
        onClose={() => setAddOpen(false)}
        title="افزودن پزشک"
        size="lg"
        footer={
          <>
            {step === 'select' ? (
              <>
                <PrimaryButton
                  icon={<IconCheck />}
                  disabled={!selectedUser}
                  onClick={() => setStep('documents')}
                >
                  ادامه
                </PrimaryButton>
                <PrimaryButton variant="ghost" onClick={() => setAddOpen(false)}>
                  انصراف
                </PrimaryButton>
              </>
            ) : (
              <>
                <PrimaryButton
                  icon={<IconCheck />}
                  disabled={!selectedUser}
                  onClick={handleAdd}
                >
                  ثبت پزشک
                </PrimaryButton>
                <PrimaryButton variant="ghost" onClick={() => setStep('select')}>
                  مرحله قبل
                </PrimaryButton>
              </>
            )}
          </>
        }
      >
        {step === 'select' ? (
          <div className="space-y-4">
            <p className="text-sm text-ink-500">کاربر مورد نظر را برای ثبت به عنوان پزشک انتخاب کنید:</p>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {availableUsers.map((u) => (
                <button
                  key={u.id}
                  onClick={() => setSelectedUser(u.id)}
                  className={cn(
                    'flex items-center gap-3 rounded-xl border p-3 text-right transition',
                    selectedUser === u.id
                      ? 'border-primary-400 bg-primary-50/60'
                      : 'border-white/60 bg-white/40 hover:bg-white/60',
                  )}
                >
                  <Avatar src={u.avatar} size="sm" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-semibold text-ink-800">{u.name}</p>
                    <p className="truncate text-xs text-ink-400" dir="ltr">{u.phone}</p>
                  </div>
                  {selectedUser === u.id && (
                    <IconCheck className="h-5 w-5 shrink-0 text-primary-500" />
                  )}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {(() => {
              const u = selectedUser ? patients.find((p) => p.id === selectedUser) : undefined
              if (!u) return null
              return (
              <div className="flex items-center gap-3 rounded-xl bg-primary-50/60 p-3">
                <Avatar src={u.avatar || ''} size="sm" />
                <div>
                  <p className="font-semibold text-ink-800">{u.name}</p>
                  <p className="text-xs text-ink-400">{u.phone}</p>
                </div>
              </div>
              )
            })()}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <SelectField label="تخصص" name="dspec" value={specId} onChange={(e) => setSpecId(e.target.value)}>
                {specialties.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.icon} {s.name}
                  </option>
                ))}
              </SelectField>
              <InputField label="شهر" name="dcity" value={city} onChange={(e) => setCity(e.target.value)} />
              <InputField label="بیمارستان / مطب" name="dhospital" value={hospital} onChange={(e) => setHospital(e.target.value)} />
              <InputField label="سابقه کار (سال)" name="dyears" type="number" value={years} onChange={(e) => setYears(e.target.value)} />
              <InputField
                label="تعرفه ویزیت (تومان)"
                dir="ltr"
                className="text-right"
                name="dfee"
                value={fee}
                onChange={(e) => setFee(e.target.value)}
                placeholder="200000"
              />
            </div>
            <div>
              <p className="mb-2 text-sm font-medium text-ink-700">بارگذاری مدارک (الزامی)</p>
              <div className="space-y-2">
                {[
                  { key: 'certificate', label: 'مدرک تخصص' },
                  { key: 'license', label: 'کارت نظام پزشکی' },
                  { key: 'nationalId', label: 'شناسنامه / کارت ملی' },
                  { key: 'photo', label: 'عکس پرسنلی' },
                ].map(({ key, label }) => (
                  <label
                    key={key}
                    className="flex cursor-pointer items-center gap-3 rounded-xl border border-white/60 bg-white/40 px-4 py-3 transition hover:bg-white/60"
                  >
                    <input
                      type="checkbox"
                      checked={(docs as any)[key]}
                      onChange={() => setDocs((d) => ({ ...d, [key]: !(d as any)[key] }))}
                      className="h-4 w-4 accent-primary-500"
                    />
                    <IconFile className="h-5 w-5 shrink-0 text-primary-500" />
                    <span className="text-sm text-ink-700">{label}</span>
                    {(docs as any)[key] && (
                      <span className="mr-auto rounded bg-emerald-50 px-2 py-0.5 text-[11px] font-medium text-emerald-600">
                        بارگذاری شد
                      </span>
                    )}
                  </label>
                ))}
              </div>
            </div>
            <p className="rounded-xl bg-primary-50/60 p-3 text-xs text-primary-700">
              پس از ثبت، پزشک در وضعیت «در انتظار تأیید» قرار می‌گیرد.
            </p>
          </div>
        )}
      </Modal>

      {/* Verification detail modal */}
      <Modal
        open={!!verifyDoc}
        onClose={() => setVerifyId(null)}
        title="بررسی مدارک پزشک"
        size="lg"
        footer={
          <>
            {verifyDoc?.status === 'pending' && (
              <PrimaryButton
                icon={<IconCheck />}
                onClick={() => {
                  setStatusOf(verifyDoc.id, 'approved')
                  setVerifyId(null)
                }}
              >
                تأیید مدارک
              </PrimaryButton>
            )}
            {verifyDoc && verifyDoc.status !== 'pending' && (
              <PrimaryButton
                variant={verifyDoc.status === 'approved' ? 'danger' : 'primary'}
                icon={verifyDoc.status === 'approved' ? <IconClose /> : <IconCheck />}
                onClick={() => {
                  setStatusOf(verifyDoc.id, verifyDoc.status === 'approved' ? 'suspended' : 'approved')
                  setVerifyId(null)
                }}
              >
                {verifyDoc.status === 'approved' ? 'تعلیق حساب' : 'رفع تعلیق'}
              </PrimaryButton>
            )}
            <PrimaryButton variant="ghost" onClick={() => setVerifyId(null)}>بستن</PrimaryButton>
          </>
        }
      >
        {verifyDoc && (
          <div className="space-y-4">
            <div className="flex items-center gap-4">
              <Avatar src={verifyDoc.avatar} size="lg" ring />
              <div>
                <p className="font-bold text-ink-800">{verifyDoc.name}</p>
                <p className="text-sm text-primary-600">{getSpecialty(verifyDoc.specialtyId)?.name}</p>
                <p className="text-xs text-ink-400">{verifyDoc.hospital} • {verifyDoc.city}</p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <Info label="سابقه کار" value={`${toFa(verifyDoc.experienceYears)} سال`} />
              <Info label="امتیاز" value={toFa(verifyDoc.rating.toFixed(1))} />
              <Info label="شماره پروانه" value={toFa('۱۲۳۴۵۶۷')} />
              <Info label="تلفن" value={verifyDoc.phone} />
            </div>
            <div>
              <p className="mb-2 text-sm font-medium text-ink-700">مدارک پیوست</p>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                {[
                  { name: 'مدرک تخصص', type: 'PDF' },
                  { name: 'کارت نظام پزشکی', type: 'JPG' },
                  { name: 'شناسنامه', type: 'PDF' },
                ].map((doc) => (
                  <div key={doc.name} className="flex flex-col items-center gap-2 rounded-xl border border-white/60 bg-white/50 p-4 text-center">
                    <IconFile className="h-7 w-7 text-primary-500" />
                    <span className="text-xs font-medium text-ink-700">{doc.name}</span>
                    <span className="rounded bg-primary-50 px-1.5 text-[10px] font-bold text-primary-600">{doc.type}</span>
                    <button className="text-[11px] font-medium text-primary-600 hover:underline">دانلود</button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  )
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-white/50 bg-white/40 p-3">
      <p className="text-[11px] text-ink-400">{label}</p>
      <p className="text-sm font-semibold text-ink-800 tabular">{value}</p>
    </div>
  )
}

function IconAction({
  children,
  title,
  tone = 'gray',
  onClick,
}: {
  children: React.ReactNode
  title: string
  tone?: 'gray' | 'green' | 'amber' | 'red'
  onClick?: () => void
}) {
  const tones = {
    gray: 'text-ink-400 hover:bg-ink-100 hover:text-ink-700',
    green: 'text-emerald-500 hover:bg-emerald-50',
    amber: 'text-amber-500 hover:bg-amber-50',
    red: 'text-red-500 hover:bg-red-50',
  }
  return (
    <button
      title={title}
      onClick={onClick}
      className={cn(
        'grid h-8 w-8 place-items-center rounded-lg transition',
        tones[tone],
      )}
    >
      {children}
    </button>
  )
}
