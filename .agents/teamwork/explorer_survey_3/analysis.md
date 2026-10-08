# Relatório Técnico de Mapeamento: Módulo de Agenda no Plannit (Frontend, Navegação & CRM)

**Autor**: Explorer 3 (Equipe de Investigação Plannit)  
**Data**: 2026-10-08  
**Contexto**: Implementação do Módulo de Agenda no Monólito AdonisJS v7 + Inertia React 19  
**Arquivos de Referência**: `ORIGINAL_REQUEST.md`, `AGENTS.md`, `inertia/layouts/app_layout.tsx`, `inertia/pages/crm/index.tsx`, `app/controllers/leads_controller.ts`

---

## 1. Visão Geral Executiva

O objetivo deste levantamento técnico é mapear minuciosamente a arquitetura frontend, a navegação global, a integração bidirecional com o Kanban de Leads (CRM), os padrões de componentes de UI e a estratégia de testes funcionais necessária para a introdução do **Módulo de Agenda** no Plannit.

A solução atende aos quatro pilares do SRS e do pedido original:
1. **Navegação Global Coerente**: Link direto `/agenda` na sidebar com ícone `Calendar`, suporte a estado ativo e colapso responsivo.
2. **Integração Operacional Bidirecional com o CRM**: Indicador cromático de urgência de compromissos no `LeadCard` do Kanban e gestão completa de agendamentos dentro do `LeadDrawer`, com alimentação automática da linha do tempo após a conclusão.
3. **Catálogo Parametrizável em Configurações (R1)**: Acesso e sincronização cross-tab em tempo real via storage event `plannit_catalogo_updated` e atalho "Configurar ↗" nos modais.
4. **Governança e RBAC na Tela Central (/agenda)**: Alternância entre "Minha Agenda" e "Toda a Equipe" restrita a perfis de gestão (`DIRETORIA` e `GERENTE_COMERCIAL`), com visualização dupla (Grade/Calendário e Lista) e modais para ciclo de vida do compromisso.

---

## 2. Navegação Global e Sidebar (`inertia/layouts/app_layout.tsx`)

### 2.1 Estrutura Atual
O layout principal da aplicação (`inertia/layouts/app_layout.tsx`) renderiza uma barra lateral fixa à esquerda com suporte a colapso desktop (`w-60` vs `w-16`), controlada por `sidebarOpen` persistido em `localStorage.getItem('plannit_sidebar')`.

A navegação é organizada através de um array tipado `navigation: NavGroup[]`:
- `Principal`: Dashboard (`/dashboard`)
- `Comercial`: CRM / Leads (`/crm`), Clientes (`/clientes`), Briefings (`/briefings`), Fila de Projetos (`/fila`), Projetos & Render (`/projetos`), Especificadores (`/especificadores`)
- `Operacional`: Conferência (`#`, disabled), Montagem (`#`, disabled)
- `Gestão`: Colaboradores (`/colaboradores`), Configurações (`/configuracoes`, condicional para gestores)
- `Suporte`: Manual do Usuário (`/manual/index.html`)

### 2.2 Inclusão da Rota `/agenda`
No `ORIGINAL_REQUEST.md`, o requisito R3 exige adicionar o item "Agenda" com o ícone `Calendar` de `lucide-react`.

#### Análise de Localização
- **Opção A (Recomendada - Seção Principal)**: Colocar na seção `Principal`, imediatamente abaixo de `Dashboard`. A Agenda é uma ferramenta de produtividade universal da loja: vendedores agendam visitas e briefings; projetistas agendam medições técnicas e apresentações 3D; conferentes e gerentes acompanham compromissos da equipe. Colocá-la em `Principal` dá o protagonismo operacional necessário.
- **Opção B (Seção Comercial)**: Colocar no topo da seção `Comercial`, logo acima de `CRM / Leads`.

#### Snippet de Implementação no `app_layout.tsx`
1. Importar `Calendar` de `lucide-react`:
```tsx
// inertia/layouts/app_layout.tsx (linhas 3-21)
import {
  LayoutDashboard,
  Calendar, // <-- ADICIONAR
  Users,
  // ...
} from 'lucide-react'
```

2. Adicionar o item ao array de navegação:
```tsx
// inertia/layouts/app_layout.tsx (linhas 107-114)
{
  section: 'Principal',
  items: [
    { label: 'Dashboard', href: '/dashboard', icon: LayoutDashboard, exact: true },
    { label: 'Agenda', href: '/agenda', icon: Calendar }, // <-- NOVO ITEM
  ],
},
```

#### Comportamento de Active State
O cálculo de estado ativo em `app_layout.tsx` (linha 204) é:
```tsx
const isActive = item.exact ? url === item.href : url.startsWith(item.href) && item.href !== '#'
```
Como `exact` não é informado para `Agenda`, qualquer URL iniciada em `/agenda` (como `/agenda?view=lista`, `/agenda?colaboradorId=2` ou `/agenda?data=...`) ativará corretamente a estilização:
`bg-primary-600/20 text-primary-300 border border-primary-500/30`.

#### Modo Recolhido (Collapsed)
Quando a sidebar estiver recolhida (`!sidebarOpen`), o layout automaticamente oculta o texto, centraliza o ícone e exibe o tooltip nativo `title="Agenda"`.

---

## 3. Integração com o CRM / Kanban de Leads (`inertia/pages/crm/index.tsx`)

### 3.1 Badge do Próximo Compromisso no `LeadCard`

#### Requisito R4
No `LeadCard` (Kanban e Lista), exibir badge com o próximo compromisso em aberto (ex.: `📅 24/09 14h — Visita Obra`), com alertas cromáticos de urgência:
- **Azul**: para compromissos agendados para **hoje**.
- **Vermelho**: para compromissos **atrasados** (horário de início já passou e o compromisso ainda está em aberto).
- **Neutro**: para compromissos **futuros** (próximos dias).

#### Extensão da Tipagem `LeadItem`
No arquivo `inertia/pages/crm/index.tsx`:
```tsx
export type ProximoCompromissoLead = {
  id: number
  titulo: string
  dataHoraInicio: string // ISO string UTC
  dataHoraFim: string | null
  local: string | null
  status: 'agendado' | 'reagendado' | 'concluido' | 'cancelado'
  tipo: {
    id: number
    nome: string
    slug: string
    cor: string
  } | null
  responsavel: {
    id: number
    nome: string
  } | null
}

export type LeadItem = {
  // ... campos existentes ...
  proximoCompromisso?: ProximoCompromissoLead | null
  compromissos?: ProximoCompromissoLead[]
}
```

#### Lógica de Urgência Cromática
Podemos implementar uma função pura reutilizável em `inertia/lib/agenda_utils.ts` ou diretamente em `inertia/lib/constants.ts`:
```tsx
import { DateTime } from 'luxon'

export function getUrgenciaCompromisso(dataHoraInicioIso: string): {
  urgencia: 'atrasado' | 'hoje' | 'futuro'
  badgeClass: string
  iconClass: string
  labelFormatado: string
} {
  const dt = DateTime.fromISO(dataHoraInicioIso)
  const agora = DateTime.now()

  // Formato: 24/09 14h ou 24/09 14:30
  const horaFormatada = dt.minute === 0 ? dt.toFormat('HH') + 'h' : dt.toFormat('HH:mm')
  const dataFormatada = dt.toFormat('dd/MM')
  const labelFormatado = `${dataFormatada} ${horaFormatada}`

  if (dt < agora) {
    return {
      urgencia: 'atrasado',
      badgeClass: 'bg-rose-50 text-rose-700 border-rose-200/90',
      iconClass: 'text-rose-600',
      labelFormatado,
    }
  }

  if (dt.hasSame(agora, 'day')) {
    return {
      urgencia: 'hoje',
      badgeClass: 'bg-blue-50 text-blue-700 border-blue-200/90 font-semibold',
      iconClass: 'text-blue-600',
      labelFormatado,
    }
  }

  return {
    urgencia: 'futuro',
    badgeClass: 'bg-stone-50 text-stone-600 border-stone-200/80',
    iconClass: 'text-stone-400',
    labelFormatado,
  }
}
```

#### Renderização no `LeadCard`
Localização no JSX de `LeadCard` (entre os ambientes de interesse e o rodapé):
```tsx
{/* Badge de Próximo Compromisso (R4) */}
{lead.proximoCompromisso && (
  (() => {
    const { urgencia, badgeClass, iconClass, labelFormatado } = getUrgenciaCompromisso(
      lead.proximoCompromisso.dataHoraInicio
    )
    const tipoNome = lead.proximoCompromisso.tipo?.nome || lead.proximoCompromisso.titulo

    return (
      <div
        className={clsx(
          'flex items-center gap-1.5 px-2 py-1 rounded-md border text-[10px] mt-1.5 transition-all truncate',
          badgeClass
        )}
        title={`Compromisso: ${lead.proximoCompromisso.titulo} (${tipoNome})\nData: ${DateTime.fromISO(lead.proximoCompromisso.dataHoraInicio).toFormat('dd/MM/yyyy HH:mm')}\nStatus: ${lead.proximoCompromisso.status}`}
      >
        <Calendar size={11} className={clsx('flex-shrink-0', iconClass)} />
        <span className="font-semibold">{labelFormatado}</span>
        <span className="text-stone-300">·</span>
        <span className="truncate">{tipoNome}</span>
      </div>
    )
  })()
)}
```

---

### 3.2 Seção de Compromissos e Ações no `LeadDrawer`

#### Diagnóstico da Estrutura do `LeadDrawer`
O `LeadDrawer` (`inertia/pages/crm/index.tsx`, linhas 729-1130) é um drawer lateral fixo de 440px de largura com rolagem vertical unificada:
1. **Header do Drawer**: Nome, telefone, status de qualificação e botão de fechar.
2. **Ações Rápidas**: Barra de botões (Qualificar, Iniciar Briefing, Marcar como Perdido).
3. **Informações Cadastrais**: Origem, Cidade, E-mail, Campanha, Motivo de Perda, e Ficha de Qualificação (RN001).
4. **Linha do Tempo (Eventos)**: Interações e Histórico de Mudança de Status do funil.
5. **Formulário de Nova Interação**: Rodapé com tipo (WhatsApp, Ligação, etc.) e texto.

#### Modificações no `LeadDrawer`
Para incorporar os compromissos agendados e a ação de agendamento:

1. **Botão "Agendar Encontro" na Barra de Ações Rápidas**:
```tsx
<button
  type="button"
  onClick={() => onAgendarCompromisso(lead)}
  className="btn btn-secondary btn-sm flex-1 gap-1.5 text-xs text-stone-700 hover:text-stone-900 shadow-2xs"
  title="Agendar novo encontro, visita técnica ou apresentação com este lead"
>
  <Calendar size={13} className="text-primary-600" />
  <span>Agendar Encontro</span>
</button>
```

2. **Seção "Compromissos Agendados" no Corpo do Drawer**:
Inserida entre as Informações Cadastrais e a Linha do Tempo:
- Exibe contador de compromissos abertos.
- Card compacto para cada compromisso:
  - Título e badge com cor do tipo (`tipo.cor`).
  - Data, horário e local.
  - Responsável atribuído.
  - Ações inline: **Concluir** (abre modal para registrar desfecho), **Reagendar** e **Cancelar**.
- Estado vazio com CTA "Nenhum compromisso agendado. Clique em Agendar Encontro".

3. **Eventos de Conclusão na Linha do Tempo**:
Quando um compromisso é concluído via backend (`PATCH /agenda/compromissos/:id/concluir`), ele gera automaticamente um registro em `interacoes_leads` (ou é alimentado em `eventosTimeline`).
No frontend do `LeadDrawer`:
```tsx
const eventosTimeline = [
  ...(lead.interacoes || []).map((i) => ({
    id: `int_${i.id}`,
    type: 'interacao' as const,
    date: new Date(i.createdAt || 0),
    dataInt: i,
  })),
  ...(lead.historicoStatus || []).map((h) => ({
    id: `hist_${h.id}`,
    type: 'historico_status' as const,
    date: new Date(h.createdAt || 0),
    dataHist: h,
  })),
].sort((a, b) => b.date.getTime() - a.date.getTime())
```
Se a interação tiver o tipo `reuniao` ou `visita` gerada pelo fechamento do compromisso, ela já será renderizada com o ícone correspondente na timeline com estilo padronizado!

---

### 3.3 Otimização da Query no Backend (`app/controllers/leads_controller.ts`)

Para evitar consultas N+1 ao carregar os leads do CRM com seus compromissos:

1. **Preload do Relacionamento `compromissos`**:
No `leads_controller.ts`, método `index()`:
```ts
leadsQuery
  .preload('vendedor', (vQuery) => vQuery.select('id', 'nome', 'email'))
  .preload('qualificadoPor', (qQuery) => qQuery.select('id', 'nome', 'email'))
  .preload('arquiteto', (aQuery) => aQuery.select('id', 'nome', 'escritorio'))
  .preload('compromissos', (cQuery) => {
    cQuery
      .preload('tipo')
      .preload('responsavel', (rQuery) => rQuery.select('id', 'nome'))
      .orderBy('dataHoraInicio', 'asc')
  })
  .preload('interacoes', (iQuery) => {
    iQuery.preload('responsavel', (rQuery) => rQuery.select('id', 'nome')).orderBy('createdAt', 'desc')
  })
  .preload('historicoStatus', (hQuery) => {
    hQuery.preload('alteradoPor', (rQuery) => rQuery.select('id', 'nome')).orderBy('createdAt', 'desc')
  })
```

2. **Mapeamento do `proximoCompromisso` e Lista de `compromissos`**:
No loop de formatação de cada lead:
```ts
// Filtra apenas compromissos pendentes/agendados
const compromissosAbertos = (lead.compromissos || []).filter(
  (c) => c.status === 'agendado' || c.status === 'reagendado'
)
// Como a query já vem ordenada por dataHoraInicio ASC, o primeiro é o mais prioritário/próximo
const proximo = compromissosAbertos[0] || null

const proximoCompromisso = proximo ? {
  id: proximo.id,
  titulo: proximo.titulo,
  dataHoraInicio: proximo.dataHoraInicio.toISO(),
  dataHoraFim: proximo.dataHoraFim ? proximo.dataHoraFim.toISO() : null,
  local: proximo.local,
  status: proximo.status,
  tipo: proximo.tipo ? {
    id: proximo.tipo.id,
    nome: proximo.tipo.nome,
    slug: proximo.tipo.slug,
    cor: proximo.tipo.cor,
  } : null,
  responsavel: proximo.responsavel ? {
    id: proximo.responsavel.id,
    nome: proximo.responsavel.nome,
  } : null,
} : null
```

3. **Carga do Catálogo de Tipos para o Modal de Agendamento do CRM**:
Passar `tiposCompromissoCatalogo` diretamente nas props renderizadas para `crm/index`:
```ts
const tiposCompromissoCatalogo = await TipoCompromissoCatalogo.query()
  .where('isActive', true)
  .orderBy('ordem', 'asc')
  .orderBy('nome', 'asc')

return inertia.render('crm/index', {
  // ... props existentes ...
  tiposCompromissoCatalogo: tiposCompromissoCatalogo.map((t) => ({
    id: t.id,
    nome: t.nome,
    slug: t.slug,
    cor: t.cor,
  })),
})
```

---

## 4. Componentes Existentes de UI & Design System

### 4.1 Autocomplete: `BuscaAutocomplete.tsx`
Localizado em `inertia/components/ui/BuscaAutocomplete.tsx`:
- **Recursos**:
  - Busca normalizada sem diferenciar maiúsculas nem acentos (`normalizar(texto)`).
  - Suporte completo a teclado (`ArrowDown`, `ArrowUp`, `Enter`, `Escape`).
  - Limpeza rápida com botão `X`.
  - Hook opcional `acaoCriar` para cadastros rápidos no fluxo.
  - Visualização de rótulo e descrição em duas linhas.

#### Componente Dedicado: `LeadAutocomplete.tsx`
Para selecionar leads no modal central de agendamento:
```tsx
import BuscaAutocomplete from '../ui/BuscaAutocomplete'

export type LeadOpcao = {
  id: number
  nome: string
  telefone?: string | null
  cidade?: string | null
}

interface LeadAutocompleteProps {
  leads: LeadOpcao[]
  value: string // leadId como string
  onChange: (leadId: string) => void
  placeholder?: string
}

export default function LeadAutocomplete({
  leads,
  value,
  onChange,
  placeholder = 'Buscar por nome, telefone ou cidade...',
}: LeadAutocompleteProps) {
  return (
    <BuscaAutocomplete
      opcoes={leads.map((l) => ({
        value: String(l.id),
        label: l.nome,
        descricao: l.telefone ? `${l.telefone}${l.cidade ? ` • ${l.cidade}` : ''}` : l.cidade || null,
      }))}
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      tituloLimpar="Remover lead vinculado"
      textoVazio={(busca) =>
        busca ? `Nenhum lead encontrado para "${busca}".` : 'Nenhum lead cadastrado.'
      }
    />
  )
}
```

### 4.2 Atalho "Configurar ↗" e Sincronização Cross-Tab em Tempo Real (R1)
Seguindo o padrão de `QualificarLeadModal.tsx` e `NovoLeadModal.tsx`:
- **Atalho "Configurar ↗"**:
  - Exibido nos modais de agendamento apenas se o usuário tiver perfil gestor (`canManageConfig = user?.isSuperuser || user?.perfil === 'diretoria' || user?.perfil === 'gerente_comercial'`).
  - Renderizado como:
    ```tsx
    <a
      href="/configuracoes?tab=tipos_compromisso"
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex items-center gap-1 text-[11px] font-semibold text-primary-700 hover:text-primary-800 hover:underline bg-primary-50/80 px-2 py-0.5 rounded-md border border-primary-200/60"
      title="Abrir painel de tipos de compromisso em uma nova aba"
    >
      <span>Configurar</span>
      <ExternalLink size={10} />
    </a>
    ```
- **Sincronização Cross-tab**:
  - Escuta `storage` para a chave `plannit_catalogo_updated`:
    ```tsx
    useEffect(() => {
      const handleSync = () => {
        router.reload({ only: ['tiposCompromissoCatalogo'] })
      }
      const handleStorage = (e: StorageEvent) => {
        if (e.key === 'plannit_catalogo_updated') {
          handleSync()
        }
      }
      window.addEventListener('focus', handleSync)
      window.addEventListener('storage', handleStorage)
      return () => {
        window.removeEventListener('focus', handleSync)
        window.removeEventListener('storage', handleStorage)
      }
    }, [])
    ```
  - Botão manual com ícone `RotateCw` animado durante `isRefreshing`.

---

## 5. Estrutura da Nova Tela de Agenda Central (`inertia/pages/agenda/index.tsx`) (R3)

### 5.1 Arquitetura Modular Proposta
```
inertia/pages/agenda/
├── index.tsx                         # Página principal com header, controles e alternador de views
├── types.ts                          # Interfaces TypeScript e enums do domínio de Agenda
└── components/
    ├── NovoCompromissoModal.tsx       # Modal de agendamento (com autocomplete, tipos e atalho)
    ├── ConcluirCompromissoModal.tsx   # Modal para registrar desfecho e finalizar
    ├── ReagendarModal.tsx             # Modal para alterar data/hora e justificativa
    ├── CompromissoCard.tsx            # Card rico do compromisso (status, tipo, ações)
    ├── AgendaCalendarGrid.tsx         # Visão Grade / Calendário agrupado
    ├── AgendaListView.tsx             # Visão Tabela / Lista cronológica
    └── AgendaFiltrosBar.tsx           # Barra de filtros, busca e alternadores
```

### 5.2 Cabeçalho e Controles Operacionais
- **Identidade Visual**:
  - Título: "Agenda Operacional & Compromissos"
  - Subtítulo: "Gestão integrada de reuniões, visitas técnicas, medições e apresentações de projetos"
- **Controles de Governança (RBAC)**:
  - Alternador para Gestores: Componente segmented-control:
    - `Minha Agenda` (filtra apenas compromissos onde `responsavel_id = user.id`)
    - `Toda a Equipe` (exibe todos os compromissos da loja)
    - *Visibilidade*: Restrito a `isGestor` (`DIRETORIA` e `GERENTE_COMERCIAL`). Vendedores e projetistas não visualizam o botão de alternância.
  - Filtro Dropdown de Colaborador: Quando em modo "Toda a Equipe", permite selecionar um colaborador específico ou "Todos os Colaboradores".
- **Alternador de Visualização**:
  - Botão com ícones `Calendar` ("Grade") e `List` ("Lista"), persistindo o estado local ou via query param `?view=grade|lista`.
- **Navegação Temporal**:
  - Controles: `[ < Anterior ]`, `[ Hoje ]`, `[ Próximo > ]`.
  - Exibição do intervalo selecionado (ex.: "Outubro de 2026" ou "Semana de 05 a 11 de Outubro").
- **Ação Principal**:
  - Botão `btn-primary` com `Plus` e `Calendar`: `"+ Novo Compromisso"`, disparando `NovoCompromissoModal`.

### 5.3 Cards de Métricas / KPIs
Seguindo o padrão de `crm/index.tsx` e `projetos/index.tsx`:
- **Total no Período**: Número total de encontros programados.
- **Hoje**: Compromissos com horário no dia atual (com destaque azul).
- **Pendentes / Agendados**: Aguardando realização.
- **Concluídos**: Finalizados com desfecho registrado.
- **Atrasados / Requer Atenção**: Compromissos com horário ultrapassado sem conclusão registrada.

### 5.4 Estilização dos Cards de Compromisso (`CompromissoCard`)
Cada card exibe:
1. **Topo**:
   - Badge com a cor customizada do catálogo (`tipo.cor`, ex: tag com background suave e borda combinando).
   - Badge de Status:
     - `agendado`: `.badge-ativo` (verde/azul suave)
     - `reagendado`: `.badge-alerta` (âmbar)
     - `concluido`: `.badge-neutro` (pedra/cinza com check)
     - `cancelado`: `.badge-critico` (vermelho com risco)
2. **Horário e Local**:
   - `Clock`: `14:00 - 15:30` (duração calculada).
   - `MapPin`: Local físico (ex: "Showroom Loja", "Rua das Flores, 123 - Apto 42", "Reunião Remota").
3. **Vínculos Operacionais (Links Rápidos)**:
   - Se vinculado a Lead: link com `ExternalLink` para `/crm` (ou abre o drawer do lead).
   - Se vinculado a Projeto: link com `FolderKanban` para `/projetos/${projetoId}`.
   - Se vinculado a Cliente: link com `UserCheck` para `/clientes/${clienteId}`.
4. **Responsável**:
   - Avatar com iniciais (`responsavel.nome`) e identificação do perfil.
5. **Ações Rápidas**:
   - Botão `Concluir`: abre `ConcluirCompromissoModal` (campo de desfecho obrigatório).
   - Botão `Reagendar`: abre `ReagendarModal`.
   - Botão `Cancelar`: confirmação com motivo.

### 5.5 Modal Central de Novo Compromisso (`NovoCompromissoModal`)
Campos do formulário:
1. **Título**: Ex.: "Reunião de Alinhamento de Briefing - Cozinha e Gourmet".
2. **Tipo de Compromisso**: Dropdown/Seletor com as opções do catálogo `tipos_compromisso_catalogo`, atalho "Configurar ↗" para gestores e botão de sincronização `RotateCw`.
3. **Data e Horários**:
   - `data_hora_inicio`: Data e hora de início (input datetime-local).
   - `data_hora_fim`: Data e hora de término (input datetime-local).
4. **Local**: Input de texto livre com sugestões ("Showroom Líder", "Obra do Cliente", "Google Meet").
5. **Responsável**:
   - Se gestor: select com todos os colaboradores ativos.
   - Se vendedor/projetista: fixado no próprio usuário autenticado.
6. **Vínculo Opcional**:
   - Autocomplete para Lead (`LeadAutocomplete`).
   - Autocomplete ou seletor opcional para Projeto e Cliente.
7. **Observações**: Textarea para pauta ou instruções preparatórias.

---

## 6. Mapeamento de Testes Funcionais Japa (`tests/functional/agenda.spec.ts`)

### 6.1 Padrão Observado nos Testes do Plannit
Os testes funcionais no monólito (`tests/functional/configuracoes_and_qualificacao.spec.ts`, `leads_campanha.spec.ts`) seguem regras estruturais claras:
1. **Runner e Framework**: `@japa/runner` com suítes em `tests/functional/`.
2. **Ambiente Compartilhado**: Os testes rodam contra o **mesmo banco PostgreSQL de desenvolvimento** (não há truncate automático em `bootstrap.ts`). Portanto, **todo teste deve fazer limpeza dos registros criados** via `group.each.teardown` ou garantir identificadores únicos.
3. **Autenticação**: `client.get(...).loginAs(user)` ou `client.post(...).loginAs(user)`.
4. **CSRF & Formato JSON**: `.withCsrfToken()`, `.header('accept', 'application/json')`, `.json({...})`.

### 6.2 Casos de Teste Essenciais para `tests/functional/agenda.spec.ts`

| Caso de Teste | Atores / Perfis | Cenário / Ação | Asserção Esperada |
|---|---|---|---|
| **Auth Shield** | Anônimo | `GET /agenda` | Redireciona para `/login` (302) |
| **RBAC Vendedor** | Vendedor A, Vendedor B | `GET /agenda` com Vendedor A | Vê apenas compromissos onde `responsavel_id = Vendedor A.id` (status 200, isolamento estrito) |
| **RBAC Gestão** | Gerente Comercial / Diretoria | `GET /agenda` com Gerente | Consegue visualizar compromissos de toda a equipe e filtrar por `colaboradorId` (status 200) |
| **CRUD Criação** | Vendedor | `POST /agenda/compromissos` com payload válido | Status 201, grava no banco com `responsavel_id = vendedor.id` |
| **Auto-atribuição** | Vendedor | `POST /agenda/compromissos` tentando atribuir a outro vendedor | Backend sobrescreve/rejeita e força o próprio usuário |
| **Reagendamento** | Vendedor / Gestor | `PATCH /agenda/compromissos/:id/reagendar` | Status 200, status muda para `reagendado` e nova data é salva |
| **Cancelamento** | Vendedor / Gestor | `PATCH /agenda/compromissos/:id/cancelar` | Status 200, status muda para `cancelado` |
| **Conclusão & Timeline** | Vendedor / Gestor | `PATCH /agenda/compromissos/:id/concluir` com `desfecho` | Status 200, status muda para `concluido`, desfecho gravado, e gera registro em `interacoes_leads` |
| **Catálogo de Tipos** | Vendedor vs Diretoria | `POST /configuracoes/tipos-compromisso` | Vendedor recebe 403; Diretoria recebe 201 com slug automático |

---

## 7. Matriz de Dependências Técnicas e Riscos

1. **Catálogo de Tipos de Compromisso (R1)**:
   - Deve ser migrado e semeado primeiro (`tipos_compromisso_catalogo`).
   - O seed deve ser idempotente para garantir consistência em novas execuções.
2. **Model e Migração de Compromissos (R2)**:
   - Tabela `compromissos_agenda` com chaves estrangeiras opcionais para `leads`, `clientes`, `projetos`, `users` e `tipos_compromisso_catalogo`.
3. **Consistência do Timeline do Lead (R4)**:
   - Ao concluir um compromisso vinculado a um `lead_id`, criar transacionalmente a `InteracaoLead` com `tipo = 'reuniao'` (ou novo tipo se houver) e resumo formatado com o título e o desfecho.
4. **Sincronização Cross-Tab**:
   - Garantir que o storage event `plannit_catalogo_updated` seja emitido no `localStorage` sempre que um tipo for criado, editado ou desativado em `/configuracoes`.
