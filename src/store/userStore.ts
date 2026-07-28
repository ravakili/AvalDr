import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { Appointment, Patient, NotificationPreference, MedicalRecord, MedicalReport, HealthTip, UserNotification } from '../types'
import { api, apiRequest } from '../lib/api'

function extractResults<T>(response: T | { results: T }): T {
  if (response && typeof response === 'object' && 'results' in response) {
    return (response as { results: T }).results
  }
  return response as T
}

interface UserState {
  profile: Patient | null
  appointments: Appointment[]
  notifications: UserNotification[]
  preferences: NotificationPreference[]
  medicalRecord: MedicalRecord | null
  reports: MedicalReport[]
  healthTips: HealthTip[]
  loading: boolean
  error: string | null
  lastFetched: number | null

  fetchProfile: () => Promise<void>
  saveProfile: (data: Record<string, unknown>) => Promise<void>
  uploadAvatar: (file: File) => Promise<void>
  fetchAppointments: () => Promise<void>
  cancelAppointment: (id: string) => Promise<void>
  deleteAppointment: (id: string) => Promise<void>
  fetchNotifications: () => Promise<void>
  fetchPreferences: () => Promise<void>
  savePreference: (id: string, enabled: boolean) => Promise<void>
  fetchMedicalRecord: () => Promise<void>
  saveMedicalRecord: (data: Record<string, unknown>) => Promise<void>
  fetchReports: () => Promise<void>
  uploadReport: (file: File) => Promise<void>
  deleteReport: (id: string) => Promise<void>
  fetchHealthTips: () => Promise<void>
  fetchAll: () => Promise<void>
  updateAppointment: (id: string, updates: Partial<Appointment>) => void
}

export const useUserStore = create<UserState>()(
  persist(
    (set, get) => ({
      profile: null,
      appointments: [],
      notifications: [],
      preferences: [],
      medicalRecord: null,
      reports: [],
      healthTips: [],
      loading: false,
      error: null,
      lastFetched: null,

      fetchProfile: async () => {
        try {
          const data = await api.get<Patient>('/auth/patient/')
          set({ profile: data })
        } catch { /* ignore */ }
      },

      saveProfile: async (data) => {
        set({ loading: true, error: null })
        try {
          const updated = await api.patch<Patient>('/auth/patient/', data)
          set({ profile: updated, loading: false })
        } catch (e) {
          set({ loading: false, error: 'خطا در ذخیره اطلاعات' })
          throw e
        }
      },

      uploadAvatar: async (file) => {
        set({ loading: true })
        try {
          const form = new FormData()
          form.append('avatar', file)
          const user = await apiRequest<{ avatar: string }>('/auth/me/', {
            method: 'PATCH',
            body: form,
          })
          set((s) => ({
            profile: s.profile ? { ...s.profile, avatar: user.avatar } : null,
            loading: false,
          }))
        } catch { set({ loading: false }) }
      },

      fetchAppointments: async () => {
        try {
          const data = await api.get<Appointment[]>('/appointments/')
          set({ appointments: extractResults(data) })
        } catch { /* ignore */ }
      },

      cancelAppointment: async (id) => {
        try {
          await api.post(`/appointments/${id}/cancel/`)
          set((s) => ({
            appointments: s.appointments.map((a) =>
              a.id === id ? { ...a, status: 'cancelled' as const } : a
            ),
          }))
        } catch { throw new Error('خطا در لغو نوبت') }
      },

      deleteAppointment: async (id) => {
        try {
          await api.delete(`/appointments/${id}/`)
          set((s) => ({
            appointments: s.appointments.filter((a) => a.id !== id),
          }))
        } catch { throw new Error('خطا در حذف نوبت') }
      },

      fetchNotifications: async () => {
        try {
          const data = await api.get<UserNotification[]>('/notifications/')
          set({ notifications: extractResults(data) })
        } catch { /* ignore */ }
      },

      fetchPreferences: async () => {
        try {
          const data = await api.get<NotificationPreference[]>('/notifications/preferences/')
          set({ preferences: extractResults(data) })
        } catch { /* ignore */ }
      },

      savePreference: async (id, enabled) => {
        try {
          await api.patch(`/notifications/preferences/${id}/`, { enabled })
          set((s) => ({
            preferences: s.preferences.map((p) =>
              String(p.id) === id ? { ...p, enabled } : p
            ),
          }))
        } catch { /* ignore */ }
      },

      fetchMedicalRecord: async () => {
        try {
          const data = await api.get('/medical/record/')
          set({ medicalRecord: data as unknown as MedicalRecord })
        } catch { /* ignore */ }
      },

      saveMedicalRecord: async (data) => {
        set({ loading: true, error: null })
        try {
          const updated = await api.patch('/medical/record/', data)
          set({ medicalRecord: updated as unknown as MedicalRecord, loading: false })
        } catch {
          set({ loading: false, error: 'خطا در ذخیره پرونده' })
        }
      },

      fetchReports: async () => {
        try {
          const data = await api.get('/medical/reports/')
          set({ reports: extractResults(data) as unknown as MedicalReport[] })
        } catch { /* ignore */ }
      },

      uploadReport: async (file) => {
        set({ loading: true, error: null })
        try {
          const form = new FormData()
          form.append('file', file)
          form.append('name', file.name)
          const report = await apiRequest('/medical/reports/', {
            method: 'POST',
            body: form,
          })
          set((s) => ({
            reports: [...s.reports, report as unknown as MedicalReport],
            loading: false,
          }))
        } catch {
          set({ loading: false, error: 'خطا در آپلود گزارش' })
          throw new Error('خطا در آپلود')
        }
      },

      deleteReport: async (id) => {
        try {
          await api.delete(`/medical/reports/${id}/`)
          set((s) => ({ reports: s.reports.filter((r) => r.id !== id) }))
        } catch { /* ignore */ }
      },

      fetchHealthTips: async () => {
        try {
          const data = await api.get<HealthTip[]>('/health-tips/', false)
          set({ healthTips: extractResults(data) })
        } catch {
          set({ healthTips: [
            { id: '1', title: 'روزانه ۸ لیوان آب', text: 'هیدراته نگه‌داشتن بدن به عملکرد بهتر قلب کمک می‌کند.', icon: '💧' },
            { id: '2', title: '۳۰ دقیقه پیاده‌روی', text: 'فعالیت سبک روزانه، فشار خون را تنظیم می‌کند.', icon: '🚶' },
            { id: '3', title: 'خواب کافی', text: '۷ تا ۸ ساعت خواب، رمز سلامت سیستم ایمنی است.', icon: '😴' },
          ]})
        }
      },

      fetchAll: async () => {
        set({ loading: true, error: null })
        try {
          await Promise.all([
            get().fetchProfile(),
            get().fetchAppointments(),
            get().fetchNotifications(),
            get().fetchPreferences(),
            get().fetchMedicalRecord(),
            get().fetchReports(),
            get().fetchHealthTips(),
          ])
          set({ lastFetched: Date.now(), loading: false })
        } catch {
          set({ loading: false, error: 'خطا در دریافت اطلاعات' })
        }
      },

      updateAppointment: (id, updates) => {
        set((s) => ({
          appointments: s.appointments.map((a) =>
            a.id === id ? { ...a, ...updates } : a
          ),
        }))
      },
    }),
    {
      name: 'AvalDr-user-store',
      partialize: (state) => ({
        profile: state.profile,
        appointments: state.appointments,
        notifications: state.notifications,
        preferences: state.preferences,
        medicalRecord: state.medicalRecord,
        reports: state.reports,
        healthTips: state.healthTips,
        lastFetched: state.lastFetched,
      }),
    },
  ),
)
