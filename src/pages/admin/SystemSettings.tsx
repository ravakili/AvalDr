import { useEffect, useState } from "react";
import GlassCard from "../../components/ui/GlassCard";
import PrimaryButton from "../../components/ui/PrimaryButton";
import InputField, { SelectField } from "../../components/ui/InputField";
import Toggle from "../../components/ui/Toggle";
import Tabs from "../../components/ui/Tabs";
import Avatar from "../../components/ui/Avatar";
import {
  IconCheck,
  IconLogout,
  IconSettings,
  IconUser,
} from "../../components/ui/icons";
import { api, apiRequest } from "../../lib/api";
import { useAuthStore } from "../../store/authStore";
import type { PlatformSetting } from "../../types";
import { toast } from "../../store/toastStore";

type Section = "general" | "fees" | "notifications" | "templates" | "profile";

const defaultTemplates = [
  {
    key: "welcome",
    label: "پیام خوش‌آمد کاربر",
    body: "سلام {name}، به دکتر سینا خوش آمدید! 🎉",
  },
  {
    key: "appointment",
    label: "تأیید نوبت",
    body: "نوبت شما با {doctor} در تاریخ {date} ساعت {time} تأیید شد.",
  },
  {
    key: "reminder",
    label: "یادآوری نوبت",
    body: "یادآوری: نوبت شما تا یک ساعت دیگر آغاز می‌شود.",
  },
  {
    key: "prescription",
    label: "آماده شدن نسخه",
    body: "نسخه شما توسط {doctor} صادر شد. در پنل کاربری قابل مشاهده است.",
  },
];

function extractResults<T>(response: T | { results: T }): T {
  if (response && typeof response === "object" && "results" in response) {
    return (response as { results: T }).results;
  }
  return response as T;
}

export default function SystemSettings() {
  const { user } = useAuthStore();
  const [section, setSection] = useState<Section>("general");
  const [settings, setSettings] = useState<PlatformSetting[]>([]);
  const [smsTemplates, setSmsTemplates] = useState(defaultTemplates);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [profileName, setProfileName] = useState(user?.name || "");
  const [profileAvatar, setProfileAvatar] = useState<File | null>(null);
  const [profileSaving, setProfileSaving] = useState(false);

  // const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);
  useEffect(() => {
    Promise.all([
      api.get<PlatformSetting[]>("/admin/settings/"),
      api.get<{ key: string; label: string; body: string }[]>(
        "/admin/sms-templates/",
      ),
    ])
      .then(([settingsData, templatesData]) => {
        setSettings(extractResults(settingsData));
        const t = extractResults(templatesData);
        if (t.length) setSmsTemplates(t);
      })
      .finally(() => setLoading(false));
  }, []);

  const update = (key: string, value: string) =>
    setSettings((arr) => arr.map((s) => (s.key === key ? { ...s, value } : s)));

  const inSection = (s: PlatformSetting) => {
    if (section === "general")
      return [
        "platform_currency",
        "support_email",
        "cancellation_policy_hours",
      ].includes(s.key);
    if (section === "fees")
      return [
        "commission_rate",
        "min_appointment_fee",
        "max_daily_appointments",
      ].includes(s.key);
    if (section === "notifications")
      return (
        s.key.startsWith("allow_") ||
        s.key === "notification_sms" ||
        s.key === "auto_approve_doctors"
      );
    return false;
  };

  const saveSettings = async () => {
    setSaving(true);
    try {
      const visible = settings.filter(inSection);
      await Promise.all(
        visible.map((s) =>
          api.patch(`/admin/settings/${s.key}/`, { value: s.value }),
        ),
      );
      toast.success("تنظیمات با موفقیت ذخیره شد");
    } catch (error) {
      toast.error(
        "خطا در ذخیره تنظیمات",
        error instanceof Error ? error.message : undefined,
      );
    } finally {
      setSaving(false);
    }
  };

  const saveTemplates = async () => {
    setSaving(true);
    try {
      await Promise.all(
        smsTemplates.map((t) =>
          api.patch(`/admin/sms-templates/${t.key}/`, { body: t.body }),
        ),
      );
      toast.success("قالب‌های پیامک ذخیره شد");
    } catch (error) {
      toast.error(
        "خطا در ذخیره قالب‌ها",
        error instanceof Error ? error.message : undefined,
      );
    } finally {
      setSaving(false);
    }
  };

  const saveProfile = async () => {
    setProfileSaving(true);
    try {
      if (profileAvatar) {
        const formData = new FormData();
        formData.append("avatar", profileAvatar);
        await apiRequest("/admin/me/", { method: "PATCH", body: formData });
      }
      if (profileName !== user?.name) {
        await api.patch("/admin/me/", { name: profileName });
      }
      useAuthStore.getState().login(user?.role || "admin", profileName);
      toast.success("پروفایل با موفقیت به‌روزرسانی شد");
    } catch (error) {
      toast.error(
        "خطا در به‌روزرسانی پروفایل",
        error instanceof Error ? error.message : undefined,
      );
    } finally {
      setProfileSaving(false);
    }
  };

  if (loading)
    return (
      <div className="p-10 text-center text-ink-400">در حال بارگذاری...</div>
    );


  return (
    <div className="space-y-5">
      <Tabs
        active={section}
        onChange={(k) => setSection(k as Section)}
        tabs={[
          { key: "general", label: "عمومی" },
          { key: "fees", label: "تعرفه‌ها" },
          { key: "notifications", label: "اعلان‌ها" },
          { key: "templates", label: "قالب پیامک" },
          { key: "profile", label: "پروفایل" },
        ]}
      />

      {section === "profile" ? (
        <GlassCard className="p-6">
          <div className="mb-5 flex items-center gap-2">
            <IconUser className="h-5 w-5 text-primary-500" />
            <h3 className="font-bold text-ink-800">پروفایل مدیر</h3>
          </div>
          <div className="flex w-full items-center justify-end gap-3">
            <button
              onClick={logout}
              className="grid h-8 w-8 shrink-0 place-items-center rounded-lg hover:text-ink-100 transition text-red-300 hover:border-red-500 border-red-300 border-2 hover:bg-red-500 hover:text-red-500"
              title="خروج"
            >
              <IconLogout />
            </button>
          </div>
          <div className="flex flex-col items-center gap-6 sm:flex-row">
            <Avatar src={user?.avatar} size="xl" ring />
            <div className="flex-1 space-y-4">
              <InputField
                label="نام مدیر"
                value={profileName}
                onChange={(e) => setProfileName(e.target.value)}
              />
              <div>
                <p className="mb-1 text-sm font-medium text-ink-700">
                  تصویر پروفایل
                </p>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) =>
                    setProfileAvatar(e.target.files?.[0] || null)
                  }
                  className="glass-input w-full rounded-xl px-4 py-2.5 text-sm text-ink-800 outline-none focus:ring-2 focus:ring-primary-200"
                />
              </div>
              <div className="flex justify-end pt-2">
                <PrimaryButton
                  icon={<IconCheck />}
                  onClick={saveProfile}
                  disabled={profileSaving}
                >
                  {profileSaving ? "در حال ذخیره..." : "ذخیره پروفایل"}
                </PrimaryButton>
              </div>
            </div>
          </div>
        </GlassCard>
      ) : section === "templates" ? (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          {smsTemplates.map((t, idx) => (
            <GlassCard key={t.key} className="p-5">
              <p className="mb-2 text-sm font-semibold text-ink-700">
                {t.label}
              </p>
              <textarea
                rows={3}
                value={t.body}
                onChange={(e) =>
                  setSmsTemplates((arr) =>
                    arr.map((x, i) =>
                      i === idx ? { ...x, body: e.target.value } : x,
                    ),
                  )
                }
                className="glass-input w-full rounded-xl px-4 py-2.5 text-sm text-ink-800 outline-none focus:ring-2 focus:ring-primary-200"
              />
              <p className="mt-2 text-[11px] text-ink-400">
                متغیرها: {"{name}"}, {"{doctor}"}, {"{date}"}, {"{time}"}
              </p>
            </GlassCard>
          ))}
          <div className="lg:col-span-2">
            <PrimaryButton
              icon={<IconCheck />}
              onClick={saveTemplates}
              disabled={saving}
            >
              {saving ? "در حال ذخیره..." : "ذخیره قالب‌ها"}
            </PrimaryButton>
          </div>
        </div>
      ) : (
        <GlassCard className="p-6">
          <div className="mb-5 flex items-center gap-2">
            <IconSettings className="h-5 w-5 text-primary-500" />
            <h3 className="font-bold text-ink-800">
              {section === "general"
                ? "تنظیمات عمومی"
                : section === "fees"
                  ? "تعرفه‌ها و کمیسیون"
                  : "تنظیمات اعلان و دسترسی"}
            </h3>
          </div>
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
            {settings.filter(inSection).map((s) => (
              <div key={s.key}>
                {s.type === "toggle" ? (
                  <Toggle
                    checked={s.value === "true"}
                    onChange={(v) => update(s.key, String(v))}
                    label={s.label}
                  />
                ) : s.type === "select" ? (
                  <SelectField
                    label={s.label}
                    value={s.value}
                    onChange={(e) => update(s.key, e.target.value)}
                  >
                    {s.options?.map((o) => (
                      <option key={o} value={o}>
                        {o === "toman"
                          ? "تومان"
                          : o === "rial"
                            ? "ریال"
                            : o === "dollar"
                              ? "دلار"
                              : o}
                      </option>
                    ))}
                  </SelectField>
                ) : (
                  <InputField
                    label={s.label}
                    type={s.type === "number" ? "number" : "text"}
                    dir={
                      s.type === "number" || s.key === "support_email"
                        ? "ltr"
                        : "rtl"
                    }
                    className={
                      s.type === "number" || s.key === "support_email"
                        ? "text-right"
                        : ""
                    }
                    value={s.value}
                    onChange={(e) => update(s.key, e.target.value)}
                  />
                )}
              </div>
            ))}
          </div>
          <div className="mt-6 flex justify-end">
            <PrimaryButton
              icon={<IconCheck />}
              onClick={saveSettings}
              disabled={saving}
            >
              {saving ? "در حال ذخیره..." : "ذخیره تنظیمات"}
            </PrimaryButton>
          </div>
        </GlassCard>
      )}
    </div>
  );
}
