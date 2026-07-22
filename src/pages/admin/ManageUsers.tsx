import { useMemo, useState } from 'react'
import GlassCard from '../../components/ui/GlassCard'
import Avatar from '../../components/ui/Avatar'
import Badge from '../../components/ui/Badge'
import PrimaryButton from '../../components/ui/PrimaryButton'
import InputField from '../../components/ui/InputField'
import EmptyState from '../../components/ui/EmptyState'
import Modal from '../../components/ui/Modal'
import { IconDownload, IconSearch, IconTrash, IconUsers } from '../../components/ui/icons'
import { cn, toFa } from '../../lib/utils'
import { patients } from '../../data/mockData'

export default function ManageUsers() {
  const [q, setQ] = useState('')
  const [list, setList] = useState(patients)
  const [selected, setSelected] = useState<string[]>([])
  const [confirmId, setConfirmId] = useState<string | null>(null)
  const [bulkOpen, setBulkOpen] = useState(false)

  const filtered = useMemo(
    () => list.filter((p) => (q ? p.name.includes(q) || p.phone.includes(q) || (p.email || '').includes(q) : true)),
    [list, q],
  )

  const toggleSelect = (id: string) =>
    setSelected((arr) => (arr.includes(id) ? arr.filter((x) => x !== id) : [...arr, id]))
  const toggleAll = () =>
    setSelected(selected.length === filtered.length ? [] : filtered.map((p) => p.id))

  const exportCsv = () => {
    const rows = [
      ['نام', 'تلفن', 'ایمیل', 'کد ملی', 'شهر', 'سن'],
      ...filtered.map((p) => [p.name, p.phone, p.email || '', p.nationalId, p.city, String(p.age)]),
    ]
    const csv = rows.map((r) => r.map((c) => `"${c}"`).join(',')).join('\n')
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'users.csv'
    a.click()
    URL.revokeObjectURL(url)
  }

  const bulkSuspend = () => {
    // Mock: would set status; here we just close modal
    setBulkOpen(false)
    setSelected([])
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
              اقدام گروهی ({toFa(selected.length)})
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
                        <Badge tone="green" dot>فعال</Badge>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-1">
                          <button className="rounded-lg px-2.5 py-1 text-xs font-medium text-primary-600 transition hover:bg-primary-50">
                            پروفایل
                          </button>
                          <button className="rounded-lg px-2.5 py-1 text-xs font-medium text-amber-600 transition hover:bg-amber-50">
                            تعلیق
                          </button>
                          <button
                            onClick={() => setConfirmId(p.id)}
                            className="grid h-7 w-7 place-items-center rounded-lg text-red-500 transition hover:bg-red-50"
                          >
                            <IconTrash className="h-3.5 w-3.5" />
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

      {/* Delete confirm */}
      <Modal
        open={!!confirmId}
        onClose={() => setConfirmId(null)}
        title="حذف کاربر"
        size="sm"
        footer={
          <>
            <PrimaryButton variant="danger" icon={<IconTrash />} onClick={() => {
              setList((arr) => arr.filter((x) => x.id !== confirmId))
              setConfirmId(null)
            }}>
              بله، حذف شود
            </PrimaryButton>
            <PrimaryButton variant="ghost" onClick={() => setConfirmId(null)}>انصراف</PrimaryButton>
          </>
        }
      >
        <p className="text-sm leading-7 text-ink-600">آیا از حذف این کاربر مطمئن هستید؟</p>
      </Modal>

      {/* Bulk action modal */}
      <Modal
        open={bulkOpen}
        onClose={() => setBulkOpen(false)}
        title="اقدام گروهی"
        size="sm"
        footer={
          <>
            <PrimaryButton variant="danger" onClick={bulkSuspend}>تعلیق انتخاب‌شده‌ها</PrimaryButton>
            <PrimaryButton variant="ghost" onClick={() => setBulkOpen(false)}>انصراف</PrimaryButton>
          </>
        }
      >
        <p className="text-sm leading-7 text-ink-600">
          روی {toFa(selected.length)} کاربر انتخاب‌شده اقدام می‌شود. این عملیات قابل بازگشت است.
        </p>
      </Modal>
    </div>
  )
}
