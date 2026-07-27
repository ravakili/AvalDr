import type {
  Appointment,
  AuditLog,
  ChatMessage,
  Doctor,
  MedicalRecord,
  MockUser,
  Patient,
  PlatformSetting,
  Prescription,
  Specialty,
  WithdrawalRequest,
} from '../types'

// ===== HELPER FUNCTIONS (defined ONCE at the top) =====
const today = new Date()
const iso = (offsetDays: number) => {
  const d = new Date(today)
  d.setDate(d.getDate() + offsetDays)
  return d.toISOString().slice(0, 10)
}

// ===== Specialties =====
export const specialties: Specialty[] = [
  { id: 'sp-cardio', name: 'قلب و عروق', icon: '🫀' },
  { id: 'sp-derma', name: 'پوست و مو', icon: '🧴' },
  { id: 'sp-neuro', name: 'مغز و اعصاب', icon: '🧠' },
  { id: 'sp-ortho', name: 'ارتوپدی', icon: '🦴' },
  { id: 'sp-ped', name: 'اطفال', icon: '🧸' },
  { id: 'sp-ent', name: 'گوش و حلق و بینی', icon: '👂' },
  { id: 'sp-eye', name: 'چشم پزشکی', icon: '👁️' },
  { id: 'sp-psy', name: 'روان پزشکی', icon: '🧘' },
  { id: 'sp-dental', name: 'دندان پزشکی', icon: '🦷' },
  { id: 'sp-gp', name: 'پزشک عمومی', icon: '🩺' },
]

// ===== Doctors =====
const avatar = (seed: string) =>
  `https://api.dicebear.com/7.x/avataaars/svg?seed=${seed}&radius=20&backgroundColor=b6e3f4,c0aede,d1f4e0`

export const doctors: Doctor[] = [
  {
    id: 'doc-1',
    name: 'دکتر سارا محمدی',
    avatar: avatar('sara'),
    phone: '09121110001',
    specialtyId: 'sp-cardio',
    city: 'تهران',
    hospital: 'بیمارستان دی',
    experienceYears: 12,
    rating: 4.9,
    reviewsCount: 318,
    fee: 250000,
    status: 'approved',
    bio: 'متخصص قلب و عروق با تخصص در اکوکاردیوگرافی و فشار خون.',
    workingHours: [
      { day: 'شنبه', from: '08:00', to: '14:00' },
      { day: 'دوشنبه', from: '08:00', to: '14:00' },
    ],
  },
  {
    id: 'doc-2',
    name: 'دکتر علی رضایی',
    avatar: avatar('ali'),
    phone: '09121110002',
    specialtyId: 'sp-neuro',
    city: 'تهران',
    hospital: 'بیمارستان میلاد',
    experienceYears: 9,
    rating: 4.7,
    reviewsCount: 142,
    fee: 300000,
    status: 'approved',
    bio: 'نورولوژیست با تخصص در میگرن و اختلالات خواب.',
    workingHours: [{ day: 'یکشنبه', from: '09:00', to: '15:00'     }],
  },
  {
    id: 'doc-3',
    name: 'دکتر مریم حسینی',
    avatar: avatar('maryam'),
    phone: '09121110003',
    specialtyId: 'sp-derma',
    city: 'اصفهان',
    hospital: 'کلینیک پوست بهار',
    experienceYears: 7,
    rating: 4.8,
    reviewsCount: 205,
    fee: 200000,
    status: 'approved',
    bio: 'متخصص پوست، مو و زیبایی. درمان جوش و لک.',
    workingHours: [{ day: 'سه‌شنبه', from: '16:00', to: '20:00'     }],
  },
  {
    id: 'doc-4',
    name: 'دکتر حسین کریمی',
    avatar: avatar('hossein'),
    phone: '09121110004',
    specialtyId: 'sp-ortho',
    city: 'شیراز',
    hospital: 'بیمارستان نمازی',
    experienceYears: 15,
    rating: 4.6,
    reviewsCount: 289,
    fee: 280000,
    status: 'approved',
    bio: 'ارتوپد و جراح زانو با سابقه بین‌المللی.',
    workingHours: [{ day: 'چهارشنبه', from: '08:00', to: '12:00'     }],
  },
  {
    id: 'doc-5',
    name: 'دکتر نگار اکبری',
    avatar: avatar('negar'),
    phone: '09121110005',
    specialtyId: 'sp-ped',
    city: 'تهران',
    hospital: 'بیمارستان کودکان مفید',
    experienceYears: 11,
    rating: 5.0,
    reviewsCount: 412,
    fee: 220000,
    status: 'approved',
    bio: 'پزشک متخصص اطفال و نوزادان.',
    workingHours: [{ day: 'شنبه', from: '10:00', to: '16:00'     }],
  },
  {
    id: 'doc-6',
    name: 'دکتر رضا قاسمی',
    avatar: avatar('reza'),
    phone: '09121110006',
    specialtyId: 'sp-ent',
    city: 'مشهد',
    hospital: 'بیمارستان امام رضا',
    experienceYears: 8,
    rating: 4.5,
    reviewsCount: 96,
    fee: 190000,
    status: 'pending',
    bio: 'متخصص گوش، حلق و بینی در انتظار تأیید پروفایل.',
    workingHours: [{ day: 'یکشنبه', from: '08:00', to: '13:00'     }],
  },
  {
    id: 'doc-7',
    name: 'دکتر پارسا نوری',
    avatar: avatar('parsa'),
    phone: '09121110007',
    specialtyId: 'sp-eye',
    city: 'تبریز',
    hospital: 'بیمارستان میلاد',
    experienceYears: 14,
    rating: 4.8,
    reviewsCount: 175,
    fee: 260000,
    status: 'suspended',
    bio: 'چشم پزشک و جراح لیزیک.',
    workingHours: [{ day: 'سه‌شنبه', from: '09:00', to: '14:00'     }],
  },
  {
    id: 'doc-8',
    name: 'دکتر لیلا صادقی',
    avatar: avatar('leila'),
    phone: '09121110008',
    specialtyId: 'sp-psy',
    city: 'تهران',
    hospital: 'کلینیک آرامش',
    experienceYears: 10,
    rating: 4.9,
    reviewsCount: 233,
    fee: 350000,
    status: 'approved',
    bio: 'روان پزشک متخصص اضطراب و افسردگی.',
    workingHours: [{ day: 'شنبه', from: '14:00', to: '20:00'     }],
  },
]

// ===== Patients =====
export const patients: Patient[] = [
  {
    id: 'pat-1',
    name: 'محمد رحیمی',
    avatar: avatar('mohammad'),
    phone: '09330001111',
    email: 'mohammad@email.com',
    nationalId: '0012345678',
    age: 34,
    gender: 'male',
    city: 'تهران',
    medicalHistory: {
      diagnoses: ['فشار خون بالا (مرحله ۱)', 'چربی خون'],
      allergies: ['پنی‌سیلین'],
      medications: ['آتورواستاتین ۲۰', 'آسپرین ۸۰'],
      notes: 'سابقه خانوادگی بیماری قلبی',
      documents: [
        { id: 'doc-1', name: 'نتیجه آزمایش خون', type: 'pdf', url: '#', uploadedAt: iso(-10) },
        { id: 'doc-2', name: 'نوار قلب', type: 'jpg', url: '#', uploadedAt: iso(-15) },
      ],
    },
  },
  {
    id: 'pat-2',
    name: 'فاطمه ابراهیمی',
    avatar: avatar('fatemeh'),
    phone: '09330002222',
    email: 'fatemeh@email.com',
    nationalId: '0023456789',
    age: 28,
    gender: 'female',
    city: 'اصفهان',
    medicalHistory: {
      diagnoses: [],
      allergies: [],
      medications: [],
      documents: [],
    },
  },
  {
    id: 'pat-3',
    name: 'زهرا موسوی',
    avatar: avatar('zahra'),
    phone: '09330003333',
    email: 'zahra@email.com',
    nationalId: '0034567890',
    age: 41,
    gender: 'female',
    city: 'شیراز',
    medicalHistory: {
      diagnoses: ['دیابت نوع ۲', 'فشار خون بالا'],
      allergies: ['سولفونامید'],
      medications: ['متفورمین ۵۰۰', 'لوزارتان ۵۰'],
      documents: [
        { id: 'doc-3', name: 'نسخه دیابت', type: 'pdf', url: '#', uploadedAt: iso(-30) },
      ],
    },
  },
  {
    id: 'pat-4',
    name: 'امیر تهرانی',
    avatar: avatar('amir'),
    phone: '09330004444',
    email: 'amir@email.com',
    nationalId: '0045678901',
    age: 22,
    gender: 'male',
    city: 'تهران',
    medicalHistory: {
      diagnoses: ['میگرن مزمن'],
      allergies: [],
      medications: ['سوماتریپتان ۵۰'],
      documents: [],
    },
  },
  {
    id: 'pat-5',
    name: 'نیلوفر احمدی',
    avatar: avatar('niloofar'),
    phone: '09330005555',
    email: 'niloofar@email.com',
    nationalId: '0056789012',
    age: 36,
    gender: 'female',
    city: 'مشهد',
    medicalHistory: {
      diagnoses: ['فشار خون بالا'],
      allergies: [],
      medications: ['آتورواستاتین ۲۰', 'آسپرین ۸۰'],
      documents: [
        { id: 'doc-4', name: 'سونوگرافی قلب', type: 'pdf', url: '#', uploadedAt: iso(-7) },
      ],
    },
  },
]

// ===== Appointments =====
export const appointments: Appointment[] = [
  {
    id: 'appt-1',
    patientId: 'pat-1',
    doctorId: 'doc-1',
    date: iso(0),
    time: '10:30',
    status: 'in-progress',
    reason: 'تپش قلب و تنگی نفس',
    consultType: 'video',
    createdAt: iso(-1),
  },
  {
    id: 'appt-2',
    patientId: 'pat-2',
    doctorId: 'doc-1',
    date: iso(0),
    time: '12:00',
    status: 'waiting',
    reason: 'کنترل فشار خون',
    consultType: 'chat',
    createdAt: iso(-2),
  },
  {
    id: 'appt-3',
    patientId: 'pat-3',
    doctorId: 'doc-1',
    date: iso(0),
    time: '14:30',
    status: 'waiting',
    reason: 'درد سینه',
    consultType: 'video',
    createdAt: iso(-3),
  },
  {
    id: 'appt-4',
    patientId: 'pat-4',
    doctorId: 'doc-1',
    date: iso(2),
    time: '09:00',
    status: 'waiting',
    reason: 'نشانگان فشار خون بالا',
    consultType: 'chat',
    createdAt: iso(-1),
  },
  {
    id: 'appt-5',
    patientId: 'pat-5',
    doctorId: 'doc-1',
    date: iso(-5),
    time: '11:00',
    status: 'completed',
    reason: 'مشاوره عمومی قلب',
  },
  {
    id: 'appt-6',
    patientId: 'pat-1',
    doctorId: 'doc-3',
    date: iso(1),
    time: '17:00',
    status: 'waiting',
    reason: 'جوش پوستی',
  },
  {
    id: 'appt-7',
    patientId: 'pat-2',
    doctorId: 'doc-8',
    date: iso(3),
    time: '15:00',
    status: 'waiting',
    reason: 'اضطراب و بی‌خوابی',
  },
  {
    id: 'appt-8',
    patientId: 'pat-3',
    doctorId: 'doc-5',
    date: iso(-2),
    time: '11:30',
    status: 'completed',
    reason: 'واکسیناسیون کودک',
  },
  {
    id: 'appt-9',
    patientId: 'pat-4',
    doctorId: 'doc-2',
    date: iso(-1),
    time: '10:00',
    status: 'cancelled',
    reason: 'سردرد مزمن',
  },
]

// ===== Chat (for appt-1: doc-1 ↔ pat-1) =====
export const chatMessages: ChatMessage[] = [
  {
    id: 'm1',
    senderId: 'doc-1',
    text: 'سلام جناب رحیمی، خوشحالم که به مشاوره آنلاین پیوستید. مشکل تپش قلب از چه زمانی شروع شده؟',
    time: '10:31',
    type: 'text',
  },
  {
    id: 'm2',
    senderId: 'pat-1',
    text: 'سلام دکتر. حدود دو هفته‌ست. بیشتر موقع استراحت حس می‌کنم.',
    time: '10:32',
    type: 'text',
  },
  {
    id: 'm3',
    senderId: 'doc-1',
    text: 'آیا تنگی نفس همراه با آن دارید یا در هنگام فعالیت بدنی تشدید می‌شود؟',
    time: '10:33',
    type: 'text',
  },
  {
    id: 'm4',
    senderId: 'pat-1',
    text: 'بله گاهی تنگی نفس هم دارم، ولی با فعالیت زیاد ربطی نداره.',
    time: '10:34',
    type: 'text',
  },
]

export const prescriptions: Prescription[] = [
  {
    id: 'rx-1',
    appointmentId: 'appt-5',
    doctorId: 'doc-1',
    patientId: 'pat-5',
    items: [
      { drug: 'آتورواستاتین ۲۰ میلی‌گرم', usage: 'هر شب بعد از شام' },
      { drug: 'آسپرین ۸۰ میلی‌گرم', usage: 'روزانه بعد از صبحانه' },
    ],
    notes: 'پیگیری فشار خون هفتگی. کاهش مصرف نمک.',
    createdAt: iso(-5),
  },
]

// ===== Audit Logs =====
export const auditLogs: AuditLog[] = [
  { id: 'log-1', action: 'appointment.created', actor: 'pat-1', actorName: 'محمد رحیمی', target: 'appt-1', targetName: 'نوبت #۱', details: 'نوبت ویزیت ثبت شد', timestamp: `${iso(0)}T10:00:00` },
  { id: 'log-2', action: 'doctor.verified', actor: 'admin', actorName: 'مدیر سیستم', target: 'doc-1', targetName: 'دکتر سارا محمدی', details: 'مدارک تأیید شد', timestamp: `${iso(-1)}T09:00:00` },
  { id: 'log-3', action: 'appointment.cancelled', actor: 'pat-4', actorName: 'امیر تهرانی', target: 'appt-9', targetName: 'نوبت #۹', details: 'نوبت توسط بیمار لغو شد', timestamp: `${iso(-1)}T14:00:00` },
  { id: 'log-4', action: 'prescription.issued', actor: 'doc-1', actorName: 'دکتر سارا محمدی', target: 'rx-1', targetName: 'نسخه #۱', details: 'نسخه صادر شد', timestamp: `${iso(-2)}T11:00:00` },
  { id: 'log-5', action: 'user.registered', actor: 'pat-5', actorName: 'نیلوفر احمدی', target: 'pat-5', targetName: 'نیلوفر احمدی', details: 'ثبت‌نام کاربر جدید', timestamp: `${iso(-3)}T08:00:00` },
  { id: 'log-6', action: 'withdrawal.approved', actor: 'admin', actorName: 'مدیر سیستم', target: 'wd-1', targetName: 'درخواست برداشت #۱', details: 'مبلغ ۵ میلیون تومان تأیید شد', timestamp: `${iso(-4)}T16:00:00` },
  { id: 'log-7', action: 'doctor.suspended', actor: 'admin', actorName: 'مدیر سیستم', target: 'doc-7', targetName: 'دکتر پارسا نوری', details: 'حساب معلق شد', timestamp: `${iso(-5)}T10:00:00` },
  { id: 'log-8', action: 'appointment.completed', actor: 'doc-1', actorName: 'دکتر سارا محمدی', target: 'appt-5', targetName: 'نوبت #۵', details: 'ویزیت تکمیل شد', timestamp: `${iso(-5)}T12:00:00` },
  { id: 'log-9', action: 'specialty.added', actor: 'admin', actorName: 'مدیر سیستم', target: 'sp-gp', targetName: 'پزشک عمومی', details: 'تخصص جدید اضافه شد', timestamp: `${iso(-6)}T09:00:00` },
  { id: 'log-10', action: 'appointment.created', actor: 'pat-2', actorName: 'فاطمه ابراهیمی', target: 'appt-2', targetName: 'نوبت #۲', details: 'نوبت ویزیت ثبت شد', timestamp: `${iso(-7)}T15:00:00` },
]

// ===== Withdrawal Requests =====
export const withdrawalRequests: WithdrawalRequest[] = [
  { id: 'wd-1', doctorId: 'doc-1', doctorName: 'دکتر سارا محمدی', amount: 5000000, status: 'approved', createdAt: `${iso(-10)}T10:00:00`, processedAt: `${iso(-4)}T16:00:00`, adminNote: 'واریز شد', bankInfo: '۶۰۳۷۰۰۰۰۰۰۰۰۰۰۰۱' },
  { id: 'wd-2', doctorId: 'doc-2', doctorName: 'دکتر علی رضایی', amount: 3500000, status: 'pending', createdAt: `${iso(-2)}T14:00:00`, bankInfo: '۶۰۳۷۰۰۰۰۰0000002' },
  { id: 'wd-3', doctorId: 'doc-5', doctorName: 'دکتر نگار اکبری', amount: 7200000, status: 'pending', createdAt: `${iso(-1)}T11:00:00`, bankInfo: '۶۰۳۷۰۰۰۰۰0000005' },
  { id: 'wd-4', doctorId: 'doc-8', doctorName: 'دکتر لیلا صادقی', amount: 4800000, status: 'rejected', createdAt: `${iso(-8)}T09:00:00`, processedAt: `${iso(-6)}T12:00:00`, adminNote: 'اطلاعات بانکی نادرست', bankInfo: '۶۰۳۷۰۰000000008' },
  { id: 'wd-5', doctorId: 'doc-3', doctorName: 'دکتر مریم حسینی', amount: 2100000, status: 'approved', createdAt: `${iso(-15)}T10:00:00`, processedAt: `${iso(-12)}T14:00:00`, bankInfo: '۶۰۳۷00000000003' },
]

// ===== Platform Settings =====
export const platformSettings: PlatformSetting[] = [
  { key: 'commission_rate', label: 'نرخ کمیسیون (درصد)', value: '15', type: 'number' },
  { key: 'min_appointment_fee', label: 'حداقل هزینه ویزیت (تومان)', value: '100000', type: 'number' },
  { key: 'max_daily_appointments', label: 'حداکثر نوبت روزانه هر پزشک', value: '20', type: 'number' },
  { key: 'allow_video_consult', label: 'فعال‌سازی مشاوره ویدئویی', value: 'true', type: 'toggle' },
  { key: 'allow_audio_consult', label: 'فعال‌سازی مشاوره صوتی', value: 'true', type: 'toggle' },
  { key: 'auto_approve_doctors', label: 'تأیید خودکار پزشکان', value: 'false', type: 'toggle' },
  { key: 'platform_currency', label: 'واحد پول', value: 'toman', type: 'select', options: ['toman', 'rial', 'dollar'] },
  { key: 'support_email', label: 'ایمیل پشتیبانی', value: 'support@avaldr.ir', type: 'text' },
  { key: 'notification_sms', label: 'ارسال پیامک اعلان', value: 'true', type: 'toggle' },
  { key: 'cancellation_policy_hours', label: 'ساعت مجاز لغو قبل از نوبت', value: '2', type: 'number' },
]

// ===== Notification Preferences =====
export const defaultNotificationPrefs = [
  { key: 'appointment_reminder', label: 'یادآوری نوبت', enabled: true },
  { key: 'new_message', label: 'پیام جدید', enabled: true },
  { key: 'prescription_ready', label: 'آماده شدن نسخه', enabled: true },
  { key: 'marketing', label: 'اخبار و تخفیف‌ها', enabled: false },
  { key: 'weekly_report', label: 'گزارش هفتگی سلامت', enabled: true },
]

// ===== Prescription Drug Suggestions (mock) =====
export const drugSuggestions = [
  'آتورواستاتین ۱۰ میلی‌گرم', 'آتورواستاتین ۲۰ میلی‌گرم', 'آتورواستاتین ۴۰ میلی‌گرم',
  'آسپرین ۸۰ میلی‌گرم', 'آسپرین ۳۲۵ میلی‌گرم',
  'متفورمین ۵۰۰ میلی‌گرم', 'متفورمین ۸۵۰ میلی‌گرم',
  'لوزارتان ۲۵ میلی‌گرم', 'لوزارتان ۵۰ میلی‌گرم',
  'آملودیپین ۵ میلی‌گرم', 'آملودیپین ۱۰ میلی‌گرم',
  'امپرازول ۲۰ میلی‌گرم', 'امپرازول ۴۰ میلی‌گرم',
  'سوماتریپتان ۵۰ میلی‌گرم', 'ایبوپروفن ۴۰۰ میلی‌گرم',
  'آموکسی‌سیلین ۵۰۰ میلی‌گرم', 'سفالکسین ۵۰۰ میلی‌گرم',
  'سردین ۲۵ میلی‌گرم', 'فلوکستین ۲۰ میلی‌گرم',
  'لوراتادین ۱۰ میلی‌گرم', 'ویتامین D ۵۰۰۰۰ واحد', 'کلسیم-D ۱۰۰۰ میلی‌گرم',
]

// ===== Earnings mock data for doctor dashboard =====
export const doctorEarnings = {
  thisMonth: 18500000,
  lastMonth: 15200000,
  pending: 4200000,
  withdrawn: 14300000,
  weekly: [
    { week: 'هفته ۱', amount: 4200000 },
    { week: 'هفته ۲', amount: 5100000 },
    { week: 'هفته ۳', amount: 4800000 },
    { week: 'هفته ۴', amount: 4400000 },
  ],
}

// ===== Admin chart data =====
export const userGrowthData = [
  { month: 'فروردین', users: 120, doctors: 8 },
  { month: 'اردیبهشت', users: 280, doctors: 14 },
  { month: 'خرداد', users: 410, doctors: 22 },
  { month: 'تیر', users: 580, doctors: 30 },
  { month: 'مرداد', users: 720, doctors: 38 },
  { month: 'شهریور', users: 950, doctors: 45 },
  { month: 'مهر', users: 1200, doctors: 55 },
  { month: 'آبان', users: 1480, doctors: 62 },
  { month: 'آذر', users: 1750, doctors: 70 },
]

export const revenueData = [
  { month: 'فروردین', revenue: 45 },
  { month: 'اردیبهشت', revenue: 62 },
  { month: 'خرداد', revenue: 58 },
  { month: 'تیر', revenue: 78 },
  { month: 'مرداد', revenue: 85 },
  { month: 'شهریور', revenue: 92 },
  { month: 'مهر', revenue: 105 },
  { month: 'آبان', revenue: 118 },
  { month: 'آذر', revenue: 130 },
]

// ===== Helpers =====
export const getDoctor = (id: string) => doctors.find((d) => d.id === id)
export const getPatient = (id: string) => patients.find((p) => p.id === id)
export const getSpecialty = (id: string) => specialties.find((s) => s.id === id)

// ===== Auth mock users (built from doctors + patients + admin) =====
export const mockUsers: MockUser[] = [
  ...doctors.map((d) => ({
    phone: d.phone,
    role: 'doctor' as const,
    name: d.name,
    documents: null,
  })),
  ...patients.map((p) => ({
    phone: p.phone,
    role: 'user' as const,
    name: p.name,
    documents: null,
  })),
  {
    phone: '09123456788',
    role: 'admin' as const,
    name: 'مدیر سیستم',
    documents: null,
  },
]

export const findUserByPhone = (phone: string): MockUser | undefined =>
  mockUsers.find((u) => u.phone === phone)

export const addUser = (user: MockUser) => {
  mockUsers.push(user)
}