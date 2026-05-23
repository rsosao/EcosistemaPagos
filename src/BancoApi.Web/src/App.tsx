import { useState } from "react"

import { AppShell, type ViewId } from "@/components/AppShell"
import { ThemeProvider } from "@/components/ThemeProvider"
import { Toaster } from "@/components/ui/sonner"
import { CajeroView } from "@/views/CajeroView"
import { ClientesView } from "@/views/ClientesView"
import { CuentasView } from "@/views/CuentasView"
import { DashboardView } from "@/views/DashboardView"
import { PagarServicioView } from "@/views/PagarServicioView"
import { PosView } from "@/views/PosView"
import { ReportesView } from "@/views/ReportesView"
import { SeedView } from "@/views/SeedView"
import { TarjetasView } from "@/views/TarjetasView"

function App() {
  const [currentView, setCurrentView] = useState<ViewId>("dashboard")

  return (
    <ThemeProvider>
      <AppShell currentView={currentView} onChangeView={setCurrentView}>
        {currentView === "dashboard" ? (
          <DashboardView onNavigate={setCurrentView} />
        ) : null}
        {currentView === "clientes" ? <ClientesView /> : null}
        {currentView === "cuentas" ? <CuentasView /> : null}
        {currentView === "tarjetas" ? <TarjetasView /> : null}
        {currentView === "pos" ? <PosView /> : null}
        {currentView === "cajero" ? <CajeroView /> : null}
        {currentView === "pagar-servicio" ? <PagarServicioView /> : null}
        {currentView === "reportes" ? <ReportesView /> : null}
        {currentView === "seed" ? <SeedView /> : null}
      </AppShell>
      <Toaster richColors closeButton position="top-right" />
    </ThemeProvider>
  )
}

export default App
