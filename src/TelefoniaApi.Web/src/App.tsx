import { useEffect, useState } from "react";
import { AppShell, type ViewId, NAV_ITEMS } from "@/components/AppShell";
import { DashboardView } from "@/views/DashboardView";
import { ClientesView } from "@/views/ClientesView";
import { GenerarCuotasView } from "@/views/GenerarCuotasView";
import { PagarView } from "@/views/PagarView";
import { TesoreriaView } from "@/views/TesoreriaView";
import { ReportesView } from "@/views/ReportesView";
import { SeedView } from "@/views/SeedView";

const VALID_VIEWS: ViewId[] = NAV_ITEMS.map((n) => n.id);

function readView(): ViewId {
  const hash = window.location.hash.replace("#", "") as ViewId;
  return VALID_VIEWS.includes(hash) ? hash : "dashboard";
}

export default function App() {
  const [view, setView] = useState<ViewId>(readView);

  useEffect(() => {
    const handler = () => setView(readView());
    window.addEventListener("hashchange", handler);
    return () => window.removeEventListener("hashchange", handler);
  }, []);

  const navigate = (next: ViewId) => {
    window.location.hash = next;
    setView(next);
  };

  return (
    <AppShell view={view} onChange={navigate}>
      {view === "dashboard" && <DashboardView onNavigate={navigate} />}
      {view === "clientes" && <ClientesView />}
      {view === "generar" && <GenerarCuotasView />}
      {view === "pagar" && <PagarView />}
      {view === "tesoreria" && <TesoreriaView />}
      {view === "reportes" && <ReportesView />}
      {view === "seed" && <SeedView />}
    </AppShell>
  );
}
