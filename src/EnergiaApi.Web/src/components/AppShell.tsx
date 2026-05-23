import { NavLink, Outlet } from 'react-router-dom'
import {
  BookOpen,
  CreditCard,
  FileBarChart2,
  Gauge,
  LayoutDashboard,
  Moon,
  Sparkles,
  Sun,
  Users,
  Wallet,
  Zap,
} from 'lucide-react'
import { Toaster } from '@/components/ui/sonner'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { useTheme } from '@/components/ThemeProvider'
import { cn } from '@/lib/utils'

const navItems = [
  { to: '/', label: 'Resumen', icon: LayoutDashboard, end: true },
  { to: '/clientes', label: 'Clientes', icon: Users },
  { to: '/cuotas', label: 'Generar cuotas', icon: Gauge },
  { to: '/pagar', label: 'Pagar', icon: CreditCard },
  { to: '/tesoreria', label: 'Tesorería', icon: Wallet },
  { to: '/reportes', label: 'Reportes', icon: FileBarChart2 },
  { to: '/seed', label: 'Datos demo', icon: Sparkles },
]

export function AppShell() {
  const { resolved, setTheme } = useTheme()
  const isDark = resolved === 'dark'

  return (
    <div className="min-h-svh bg-background text-foreground">
      <header className="sticky top-0 z-30 border-b border-border bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="mx-auto flex h-16 max-w-7xl items-center gap-4 px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-2">
            <div className="grid h-9 w-9 place-items-center rounded-lg bg-amber-600 text-white shadow-sm">
              <Zap className="h-5 w-5" />
            </div>
            <div className="leading-tight">
              <p className="text-sm font-semibold text-foreground">Energia</p>
              <p className="text-xs text-muted-foreground">Portal de pagos · API :5004</p>
            </div>
          </div>
          <Separator orientation="vertical" className="hidden h-8 sm:block" />
          <nav className="hidden flex-1 items-center gap-1 lg:flex">
            {navItems.map(({ to, label, icon: Icon, end }) => (
              <NavLink
                key={to}
                to={to}
                end={end}
                className={({ isActive }) =>
                  cn(
                    'inline-flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-colors',
                    isActive
                      ? 'bg-amber-600/10 text-amber-700 dark:text-amber-400'
                      : 'text-muted-foreground hover:bg-muted hover:text-foreground',
                  )
                }
              >
                <Icon className="h-4 w-4" />
                {label}
              </NavLink>
            ))}
          </nav>
          <div className="ml-auto flex items-center gap-2">
            <Button asChild variant="outline" size="sm">
              <a href="/scalar/v1" target="_blank" rel="noreferrer">
                <BookOpen className="mr-1.5 h-4 w-4" />
                API Docs
              </a>
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setTheme(isDark ? 'light' : 'dark')}
              aria-label="Cambiar tema"
            >
              {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </Button>
          </div>
        </div>
        <div className="border-t border-border lg:hidden">
          <nav className="mx-auto flex max-w-7xl gap-1 overflow-x-auto px-4 py-2 sm:px-6">
            {navItems.map(({ to, label, icon: Icon, end }) => (
              <NavLink
                key={to}
                to={to}
                end={end}
                className={({ isActive }) =>
                  cn(
                    'inline-flex shrink-0 items-center gap-2 rounded-md px-3 py-1.5 text-xs font-medium transition-colors',
                    isActive
                      ? 'bg-amber-600/10 text-amber-700 dark:text-amber-400'
                      : 'text-muted-foreground hover:bg-muted hover:text-foreground',
                  )
                }
              >
                <Icon className="h-4 w-4" />
                {label}
              </NavLink>
            ))}
          </nav>
        </div>
      </header>
      <main className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <Outlet />
      </main>
      <Toaster position="top-right" richColors closeButton />
    </div>
  )
}
