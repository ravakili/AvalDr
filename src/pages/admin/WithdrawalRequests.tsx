import { useState } from 'react'
import GlassCard from '../../components/ui/GlassCard'
import Avatar from '../../components/ui/Avatar'
import Badge from '../../components/ui/Badge'
import PrimaryButton from '../../components/ui/PrimaryButton'
import StatCard from '../../components/ui/StatCard'
import Modal from '../../components/ui/Modal'
import { TextArea } from '../../components/ui/InputField'
import { IconCheck, IconClose, IconWallet } from '../../components/ui/icons'
import { doctors, withdrawalRequests as seed } from '../../data/mockData'
import { formatToman, toFa } from '../../lib/utils'
import type { WithdrawalRequest } from '../../types'

const statusMeta: Record<WithdrawalRequest['status'], { tone: 'green' | 'amber' | 'red'; label: string }> = {
  approved: { tone: 'green', label: 'تأییدشده' },
  pending: { tone: 'amber', label: 'در انتظار' },
  rejected: { tone: 'red', label: 'رد شده' },
}

export default function WithdrawalRequests() {
  const [list, setList] = useState<WithdrawalRequest[]>(seed)
  const [reviewId, setReviewId] = useState<string | null>(null)
  const [note, setNote] = useState('')
  const [filter, setFilter] = useState<'all' | WithdrawalRequest['status']>('all')

  const reviewItem = reviewId ? list.find((w) => w.id === reviewId) : null
  const filtered = filter === 'all' ? list : list.filter((w) => w.status === filter)

  const decide = (status: 'approved' | 'rejected') => {
    setList((arr) =>
      arr.map((w) =>
        w.id === reviewId
          ? { ...w, status, processedAt: new Date().toISOString(), adminNote: note }
          : w,
      ),
    )
    setReviewId(null)
    setNote('')
  }

  const totalPending = list.filter((w) => w.status === 'pending').reduce((s, w) => s + w.amount, 0)
  const totalApproved = list.filter((w) => w.status === 'approved').reduce((s, w) => s + w.amount, 0)

  return (
    <div className="space-y-5">
      {/* Stats */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard title="در انتظار بررسی" value={formatToman(totalPending)} delta={`${toFa(list.filter((w) => w.status === 'pending').length)} درخواست`} trend="flat" tone="amber" icon={<IconWallet />} />
        <StatCard title="تأییدشده" value={formatToman(totalApproved)} delta="این ماه" trend="up" tone="teal" icon={<IconCheck />} />
        <StatCard title="کل درخواست‌ها" value={list.length} delta="در کل" trend="flat" tone="blue" icon={<IconWallet />} />
      </div>

      {/* Filter + table */}
      <GlassCard className="flex flex-wrap items-center justify-between gap-3 p-4">
        <div className="flex flex-wrap gap-1.5">
          {(['all', 'pending', 'approved', 'rejected'] as const).map((s) => (
            <button
              key={s}
              onClick={() => setFilter(s)}
              className={`rounded-xl px-3 py-2 text-xs font-medium transition ${filter === s ? 'bg-primary-500 text-white shadow-glass-sm' : 'bg-white/40 text-ink-500 hover:bg-white/60'}`}
            >
              {s === 'all' ? 'همه' : s === 'pending' ? 'در انتظار' : s === 'approved' ? 'تأییدشده' : 'رد شده'}
            </button>
          ))}
        </div>
      </GlassCard>

      <GlassCard className="overflow-hidden p-0">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[820px] text-right text-sm">
            <thead className="bg-white/40 text-xs text-ink-500">
              <tr>
                <th className="px-5 py-3.5 font-medium">پزشک</th>
                <th className="px-5 py-3.5 font-medium">مبلغ</th>
                <th className="px-5 py-3.5 font-medium">شماره حساب</th>
                <th className="px-5 py-3.5 font-medium">تاریخ درخواست</th>
                <th className="px-5 py-3.5 font-medium">وضعیت</th>
                <th className="px-5 py-3.5 font-medium text-left">عملیات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/40">
              {filtered.map((w) => {
                const doc = doctors.find((d) => d.id === w.doctorId)
                const meta = statusMeta[w.status]
                return (
                  <tr key={w.id} className="text-ink-700 transition hover:bg-white/40">
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-3">
                        <Avatar src={doc?.avatar || ''} size="sm" ring />
                        <span className="font-semibold text-ink-800">{w.doctorName}</span>
                      </div>
                    </td>
                    <td className="px-5 py-3 font-bold tabular text-ink-800">{formatToman(w.amount)}</td>
                    <td className="px-5 py-3 tabular text-ink-500" dir="ltr">{w.bankInfo}</td>
                    <td className="px-5 py-3 text-xs text-ink-500">
                      {new Intl.DateTimeFormat('fa-IR', { day: 'numeric', month: 'long' }).format(new Date(w.createdAt))}
                    </td>
                    <td className="px-5 py-3"><Badge tone={meta.tone} dot>{meta.label}</Badge></td>
                    <td className="px-5 py-3">
                      <div className="flex items-center justify-end gap-1">
                        {w.status === 'pending' && (
                          <>
                            <button
                              onClick={() => { setReviewId(w.id); setNote('') }}
                              className="rounded-lg px-2.5 py-1 text-xs font-medium text-primary-600 transition hover:bg-primary-50"
                            >
                              بررسی
                            </button>
                            <button
                              onClick={() => { setReviewId(w.id); setNote(''); }}
                              className="grid h-7 w-7 place-items-center rounded-lg text-emerald-500 transition hover:bg-emerald-50"
                              title="تأیید سریع"
                            >
                              <IconCheck className="h-3.5 w-3.5" />
                            </button>
                            <button
                              onClick={() => { setReviewId(w.id); setNote('') }}
                              className="grid h-7 w-7 place-items-center rounded-lg text-red-500 transition hover:bg-red-50"
                              title="رد"
                            >
                              <IconClose className="h-3.5 w-3.5" />
                            </button>
                          </>
                        )}
                        {w.status !== 'pending' && w.adminNote && (
                          <span className="text-[11px] text-ink-400">{w.adminNote}</span>
                        )}
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </GlassCard>

      {/* Review modal */}
      <Modal
        open={!!reviewItem}
        onClose={() => setReviewId(null)}
        title="بررسی درخواست برداشت"
        footer={
          <>
            <PrimaryButton icon={<IconCheck />} onClick={() => decide('approved')}>تأیید و واریز</PrimaryButton>
            <PrimaryButton variant="danger" icon={<IconClose />} onClick={() => decide('rejected')}>رد درخواست</PrimaryButton>
            <PrimaryButton variant="ghost" onClick={() => setReviewId(null)}>انصراف</PrimaryButton>
          </>
        }
      >
        {reviewItem && (
          <div className="space-y-4">
            <div className="rounded-xl bg-primary-50/60 p-4 text-sm">
              <p className="text-ink-700">پزشک: <b>{reviewItem.doctorName}</b></p>
              <p className="mt-1 text-ink-700">مبلغ: <b className="tabular">{formatToman(reviewItem.amount)}</b></p>
              <p className="mt-1 text-ink-500">شماره حساب: <span className="tabular" dir="ltr">{reviewItem.bankInfo}</span></p>
            </div>
            <TextArea
              label="یادداشت مدیر (اختیاری)"
              rows={3}
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="توضیحات برای پزشک…"
            />
          </div>
        )}
      </Modal>
    </div>
  )
}
