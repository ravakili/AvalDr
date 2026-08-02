import { useEffect, useRef, useState } from "react";
import GlassCard from "../../components/ui/GlassCard";
import PrimaryButton from "../../components/ui/PrimaryButton";
import Avatar from "../../components/ui/Avatar";
import Badge from "../../components/ui/Badge";
import InputField, { SelectField } from "../../components/ui/InputField";
import Modal from "../../components/ui/Modal";
import Tabs from "../../components/ui/Tabs";
import JalaliDateSelect from "../../components/ui/JalaliDateSelect";
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
  IconLogout,
  IconUser,
  IconSettings,
} from "../../components/ui/icons";
import { useAuthStore } from "../../store/authStore";
import {
  doctorEarnings,
  doctors,
  getSpecialty,
  specialties,
} from "../../data/apiData";
import { api, apiRequest } from "../../lib/api";
import { refreshBackendData } from "../../data/apiData";
import { cn, formatToman, toFa } from "../../lib/utils";
import type {
  ConsultType,
  CommunicationSettings,
  WorkingHourSlot,
} from "../../types";
import { toast } from "../../store/toastStore";

type CommState = Record<ConsultType, { enabled: boolean; fee: number }>;

const defaultFee: Record<ConsultType, number> = {
  chat: 100000,
  audio: 150000,
  video: 250000,
};

const commLabels: Record<
  ConsultType,
  { label: string; desc: string; icon: React.ReactNode }
> = {
  chat: {
    label: "چت متنی",
    desc: "مشاوره از طریق پیام متنی",
    icon: <IconChat className="h-5 w-5" />,
  },
  audio: {
    label: "تماس صوتی",
    desc: "مشاوره تلفنی",
    icon: <IconPhone className="h-5 w-5" />,
  },
  video: {
    label: "تماس تصویری",
    desc: "مشاوره ویدئویی",
    icon: <IconVideo className="h-5 w-5" />,
  },
};

const tabs = [
  {
    key: "profile",
    label: "پروفایل",
    icon: <IconUser className="h-4 w-4" />,
  },
  {
    key: "payment",
    label: "اطلاعات پرداخت",
    icon: <IconWallet className="h-4 w-4" />,
  },
  {
    key: "hours",
    label: "ساعات کاری",
    icon: <IconClock className="h-4 w-4" />,
  },
  {
    key: "comm",
    label: "قابلیت‌های ارتباطی",
    icon: <IconChat className="h-4 w-4" />,
  },
] as const;

type TabKey = (typeof tabs)[number]["key"];

export default function DoctorProfile() {
  const user = useAuthStore((s) => s.user);
  const me = doctors.find((d) => d.id === (user?.refId || "doc-1"));
  const logout = useAuthStore((s) => s.logout);
  const [saving, setSaving] = useState(false);
  const avatarInputRef = useRef<HTMLInputElement>(null);
  const [avatarUploading, setAvatarUploading] = useState(false);
  const [avatarSrc, setAvatarSrc] = useState(me?.avatar);

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setAvatarUploading(true);
    try {
      const form = new FormData();
      form.append("avatar", file);
      const res = await apiRequest<{ avatar: string }>("/doctors/me/", {
        method: "PATCH",
        body: form,
      });
      setAvatarSrc(res.avatar);
      refreshBackendData("doctor");
      toast.success("عکس پروفایل به‌روزرسانی شد");
    } catch {
      toast.error("خطا در آپلود عکس");
    } finally {
      setAvatarUploading(false);
    }
  };

  useEffect(() => {
    setAvatarSrc(me?.avatar);
  }, [me?.avatar]);

  const [defOptions, setDefOptions] = useState<
    Record<string, { id: string; name: string }[]>
  >({});

  useEffect(() => {
    const fetchDefs = async () => {
      try {
        const types = ["prefix", "city", "insurance_type", "supplementary_insurance"];
        const results = await Promise.all(
          types.map(async (t) => {
            const data = await api.get<{ id: string; name: string }[]>(
              `/common/definitions/?type=${t}`,
            );
            return [t, data] as [string, { id: string; name: string }[]];
          }),
        );
        setDefOptions(Object.fromEntries(results));
      } catch {
        /* ignore */
      }
    };
    fetchDefs();
  }, []);

  const [hours, setHours] = useState<WorkingHourSlot[]>([]);
  const daysOfWeek = [
    "شنبه",
    "یکشنبه",
    "دوشنبه",
    "سه‌شنبه",
    "چهارشنبه",
    "پنجشنبه",
    "جمعه",
  ];

  const hoursByDay = daysOfWeek.map((day) => ({
    day,
    slots: hours.filter((h) => h.day === day),
  }));

  const [duplicateError, setDuplicateError] = useState("");

  const isOverlap = (
    day: string,
    from: string,
    to: string,
    excludeIdx?: number,
  ) =>
    hours.some(
      (h, i) =>
        i !== excludeIdx &&
        h.day === day &&
        ((from >= h.from && from < h.to) ||
          (to > h.from && to <= h.to) ||
          (from <= h.from && to >= h.to)),
    );

  const addSlot = (day: string, from: string, to: string) => {
    if (isOverlap(day, from, to)) {
      setDuplicateError("این بازه با بازه‌های تعریف‌شده تداخل دارد");
      return;
    }
    setDuplicateError("");
    setHours((h) => [
      ...h,
      { day, from, to, breakMinutes: 15, appointmentDurationMinutes: 30 },
    ]);
  };

  const removeSlot = (idx: number) =>
    setHours((h) => h.filter((_, i) => i !== idx));

  const updateSlot = (idx: number, patch: Partial<WorkingHourSlot>) => {
    setHours((h) => {
      const updated = h.map((x, i) => (i === idx ? { ...x, ...patch } : x));
      const item = updated[idx];
      const overlap = updated.some(
        (x, i) =>
          i !== idx &&
          x.day === item.day &&
          ((item.from >= x.from && item.from < x.to) ||
            (item.to > x.from && item.to <= x.to) ||
            (item.from <= x.from && item.to >= x.to)),
      );
      if (overlap) {
        setDuplicateError("این بازه با بازه‌های تعریف‌شده تداخل دارد");
        return h;
      }
      setDuplicateError("");
      return updated;
    });
  };

  const [comm, setComm] = useState<CommState>({
    chat: { enabled: true, fee: defaultFee.chat },
    audio: { enabled: true, fee: defaultFee.audio },
    video: { enabled: true, fee: defaultFee.video },
  });
  const [chatAutoCloseMinutes, setChatAutoCloseMinutes] = useState(1440);
  const [commError, setCommError] = useState("");

  const toggleComm = (type: ConsultType) => {
    const next = {
      ...comm,
      [type]: { ...comm[type], enabled: !comm[type].enabled },
    };
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

  const [name, setName] = useState("");
  const [prefix, setPrefix] = useState("دکتر");
  const [selectedSpecialty, setSelectedSpecialty] = useState("");
  const [city, setCity] = useState("");
  const [hospital, setHospital] = useState("");
  const [bio, setBio] = useState("");
  const [nationalId, setNationalId] = useState("");
  const [gender, setGender] = useState("");
  const [birthDate, setBirthDate] = useState("");
  const [bloodType, setBloodType] = useState("");
  const [insuranceType, setInsuranceType] = useState("");
  const [supplementaryInsurance, setSupplementaryInsurance] = useState("");

  const [cardNumber, setCardNumber] = useState("");
  const [accountNumber, setAccountNumber] = useState("");
  const [shaba, setShaba] = useState("");

  const [withdrawOpen, setWithdrawOpen] = useState(false);

  const [activeTab, setActiveTab] = useState("profile");

  useEffect(() => {
    if (!me) return;
    setHours(
      me.workingHours.map((h) => ({
        ...h,
        breakMinutes: h.breakMinutes ?? 15,
        appointmentDurationMinutes: h.appointmentDurationMinutes ?? 30,
      })),
    );
    setComm({
      chat: {
        enabled: me.communication?.chat?.enabled ?? true,
        fee: me.communication?.chat?.fee ?? defaultFee.chat,
      },
      audio: {
        enabled: me.communication?.audio?.enabled ?? true,
        fee: me.communication?.audio?.fee ?? defaultFee.audio,
      },
      video: {
        enabled: me.communication?.video?.enabled ?? true,
        fee: me.communication?.video?.fee ?? defaultFee.video,
      },
    });
    setChatAutoCloseMinutes(me.communication?.chatAutoCloseMinutes ?? 1440);
    setName(me.name);
    setPrefix(me.prefix || "دکتر");
    setSelectedSpecialty(me.specialtyId);
    setCity(me.city);
    setHospital(me.hospital);
    setBio(me.bio);
    setNationalId(me.nationalId || "");
    setGender(me.gender || "");
    setBirthDate(me.dateOfBirth || "");
    setBloodType(me.bloodType || "");
    setInsuranceType(me.insuranceType || "");
    setSupplementaryInsurance(me.supplementaryInsurance || "");
    setCardNumber(me.cardNumber || "");
    setAccountNumber(me.accountNumber || "");
    setShaba(me.shaba || "");
  }, [me]);

  if (!me)
    return (
      <div className="p-10 text-center text-ink-500">در حال بارگذاری...</div>
    );

  const specialty = getSpecialty(me.specialtyId);

  const profileTabs = [
    { key: "profile", label: "پروفایل حرفه‌ای" },
    { key: "payment", label: "اطلاعات پرداخت" },
    { key: "hours", label: "ساعات کاری" },
    { key: "comm", label: "قابلیت‌های ارتباطی" },
  ];

  const saveAll = async () => {
    setSaving(true);
    try {
      await Promise.all([
        api.patch("/doctors/me/", {
          name,
          prefix,
          specialtyId: selectedSpecialty,
          city,
          hospital,
          bio,
          cardNumber,
          accountNumber,
          shaba,
          nationalId,
          gender,
          dateOfBirth: birthDate || null,
          bloodType,
          insuranceType,
          supplementaryInsurance,
        }),
        api.put("/doctors/me/communication/", {
          chat: comm.chat,
          audio: comm.audio,
          video: comm.video,
          chatAutoCloseMinutes,
        }),
        api.put("/doctors/me/working-hours/", hours),
      ]);
      await refreshBackendData("doctor");
      toast.success("اطلاعات پزشک ذخیره شد");
    } catch (e) {
      toast.error(
        "خطا در ذخیره اطلاعات",
        e instanceof Error ? e.message : undefined,
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
      {/* Summary sidebar */}
      <div className="space-y-6">
        <GlassCard className="flex flex-col items-center p-6 text-center">
          <div className="flex w-full items-center justify-end gap-3">
            <button
              onClick={logout}
              className="grid h-8 w-8 shrink-0 place-items-center rounded-lg text-ink-400 transition text-red-300 hover:border-red-500 border-red-300 border-2 hover:bg-red-50 hover:text-red-500"
              title="خروج"
            >
              <IconLogout />
            </button>
          </div>
          <div
            className="relative cursor-pointer group"
            onClick={() => avatarInputRef.current?.click()}
          >
            <div className="transition-opacity group-hover:opacity-75">
              <Avatar src={avatarSrc} size="xl" ring />
            </div>
            <div className="absolute inset-0 flex items-center justify-center rounded-full opacity-0 group-hover:opacity-100 transition-opacity">
              <div className="rounded-full bg-black/40 p-2 text-white">
                <svg
                  className="h-5 w-5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"
                  />
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M15 13a3 3 0 11-6 0 3 3 0 016 0z"
                  />
                </svg>
              </div>
            </div>
            {avatarUploading && (
              <div className="absolute inset-0 flex items-center justify-center rounded-full bg-black/30">
                <svg
                  className="h-6 w-6 animate-spin text-white"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                  />
                </svg>
              </div>
            )}
          </div>
          <input
            ref={avatarInputRef}
            type="file"
            className="hidden"
            accept="image/*"
            onChange={handleAvatarChange}
          />
          <h2 className="mt-4 text-lg font-bold text-ink-800">
            {me.prefix || "دکتر"} {me.name}
          </h2>
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
              onClick={() => setWithdrawOpen(true)}
            >
              درخواست برداشت
            </PrimaryButton>
          </div>
        </GlassCard>
      </div>

      {/* Main content with tabs */}
      <GlassCard className="p-6 lg:col-span-2">
        {/* Tab bar */}
        <Tabs tabs={profileTabs} active={activeTab} onChange={setActiveTab} />

        {/* Tab panels */}
        {activeTab === "profile" && (
          <ProfileTab
            me={me}
            name={name}
            setName={setName}
            prefix={prefix}
            setPrefix={setPrefix}
            selectedSpecialty={selectedSpecialty}
            setSelectedSpecialty={setSelectedSpecialty}
            city={city}
            setCity={setCity}
            hospital={hospital}
            setHospital={setHospital}
            bio={bio}
            setBio={setBio}
            defOptions={defOptions}
            nationalId={nationalId}
            setNationalId={setNationalId}
            gender={gender}
            setGender={setGender}
            birthDate={birthDate}
            setBirthDate={setBirthDate}
            bloodType={bloodType}
            setBloodType={setBloodType}
            insuranceType={insuranceType}
            setInsuranceType={setInsuranceType}
            supplementaryInsurance={supplementaryInsurance}
            setSupplementaryInsurance={setSupplementaryInsurance}
          />
        )}
        {activeTab === "payment" && (
          <PaymentTab
            cardNumber={cardNumber}
            setCardNumber={setCardNumber}
            accountNumber={accountNumber}
            setAccountNumber={setAccountNumber}
            shaba={shaba}
            setShaba={setShaba}
          />
        )}
        {activeTab === "hours" && (
          <HoursTab
            hours={hours}
            setHours={setHours}
            hoursByDay={hoursByDay}
            daysOfWeek={daysOfWeek}
            duplicateError={duplicateError}
            addSlot={addSlot}
            removeSlot={removeSlot}
            updateSlot={updateSlot}
          />
        )}
        {activeTab === "comm" && (
          <CommTab
            comm={comm}
            setComm={setComm}
            commError={commError}
            toggleComm={toggleComm}
            setCommFee={setCommFee}
            chatAutoCloseMinutes={chatAutoCloseMinutes}
            setChatAutoCloseMinutes={setChatAutoCloseMinutes}
          />
        )}

        <div className="mt-6 flex justify-end gap-3">
          <PrimaryButton
            icon={<IconCheck />}
            onClick={saveAll}
            disabled={saving}
          >
            {saving ? "در حال ذخیره..." : "ذخیره تغییرات"}
          </PrimaryButton>
        </div>
      </GlassCard>

      {/* Withdrawal modal */}
      <Modal
        open={withdrawOpen}
        onClose={() => setWithdrawOpen(false)}
        title="درخواست برداشت"
        size="sm"
        footer={
          <>
            <PrimaryButton
              icon={<IconCheck />}
              disabled={!shaba}
              onClick={() => setWithdrawOpen(false)}
            >
              تأیید و ثبت
            </PrimaryButton>
            <PrimaryButton
              variant="ghost"
              onClick={() => setWithdrawOpen(false)}
            >
              انصراف
            </PrimaryButton>
          </>
        }
      >
        <div className="space-y-4">
          <p className="text-sm text-ink-600">
            مبلغ{" "}
            <b className="text-ink-800">
              {formatToman(doctorEarnings.pending)}
            </b>{" "}
            به شماره شبا زیر واریز می‌شود:
          </p>
          <div className="rounded-xl bg-primary-50/60 p-4 text-center">
            <p className="text-xs text-ink-400 mb-1">شماره شبا</p>
            <p className="font-bold tabular text-ink-800" dir="ltr">
              {shaba || "هنوز ثبت نشده"}
            </p>
          </div>
          {!shaba && (
            <p className="text-xs text-amber-600">
              لطفاً ابتدا شماره شبا را در بخش «اطلاعات پرداخت» وارد کنید.
            </p>
          )}
          <p className="text-xs text-ink-400">
            با تأیید، درخواست برداشت شما ثبت می‌شود و پس از بررسی مدیریت، واریز
            انجام می‌گیرد.
          </p>
        </div>
      </Modal>
    </div>
  );
}

// Tab components
const bloodTypes = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"];

function ProfileTab({
  me,
  name,
  setName,
  prefix,
  setPrefix,
  selectedSpecialty,
  setSelectedSpecialty,
  city,
  setCity,
  hospital,
  setHospital,
  bio,
  setBio,
  defOptions,
  nationalId,
  setNationalId,
  gender,
  setGender,
  birthDate,
  setBirthDate,
  bloodType,
  setBloodType,
  insuranceType,
  setInsuranceType,
  supplementaryInsurance,
  setSupplementaryInsurance,
}: {
  me: (typeof doctors)[0];
  name: string;
  setName: (v: string) => void;
  prefix: string;
  setPrefix: (v: string) => void;
  selectedSpecialty: string;
  setSelectedSpecialty: (v: string) => void;
  city: string;
  setCity: (v: string) => void;
  hospital: string;
  setHospital: (v: string) => void;
  bio: string;
  setBio: (v: string) => void;
  defOptions: Record<string, { id: string; name: string }[]>;
  nationalId: string;
  setNationalId: (v: string) => void;
  gender: string;
  setGender: (v: string) => void;
  birthDate: string;
  setBirthDate: (v: string) => void;
  bloodType: string;
  setBloodType: (v: string) => void;
  insuranceType: string;
  setInsuranceType: (v: string) => void;
  supplementaryInsurance: string;
  setSupplementaryInsurance: (v: string) => void;
}) {
  return (
    <div className="space-y-6 mt-4">
      <p className="text-xs text-ink-400">اطلاعات تخصصی، آدرس و لوکیشن مطب.</p>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <InputField
          label="نام و نام خانوادگی"
          value={name}
          onChange={(e) => setName(e.target.value)}
          name="name"
        />
        <InputField
          label="شماره تماس"
          dir="ltr"
          className="text-right"
          value={me.phone}
          name="phone"
          readOnly
        />
        <InputField
          label="کد ملی"
          name="nationalId"
          dir="ltr"
          className="text-right"
          inputMode="numeric"
          maxLength={10}
          value={nationalId}
          onChange={(e) =>
            setNationalId(e.target.value.replace(/[^\d]/g, "").slice(0, 10))
          }
        />
        <SelectField
          label="جنسیت"
          value={gender}
          onChange={(e) => setGender(e.target.value)}
          name="gender"
        >
          <option value="">انتخاب کنید</option>
          <option value="male">مرد</option>
          <option value="female">زن</option>
        </SelectField>
        <JalaliDateSelect
          label="تاریخ تولد (شمسی)"
          value={birthDate}
          onChange={setBirthDate}
        />
        <SelectField
          label="گروه خونی"
          value={bloodType}
          onChange={(e) => setBloodType(e.target.value)}
          name="bloodType"
        >
          <option value="">انتخاب کنید</option>
          {bloodTypes.map((b) => (
            <option key={b} value={b}>
              {b}
            </option>
          ))}
        </SelectField>
        <SelectField
          label="بیمه پایه"
          value={insuranceType}
          onChange={(e) => setInsuranceType(e.target.value)}
          name="insuranceType"
        >
          <option value="">انتخاب کنید</option>
          {(defOptions.insurance_type || []).map((d) => (
            <option key={d.id} value={d.name}>
              {d.name}
            </option>
          ))}
        </SelectField>
        <SelectField
          label="بیمه تکمیلی"
          value={supplementaryInsurance}
          onChange={(e) => setSupplementaryInsurance(e.target.value)}
          name="supplementaryInsurance"
        >
          <option value="">ندارد</option>
          {(defOptions.supplementary_insurance || []).map((d) => (
            <option key={d.id} value={d.name}>
              {d.name}
            </option>
          ))}
        </SelectField>
        <SelectField
          label="پیشوند"
          value={prefix}
          onChange={(e) => setPrefix(e.target.value)}
          name="prefix"
        >
          {(defOptions.prefix || []).map((p) => (
            <option key={p.id} value={p.name}>
              {p.name}
            </option>
          ))}
        </SelectField>
        <SelectField
          label="تخصص"
          value={selectedSpecialty}
          onChange={(e) => setSelectedSpecialty(e.target.value)}
          name="specialty"
        >
          {specialties.map((s) => (
            <option key={s.id} value={s.id}>
              {s.icon} {s.name}
            </option>
          ))}
        </SelectField>
        <SelectField
          label="شهر"
          value={city}
          onChange={(e) => setCity(e.target.value)}
          name="city"
        >
          <option value="">انتخاب کنید</option>
          {(defOptions.city || []).map((c) => (
            <option key={c.id} value={c.name}>
              {c.name}
            </option>
          ))}
        </SelectField>
        <InputField
          label="بیمارستان / مطب"
          value={hospital}
          onChange={(e) => setHospital(e.target.value)}
          name="hospital"
        />
      </div>

      <div className="mt-4">
        <label className="mb-1.5 block text-sm font-medium text-ink-700">
          درباره من
        </label>
        <textarea
          rows={3}
          value={bio}
          onChange={(e) => setBio(e.target.value)}
          className="glass-input w-full rounded-xl px-4 py-2.5 text-sm text-ink-800 outline-none focus:ring-2 focus:ring-primary-200"
        />
      </div>
    </div>
  );
}

function PaymentTab({
  cardNumber,
  setCardNumber,
  accountNumber,
  setAccountNumber,
  shaba,
  setShaba,
}: {
  cardNumber: string;
  setCardNumber: (v: string) => void;
  accountNumber: string;
  setAccountNumber: (v: string) => void;
  shaba: string;
  setShaba: (v: string) => void;
}) {
  return (
    <div className="space-y-4 mt-4">
      <p className="text-xs text-ink-400">اطلاعات بانکی برای واریز درآمدها.</p>
      <div className="space-y-4">
        <InputField
          label="شماره کارت"
          name="card"
          dir="ltr"
          className="text-right"
          value={cardNumber}
          onChange={(e) => setCardNumber(e.target.value)}
          placeholder="۶۰۳۷-XXXX-XXXX-XXXX"
        />
        <InputField
          label="شماره حساب"
          name="account"
          dir="ltr"
          className="text-right"
          value={accountNumber}
          onChange={(e) => setAccountNumber(e.target.value)}
          placeholder="XXXXXXXXXX"
        />
        <InputField
          label="شماره شبا"
          name="shaba"
          dir="ltr"
          className="text-right"
          value={shaba}
          onChange={(e) => setShaba(e.target.value)}
          placeholder="IRXXXXXXXXXXXXXXXXXXX"
        />
      </div>
    </div>
  );
}

const BREAK_OPTIONS = [0, 5, 10, 15, 20, 30, 45, 60];
const DURATION_OPTIONS = [5, 10, 15, 20, 30, 45, 60, 90, 120];

function HoursTab({
  hours,
  setHours,
  hoursByDay,
  daysOfWeek,
  duplicateError,
  addSlot,
  removeSlot,
  updateSlot,
}: {
  hours: WorkingHourSlot[];
  setHours: React.Dispatch<React.SetStateAction<WorkingHourSlot[]>>;
  hoursByDay: { day: string; slots: WorkingHourSlot[] }[];
  daysOfWeek: string[];
  duplicateError: string;
  addSlot: (day: string, from: string, to: string) => void;
  removeSlot: (idx: number) => void;
  updateSlot: (idx: number, patch: Partial<WorkingHourSlot>) => void;
}) {
  const [selectedDays, setSelectedDays] = useState<string[]>([]);
  const [bulkFrom, setBulkFrom] = useState("08:00");
  const [bulkTo, setBulkTo] = useState("10:00");

  const toggleDay = (day: string) =>
    setSelectedDays((prev) =>
      prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day],
    );

  const addBulk = () => {
    if (bulkFrom >= bulkTo) return;
    selectedDays.forEach((day) => addSlot(day, bulkFrom, bulkTo));
  };

  return (
    <div className="space-y-4 mt-4">
      <p className="text-xs text-ink-400">
        تعریف بازه‌های زمانی برای هر روز هفته. بازه‌های متداخل مجاز نیستند.
      </p>

      {duplicateError && (
        <p className="mb-2 text-xs text-red-500">{duplicateError}</p>
      )}

      {/* Bulk add section */}
      <div className="rounded-2xl border border-primary-200 bg-primary-50/40 p-4">
        <p className="mb-3 text-sm font-medium text-ink-700">
          افزودن بازه به چند روز
        </p>
        <div className="mb-3 flex flex-wrap gap-2">
          {daysOfWeek.map((day) => (
            <label
              key={day}
              className={`flex cursor-pointer items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs transition ${
                selectedDays.includes(day)
                  ? "border-primary-400 bg-primary-100 text-primary-800"
                  : "border-white/50 bg-white/50 text-ink-600"
              }`}
            >
              <input
                type="checkbox"
                checked={selectedDays.includes(day)}
                onChange={() => toggleDay(day)}
                className="hidden"
              />
              {day}
            </label>
          ))}
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs text-ink-400">از</span>
          <input
            type="time"
            value={bulkFrom}
            onChange={(e) => setBulkFrom(e.target.value)}
            className="rounded-lg border border-white/50 bg-white/50 px-2 py-1.5 text-sm tabular text-ink-700 outline-none"
          />
          <span className="text-xs text-ink-400">تا</span>
          <input
            type="time"
            value={bulkTo}
            onChange={(e) => setBulkTo(e.target.value)}
            className="rounded-lg border border-white/50 bg-white/50 px-2 py-1.5 text-sm tabular text-ink-700 outline-none"
          />
          <button
            onClick={addBulk}
            disabled={selectedDays.length === 0}
            className="flex items-center gap-1 rounded-lg bg-primary-500 px-3 py-1.5 text-xs font-medium text-white transition hover:bg-primary-600 disabled:opacity-50 active:scale-[.97]"
          >
            <IconPlus className="h-3.5 w-3.5" />
            افزودن به {selectedDays.length} روز
          </button>
        </div>
      </div>

      <div className="space-y-3">
        {hoursByDay.map(({ day, slots }) => {
          const slotIdxs = slots
            .map((s) => hours.indexOf(s))
            .filter((i) => i >= 0);
          return (
            <div key={day} className="glass-soft rounded-2xl overflow-hidden">
              <div className="flex items-center justify-between bg-white/30 px-4 py-2.5">
                <span className="text-sm font-semibold text-ink-700">
                  {day}
                </span>
                <span className="text-[11px] text-ink-400 tabular">
                  {slots.length > 0 ? slots.length + " بازه" : "تعریف نشده"}
                </span>
              </div>

              {slotIdxs.length > 0 && (
                <div className="flex flex-wrap gap-2 p-3">
                  {slotIdxs.map((idx) => (
                    <div
                      key={idx}
                      className="flex-[1_1_calc(50%-0.5rem)] md:flex-[1_1_calc(50%-0.5rem)] min-w-[200px] max-w-full md:max-w-[calc(50%-0.5rem)] rounded-xl border border-primary-200 bg-white/40 p-2.5"
                    >
                      <div className="flex items-center gap-2 bg-primary-100 rounded-2xl px-2">
                        <span className="text-xs text-ink-400">از</span>
                        <input
                          type="time"
                          value={hours[idx].from}
                          onChange={(e) =>
                            updateSlot(idx, { from: e.target.value })
                          }
                          className="min-w-[90px] flex-1 rounded-lg bg-transparent px-1 py-1 text-sm tabular text-ink-700 outline-none"
                        />
                        <span className="text-xs text-ink-400">تا</span>
                        <input
                          type="time"
                          value={hours[idx].to}
                          onChange={(e) =>
                            updateSlot(idx, { to: e.target.value })
                          }
                          className="min-w-[90px] flex-1 rounded-lg bg-transparent px-1 py-1 text-sm tabular text-ink-700 outline-none"
                        />
                        <button
                          onClick={() => removeSlot(idx)}
                          className="grid h-7 w-7 shrink-0 place-items-center rounded-lg text-ink-400 hover:bg-red-50 hover:text-red-500"
                        >
                          <IconTrash className="h-3.5 w-3.5" />
                        </button>
                      </div>
                      <div className="mt-1.5 flex items-center gap-4 pr-1 flex-wrap">
                        <div className="flex items-center gap-2 bg-primary-100 rounded-2xl px-2 py-1">
                          <span className="text-[11px] text-ink-400">
                            استراحت:
                          </span>
                          <select
                            value={hours[idx].breakMinutes}
                            onChange={(e) =>
                              updateSlot(idx, {
                                breakMinutes: Number(e.target.value),
                              })
                            }
                            className="rounded-lg border border-white/50 bg-white/50 px-2 py-1 text-xs tabular text-ink-700 outline-none"
                          >
                            {BREAK_OPTIONS.map((v) => (
                              <option key={v} value={v}>
                                {v}
                              </option>
                            ))}
                          </select>
                          <span className="text-[11px] text-ink-400">
                            دقیقه
                          </span>
                        </div>
                        <div className="flex items-center gap-2 bg-primary-100 rounded-2xl px-2 py-1">
                          <span className="text-[11px] text-ink-400">
                            مدت ویزیت:
                          </span>
                          <select
                            value={hours[idx].appointmentDurationMinutes ?? 30}
                            onChange={(e) =>
                              updateSlot(idx, {
                                appointmentDurationMinutes: Number(
                                  e.target.value,
                                ),
                              })
                            }
                            className="rounded-lg border border-white/50 bg-white/50 px-2 py-1 text-xs tabular text-ink-700 outline-none"
                          >
                            {DURATION_OPTIONS.map((v) => (
                              <option key={v} value={v}>
                                {v}
                              </option>
                            ))}
                          </select>
                          <span className="text-[11px] text-ink-400">
                            دقیقه
                          </span>
                        </div>
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
  );
}

function CommTab({
  comm,
  setComm,
  commError,
  toggleComm,
  setCommFee,
  chatAutoCloseMinutes,
  setChatAutoCloseMinutes,
}: {
  comm: Record<ConsultType, { enabled: boolean; fee: number }>;
  setComm: React.Dispatch<React.SetStateAction<typeof comm>>;
  commError: string;
  toggleComm: (type: ConsultType) => void;
  setCommFee: (type: ConsultType, fee: string) => void;
  chatAutoCloseMinutes: number;
  setChatAutoCloseMinutes: (v: number) => void;
}) {
  return (
    <div className="space-y-4 mt-4">
      <p className="text-xs text-ink-400">
        روش‌های مشاوره و تعرفه هر یک را تنظیم کنید.
      </p>

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
                  <p className="text-sm font-medium text-ink-700">
                    {commLabels[type].label}
                  </p>
                  <p className="text-xs text-ink-400">
                    {commLabels[type].desc}
                  </p>
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
                  تعرفه ویزیت (
                  {type === "chat"
                    ? "چت"
                    : type === "audio"
                      ? "صوتی"
                      : "تصویری"}
                  )
                </label>
                <div className="relative">
                  <input
                    type="text"
                    inputMode="numeric"
                    value={comm[type].fee.toString()}
                    onChange={(e) => {
                      // Remove non-digit characters
                      const rawValue = e.target.value.replace(/,/g, "");
                      // Only allow numbers
                      if (rawValue === "" || /^\d+$/.test(rawValue)) {
                        setCommFee(type, rawValue);
                      }
                    }}
                    onBlur={(e) => {
                      // Format with commas when user leaves the field
                      const value = comm[type].fee;
                      if (value && !isNaN(value)) {
                        // Update display with formatted value if needed
                        e.target.value = Number(value).toLocaleString("en-US");
                      }
                    }}
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

      {/* Auto-close chat timer */}
      <div className="rounded-2xl border border-white/50 bg-white/40 p-4">
        <div className="flex items-center gap-3 mb-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-ink-100 text-ink-500">
            <IconClock className="h-5 w-5" />
          </div>
          <div>
            <p className="text-sm font-medium text-ink-700">بستن خودکار چت</p>
            <p className="text-xs text-ink-400">
              پس از اتمام جلسه، چت به‌طور خودکار بسته شود
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 pr-1">
          <input
            type="number"
            min={0}
            max={43200}
            value={chatAutoCloseMinutes}
            onChange={(e) =>
              setChatAutoCloseMinutes(Math.max(0, Number(e.target.value)))
            }
            className="w-20 rounded-lg border border-white/50 bg-white/50 px-2 py-1.5 text-center text-sm tabular text-ink-700 outline-none"
          />
          <span className="text-xs text-ink-400">دقیقه</span>
          <span className="text-xs text-ink-400 mx-1">
            ({Math.floor(chatAutoCloseMinutes / 1440)} روز{" "}
            {Math.floor((chatAutoCloseMinutes % 1440) / 60)} ساعت)
          </span>
        </div>
      </div>

      {commError && <p className="mt-2 text-xs text-red-500">{commError}</p>}
    </div>
  );
}

function SlotAdder({
  day,
  onAdd,
}: {
  day: string;
  onAdd: (day: string, from: string, to: string) => void;
}) {
  const [from, setFrom] = useState("08:00");
  const [to, setTo] = useState("10:00");
  return (
    <div className="flex items-center gap-2 border-t border-primary-200 bg-primary-100 px-3 py-2">
      <div className="flex flex-row gap-1 items-center max-w-[800px]">
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
          onClick={() => {
            if (from >= to) return;
            onAdd(day, from, to);
          }}
          className="flex items-center gap-1 rounded-lg bg-primary-500 px-3 py-1.5 text-xs font-medium text-white transition hover:bg-primary-600 active:scale-[.97]"
        >
          <IconPlus className="h-3.5 w-3.5" />
          افزودن بازه
        </button>
      </div>
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
