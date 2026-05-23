import { Navigate, Route, Routes } from 'react-router-dom'
import { AppShell } from '@/components/AppShell'
import { DashboardView } from '@/views/DashboardView'
import { ClientesView } from '@/views/ClientesView'
import { GenerarCuotasView } from '@/views/GenerarCuotasView'
import { PagarView } from '@/views/PagarView'
import { TesoreriaView } from '@/views/TesoreriaView'
import { ReportesView } from '@/views/ReportesView'
import { SeedView } from '@/views/SeedView'

export default function App() {
  return (
    <Routes>
      <Route element={<AppShell />}>
        <Route index element={<DashboardView />} />
        <Route path="clientes" element={<ClientesView />} />
        <Route path="cuotas" element={<GenerarCuotasView />} />
        <Route path="pagar" element={<PagarView />} />
        <Route path="tesoreria" element={<TesoreriaView />} />
        <Route path="reportes" element={<ReportesView />} />
        <Route path="seed" element={<SeedView />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  )
}
