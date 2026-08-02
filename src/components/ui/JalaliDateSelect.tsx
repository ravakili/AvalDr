import { useMemo, useState } from 'react'
import { cn, toFa } from '../../lib/utils'
import {
  JALALI_MONTH_NAMES,
  jalaliMonthLength,
  jalaliNow,
  toGregorian,
  toJalali,
} from '../../lib/jalali'

interface Props {
  value: string // ISO date "YYYY-MM-DD" or ""
  onChange: (iso: string) => void
  label?: string
  maxAge?: number
  error?: string
}

const selectClass =
  'glass-input w-full rounded-xl px-3 py-2.5 text-ink-800 outline-none transition focus:border-primary-300 focus:ring-2 focus:ring-primary-200'

export default function JalaliDateSelect({ value, onChange, label, maxAge, error }: Props) {
  const now = useMemo(() => jalaliNow(), [])
  const [maxYear, minYear] = [now.jy, now.jy - (maxAge ?? 120)]

  const parts = useMemo(() => {
    if (!value) return { year: '', month: '', day: '' }
    try {
      const j = toJalali(value)
      return { year: String(j.jy), month: String(j.jm), day: String(j.jd) }
    } catch {
      return { year: '', month: '', day: '' }
    }
  }, [value])

  const [draft, setDraft] = useState<{ year: string; month: string; day: string } | null>(null)
  const y = draft?.year ?? parts.year
  const m = draft?.month ?? parts.month
  const d = draft?.day ?? parts.day

  const yearNum = Number(y)
  const monthNum = Number(m)
  const dayCount = yearNum && monthNum ? jalaliMonthLength(yearNum, monthNum) : 31

  const years = useMemo(() => {
    const arr: number[] = []
    for (let yr = maxYear; yr >= minYear; yr -= 1) arr.push(yr)
    return arr
  }, [maxYear, minYear])

  const apply = (next: { year: string; month: string; day: string }) => {
    setDraft(next)
    const yNum = Number(next.year)
    const mNum = Number(next.month)
    const dNum = Number(next.day)
    const maxDay = yNum && mNum ? jalaliMonthLength(yNum, mNum) : 31
    const dayClamped = Math.min(dNum || 1, maxDay)
    if (yNum && mNum && dayClamped) {
      try {
        const gregorian = toGregorian({ jy: yNum, jm: mNum, jd: dayClamped })
        onChange(
          `${gregorian.getFullYear()}-${String(gregorian.getMonth() + 1).padStart(2, '0')}-${String(
            gregorian.getDate(),
          ).padStart(2, '0')}`,
        )
      } catch {
        /* ignore invalid combo */
      }
    } else if (next.year === '' && next.month === '' && next.day === '') {
      onChange('')
    }
  }

  const changeYear = (v: string) => {
    apply({ year: v, month: m, day: d })
  }
  const changeMonth = (v: string) => {
    apply({ year: y, month: v, day: d })
  }
  const changeDay = (v: string) => {
    apply({ year: y, month: m, day: v })
  }

  return (
    <div className="w-full">
      {label && <label className="mb-1.5 block text-sm font-medium text-ink-700">{label}</label>}
      <div className="grid grid-cols-3 gap-2">
        <select value={y} onChange={(e) => changeYear(e.target.value)} className={selectClass}>
          <option value="">سال</option>
          {years.map((yr) => (
            <option key={yr} value={yr}>
              {toFa(yr)}
            </option>
          ))}
        </select>
        <select value={m} onChange={(e) => changeMonth(e.target.value)} className={selectClass}>
          <option value="">ماه</option>
          {JALALI_MONTH_NAMES.map((name, idx) => (
            <option key={name} value={idx + 1}>
              {name}
            </option>
          ))}
        </select>
        <select value={d} onChange={(e) => changeDay(e.target.value)} className={selectClass}>
          <option value="">روز</option>
          {Array.from({ length: dayCount }, (_, i) => i + 1).map((day) => (
            <option key={day} value={day}>
              {toFa(day)}
            </option>
          ))}
        </select>
      </div>
      {error && <p className={cn('mt-1 text-xs text-red-500')}>{error}</p>}
    </div>
  )
}
