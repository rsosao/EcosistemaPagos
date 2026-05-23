import { useEffect, useState, type ReactNode } from "react";
import { useTheme } from "next-themes";
import {
  BookOpenIcon,
  CreditCardIcon,
  DatabaseIcon,
  FileTextIcon,
  LandmarkIcon,
  LayoutDashboardIcon,
  MoonIcon,
  PhoneIcon,
  SunIcon,
  UsersIcon,
  WalletIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";

export type ViewId =
  | "dashboard"
  | "clientes"
  | "generar"
  | "pagar"
  | "tesoreria"
  | "reportes"
  | "seed";

export type NavItem = {
  id: ViewId;
  label: string;
  icon: typeof LayoutDashboardIcon;
  description: string;
};

export const NAV_ITEMS: NavItem[] = [
  {
    id: "dashboard",
    label: "Dashboard",
    icon: LayoutDashboardIcon,
    description: "Resumen general",
  },
  {
    id: "clientes",
    label: "Clientes",
    icon: UsersIcon,
    description: "Alta y estado de cuenta",
  },
  {
    id: "generar",
    label: "Generar cuotas",
    icon: FileTextIcon,
    description: "Cuotas mensuales y manuales",
  },
  {
    id: "pagar",
    label: "Pagar",
    icon: CreditCardIcon,
    description: "Efectivo · Tarjeta",
  },
  {
    id: "tesoreria",
    label: "Tesorería",
    icon: LandmarkIcon,
    description: "Saldo en el banco",
  },
  {
    id: "reportes",
    label: "Reportes",
    icon: WalletIcon,
    description: "Pendientes, pagados y comprobantes",
  },
  {
    id: "seed",
    label: "Seed",
    icon: DatabaseIcon,
    description: "Datos semilla",
  },
];

function ThemeToggle() {
  const { theme, setTheme, resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  const current = mounted ? (theme === "system" ? resolvedTheme : theme) : "light";
  const next = current === "dark" ? "light" : "dark";

  return (
    <Button
      variant="ghost"
      size="icon-sm"
      aria-label="Cambiar tema"
      onClick={() => setTheme(next)}
    >
      {current === "dark" ? (
        <SunIcon className="size-4" />
      ) : (
        <MoonIcon className="size-4" />
      )}
    </Button>
  );
}

type AppShellProps = {
  view: ViewId;
  onChange: (view: ViewId) => void;
  children: ReactNode;
};

export function AppShell({ view, onChange, children }: AppShellProps) {
  return (
    <div className="min-h-svh bg-background text-foreground">
      <div className="flex min-h-svh flex-col lg:flex-row">
        <aside className="border-b border-border bg-card/40 px-4 py-5 backdrop-blur lg:w-72 lg:border-r lg:border-b-0 lg:py-7">
          <div className="flex items-center gap-3">
            <div className="grid size-10 place-items-center rounded-xl bg-violet-600 text-white shadow-sm">
              <PhoneIcon className="size-5" />
            </div>
            <div className="space-y-0.5">
              <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                Ecosistema de Pagos
              </p>
              <p className="text-base font-semibold leading-none">
                Telefonía
              </p>
            </div>
          </div>

          <Separator className="my-5" />

          <nav className="grid gap-1">
            {NAV_ITEMS.map((item) => {
              const Icon = item.icon;
              const active = view === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => onChange(item.id)}
                  className={cn(
                    "group flex w-full items-center gap-3 rounded-lg border border-transparent px-3 py-2 text-left text-sm transition-colors",
                    "hover:bg-muted hover:text-foreground",
                    active
                      ? "border-violet-200 bg-violet-50 text-violet-700 dark:border-violet-500/30 dark:bg-violet-500/10 dark:text-violet-200"
                      : "text-muted-foreground",
                  )}
                >
                  <Icon
                    className={cn(
                      "size-4 shrink-0",
                      active ? "text-violet-600 dark:text-violet-300" : "",
                    )}
                  />
                  <div className="flex flex-col">
                    <span className="font-medium leading-tight">
                      {item.label}
                    </span>
                    <span className="text-xs text-muted-foreground/80">
                      {item.description}
                    </span>
                  </div>
                </button>
              );
            })}
          </nav>
        </aside>

        <main className="flex-1">
          <header className="sticky top-0 z-10 flex items-center justify-between gap-3 border-b border-border bg-background/80 px-6 py-3 backdrop-blur">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <span className="font-medium text-foreground">TelefoniaApi</span>
              <span className="text-muted-foreground/60">·</span>
              <span>localhost:5003</span>
            </div>
            <div className="flex items-center gap-2">
              <Button asChild variant="outline" size="sm">
                <a href="/scalar/v1" target="_blank" rel="noreferrer">
                  <BookOpenIcon className="size-3.5" />
                  API Docs
                </a>
              </Button>
              <ThemeToggle />
            </div>
          </header>
          <div className="mx-auto w-full max-w-6xl px-6 py-8">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
