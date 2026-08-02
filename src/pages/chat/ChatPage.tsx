import { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import GlassCard from "../../components/ui/GlassCard";
import PrimaryButton from "../../components/ui/PrimaryButton";
import Avatar from "../../components/ui/Avatar";
import Badge from "../../components/ui/Badge";
import Modal from "../../components/ui/Modal";
import EmptyState from "../../components/ui/EmptyState";
import InputField, { TextArea } from "../../components/ui/InputField";
import {
  IconCalendar,
  IconChat,
  IconCheck,
  IconClock,
  IconDownload,
  IconFile,
  IconMic,
  IconMicOff,
  IconPhone,
  IconPhoneOff,
  IconPrescription,
  IconScreenShare,
  IconSend,
  IconUpload,
  IconVideo,
  IconUsers,
  IconChevron,
  IconPlus,
  IconChevronRight,
} from "../../components/ui/icons";
import {
  appointments,
  drugSuggestions,
  getPatient,
  getDoctor,
  doctorName,
  refreshBackendData,
  syncAppointment,
  doctors,
} from "../../data/apiData";
import { api } from "../../lib/api";
import { useAuthStore } from "../../store/authStore";
import { cn, formatDateFa, toFa, shortDateFa } from "../../lib/utils";
import type {
  Appointment,
  ChatMessage,
  Prescription,
  ConsultType,
  SupportThread,
} from "../../types";
import { BiMessageRoundedDots, BiSupport } from "react-icons/bi";
import { toast } from "../../store/toastStore";

/* ───────── helper to get conversation counterpart ───────── */
function chatCounterpart(a: (typeof appointments)[0], isDoctor: boolean) {
  if (isDoctor) return getPatient(a.patientId);
  return getDoctor(a.doctorId);
}

/* ───────── admin conversation id ───────── */
const ADMIN_CONVERSATION_ID = "__admin__";
const SUPPORT_PREFIX = "support:";

/* ───────── main component ───────── */
export default function ChatPage() {
  const { appointmentId } = useParams();
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);
  const isDoctor = user?.role === "doctor";
  const isAdmin = user?.role === "admin";
  const ME = user?.id || "";
  const ME_REF = user?.refId || "";

  /* ── active conversation ── */
  const [activeId, setActiveId] = useState<string>(
    appointmentId ||
      appointments.filter(
        (a) =>
          a.status !== "cancelled" &&
          (a.doctorId === ME_REF || a.patientId === (ME_REF || ME)),
      )[0]?.id ||
      "",
  );
  const activeAppt = appointments.find((a) => a.id === activeId);
  const supportId = activeId.startsWith(SUPPORT_PREFIX)
    ? activeId.slice(SUPPORT_PREFIX.length)
    : "";
  const isAdminChat = activeId === ADMIN_CONVERSATION_ID || !!supportId;

  /* ── support chat ── */
  const [supportThreads, setSupportThreads] = useState<SupportThread[]>([]);
  const [mySupportThreadId, setMySupportThreadId] = useState<string>("");
  const supportThreadId = supportId || mySupportThreadId;
  const supportThread = supportId
    ? supportThreads.find((t) => t.id === supportId)
    : undefined;

  /* ── messages ── */
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [draft, setDraft] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  /* ── prescription modals ── */
  const [rxOpen, setRxOpen] = useState(false);
  const [rxViewOpen, setRxViewOpen] = useState(false);
  const [rxViewData, setRxViewData] = useState<Prescription | null>(null);
  const [rxItems, setRxItems] = useState<{ drug: string; usage: string }[]>([
    { drug: "", usage: "" },
  ]);
  const [rxNotes, setRxNotes] = useState("");
  const [drugQuery, setDrugQuery] = useState("");

  /* ── call ── */
  const [videoActive, setVideoActive] = useState(false);
  const [callTimer, setCallTimer] = useState(0);
  const [muted, setMuted] = useState(false);
  const [cameraOff, setCameraOff] = useState(false);
  const [screenSharing, setScreenSharing] = useState(false);

  /* ── end modal ── */
  const [endOpen, setEndOpen] = useState(false);

  /* ── chat state ── */
  const [chatClosed, setChatClosed] = useState(false);
  const [lastMessages, setLastMessages] = useState<Record<string, string>>({});
  const [statusTick, setStatusTick] = useState(0);

  /* ── derived counterpart ── */
  const patient = activeAppt ? getPatient(activeAppt.patientId) : undefined;
  const doctor = activeAppt ? getDoctor(activeAppt.doctorId) : undefined;
  const counterpart = isAdminChat
    ? supportId
      ? {
          name: supportThread?.participantName || "کاربر",
          avatar: supportThread?.participantAvatar || "",
          phone: supportThread?.participantPhone || "",
        }
      : { name: "پشتیبانی", avatar: "", phone: "" }
    : isDoctor
      ? patient
      : doctor;
  const counterpartName = !isDoctor
    ? doctorName(counterpart)
    : counterpart?.name || "";

  /* ── list appointments for sidebar ── */
  const myAppointments = isAdmin
    ? appointments
    : appointments.filter(
        (a) => a.doctorId === ME_REF || a.patientId === (ME_REF || ME),
      );

  const activeAppointments = myAppointments.filter(
    (a) => a.status === "in-progress" || a.status === "waiting",
  );
  const pastAppointments = myAppointments.filter(
    (a) => a.status === "completed" || a.status === "cancelled",
  );

  /* ── fetch messages + appointment status ── */
  useEffect(() => {
    if (!activeId) {
      setMessages([]);
      return;
    }
    if (isAdminChat) {
      let active = true;
      let threadId = supportThreadId;
      const loadMessages = () => {
        if (!threadId) return;
        api
          .get<ChatMessage[]>(`/chat/support/threads/${threadId}/messages/`)
          .then((msgs) => {
            if (active) setMessages(msgs);
          })
          .catch(() => {});
      };
      const init = async () => {
        if (threadId) {
          loadMessages();
        } else if (activeId === ADMIN_CONVERSATION_ID) {
          try {
            const thread = await api.post<SupportThread>(
              "/chat/support/threads/",
            );
            threadId = thread.id;
            setMySupportThreadId(thread.id);
            loadMessages();
          } catch {
            /* ignore */
          }
        }
      };
      init();
      const interval = setInterval(loadMessages, 4000);
      return () => {
        active = false;
        clearInterval(interval);
      };
    }
    let active = true;
    const fetchMessages = () =>
      api
        .get<ChatMessage[]>(`/chat/appointments/${activeId}/messages/`)
        .then((msgs) => {
          if (active) {
            setMessages(msgs);
            if (msgs.length)
              setLastMessages((prev) => ({
                ...prev,
                [activeId]: msgs[msgs.length - 1].text,
              }));
          }
        })
        .catch(() => {});
    const syncStatus = () =>
      syncAppointment(activeId)
        .then(() => {
          if (active) setStatusTick((t) => t + 1);
        })
        .catch(() => {});
    fetchMessages();
    syncStatus();
    const msgInterval = setInterval(fetchMessages, 4000);
    const statusInterval = setInterval(syncStatus, 2000);
    return () => {
      active = false;
      clearInterval(msgInterval);
      clearInterval(statusInterval);
    };
  }, [activeId, isAdminChat, supportThreadId]);

  /* ── admin: poll support threads list ── */
  useEffect(() => {
    if (!isAdmin) return;
    let active = true;
    const loadThreads = () =>
      api
        .get<SupportThread[]>("/chat/support/threads/")
        .then((data) => {
          if (active) setSupportThreads(data);
        })
        .catch(() => {});
    loadThreads();
    const interval = setInterval(loadThreads, 8000);
    return () => {
      active = false;
      clearInterval(interval);
    };
  }, [isAdmin]);

  /* ── auto‑close logic ── */
  const [closeCountdown, setCloseCountdown] = useState<string | null>(null);
  useEffect(() => {
    if (isAdminChat || !activeAppt || activeAppt.status !== "in-progress") {
      setChatClosed(false);
      setCloseCountdown(null);
      return;
    }
    const autoCloseMin = doctor?.communication?.chatAutoCloseMinutes;
    if (!autoCloseMin || autoCloseMin <= 0) {
      setChatClosed(false);
      setCloseCountdown(null);
      return;
    }
    const startedMs = activeAppt.startedAt
      ? new Date(activeAppt.startedAt).getTime()
      : new Date(`${activeAppt.date}T${activeAppt.time}`).getTime();
    const deadline = startedMs + autoCloseMin * 60 * 1000;
    const tick = () => {
      const remaining = deadline - Date.now();
      if (remaining <= 0) {
        setChatClosed(true);
        setCloseCountdown(null);
        api.post(`/appointments/${activeId}/complete/`).catch(() => {});
        return;
      }
      const hours = Math.floor(remaining / 3600000);
      const mins = Math.floor((remaining % 3600000) / 60000);
      const secs = Math.floor((remaining % 60000) / 1000);
      setCloseCountdown(
        `${toFa(String(hours).padStart(2, "0"))}:${toFa(String(mins).padStart(2, "0"))}:${toFa(String(secs).padStart(2, "0"))}`,
      );
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [
    activeId,
    activeAppt?.status,
    isAdminChat,
    doctor?.communication?.chatAutoCloseMinutes,
  ]);

  /* ── call timer ── */
  useEffect(() => {
    if (!videoActive) {
      setCallTimer(0);
      return;
    }
    const id = setInterval(() => setCallTimer((t) => t + 1), 1000);
    return () => clearInterval(id);
  }, [videoActive]);

  /* ── stop video when session ends (e.g. doctor ended it) ── */
  useEffect(() => {
    if (videoActive && activeAppt && activeAppt.status !== "in-progress") {
      setVideoActive(false);
    }
  }, [videoActive, activeAppt?.status]);

  const callTimeStr = `${toFa(String(Math.floor(callTimer / 60)).padStart(2, "0"))}:${toFa(String(callTimer % 60).padStart(2, "0"))}`;

  /* ── scroll on new messages ── */
  useEffect(() => {
    scrollRef.current?.scrollTo({
      top: scrollRef.current.scrollHeight,
      behavior: "smooth",
    });
  }, [messages]);

  /* ── send message ── */
  const send = useCallback(async () => {
    const text = draft.trim();
    if (!text || chatClosed) return;
    if (isAdminChat) {
      if (!supportThreadId) return;
      try {
        const msg = await api.post<ChatMessage>(
          `/chat/support/threads/${supportThreadId}/send/`,
          { text },
        );
        setMessages((prev) => [...prev, msg]);
        setDraft("");
      } catch {
        /* ignore */
      }
      return;
    }
    try {
      const msg = await api.post<ChatMessage>(
        `/chat/appointments/${activeId}/messages/`,
        { text, type: "text" },
      );
      setMessages((prev) => [...prev, msg]);
      setDraft("");
    } catch {
      /* ignore */
    }
  }, [draft, chatClosed, isAdminChat, activeId, ME, supportThreadId]);

  /* ── submit prescription ── */
  const submitPrescription = async () => {
    const valid = rxItems.filter((i) => i.drug.trim());
    if (!valid.length) return;
    try {
      await api.post("/prescriptions/", {
        appointmentId: activeId,
        items: valid,
        notes: rxNotes,
      });
      const next = await api.get<ChatMessage[]>(
        `/chat/appointments/${activeId}/messages/`,
      );
      setMessages(next);
      setRxOpen(false);
      setRxItems([{ drug: "", usage: "" }]);
      setRxNotes("");
      await refreshBackendData("doctor");
      toast.success("نسخه ثبت شد", "نسخه برای بیمار ارسال شد.");
    } catch (error) {
      toast.error(
        "ثبت نسخه انجام نشد",
        error instanceof Error ? error.message : undefined,
      );
    }
  };

  /* ── view prescription details ── */
  const showPrescription = async (apptId: string) => {
    try {
      const list = await api.get<Prescription[]>(
        `/prescriptions/?appointmentId=${apptId}`,
      );
      if (list.length) setRxViewData(list[0]);
      else setRxViewData(null);
      setRxViewOpen(true);
    } catch {
      setRxViewOpen(true);
      setRxViewData(null);
    }
  };

  /* ── start / complete appointment ── */
  const startSession = async () => {
    if (!activeId) return;
    await api.post(`/appointments/${activeId}/start/`);
    await refreshBackendData(isAdmin ? "admin" : "doctor");
  };

  const completeSession = async () => {
    if (!activeId) return;
    await api.post(`/appointments/${activeId}/complete/`);
    await refreshBackendData(isAdmin ? "admin" : "doctor");
    setEndOpen(false);
  };

  /* ────────────────── RENDER ────────────────── */
  const canChat =
    !chatClosed &&
    activeAppt?.status !== "completed" &&
    activeAppt?.status !== "cancelled" &&
    (isAdmin || activeAppt?.status === "in-progress");

  return (
    <div className="flex h-[calc(100vh-9rem)] gap-4">
      {/* ===== Chat list sidebar (desktop) ===== */}
      <ChatList
        className="max-lg:hidden"
        myAppointments={myAppointments}
        activeAppointments={activeAppointments}
        pastAppointments={pastAppointments}
        supportThreads={supportThreads}
        activeId={activeId}
        isDoctor={isDoctor}
        isAdmin={isAdmin}
        lastMessages={lastMessages}
        onSelect={(id) => {
          setActiveId(id);
          setVideoActive(false);
        }}
      />

      {/* ===== Mobile chat list (full screen) ===== */}
      {!activeId && (
        <ChatList
          className="lg:hidden flex-1"
          myAppointments={myAppointments}
          activeAppointments={activeAppointments}
          pastAppointments={pastAppointments}
          supportThreads={supportThreads}
          activeId={activeId}
          isDoctor={isDoctor}
          isAdmin={isAdmin}
          lastMessages={lastMessages}
          onSelect={(id) => {
            setActiveId(id);
            setVideoActive(false);
          }}
        />
      )}

      {/* ===== Main chat area ===== */}
      {activeId && (
        <GlassCard className="flex min-w-0 flex-1 flex-col overflow-hidden max-lg:rounded-2xl">
          {/* ── Header ── */}
          <div className="flex flex-wrap items-center gap-3 border-b border-white/30 px-4 py-3">
            {/* Mobile back */}
            <button
              onClick={() => setActiveId("")}
              className="grid h-9 w-9 place-items-center rounded-lg text-ink-500 hover:bg-white/60 lg:hidden"
              aria-label="بازگشت"
            >
              <IconChevronRight />
            </button>

            {isAdminChat ? (
              supportId ? (
                <div className="flex items-center gap-3">
                  <Avatar
                    src={supportThread?.participantAvatar || ""}
                    size="md"
                    ring
                  />
                  <div>
                    <h2 className="font-bold text-ink-800">
                      {supportThread?.participantName || "کاربر"}
                    </h2>
                    <p className="text-[11px] text-ink-400">
                      {supportThread?.participantRole === "doctor"
                        ? "پزشک"
                        : "بیمار"}
                      {supportThread?.participantPhone
                        ? ` • ${supportThread.participantPhone}`
                        : ""}
                    </p>
                  </div>
                </div>
              ) : (
                <div className="flex items-center gap-3">
                  <div className="grid h-10 w-10 place-items-center rounded-full bg-primary-100 text-primary-600">
                    <BiSupport className="h-5 w-5" />
                  </div>
                  <div>
                    <h2 className="font-bold text-ink-800">پشتیبانی</h2>
                    <p className="text-[11px] text-ink-400">
                      پاسخگویی ۲۴ ساعته
                    </p>
                  </div>
                </div>
              )
            ) : (
              <>
                {isAdmin ? (
                  <div className="flex items-center gap-2">
                    <Avatar src={patient?.avatar || ""} size="sm" />
                    <Avatar src={doctor?.avatar || ""} size="sm" />
                  </div>
                ) : (
                  <Avatar
                    src={counterpart?.avatar || ""}
                    size="md"
                    ring
                    online={activeAppt?.status === "in-progress"}
                  />
                )}
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    {isAdmin ? (
                      <h2 className="truncate font-bold text-ink-800">
                        بیمار: {patient?.name || "—"} • پزشک:{" "}
                        {doctor ? doctorName(doctor) : "—"}
                      </h2>
                    ) : (
                      <h2 className="truncate font-bold text-ink-800">
                        {!isDoctor && doctor
                          ? doctorName(doctor)
                          : counterpartName}
                      </h2>
                    )}
                    {activeAppt?.status === "in-progress" && (
                      <Badge tone="green" dot>
                        فعال
                      </Badge>
                    )}
                    {activeAppt?.status === "waiting" && (
                      <Badge tone="amber">منتظر شروع</Badge>
                    )}
                    {activeAppt?.status === "completed" && (
                      <Badge tone="green">تکمیل</Badge>
                    )}
                  </div>
                  <p className="text-xs text-ink-400">
                    {isAdmin && doctor
                      ? `${doctor.specialtyName || ""} • `
                      : ""}
                    {isDoctor && patient
                      ? `${patient.gender === "male" ? "آقا" : "خانم"} • ${toFa(patient.age)} سال • ${patient.city}`
                      : ""}
                    {(!isDoctor && !isAdmin && doctor?.specialtyName) || ""}
                    {activeAppt &&
                      ` • ${formatDateFa(activeAppt.date)} ${toFa(activeAppt.time)}`}
                  </p>
                </div>
                {!isAdminChat &&
                  activeAppt?.status === "in-progress" &&
                  closeCountdown && (
                    <div
                      className="rounded-full bg-amber-50 px-3 py-1 text-xs font-bold text-amber-700 tabular"
                      title="زمان باقی‌مانده تا بسته شدن خودکار"
                    >
                      <IconClock className="ml-1 inline h-3 w-3" />
                      {closeCountdown}
                    </div>
                  )}
                <div className="flex gap-2">
                  {!isAdminChat && activeAppt?.status === "in-progress" && (
                    <>
                      {!videoActive ? (
                        <PrimaryButton
                          size="sm"
                          icon={<IconVideo className="h-4 w-4" />}
                          onClick={() => setVideoActive(true)}
                        >
                          ویدئو
                        </PrimaryButton>
                      ) : (
                        <PrimaryButton
                          size="sm"
                          variant="danger"
                          icon={<IconPhoneOff className="h-4 w-4" />}
                          onClick={() => setVideoActive(false)}
                        >
                          قطع ({callTimeStr})
                        </PrimaryButton>
                      )}
                    </>
                  )}
                  {(isDoctor || isAdmin) &&
                    !isAdminChat &&
                    activeAppt?.status === "waiting" && (
                      <PrimaryButton
                        size="sm"
                        icon={<IconCheck />}
                        onClick={startSession}
                      >
                        شروع جلسه
                      </PrimaryButton>
                    )}
                  {(isDoctor || isAdmin) &&
                    !isAdminChat &&
                    activeAppt?.status === "in-progress" && (
                      <PrimaryButton
                        size="sm"
                        variant="danger"
                        onClick={() => setEndOpen(true)}
                      >
                        پایان
                      </PrimaryButton>
                    )}
                </div>
              </>
            )}
          </div>

          {/* ── Video panel ── */}
          {videoActive && !isAdminChat && (
            <GlassCard variant="dark" className="relative m-3 overflow-hidden">
              <div className="grid grid-cols-1 gap-3 p-3 sm:grid-cols-2">
                <div className="flex aspect-video flex-col items-center justify-center rounded-2xl bg-ink-900 text-white">
                  <Avatar src={counterpart?.avatar || ""} size="xl" />
                  <p className="mt-2 font-semibold">{counterpartName}</p>
                  <p className="text-xs text-white/60">
                    {isDoctor ? "بیمار" : "پزشک"}
                  </p>
                </div>
                <div className="flex aspect-video flex-col items-center justify-center rounded-2xl bg-ink-800 text-white">
                  {cameraOff ? (
                    <div className="grid h-16 w-16 place-items-center rounded-full bg-ink-700 text-2xl">
                      🩺
                    </div>
                  ) : (
                    <Avatar src="https://i.pravatar.cc/300?u=user" size="xl" />
                  )}
                  <p className="mt-2 font-semibold">شما</p>
                </div>
              </div>
              <div className="absolute inset-x-0 bottom-0 flex items-center justify-center gap-3 bg-gradient-to-t from-ink-900/80 to-transparent px-4 pb-3 pt-8">
                <button
                  onClick={() => setMuted(!muted)}
                  className={cn(
                    "grid h-11 w-11 place-items-center rounded-full transition",
                    muted
                      ? "bg-red-500 text-white"
                      : "bg-white/20 text-white hover:bg-white/30",
                  )}
                  title={muted ? "فعال کردن میکروفون" : "قطع میکروفون"}
                >
                  {muted ? <IconMicOff /> : <IconMic />}
                </button>
                <button
                  onClick={() => setCameraOff(!cameraOff)}
                  className={cn(
                    "grid h-11 w-11 place-items-center rounded-full transition",
                    cameraOff
                      ? "bg-red-500 text-white"
                      : "bg-white/20 text-white hover:bg-white/30",
                  )}
                  title={cameraOff ? "فعال کردن دوربین" : "قطع دوربین"}
                >
                  <IconVideo className={cameraOff ? "h-6 w-6" : "h-5 w-5"} />
                </button>
                <button
                  onClick={() => setScreenSharing(!screenSharing)}
                  className={cn(
                    "grid h-11 w-11 place-items-center rounded-full transition",
                    screenSharing
                      ? "bg-primary-500 text-white"
                      : "bg-white/20 text-white hover:bg-white/30",
                  )}
                  title="اشتراک‌گذاری صفحه"
                >
                  <IconScreenShare />
                </button>
                <div className="rounded-full bg-white/20 px-3 py-1 text-xs font-semibold text-white tabular">
                  {callTimeStr}
                </div>
              </div>
            </GlassCard>
          )}

          {/* ── Messages ── */}
          <div ref={scrollRef} className="flex-1 space-y-4 overflow-y-auto p-5">
            {chatClosed && (
              <div className="mx-auto w-fit rounded-full bg-amber-100 px-4 py-1.5 text-xs font-medium text-amber-700">
                این گفتگو بسته شده است
              </div>
            )}
            <div className="mx-auto w-fit rounded-full bg-white/50 px-3 py-1 text-[11px] text-ink-400">
              {isAdminChat
                ? supportId
                  ? `گفتگو با ${supportThread?.participantName || "کاربر"}`
                  : "گفتگو با پشتیبانی"
                : `جلسه مشاوره • ${activeAppt ? formatDateFa(activeAppt.date) : ""}`}
            </div>
            {messages.map((m) => {
              const mine =
                m.senderId === ME || (isAdminChat && m.senderId === ME);
              const isPrescription = m.type === "prescription";
              const isFile = m.type === "file";
              const senderIsPatient = patient && m.senderId === patient.userId;
              const senderIsDoctor = doctor && m.senderId === doctor.userId;
              const senderIsAdmin = m.senderRole === "admin";
              return (
                <div
                  key={m.id}
                  className={cn(
                    "flex gap-2.5",
                    isAdmin && !isAdminChat
                      ? senderIsPatient || senderIsAdmin
                        ? "flex-row-reverse"
                        : "flex-row"
                      : mine
                        ? "flex-row-reverse"
                        : "flex-row",
                  )}
                >
                  <div className="relative">
                    <Avatar
                      src={
                        senderIsAdmin
                          ? m.senderAvatar || user?.avatar || ""
                          : mine
                            ? user?.avatar || ""
                            : senderIsPatient
                              ? patient?.avatar || ""
                              : senderIsDoctor
                                ? doctor?.avatar || ""
                                : counterpart?.avatar || ""
                      }
                      size="sm"
                    />
                    {(senderIsAdmin ||
                      (isAdmin && !isAdminChat) ||
                      (isAdminChat && !mine)) && (
                      <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 rounded bg-ink-800 px-1 py-[1px] text-[8px] text-white whitespace-nowrap">
                        {senderIsAdmin
                          ? m.senderName || "ادمین"
                          : senderIsPatient
                            ? "بیمار"
                            : senderIsDoctor
                              ? "پزشک"
                              : m.senderName || ""}
                      </span>
                    )}
                  </div>
                  <div
                    className={cn(
                      "max-w-[75%]",
                      isAdmin && !isAdminChat
                        ? senderIsPatient || senderIsAdmin
                          ? "items-end"
                          : "items-start"
                        : mine
                          ? "items-end"
                          : "items-start",
                    )}
                  >
                    <div
                      className={cn(
                        "rounded-2xl px-4 py-2.5 text-sm leading-7 shadow-sm",
                        isPrescription
                          ? "border border-primary-200 bg-primary-50/90 text-ink-800 cursor-pointer hover:bg-primary-100/90"
                          : mine
                            ? "rounded-tr-sm bg-primary-500 text-white"
                            : "rounded-tl-sm bg-white/80 text-ink-800",
                      )}
                      onClick={
                        isPrescription && !isAdminChat
                          ? () => showPrescription(activeId)
                          : undefined
                      }
                    >
                      {isPrescription && (
                        <p className="mb-1 flex items-center gap-1 text-xs font-bold text-primary-700">
                          <IconPrescription className="h-4 w-4" />
                          نسخه پزشکی
                          <span className="mr-auto text-[10px] text-primary-500">
                            برای مشاهده کلیک کنید
                          </span>
                        </p>
                      )}
                      {isFile && m.fileUrl && (
                        <a
                          href={m.fileUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="mb-2 flex items-center gap-3 rounded-xl border border-white/50 bg-white/40 p-3 transition hover:bg-white/60"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <div className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-primary-100 text-primary-600">
                            <IconFile className="h-5 w-5" />
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-sm font-medium text-ink-800">
                              {m.fileName || "فایل"}
                            </p>
                            <p className="text-[11px] text-ink-400">
                              برای دانلود کلیک کنید
                            </p>
                          </div>
                          <IconDownload className="h-5 w-5 shrink-0 text-primary-500" />
                        </a>
                      )}
                      <p className="whitespace-pre-line">{m.text}</p>
                    </div>
                    <p
                      className={cn(
                        "mt-1 text-[10px] text-ink-400",
                        isAdmin && !isAdminChat
                          ? senderIsPatient || senderIsAdmin
                            ? "text-left"
                            : "text-right"
                          : mine
                            ? "text-left"
                            : "text-right",
                      )}
                    >
                      {m.senderName && (
                        <span className="ml-1 font-medium text-ink-500">
                          {m.senderName}
                        </span>
                      )}
                      {m.time}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>

          {/* ── Composer ── */}
          {canChat && !isAdminChat && (
            <div className="border-t border-white/50 p-3">
              <div className="glass-soft flex items-end gap-2 rounded-2xl p-2">
                {isDoctor && (
                  <button
                    onClick={() => setRxOpen(true)}
                    className="grid h-10 w-10 shrink-0 place-items-center rounded-xl text-primary-600 transition hover:bg-primary-50"
                    title="ارسال نسخه"
                  >
                    <IconPrescription />
                  </button>
                )}
                <button
                  onClick={() => fileRef.current?.click()}
                  className="grid h-10 w-10 shrink-0 place-items-center rounded-xl text-ink-500 transition hover:bg-primary-50"
                  title="آپلود فایل"
                >
                  <IconUpload />
                </button>
                <input
                  ref={fileRef}
                  type="file"
                  className="hidden"
                  accept=".pdf,.jpg,.png,.doc"
                  onChange={async (e) => {
                    const f = e.target.files?.[0];
                    if (!f) return;
                    const form = new FormData();
                    form.append("file", f);
                    form.append("text", `📎 ${f.name}`);
                    form.append("type", "file");
                    try {
                      const msg = await api.post<ChatMessage>(
                        `/chat/appointments/${activeId}/messages/`,
                        form,
                      );
                      setMessages((prev) => [...prev, msg]);
                    } catch {
                      /* ignore */
                    }
                    e.target.value = "";
                  }}
                />
                <textarea
                  value={draft}
                  onChange={(e) => setDraft(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      send();
                    }
                  }}
                  rows={1}
                  placeholder="پیام خود را بنویسید…"
                  className="max-h-32 flex-1 resize-none bg-transparent px-2 py-2 text-sm text-ink-800 placeholder:text-ink-400 outline-none"
                />
                <PrimaryButton
                  size="sm"
                  className="h-10 w-10 !px-0"
                  onClick={send}
                  disabled={!draft.trim() || chatClosed}
                  icon={<IconSend className="h-5 w-5" />}
                  aria-label="ارسال"
                />
              </div>
            </div>
          )}

          {/* ── Admin composer (always open) ── */}
          {isAdminChat && (
            <div className="border-t border-white/50 p-3">
              <div className="glass-soft flex items-end gap-2 rounded-2xl p-2">
                <textarea
                  value={draft}
                  onChange={(e) => setDraft(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      send();
                    }
                  }}
                  rows={1}
                  placeholder="پیام خود را بنویسید…"
                  className="max-h-32 flex-1 resize-none bg-transparent px-2 py-2 text-sm text-ink-800 placeholder:text-ink-400 outline-none"
                />
                <PrimaryButton
                  size="sm"
                  className="h-10 w-10 !px-0"
                  onClick={send}
                  disabled={!draft.trim()}
                  icon={<IconSend className="h-5 w-5" />}
                  aria-label="ارسال"
                />
              </div>
            </div>
          )}

          {/* ── Closed chat state ── */}
          {chatClosed && !isAdminChat && (
            <div className="border-t border-white/50 p-6 text-center">
              <p className="text-sm text-ink-400">
                این گفتگو بر اساس زمان تعیین‌شده توسط پزشک به پایان رسیده است.
              </p>
            </div>
          )}

          {!canChat &&
            !chatClosed &&
            !isAdminChat &&
            activeAppt?.status === "completed" && (
              <div className="border-t border-white/50 p-6 text-center">
                <p className="text-sm text-ink-400">
                  این جلسه به پایان رسیده است.
                </p>
              </div>
            )}
          {!isDoctor && !isAdminChat && activeAppt?.status === "waiting" && (
            <div className="border-t border-white/50 p-6 text-center">
              <p className="text-sm text-ink-400">
                منتظر شروع جلسه توسط پزشک باشید.
              </p>
            </div>
          )}
        </GlassCard>
      )}

      {/* ── Prescription compose modal ── */}
      <Modal
        open={rxOpen}
        onClose={() => setRxOpen(false)}
        title="صدور نسخه پزشکی"
        size="lg"
        footer={
          <>
            <PrimaryButton icon={<IconCheck />} onClick={submitPrescription}>
              ثبت و ارسال نسخه
            </PrimaryButton>
            <PrimaryButton variant="ghost" onClick={() => setRxOpen(false)}>
              انصراف
            </PrimaryButton>
          </>
        }
      >
        <div className="space-y-4">
          <div className="rounded-xl bg-primary-50/60 p-3 text-xs text-primary-700">
            بیمار: <b>{patient?.name}</b> • نسخه پس از ثبت در چت ارسال می‌شود.
          </div>
          {rxItems.map((item, idx) => (
            <div key={idx} className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div className="relative">
                <InputField
                  label={`داروی ${toFa(idx + 1)}`}
                  placeholder="مثلاً آتورواستاتین ۲۰ میلی‌گرم"
                  value={item.drug}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                    setRxItems((arr) =>
                      arr.map((x, i) =>
                        i === idx ? { ...x, drug: e.target.value } : x,
                      ),
                    );
                    setDrugQuery(e.target.value);
                  }}
                />
                {drugQuery.length >= 2 && (
                  <div className="glass absolute left-0 right-0 top-full z-20 mt-1 max-h-40 overflow-y-auto rounded-xl p-1">
                    {drugSuggestions
                      .filter((d) => d.includes(drugQuery))
                      .slice(0, 6)
                      .map((d) => (
                        <button
                          key={d}
                          onMouseDown={() => {
                            setRxItems((arr) =>
                              arr.map((x, i) =>
                                i === idx ? { ...x, drug: d } : x,
                              ),
                            );
                            setDrugQuery("");
                          }}
                          className="w-full rounded-lg px-3 py-2 text-right text-sm text-ink-700 transition hover:bg-primary-50"
                        >
                          💊 {d}
                        </button>
                      ))}
                  </div>
                )}
              </div>
              <InputField
                label="نحوه مصرف"
                placeholder="مثلاً هر شب بعد از شام"
                value={item.usage}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setRxItems((arr) =>
                    arr.map((x, i) =>
                      i === idx ? { ...x, usage: e.target.value } : x,
                    ),
                  )
                }
              />
            </div>
          ))}
          <div className="flex items-center gap-2">
            <PrimaryButton
              variant="subtle"
              size="sm"
              onClick={() =>
                setRxItems((arr) => [...arr, { drug: "", usage: "" }])
              }
            >
              + افزودن داروی دیگر
            </PrimaryButton>
            {rxItems.length > 1 && (
              <PrimaryButton
                variant="ghost"
                size="sm"
                onClick={() => setRxItems((arr) => arr.slice(0, -1))}
              >
                حذف آخرین
              </PrimaryButton>
            )}
          </div>
          <TextArea
            label="توضیحات / توصیه‌ها"
            rows={3}
            placeholder="مثلاً پیگیری هفتگی فشار خون، کاهش نمک…"
            value={rxNotes}
            onChange={(e) => setRxNotes(e.target.value)}
          />
        </div>
      </Modal>

      {/* ── Prescription view modal ── */}
      <Modal
        open={rxViewOpen}
        onClose={() => setRxViewOpen(false)}
        title="جزئیات نسخه"
        footer={
          <PrimaryButton variant="ghost" onClick={() => setRxViewOpen(false)}>
            بستن
          </PrimaryButton>
        }
      >
        {rxViewData ? (
          <div className="space-y-4">
            <div className="rounded-xl bg-primary-50/60 p-3 text-xs text-primary-700">
              بیمار: <b>{patient?.name}</b> • تاریخ:{" "}
              {formatDateFa(rxViewData.createdAt)}
            </div>
            <table className="w-full text-right text-sm">
              <thead>
                <tr className="text-xs text-ink-500">
                  <th className="pb-2 font-medium">دارو</th>
                  <th className="pb-2 font-medium">نحوه مصرف</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/40">
                {rxViewData.items.map((item, i) => (
                  <tr key={i}>
                    <td className="py-2 text-ink-800">{item.drug}</td>
                    <td className="py-2 text-ink-600">{item.usage}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {rxViewData.notes && (
              <div>
                <p className="mb-1 text-xs font-medium text-ink-500">توضیحات</p>
                <p className="rounded-xl bg-white/60 px-3 py-2 text-sm text-ink-700">
                  {rxViewData.notes}
                </p>
              </div>
            )}
          </div>
        ) : (
          <p className="text-sm text-ink-500">
            مشاهده جزئیات نسخه از طریق سرور امکان‌پذیر نیست.
          </p>
        )}
      </Modal>

      {/* ── End session modal ── */}
      <Modal
        open={endOpen}
        onClose={() => setEndOpen(false)}
        title="پایان جلسه مشاوره"
        footer={
          <>
            <PrimaryButton variant="danger" onClick={completeSession}>
              بله، پایان جلسه
            </PrimaryButton>
            <PrimaryButton variant="ghost" onClick={() => setEndOpen(false)}>
              ادامه مشاوره
            </PrimaryButton>
          </>
        }
      >
        <p className="text-sm leading-7 text-ink-600">
          آیا از پایان جلسه با <b className="text-ink-800">{counterpartName}</b>{" "}
          مطمئن هستید؟
          <br />
          پس از پایان، وضعیت نوبت به «تکمیل شده» تغییر می‌کند و چت بایگانی
          می‌شود.
        </p>
      </Modal>
    </div>
  );
}

/* ───────── Chat list sidebar (shared desktop & mobile) ───────── */
function ChatList({
  className,
  myAppointments,
  activeAppointments,
  pastAppointments,
  supportThreads,
  activeId,
  isDoctor,
  isAdmin,
  onSelect,
  lastMessages,
}: {
  className?: string;
  myAppointments: typeof appointments;
  activeAppointments: typeof appointments;
  pastAppointments: typeof appointments;
  supportThreads: SupportThread[];
  activeId: string;
  isDoctor: boolean;
  isAdmin: boolean;
  onSelect: (id: string) => void;
  lastMessages?: Record<string, string>;
}) {
  return (
    <GlassCard className={cn("flex flex-col overflow-hidden p-0 ", className)}>
      <div className="border-b border-white/30 px-4 py-3">
        <h3 className="font-bold text-ink-800">گفتگوها</h3>
        <p className="text-[11px] text-ink-400">
          {toFa(myAppointments.length + supportThreads.length)} گفتگو
        </p>
      </div>
      <div className="flex-1 overflow-y-auto">
        {!isAdmin && (
          <>
            <button
              onClick={() => onSelect(ADMIN_CONVERSATION_ID)}
              className={cn(
                "flex w-full items-center gap-3 px-4 py-3 text-right transition",
                activeId === ADMIN_CONVERSATION_ID
                  ? "bg-primary-50/80"
                  : "hover:bg-white/40",
              )}
            >
              <div className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-primary-100 text-primary-600">
                <BiSupport className="h-5 w-5" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold text-ink-800">
                  پشتیبانی
                </p>
                <p className="truncate text-[11px] text-ink-400">
                  ارتباط با ادمین
                </p>
              </div>
            </button>
            <div className="mx-4 my-1 h-px bg-white/40" />
          </>
        )}

        {/* Admin support threads */}
        {isAdmin && supportThreads.length > 0 && (
          <>
            <p className="px-4 pb-1 pt-2.5 text-[10px] font-bold text-ink-400">
              پشتیبانی
            </p>
            {supportThreads.map((t) => {
              const active = activeId === `${SUPPORT_PREFIX}${t.id}`;
              return (
                <button
                  key={t.id}
                  onClick={() => onSelect(`${SUPPORT_PREFIX}${t.id}`)}
                  className={cn(
                    "flex w-full items-center gap-3 px-4 py-3 text-right transition",
                    active ? "bg-primary-50/80" : "hover:bg-white/40",
                  )}
                >
                  <div className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-primary-100 text-primary-600">
                    <BiSupport className="h-5 w-5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-ink-800">
                      {t.participantName}
                      <span className="mr-1 text-[10px] font-normal text-ink-400">
                        {t.participantRole === "doctor" ? "پزشک" : "بیمار"}
                      </span>
                    </p>
                    <p className="truncate text-[11px] text-ink-400">
                      {t.lastMessage || "بدون پیام"}
                    </p>
                  </div>
                  {t.messageCount > 0 && (
                    <Badge tone="teal">{toFa(t.messageCount)}</Badge>
                  )}
                </button>
              );
            })}
            <div className="mx-4 my-1 h-px bg-white/40" />
          </>
        )}

        {/* Active chats */}
        {activeAppointments.map((a) => {
          const cp = chatCounterpart(a, isDoctor);
          const patientData = getPatient(a.patientId);
          const doctorData = getDoctor(a.doctorId);
          return (
            <button
              key={a.id}
              onClick={() => onSelect(a.id)}
              className={cn(
                "flex w-full items-center gap-3 px-4 py-3 text-right transition",
                activeId === a.id ? "bg-primary-50/80" : "hover:bg-white/40",
              )}
            >
              {isAdmin ? (
                <div className="flex shrink-0 -space-x-2">
                  <Avatar src={patientData?.avatar || ""} size="sm" />
                  <Avatar src={doctorData?.avatar || ""} size="sm" />
                </div>
              ) : (
                <Avatar
                  src={cp?.avatar || ""}
                  size="sm"
                  online={a.status === "in-progress"}
                />
              )}
              <div className="min-w-0 flex-1">
                {isAdmin ? (
                  <p className="truncate text-sm font-semibold text-ink-800">
                    {patientData?.name || "بیمار"} ←{" "}
                    {doctorData ? doctorName(doctorData) : "پزشک"}
                  </p>
                ) : (
                  <p className="truncate text-sm font-semibold text-ink-800">
                    {!isDoctor ? doctorName(cp) : cp?.name || "بیمار"}
                  </p>
                )}
                <p className="truncate text-[11px] text-ink-400">
                  {lastMessages?.[a.id]
                    ? lastMessages[a.id].slice(0, 40)
                    : `${formatDateFa(a.date)} • ${toFa(a.time)}`}
                </p>
              </div>
              <Badge
                tone={a.status === "in-progress" ? "green" : "amber"}
                dot
              />
            </button>
          );
        })}

        {/* Past chats */}
        {pastAppointments.length > 0 && (
          <div className="mx-4 my-1 h-px bg-white/40" />
        )}
        {pastAppointments.map((a) => {
          const cp = chatCounterpart(a, isDoctor);
          const patientData = getPatient(a.patientId);
          const doctorData = getDoctor(a.doctorId);
          return (
            <button
              key={a.id}
              onClick={() => onSelect(a.id)}
              className={cn(
                "flex w-full items-center gap-3 px-4 py-3 text-right opacity-60 transition hover:opacity-100",
                activeId === a.id ? "bg-primary-50/80" : "hover:bg-white/40",
              )}
            >
              {isAdmin ? (
                <div className="flex shrink-0 -space-x-2">
                  <Avatar src={patientData?.avatar || ""} size="sm" />
                  <Avatar src={doctorData?.avatar || ""} size="sm" />
                </div>
              ) : (
                <Avatar src={cp?.avatar || ""} size="sm" />
              )}
              <div className="min-w-0 flex-1">
                {isAdmin ? (
                  <p className="truncate text-sm font-semibold text-ink-800">
                    {patientData?.name || "بیمار"} ←{" "}
                    {doctorData ? doctorName(doctorData) : "پزشک"}
                  </p>
                ) : (
                  <p className="truncate text-sm font-semibold text-ink-800">
                    {!isDoctor ? doctorName(cp) : cp?.name || "بیمار"}
                  </p>
                )}
                <p className="truncate text-[11px] text-ink-400">
                  {lastMessages?.[a.id]
                    ? lastMessages[a.id].slice(0, 40)
                    : shortDateFa(a.date)}
                </p>
              </div>
              <Badge tone={a.status === "completed" ? "green" : "red"}>
                {a.status === "completed" ? "تکمیل" : "لغو"}
              </Badge>
            </button>
          );
        })}
      </div>
    </GlassCard>
  );
}
