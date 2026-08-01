import { create } from 'zustand'

export type ToastTone = 'success' | 'error' | 'info' | 'warning'

export interface ToastItem {
  id: string
  title: string
  message?: string
  tone: ToastTone
}

interface ToastState {
  items: ToastItem[]
  show: (toast: Omit<ToastItem, 'id'>) => string
  dismiss: (id: string) => void
}

export const useToastStore = create<ToastState>((set, get) => ({
  items: [],
  show: (toast) => {
    const id = `${Date.now()}-${Math.random().toString(36).slice(2)}`
    set((state) => ({ items: [...state.items, { ...toast, id }].slice(-4) }))
    window.setTimeout(() => get().dismiss(id), 4500)
    return id
  },
  dismiss: (id) => set((state) => ({ items: state.items.filter((item) => item.id !== id) })),
}))

export const toast = {
  success: (title: string, message?: string) =>
    useToastStore.getState().show({ title, message, tone: 'success' }),
  error: (title: string, message?: string) =>
    useToastStore.getState().show({ title, message, tone: 'error' }),
  info: (title: string, message?: string) =>
    useToastStore.getState().show({ title, message, tone: 'info' }),
  warning: (title: string, message?: string) =>
    useToastStore.getState().show({ title, message, tone: 'warning' }),
}
