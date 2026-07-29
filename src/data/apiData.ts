import { useEffect, useState } from 'react'
import type {
  Appointment,
  AuditLog,
  Doctor,
  NotificationPreference,
  Patient,
  PlatformSetting,
  Prescription,
  Role,
  Specialty,
  WithdrawalRequest,
} from '../types'
import { api } from '../lib/api'
import * as fallback from './mockData'

export let specialties: Specialty[] = fallback.specialties
export let doctors: Doctor[] = fallback.doctors
export let patients: Patient[] = fallback.patients
export let appointments: Appointment[] = fallback.appointments
export let prescriptions: Prescription[] = fallback.prescriptions
export let auditLogs: AuditLog[] = fallback.auditLogs
export let withdrawalRequests: WithdrawalRequest[] = fallback.withdrawalRequests
export let platformSettings: PlatformSetting[] = fallback.platformSettings
export let defaultNotificationPrefs: NotificationPreference[] = fallback.defaultNotificationPrefs
export let drugSuggestions: string[] = fallback.drugSuggestions

export const doctorEarnings = { ...fallback.doctorEarnings }
export const userGrowthData = fallback.userGrowthData
export const revenueData = fallback.revenueData

let currentRole: Role | null = null
let loadingPromise: Promise<void> | null = null
const subscribers = new Set<() => void>()

function emit() {
  subscribers.forEach((subscriber) => subscriber())
}

function uniquePatients(items: Appointment[]) {
  const map = new Map<string, Patient>()
  items.forEach((item) => {
    const patient = (item as Appointment & { patient?: Patient }).patient
    if (patient) map.set(patient.id, patient)
  })
  return [...map.values()]
}

function extractResults<T>(response: T | { results: T }): T {
  if (response && typeof response === 'object' && 'results' in response) {
    return (response as { results: T }).results
  }
  return response as T
}

export async function refreshBackendData(role: Role = currentRole || 'user') {
  currentRole = role
  if (loadingPromise) return loadingPromise
  loadingPromise = (async () => {
    const [publicDoctors, publicSpecialties] = await Promise.all([
      api.get<Doctor[]>('/doctors/', false),
      api.get<Specialty[]>('/doctors/specialties/', false),
    ])
    doctors = extractResults(publicDoctors)
    specialties = extractResults(publicSpecialties)

    if (role === 'admin') {
      const [
        allDoctors,
        allPatients,
        allAppointments,
        logs,
        withdrawals,
        settings,
      ] = await Promise.all([
        api.get<Doctor[]>('/admin/doctors/'),
        api.get<Patient[]>('/admin/users/'),
        api.get<Appointment[]>('/appointments/'),
        api.get<AuditLog[]>('/admin/audit-logs/'),
        api.get<WithdrawalRequest[]>('/admin/withdrawals/'),
        api.get<PlatformSetting[]>('/admin/settings/'),
      ])
      doctors = extractResults(allDoctors)
      patients = extractResults(allPatients)
      appointments = extractResults(allAppointments)
      auditLogs = extractResults(logs)
      withdrawalRequests = extractResults(withdrawals)
      platformSettings = extractResults(settings)
    } else {
      const [roleAppointments, rolePrescriptions] = await Promise.all([
        api.get<Appointment[]>('/appointments/'),
        api.get<Prescription[]>('/prescriptions/'),
      ])
      appointments = extractResults(roleAppointments)
      prescriptions = extractResults(rolePrescriptions)
      patients = uniquePatients(appointments)
      const appointmentDoctors = appointments
        .map((item) => (item as Appointment & { doctor?: Doctor }).doctor)
        .filter(Boolean) as Doctor[]
      if (role === 'doctor') {
        const [me, earnings] = await Promise.all([
          api.get<Doctor>('/doctors/me/'),
          api.get<typeof doctorEarnings>('/doctors/me/earnings/'),
        ])
        doctors = [me, ...publicDoctors.filter((doctor) => doctor.id !== me.id)]
        Object.assign(doctorEarnings, earnings)
      } else if (appointmentDoctors.length) {
        const map = new Map(publicDoctors.map((doctor) => [doctor.id, doctor]))
        appointmentDoctors.forEach((doctor) => map.set(doctor.id, doctor))
        doctors = [...map.values()]
      }
      if (role === 'user') {
        const [me, preferences] = await Promise.all([
          api.get<Patient>('/auth/patient/'),
          api.get<NotificationPreference[]>('/notifications/preferences/'),
        ])
        patients = [me]
        defaultNotificationPrefs = extractResults(preferences)
      }
    }

    try {
      drugSuggestions = extractResults(await api.get<string[]>('/prescriptions/suggestions/?q='))
    } catch {
      drugSuggestions = fallback.drugSuggestions
    }
    emit()
  })().finally(() => {
    loadingPromise = null
  })
  return loadingPromise
}

export function useBackendData(role: Role) {
  const [, setVersion] = useState(0)
  useEffect(() => {
    const subscriber = () => setVersion((version) => version + 1)
    subscribers.add(subscriber)
    refreshBackendData(role).catch(console.error)
    return () => { subscribers.delete(subscriber) }
  }, [role])
}

export const getDoctor = (id: string) => doctors.find((doctor) => doctor.id === id)
export const getPatient = (id: string) => patients.find((patient) => patient.id === id)
export const getSpecialty = (id: string) => specialties.find((specialty) => specialty.id === id)
export const doctorName = (d: { name: string; prefix?: string } | null | undefined) =>
  d ? `${d.prefix ? d.prefix + ' ' : ''}${d.name}` : ''
