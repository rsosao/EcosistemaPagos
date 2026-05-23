import { useEffect, useState, type ReactNode } from "react"
import {
  Banknote,
  CreditCard,
  ExternalLink,
  GraduationCap,
  LayoutDashboard,
  Menu,
  Moon,
  Receipt,
  Sparkles,
  Sun,
  Users,
  Wallet,
} from "lucide-react"

import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

export type ViewKey =
  | "dashboard"
  | "clientes"
  | "cuotas"
  | "pagar"
  | "tesoreria"
  | "reportes"
  | "seed"

interface NavItem {
  key: ViewKey
  label: string
  icon: ReactNode
  description: string
}

const NAV_ITEMS: NavItem[] = [
  {
    key: "dashboard",
    label: "Resumen",
    icon: <LayoutDashboard className="size-4" />,
    description: "Panel general",
  },
  {
    key: "clientes",
    label: "Estudiantes",
    icon: <Users className="size-4" />,
    description: "Registro y estado de cuenta",
  },
  {
    key: "cuotas",
    label: "Generar cuotas",
    icon: <Receipt className="size-4" />,
    description: "Cuota mensual del periodo",
  },
  {
    key: "pagar",
    label: "Cobrar",
    icon: <CreditCard className="size-4" />,
    description: "Efectivo o tarjeta",
  },
  {
    key: "tesoreria",
    label: "Tesorería",
    icon: <Wallet className="size-4" />,
    description: "Saldo en el banco",
  },
  {
    key: "reportes",
    label: "Reportes",
    icon: <Banknote className="size-4" />,
    description: "Pendientes, pagados, movimientos",
  },
  {
    key: "seed",
    label: "Datos demo",
    icon: <Sparkles className="size-4" />,
    description: "Sembrar datos de prueba",
  },
]

function getInitialTheme(): "light" | "dark" {
  if (typeof window === "undefined") return "light"
  const stored = window.localStorage.getItem("uni-theme")
  if (stored === "light" || stored === "dark") return stored
  return window.matchMedia("(prefers-color-scheme: dark)").matches
    ? "dark"
    : "light"
}

interface AppShellProps {
  view: ViewKey
  onChangeView: (view: ViewKey) => void
  children: ReactNode
}

export function AppShell({ view, onChangeView, children }: AppShellProps) {
  const [theme, setTheme] = useState<"light" | "dark">(getInitialTheme)
  const [mobileOpen, setMobileOpen] = useState(false)

  useEffect(() => {
    const root = document.documentElement
    root.classList.toggle("dark", theme === "dark")
    window.localStorage.setItem("uni-theme", theme)
  }, [theme])

  function changeView(next: ViewKey) {
    onChangeView(next)
    setMobileOpen(false)
  }

  return (
    <div className="bg-background text-foreground min-h-full">
      <header className="bg-background/80 sticky top-0 z-40 border-b backdrop-blur">
        <div className="mx-auto flex h-14 max-w-7xl items-center gap-3 px-4">
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden"
            onClick={() => setMobileOpen((s) => !s)}
            aria-label="Abrir menú"
          >
            <Menu className="size-5" />
          </Button>
          <div className="flex items-center gap-2 font-semibold">
            <div className="grid size-8 place-items-center rounded-md bg-emerald-600 text-white">
              <GraduationCap className="size-5" />
            </div>
            <div className="flex flex-col leading-tight">
              <span className="text-sm font-semibold">Universidad</span>
              <span className="text-muted-foreground text-[11px]">
                Control académico y cobros
              </span>
            </div>
          </div>
          <div className="ml-auto flex items-center gap-2">
            <Button
              asChild
              variant="outline"
              size="sm"
              className="hidden sm:inline-flex"
            >
              <a href="/scalar/v1" target="_blank" rel="noreferrer">
                <ExternalLink className="size-4" />
                API Docs
              </a>
            </Button>
            <Button
              variant="ghost"
              size="icon"
              aria-label="Cambiar tema"
              onClick={() =>
                setTheme((t) => (t === "dark" ? "light" : "dark"))
              }
            >
              {theme === "dark" ? (
                <Sun className="size-5" />
              ) : (
                <Moon className="size-5" />
              )}
            </Button>
          </div>
        </div>
      </header>

      <div className="mx-auto flex max-w-7xl gap-4 px-4 py-6">
        <aside
          className={cn(
            "bg-card text-card-foreground fixed inset-y-0 left-0 z-50 w-72 -translate-x-full border-r p-4 shadow-lg transition-transform md:relative md:inset-y-auto md:left-auto md:z-auto md:flex md:w-64 md:translate-x-0 md:flex-col md:rounded-xl md:border md:bg-card md:p-3 md:shadow-none",
            mobileOpen && "translate-x-0",
          )}
        >
          <nav className="flex flex-col gap-1">
            {NAV_ITEMS.map((item) => (
              <button
                key={item.key}
                type="button"
                onClick={() => changeView(item.key)}
                className={cn(
                  "group flex items-start gap-3 rounded-lg px-3 py-2 text-left text-sm transition-colors",
                  view === item.key
                    ? "bg-emerald-600 text-white shadow-sm"
                    : "hover:bg-accent hover:text-accent-foreground",
                )}
              >
                <span
                  className={cn(
                    "mt-0.5",
                    view === item.key
                      ? "text-white"
                      : "text-muted-foreground group-hover:text-foreground",
                  )}
                >
                  {item.icon}
                </span>
                <span className="flex flex-col">
                  <span className="font-medium">{item.label}</span>
                  <span
                    className={cn(
                      "text-xs",
                      view === item.key
                        ? "text-emerald-50"
                        : "text-muted-foreground",
                    )}
                  >
                    {item.description}
                  </span>
                </span>
              </button>
            ))}
          </nav>
          <div className="text-muted-foreground mt-auto px-1 pt-4 text-xs">
            <p>UniversidadApi · puerto 5002</p>
            <p>Carné como identificador</p>
          </div>
        </aside>

        {mobileOpen && (
          <button
            type="button"
            className="fixed inset-0 z-40 bg-black/40 md:hidden"
            onClick={() => setMobileOpen(false)}
            aria-label="Cerrar menú"
          />
        )}

        <main className="min-w-0 flex-1">{children}</main>
      </div>
    </div>
  )
}
