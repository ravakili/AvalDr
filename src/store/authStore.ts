import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { Role, User, UserData, UploadingFile } from '../types'
import { findUserByPhone, addUser } from '../data/mockUsers'

interface AuthState {
  user: User | null
  phone: string
  otpCode: string
  otpSent: boolean
  isNewUser: boolean
  otpTimer: number
  resendCount: number
  isLoading: boolean
  step: number
  userData: UserData
  uploadedDocs: Record<string, UploadingFile[]>
  isDoctor: boolean
  login: (role: Role, name?: string) => void
  logout: () => void
  setPhone: (phone: string) => void
  sendOTP: (phone: string) => Promise<void>
  verifyOTP: (code: string) => Promise<{ success: boolean; isNewUser: boolean; role?: string }>
  decrementTimer: () => void
  resetTimer: () => void
  incrementResend: () => void
  canResend: () => boolean
  setStep: (step: number) => void
  setUserData: (data: Partial<UserData>) => void
  setIsDoctor: (v: boolean) => void
  setUploadedDocs: (key: string, files: UploadingFile[]) => void
  addUploadedDoc: (key: string, file: UploadingFile) => void
  updateUploadProgress: (key: string, fileId: string, progress: number) => void
  completeProfile: () => Promise<void>
  reset: () => void
}

const defaultUserData: UserData = {
  name: '',
  email: '',
  dateOfBirth: '',
  gender: 'male',
  bloodType: '',
  allergies: [],
  chronicConditions: [],
  emergencyContact: { name: '', phone: '', relationship: '' },
  isDoctor: false,
  acceptTerms: false,
  acceptPrivacy: false,
  receiveNotifications: true,
  receivePromotions: false,
}

const avatar = (seed: string) =>
  `https://api.dicebear.com/7.x/avataaars/svg?seed=${seed}&radius=20&backgroundColor=b6e3f4,c0aede,d1f4e0`

const wait = (ms: number) => new Promise((r) => setTimeout(r, ms))

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      phone: '',
      otpCode: '',
      otpSent: false,
      isNewUser: false,
      otpTimer: 120,
      resendCount: 0,
      isLoading: false,
      step: 1,
      userData: { ...defaultUserData },
      uploadedDocs: {},
      isDoctor: false,

      login: (role, name) => {
        const phone = get().phone
        set({
          user: {
            id: `${role}-${Date.now()}`,
            name: name || 'کاربر',
            role,
            avatar: avatar(name || role),
            phone,
          },
        })
      },

      logout: () =>
        set({
          user: null,
          phone: '',
          otpCode: '',
          otpSent: false,
          isNewUser: false,
          otpTimer: 120,
          resendCount: 0,
          isLoading: false,
          step: 1,
          userData: { ...defaultUserData },
          uploadedDocs: {},
          isDoctor: false,
        }),

      setPhone: (phone) => set({ phone }),

      sendOTP: async (phone) => {
        set({ isLoading: true, phone, otpCode: '' })
        await wait(1500)
        const code = Math.floor(100000 + Math.random() * 900000).toString()
        console.info('[Dr.Saina Mock OTP]', `کد تایید برای ${phone}: ${code}`)
        const existing = findUserByPhone(phone)
        set({
          otpCode: code,
          otpSent: true,
          isNewUser: !existing,
          isLoading: false,
          otpTimer: 120,
          resendCount: 0,
        })
      },

      verifyOTP: async (code) => {
        const { otpCode, phone } = get()
        set({ isLoading: true })
        await wait(1200)
        if (code !== otpCode) {
          set({ isLoading: false })
          return { success: false, isNewUser: false }
        }
        const existing = findUserByPhone(phone)
        if (existing) {
          set({
            user: {
              id: `${existing.role}-${Date.now()}`,
              name: existing.name,
              role: existing.role,
              avatar: avatar(existing.name),
              phone: existing.phone,
              documents: existing.documents,
            },
            isLoading: false,
          })
          return { success: true, isNewUser: false, role: existing.role }
        }
        set({ isLoading: false, isNewUser: true })
        return { success: true, isNewUser: true }
      },

      decrementTimer: () => {
        const t = get().otpTimer
        if (t > 0) set({ otpTimer: t - 1 })
      },

      resetTimer: () => set({ otpTimer: 120 }),

      incrementResend: () => set({ resendCount: get().resendCount + 1 }),

      canResend: () => get().resendCount < 3,

      setStep: (step) => set({ step }),

      setUserData: (data) =>
        set({ userData: { ...get().userData, ...data } }),

      setIsDoctor: (v) => set({ isDoctor: v }),

      setUploadedDocs: (key, files) =>
        set({ uploadedDocs: { ...get().uploadedDocs, [key]: files } }),

      addUploadedDoc: (key, file) => {
        const existing = get().uploadedDocs[key] || []
        set({ uploadedDocs: { ...get().uploadedDocs, [key]: [...existing, file] } })
      },

      updateUploadProgress: (key, fileId, progress) => {
        const files = get().uploadedDocs[key] || []
        set({
          uploadedDocs: {
            ...get().uploadedDocs,
            [key]: files.map((f) => (f.id === fileId ? { ...f, progress } : f)),
          },
        })
      },

      completeProfile: async () => {
        const { userData, phone, isDoctor } = get()
        set({ isLoading: true })
        await wait(2000)
        const role: Role = isDoctor ? 'doctor' : 'user'
        const name = userData.name || 'کاربر جدید'
        addUser({ phone, role, name, documents: null })
        set({
          user: {
            id: `${role}-${Date.now()}`,
            name,
            role,
            avatar: avatar(name),
            phone,
            documents: null,
          },
          isLoading: false,
          step: 1,
          userData: { ...defaultUserData },
          isDoctor: false,
          uploadedDocs: {},
        })
      },

      reset: () =>
        set({
          phone: '',
          otpCode: '',
          otpSent: false,
          isNewUser: false,
          otpTimer: 120,
          resendCount: 0,
          isLoading: false,
          step: 1,
          userData: { ...defaultUserData },
          uploadedDocs: {},
          isDoctor: false,
        }),
    }),
    {
      name: 'dr-saina-auth',
      partialize: (state) => ({
        user: state.user,
        phone: state.phone,
        isDoctor: state.isDoctor,
        userData: state.userData,
        uploadedDocs: state.uploadedDocs,
      }),
    },
  ),
)

export const homeFor = (role: Role) =>
  role === 'admin' ? '/admin' : role === 'doctor' ? '/doctor' : '/user'
