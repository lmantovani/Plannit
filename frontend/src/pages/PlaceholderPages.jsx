import { Construction } from 'lucide-react'

export function PlaceholderPage({ title, fase }) {
  return (
    <div className="flex flex-col items-center justify-center h-64 gap-4 text-center p-8">
      <div className="w-14 h-14 rounded-2xl bg-stone-100 flex items-center justify-center">
        <Construction size={24} className="text-stone-400" />
      </div>
      <div>
        <h2 className="font-display text-stone-700 font-semibold text-lg mb-1">{title}</h2>
        <p className="text-stone-400 text-sm max-w-sm">
          Este módulo faz parte da <strong>{fase}</strong>. Em desenvolvimento.
        </p>
      </div>
      <div className="px-3 py-1 rounded-full bg-primary-50 text-primary-600 text-xs font-medium border border-primary-200">
        Previsto para {fase}
      </div>
    </div>
  )
}

export const ProjetosPage = () => <PlaceholderPage title="Fila de Projetos" fase="MVP — Fase 1" />
export const BriefingPage = () => <PlaceholderPage title="Briefings" fase="MVP — Fase 1" />
export const ConferenciaPage = () => <PlaceholderPage title="Conferência Técnica" fase="Fase 2" />
export const LogisticaPage = () => <PlaceholderPage title="Logística e Entrega" fase="Fase 2" />
export const MontagemPage = () => <PlaceholderPage title="Montagem" fase="Fase 2" />
export const FinanceiroPage = () => <PlaceholderPage title="Financeiro" fase="MVP — Fase 1" />
export const PosVendaPage = () => <PlaceholderPage title="Pós-Venda e AT" fase="Fase 2" />
export const RelatoriosPage = () => <PlaceholderPage title="Relatórios" fase="Fase 4" />
export const ConfiguracoesPage = () => <PlaceholderPage title="Configurações" fase="MVP — Fase 1" />
