/** Convert ASCII digits in a string to Persian digits. */
export const toFa = (input: string | number): string =>
  String(input).replace(/\d/g, (d) => '۰۱۲۳۴۵۶۷۸۹'[+d])

/** Format toman amount with thousands separator + Persian digits + تومان suffix. */
export const formatToman = (n: number): string =>
  `${toFa(n.toLocaleString('en-US'))} تومان`

const faMonths = [
  'فروردین',
  'اردیبهشت',
  'خرداد',
  'تیر',
  'مرداد',
  'شهریور',
  'مهر',
  'آبان',
  'آذر',
  'دی',
  'بهمن',
  'اسفند',
]

const faWeekdays = [
  'شنبه',
  'یکشنبه',
  'دوشنبه',
  'سه‌شنبه',
  'چهارشنبه',
  'پنجشنبه',
  'جمعه',
  ]

/** Very small Gregorian→Persian-ish display (uses Intl fa-IR for correctness). */
export const formatDateFa = (iso: string): string => {
  try {
    const d = new Date(iso)
    return new Intl.DateTimeFormat('fa-IR', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
    }).format(d)
  } catch {
    return iso
  }
}

export const weekdayFa = (iso: string) => {
  try {
    return new Intl.DateTimeFormat('fa-IR', { weekday: 'long' }).format(new Date(iso))
  } catch {
    return ''
  }
}

export const shortDateFa = (iso: string) => {
  try {
    return new Intl.DateTimeFormat('fa-IR', { day: 'numeric', month: 'short' }).format(
      new Date(iso),
    )
  } catch {
    return iso
  }
}

/** Tailwind-style class joiner (filters falsy). */
export const cn = (...parts: (string | false | null | undefined)[]): string =>
  parts.filter(Boolean).join(' ')

/** Relative label for today/tomorrow. */
export const relativeDay = (iso: string): string | null => {
  const today = new Date()
  const target = new Date(iso)
  const diff = Math.round(
    (target.getTime() - new Date(today.toDateString()).getTime()) / 86400000,
  )
  if (diff === 0) return 'امروز'
  if (diff === 1) return 'فردا'
  if (diff === -1) return 'دیروز'
  return null
}

export { faMonths, faWeekdays }
