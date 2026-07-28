import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useAuthStore } from "../../store/authStore";
import { cn, toFa } from "../../lib/utils";
import { Player } from "@lottiefiles/react-lottie-player";
import spinnerRaw from "../../assets/HealthTap-Spinner.json";

function toEnglishDigits(str: string) {
  return str.replace(/[۰-۹]/g, (d) => "۰۱۲۳۴۵۶۷۸۹".indexOf(d).toString());
}

function toStr(v: number) {
  return v.toFixed(4);
}

function buildSpinner() {
  const html = document.documentElement;
  const style = getComputedStyle(html);
  const isDark = html.classList.contains("dark");

  const p500 = style
    .getPropertyValue("--color-primary-500")
    .trim()
    .split(" ")
    .map(Number);
  let light: number[];
  if (isDark) {
    light = [16, 21, 27]; // ink-900
  } else {
    light = style
      .getPropertyValue("--color-primary-50")
      .trim()
      .split(" ")
      .map(Number);
  }

  return JSON.parse(
    JSON.stringify(spinnerRaw)
      .replace(
        /1,0,0,1(?=\])/g,
        `${toStr(p500[0] / 255)},${toStr(p500[1] / 255)},${toStr(p500[2] / 255)},1`,
      )
      .replace(
        /1,0.995999983245,0.995999983245,1(?=\])/g,
        `${toStr(light[0] / 255)},${toStr(light[1] / 255)},${toStr(light[2] / 255)},1`,
      ),
  );
}

export default function Login() {
  const navigate = useNavigate();
  const { phone, setPhone, sendOTP, isLoading, user } = useAuthStore();
  const [input, setInput] = useState("");
  const [error, setError] = useState("");
  const [showTerms, setShowTerms] = useState(false);
  const [themeVer, setThemeVer] = useState(0);

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
  // Accept both formats: with leading 0 (0912...) or without (912...)
  const isValid = /^0?9\d{9}$/.test(raw);

  const handleChange = (val: string) => {
    const digits = val.replace(/[^0-9۰-۹]/g, "");
    // Remove leading zero if present (store without zero)
    const cleaned = digits.replace(/^0+/, "");
    setInput(cleaned.slice(0, 10)); // Max 10 digits (without leading zero)
    setError("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    // Ensure we have a valid 10-digit number (without zero)
    const cleanNumber = raw.replace(/^0+/, "");
    if (!/^9\d{9}$/.test(cleanNumber)) {
      setError("شماره موبایل معتبر وارد کنید");
      return;
    }
    // Add leading zero for storage/API
    const fullNumber = "0" + cleanNumber;
    setPhone(fullNumber);
    await sendOTP(fullNumber);
    navigate("/verify-otp", { replace: true });
  };

  const formatDisplay = (v: string) => {
    const e = toEnglishDigits(v);
    if (e.length <= 3) return e;
    if (e.length <= 6) return `${e.slice(0, 3)} ${e.slice(3)}`;
    return `${e.slice(0, 3)} ${e.slice(3, 6)} ${e.slice(6, 10)}`;
  };

  const spinnerSrc = useMemo(() => buildSpinner(), [themeVer]);

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden p-4">
      <div className="pointer-events-none absolute -right-40 -top-40 h-96 w-96 rounded-full bg-primary-300/30 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-40 -left-40 h-96 w-96 rounded-full bg-blue-300/30 blur-3xl" />

      <div className="z-10 w-full max-w-sm">
        {/* Brand */}
        <div className="mb-8 text-center flex flex-col items-center">
          <div className="grid h-20 w-20 place-items-center ">
            <Player src={spinnerSrc} loop autoplay className="h-full w-full" />
          </div>
          <h1 className="text-2xl font-bold text-primary-500">
            ورود به اول دکتر
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
                  {toFa("98+")}
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

              {error && <p className="mt-1.5 text-xs text-red-500">{error}</p>}
            </div>

            <button
              type="submit"
              className={cn(
                "flex w-full items-center justify-center gap-2 rounded-2xl py-3 text-sm font-bold text-white shadow-glass-sm transition-all duration-200 bg-primary-500 hover:bg-primary-600 active:scale-[.98]",
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
        {/* {phone && (
          <button
            onClick={() => {
              // Remove leading zero when showing in input
              setInput(phone.replace(/^0/, ""));
              setShowTerms(true);
            }}
            className="glass-soft mt-4 w-full rounded-2xl px-4 py-2.5 text-center text-sm text-ink-500 transition hover:bg-white/60"
          >
            ورود با شماره {toFa(phone)}
          </button>
        )} */}

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
            با ورود به اول دکتر، شما قوانین و مقررات استفاده از سامانه را
            پذیرفته‌اید. اطلاعات شخصی شما نزد ما محفوظ خواهد ماند. 09121110001
            .... 09330001111 .... 09123456788
          </div>
        )}
      </div>
    </div>
  );
}
