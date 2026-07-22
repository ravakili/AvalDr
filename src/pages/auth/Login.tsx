import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuthStore } from "../../store/authStore";
import { cn, toFa } from "../../lib/utils";

function toEnglishDigits(str: string) {
  return str.replace(/[۰-۹]/g, (d) => "۰۱۲۳۴۵۶۷۸۹".indexOf(d).toString());
}

export default function Login() {
  const navigate = useNavigate();
  const { phone, setPhone, sendOTP, isLoading, user } = useAuthStore();
  const [input, setInput] = useState("");
  const [error, setError] = useState("");
  const [showTerms, setShowTerms] = useState(false);

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

  const raw = toEnglishDigits(input);
  const isValid = /^09\d{9}$/.test(raw);

  const handleChange = (val: string) => {
    const digits = val.replace(/[^0-9۰-۹]/g, "");
    setInput(digits.slice(0, 11));
    setError("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isValid) {
      setError("شماره موبایل معتبر وارد کنید (مثال: 09123456789)");
      return;
    }
    setPhone(raw);
    await sendOTP(raw);
    navigate("/verify-otp", { replace: true });
  };

  const formatDisplay = (v: string) => {
    const e = toEnglishDigits(v);
    if (e.length <= 4) return e;
    if (e.length <= 7) return `${e.slice(0, 4)} ${e.slice(4)}`;
    return `${e.slice(0, 4)} ${e.slice(4, 7)} ${e.slice(7, 11)}`;
  };

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden p-4">
      <div className="pointer-events-none absolute -right-40 -top-40 h-96 w-96 rounded-full bg-primary-300/30 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-40 -left-40 h-96 w-96 rounded-full bg-blue-300/30 blur-3xl" />

      <div className="z-10 w-full max-w-sm">
        {/* Brand */}
        <div className="mb-8 text-center">
          <div className="mx-auto mb-3 grid h-16 w-16 place-items-center rounded-3xl bg-white/20 text-3xl font-black text-primary-500 backdrop-blur-xl shadow-glass">
            س
          </div>
          <h1 className="text-2xl font-bold text-primary-500">
            ورود به دکتر ساینا
          </h1>
          <p className="mt-1 text-sm text-ink-400">
            شماره موبایل خود را وارد کنید
          </p>
        </div>

        {/* Card */}
        <div className="glass rounded-3xl p-6">
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Phone input */}
            <div>
              <label className="mb-2 block text-sm font-medium text-ink-700">
                شماره موبایل
              </label>
              <div className="relative">
                <span className="absolute left-3 top-3.5 z-10 text-md font-medium text-ink-500">
                  98+
                </span>
                <input
                  type="tel"
                  inputMode="numeric"
                  autoComplete="tel"
                  placeholder="912 000 0000"
                  value={formatDisplay(input)}
                  onChange={(e) => handleChange(e.target.value)}
                  className={cn(
                    "glass-input w-full rounded-xl py-3 pl-12 pr-4 text-left text-base font-medium tabular tracking-widest text-ink-800 outline-none transition focus:border-primary-300 focus:ring-2 focus:ring-primary-200",
                    error &&
                      "border-red-300 focus:border-red-300 focus:ring-red-200",
                  )}
                  style={{ fontFeatureSettings: "'ss01'" }}
                />
              </div>
              {input && (
                <p className="mt-1.5 text-xs text-ink-400 tabular" dir="ltr">
                  {toFa(raw)}
                </p>
              )}
              {error && <p className="mt-1.5 text-xs text-red-500">{error}</p>}
            </div>

            <button
              type="submit"
              disabled={!isValid || isLoading}
              className={cn(
                "flex w-full items-center justify-center gap-2 rounded-2xl py-3 text-sm font-bold text-white shadow-glass-sm transition-all duration-200",
                isValid && !isLoading
                  ? "bg-primary-500 hover:bg-primary-600 active:scale-[.98]"
                  : "bg-ink-300 cursor-not-allowed",
              )}
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
                  در حال ارسال...
                </>
              ) : (
                "ارسال کد تایید"
              )}
            </button>
          </form>
        </div>

        {/* Previous phone */}
        {phone && (
          <button
            onClick={() => {
              setInput(phone);
              setShowTerms(true);
            }}
            className="glass-soft mt-4 w-full rounded-2xl px-4 py-2.5 text-center text-sm text-ink-500 transition hover:bg-white/60"
          >
            ورود با شماره {toFa(phone)}
          </button>
        )}

        {/* Terms */}
        <p className="mt-6 text-center text-[11px] text-ink-400">
          ورود شما به معنای پذیرش{" "}
          <button
            onClick={() => setShowTerms(!showTerms)}
            className="font-medium text-primary-600 hover:underline"
          >
            قوانین و مقررات
          </button>{" "}
          است
        </p>
        {showTerms && (
          <div className="glass-soft mt-3 rounded-2xl p-4 text-xs leading-6 text-ink-500">
            با ورود به دکتر ساینا، شما قوانین و مقررات استفاده از سامانه را
            پذیرفته‌اید. اطلاعات شخصی شما نزد ما محفوظ خواهد ماند.
          </div>
        )}
      </div>
    </div>
  );
}
