import { useEffect, useState } from "react"

import { AppShell, type ViewKey } from "@/components/AppShell"
import { Toaster } from "@/components/ui/sonner"
import { ClientesView } from "@/views/ClientesView"
import { DashboardView } from "@/views/DashboardView"
import { GenerarCuotasView } from "@/views/GenerarCuotasView"
import { PagarView } from "@/views/PagarView"
import { ReportesView } from "@/views/ReportesView"
import { SeedView } from "@/views/SeedView"
import { TesoreriaView } from "@/views/TesoreriaView"

const HASH_TO_VIEW: Record<string, ViewKey> = {
  "#dashboard": "dashboard",
  "#clientes": "clientes",
  "#cuotas": "cuotas",
  "#pagar": "pagar",
  "#tesoreria": "tesoreria",
  "#reportes": "reportes",
  "#seed": "seed",
}

const VIEW_TO_HASH: Record<ViewKey, string> = {
  dashboard: "#dashboard",
  clientes: "#clientes",
  cuotas: "#cuotas",
  pagar: "#pagar",
  tesoreria: "#tesoreria",
  reportes: "#reportes",
  seed: "#seed",
}

function readHash(): ViewKey {
  if (typeof window === "undefined") return "dashboard"
  return HASH_TO_VIEW[window.location.hash] ?? "dashboard"
}

export default function App() {
  const [view, setView] = useState<ViewKey>(readHash)

  useEffect(() => {
    const onHashChange = () => setView(readHash())
    window.addEventListener("hashchange", onHashChange)
    return () => window.removeEventListener("hashchange", onHashChange)
  }, [])

  function changeView(next: ViewKey) {
    if (window.location.hash !== VIEW_TO_HASH[next]) {
      window.location.hash = VIEW_TO_HASH[next]
    }
    setView(next)
  }

  return (
    <>
      <AppShell view={view} onChangeView={changeView}>
        {view === "dashboard" && <DashboardView onNavigate={changeView} />}
        {view === "clientes" && <ClientesView />}
        {view === "cuotas" && <GenerarCuotasView />}
        {view === "pagar" && <PagarView />}
        {view === "tesoreria" && <TesoreriaView />}
        {view === "reportes" && <ReportesView />}
        {view === "seed" && <SeedView />}
      </AppShell>
      <Toaster />
    </>
  )
}
