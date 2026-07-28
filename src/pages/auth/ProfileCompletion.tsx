import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useAuthStore } from "../../store/authStore";
import GlassCard from "../../components/ui/GlassCard";
import InputField, { SelectField } from "../../components/ui/InputField";
import Toggle from "../../components/ui/Toggle";
import { cn, toFa } from "../../lib/utils";
import type { UploadingFile } from "../../types";
import { ArrowBigRight, ArrowRightFromLine } from "lucide-react";
import { MdOutlineKeyboardArrowRight } from "react-icons/md";

const bloodTypes = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"];

export default function ProfileCompletion() {
  const navigate = useNavigate();
  const {
    step,
    setStep,
    userData,
    setUserData,
    isDoctor,
    setIsDoctor,
    completeProfile,
    isLoading,
    user,
    phone,
  } = useAuthStore();

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [allergyInput, setAllergyInput] = useState("");
  const [conditionInput, setConditionInput] = useState("");

  // Inline document upload state
  const docCancelRef = useRef<Record<string, () => void>>({});
  const [docFiles, setDocFiles] = useState<Record<string, UploadingFile[]>>({});

  const docFields = [
    {
      key: "license",
      label: "مدرک پزشکی/پروانه اشتغال",
      required: true,
      accept: ".pdf,.jpg,.jpeg,.png",
      maxSize: 5,
      icon: "📋",
    },
    {
      key: "nationalId",
      label: "کارت ملی/شناسنامه",
      required: true,
      accept: ".pdf,.jpg,.jpeg,.png",
      maxSize: 5,
      icon: "🪪",
    },
    {
      key: "experience",
      label: "مدارک سابقه کار",
      required: false,
      accept: ".pdf",
      maxSize: 10,
      icon: "📄",
    },
    {
      key: "specialty",
      label: "مدرک تخصص",
      required: false,
      accept: ".pdf,.jpg,.jpeg,.png",
      maxSize: 5,
      icon: "🎓",
    },
    {
      key: "profilePhoto",
      label: "عکس پروفایل",
      required: false,
      accept: ".jpg,.jpeg,.png",
      maxSize: 2,
      icon: "📸",
    },
  ];

  const simulateDocUpload = (key: string, file: UploadingFile) => {
    const interval = setInterval(() => {
      const p = Math.min(
        100,
        Math.round(
          Math.random() * 15 +
            5 +
            (docFiles[key]?.find((f) => f.id === file.id)?.progress || 0),
        ),
      );
      if (p >= 100) {
        clearInterval(interval);
        setDocFiles((prev) => ({
          ...prev,
          [key]: (prev[key] || []).map((f) =>
            f.id === file.id
              ? { ...f, progress: 100, status: "uploaded" as const }
              : f,
          ),
        }));
      } else {
        setDocFiles((prev) => ({
          ...prev,
          [key]: (prev[key] || []).map((f) =>
            f.id === file.id
              ? { ...f, progress: p, status: "uploading" as const }
              : f,
          ),
        }));
      }
    }, 300);
    docCancelRef.current[file.id] = () => clearInterval(interval);
  };

  const handleDocFile = (key: string, file: File) => {
    const field = docFields.find((f) => f.key === key);
    if (field && file.size > field.maxSize * 1024 * 1024) {
      alert(`حجم فایل باید کمتر از ${toFa(field.maxSize)} مگابایت باشد`);
      return;
    }
    const item: UploadingFile = {
      id: `f-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      name: file.name,
      size: file.size,
      type: file.name.split(".").pop() || "",
      status: "pending",
      progress: 0,
    };
    setDocFiles((prev) => ({ ...prev, [key]: [...(prev[key] || []), item] }));
    setTimeout(() => simulateDocUpload(key, item), 200);
  };

  const removeDocFile = (key: string, fileId: string) => {
    docCancelRef.current[fileId]?.();
    delete docCancelRef.current[fileId];
    setDocFiles((prev) => ({
      ...prev,
      [key]: (prev[key] || []).filter((f) => f.id !== fileId),
    }));
  };

  useEffect(() => {
    if (user) {
      const home =
        user.role === "admin"
          ? "/admin"
          : user.role === "doctor"
            ? "/doctor"
            : "/user";
      navigate(home, { replace: true });
    }
  }, [user, navigate]);

  const validateStep1 = () => {
    const e: Record<string, string> = {};
    if (!userData.name.trim()) e.name = "نام و نام خانوادگی الزامی است";
    if (!userData.dateOfBirth) e.dateOfBirth = "تاریخ تولد الزامی است";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const validateStep3 = () => {
    const e: Record<string, string> = {};
    if (!userData.acceptTerms)
      e.acceptTerms = "پذیرش قوانین و مقررات الزامی است";
    if (!userData.acceptPrivacy)
      e.acceptPrivacy = "پذیرش حریم خصوصی الزامی است";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const next = () => {
    if (step === 1 && validateStep1()) setStep(2);
    else if (step === 2) setStep(3);
    else if (step === 3 && validateStep3()) {
      completeProfile();
    }
  };

  const prev = () => {
    if (step > 1) setStep(step - 1);
    else navigate("/login", { replace: true });
  };

  const addChip = (
    field: "allergies" | "chronicConditions",
    value: string,
    input: string,
    setInput: (v: string) => void,
  ) => {
    const trimmed = value.trim();
    if (!trimmed) return;
    const current = userData[field];
    if (!current.includes(trimmed)) {
      setUserData({ [field]: [...current, trimmed] });
    }
    setInput("");
  };

  const removeChip = (
    field: "allergies" | "chronicConditions",
    item: string,
  ) => {
    setUserData({ [field]: userData[field].filter((a) => a !== item) });
  };

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden p-4">
      <div className="pointer-events-none absolute -right-40 -top-40 h-96 w-96 rounded-full bg-primary-300/30 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-40 -left-40 h-96 w-96 rounded-full bg-blue-300/30 blur-3xl" />

      <div className="z-10 w-full max-w-sm">
        {/* Back */}
        <button
          onClick={prev}
          className="glass-soft mb-4 flex items-center gap-2 rounded-xl px-4 py-2 text-sm text-ink-600 transition hover:bg-white/60"
        >
          <MdOutlineKeyboardArrowRight />
          {step === 1 ? "بازگشت" : "قبلی"}
        </button>

        <div className="mb-8 text-center">
          <h1 className="text-2xl font-bold text-ink-800">تکمیل اطلاعات</h1>
          <p className="mt-1 text-sm text-ink-400">
            لطفاً اطلاعات خود را کامل کنید
          </p>

          {/* Steps */}
          <div className="mt-4 flex items-center justify-center gap-2">
            {[1, 2, 3].map((s) => (
              <div key={s} className="flex items-center gap-2">
                <div
                  className={cn(
                    "grid h-8 w-8 place-items-center rounded-full text-xs font-bold transition-all",
                    s === step
                      ? "bg-primary-500 text-white shadow-glass-sm"
                      : s < step
                        ? "bg-primary-200 text-primary-700"
                        : "bg-white/40 text-ink-400",
                  )}
                >
                  {s < step ? "✓" : toFa(s)}
                </div>
                {s < 3 && (
                  <div
                    className={cn(
                      "h-0.5 w-6 rounded",
                      s < step ? "bg-primary-400" : "bg-white/30",
                    )}
                  />
                )}
              </div>
            ))}
          </div>
        </div>

        <GlassCard variant="default" className="p-6">
          {/* Step 1: Personal Info */}
          {step === 1 && (
            <div className="animate-fade-in space-y-4">
              <h2 className="text-base font-bold text-ink-700">اطلاعات شخصی</h2>

              <InputField
                label="نام و نام خانوادگی *"
                name="name"
                placeholder="مثال: علی محمدی"
                value={userData.name}
                onChange={(e) => {
                  setUserData({ name: e.target.value });
                  setErrors((prev) => ({ ...prev, name: "" }));
                }}
                error={errors.name}
              />

              <InputField
                label="ایمیل"
                name="email"
                type="email"
                placeholder="example@email.com"
                dir="ltr"
                value={userData.email}
                onChange={(e) => setUserData({ email: e.target.value })}
              />

              <InputField
                label="تاریخ تولد *"
                name="dateOfBirth"
                type="date"
                value={userData.dateOfBirth}
                onChange={(e) => {
                  setUserData({ dateOfBirth: e.target.value });
                  setErrors((prev) => ({ ...prev, dateOfBirth: "" }));
                }}
                error={errors.dateOfBirth}
              />

              <div>
                <label className="mb-1.5 block text-sm font-medium text-ink-700">
                  جنسیت *
                </label>
                <div className="flex gap-3">
                  {[
                    { value: "male", label: "مرد" },
                    { value: "female", label: "زن" },
                  ].map((g) => (
                    <button
                      key={g.value}
                      type="button"
                      onClick={() =>
                        setUserData({ gender: g.value as "male" | "female" })
                      }
                      className={cn(
                        "flex-1 rounded-xl border py-2.5 text-sm font-medium transition-all",
                        userData.gender === g.value
                          ? "border-primary-400 bg-primary-50 text-primary-700"
                          : "border-white/50 bg-white/40 text-ink-500 hover:bg-white/60",
                      )}
                    >
                      {g.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Step 2: Medical Info */}
          {step === 2 && (
            <div className="animate-fade-in space-y-5">
              <h2 className="text-base font-bold text-ink-700">
                اطلاعات پزشکی
              </h2>

              <SelectField
                label="گروه خونی"
                value={userData.bloodType}
                onChange={(e) => setUserData({ bloodType: e.target.value })}
              >
                <option value="">انتخاب کنید</option>
                {bloodTypes.map((b) => (
                  <option key={b} value={b}>
                    {b}
                  </option>
                ))}
              </SelectField>

              {/* Allergies */}
              <div>
                <label className="mb-1.5 block text-sm font-medium text-ink-700">
                  حساسیت‌ها
                </label>
                <div className="flex gap-2">
                  <input
                    className="glass-input flex-1 rounded-xl px-3 py-2 text-sm text-ink-800 outline-none"
                    placeholder="مثال: پنی‌سیلین"
                    value={allergyInput}
                    onChange={(e) => setAllergyInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        addChip(
                          "allergies",
                          allergyInput,
                          allergyInput,
                          setAllergyInput,
                        );
                      }
                    }}
                  />
                  <button
                    onClick={() =>
                      addChip(
                        "allergies",
                        allergyInput,
                        allergyInput,
                        setAllergyInput,
                      )
                    }
                    className="rounded-xl bg-primary-500 px-3 text-sm text-white"
                  >
                    +
                  </button>
                </div>
                {userData.allergies.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {userData.allergies.map((a) => (
                      <span
                        key={a}
                        className="inline-flex items-center gap-1 rounded-full bg-red-50 px-3 py-1 text-xs text-red-700"
                      >
                        {a}
                        <button
                          onClick={() => removeChip("allergies", a)}
                          className="text-red-400 hover:text-red-600"
                        >
                          ✕
                        </button>
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* Chronic Conditions */}
              <div>
                <label className="mb-1.5 block text-sm font-medium text-ink-700">
                  بیماری‌های زمینه‌ای
                </label>
                <div className="flex gap-2">
                  <input
                    className="glass-input flex-1 rounded-xl px-3 py-2 text-sm text-ink-800 outline-none"
                    placeholder="مثال: دیابت"
                    value={conditionInput}
                    onChange={(e) => setConditionInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        addChip(
                          "chronicConditions",
                          conditionInput,
                          conditionInput,
                          setConditionInput,
                        );
                      }
                    }}
                  />
                  <button
                    onClick={() =>
                      addChip(
                        "chronicConditions",
                        conditionInput,
                        conditionInput,
                        setConditionInput,
                      )
                    }
                    className="rounded-xl bg-primary-500 px-3 text-sm text-white"
                  >
                    +
                  </button>
                </div>
                {userData.chronicConditions.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {userData.chronicConditions.map((c) => (
                      <span
                        key={c}
                        className="inline-flex items-center gap-1 rounded-full bg-yellow-50 px-3 py-1 text-xs text-yellow-700"
                      >
                        {c}
                        <button
                          onClick={() => removeChip("chronicConditions", c)}
                          className="text-yellow-400 hover:text-yellow-600"
                        >
                          ✕
                        </button>
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* Emergency Contact */}
              <div className="glass-soft rounded-2xl p-4 space-y-3">
                <p className="text-sm font-medium text-ink-700">تماس اضطراری</p>
                <InputField
                  name="emergencyName"
                  placeholder="نام و نام خانوادگی"
                  value={userData.emergencyContact.name}
                  onChange={(e) =>
                    setUserData({
                      emergencyContact: {
                        ...userData.emergencyContact,
                        name: e.target.value,
                      },
                    })
                  }
                />
                <InputField
                  name="emergencyPhone"
                  placeholder="شماره تماس"
                  dir="ltr"
                  value={userData.emergencyContact.phone}
                  onChange={(e) =>
                    setUserData({
                      emergencyContact: {
                        ...userData.emergencyContact,
                        phone: e.target.value
                          .replace(/[^0-9۰-۹]/g, "")
                          .slice(0, 11),
                      },
                    })
                  }
                />
                <InputField
                  name="emergencyRelation"
                  placeholder="نسبت"
                  value={userData.emergencyContact.relationship}
                  onChange={(e) =>
                    setUserData({
                      emergencyContact: {
                        ...userData.emergencyContact,
                        relationship: e.target.value,
                      },
                    })
                  }
                />
              </div>

              {/* Doctor Checkbox */}
              <div
                className={cn(
                  "rounded-2xl border p-4 transition-all",
                  isDoctor
                    ? "border-primary-300 bg-primary-50/60"
                    : "border-white/50 bg-white/40",
                )}
              >
                <label className="flex cursor-pointer items-center gap-3">
                  <div
                    onClick={() => setIsDoctor(!isDoctor)}
                    className={cn(
                      "grid h-6 w-6 shrink-0 place-items-center rounded-lg border-2 transition-all",
                      isDoctor
                        ? "border-primary-500 bg-primary-500 text-white"
                        : "border-white/60 bg-white/40 text-transparent",
                    )}
                  >
                    {isDoctor && (
                      <svg
                        className="h-4 w-4"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="3"
                      >
                        <path d="M4 12l5 5L20 6" />
                      </svg>
                    )}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-ink-700">
                      من پزشک/کادر سلامت هستم
                    </p>
                    <p className="text-[11px] text-ink-400">
                      برای ثبت‌نام به عنوان پزشک، مدارک خود را بارگذاری کنید
                    </p>
                  </div>
                </label>

                {/* Inline document upload fields */}
                {isDoctor && (
                  <div className="mt-4 animate-fade-in space-y-3">
                    {docFields.map((field) => {
                      const files = docFiles[field.key] || [];
                      return (
                        <div
                          key={field.key}
                          className="glass-soft rounded-xl p-3"
                        >
                          <div className="mb-1.5 flex items-center justify-between">
                            <div className="flex items-center gap-1.5">
                              <span>{field.icon}</span>
                              <span className="text-xs font-medium text-ink-700">
                                {field.label}
                              </span>
                              {field.required ? (
                                <span className="rounded-full bg-red-100 px-2 py-0.5 text-[10px] font-medium text-red-600">
                                  ضروری
                                </span>
                              ) : (
                                <span className="rounded-full bg-ink-100 px-2 py-0.5 text-[10px] text-ink-400">
                                  اختیاری
                                </span>
                              )}
                            </div>
                          </div>

                          <DocDropZone
                            accept={field.accept}
                            maxSize={field.maxSize}
                            onFile={(f) => handleDocFile(field.key, f)}
                          />

                          {files.length > 0 && (
                            <div className="mt-1.5 space-y-1">
                              {files.map((f) => (
                                <div
                                  key={f.id}
                                  className={cn(
                                    "flex items-center gap-2 rounded-lg px-2.5 py-1.5 text-xs transition",
                                    f.status === "uploaded"
                                      ? "bg-green-50/80"
                                      : f.status === "uploading"
                                        ? "bg-white/60"
                                        : "bg-white/60",
                                  )}
                                >
                                  <span>📎</span>
                                  <span className="flex-1 truncate text-ink-600">
                                    {f.name}
                                  </span>
                                  {f.status === "uploading" ? (
                                    <div className="flex items-center gap-1.5">
                                      <div className="h-1.5 w-12 overflow-hidden rounded-full bg-primary-100">
                                        <div
                                          className="h-full rounded-full bg-primary-500 transition-all"
                                          style={{ width: `${f.progress}%` }}
                                        />
                                      </div>
                                      <span className="tabular text-primary-600">
                                        {toFa(f.progress)}%
                                      </span>
                                    </div>
                                  ) : f.status === "uploaded" ? (
                                    <span className="text-green-600">✅</span>
                                  ) : null}
                                  <button
                                    onClick={() =>
                                      removeDocFile(field.key, f.id)
                                    }
                                    className="text-ink-400 hover:text-red-500"
                                  >
                                    ✕
                                  </button>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Step 3: Terms */}
          {step === 3 && (
            <div className="animate-fade-in space-y-5">
              <h2 className="text-base font-bold text-ink-700">
                قوانین و تنظیمات
              </h2>

              <label className="flex cursor-pointer items-start gap-3">
                <input
                  type="checkbox"
                  checked={userData.acceptTerms}
                  onChange={(e) => {
                    setUserData({ acceptTerms: e.target.checked });
                    setErrors((prev) => ({ ...prev, acceptTerms: "" }));
                  }}
                  className="mt-0.5 accent-primary-500"
                />
                <div>
                  <p className="text-sm font-medium text-ink-700">
                    قوانین و مقررات را می‌پذیرم *
                  </p>
                  <p className="text-xs text-ink-400">
                    با ثبت نام، تمامی قوانین و مقررات سامانه اول دکتر را
                    می‌پذیرم
                  </p>
                </div>
              </label>
              {errors.acceptTerms && (
                <p className="text-xs text-red-500">{errors.acceptTerms}</p>
              )}

              <label className="flex cursor-pointer items-start gap-3">
                <input
                  type="checkbox"
                  checked={userData.acceptPrivacy}
                  onChange={(e) => {
                    setUserData({ acceptPrivacy: e.target.checked });
                    setErrors((prev) => ({ ...prev, acceptPrivacy: "" }));
                  }}
                  className="mt-0.5 accent-primary-500"
                />
                <div>
                  <p className="text-sm font-medium text-ink-700">
                    حریم خصوصی را می‌پذیرم *
                  </p>
                  <p className="text-xs text-ink-400">
                    با ثبت نام، حریم خصوصی و امنیت اطلاعات خود را تأیید می‌کنم
                  </p>
                </div>
              </label>
              {errors.acceptPrivacy && (
                <p className="text-xs text-red-500">{errors.acceptPrivacy}</p>
              )}

              <Toggle
                label="دریافت اعلان‌ها"
                description="اعلان‌های نوبت‌ها و پیام‌ها"
                checked={userData.receiveNotifications}
                onChange={(v) => setUserData({ receiveNotifications: v })}
              />

              <Toggle
                label="دریافت پیام‌های تبلیغاتی"
                description="اخبار، تخفیف‌ها و پیشنهادهای ویژه"
                checked={userData.receivePromotions}
                onChange={(v) => setUserData({ receivePromotions: v })}
              />
            </div>
          )}

          {/* Next / Register */}
          <div className="mt-6">
            <button
              onClick={next}
              disabled={isLoading}
              className="flex w-full items-center justify-center gap-2 rounded-2xl bg-primary-500 py-3 text-sm font-bold text-white shadow-glass-sm transition-all duration-200 hover:bg-primary-600 active:scale-[.98] disabled:bg-ink-300 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <>
                  <svg
                    className="h-5 w-5 animate-spin"
                    viewBox="0 0 24 24"
                    fill="none"
                  >
                    <circle
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="3"
                      strokeDasharray="31.4 31.4"
                      strokeLinecap="round"
                    />
                  </svg>
                  در حال ثبت‌نام...
                </>
              ) : step === 3 ? (
                "ثبت نام"
              ) : (
                "بعدی"
              )}
            </button>
          </div>
        </GlassCard>
      </div>
    </div>
  );
}

function DocDropZone({
  accept,
  maxSize,
  onFile,
}: {
  accept: string;
  maxSize: number;
  onFile: (f: File) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);
  return (
    <div
      onClick={() => inputRef.current?.click()}
      onDragOver={(e) => {
        e.preventDefault();
        setDragOver(true);
      }}
      onDragLeave={() => setDragOver(false)}
      onDrop={(e) => {
        e.preventDefault();
        setDragOver(false);
        Array.from(e.dataTransfer.files).forEach(onFile);
      }}
      className={cn(
        "flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed p-3 text-center transition",
        dragOver
          ? "border-primary-400 bg-primary-50/60"
          : "border-white/50 bg-white/30 hover:bg-white/50",
      )}
    >
      <span className="text-base text-ink-400">📤</span>
      <p className="mt-0.5 text-[11px] text-ink-500">
        فایل را بکشید یا کلیک کنید
      </p>
      <p className="text-[10px] text-ink-400">حداکثر {toFa(maxSize)} MB</p>
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        className="hidden"
        onChange={(e) => {
          Array.from(e.target.files || []).forEach(onFile);
          e.target.value = "";
        }}
      />
    </div>
  );
}
