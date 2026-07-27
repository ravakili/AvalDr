import { useEffect, useState } from 'react'

export const accentColors = ['teal', 'indigo', 'pink', 'red', 'green', 'emerald'] as const

export type AccentColor = (typeof accentColors)[number]
export type ColorMode = 'light' | 'dark'

const MODE_KEY = 'dr-saina-color-mode'
const ACCENT_KEY = 'dr-saina-accent-color'

const accentThemeColors: Record<AccentColor, string> = {
  teal: '#2196b3',
  indigo: '#6366f1',
  pink: '#ec4899',
  red: '#ef4444',
  green: '#22c55e',
  emerald: '#10b981',
}

function isAccentColor(value: string | null): value is AccentColor {
  return accentColors.includes(value as AccentColor)
}

function getSystemMode(): ColorMode {
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
}

function getStoredMode(): ColorMode | null {
  const value = localStorage.getItem(MODE_KEY)
  return value === 'light' || value === 'dark' ? value : null
}

function getStoredAccent(): AccentColor {
  const value = localStorage.getItem(ACCENT_KEY)
  return isAccentColor(value) ? value : 'teal'
}

function applyMode(mode: ColorMode) {
  document.documentElement.classList.toggle('dark', mode === 'dark')
  document.documentElement.style.colorScheme = mode
  updateBrowserThemeColor(mode, getStoredAccent())
}

function applyAccent(accent: AccentColor) {
  document.documentElement.dataset.accent = accent
  const mode = document.documentElement.classList.contains('dark') ? 'dark' : 'light'
  updateBrowserThemeColor(mode, accent)
}

function updateBrowserThemeColor(mode: ColorMode, accent: AccentColor) {
  const meta = document.querySelector<HTMLMetaElement>('meta[name="theme-color"]')
  meta?.setAttribute('content', mode === 'dark' ? '#0b1120' : accentThemeColors[accent])
}

export function initializeTheme() {
  applyMode(getStoredMode() ?? getSystemMode())
  applyAccent(getStoredAccent())
}

export function useTheme() {
  const [mode, setMode] = useState<ColorMode>(() => getStoredMode() ?? getSystemMode())
  const [accent, setAccent] = useState<AccentColor>(getStoredAccent)

  useEffect(() => {
    applyMode(mode)
  }, [mode])

  useEffect(() => {
    applyAccent(accent)
  }, [accent])

  useEffect(() => {
    const media = window.matchMedia('(prefers-color-scheme: dark)')

    const syncWithSystem = (event: MediaQueryListEvent) => {
      if (!getStoredMode()) {
        setMode(event.matches ? 'dark' : 'light')
      }
    }

    media.addEventListener('change', syncWithSystem)
    return () => media.removeEventListener('change', syncWithSystem)
  }, [])

  const toggleMode = () => {
    setMode((current) => {
      const next = current === 'dark' ? 'light' : 'dark'
      localStorage.setItem(MODE_KEY, next)
      return next
    })
  }

  const cycleAccent = () => {
    setAccent((current) => {
      const currentIndex = accentColors.indexOf(current)
      const next = accentColors[(currentIndex + 1) % accentColors.length]
      localStorage.setItem(ACCENT_KEY, next)
      return next
    })
  }

  return { mode, accent, toggleMode, cycleAccent }
}
