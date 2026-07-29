import { useRef, useState, useEffect } from "react";
import GlassCard from "../../components/ui/GlassCard";
import PrimaryButton from "../../components/ui/PrimaryButton";
import Avatar from "../../components/ui/Avatar";
import InputField, { SelectField } from "../../components/ui/InputField";
import Toggle from "../../components/ui/Toggle";
import Tabs from "../../components/ui/Tabs";
import Badge from "../../components/ui/Badge";
import { useAuthStore } from "../../store/authStore";
import { useUserStore } from "../../store/userStore";
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
import type { MedicalRecord } from "../../types";
import { api } from "../../lib/api";

type Section = "personal" | "medical" | "reports" | "notifications";
type CategoryKey = "diagnoses" | "allergies" | "medications";
type BadgeTone = "blue" | "red" | "teal";

export default function UserProfile() {
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);
  const {
    profile, preferences, medicalRecord, reports, loading, error,
    fetchProfile, saveProfile, uploadAvatar,
    fetchPreferences, savePreference,
    fetchMedicalRecord, saveMedicalRecord,
    fetchReports, uploadReport, deleteReport,
    fetchAll,
  } = useUserStore();

  const [section, setSection] = useState<Section>("personal");
  const reportInputRef = useRef<HTMLInputElement>(null);
  const avatarInputRef = useRef<HTMLInputElement>(null);

  const [formData, setFormData] = useState<Record<string, string>>({});

  useEffect(() => {
    fetchAll()
  }, []);

  useEffect(() => {
    if (profile) {
      setFormData({
        name: profile.name || "",
        phone: profile.phone || "",
        nationalId: profile.nationalId || "",
        age: String(profile.age || ""),
        gender: profile.gender || "male",
        city: profile.city || "",
        bloodType: profile.bloodType || "",
        insuranceType: profile.insuranceType || "",
        supplementaryInsurance: profile.supplementaryInsurance || "",
        emergencyName: profile.emergencyContact?.name || "",
        emergencyPhone: profile.emergencyContact?.phone || "",
        emergencyRelation: profile.emergencyContact?.relationship || "",
      })
    }
  }, [profile]);

  // Medical record state
  const [diagnoses, setDiagnoses] = useState<string[]>([]);
  const [allergies, setAllergies] = useState<string[]>([]);
  const [medications, setMedications] = useState<string[]>([]);
  const [notes, setNotes] = useState("");

  useEffect(() => {
    if (medicalRecord) {
      setDiagnoses(medicalRecord.diagnoses || []);
      setAllergies(medicalRecord.allergies || []);
      setMedications(medicalRecord.medications || []);
      setNotes(medicalRecord.notes || "");
    }
  }, [medicalRecord]);

  const [defOptions, setDefOptions] = useState<Record<string, { id: string; name: string }[]>>({});

  useEffect(() => {
    const fetchDefs = async () => {
      try {
        const types = ['city', 'insurance_type', 'supplementary_insurance', 'diagnosis', 'allergy', 'drug'];
        const results = await Promise.all(
          types.map(async (t) => {
            const data = await api.get<{ id: string; name: string }[]>(`/admin/definitions/?type=${t}`);
            return [t, data] as [string, { id: string; name: string }[]];
          })
        );
        setDefOptions(Object.fromEntries(results));
      } catch { /* ignore */ }
    };
    fetchDefs();
  }, []);

  // Uploading reports state
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    await uploadAvatar(file);
  };

  const handleSavePersonal = async () => {
    const payload: Record<string, unknown> = {};
    if (formData.name !== profile?.name) payload.name = formData.name;
    if (formData.city !== profile?.city) payload.city = formData.city;
    if (formData.nationalId !== profile?.nationalId) payload.nationalId = formData.nationalId;
    if (formData.gender !== profile?.gender) payload.gender = formData.gender;
    if (formData.bloodType !== profile?.bloodType) payload.bloodType = formData.bloodType;
    if (formData.insuranceType !== profile?.insuranceType) payload.insuranceType = formData.insuranceType;
    if (formData.supplementaryInsurance !== profile?.supplementaryInsurance) payload.supplementaryInsurance = formData.supplementaryInsurance;
    const ec = profile?.emergencyContact || { name: "", phone: "", relationship: "" };
    if (formData.emergencyName !== ec.name || formData.emergencyPhone !== ec.phone || formData.emergencyRelation !== ec.relationship) {
      payload.emergencyContact = { name: formData.emergencyName, phone: formData.emergencyPhone, relationship: formData.emergencyRelation };
    }
    try {
      await saveProfile(payload);
      alert("اطلاعات با موفقیت ذخیره شد.");
    } catch { alert("خطا در ذخیره اطلاعات"); }
  };

  const addEntry = (key: CategoryKey, value: string) => {
    if (!value) return;
    const setters = {
      diagnoses: setDiagnoses,
      allergies: setAllergies,
      medications: setMedications,
    } as const;
    setters[key]((arr) => (arr.includes(value) ? arr : [...arr, value]));
  };

  const handleSaveMedical = async () => {
    const payload: Record<string, unknown> = {
      diagnoses,
      allergies,
      medications,
      notes,
    };
    try {
      await saveMedicalRecord(payload);
      alert("پرونده پزشکی با موفقیت ذخیره شد.");
    } catch { alert("خطا در ذخیره پرونده"); }
  };

  const handleReportSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setUploadError(null);
    try {
      await uploadReport(file);
    } catch { setUploadError("خطا در آپلود فایل"); }
    setUploading(false);
    e.target.value = "";
  };

  const handleSaveNotifPrefs = async () => {
    for (const p of preferences) {
      if (p.id) await savePreference(p.id, p.enabled);
    }
    alert("تنظیمات اعلان‌ها ذخیره شد.");
  };

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
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
        <div className="relative cursor-pointer group" onClick={() => avatarInputRef.current?.click()}>
          <Avatar src={profile?.avatar || user?.avatar} size="xl" ring />
          <div className="absolute inset-0 grid place-items-center rounded-full bg-ink-900/40 opacity-0 transition group-hover:opacity-100">
            <IconUpload className="h-6 w-6 text-white" />
          </div>
        </div>
        <input ref={avatarInputRef} type="file" className="hidden" accept="image/*" onChange={handleAvatarChange} />
        <h2 className="mt-4 text-lg font-bold text-ink-800">{profile?.name || user?.name || "کاربر"}</h2>
        <p className="text-sm text-ink-400">{profile?.phone || user?.phone}</p>
        <div className="mt-3 flex flex-wrap justify-center gap-2 text-xs">
          <span className="rounded-full bg-primary-50 px-3 py-1 font-medium text-primary-700">
            {profile?.gender === "male" ? "آقا" : "خانم"}
          </span>
          <span className="rounded-full bg-ink-100 px-3 py-1 font-medium text-ink-600">
            {profile?.city || ""}
          </span>
        </div>
        <div className="mt-6 grid w-full grid-cols-3 gap-2 border-t border-white/50 pt-5 text-center">
          <Mini icon={<IconHeart />} value={String(reports.length)} label="گزارش‌ها" />
          <Mini icon={<IconShield />} value="تأیید" label="احراز هویت" />
          <Mini icon={<IconCheck />} value={String(preferences.filter(p => p.enabled).length)} label="اعلان‌ها" />
        </div>
      </GlassCard>

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
                value={formData.name}
                onChange={(e) => setFormData(f => ({ ...f, name: e.target.value }))}
                name="name"
              />
              <InputField
                label="شماره موبایل"
                dir="ltr"
                className="text-right"
                value={formData.phone}
                name="phone"
                disabled
              />
              <InputField
                label="کد ملی"
                dir="ltr"
                className="text-right"
                value={formData.nationalId}
                onChange={(e) => setFormData(f => ({ ...f, nationalId: e.target.value }))}
                name="nid"
              />
              <SelectField
                label="جنسیت"
                value={formData.gender}
                onChange={(e) => setFormData(f => ({ ...f, gender: e.target.value }))}
                name="gender"
              >
                <option value="male">آقا</option>
                <option value="female">خانم</option>
              </SelectField>
              <SelectField
                label="شهر"
                value={formData.city}
                onChange={(e) => setFormData(f => ({ ...f, city: e.target.value }))}
                name="city"
              >
                <option value="">انتخاب کنید</option>
                {(defOptions.city || []).map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
              </SelectField>
              <SelectField
                label="گروه خونی"
                value={formData.bloodType}
                onChange={(e) => setFormData(f => ({ ...f, bloodType: e.target.value }))}
                name="bloodType"
              >
                <option value="">انتخاب کنید</option>
                {["A+","A-","B+","B-","AB+","AB-","O+","O-"].map(b => <option key={b} value={b}>{b}</option>)}
              </SelectField>
              <SelectField
                label="نوع بیمه درمانی"
                value={formData.insuranceType}
                onChange={(e) => setFormData(f => ({ ...f, insuranceType: e.target.value }))}
                name="insuranceType"
              >
                <option value="">انتخاب کنید</option>
                {(defOptions.insurance_type || []).map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
              </SelectField>
              <SelectField
                label="بیمه تکمیلی"
                value={formData.supplementaryInsurance}
                onChange={(e) => setFormData(f => ({ ...f, supplementaryInsurance: e.target.value }))}
                name="supplementaryInsurance"
              >
                <option value="">ندارد</option>
                {(defOptions.supplementary_insurance || []).map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
              </SelectField>
            </div>
            {/* Emergency Contact */}
            <div className="mt-4 rounded-2xl border border-white/50 bg-white/40 p-4">
              <p className="mb-3 text-sm font-medium text-ink-700">تماس اضطراری</p>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                <InputField label="نام و نام خانوادگی" value={formData.emergencyName || ""} onChange={(e) => setFormData(f => ({ ...f, emergencyName: e.target.value }))} name="emergencyName" />
                <InputField label="شماره تماس" dir="ltr" className="text-right" value={formData.emergencyPhone || ""} onChange={(e) => setFormData(f => ({ ...f, emergencyPhone: e.target.value.replace(/[^0-9۰-۹]/g, "").slice(0, 11) }))} name="emergencyPhone" />
                <InputField label="نسبت" value={formData.emergencyRelation || ""} onChange={(e) => setFormData(f => ({ ...f, emergencyRelation: e.target.value }))} name="emergencyRelation" />
              </div>
            </div>
            <div className="mt-6 flex justify-end gap-3">
              <PrimaryButton icon={<IconCheck />} onClick={handleSavePersonal} disabled={loading}>
                {loading ? "در حال ذخیره..." : "ذخیره تغییرات"}
              </PrimaryButton>
            </div>
          </>
        )}

        {section === "medical" && (
          <div className="space-y-5">
            <div className="flex items-center gap-3 rounded-xl border border-white/50 bg-white/40 p-3">
              <span className="text-sm font-medium text-ink-700">گروه خونی:</span>
              <span className="text-sm font-bold text-ink-800">{profile?.bloodType || "ثبت نشده"}</span>
            </div>
            <MedicalCategory
              label="تشخیص‌ها"
              emptyText="بدون سابقه"
              tone="blue"
              items={diagnoses}
              options={(defOptions.diagnosis || []).map(d => d.name)}
              onAdd={(v) => addEntry("diagnoses", v)}
            />
            <MedicalCategory
              label="حساسیت‌ها"
              emptyText="بدون حساسیت"
              tone="red"
              items={allergies}
              options={(defOptions.allergy || []).map(d => d.name)}
              onAdd={(v) => addEntry("allergies", v)}
            />
            <MedicalCategory
              label="داروهای مصرفی"
              emptyText="بدون داروی فعلی"
              tone="teal"
              items={medications}
              options={(defOptions.drug || []).map(d => d.name)}
              onAdd={(v) => addEntry("medications", v)}
            />
            <div>
              <label className="mb-1.5 block text-sm font-medium text-ink-700">یادداشت پزشکی</label>
              <textarea
                rows={3}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="توضیحات تکمیلی…"
                className="glass-input w-full rounded-xl px-4 py-2.5 text-sm text-ink-800 outline-none focus:ring-2 focus:ring-primary-200"
              />
            </div>
            <div className="flex justify-end">
              <PrimaryButton icon={<IconCheck />} onClick={handleSaveMedical} disabled={loading}>
                {loading ? "در حال ذخیره..." : "ذخیره پرونده"}
              </PrimaryButton>
            </div>
          </div>
        )}

        {section === "reports" && (
          <div className="space-y-5">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium text-ink-700">گزارش‌های پزشکی</p>
              <input ref={reportInputRef} type="file" className="hidden" onChange={handleReportSelect} accept=".pdf,.jpg,.png,.doc,.docx" />
              <PrimaryButton size="sm" icon={<IconPlus className="h-4 w-4" />} onClick={() => reportInputRef.current?.click()} disabled={uploading}>
                {uploading ? "در حال آپلود..." : "افزودن گزارش"}
              </PrimaryButton>
            </div>
            {uploadError && <p className="text-xs text-red-500">{uploadError}</p>}
            <div className="space-y-2">
              {reports.length > 0 ? (
                reports.map((doc) => (
                  <div
                    key={doc.id}
                    className="flex items-center gap-3 rounded-xl border border-white/50 bg-white/40 p-3"
                  >
                    <div className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-primary-50 text-primary-600">
                      <IconFile />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-ink-700">{doc.name}</p>
                      <p className="text-[11px] uppercase text-ink-400">{doc.type}</p>
                    </div>
                    {doc.url && (
                      <a href={doc.url} target="_blank" rel="noopener noreferrer" className="grid h-8 w-8 place-items-center rounded-lg text-ink-400 hover:bg-primary-50 hover:text-primary-600">
                        <IconDownload className="h-4 w-4" />
                      </a>
                    )}
                    <button
                      onClick={() => deleteReport(doc.id)}
                      className="grid h-8 w-8 place-items-center rounded-lg text-red-400 hover:bg-red-50 hover:text-red-600"
                    >
                      <IconFile className="h-4 w-4" />
                    </button>
                  </div>
                ))
              ) : (
                <p className="text-xs text-ink-400">گزارشی بارگذاری نشده است.</p>
              )}
            </div>
          </div>
        )}

        {section === "notifications" && (
          <div className="space-y-1 divide-y divide-white/40">
            {preferences.map((p) => (
              <div key={p.id} className="py-3">
                <Toggle
                  checked={p.enabled}
                  label={p.label}
                  onChange={(v) =>
                    useUserStore.setState((s) => ({
                      preferences: s.preferences.map((x) =>
                        x.id === p.id ? { ...x, enabled: v } : x
                      ),
                    }))
                  }
                />
              </div>
            ))}
            <div className="pt-4">
              <PrimaryButton icon={<IconCheck />} onClick={handleSaveNotifPrefs}>
                ذخیره تنظیمات
              </PrimaryButton>
            </div>
          </div>
        )}
      </GlassCard>
    </div>
  );
}

function Mini({ icon, value, label }: { icon: React.ReactNode; value: string; label: string }) {
  return (
    <div>
      <div className="mx-auto mb-1 grid h-9 w-9 place-items-center rounded-xl bg-primary-50 text-primary-500">{icon}</div>
      <p className="text-sm font-bold text-ink-800 tabular">{value}</p>
      <p className="text-[10px] text-ink-400">{label}</p>
    </div>
  );
}

function MedicalCategory({
  label, emptyText, tone, items, options, onAdd,
}: {
  label: string; emptyText: string; tone: BadgeTone; items: string[]; options: string[]; onAdd: (value: string) => void;
}) {
  const [pending, setPending] = useState("");
  const available = options.filter((o) => !items.includes(o));

  return (
    <div>
      <p className="mb-2 text-sm font-medium text-ink-700">{label}</p>
      <div className="flex flex-wrap gap-2">
        {items.length ? (
          items.map((d) => <Badge key={d} tone={tone}>{d}</Badge>)
        ) : (
          <span className="text-xs text-ink-400">{emptyText}</span>
        )}
      </div>
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
            <option key={o} value={o}>{o}</option>
          ))}
        </select>
        <PrimaryButton size="sm" icon={<IconPlus className="h-4 w-4" />} onClick={() => { onAdd(pending); setPending("") }} disabled={!pending}>
          افزودن
        </PrimaryButton>
      </div>
    </div>
  );
}
