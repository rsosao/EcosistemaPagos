import { createContext, useContext, useEffect, useMemo, useState } from 'react'

type Theme = 'dark' | 'light' | 'system'

type ThemeProviderState = {
  theme: Theme
  setTheme: (theme: Theme) => void
  resolved: 'dark' | 'light'
}

const ThemeContext = createContext<ThemeProviderState | undefined>(undefined)

const STORAGE_KEY = 'energia-ui-theme'

function getInitialTheme(): Theme {
  if (typeof window === 'undefined') return 'system'
  const stored = window.localStorage.getItem(STORAGE_KEY) as Theme | null
  return stored ?? 'system'
}

function resolveTheme(theme: Theme): 'dark' | 'light' {
  if (theme !== 'system') return theme
  if (typeof window === 'undefined') return 'light'
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<Theme>(getInitialTheme)
  const [resolved, setResolved] = useState<'dark' | 'light'>(() => resolveTheme(getInitialTheme()))

  useEffect(() => {
    const root = window.document.documentElement
    const r = resolveTheme(theme)
    setResolved(r)
    root.classList.remove('light', 'dark')
    root.classList.add(r)
  }, [theme])

  useEffect(() => {
    if (theme !== 'system') return
    const media = window.matchMedia('(prefers-color-scheme: dark)')
    const handler = () => {
      const r = media.matches ? 'dark' : 'light'
      setResolved(r)
      const root = window.document.documentElement
      root.classList.remove('light', 'dark')
      root.classList.add(r)
    }
    media.addEventListener('change', handler)
    return () => media.removeEventListener('change', handler)
  }, [theme])

  const value = useMemo<ThemeProviderState>(
    () => ({
      theme,
      resolved,
      setTheme: (t) => {
        window.localStorage.setItem(STORAGE_KEY, t)
        setThemeState(t)
      },
    }),
    [theme, resolved],
  )

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
}

export function useTheme(): ThemeProviderState {
  const ctx = useContext(ThemeContext)
  if (!ctx) throw new Error('useTheme debe usarse dentro de ThemeProvider')
  return ctx
}
