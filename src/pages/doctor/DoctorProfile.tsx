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
} from "../../components/ui/icons";
import { useAuthStore } from "../../store/authStore";
import {
  doctorEarnings,
  doctors,
  getSpecialty,
  specialties,
} from "../../data/mockData";
import { cn, formatToman, toFa } from "../../lib/utils";

export default function DoctorProfile() {
  const user = useAuthStore((s) => s.user);
  const me = doctors.find((d) => d.id === (user?.refId || "doc-1"))!;
  const specialty = getSpecialty(me.specialtyId);

  const [hours, setHours] = useState(me.workingHours);
  const [newDay, setNewDay] = useState("شنبه");
  const [newFrom, setNewFrom] = useState("08:00");
  const [newTo, setNewTo] = useState("14:00");

  const addHour = () => {
    setHours((h) => [...h, { day: newDay, from: newFrom, to: newTo }]);
  };
  const removeHour = (idx: number) =>
    setHours((h) => h.filter((_, i) => i !== idx));

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
          <InputField
            label="تعرفه ویزیت (تومان)"
            dir="ltr"
            className="text-right"
            defaultValue={String(me.fee)}
            name="fee"
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

        {/* Editable working hours */}
        <div className="mt-6">
          <div className="mb-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <IconClock className="h-4 w-4 text-primary-500" />
              <h4 className="text-sm font-semibold text-ink-700">ساعات کاری</h4>
            </div>
          </div>

          <div className="space-y-2">
            {hours.map((w, idx) => (
              <div
                key={idx}
                className="flex flex-wrap items-center gap-2 rounded-xl border border-white/50 bg-white/40 p-2 sm:p-3"
              >
                {/* Day Select - Full width on mobile */}
                <select
                  value={w.day}
                  onChange={(e) =>
                    setHours((h) =>
                      h.map((x, i) =>
                        i === idx ? { ...x, day: e.target.value } : x,
                      ),
                    )
                  }
                  className="w-full flex-1 rounded-lg bg-transparent px-2 py-1.5 text-sm text-ink-700 outline-none sm:w-auto"
                >
                  {[
                    "شنبه",
                    "یکشنبه",
                    "دوشنبه",
                    "سه‌شنبه",
                    "چهارشنبه",
                    "پنجشنبه",
                    "جمعه",
                  ].map((d) => (
                    <option key={d} value={d}>
                      {d}
                    </option>
                  ))}
                </select>

                {/* Time inputs - Responsive flex */}
                <div className="flex flex-1 items-center gap-1 sm:gap-2">
                  <input
                    type="time"
                    value={w.from}
                    onChange={(e) =>
                      setHours((h) =>
                        h.map((x, i) =>
                          i === idx ? { ...x, from: e.target.value } : x,
                        ),
                      )
                    }
                    className="min-w-[80px] flex-1 rounded-lg bg-transparent px-1 py-1.5 text-sm tabular text-ink-600 outline-none sm:min-w-[100px] sm:px-2"
                  />
                  <span className="text-xs text-ink-400">تا</span>
                  <input
                    type="time"
                    value={w.to}
                    onChange={(e) =>
                      setHours((h) =>
                        h.map((x, i) =>
                          i === idx ? { ...x, to: e.target.value } : x,
                        ),
                      )
                    }
                    className="min-w-[80px] flex-1 rounded-lg bg-transparent px-1 py-1.5 text-sm tabular text-ink-600 outline-none sm:min-w-[100px] sm:px-2"
                  />
                </div>

                {/* Delete button */}
                <button
                  onClick={() => removeHour(idx)}
                  className="grid h-8 w-8 shrink-0 place-items-center rounded-lg text-ink-400 hover:bg-red-50 hover:text-red-500 sm:h-7 sm:w-7"
                  title="حذف"
                >
                  <IconTrash className="h-4 w-4 sm:h-3.5 sm:w-3.5" />
                </button>
              </div>
            ))}
          </div>

          {/* Add new time row - Mobile optimized */}
          <div className="mt-3 flex flex-wrap items-center gap-2 border bg-primary-400 border-primary-400 rounded-xl p-2">
            <select
              value={newDay}
              onChange={(e) => setNewDay(e.target.value)}
              className="w-full flex-1 rounded-lg bg-transparent px-2 py-1.5 text-sm text-ink-700 outline-none sm:w-auto"
            >
              {[
                "شنبه",
                "یکشنبه",
                "دوشنبه",
                "سه‌شنبه",
                "چهارشنبه",
                "پنجشنبه",
                "جمعه",
              ].map((d) => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
            </select>

            <div className="flex flex-1 items-center gap-1 sm:gap-2">
              <input
                type="time"
                value={newFrom}
                onChange={(e) => setNewFrom(e.target.value)}
                className="min-w-[70px] flex-1 rounded-lg border border-white/60 bg-white/60 px-1 py-2 text-sm tabular text-ink-600 outline-none sm:min-w-[100px] sm:px-2 sm:py-1.5"
              />
              <span className="text-xs text-ink-400">تا</span>
              <input
                type="time"
                value={newTo}
                onChange={(e) => setNewTo(e.target.value)}
                className="min-w-[70px] flex-1 rounded-lg border border-white/60 bg-white/60 px-1 py-2 text-sm tabular text-ink-600 outline-none sm:min-w-[100px] sm:px-2 sm:py-1.5"
              />
            </div>

            <PrimaryButton
              size="sm"
              variant="subtle"
              icon={<IconPlus className="h-4 w-4" />}
              onClick={addHour}
              className="w-full sm:w-auto"
            >
              افزودن
            </PrimaryButton>
          </div>
        </div>

        <div className="mt-6 flex justify-end gap-3">
          <PrimaryButton variant="ghost">انصراف</PrimaryButton>
          <PrimaryButton icon={<IconCheck />}>ذخیره تغییرات</PrimaryButton>
        </div>
      </GlassCard>
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
