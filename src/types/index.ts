// ===== Core domain types =====

export type Role = 'user' | 'doctor' | 'admin'

export type ConsultType = 'chat' | 'video' | 'audio'

export interface Specialty {
  id: string
  name: string // Persian
  icon: string // emoji or short glyph
  description?: string
}

export interface Person {
  id: string
  userId?: string
  name: string
  avatar: string // URL
  phone: string
}

export interface WorkingHourSlot {
  day: string
  from: string
  to: string
  breakMinutes?: number
  appointmentDurationMinutes?: number
  id?: string
}

export interface CommunicationSettings {
  chat: { enabled: boolean; fee: number }
  audio: { enabled: boolean; fee: number }
  video: { enabled: boolean; fee: number }
  chatAutoCloseMinutes?: number
}

export interface Doctor extends Person {
  prefix?: string
  specialtyId: string
  city: string
  hospital: string
  experienceYears: number
  rating: number // 0..5
  reviewsCount: number
  fee: number // toman
  status: 'approved' | 'pending' | 'suspended'
  bio: string
  workingHours: WorkingHourSlot[]
  verified?: boolean
  credentials?: string // URL to document
  specialtyName?: string
  specialtyIcon?: string
  communication?: CommunicationSettings
  cardNumber?: string
  accountNumber?: string
  shaba?: string
}

export interface Patient extends Person {
  nationalId: string
  age: number
  gender: 'male' | 'female'
  city: string
  bloodType?: string
  insuranceType?: string
  supplementaryInsurance?: string
  emergencyContact?: { name: string; phone: string; relationship: string }
  medicalHistory?: MedicalRecord
  suspended?: boolean
}

export interface MedicalRecord {
  diagnoses: string[]
  allergies: string[]
  medications: string[]
  notes?: string
  documents?: { id: string; name: string; type: string; url: string; uploadedAt: string }[]
}

export type AppointmentStatus = 'waiting' | 'completed' | 'cancelled' | 'in-progress' | 'pending-approval' | 'pending-payment'

export interface Appointment {
  id: string
  patientId: string
  doctorId: string
  date: string // ISO date
  time: string // e.g. "10:30"
  endTime?: string // e.g. "11:00"
  status: AppointmentStatus
  reason: string
  consultType?: ConsultType
  createdAt?: string
  startedAt?: string
  isFollowUp?: boolean
  patient?: Patient
  doctor?: Doctor
  paymentStatus?: string | null
  refundStatus?: string | null
}

export interface ChatMessage {
  id: string
  senderId: string
  senderName?: string
  senderRole?: Role
  text: string
  time: string
  type: 'text' | 'prescription' | 'system' | 'file'
  fileUrl?: string
  fileName?: string
}

export interface Prescription {
  id: string
  appointmentId: string
  doctorId: string
  patientId: string
  items: { drug: string; usage: string }[]
  notes: string
  createdAt: string
}

export interface User {
  // logged-in account
  id: string
  name: string
  role: Role
  avatar: string
  phone: string
  refId?: string // points to doctor/patient id when relevant
  documents?: DoctorDocuments | null
}

// ===== Auth / Registration types =====

export interface MockUser {
  phone: string
  role: Role
  name: string
  documents: DoctorDocuments | null
}

export interface DoctorDocuments {
  license: string | null
  nationalId: string | null
  experience: string | null
  specialty: string | null
  profilePhoto: string | null
}

export interface UploadingFile {
  id: string
  name: string
  size: number
  type: string
  status: 'pending' | 'uploading' | 'uploaded' | 'error'
  progress: number
  error?: string
}

export interface UserData {
  name: string
  dateOfBirth: string
  gender: 'male' | 'female'
  bloodType: string
  insuranceType: string
  supplementaryInsurance: string
  allergies: string[]
  chronicConditions: string[]
  emergencyContact: {
    name: string
    phone: string
    relationship: string
  }
  isDoctor: boolean
  acceptTerms: boolean
  acceptPrivacy: boolean
  receiveNotifications: boolean
  receivePromotions: boolean
}

// ===== Admin types =====

export interface AuditLog {
  id: string
  action: string // e.g. 'appointment.created', 'doctor.verified'
  actor: string // user id
  actorName: string
  target: string
  targetName: string
  details: string
  timestamp: string // ISO
}

export interface WithdrawalRequest {
  id: string
  doctorId: string
  doctorName: string
  amount: number // toman
  status: 'pending' | 'approved' | 'rejected'
  createdAt: string
  processedAt?: string
  adminNote?: string
  bankInfo: string
}

export interface PlatformSetting {
  key: string
  label: string
  value: string
  type: 'text' | 'number' | 'toggle' | 'select'
  options?: string[]
}

export interface NotificationPreference {
  id?: string
  key: string
  label: string
  enabled: boolean
}

export interface HealthTip {
  id: string
  title: string
  text: string
  icon: string
}

export interface MedicalReport {
  id: string
  name: string
  type: string
  url: string
  uploadedAt: string
  saved: boolean
}

export interface UserNotification {
  id: string
  title: string
  body: string
  type: string
  read: boolean
  data: Record<string, unknown>
  createdAt: string
}
