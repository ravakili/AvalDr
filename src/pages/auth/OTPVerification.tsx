import { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useAuthStore } from "../../store/authStore";
import GlassCard from "../../components/ui/GlassCard";
import OTPInput from "../../components/auth/OTPInput";
import { toFa } from "../../lib/utils";
import { MdOutlineKeyboardArrowRight } from "react-icons/md";

export default function OTPVerification() {
  const navigate = useNavigate();
  const {
    phone,
    otpCode,
    otpSent,
    isLoading,
    otpTimer,
    resendCount,
    sendOTP,
    verifyOTP,
    decrementTimer,
    resetTimer,
    incrementResend,
    canResend,
    user,
  } = useAuthStore();

  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const timerRef = useRef<ReturnType<typeof setInterval>>();

  useEffect(() => {
    if (!otpSent) {
      navigate("/login", { replace: true });
      return;
    }
    if (user) {
      const home =
        user.role === "admin"
          ? "/admin"
          : user.role === "doctor"
            ? "/doctor"
            : "/user";
      navigate(home, { replace: true });
    }
  }, [otpSent, user, navigate]);

  useEffect(() => {
    timerRef.current = setInterval(() => {
      decrementTimer();
    }, 1000);
    return () => clearInterval(timerRef.current);
  }, [decrementTimer]);

  const handleVerify = useCallback(async () => {
    if (code.length !== 6 || isLoading) return;
    setError("");
    const result = await verifyOTP(code);
    if (!result.success) {
      setError("کد وارد شده اشتباه است");
      return;
    }
    if (result.isNewUser) {
      navigate("/complete-profile", { replace: true });
    } else {
      const home =
        result.role === "admin"
          ? "/admin"
          : result.role === "doctor"
            ? "/doctor"
            : "/user";
      navigate(home, { replace: true });
    }
  }, [code, isLoading, verifyOTP, navigate]);

  useEffect(() => {
    if (code.length === 6) handleVerify();
  }, [code, handleVerify]);

  const handleResend = async () => {
    if (!canResend()) return;
    resetTimer();
    incrementResend();
    setCode("");
    setError("");
    await sendOTP(phone);
  };

  const handleBack = () => {
    navigate("/login", { replace: true });
  };

  const maskedPhone =
    phone.length >= 7 ? `${phone.slice(0, 4)}***${phone.slice(-3)}` : phone;

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden p-4">
      <div className="pointer-events-none absolute -right-40 -top-40 h-96 w-96 rounded-full bg-primary-300/30 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-40 -left-40 h-96 w-96 rounded-full bg-blue-300/30 blur-3xl" />

      <div className="z-10 w-full max-w-sm">
        {/* Back */}
        <button
          onClick={handleBack}
          className="glass-soft mb-6 flex items-center gap-2 rounded-xl px-4 py-2 text-sm text-ink-600 transition hover:bg-white/60"
        >
          <MdOutlineKeyboardArrowRight />
          بازگشت
        </button>

        <div className="mb-8 text-center">
          <h1 className="text-2xl font-bold text-ink-800">
            تایید کد یکبار مصرف
          </h1>
          <p className="mt-2 text-sm text-ink-400">
            کد ۶ رقمی ارسال شده به {toFa(maskedPhone)} را وارد کنید
          </p>
        </div>

        <GlassCard variant="default" className="p-6">
          <div className="space-y-6">
            <OTPInput
              length={6}
              value={code}
              onChange={(val) => {
                setCode(val);
                setError("");
              }}
              error={error}
              disabled={isLoading}
            />

            <button
              onClick={handleVerify}
              disabled={code.length !== 6 || isLoading}
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
                  در حال تایید...
                </>
              ) : (
                "تایید کد"
              )}
            </button>

            {/* Timer / Resend */}
            <div className="text-center">
              {otpTimer > 0 ? (
                <p className="text-sm text-ink-400">
                  ارسال مجدد کد تا {toFa(otpTimer)} ثانیه
                </p>
              ) : (
                <button
                  onClick={handleResend}
                  disabled={!canResend() || isLoading}
                  className="text-sm font-medium text-primary-600 transition hover:text-primary-700 disabled:text-ink-300 disabled:cursor-not-allowed"
                >
                  {canResend()
                    ? "ارسال مجدد کد"
                    : `حداکثر ارسال مجدد (${toFa(resendCount)}/${toFa(3)})`}
                </button>
              )}
            </div>

            {otpCode && (
              <div className="glass-soft rounded-2xl p-3 text-center text-xs text-ink-400">
                کد تست:{" "}
                <span className="tabular font-bold text-primary-600" dir="ltr">
                  {toFa(otpCode)}
                </span>
                <br />
                (در کنسول مرورگر نیز نمایش داده شده)
              </div>
            )}
          </div>
        </GlassCard>
      </div>
    </div>
  );
}
