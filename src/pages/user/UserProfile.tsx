import { useRef, useState } from "react";
import GlassCard from "../../components/ui/GlassCard";
import PrimaryButton from "../../components/ui/PrimaryButton";
import Avatar from "../../components/ui/Avatar";
import InputField, { SelectField } from "../../components/ui/InputField";
import Toggle from "../../components/ui/Toggle";
import Tabs from "../../components/ui/Tabs";
import Badge from "../../components/ui/Badge";
import { useAuthStore } from "../../store/authStore";
import { defaultNotificationPrefs, getPatient } from "../../data/mockData";
import {
  IconCheck,
  IconDownload,
  IconFile,
  IconHeart,
  IconLogout,
  IconPlus,
  IconShield,
  IconUpload,
} from "../../components/ui/icons";
import { roleLabel } from "../../components/layout/nav";

type Section = "personal" | "medical" | "reports" | "notifications";

// Editable medical-record categories. Each keeps its own state seeded from
// the patient's mock data, and exposes a list of options to add via select.
type CategoryKey = "diagnoses" | "allergies" | "medications";

const CATEGORY_OPTIONS: Record<CategoryKey, string[]> = {
  diagnoses: [
    "فشار خون بالا",
    "دیابت نوع ۲",
    "کلسترول بالا",
    "آسم",
    "میگرن",
    "کم‌خونی",
  ],
  allergies: [
    "پنی‌سیلین",
    "بادام زمینی",
    "گلدان",
    "گرد و غبار",
    "آسپرین",
    "لاکتوز",
  ],
  medications: [
    "متابولیک",
    "آتورواستاتین",
    "متفرمین",
    "آسپرین",
    "امپرازول",
    "سرترالین",
  ],
};

export default function UserProfile() {
  const user = useAuthStore((s) => s.user);
  const me = getPatient(user?.refId || "pat-1")!;
  const [section, setSection] = useState<Section>("personal");
  const [prefs, setPrefs] = useState(defaultNotificationPrefs);
  const logout = useAuthStore((s) => s.logout);

  const [pendingReports, setPendingReports] = useState<{ name: string; saved: boolean }[]>([])
  const reportInputRef = useRef<HTMLInputElement>(null)

  const handleReportSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setPendingReports(prev => [...prev, { name: file.name, saved: false }])
    e.target.value = ''
  }

  const saveReport = (idx: number) => {
    setPendingReports(prev => prev.map((r, i) => i === idx ? { ...r, saved: true } : r))
  }

  // Editable medical-record categories, seeded from mock data.
  const [diagnoses, setDiagnoses] = useState<string[]>(
    me.medicalHistory?.diagnoses ?? [],
  );
  const [allergies, setAllergies] = useState<string[]>(
    me.medicalHistory?.allergies ?? [],
  );
  const [medications, setMedications] = useState<string[]>(
    me.medicalHistory?.medications ?? [],
  );

  const addEntry = (key: CategoryKey, value: string) => {
    if (!value) return;
    const setters = {
      diagnoses: setDiagnoses,
      allergies: setAllergies,
      medications: setMedications,
    } as const;
    setters[key]((arr) => (arr.includes(value) ? arr : [...arr, value]));
  };

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
      {/* Profile card */}
      <GlassCard className="flex h-fit flex-col items-center p-6 text-center">
        <div className="flex w-full items-center justify-end gap-3">
          <button
            onClick={logout}
            className="grid h-8 w-8 shrink-0 place-items-center rounded-lg text-ink-400 transition text-red-300 hover:border-red-500 border-red-300 border-2 hover:bg-red-50 hover:text-red-500"
            title="خروج"
          >
            <IconLogout />
          </button>
        </div>
        <Avatar src={me.avatar} size="xl" ring />
        <h2 className="mt-4 text-lg font-bold text-ink-800">{me.name}</h2>
        <p className="text-sm text-ink-400">{me.phone}</p>
        <div className="mt-3 flex flex-wrap justify-center gap-2 text-xs">
          <span className="rounded-full bg-primary-50 px-3 py-1 font-medium text-primary-700">
            {me.gender === "male" ? "آقا" : "خانم"}
          </span>
          <span className="rounded-full bg-ink-100 px-3 py-1 font-medium text-ink-600">
            {me.city}
          </span>
        </div>
        <div className="mt-6 grid w-full grid-cols-3 gap-2 border-t border-white/50 pt-5 text-center">
          <Mini icon={<IconHeart />} value="۸۲٪" label="سلامتی" />
          <Mini icon={<IconShield />} value="تأیید" label="احراز هویت" />
          <Mini icon={<IconCheck />} value="۳" label="ویزیت" />
        </div>
      </GlassCard>

      {/* Edit/sections */}
      <GlassCard className="p-6 lg:col-span-2">
        <Tabs
          className="mb-5"
          active={section}
          onChange={(k) => setSection(k as Section)}
          tabs={[
            { key: "personal", label: "اطلاعات شخصی" },
            { key: "medical", label: "پرونده پزشکی" },
            { key: "reports", label: "گزارش‌های پزشکی" },
            { key: "notifications", label: "اعلان‌ها" },
          ]}
        />

        {section === "personal" && (
          <>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <InputField
                label="نام و نام خانوادگی"
                defaultValue={me.name}
                name="name"
              />
              <InputField
                label="شماره موبایل"
                dir="ltr"
                className="text-right"
                defaultValue={me.phone}
                name="phone"
              />
              <InputField
                label="ایمیل"
                dir="ltr"
                className="text-right"
                defaultValue={me.email}
                name="email"
              />
              <InputField
                label="کد ملی"
                dir="ltr"
                className="text-right"
                defaultValue={me.nationalId}
                name="nid"
              />
              <InputField
                label="سن"
                dir="ltr"
                className="text-right"
                defaultValue={String(me.age)}
                name="age"
              />
              <SelectField label="جنسیت" defaultValue={me.gender} name="gender">
                <option value="male">آقا</option>
                <option value="female">خانم</option>
              </SelectField>
              <InputField label="شهر" defaultValue={me.city} name="city" />
            </div>
            <div className="mt-6 flex justify-end gap-3">
              <PrimaryButton variant="ghost">انصراف</PrimaryButton>
              <PrimaryButton icon={<IconCheck />}>ذخیره تغییرات</PrimaryButton>
            </div>
          </>
        )}

        {section === "medical" && (
          <div className="space-y-5">
            <MedicalCategory
              label="تشخیص‌ها"
              emptyText="بدون سابقه"
              tone="blue"
              items={diagnoses}
              options={CATEGORY_OPTIONS.diagnoses}
              onAdd={(v) => addEntry("diagnoses", v)}
            />
            <MedicalCategory
              label="حساسیت‌ها"
              emptyText="بدون حساسیت"
              tone="red"
              items={allergies}
              options={CATEGORY_OPTIONS.allergies}
              onAdd={(v) => addEntry("allergies", v)}
            />
            <MedicalCategory
              label="داروهای مصرفی"
              emptyText="بدون داروی فعلی"
              tone="teal"
              items={medications}
              options={CATEGORY_OPTIONS.medications}
              onAdd={(v) => addEntry("medications", v)}
            />
            <div>
              <label className="mb-1.5 block text-sm font-medium text-ink-700">
                یادداشت پزشکی
              </label>
              <textarea
                rows={3}
                defaultValue={me.medicalHistory?.notes}
                placeholder="توضیحات تکمیلی…"
                className="glass-input w-full rounded-xl px-4 py-2.5 text-sm text-ink-800 outline-none focus:ring-2 focus:ring-primary-200"
              />
            </div>
            <div className="flex justify-end">
              <PrimaryButton icon={<IconCheck />}>ذخیره پرونده</PrimaryButton>
            </div>
          </div>
        )}

        {section === "reports" && (
          <div className="space-y-5">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium text-ink-700">گزارش‌های پزشکی</p>
              <input ref={reportInputRef} type="file" className="hidden" onChange={handleReportSelect} accept=".pdf,.jpg,.png,.doc,.docx" />
              <PrimaryButton size="sm" icon={<IconPlus className="h-4 w-4" />} onClick={() => reportInputRef.current?.click()}>
                افزودن گزارش
              </PrimaryButton>
            </div>
            <div className="space-y-2">
              {me.medicalHistory?.documents?.length ? (
                me.medicalHistory.documents.map((doc) => (
                  <div
                    key={doc.id}
                    className="flex items-center gap-3 rounded-xl border border-white/50 bg-white/40 p-3"
                  >
                    <div className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-primary-50 text-primary-600">
                      <IconFile />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-ink-700">
                        {doc.name}
                      </p>
                      <p className="text-[11px] uppercase text-ink-400">
                        {doc.type}
                      </p>
                    </div>
                    <button className="grid h-8 w-8 place-items-center rounded-lg text-ink-400 hover:bg-primary-50 hover:text-primary-600">
                      <IconDownload className="h-4 w-4" />
                    </button>
                  </div>
                ))
              ) : (
                <p className="text-xs text-ink-400">
                  گزارشی بارگذاری نشده است.
                </p>
              )}
              {pendingReports.map((r, idx) => (
                <div
                  key={idx}
                  className="flex items-center gap-3 rounded-xl border border-dashed border-primary-300/60 bg-primary-50/40 p-3"
                >
                  <div className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-white/70 text-primary-600">
                    <IconUpload className="h-5 w-5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-ink-700">{r.name}</p>
                    <p className="text-[11px] text-ink-400">آماده ذخیره</p>
                  </div>
                  <PrimaryButton
                    size="sm"
                    disabled={r.saved}
                    onClick={() => saveReport(idx)}
                  >
                    {r.saved ? 'ذخیره شد' : 'ذخیره'}
                  </PrimaryButton>
                </div>
              ))}
            </div>
          </div>
        )}

        {section === "notifications" && (
          <div className="space-y-1 divide-y divide-white/40">
            {prefs.map((p) => (
              <div key={p.key} className="py-3">
                <Toggle
                  checked={p.enabled}
                  label={p.label}
                  onChange={(v) =>
                    setPrefs((arr) =>
                      arr.map((x) =>
                        x.key === p.key ? { ...x, enabled: v } : x,
                      ),
                    )
                  }
                />
              </div>
            ))}
            <div className="pt-4">
              <PrimaryButton icon={<IconCheck />}>ذخیره تنظیمات</PrimaryButton>
            </div>
          </div>
        )}
      </GlassCard>
    </div>
  );
}

function Mini({
  icon,
  value,
  label,
}: {
  icon: React.ReactNode;
  value: string;
  label: string;
}) {
  return (
    <div>
      <div className="mx-auto mb-1 grid h-9 w-9 place-items-center rounded-xl bg-primary-50 text-primary-500">
        {icon}
      </div>
      <p className="text-sm font-bold text-ink-800 tabular">{value}</p>
      <p className="text-[10px] text-ink-400">{label}</p>
    </div>
  );
}

type BadgeTone = "blue" | "red" | "teal";

/** A medical-record category: existing items as badges plus a select + add
 *  button row to append a new entry from a preset list. */
function MedicalCategory({
  label,
  emptyText,
  tone,
  items,
  options,
  onAdd,
}: {
  label: string;
  emptyText: string;
  tone: BadgeTone;
  items: string[];
  options: string[];
  onAdd: (value: string) => void;
}) {
  const [pending, setPending] = useState("");

  // Options not yet added (avoid duplicates / already-selected items).
  const available = options.filter((o) => !items.includes(o));

  const handleAdd = () => {
    if (!pending) return;
    onAdd(pending);
    setPending("");
  };

  return (
    <div>
      <p className="mb-2 text-sm font-medium text-ink-700">{label}</p>
      <div className="flex flex-wrap gap-2">
        {items.length ? (
          items.map((d) => (
            <Badge key={d} tone={tone}>
              {d}
            </Badge>
          ))
        ) : (
          <span className="text-xs text-ink-400">{emptyText}</span>
        )}
      </div>

      {/* Select + add button */}
      <div className="mt-2 flex items-center gap-2">
        <select
          value={pending}
          onChange={(e) => setPending(e.target.value)}
          disabled={available.length === 0}
          className="glass-input rounded-xl px-3 py-1.5 text-sm text-ink-800 shadow-sm outline-none transition focus:border-primary-300 focus:ring-2 focus:ring-primary-200 disabled:opacity-50"
        >
          <option value="">
            {available.length === 0 ? "همه موارد افزوده شد" : "انتخاب کنید…"}
          </option>
          {available.map((o) => (
            <option key={o} value={o}>
              {o}
            </option>
          ))}
        </select>
        <PrimaryButton
          size="sm"
          icon={<IconPlus className="h-4 w-4" />}
          onClick={handleAdd}
          disabled={!pending}
        >
          افزودن
        </PrimaryButton>
      </div>
    </div>
  );
}
