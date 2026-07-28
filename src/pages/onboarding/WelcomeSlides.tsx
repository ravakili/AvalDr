import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { cn } from "../../lib/utils";
import PrimaryButton from "../../components/ui/PrimaryButton";

const slides = [
  {
    title: "به اول دکتر خوش آمدید",
    desc: "در هر زمان و هر مکان به بهترین پزشکان متصل شوید",
    icon: (
      <svg
        viewBox="0 0 120 120"
        className="h-32 w-32"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
      >
        <circle cx="60" cy="40" r="24" strokeWidth="2" />
        <path d="M24 100c0-20 16-36 36-36s36 16 36 36" strokeWidth="2" />
        <path d="M60 28v24M48 40h24" strokeWidth="2.5" />
        <circle cx="60" cy="40" r="3" fill="currentColor" stroke="none" />
        <path
          d="M90 20a12 12 0 01-8-4M100 30a12 12 0 01-8-4"
          strokeWidth="1.5"
        />
      </svg>
    ),
  },
  {
    title: "مشاوره آسان و سریع",
    desc: "با چند کلیک ساده، نوبت خود را رزرو کنید و از مشاوره آنلاین با پزشکان مجرب بهره‌مند شوید",
    icon: (
      <svg
        viewBox="0 0 120 120"
        className="h-32 w-32"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
      >
        <circle cx="40" cy="40" r="18" strokeWidth="2" />
        <path d="M12 90c0-15 12-28 28-28s28 13 28 28" strokeWidth="2" />
        <rect x="68" y="24" width="40" height="52" rx="6" strokeWidth="1.8" />
        <path d="M88 24V14a6 6 0 016-6h4a6 6 0 016 6v10" strokeWidth="1.5" />
        <path d="M78 44h20M78 54h20M78 64h14" strokeWidth="2" />
        <circle cx="40" cy="40" r="3" fill="currentColor" stroke="none" />
      </svg>
    ),
  },
  {
    title: "امن و قابل اعتماد",
    desc: "تمامی اطلاعات پزشکی شما با بالاترین استانداردهای امنیتی محافظت می‌شود",
    icon: (
      <svg
        viewBox="0 0 120 120"
        className="h-32 w-32"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
      >
        <path
          d="M60 12L20 28v20c0 28 16 48 40 56 24-8 40-28 40-56V28L60 12z"
          strokeWidth="2"
        />
        <path d="M46 56l10 10 18-18" strokeWidth="2.5" />
        <circle cx="60" cy="60" r="4" fill="currentColor" stroke="none" />
      </svg>
    ),
  },
];

export default function WelcomeSlides() {
  const [current, setCurrent] = useState(0);
  const navigate = useNavigate();

  const skip = () => {
    localStorage.setItem("AvalDr-onboarding-done", "true");
    navigate("/login", { replace: true });
  };

  const next = () => {
    if (current < slides.length - 1) {
      setCurrent((c) => c + 1);
    } else {
      localStorage.setItem("AvalDr-onboarding-done", "true");
      navigate("/login", { replace: true });
    }
  };

  const isLast = current === slides.length - 1;

  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden p-4 text-primary-500">
      <div className="pointer-events-none absolute -right-40 -top-40 h-96 w-96 rounded-full bg-primary-300/30 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-40 -left-40 h-96 w-96 rounded-full bg-blue-300/30 blur-3xl" />

      {/* Skip */}
      <button
        onClick={skip}
        className="glass-soft absolute left-4 top-4 z-10 rounded-xl px-4 py-2 text-sm font-medium text-primary-500 transition hover:bg-white/60"
      >
        رد کردن
      </button>

      <div className="z-10 flex w-full max-w-sm flex-col items-center ">
        {/* Progress dots */}
        <div className="mb-10 flex items-center gap-2">
          {slides.map((_, i) => (
            <button
              key={i}
              onClick={() => setCurrent(i)}
              className={cn(
                "rounded-full transition-all duration-300",
                i === current
                  ? "h-3 w-8 bg-primary-500"
                  : "h-3 w-3 bg-white/40 hover:bg-white/60",
              )}
              aria-label={`اسلاید ${i + 1}`}
            />
          ))}
        </div>

        {/* Slide card */}
        <div
          key={current}
          className="glass-dark w-full animate-fade-in rounded-3xl p-8 text-center"
        >
          <div className="mb-6 flex justify-center text-primary-500">
            {slides[current].icon}
          </div>

          <h2 className="mb-3 text-2xl font-bold text-primary-500">
            {slides[current].title}
          </h2>
          <p className="mb-10 text-sm leading-7 text-primary-500">
            {slides[current].desc}
          </p>

          <PrimaryButton
            onClick={next}
            className="w-full  py-3 text-sm font-bold  backdrop-blur-md transition hover:bg-primary-500/30 active:scale-[.98]"
          >
            {isLast ? "ورود" : "بعدی"}
          </PrimaryButton>
        </div>
      </div>
    </div>
  );
}
