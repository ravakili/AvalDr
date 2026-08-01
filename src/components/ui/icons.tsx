import { LuChevronLeft, LuChevronRight } from "react-icons/lu";

/** Tiny inline icon set (stroke-based, currentColor). */
type P = { className?: string };

const base = (className?: string) => ({
  width: 20,
  height: 20,
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.8,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
  className,
});

export const IconHome = ({ className }: P) => (
  <svg {...base(className)}>
    <path d="M3 10.5 12 3l9 7.5" />
    <path d="M5 9.5V21h14V9.5" />
    <path d="M9.5 21v-6h5v6" />
  </svg>
);
export const IconSearch = ({ className }: P) => (
  <svg {...base(className)}>
    <circle cx="11" cy="11" r="7" />
    <path d="m20 20-3.2-3.2" />
  </svg>
);
export const IconCalendar = ({ className }: P) => (
  <svg {...base(className)}>
    <rect x="3" y="4.5" width="18" height="16" rx="2" />
    <path d="M3 9h18M8 3v3M16 3v3" />
  </svg>
);
export const IconChat = ({ className }: P) => (
  <svg {...base(className)}>
    <path d="M21 12a8 8 0 0 1-11.5 7.2L4 20l.8-4.5A8 8 0 1 1 21 12Z" />
    <path d="M8.5 12h.01M12 12h.01M15.5 12h.01" />
  </svg>
);
export const IconUser = ({ className }: P) => (
  <svg {...base(className)}>
    <circle cx="12" cy="8" r="4" />
    <path d="M4 20c0-3.5 3.6-6 8-6s8 2.5 8 6" />
  </svg>
);
export const IconUsers = ({ className }: P) => (
  <svg {...base(className)}>
    <circle cx="9" cy="8" r="3.4" />
    <path d="M2.5 20c0-3.2 3-5.5 6.5-5.5s6.5 2.3 6.5 5.5" />
    <path d="M16 5.2A3.4 3.4 0 0 1 16 12M17.5 14.7c2.4.6 4 2.6 4 5.3" />
  </svg>
);
export const IconStethoscope = ({ className }: P) => (
  <svg {...base(className)}>
    <path d="M5 3v5a4 4 0 0 0 8 0V3" />
    <path d="M5 3H3.5M13 3h1.5" />
    <path d="M9 12v2a5 5 0 0 0 10 0v-1" />
    <circle cx="19" cy="11" r="2" />
  </svg>
);
export const IconCog = ({ className }: P) => (
  <svg {...base(className)}>
    <circle cx="12" cy="12" r="3.2" />
    <path d="M12 2.5v3M12 18.5v3M21.5 12h-3M5.5 12h-3M18.4 5.6l-2.1 2.1M7.7 16.3l-2.1 2.1M18.4 18.4l-2.1-2.1M7.7 7.7 5.6 5.6" />
  </svg>
);
export const IconBell = ({ className }: P) => (
  <svg {...base(className)}>
    <path d="M6 9a6 6 0 0 1 12 0c0 5 2 6 2 6H4s2-1 2-6Z" />
    <path d="M10 19a2 2 0 0 0 4 0" />
  </svg>
);
export const IconLogout = ({ className }: P) => (
  <svg {...base(className)}>
    <path d="M15 4h3a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2h-3" />
    <path d="M10 12H3m0 0 3-3m-3 3 3 3" />
  </svg>
);
export const IconPlus = ({ className }: P) => (
  <svg {...base(className)}>
    <path d="M12 5v14M5 12h14" />
  </svg>
);
export const IconSend = ({ className }: P) => (
  <svg {...base(className)}>
    <path d="M21 4 3 11l7 2 2 7 9-16Z" />
    <path d="m10 13 4-4" />
  </svg>
);
export const IconCheck = ({ className }: P) => (
  <svg {...base(className)}>
    <path d="m4 12 5 5L20 6" />
  </svg>
);
export const IconClose = ({ className }: P) => (
  <svg {...base(className)}>
    <path d="M6 6l12 12M18 6 6 18" />
  </svg>
);
export const IconClock = ({ className }: P) => (
  <svg {...base(className)}>
    <circle cx="12" cy="12" r="9" />
    <path d="M12 7v5l3 2" />
  </svg>
);
export const IconPin = ({ className }: P) => (
  <svg {...base(className)}>
    <path d="M12 21s7-5.5 7-11a7 7 0 0 0-14 0c0 5.5 7 11 7 11Z" />
    <circle cx="12" cy="10" r="2.5" />
  </svg>
);
export const IconStar = ({ className }: P) => (
  <svg {...base(className)} fill="currentColor" stroke="none">
    <path d="m12 3 2.6 5.6 6.1.7-4.5 4.2 1.2 6L12 16.9 6.6 19.5l1.2-6L3.3 9.3l6.1-.7L12 3Z" />
  </svg>
);
export const IconTrash = ({ className }: P) => (
  <svg {...base(className)}>
    <path d="M4 7h16M9 7V4h6v3M6 7l1 13h10l1-13" />
  </svg>
);
export const IconEdit = ({ className }: P) => (
  <svg {...base(className)}>
    <path d="M4 20h4l10-10-4-4L4 16v4Z" />
    <path d="m13.5 6.5 4 4" />
  </svg>
);
export const IconShield = ({ className }: P) => (
  <svg {...base(className)}>
    <path d="M12 3 5 5v6c0 4.5 3 8 7 10 4-2 7-5.5 7-10V5l-7-2Z" />
    <path d="m9 12 2 2 4-4" />
  </svg>
);
export const IconActivity = ({ className }: P) => (
  <svg {...base(className)}>
    <path d="M3 12h4l3 8 4-16 3 8h4" />
  </svg>
);
export const IconPrescription = ({ className }: P) => (
  <svg {...base(className)}>
    <rect x="5" y="3" width="14" height="18" rx="2" />
    <path d="M9 8h6M9 12h3M14 14l2 2M16 14l-2 2" />
  </svg>
);
export const IconChevron = ({ className }: P) => (
  <LuChevronLeft className="h-4 w-4" />
);
export const IconChevronRight = ({ className }: P) => (
  <LuChevronRight className="h-4 w-4" />
);
export const IconHeart = ({ className }: P) => (
  <svg {...base(className)}>
    <path d="M12 20s-7-4.5-7-10a4 4 0 0 1 7-2.5A4 4 0 0 1 19 10c0 5.5-7 10-7 10Z" />
  </svg>
);
export const IconMenu = ({ className }: P) => (
  <svg {...base(className)}>
    <path d="M4 7h16M4 12h16M4 17h16" />
  </svg>
);
export const IconVideo = ({ className }: P) => (
  <svg {...base(className)}>
    <rect x="3" y="6" width="13" height="12" rx="2" />
    <path d="m16 10 5-3v10l-5-3" />
  </svg>
);
export const IconPhone = ({ className }: P) => (
  <svg {...base(className)}>
    <path d="M5 4h3l2 5-2 1a11 11 0 0 0 5 5l1-2 5 2v3a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2Z" />
  </svg>
);
export const IconMic = ({ className }: P) => (
  <svg {...base(className)}>
    <rect x="9" y="3" width="6" height="11" rx="3" />
    <path d="M5 11a7 7 0 0 0 14 0M12 18v3" />
  </svg>
);
export const IconMicOff = ({ className }: P) => (
  <svg {...base(className)}>
    <path d="M3 3l18 18" />
    <path d="M9 5a3 3 0 0 1 6 0v6m-6-6v2" />
    <path d="M5 11a7 7 0 0 0 10 6M12 18v3" />
  </svg>
);
export const IconScreenShare = ({ className }: P) => (
  <svg {...base(className)}>
    <rect x="3" y="4" width="18" height="13" rx="2" />
    <path d="M8 21h8M12 17v4M12 11v-4m0 0L9.5 9.5M12 7l2.5 2.5" />
  </svg>
);
export const IconPhoneOff = ({ className }: P) => (
  <svg {...base(className)}>
    <path d="M3 3l18 18" />
    <path d="M5 4h3l2 5-1.5 1M11 11a11 11 0 0 0 5 5l1-2 5 2v3a2 2 0 0 1-2 2" />
  </svg>
);
export const IconDownload = ({ className }: P) => (
  <svg {...base(className)}>
    <path d="M12 3v12m0 0 4-4m-4 4-4-4M4 17v2a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-2" />
  </svg>
);
export const IconUpload = ({ className }: P) => (
  <svg {...base(className)}>
    <path d="M12 17V5m0 0 4 4m-4-4-4 4M4 17v2a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-2" />
  </svg>
);
export const IconFile = ({ className }: P) => (
  <svg {...base(className)}>
    <path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8l-5-5Z" />
    <path d="M14 3v5h5" />
  </svg>
);
export const IconWallet = ({ className }: P) => (
  <svg {...base(className)}>
    <rect x="3" y="6" width="18" height="13" rx="2" />
    <path d="M3 10h18M16 14h.01" />
  </svg>
);
export const IconChart = ({ className }: P) => (
  <svg {...base(className)}>
    <path d="M3 21h18M6 17V9m5 8V5m5 12v-7" />
  </svg>
);
export const IconSettings = ({ className }: P) => (
  <svg {...base(className)}>
    <path d="M3 6h13M3 12h7M3 18h13" />
    <circle cx="19" cy="6" r="2" />
    <circle cx="13" cy="12" r="2" />
    <circle cx="19" cy="18" r="2" />
  </svg>
);
export const IconLog = ({ className }: P) => (
  <svg {...base(className)}>
    <path d="M5 3h11l3 3v15H5z" />
    <path d="M8 8h7M8 12h7M8 16h4" />
  </svg>
);
export const IconFilter = ({ className }: P) => (
  <svg {...base(className)}>
    <path d="M3 5h18l-7 8v6l-4 2v-8L3 5Z" />
  </svg>
);
export const IconChevronDown = ({ className }: P) => (
  <svg {...base(className)}>
    <path d="m6 9 6 6 6-6" />
  </svg>
);
export const IconChevronUp = ({ className }: P) => (
  <svg {...base(className)}>
    <path d="m6 15 6-6 6 6" />
  </svg>
);
export const IconList = ({ className }: P) => (
  <svg {...base(className)}>
    <path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01" />
  </svg>
);
export const IconGrid = ({ className }: P) => (
  <svg {...base(className)}>
    <rect x="3" y="3" width="7" height="7" rx="1" />
    <rect x="14" y="3" width="7" height="7" rx="1" />
    <rect x="3" y="14" width="7" height="7" rx="1" />
    <rect x="14" y="14" width="7" height="7" rx="1" />
  </svg>
);
export const IconRefresh = ({ className }: P) => (
  <svg {...base(className)}>
    <path d="M3 12a9 9 0 0 1 15-6.7L21 8M21 3v5h-5" />
    <path d="M21 12a9 9 0 0 1-15 6.7L3 16M3 21v-5h5" />
  </svg>
);
export const IconArrowUp = ({ className }: P) => (
  <svg {...base(className)}>
    <path d="M12 19V5m0 0-6 6m6-6 6 6" />
  </svg>
);
