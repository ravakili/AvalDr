import { useEffect, useMemo, useState } from 'react'
import GlassCard from '../../components/ui/GlassCard'
import Avatar from '../../components/ui/Avatar'
import Badge from '../../components/ui/Badge'
import PrimaryButton from '../../components/ui/PrimaryButton'
import InputField from '../../components/ui/InputField'
import EmptyState from '../../components/ui/EmptyState'
import Modal from '../../components/ui/Modal'
import {
  IconDownload,
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

  useEffect(() => {
    api.get<User[]>('/admin/users/')
      .then((data) => setList(extractResults(data)))
      .catch(console.error)
      .finally(() => setLoading(false))
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
    if (!user) return
    const endpoint = user.suspended
      ? `/admin/users/${id}/activate/`
      : `/admin/users/${id}/suspend/`
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
    const ids = [...selected]
    setSelected([])
    try {
      await Promise.all(ids.map((id) => api.post(`/admin/users/${id}/suspend/`)))
      setList((arr) => arr.map((p) => (ids.includes(p.id) ? { ...p, suspended: true } : p)))
      toast.success(`${ids.length.toLocaleString('fa-IR')} حساب کاربری تعلیق شد`)
    } catch (err) {
      toast.error('تعلیق گروهی انجام نشد', err instanceof Error ? err.message : undefined)
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
