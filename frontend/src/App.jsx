import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import AppLayout from './components/layout/AppLayout'
import AuthGuard from './components/layout/AuthGuard'
import LoginPage from './pages/auth/LoginPage'
import DashboardPage from './pages/dashboard/DashboardPage'
import CRMPage from './pages/crm/CRMPage'
import {
  ProjetosPage, ConferenciaPage, LogisticaPage,
  MontagemPage, FinanceiroPage, PosVendaPage, RelatoriosPage, ConfiguracoesPage,
} from './pages/PlaceholderPages'
import BriefingPage from './pages/briefing/BriefingPage'

const queryClient = new QueryClient({
  defaultOptions: { queries: { staleTime: 30000, retry: 1 } },
})

const ROUTE_TITLES = {
  '/dashboard':     { title: 'Dashboard',          subtitle: 'Visão geral da operação' },
  '/crm':           { title: 'CRM & Leads',         subtitle: 'Pipeline comercial' },
  '/projetos':      { title: 'Projetos',            subtitle: 'Fila e desenvolvimento' },
  '/briefing':      { title: 'Briefings',           subtitle: 'Formulários e score' },
  '/conferencia':   { title: 'Conferência',         subtitle: 'Medições e adequações' },
  '/logistica':     { title: 'Logística',           subtitle: 'Pedidos e entregas' },
  '/montagem':      { title: 'Montagem',            subtitle: 'Agendamento e checklist' },
  '/financeiro':    { title: 'Financeiro',          subtitle: 'Parcelas e aprovações' },
  '/pos-venda':     { title: 'Pós-Venda',           subtitle: 'AT e relacionamento' },
  '/relatorios':    { title: 'Relatórios',          subtitle: 'KPIs e indicadores' },
  '/configuracoes': { title: 'Configurações',       subtitle: 'Equipe e sistema' },
}

function ProtectedLayout() {
  const path = window.location.pathname
  const meta = ROUTE_TITLES[path] || { title: 'Líder Móveis', subtitle: '' }
  return (
    <AuthGuard>
      <AppLayout title={meta.title} subtitle={meta.subtitle} />
    </AuthGuard>
  )
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route element={<ProtectedLayout />}>
            <Route path="/dashboard"     element={<DashboardPage />} />
            <Route path="/crm"           element={<CRMPage />} />
            <Route path="/projetos"      element={<ProjetosPage />} />
            <Route path="/briefing"      element={<BriefingPage />} />
            <Route path="/conferencia"   element={<ConferenciaPage />} />
            <Route path="/logistica"     element={<LogisticaPage />} />
            <Route path="/montagem"      element={<MontagemPage />} />
            <Route path="/financeiro"    element={<FinanceiroPage />} />
            <Route path="/pos-venda"     element={<PosVendaPage />} />
            <Route path="/relatorios"    element={<RelatoriosPage />} />
            <Route path="/configuracoes" element={<ConfiguracoesPage />} />
          </Route>
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </BrowserRouter>
    </QueryClientProvider>
  )
}
