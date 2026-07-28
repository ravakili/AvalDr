import { useState } from 'react'
import GlassCard from '../../components/ui/GlassCard'
import PrimaryButton from '../../components/ui/PrimaryButton'
import InputField, { SelectField } from '../../components/ui/InputField'
import Toggle from '../../components/ui/Toggle'
import Tabs from '../../components/ui/Tabs'
import { IconCheck, IconSettings } from '../../components/ui/icons'
import { platformSettings as seed } from '../../data/apiData'
import type { PlatformSetting } from '../../types'

type Section = 'general' | 'fees' | 'notifications' | 'templates'

const templates = [
  { key: 'welcome', label: 'پیام خوش‌آمد کاربر', body: 'سلام {name}، به دکتر سینا خوش آمدید! 🎉' },
  { key: 'appointment', label: 'تأیید نوبت', body: 'نوبت شما با {doctor} در تاریخ {date} ساعت {time} تأیید شد.' },
  { key: 'reminder', label: 'یادآوری نوبت', body: 'یادآوری: نوبت شما تا یک ساعت دیگر آغاز می‌شود.' },
  { key: 'prescription', label: 'آماده شدن نسخه', body: 'نسخه شما توسط {doctor} صادر شد. در پنل کاربری قابل مشاهده است.' },
]

export default function SystemSettings() {
  const [section, setSection] = useState<Section>('general')
  const [settings, setSettings] = useState<PlatformSetting[]>(seed)
  const [smsTemplates, setSmsTemplates] = useState(templates)

  const update = (key: string, value: string) =>
    setSettings((arr) => arr.map((s) => (s.key === key ? { ...s, value } : s)))

  const inSection = (s: PlatformSetting) => {
    if (section === 'general') return ['platform_currency', 'support_email', 'cancellation_policy_hours'].includes(s.key)
    if (section === 'fees') return ['commission_rate', 'min_appointment_fee', 'max_daily_appointments'].includes(s.key)
    if (section === 'notifications') return s.key.startsWith('allow_') || s.key === 'notification_sms' || s.key === 'auto_approve_doctors'
    return false
  }

  return (
    <div className="space-y-5">
      <Tabs
        active={section}
        onChange={(k) => setSection(k as Section)}
        tabs={[
          { key: 'general', label: 'عمومی' },
          { key: 'fees', label: 'تعرفه‌ها' },
          { key: 'notifications', label: 'اعلان‌ها' },
          { key: 'templates', label: 'قالب پیامک' },
        ]}
      />

      {section === 'templates' ? (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          {smsTemplates.map((t, idx) => (
            <GlassCard key={t.key} className="p-5">
              <p className="mb-2 text-sm font-semibold text-ink-700">{t.label}</p>
              <textarea
                rows={3}
                value={t.body}
                onChange={(e) => setSmsTemplates((arr) => arr.map((x, i) => (i === idx ? { ...x, body: e.target.value } : x)))}
                className="glass-input w-full rounded-xl px-4 py-2.5 text-sm text-ink-800 outline-none focus:ring-2 focus:ring-primary-200"
              />
              <p className="mt-2 text-[11px] text-ink-400">
                متغیرها: {'{name}'}, {'{doctor}'}, {'{date}'}, {'{time}'}
              </p>
            </GlassCard>
          ))}
          <div className="lg:col-span-2">
            <PrimaryButton icon={<IconCheck />}>ذخیره قالب‌ها</PrimaryButton>
          </div>
        </div>
      ) : (
        <GlassCard className="p-6">
          <div className="mb-5 flex items-center gap-2">
            <IconSettings className="h-5 w-5 text-primary-500" />
            <h3 className="font-bold text-ink-800">
              {section === 'general' ? 'تنظیمات عمومی' : section === 'fees' ? 'تعرفه‌ها و کمیسیون' : 'تنظیمات اعلان و دسترسی'}
            </h3>
          </div>
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
            {settings.filter(inSection).map((s) => (
              <div key={s.key}>
                {s.type === 'toggle' ? (
                  <Toggle
                    checked={s.value === 'true'}
                    onChange={(v) => update(s.key, String(v))}
                    label={s.label}
                  />
                ) : s.type === 'select' ? (
                  <SelectField label={s.label} value={s.value} onChange={(e) => update(s.key, e.target.value)}>
                    {s.options?.map((o) => (
                      <option key={o} value={o}>{o === 'toman' ? 'تومان' : o === 'rial' ? 'ریال' : o === 'dollar' ? 'دلار' : o}</option>
                    ))}
                  </SelectField>
                ) : (
                  <InputField
                    label={s.label}
                    type={s.type === 'number' ? 'number' : 'text'}
                    dir={s.type === 'number' || s.key === 'support_email' ? 'ltr' : 'rtl'}
                    className={s.type === 'number' || s.key === 'support_email' ? 'text-right' : ''}
                    value={s.value}
                    onChange={(e) => update(s.key, e.target.value)}
                  />
                )}
              </div>
            ))}
          </div>
          <div className="mt-6 flex justify-end">
            <PrimaryButton icon={<IconCheck />}>ذخیره تنظیمات</PrimaryButton>
          </div>
        </GlassCard>
      )}
    </div>
  )
}
