import { useEffect, useMemo, useRef, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import GlassCard from '../../components/ui/GlassCard'
import Avatar from '../../components/ui/Avatar'
import PrimaryButton from '../../components/ui/PrimaryButton'
import Badge from '../../components/ui/Badge'
import Modal from '../../components/ui/Modal'
import InputField, { SelectField } from '../../components/ui/InputField'
import EmptyState from '../../components/ui/EmptyState'
import {
  IconChat,
  IconCheck,
  IconClock,
  IconClose,
  IconDownload,
  IconEdit,
  IconFile,
  IconPhone,
  IconPlus,
  IconSearch,
  IconShield,
  IconStethoscope,
  IconTrash,
  IconUpload,
  IconVideo,
  IconWallet,
} from '../../components/ui/icons'
import { doctorName, getSpecialty } from '../../data/apiData'
import { api } from '../../lib/api'
import { cn, toFa } from '../../lib/utils'
import type {
  CommunicationSettings,
  ConsultType,
  Doctor,
  Patient,
  Specialty,
  WorkingHourSlot,
} from '../../types'
import { toast } from '../../store/toastStore'

type DocStatus = Doctor['status']
type CommState = Record<ConsultType, { enabled: boolean; fee: number }>
type DocBranch = 'profile' | 'comm' | 'hours' | 'payment' | 'docs'

interface DefinitionItem {
  id: string
  name: string
}

interface DoctorDoc {
  id: string
  type: string
  url: string
  verified: boolean
  uploadedAt: string
}

const statusMeta: Record<DocStatus, { tone: 'green' | 'amber' | 'red'; label: string }> = {
  approved: { tone: 'green', label: 'تأییدشده' },
  pending: { tone: 'amber', label: 'در انتظار' },
  suspended: { tone: 'red', label: 'معلق' },
}

const DAYS_OF_WEEK = [
  'شنبه',
  'یکشنبه',
  'دوشنبه',
  'سه‌شنبه',
  'چهارشنبه',
  'پنجشنبه',
  'جمعه',
]

const commLabels: Record<ConsultType, { label: string; icon: React.ReactNode }> = {
  chat: { label: 'چت متنی', icon: <IconChat className="h-5 w-5" /> },
  audio: { label: 'تماس صوتی', icon: <IconPhone className="h-5 w-5" /> },
  video: { label: 'تماس تصویری', icon: <IconVideo className="h-5 w-5" /> },
}

const BREAK_OPTIONS = [0, 5, 10, 15, 20, 30, 45, 60]
const DURATION_OPTIONS = [5, 10, 15, 20, 30, 45, 60, 90, 120]

const branchTabs: { key: DocBranch; label: string }[] = [
  { key: 'profile', label: 'اطلاعات پایه' },
  { key: 'comm', label: 'تعرفه و ارتباطات' },
  { key: 'hours', label: 'ساعات کاری' },
  { key: 'payment', label: 'اطلاعات پرداخت' },
  { key: 'docs', label: 'مدارک' },
]

function extractResults<T>(response: T | { results: T }): T {
  if (response && typeof response === 'object' && 'results' in response) {
    return (response as { results: T }).results
  }
  return response as T
}

interface EditForm {
  name: string
  prefix: string
  specialtyId: string
  city: string
  hospital: string
  experienceYears: string
  fee: string
  bio: string
  cardNumber: string
  accountNumber: string
  shaba: string
  branch: DocBranch
  comm: CommState
  hours: WorkingHourSlot[]
}

export default function ManageDoctors() {
  const [list, setList] = useState<Doctor[]>([])
  const [patients, setPatients] = useState<Patient[]>([])
  const [specialties, setSpecialties] = useState<Specialty[]>([])
  const [defs, setDefs] = useState<Record<string, DefinitionItem[]>>({})
  const [q, setQ] = useState('')
  const [status, setStatus] = useState<DocStatus | 'all'>('all')
  const [searchParams] = useSearchParams()
  const [addOpen, setAddOpen] = useState(false)
  const [verifyId, setVerifyId] = useState<string | null>(null)
  const [editingDoc, setEditingDoc] = useState<Doctor | null>(null)
  const [editForm, setEditForm] = useState<EditForm>({
    name: '',
    prefix: 'دکتر',
    specialtyId: '',
    city: '',
    hospital: '',
    experienceYears: '0',
    fee: '0',
    bio: '',
    cardNumber: '',
    accountNumber: '',
    shaba: '',
    branch: 'profile',
    comm: {
      chat: { enabled: true, fee: 0 },
      audio: { enabled: true, fee: 0 },
      video: { enabled: true, fee: 0 },
    },
    hours: [],
  })
  const [editDocs, setEditDocs] = useState<DoctorDoc[]>([])
  const [verifyDocs, setVerifyDocs] = useState<DoctorDoc[]>([])
  const [uploadingDoc, setUploadingDoc] = useState(false)
  const docInputRef = useRef<HTMLInputElement>(null)

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

  const patchEdit = (patch: Partial<EditForm>) =>
    setEditForm((f) => ({ ...f, ...patch }))

  useEffect(() => {
    const tab = searchParams.get('tab')
    if (tab === 'pending' || tab === 'approved' || tab === 'suspended') {
      setStatus(tab)
    }
  }, [])

  useEffect(() => {
    api.get<Doctor[]>('/admin/doctors/')
      .then((res) => setList(extractResults(res)))
      .catch(console.error)

    api.get<Patient[]>('/admin/users/')
      .then((res) => setPatients(extractResults(res)))
      .catch(() => {})

    api.get<Specialty[]>('/doctors/specialties/', false)
      .then((res) => setSpecialties(extractResults(res)))
      .catch(() => {})

    Promise.all(
      ['city', 'prefix'].map(async (type) => {
        try {
          const res = await api.get<DefinitionItem[]>(`/common/definitions/?type=${type}`)
          return [type, extractResults(res)] as const
        } catch {
          return [type, []] as const
        }
      }),
    ).then((results) => setDefs(Object.fromEntries(results)))
  }, [])

  const loadEditDocs = async (id: string) => {
    try {
      const res = await api.get<DoctorDoc[]>(`/admin/doctors/${id}/documents/`)
      setEditDocs(extractResults(res))
    } catch {
      setEditDocs([])
    }
  }

  const loadVerifyDocs = async (id: string) => {
    try {
      const res = await api.get<DoctorDoc[]>(`/admin/doctors/${id}/documents/`)
      setVerifyDocs(extractResults(res))
    } catch {
      setVerifyDocs([])
    }
  }

  useEffect(() => {
    if (verifyId) loadVerifyDocs(verifyId)
  }, [verifyId])

  const verifyDoc = verifyId ? list.find((d) => d.id === verifyId) : null

  const filtered = useMemo(
    () =>
      list
        .filter((d) => (status === 'all' ? true : d.status === status))
        .filter((d) => (q ? doctorName(d).includes(q) : true)),
    [list, q, status],
  )

  const availableUsers = useMemo(
    () => patients.filter((p) => !list.some((d) => d.name === p.name)).slice(0, 10),
    [list, patients],
  )

  const openEditDoc = (d: Doctor) => {
    setEditingDoc(d)
    setEditDocs([])
    setEditForm({
      name: d.name || '',
      prefix: d.prefix || 'دکتر',
      specialtyId: d.specialtyId,
      city: d.city || '',
      hospital: d.hospital || '',
      experienceYears: String(d.experienceYears || 0),
      fee: String(d.fee || 0),
      bio: d.bio || '',
      cardNumber: d.cardNumber || '',
      accountNumber: d.accountNumber || '',
      shaba: d.shaba || '',
      branch: 'profile',
      comm: {
        chat: {
          enabled: d.communication?.chat?.enabled ?? true,
          fee: d.communication?.chat?.fee ?? d.fee,
        },
        audio: {
          enabled: d.communication?.audio?.enabled ?? true,
          fee: d.communication?.audio?.fee ?? d.fee,
        },
        video: {
          enabled: d.communication?.video?.enabled ?? true,
          fee: d.communication?.video?.fee ?? d.fee,
        },
      },
      hours: (d.workingHours || []).map((h) => ({ ...h })),
    })
    loadEditDocs(d.id)
  }

  const saveEditDoc = async () => {
    if (!editingDoc) return
    try {
      const updated = await api.patch<Doctor>(`/admin/doctors/${editingDoc.id}/`, {
        name: editForm.name,
        prefix: editForm.prefix,
        specialtyId: editForm.specialtyId,
        city: editForm.city,
        hospital: editForm.hospital,
        experienceYears: Number(editForm.experienceYears) || 0,
        fee: Number(editForm.fee) || 0,
        bio: editForm.bio,
        cardNumber: editForm.cardNumber,
        accountNumber: editForm.accountNumber,
        shaba: editForm.shaba,
        communication: editForm.comm,
        workingHours: editForm.hours,
      })
      setList((arr) => arr.map((d) => (d.id === editingDoc.id ? { ...d, ...updated } : d)))
      setEditingDoc(null)
      toast.success('اطلاعات پزشک ویرایش شد')
    } catch (err) {
      toast.error('ویرایش پزشک انجام نشد', err instanceof Error ? err.message : undefined)
    }
  }

  const uploadDoc = async (file: File) => {
    if (!editingDoc) return
    setUploadingDoc(true)
    try {
      const form = new FormData()
      form.append('type', 'other')
      form.append('file', file)
      await api.post<DoctorDoc>(`/admin/doctors/${editingDoc.id}/documents/`, form)
      await loadEditDocs(editingDoc.id)
      toast.success('مدرک بارگذاری شد')
    } catch (err) {
      toast.error('بارگذاری مدرک انجام نشد', err instanceof Error ? err.message : undefined)
    } finally {
      setUploadingDoc(false)
      if (docInputRef.current) docInputRef.current.value = ''
    }
  }

  const deleteDoc = async (docId: string) => {
    if (!editingDoc) return
    try {
      await api.delete(`/admin/doctors/${editingDoc.id}/documents/?id=${docId}`)
      setEditDocs((arr) => arr.filter((d) => d.id !== docId))
      toast.success('مدرک حذف شد')
    } catch {
      toast.error('حذف مدرک انجام نشد')
    }
  }

  const setStatusOf = async (id: string, s: DocStatus) => {
    try {
      await api.post(`/admin/doctors/${id}/status/`, { status: s })
      setList((arr) => arr.map((d) => (d.id === id ? { ...d, status: s } : d)))
      toast.success(
        s === 'approved' ? 'پزشک تأیید شد' : s === 'suspended' ? 'حساب پزشک تعلیق شد' : 'وضعیت پزشک تغییر کرد',
      )
    } catch (err) {
      toast.error('تغییر وضعیت پزشک انجام نشد', err instanceof Error ? err.message : undefined)
    }
  }

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
      status: 'pending',
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
                            <p className="truncate font-semibold text-ink-800">{doctorName(d)}</p>
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
                          <IconAction title="ویرایش" onClick={() => openEditDoc(d)}>
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
              <SelectField label="شهر" name="dcity" value={city} onChange={(e) => setCity(e.target.value)}>
                <option value="">انتخاب کنید</option>
                {(defs.city || []).map((c) => (
                  <option key={c.id} value={c.name}>{c.name}</option>
                ))}
              </SelectField>
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
                <p className="font-bold text-ink-800">{doctorName(verifyDoc)}</p>
                <p className="text-sm text-primary-600">{getSpecialty(verifyDoc.specialtyId)?.name}</p>
                <p className="text-xs text-ink-400">{verifyDoc.hospital} • {verifyDoc.city}</p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <Info label="سابقه کار" value={`${toFa(verifyDoc.experienceYears)} سال`} />
              <Info label="امتیاز" value={toFa(verifyDoc.rating.toFixed(1))} />
              <Info label="تلفن" value={verifyDoc.phone} />
              <Info label="شهر" value={verifyDoc.city || '—'} />
            </div>
            <div>
              <p className="mb-2 text-sm font-medium text-ink-700">مدارک پیوست</p>
              {verifyDocs.length > 0 ? (
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                  {verifyDocs.map((doc) => (
                    <div key={doc.id} className="flex flex-col items-center gap-2 rounded-xl border border-white/60 bg-white/50 p-4 text-center">
                      <IconFile className="h-7 w-7 text-primary-500" />
                      <span className="truncate text-xs font-medium text-ink-700">{doc.type}</span>
                      <span className="rounded bg-primary-50 px-1.5 text-[10px] font-bold text-primary-600 uppercase">{doc.type}</span>
                      <a href={doc.url} target="_blank" rel="noreferrer" className="flex items-center gap-1 text-[11px] font-medium text-primary-600 hover:underline">
                        <IconDownload className="h-3 w-3" /> دانلود
                      </a>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-ink-400">مدرکی ثبت نشده است.</p>
              )}
            </div>
          </div>
        )}
      </Modal>

      {/* Edit doctor modal */}
      <Modal
        open={!!editingDoc}
        onClose={() => setEditingDoc(null)}
        title="ویرایش پزشک"
        size="lg"
        footer={
          <>
            <PrimaryButton onClick={saveEditDoc}>ذخیره تغییرات</PrimaryButton>
            <PrimaryButton variant="ghost" onClick={() => setEditingDoc(null)}>انصراف</PrimaryButton>
          </>
        }
      >
        {editingDoc && (
          <div className="space-y-4 overflow-y-auto h-[calc(100vh-200px)] ">
            <div className="flex flex-wrap gap-1.5 ">
              {branchTabs.map((t) => (
                <button
                  key={t.key}
                  type="button"
                  onClick={() => patchEdit({ branch: t.key })}
                  className={cn(
                    'rounded-xl px-3 py-2 text-xs font-medium transition',
                    editForm.branch === t.key
                      ? 'bg-primary-500 text-white shadow-glass-sm'
                      : 'bg-white/40 text-ink-500 hover:bg-white/60',
                  )}
                >
                  {t.label}
                </button>
              ))}
            </div>

            {editForm.branch === 'profile' && (
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="sm:col-span-2">
                  <InputField
                    label="نام و نام خانوادگی (بدون پیشوند)"
                    name="edname"
                    value={editForm.name}
                    onChange={(e) => patchEdit({ name: e.target.value })}
                  />
                </div>
                <SelectField
                  label="پیشوند"
                  name="edprefix"
                  value={editForm.prefix}
                  onChange={(e) => patchEdit({ prefix: e.target.value })}
                >
                  {(defs.prefix || []).map((p) => (
                    <option key={p.id} value={p.name}>{p.name}</option>
                  ))}
                </SelectField>
                <SelectField
                  label="تخصص"
                  name="edspec"
                  value={editForm.specialtyId}
                  onChange={(e) => patchEdit({ specialtyId: e.target.value })}
                >
                  {specialties.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.icon} {s.name}
                    </option>
                  ))}
                </SelectField>
                <SelectField
                  label="شهر"
                  name="edcity"
                  value={editForm.city}
                  onChange={(e) => patchEdit({ city: e.target.value })}
                >
                  <option value="">انتخاب کنید</option>
                  {(defs.city || []).map((c) => (
                    <option key={c.id} value={c.name}>{c.name}</option>
                  ))}
                </SelectField>
                <InputField
                  label="بیمارستان / مطب"
                  name="edhospital"
                  value={editForm.hospital}
                  onChange={(e) => patchEdit({ hospital: e.target.value })}
                />
                <InputField
                  label="سابقه کار (سال)"
                  name="edyears"
                  type="number"
                  value={editForm.experienceYears}
                  onChange={(e) => patchEdit({ experienceYears: e.target.value })}
                />
                              <div className="sm:col-span-2">
                  <InputField
                    label="بیوگرافی"
                    name="edbio"
                    value={editForm.bio}
                    onChange={(e) => patchEdit({ bio: e.target.value })}
                  />
                </div>
              </div>
            )}

            {editForm.branch === 'comm' && (
              <AdminCommEditor
                comm={editForm.comm}
                onChange={(comm) => patchEdit({ comm })}
              />
            )}

            {editForm.branch === 'hours' && (
              <AdminHoursEditor
                hours={editForm.hours}
                onChange={(hours) => patchEdit({ hours })}
              />
            )}

            {editForm.branch === 'payment' && (
              <div className="space-y-4">
                <p className="text-xs text-ink-400">اطلاعات بانکی برای واریز درآمدها.</p>
                <InputField
                  label="شماره کارت"
                  name="edcard"
                  dir="ltr"
                  className="text-right"
                  value={editForm.cardNumber}
                  onChange={(e) => patchEdit({ cardNumber: e.target.value })}
                  placeholder="6037-XXXX-XXXX-XXXX"
                />
                <InputField
                  label="شماره حساب"
                  name="edaccount"
                  dir="ltr"
                  className="text-right"
                  value={editForm.accountNumber}
                  onChange={(e) => patchEdit({ accountNumber: e.target.value })}
                />
                <InputField
                  label="شماره شبا"
                  name="edshaba"
                  dir="ltr"
                  className="text-right"
                  value={editForm.shaba}
                  onChange={(e) => patchEdit({ shaba: e.target.value })}
                  placeholder="IRXXXXXXXXXXXXXXXXXXX"
                />
              </div>
            )}

            {editForm.branch === 'docs' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium text-ink-700">مدارک پزشک</p>
                  <button
                    type="button"
                    onClick={() => docInputRef.current?.click()}
                    disabled={uploadingDoc}
                    className="flex items-center gap-1.5 rounded-xl bg-primary-500 px-3 py-2 text-xs font-medium text-white transition hover:bg-primary-600 disabled:opacity-50"
                  >
                    {uploadingDoc ? (
                      <IconClock className="h-4 w-4 animate-spin" />
                    ) : (
                      <IconUpload className="h-4 w-4" />
                    )}
                    {uploadingDoc ? 'در حال بارگذاری…' : 'افزودن مدرک'}
                  </button>
                  <input
                    ref={docInputRef}
                    type="file"
                    className="hidden"
                    accept=".pdf,.jpg,.jpeg,.png"
                    onChange={(e) => {
                      const file = e.target.files?.[0]
                      if (file) uploadDoc(file)
                    }}
                  />
                </div>
                {editDocs.length > 0 ? (
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    {editDocs.map((doc) => (
                      <div
                        key={doc.id}
                        className="flex items-center gap-3 rounded-xl border border-white/60 bg-white/50 p-3"
                      >
                        <IconFile className="h-6 w-6 shrink-0 text-primary-500" />
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-medium text-ink-700">{doc.type}</p>
                          <p className="truncate text-[11px] text-ink-400" dir="ltr">{doc.type}</p>
                        </div>
                        <a
                          href={doc.url}
                          target="_blank"
                          rel="noreferrer"
                          className="grid h-8 w-8 place-items-center rounded-lg text-ink-500 transition hover:bg-primary-50 hover:text-primary-600"
                          title="دانلود"
                        >
                          <IconDownload className="h-4 w-4" />
                        </a>
                        <button
                          onClick={() => deleteDoc(doc.id)}
                          className="grid h-8 w-8 place-items-center rounded-lg text-ink-400 transition hover:bg-red-50 hover:text-red-500"
                          title="حذف"
                        >
                          <IconTrash className="h-4 w-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-ink-400">مدرکی برای این پزشک ثبت نشده است.</p>
                )}
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  )
}

function AdminCommEditor({
  comm,
  onChange,
}: {
  comm: CommState
  onChange: (comm: CommState) => void
}) {
  const [error, setError] = useState('')
  const update = (type: ConsultType, patch: Partial<{ enabled: boolean; fee: number }>) =>
    onChange({ ...comm, [type]: { ...comm[type], ...patch } })
  const toggle = (type: ConsultType) => {
    const next = { ...comm, [type]: { ...comm[type], enabled: !comm[type].enabled } }
    if (!Object.values(next).some((c) => c.enabled)) {
      setError('حداقل یکی از روش‌های ارتباطی باید فعال باشد')
      return
    }
    setError('')
    onChange(next)
  }
  const setFee = (type: ConsultType, value: string) => {
    const num = Number(value.replace(/[^0-9]/g, '')) || 0
    onChange({ ...comm, [type]: { ...comm[type], fee: num } })
  }
  return (
    <div className="space-y-3">
      <p className="text-xs text-ink-400">روش‌های مشاوره و تعرفه هر یک را تنظیم کنید.</p>
      {(Object.keys(commLabels) as ConsultType[]).map((type) => (
        <div
          key={type}
          className={cn(
            'rounded-2xl border p-4 transition-all',
            comm[type].enabled ? 'border-primary-300 bg-primary-50/60' : 'border-white/50 bg-white/40',
          )}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div
                className={cn(
                  'grid h-10 w-10 place-items-center rounded-xl transition-all',
                  comm[type].enabled ? 'bg-primary-500 text-white' : 'bg-white/60 text-ink-400',
                )}
              >
                {commLabels[type].icon}
              </div>
              <span className="text-sm font-medium text-ink-700">{commLabels[type].label}</span>
            </div>
            <button
              type="button"
              role="switch"
              aria-checked={comm[type].enabled}
              onClick={() => toggle(type)}
              className={cn(
                'relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors',
                comm[type].enabled ? 'bg-primary-500' : 'bg-ink-200',
              )}
            >
              <span
                className={cn(
                  'inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform',
                  comm[type].enabled ? '-translate-x-6' : '-translate-x-1',
                )}
              />
            </button>
          </div>
          {comm[type].enabled && (
            <div className="mt-3 animate-fade-in">
              <label className="mb-1 block text-xs font-medium text-ink-500">
                تعرفه ویزیت (
                {type === 'chat' ? 'چت' : type === 'audio' ? 'صوتی' : 'تصویری'}
                )
              </label>
              <div className="relative">
                <input
                  type="text"
                  inputMode="numeric"
                  value={comm[type].fee.toLocaleString('en-US')}
                  onChange={(e) => setFee(type, e.target.value)}
                  className="glass-input w-full rounded-xl py-2 pr-3 pl-16 text-left text-sm tabular text-ink-800 outline-none transition focus:border-primary-300 focus:ring-2 focus:ring-primary-200"
                />
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-ink-400">
                  تومان
                </span>
              </div>
            </div>
          )}
        </div>
      ))}
      {error && <p className="text-xs text-red-500">{error}</p>}
    </div>
  )
}

function AdminHoursEditor({
  hours,
  onChange,
}: {
  hours: WorkingHourSlot[]
  onChange: (hours: WorkingHourSlot[]) => void
}) {
  const [error, setError] = useState('')
  const isOverlap = (
    day: string,
    from: string,
    to: string,
    excludeIdx?: number,
  ) =>
    hours.some(
      (h, i) =>
        i !== excludeIdx &&
        h.day === day &&
        ((from >= h.from && from < h.to) ||
          (to > h.from && to <= h.to) ||
          (from <= h.from && to >= h.to)),
    )

  const addSlot = (day: string, from: string, to: string) => {
    if (from >= to) return
    if (isOverlap(day, from, to)) {
      setError('این بازه با بازه‌های تعریف‌شده تداخل دارد')
      return
    }
    setError('')
    onChange([
      ...hours,
      { day, from, to, breakMinutes: 15, appointmentDurationMinutes: 30 },
    ])
  }

  const updateSlot = (idx: number, patch: Partial<WorkingHourSlot>) => {
    const updated = hours.map((h, i) => (i === idx ? { ...h, ...patch } : h))
    const item = updated[idx]
    if (isOverlap(item.day, item.from, item.to, idx)) {
      setError('این بازه با بازه‌های تعریف‌شده تداخل دارد')
      return
    }
    setError('')
    onChange(updated)
  }

  const removeSlot = (idx: number) => onChange(hours.filter((_, i) => i !== idx))

  const hoursByDay = DAYS_OF_WEEK.map((day) => ({
    day,
    slots: hours.filter((h) => h.day === day),
  }))

  return (
    <div className="space-y-3">
      <p className="text-xs text-ink-400">
        تعریف بازه‌های زمانی برای هر روز هفته. بازه‌های متداخل مجاز نیستند.
      </p>
      {error && <p className="text-xs text-red-500">{error}</p>}
      {hoursByDay.map(({ day, slots }) => {
        const slotIdxs = slots
          .map((s) => hours.indexOf(s))
          .filter((i) => i >= 0)
        return (
          <div key={day} className="glass-soft overflow-hidden rounded-2xl">
            <div className="flex items-center justify-between bg-white/30 px-4 py-2.5">
              <span className="text-sm font-semibold text-ink-700">{day}</span>
              <span className="text-[11px] text-ink-400 tabular">
                {slots.length > 0 ? `${slots.length} بازه` : 'تعریف نشده'}
              </span>
            </div>
            {slotIdxs.length > 0 && (
              <div className="space-y-1.5 p-3 flex flex-wrap gap-1">
                {slotIdxs.map((idx) => (
                  <div key={idx} className="rounded-xl border border-primary-500 bg-primary-100 p-2.5 max-w-[320px]">
                    <div className="flex items-center gap-2 bg-primary-100 rounded-lg px-2">
                      <span className="text-xs text-ink-400">از</span>
                      <input
                        type="time"
                        value={hours[idx].from}
                        onChange={(e) => updateSlot(idx, { from: e.target.value })}
                        className="min-w-[90px] flex-1 rounded-lg bg-transparent px-1 py-1 text-sm tabular text-ink-700 outline-none"
                      />
                      <span className="text-xs text-ink-400">تا</span>
                      <input
                        type="time"
                        value={hours[idx].to}
                        onChange={(e) => updateSlot(idx, { to: e.target.value })}
                        className="min-w-[90px] flex-1 rounded-lg bg-transparent px-1 py-1 text-sm tabular text-ink-700 outline-none"
                      />
                      <button
                        onClick={() => removeSlot(idx)}
                        className="grid h-7 w-7 shrink-0 place-items-center rounded-lg text-ink-400 hover:bg-red-50 hover:text-red-500"
                      >
                        <IconTrash className="h-3.5 w-3.5" />
                      </button>
                    </div>
                    <div className="mt-1.5 flex items-center gap-4 pr-1 flex-wrap">
                      <div className="flex items-center gap-2">
                        <span className="text-[11px] text-ink-400">استراحت:</span>
                        <select
                          value={hours[idx].breakMinutes ?? 15}
                          onChange={(e) => updateSlot(idx, { breakMinutes: Number(e.target.value) })}
                          className="rounded-lg border border-white/50 bg-white/50 px-2 py-1 text-xs tabular text-ink-700 outline-none"
                        >
                          {BREAK_OPTIONS.map((v) => (
                            <option key={v} value={v}>{v}</option>
                          ))}
                        </select>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-[11px] text-ink-400">مدت ویزیت:</span>
                        <select
                          value={hours[idx].appointmentDurationMinutes ?? 30}
                          onChange={(e) => updateSlot(idx, { appointmentDurationMinutes: Number(e.target.value) })}
                          className="rounded-lg border border-white/50 bg-white/50 px-2 py-1 text-xs tabular text-ink-700 outline-none"
                        >
                          {DURATION_OPTIONS.map((v) => (
                            <option key={v} value={v}>{v}</option>
                          ))}
                        </select>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
            <AdminSlotAdder day={day} onAdd={addSlot} />
          </div>
        )
      })}
    </div>
  )
}

function AdminSlotAdder({ day, onAdd }: { day: string; onAdd: (day: string, from: string, to: string) => void }) {
  const [from, setFrom] = useState('08:00')
  const [to, setTo] = useState('10:00')
  return (
    <div className="flex items-center gap-2 border-t border-primary-200 bg-primary-100 px-3 py-2">
      <input
        type="time"
        value={from}
        onChange={(e) => setFrom(e.target.value)}
        className="min-w-[80px] flex-1 rounded-lg border border-white/50 bg-white/50 px-2 py-1.5 text-sm tabular text-ink-700 outline-none"
      />
      <span className="text-xs text-ink-400">تا</span>
      <input
        type="time"
        value={to}
        onChange={(e) => setTo(e.target.value)}
        className="min-w-[80px] flex-1 rounded-lg border border-white/50 bg-white/50 px-2 py-1.5 text-sm tabular text-ink-700 outline-none"
      />
      <button
        onClick={() => onAdd(day, from, to)}
        className="flex items-center gap-1 rounded-lg bg-primary-500 px-3 py-1.5 text-xs font-medium text-white transition hover:bg-primary-600 active:scale-[.97]"
      >
        <IconPlus className="h-3.5 w-3.5" />
        افزودن بازه
      </button>
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