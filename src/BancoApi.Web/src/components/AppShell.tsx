import { useState } from "react"
import {
  BarChart3,
  Banknote,
  CreditCard,
  Database,
  ExternalLink,
  LandPlot,
  LayoutDashboard,
  Menu,
  ReceiptText,
  ShoppingCart,
  Users,
  Wallet,
  X,
} from "lucide-react"

import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { ThemeToggle } from "@/components/ThemeToggle"
import { cn } from "@/lib/utils"

export type ViewId =
  | "dashboard"
  | "clientes"
  | "cuentas"
  | "tarjetas"
  | "pos"
  | "cajero"
  | "pagar-servicio"
  | "reportes"
  | "seed"

interface NavItem {
  id: ViewId
  label: string
  description: string
  icon: typeof LayoutDashboard
}

export const navItems: NavItem[] = [
  {
    id: "dashboard",
    label: "Dashboard",
    description: "Resumen del banco",
    icon: LayoutDashboard,
  },
  {
    id: "clientes",
    label: "Clientes",
    description: "Crear y consultar",
    icon: Users,
  },
  {
    id: "cuentas",
    label: "Cuentas",
    description: "Saldos y movimientos",
    icon: Wallet,
  },
  {
    id: "tarjetas",
    label: "Tarjetas",
    description: "Débito y crédito",
    icon: CreditCard,
  },
  {
    id: "pos",
    label: "POS",
    description: "Compra con tarjeta",
    icon: ShoppingCart,
  },
  {
    id: "cajero",
    label: "Cajero",
    description: "Retiro en cajero",
    icon: LandPlot,
  },
  {
    id: "pagar-servicio",
    label: "Pagar Servicio",
    description: "Flujo A · banca virtual",
    icon: Banknote,
  },
  {
    id: "reportes",
    label: "Reportes",
    description: "Comisiones y comprobantes",
    icon: BarChart3,
  },
  {
    id: "seed",
    label: "Seed",
    description: "Sembrar datos demo",
    icon: Database,
  },
]

interface AppShellProps {
  currentView: ViewId
  onChangeView: (view: ViewId) => void
  children: React.ReactNode
}

export function AppShell({ currentView, onChangeView, children }: AppShellProps) {
  const [mobileOpen, setMobileOpen] = useState(false)

  const handleNav = (id: ViewId) => {
    onChangeView(id)
    setMobileOpen(false)
  }

  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground">
      <header className="sticky top-0 z-40 border-b border-border/60 bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="flex h-14 items-center gap-3 px-4 sm:px-6">
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden"
            onClick={() => setMobileOpen((v) => !v)}
            aria-label="Abrir menú"
          >
            {mobileOpen ? <X className="size-5" /> : <Menu className="size-5" />}
          </Button>
          <div className="flex items-center gap-2">
            <div className="flex size-8 items-center justify-center rounded-md bg-blue-600 text-white">
              <ReceiptText className="size-5" />
            </div>
            <div className="flex flex-col leading-tight">
              <span className="text-sm font-semibold">BancoApi</span>
              <span className="text-[10px] uppercase tracking-wider text-muted-foreground">
                Ecosistema de Pagos
              </span>
            </div>
          </div>
          <Badge
            variant="secondary"
            className="ml-1 hidden border-blue-600/20 bg-blue-600/10 text-blue-600 dark:border-blue-500/20 dark:bg-blue-500/10 dark:text-blue-400 sm:inline-flex"
          >
            Programación III · UMG
          </Badge>
          <div className="ml-auto flex items-center gap-2">
            <Button asChild variant="outline" size="sm">
              <a href="/scalar/v1" target="_blank" rel="noreferrer">
                <ExternalLink className="size-4" />
                API Docs
              </a>
            </Button>
            <ThemeToggle />
          </div>
        </div>
      </header>

      <div className="flex flex-1">
        <aside
          className={cn(
            "fixed inset-y-14 left-0 z-30 w-64 border-r border-border/60 bg-background/95 backdrop-blur transition-transform md:static md:translate-x-0",
            mobileOpen ? "translate-x-0" : "-translate-x-full",
          )}
        >
          <nav className="flex h-full flex-col gap-1 p-3">
            <span className="px-2 pb-1 pt-2 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
              Navegación
            </span>
            {navItems.map((item) => {
              const Icon = item.icon
              const active = currentView === item.id
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => handleNav(item.id)}
                  className={cn(
                    "group flex items-center gap-3 rounded-md px-3 py-2 text-left text-sm transition-colors",
                    active
                      ? "bg-blue-600 text-white shadow-sm"
                      : "text-foreground/80 hover:bg-accent hover:text-foreground",
                  )}
                >
                  <Icon
                    className={cn(
                      "size-4 shrink-0",
                      active
                        ? "text-white"
                        : "text-muted-foreground group-hover:text-foreground",
                    )}
                  />
                  <span className="flex flex-col">
                    <span className="font-medium">{item.label}</span>
                    <span
                      className={cn(
                        "text-[11px]",
                        active
                          ? "text-white/80"
                          : "text-muted-foreground group-hover:text-foreground/70",
                      )}
                    >
                      {item.description}
                    </span>
                  </span>
                </button>
              )
            })}
            <Separator className="my-3" />
            <p className="px-3 text-[11px] leading-snug text-muted-foreground">
              Proxy de desarrollo apunta a{" "}
              <code className="rounded bg-muted px-1">localhost:5001</code>.
            </p>
          </nav>
        </aside>

        {mobileOpen ? (
          <div
            className="fixed inset-0 z-20 bg-background/40 backdrop-blur-sm md:hidden"
            onClick={() => setMobileOpen(false)}
          />
        ) : null}

        <main className="min-w-0 flex-1">
          <div className="mx-auto w-full max-w-6xl space-y-6 px-4 py-6 sm:px-6 sm:py-8">
            {children}
          </div>
        </main>
      </div>
    </div>
  )
}
