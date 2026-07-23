import { useState } from "react";
import GlassCard from "../../components/ui/GlassCard";
import PrimaryButton from "../../components/ui/PrimaryButton";
import Avatar from "../../components/ui/Avatar";
import Badge from "../../components/ui/Badge";
import InputField, { SelectField } from "../../components/ui/InputField";
import StatCard from "../../components/ui/StatCard";
import {
  IconCheck,
  IconClock,
  IconPlus,
  IconStar,
  IconTrash,
  IconWallet,
  IconChat,
  IconPhone,
  IconVideo,
} from "../../components/ui/icons";
import { useAuthStore } from "../../store/authStore";
import {
  doctorEarnings,
  doctors,
  getSpecialty,
  specialties,
} from "../../data/mockData";
import { cn, formatToman, toFa } from "../../lib/utils";
import type { ConsultType } from "../../types";

type CommState = Record<ConsultType, { enabled: boolean; fee: number }>;

const defaultFee: Record<ConsultType, number> = {
  chat: 100000,
  audio: 150000,
  video: 250000,
};

const commLabels: Record<ConsultType, { label: string; desc: string; icon: React.ReactNode }> = {
  chat: { label: "چت متنی", desc: "مشاوره از طریق پیام متنی", icon: <IconChat className="h-5 w-5" /> },
  audio: { label: "تماس صوتی", desc: "مشاوره تلفنی", icon: <IconPhone className="h-5 w-5" /> },
  video: { label: "تماس تصویری", desc: "مشاوره ویدئویی", icon: <IconVideo className="h-5 w-5" /> },
};

export default function DoctorProfile() {
  const user = useAuthStore((s) => s.user);
  const me = doctors.find((d) => d.id === (user?.refId || "doc-1"))!;
  const specialty = getSpecialty(me.specialtyId);

  const [hours, setHours] = useState(me.workingHours.map((h) => ({ ...h, breakMinutes: h.breakMinutes ?? 15 })));
  const daysOfWeek = ["شنبه", "یکشنبه", "دوشنبه", "سه‌شنبه", "چهارشنبه", "پنجشنبه", "جمعه"];

  const hoursByDay = daysOfWeek.map((day) => ({
    day,
    slots: hours.filter((h) => h.day === day),
  }));

  const addSlot = (day: string, from: string, to: string) => {
    setHours((h) => [...h, { day, from, to, breakMinutes: 15 }]);
  };

  const removeSlot = (idx: number) =>
    setHours((h) => h.filter((_, i) => i !== idx));

  const updateSlot = (idx: number, patch: Partial<{ day: string; from: string; to: string; breakMinutes: number }>) =>
    setHours((h) => h.map((x, i) => (i === idx ? { ...x, ...patch } : x)));

  const [comm, setComm] = useState<CommState>({
    chat: { enabled: true, fee: defaultFee.chat },
    audio: { enabled: true, fee: defaultFee.audio },
    video: { enabled: true, fee: defaultFee.video },
  });
  const [commError, setCommError] = useState("");

  const toggleComm = (type: ConsultType) => {
    const next = { ...comm, [type]: { ...comm[type], enabled: !comm[type].enabled } };
    const anyEnabled = Object.values(next).some((c) => c.enabled);
    if (!anyEnabled) {
      setCommError("حداقل یکی از روش‌های ارتباطی باید فعال باشد");
      return;
    }
    setCommError("");
    setComm(next);
  };

  const setCommFee = (type: ConsultType, fee: string) => {
    const num = Number(fee.replace(/[^0-9]/g, "")) || 0;
    setComm({ ...comm, [type]: { ...comm[type], fee: num } });
  };

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
      {/* Summary */}
      <div className="space-y-6">
        <GlassCard className="flex flex-col items-center p-6 text-center">
          <Avatar src={me.avatar} size="xl" ring />
          <h2 className="mt-4 text-lg font-bold text-ink-800">{me.name}</h2>
          <p className="text-sm text-primary-600">
            {specialty?.icon} {specialty?.name}
          </p>
          <div className="mt-3 flex flex-wrap justify-center gap-2 text-xs">
            <Badge tone="green" dot>
              تأییدشده
            </Badge>
            <Badge tone="amber">
              <IconStar className="h-3 w-3" /> {toFa(me.rating.toFixed(1))}
            </Badge>
          </div>
          <div className="mt-6 grid w-full grid-cols-3 gap-2 border-t border-white/50 pt-5 text-center">
            <Mini value={toFa(me.experienceYears)} label="سال تجربه" />
            <Mini value={toFa(me.reviewsCount)} label="نظر" />
            <Mini
              value={formatToman(me.fee).split(" ")[0]}
              label="هزار تومان"
            />
          </div>
        </GlassCard>

        {/* Earnings */}
        <GlassCard className="p-6">
          <div className="flex items-center gap-2 mb-4">
            <IconWallet className="h-5 w-5 text-primary-500" />
            <h3 className="font-bold text-ink-800">درآمد</h3>
          </div>
          <div className="space-y-3">
            <div className="flex items-center justify-between rounded-xl bg-white/50 px-3 py-2.5">
              <span className="text-xs text-ink-400">این ماه</span>
              <span className="text-sm font-bold tabular text-ink-800">
                {formatToman(doctorEarnings.thisMonth)}
              </span>
            </div>
            <div className="flex items-center justify-between rounded-xl bg-white/50 px-3 py-2.5">
              <span className="text-xs text-ink-400">ماه قبل</span>
              <span className="text-sm font-bold tabular text-ink-600">
                {formatToman(doctorEarnings.lastMonth)}
              </span>
            </div>
            <div className="flex items-center justify-between rounded-xl bg-primary-50 px-3 py-2.5">
              <span className="text-xs text-primary-700">قابل برداشت</span>
              <span className="text-sm font-bold tabular text-primary-800">
                {formatToman(doctorEarnings.pending)}
              </span>
            </div>
            <PrimaryButton
              variant="subtle"
              icon={<IconWallet />}
              className="w-full"
            >
              درخواست برداشت
            </PrimaryButton>
          </div>
        </GlassCard>
      </div>

      {/* Edit form */}
      <GlassCard className="p-6 lg:col-span-2">
        <h3 className="mb-1 font-bold text-ink-800">پروفایل حرفه‌ای</h3>
        <p className="mb-5 text-xs text-ink-400">
          اطلاعات تخصصی، ساعت کاری و تعرفه ویزیت.
        </p>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <InputField
            label="نام و نام خانوادگی"
            defaultValue={me.name}
            name="name"
          />
          <InputField
            label="شماره تماس"
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
          <SelectField
            label="تخصص"
            defaultValue={me.specialtyId}
            name="specialty"
          >
            {specialties.map((s) => (
              <option key={s.id} value={s.id}>
                {s.icon} {s.name}
              </option>
            ))}
          </SelectField>
          <InputField label="شهر" defaultValue={me.city} name="city" />
          <InputField
            label="بیمارستان / مطب"
            defaultValue={me.hospital}
            name="hospital"
          />
        </div>

        <div className="mt-4">
          <label className="mb-1.5 block text-sm font-medium text-ink-700">
            درباره من
          </label>
          <textarea
            rows={3}
            defaultValue={me.bio}
            className="glass-input w-full rounded-xl px-4 py-2.5 text-sm text-ink-800 outline-none focus:ring-2 focus:ring-primary-200"
          />
        </div>

        {/* Editable working hours — grouped by day with multiple ranges */}
        <div className="mt-6">
          <div className="mb-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <IconClock className="h-4 w-4 text-primary-500" />
              <h4 className="text-sm font-semibold text-ink-700">ساعات کاری</h4>
            </div>
          </div>

          <div className="space-y-3">
            {hoursByDay.map(({ day, slots }) => {
              const slotIdxs = slots.map((s) => hours.indexOf(s)).filter((i) => i >= 0);
              return (
                <div key={day} className="glass-soft rounded-2xl overflow-hidden">
                  <div className="flex items-center justify-between bg-white/30 px-4 py-2.5">
                    <span className="text-sm font-semibold text-ink-700">{day}</span>
                    <span className="text-[11px] text-ink-400 tabular">
                      {slots.length > 0
                        ? toFa(slots.length) + " بازه"
                        : "تعریف نشده"}
                    </span>
                  </div>

                  {slotIdxs.length > 0 && (
                    <div className="space-y-1.5 p-3">
                      {slotIdxs.map((idx) => (
                        <div
                          key={idx}
                          className="rounded-xl border border-white/50 bg-white/40 p-2.5"
                        >
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-ink-400">از</span>
                            <input
                              type="time"
                              value={hours[idx].from}
                              onChange={(e) => updateSlot(idx, { from: e.target.value })}
                              className="min-w-[90px] flex-1 rounded-lg bg-transparent px-1 py-1 text-sm tabular text-ink-700 outline-none"
                            />
                            <span className="text-xs text-ink-400">تا</span>
                            <input
                              type="time"
                              value={hours[idx].to}
                              onChange={(e) => updateSlot(idx, { to: e.target.value })}
                              className="min-w-[90px] flex-1 rounded-lg bg-transparent px-1 py-1 text-sm tabular text-ink-700 outline-none"
                            />
                            <button
                              onClick={() => removeSlot(idx)}
                              className="grid h-7 w-7 shrink-0 place-items-center rounded-lg text-ink-400 hover:bg-red-50 hover:text-red-500"
                            >
                              <IconTrash className="h-3.5 w-3.5" />
                            </button>
                          </div>
                          <div className="mt-1.5 flex items-center gap-2 pr-1">
                            <span className="text-[11px] text-ink-400">استراحت:</span>
                            <input
                              type="number"
                              min={0}
                              max={60}
                              value={hours[idx].breakMinutes}
                              onChange={(e) => updateSlot(idx, { breakMinutes: Math.max(0, Number(e.target.value)) })}
                              className="w-16 rounded-lg border border-white/50 bg-white/50 px-2 py-1 text-center text-xs tabular text-ink-700 outline-none"
                            />
                            <span className="text-[11px] text-ink-400">دقیقه</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  <SlotAdder day={day} onAdd={addSlot} />
                </div>
              );
            })}
          </div>
        </div>

        {/* Communication capabilities */}
        <div className="mt-8">
          <div className="mb-4 flex items-center gap-2">
            <IconChat className="h-4 w-4 text-primary-500" />
            <h4 className="text-sm font-semibold text-ink-700">قابلیت‌های ارتباطی</h4>
          </div>

          <div className="space-y-3">
            {(Object.keys(commLabels) as ConsultType[]).map((type) => (
              <div
                key={type}
                className={cn(
                  "rounded-2xl border p-4 transition-all",
                  comm[type].enabled
                    ? "border-primary-300 bg-primary-50/60"
                    : "border-white/50 bg-white/40",
                )}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div
                      onClick={() => toggleComm(type)}
                      className={cn(
                        "flex h-11 w-11 items-center justify-center rounded-xl transition-all",
                        comm[type].enabled
                          ? "bg-primary-500 text-white shadow-glass-sm"
                          : "bg-white/60 text-ink-400",
                      )}
                    >
                      {commLabels[type].icon}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-ink-700">{commLabels[type].label}</p>
                      <p className="text-xs text-ink-400">{commLabels[type].desc}</p>
                    </div>
                  </div>
                  <button
                    type="button"
                    role="switch"
                    aria-checked={comm[type].enabled}
                    onClick={() => toggleComm(type)}
                    className={cn(
                      "relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors",
                      comm[type].enabled ? "bg-primary-500" : "bg-ink-200",
                    )}
                  >
                    <span
                      className={cn(
                        "inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform",
                        comm[type].enabled ? "-translate-x-6" : "-translate-x-1",
                      )}
                    />
                  </button>
                </div>

                {comm[type].enabled && (
                  <div className="mt-3 animate-fade-in">
                    <label className="mb-1 block text-xs font-medium text-ink-500">
                      تعرفه ویزیت ({type === "chat" ? "چت" : type === "audio" ? "صوتی" : "تصویری"})
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        inputMode="numeric"
                        value={toFa(comm[type].fee.toLocaleString("en-US"))}
                        onChange={(e) => setCommFee(type, e.target.value)}
                        className="glass-input w-full rounded-xl py-2 pr-3 pl-16 text-left text-sm tabular text-ink-800 outline-none transition focus:border-primary-300 focus:ring-2 focus:ring-primary-200"
                      />
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-ink-400">
                        تومان
                      </span>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>

          {commError && (
            <p className="mt-2 text-xs text-red-500">{commError}</p>
          )}
        </div>

        <div className="mt-6 flex justify-end gap-3">
          {/* <PrimaryButton variant="ghost">انصراف</PrimaryButton> */}
          <PrimaryButton icon={<IconCheck />}>ذخیره تغییرات</PrimaryButton>
        </div>
      </GlassCard>
    </div>
  );
}

function SlotAdder({ day, onAdd }: { day: string; onAdd: (day: string, from: string, to: string) => void }) {
  const [from, setFrom] = useState("08:00");
  const [to, setTo] = useState("10:00");
  return (
    <div className="flex items-center gap-2 border-t border-white/30 px-3 py-2">
      <input
        type="time"
        value={from}
        onChange={(e) => setFrom(e.target.value)}
        className="min-w-[80px] flex-1 rounded-lg border border-white/50 bg-white/50 px-2 py-1.5 text-sm tabular text-ink-700 outline-none"
      />
      <span className="text-xs text-ink-400">تا</span>
      <input
        type="time"
        value={to}
        onChange={(e) => setTo(e.target.value)}
        className="min-w-[80px] flex-1 rounded-lg border border-white/50 bg-white/50 px-2 py-1.5 text-sm tabular text-ink-700 outline-none"
      />
      <button
        onClick={() => onAdd(day, from, to)}
        className="flex items-center gap-1 rounded-lg bg-primary-500 px-3 py-1.5 text-xs font-medium text-white transition hover:bg-primary-600 active:scale-[.97]"
      >
        <IconPlus className="h-3.5 w-3.5" />
        افزودن بازه
      </button>
    </div>
  );
}

function Mini({ value, label }: { value: string; label: string }) {
  return (
    <div>
      <p className="text-base font-bold text-ink-800 tabular">{value}</p>
      <p className="text-[10px] text-ink-400">{label}</p>
    </div>
  );
}
