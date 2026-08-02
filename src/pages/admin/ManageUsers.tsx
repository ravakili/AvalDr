import { useEffect, useMemo, useState } from 'react'
import GlassCard from '../../components/ui/GlassCard'
import Avatar from '../../components/ui/Avatar'
import Badge from '../../components/ui/Badge'
import PrimaryButton from '../../components/ui/PrimaryButton'
import InputField, { SelectField } from '../../components/ui/InputField'
import Toggle from '../../components/ui/Toggle'
import EmptyState from '../../components/ui/EmptyState'
import Modal from '../../components/ui/Modal'
import JalaliDateSelect from '../../components/ui/JalaliDateSelect'
import {
  IconDownload,
  IconPlus,
  IconSearch,
  IconUsers,
} from '../../components/ui/icons'
import { cn, toFa } from '../../lib/utils'
import { api } from '../../lib/api'
import type { Patient } from '../../types'
import { toast } from '../../store/toastStore'

interface User extends Patient {
  suspended?: boolean
}

interface DefinitionItem {
  id: string
  name: string
}

const DEF_TYPES = ['city', 'insurance_type', 'supplementary_insurance', 'allergy', 'diagnosis']

function extractResults<T>(response: T | { results: T }): T {
  if (response && typeof response === 'object' && 'results' in response) {
    return (response as { results: T }).results
  }
  return response as T
}

export default function ManageUsers() {
  const [q, setQ] = useState('')
  const [list, setList] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [selected, setSelected] = useState<string[]>([])
  const [bulkOpen, setBulkOpen] = useState(false)
  const [profileUser, setProfileUser] = useState<User | null>(null)
  const [editingUser, setEditingUser] = useState<User | null>(null)
  const [defs, setDefs] = useState<Record<string, DefinitionItem[]>>({})
  const [editForm, setEditForm] = useState({
    name: '',
    city: '',
    nationalId: '',
    insuranceType: '',
    supplementaryInsurance: '',
    gender: '' as 'male' | 'female' | '',
    bloodType: '',
    dateOfBirth: '',
    allergies: [] as string[],
    chronicConditions: [] as string[],
    emergencyName: '',
    emergencyPhone: '',
    emergencyRelation: '',
    receiveNotifications: true,
    receivePromotions: false,
  })

  useEffect(() => {
    api.get<User[]>('/admin/users/')
      .then((data) => setList(extractResults(data)))
      .catch(console.error)
      .finally(() => setLoading(false))

    Promise.all(
      DEF_TYPES.map(async (type) => {
        try {
          const data = await api.get<DefinitionItem[]>(`/common/definitions/?type=${type}`)
          return [type, data] as const
        } catch {
          return [type, []] as const
        }
      }),
    ).then((results) => setDefs(Object.fromEntries(results)))
  }, [])

  const filtered = useMemo(
    () => list.filter((p) => (q ? p.name.includes(q) || p.phone.includes(q) : true)),
    [list, q],
  )

  const toggleSelect = (id: string) =>
    setSelected((arr) => (arr.includes(id) ? arr.filter((x) => x !== id) : [...arr, id]))
  const toggleAll = () =>
    setSelected(selected.length === filtered.length ? [] : filtered.map((p) => p.id))

  const toggleSuspend = async (id: string) => {
    const user = list.find((u) => u.id === id)
    if (!user || !user.userId) return
    const endpoint = user.suspended
      ? `/admin/users/${user.userId}/activate/`
      : `/admin/users/${user.userId}/suspend/`
    try {
      await api.post(endpoint)
      setList((arr) => arr.map((p) => (p.id === id ? { ...p, suspended: !p.suspended } : p)))
      toast.success(user.suspended ? 'حساب کاربر فعال شد' : 'حساب کاربر تعلیق شد')
    } catch (err) {
      toast.error('تغییر وضعیت کاربر انجام نشد', err instanceof Error ? err.message : undefined)
    }
  }

  const bulkSuspend = async () => {
    setBulkOpen(false)
    const ids = selected
      .map((id) => list.find((p) => p.id === id)?.userId)
      .filter((x): x is string => Boolean(x))
    setSelected([])
    try {
      await Promise.all(ids.map((userId) => api.post(`/admin/users/${userId}/suspend/`)))
      setList((arr) => arr.map((p) => (ids.includes(p.userId!) ? { ...p, suspended: true } : p)))
      toast.success(`${ids.length.toLocaleString('fa-IR')} حساب کاربری تعلیق شد`)
    } catch (err) {
      toast.error('تعلیق گروهی انجام نشد', err instanceof Error ? err.message : undefined)
    }
  }

  const openEdit = (p: User) => {
    setEditingUser(p)
    setEditForm({
      name: p.name || '',
      city: p.city || '',
      nationalId: p.nationalId || '',
      insuranceType: p.insuranceType || '',
      supplementaryInsurance: p.supplementaryInsurance || '',
      gender: p.gender || '',
      bloodType: p.bloodType || '',
      dateOfBirth: p.dateOfBirth || '',
      allergies: p.medicalHistory?.allergies ?? [],
      chronicConditions: p.medicalHistory?.diagnoses ?? [],
      emergencyName: p.emergencyContact?.name || '',
      emergencyPhone: p.emergencyContact?.phone || '',
      emergencyRelation: p.emergencyContact?.relationship || '',
      receiveNotifications: p.receiveNotifications ?? true,
      receivePromotions: p.receivePromotions ?? false,
    })
  }

  const saveEdit = async () => {
    if (!editingUser || !editingUser.userId) return
    const payload: Record<string, unknown> = {
      name: editForm.name,
      city: editForm.city,
      nationalId: editForm.nationalId,
      insuranceType: editForm.insuranceType,
      supplementaryInsurance: editForm.supplementaryInsurance,
      receiveNotifications: editForm.receiveNotifications,
      receivePromotions: editForm.receivePromotions,
      allergies: editForm.allergies,
      chronicConditions: editForm.chronicConditions,
      emergencyContact: {
        name: editForm.emergencyName,
        phone: editForm.emergencyPhone,
        relationship: editForm.emergencyRelation,
      },
    }
    if (editForm.gender) payload.gender = editForm.gender
    if (editForm.bloodType) payload.bloodType = editForm.bloodType
    payload.dateOfBirth = editForm.dateOfBirth || null
    try {
      const updated = await api.patch<User>(`/admin/users/${editingUser.userId}/`, payload)
      setList((arr) =>
        arr.map((p) => (p.id === editingUser.id ? { ...p, ...updated } : p)),
      )
      setEditingUser(null)
      toast.success('اطلاعات کاربر ویرایش شد')
    } catch (err) {
      toast.error('ویرایش کاربر انجام نشد', err instanceof Error ? err.message : undefined)
    }
  }

  const exportCsv = () => {
    const rows = [
      ['نام', 'تلفن', 'کد ملی', 'شهر', 'سن'],
      ...filtered.map((p) => [p.name, p.phone, p.nationalId, p.city, String(p.age)]),
    ]
    const csv = rows.map((r) => r.map((c) => `"${c}"`).join(',')).join('\n')
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'users.csv'
    a.click()
    URL.revokeObjectURL(url)
    toast.success('خروجی کاربران آماده شد')
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20 text-ink-400">
        در حال بارگذاری…
      </div>
    )
  }

  return (
    <div className="space-y-5">
      <GlassCard className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-1 items-center gap-3">
          <div className="w-72">
            <InputField
              name="q"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="جستجو با نام، تلفن یا ایمیل…"
              icon={<IconSearch />}
            />
          </div>
          <Badge tone="teal">{toFa(filtered.length)} کاربر</Badge>
        </div>
        <div className="flex gap-2">
          {selected.length > 0 && (
            <PrimaryButton variant="danger" size="sm" onClick={() => setBulkOpen(true)}>
              تعلیق گروهی ({toFa(selected.length)})
            </PrimaryButton>
          )}
          <PrimaryButton variant="ghost" size="sm" icon={<IconDownload className="h-4 w-4" />} onClick={exportCsv}>
            خروجی CSV
          </PrimaryButton>
        </div>
      </GlassCard>

      {filtered.length ? (
        <GlassCard className="overflow-hidden p-0">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px] text-right text-sm">
              <thead className="bg-white/40 text-xs text-ink-500">
                <tr>
                  <th className="px-4 py-3.5">
                    <input
                      type="checkbox"
                      checked={selected.length === filtered.length && filtered.length > 0}
                      onChange={toggleAll}
                      className="h-4 w-4 accent-primary-500"
                    />
                  </th>
                  <th className="px-4 py-3.5 font-medium">بیمار</th>
                  <th className="px-4 py-3.5 font-medium">کد ملی</th>
                  <th className="px-4 py-3.5 font-medium">شهر</th>
                  <th className="px-4 py-3.5 font-medium">سن</th>
                  <th className="px-4 py-3.5 font-medium">وضعیت</th>
                  <th className="px-4 py-3.5 font-medium text-left">عملیات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/40">
                {filtered.map((p) => {
                  const checked = selected.includes(p.id)
                  return (
                    <tr key={p.id} className={cn('text-ink-700 transition', checked && 'bg-primary-50/40')}>
                      <td className="px-4 py-3">
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={() => toggleSelect(p.id)}
                          className="h-4 w-4 accent-primary-500"
                        />
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <Avatar src={p.avatar} size="sm" ring />
                          <div className="min-w-0">
                            <p className="truncate font-semibold text-ink-800">{p.name}</p>
                            <p className="truncate text-[11px] text-ink-400 tabular" dir="ltr">{p.phone}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 tabular text-ink-600" dir="ltr">{toFa(p.nationalId)}</td>
                      <td className="px-4 py-3 text-ink-500">{p.city}</td>
                      <td className="px-4 py-3 tabular text-ink-600">{toFa(p.age)}</td>
                      <td className="px-4 py-3">
                        <Badge tone={p.suspended ? 'red' : 'green'} dot>
                          {p.suspended ? 'معلق' : 'فعال'}
                        </Badge>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => setProfileUser(p)}
                            className="rounded-lg px-2.5 py-1 text-xs font-medium text-primary-600 transition hover:bg-primary-50"
                          >
                            پروفایل
                          </button>
                          <button
                            onClick={() => openEdit(p)}
                            className="rounded-lg px-2.5 py-1 text-xs font-medium text-ink-600 transition hover:bg-ink-100"
                          >
                            ویرایش
                          </button>
                          <button
                            onClick={() => toggleSuspend(p.id)}
                            className="rounded-lg px-2.5 py-1 text-xs font-medium text-amber-600 transition hover:bg-amber-50"
                          >
                            {p.suspended ? 'رفع تعلیق' : 'تعلیق'}
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
          <div className="flex items-center justify-between border-t border-white/50 px-5 py-3 text-xs text-ink-400">
            <span>{selected.length > 0 ? `${toFa(selected.length)} مورد انتخاب شده` : `نمایش ${toFa(filtered.length)} کاربر`}</span>
            <div className="flex items-center gap-1">
              <button className="rounded-lg px-2 py-1 hover:bg-white/60">قبلی</button>
              <span className="rounded-lg bg-primary-50 px-2.5 py-1 font-medium text-primary-700">{toFa(1)}</span>
              <button className="rounded-lg px-2 py-1 hover:bg-white/60">بعدی</button>
            </div>
          </div>
        </GlassCard>
      ) : (
        <EmptyState
          icon={<IconUsers />}
          title="کاربری یافت نشد"
          description="عبارت دیگری را جستجو کنید."
        />
      )}

      {/* Profile modal */}
      <Modal
        open={!!profileUser}
        onClose={() => setProfileUser(null)}
        title="مشخصات کاربر"
        size="lg"
        footer={
          <PrimaryButton variant="ghost" onClick={() => setProfileUser(null)}>
            بستن
          </PrimaryButton>
        }
      >
        {profileUser && (
          <div className="space-y-5">
            <div className="flex items-center gap-4">
              <Avatar src={profileUser.avatar} size="lg" ring />
              <div>
                <p className="text-lg font-bold text-ink-800">{profileUser.name}</p>
                <p className="text-sm text-ink-400" dir="ltr">{profileUser.phone}</p>
                <Badge tone={profileUser.suspended ? 'red' : 'green'}>{profileUser.suspended ? 'معلق' : 'فعال'}</Badge>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <ProfileInfo label="کد ملی" value={toFa(profileUser.nationalId)} />
              <ProfileInfo label="سن" value={toFa(profileUser.age)} />
              <ProfileInfo label="شهر" value={profileUser.city} />
              <ProfileInfo label="نوع بیمه" value={profileUser.insuranceType || '—'} />
              <ProfileInfo label="بیمه تکمیلی" value={profileUser.supplementaryInsurance || '—'} />
              {profileUser.medicalHistory && (
                <>
                  <ProfileInfo label="تشخیص‌ها" value={profileUser.medicalHistory.diagnoses?.join('، ') || '—'} />
                  <ProfileInfo label="حساسیت‌ها" value={profileUser.medicalHistory.allergies?.join('، ') || '—'} />
                  <ProfileInfo label="داروهای مصرفی" value={profileUser.medicalHistory.medications?.join('، ') || '—'} />
                </>
              )}
            </div>
            {profileUser.medicalHistory?.documents && profileUser.medicalHistory.documents.length > 0 && (
              <div>
                <p className="mb-2 text-sm font-medium text-ink-700">مدارک</p>
                <div className="flex flex-wrap gap-2">
                  {profileUser.medicalHistory.documents.map((doc) => (
                    <span key={doc.id} className="rounded-lg border border-white/60 bg-white/50 px-3 py-1.5 text-xs text-ink-600">
                      {doc.name} ({doc.type})
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </Modal>

      {/* Bulk action modal */}
      <Modal
        open={bulkOpen}
        onClose={() => setBulkOpen(false)}
        title="تعلیق گروهی"
        size="sm"
        footer={
          <>
            <PrimaryButton variant="danger" onClick={bulkSuspend}>تعلیق انتخاب‌شده‌ها</PrimaryButton>
            <PrimaryButton variant="ghost" onClick={() => setBulkOpen(false)}>انصراف</PrimaryButton>
          </>
        }
      >
        <p className="text-sm leading-7 text-ink-600">
          روی {toFa(selected.length)} کاربر انتخاب‌شده عملیات تعلیق انجام می‌شود.
        </p>
      </Modal>

      {/* Edit user modal */}
      <Modal
        open={!!editingUser}
        onClose={() => setEditingUser(null)}
        title="ویرایش کاربر"
        size="md"
        footer={
          <>
            <PrimaryButton onClick={saveEdit}>ذخیره تغییرات</PrimaryButton>
            <PrimaryButton variant="ghost" onClick={() => setEditingUser(null)}>انصراف</PrimaryButton>
          </>
        }
      >
        {editingUser && (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 overflow-y-auto h-[calc(100vh-200px)]">
            <div className="sm:col-span-2">
              <InputField
                label="نام و نام خانوادگی"
                name="ename"
                value={editForm.name}
                onChange={(e) => setEditForm((f) => ({ ...f, name: e.target.value }))}
              />
            </div>
            <InputField
              label="کد ملی"
              name="enationalId"
              value={editForm.nationalId}
              onChange={(e) => setEditForm((f) => ({ ...f, nationalId: e.target.value }))}
            />
            <SelectField
              label="شهر"
              name="ecity"
              value={editForm.city}
              onChange={(e) => setEditForm((f) => ({ ...f, city: e.target.value }))}
            >
              <option value="">انتخاب کنید</option>
              {(defs.city || []).map((c) => (
                <option key={c.id} value={c.name}>{c.name}</option>
              ))}
            </SelectField>
            <SelectField
              label="نوع بیمه"
              name="einsurance"
              value={editForm.insuranceType}
              onChange={(e) => setEditForm((f) => ({ ...f, insuranceType: e.target.value }))}
            >
              <option value="">انتخاب کنید</option>
              {(defs.insurance_type || []).map((c) => (
                <option key={c.id} value={c.name}>{c.name}</option>
              ))}
            </SelectField>
            <SelectField
              label="بیمه تکمیلی"
              name="esupp"
              value={editForm.supplementaryInsurance}
              onChange={(e) => setEditForm((f) => ({ ...f, supplementaryInsurance: e.target.value }))}
            >
              <option value="">ندارد</option>
              {(defs.supplementary_insurance || []).map((c) => (
                <option key={c.id} value={c.name}>{c.name}</option>
              ))}
            </SelectField>
            <div className="sm:col-span-2">
              <JalaliDateSelect
                label="تاریخ تولد (شمسی)"
                value={editForm.dateOfBirth}
                onChange={(iso) => setEditForm((f) => ({ ...f, dateOfBirth: iso }))}
              />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-ink-700">
                جنسیت
              </label>
              <div className="flex gap-2">
                {[
                  { value: 'male', label: 'مرد' },
                  { value: 'female', label: 'زن' },
                ].map((g) => (
                  <button
                    key={g.value}
                    type="button"
                    onClick={() => setEditForm((f) => ({ ...f, gender: g.value as 'male' | 'female' }))}
                    className={`flex-1 rounded-xl border py-2 text-sm font-medium transition-all ${
                      editForm.gender === g.value
                        ? 'border-primary-400 bg-primary-50 text-primary-700'
                        : 'border-white/50 bg-white/40 text-ink-500 hover:bg-white/60'
                    }`}
                  >
                    {g.label}
                  </button>
                ))}
              </div>
            </div>
            <SelectField
              label="گروه خونی"
              value={editForm.bloodType}
              onChange={(e) => setEditForm((f) => ({ ...f, bloodType: e.target.value }))}
            >
              <option value="">انتخاب کنید</option>
              {['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'].map((b) => (
                <option key={b} value={b}>{b}</option>
              ))}
            </SelectField>
            <div className="sm:col-span-2">
              <ChipMultiSelect
                label="حساسیت‌ها"
                options={(defs.allergy || []).map((d) => d.name)}
                value={editForm.allergies}
                onChange={(items) => setEditForm((f) => ({ ...f, allergies: items }))}
                tone="red"
              />
            </div>
            <div className="sm:col-span-2">
              <ChipMultiSelect
                label="بیماری‌های زمینه‌ای"
                options={(defs.diagnosis || []).map((d) => d.name)}
                value={editForm.chronicConditions}
                onChange={(items) => setEditForm((f) => ({ ...f, chronicConditions: items }))}
                tone="yellow"
              />
            </div>
            <div className="sm:col-span-2 rounded-2xl border border-white/50 bg-white/40 p-4">
              <p className="mb-3 text-sm font-medium text-ink-700">تماس اضطراری</p>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <InputField
                  label="نام و نام خانوادگی"
                  name="eemergencyName"
                  value={editForm.emergencyName}
                  onChange={(e) => setEditForm((f) => ({ ...f, emergencyName: e.target.value }))}
                />
                <InputField
                  label="شماره تماس"
                  name="eemergencyPhone"
                  dir="ltr"
                  className="text-right"
                  value={editForm.emergencyPhone}
                  onChange={(e) => setEditForm((f) => ({ ...f, emergencyPhone: e.target.value.replace(/[^0-9۰-۹]/g, '').slice(0, 11) }))}
                />
                <InputField
                  label="نسبت"
                  name="eemergencyRelation"
                  value={editForm.emergencyRelation}
                  onChange={(e) => setEditForm((f) => ({ ...f, emergencyRelation: e.target.value }))}
                />
              </div>
            </div>
            <div className="sm:col-span-2 space-y-2">
              <Toggle
                label="دریافت اعلان‌ها"
                description="اعلان‌های نوبت‌ها و پیام‌ها"
                checked={editForm.receiveNotifications}
                onChange={(v) => setEditForm((f) => ({ ...f, receiveNotifications: v }))}
              />
              <Toggle
                label="دریافت پیام‌های تبلیغاتی"
                description="اخبار، تخفیف‌ها و پیشنهادهای ویژه"
                checked={editForm.receivePromotions}
                onChange={(v) => setEditForm((f) => ({ ...f, receivePromotions: v }))}
              />
            </div>
          </div>
        )}
      </Modal>
    </div>
  )
}

function ChipMultiSelect({
  label,
  options,
  value,
  onChange,
  tone,
}: {
  label: string
  options: string[]
  value: string[]
  onChange: (items: string[]) => void
  tone: 'red' | 'yellow'
}) {
  const [custom, setCustom] = useState('')
  const toggle = (item: string) =>
    onChange(value.includes(item) ? value.filter((v) => v !== item) : [...value, item])
  const addCustom = () => {
    const trimmed = custom.trim()
    if (trimmed && !value.includes(trimmed)) onChange([...value, trimmed])
    setCustom('')
  }
  const tones = {
    red: 'border-red-200 bg-red-50 text-red-700',
    yellow: 'border-yellow-200 bg-yellow-50 text-yellow-700',
  }
  const chips = [...new Set([...options, ...value])]
  return (
    <div>
      <label className="mb-1.5 block text-sm font-medium text-ink-700">{label}</label>
      <div className="flex flex-wrap gap-1.5">
        {chips.map((item) => {
          const active = value.includes(item)
          return (
            <button
              key={item}
              type="button"
              onClick={() => toggle(item)}
              className={cn(
                'rounded-full border px-3 py-1 text-xs font-medium transition',
                active
                  ? tones[tone]
                  : 'border-white/60 bg-white/40 text-ink-500 hover:bg-white/60',
              )}
            >
              {item}
            </button>
          )
        })}
      </div>
      <div className="mt-2 flex gap-2">
        <input
          value={custom}
          onChange={(e) => setCustom(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault()
              addCustom()
            }
          }}
          placeholder="مورد دلخواه"
          className="glass-input flex-1 rounded-xl px-3 py-1.5 text-sm text-ink-800 outline-none"
        />
        <button
          type="button"
          onClick={addCustom}
          className="grid h-8 w-8 place-items-center rounded-lg bg-primary-500 text-white transition hover:bg-primary-600"
        >
          <IconPlus className="h-4 w-4" />
        </button>
      </div>
    </div>
  )
}

function ProfileInfo({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-white/50 bg-white/40 p-3">
      <p className="text-[11px] text-ink-400">{label}</p>
      <p className="text-sm font-semibold text-ink-800">{value}</p>
    </div>
  )
}
