# Plano de Ação - Milestone M4 (Frontend Especificadores)

**Objetivo:** Implementar o módulo completo de Especificadores (arquitetos, designers de interiores, decoradores, engenheiros) no ERP/CRM Plannit utilizando a stack Inertia.js v2 e React 19 no AdonisJS v7.

---

## 1. Atualização de Navegação e Constantes Globais
- **Layout (`inertia/layouts/app_layout.tsx`)**:
  - Importar ícone `Compass` de `lucide-react`.
  - Adicionar o item no grupo Comercial:
    ```tsx
    { label: 'Especificadores', href: '/especificadores', icon: Compass }
    ```
- **Dashboard (`inertia/pages/dashboard.tsx`)**:
  - Atualizar card de Especificadores: `status: 'Operacional'`, `active: true`, `href: '/especificadores'`, `badge: 'R4'`.
- **Constantes (`inertia/lib/constants.ts`)**:
  - Tipos de especificador (`arquiteto`, `designer_interiores`, `decorador`, `engenheiro`, `corretor`, `outro`) com labels e cores.
  - Status de carteira (`ativo`, `em_prospeccao`, `inativo`) com labels, bg, border e text.
  - Níveis de parceria (`parceiro`, `premium`, `vip`).
  - 7 Segmentos comportamentais (`inativo`, `novo_promissor`, `em_risco`, `campeao`, `parceiro_fiel`, `em_ascensao`, `ocasional`) com títulos descritivos e paletas.
  - 5 Flags ativas (`top_indicador`, `em_risco_de_perda`, `alto_potencial`, `indicacao_alto_valor`, `especificador_esfriando`) com rótulos e estilos.
  - Tipos de interação com especificadores (`ligacao`, `whatsapp`, `email`, `visita_escritorio`, `visita_loja`, `reuniao`, `evento`, `viagem`, `envio_brinde`).
  - Níveis de risco de concorrência (`baixo`, `medio`, `alto`).

---

## 2. Criação dos Componentes em `inertia/pages/especificadores/components/`
- **`ScoreBar.tsx`**:
  - Barra de progresso visual com suporte a cores temáticas (gradiente ou warm-gold/verde/âmbar), rótulo, valor numérico `X/100` e suporte opcional a pontuação mínima.
- **`MetasVisitasModal.tsx`**:
  - Modal para gerentes e diretoria configurarem metas mensais de visitas por vendedor.
  - Submissão via `router.put('/especificadores/metas-visitas')`.
- **`NovoEspecificadorModal.tsx`**:
  - Formulário modal com campos: nome, escritório, endereço, telefone, email, nível de parceria, tipo, especialidade, consultor dono e status de carteira.
  - Submissão via `router.post('/especificadores')`.
- **`EditarEspecificadorModal.tsx`**:
  - Formulário modal para edição rápida dos dados cadastrais do especificador.
  - Submissão via `router.patch('/especificadores/:id')`.
- **`ReatribuirDonoModal.tsx`**:
  - Modal de transferência de consultor dono com justificativa obrigatória (RN017).
  - Submissão via `router.patch('/especificadores/:id/dono')`.
- **`PerfilTab.tsx`**:
  - Dados cadastrais formatados com botão de edição.
  - Timeline de interações com formulário rápido (tipo de contato, lead vinculado opcional, resumo e submissão).
  - Histórico auditável de consultores donos (consultor anterior, novo consultor, autor, data e motivo).
  - Botão de desativação lógica (soft delete via `router.delete('/especificadores/:id')`).
- **`ScoreTab.tsx`**:
  - Apresentação da nota do Score Geral (0-100), badge do segmento comportamental (7 segmentos), chips das flags ativas (5 flags).
  - Barras comparativas de RFV, Potencial e Lealdade.
  - Breakdown estatístico (projetos ativos, leads ativos, dias sem projeto, meses de parceria, valor total).
  - Painel de análise de concorrência com nível de risco derivado das estimativas.
  - *Guardrail inegociável:* apenas exibe o score analítico entregue pelo backend.
- **`DecisoresConcorrentesTab.tsx`**:
  - Lista de decisores do escritório com destaque visual para o "Decisor Principal" (estrela/badge) e ações de adicionar/remover.
  - Tabela de concorrentes monitorados com taxa de fechamento estimada e ações de adicionar/remover.
- **`EspecificadoresKpiPanel.tsx`**:
  - 5 cartões de KPIs da carteira: Especificadores Ativos, % Venda com Especificador (mês), % Venda com Especificador (ano), Atendimentos no Mês, Visitas ao Escritório.
  - Barra de progresso da meta individual de visitas do consultor logado.
  - Botão de atalho para configuração de metas (visível para gestores).
- **`EspecificadorDrawer.tsx`**:
  - Gaveta lateral retrátil (slide-over à direita) com cabeçalho (avatar/iniciais, nome, escritório, badge de status, botão de tela cheia e fechar).
  - Alternância rápida entre as 3 abas (`perfil`, `score`, `contatos`).

---

## 3. Páginas Principais
- **`inertia/pages/especificadores/index.tsx`**:
  - Layout com `<AppLayout title="Especificadores & Arquitetos" ...>`.
  - Cabeçalho com título, subtítulo e botão "Novo Especificador".
  - Painel de KPIs superiores e meta individual de visitas.
  - Barra de busca textual (`q`) e filtros combinados (Tipo, Status da Carteira, Consultor Dono).
  - Tabela responsiva de alto padrão com colunas:
    - Especificador (nome, escritório, tipo)
    - Contato (telefone, email)
    - Consultor Dono
    - Segmento & Score Geral (badge com cor correspondente e nota)
    - Flags Ativas
    - Status da Carteira
    - Ações (abrir drawer, abrir página dedicada, editar, reatribuir dono, desativar)
  - Integração com Drawer e Modais.
- **`inertia/pages/especificadores/show.tsx`**:
  - Página dedicada em tela cheia acessível via `/especificadores/:id`.
  - Cabeçalho com botão "Voltar para Especificadores", status, ações rápidas (editar, reatribuir dono, desativar).
  - As 3 abas integradas ocupando o layout completo com excelente aproveitamento de espaço.

---

## 4. Validação Rigorosa
- Execução de `npm run typecheck` (deve passar com 0 erros).
- Execução de `npm run build` (empacotamento Vite com sucesso).
- Validação com os scripts de teste HTTP e pontuação existentes.
