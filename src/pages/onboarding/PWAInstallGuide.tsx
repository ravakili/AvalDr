import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { cn } from "../../lib/utils";
import PrimaryButton from "../../components/ui/PrimaryButton";
import GlassCard from "../../components/ui/GlassCard";

const isIOS = () =>
  /iPad|iPhone|iPod/.test(navigator.userAgent) ||
  (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);

const steps = [
  {
    title: "باز کردن مرورگر",
    desc: "مرورگر سافاری (iOS) یا کروم (اندروید) را باز کنید",
    icon: (
      <svg
        viewBox="0 0 80 80"
        className="h-24 w-24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
      >
        <circle cx="40" cy="40" r="28" strokeWidth="2" />
        <circle cx="40" cy="40" r="12" strokeWidth="2" />
        <path d="M40 12v6M40 62v6M12 40h6M62 40h6" strokeWidth="2" />
        <path d="M22 22l4 4M54 54l4 4M22 58l4-4M54 26l4-4" strokeWidth="1.5" />
      </svg>
    ),
  },
  {
    title: "دکمه اشتراک‌گذاری",
    desc: isIOS()
      ? "روی دکمه اشتراک‌گذاری (مربع با فلش رو به بالا) در نوار پایین ضربه بزنید"
      : "روی دکمه سه نقطه در نوار بالا ضربه بزنید",
    icon: (
      <svg
        viewBox="0 0 80 80"
        className="h-24 w-24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
      >
        <path d="M40 8v36M28 20l12-12 12 12" />
        <path d="M16 44v16a8 8 0 008 8h32a8 8 0 008-8V44" strokeWidth="1.5" />
      </svg>
    ),
  },
  {
    title: "افزودن به صفحه اصلی",
    desc: isIOS()
      ? 'به پایین اسکرول کنید و گزینه "Add to Home Screen" را انتخاب کنید'
      : 'گزینه "Add to Home screen" یا "نصب برنامه" را انتخاب کنید',
    icon: (
      <svg
        viewBox="0 0 80 80"
        className="h-24 w-24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
      >
        <rect x="16" y="8" width="48" height="64" rx="8" strokeWidth="1.5" />
        <path d="M32 8v6h16V8" />
        <path d="M40 30v20M30 40h20" strokeWidth="2" />
      </svg>
    ),
  },
  {
    title: "تأیید نصب",
    desc: 'روی دکمه "Add" در گوشه بالا سمت راست ضربه بزنید',
    icon: (
      <svg
        viewBox="0 0 80 80"
        className="h-24 w-24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
      >
        <circle cx="40" cy="40" r="28" strokeWidth="2" />
        <path d="M28 40l8 8 16-16" strokeWidth="2.5" />
        <path d="M40 14v6M40 60v6M14 40h6M60 40h6" strokeWidth="1.5" />
      </svg>
    ),
  },
];

export default function PWAInstallGuide() {
  const [current, setCurrent] = useState(0);
  const navigate = useNavigate();

  const skip = () => {
    localStorage.setItem("dr-saina-pwa-seen", "true");
    navigate("/onboarding", { replace: true });
  };

  const done = () => {
    localStorage.setItem("dr-saina-pwa-installed", "true");
    localStorage.setItem("dr-saina-pwa-seen", "true");
    navigate("/onboarding", { replace: true });
  };

  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden p-4 text-black">
      <div className="pointer-events-none absolute -right-40 -top-40 h-96 w-96 rounded-full bg-primary-300/30 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-40 -left-40 h-96 w-96 rounded-full bg-blue-300/30 blur-3xl" />

      {/* Skip */}
      <button
        onClick={skip}
        className="glass-soft absolute left-4 top-4 z-10 rounded-xl px-4 py-2 text-sm font-medium text-ink-600 transition hover:bg-white/60"
      >
        رد کردن
      </button>

      <div className="z-10 flex w-full max-w-sm flex-col items-center">
        {/* Step indicator */}
        <div className="mb-8 flex items-center gap-2">
          {steps.map((_, i) => (
            <div
              key={i}
              className={cn(
                "h-2 rounded-full transition-all duration-300",
                i === current
                  ? "w-8 bg-primary-500"
                  : i < current
                    ? "w-2 bg-primary-300"
                    : "w-2 bg-white/40",
              )}
            />
          ))}
        </div>

        {/* Card */}
        <GlassCard hover className="flex flex-col p-5 w-[350px]">
          <div className="mb-6 flex justify-center text-primary-400">
            {steps[current].icon}
          </div>

          <h2 className="mb-2 text-xl font-bold text-primary-500">
            {steps[current].title}
          </h2>
          <p className="mb-8 text-sm leading-6 text-primary-500">
            {steps[current].desc}
          </p>

          {/* Step number */}
          <div className="glass mx-auto mb-6 inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-xs text-primary-500">
            <span>مرحله</span>
            <span className="tabular">{current + 1}</span>
            <span>از</span>
            <span className="tabular">{steps.length}</span>
          </div>

          {/* Actions */}
          <div className="flex flex-col gap-3">
            {current < steps.length - 1 ? (
              <PrimaryButton size="sm" onClick={() => setCurrent((c) => c + 1)}>
                مرحله بعدی
              </PrimaryButton>
            ) : (
           
              <PrimaryButton size="sm" onClick={done}>
                نصب شد!
              </PrimaryButton>
            )}

            {current === 0 && (
              <PrimaryButton className="bg-red-200 text-black" size="sm" onClick={skip}>
                بعداً نصب می‌کنم
              </PrimaryButton>
            
            )}
          </div>
        </GlassCard>

        {/* OS badge */}
        <div className="glass-soft mt-6 rounded-xl px-4 py-2 text-xs text-primary-500">
          {isIOS() ? "iOS • Safari" : "اندروید • کروم"}
        </div>
      </div>
    </div>
  );
}
