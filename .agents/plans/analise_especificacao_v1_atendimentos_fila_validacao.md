# Análise de Aderência, Lacunas e Incongruências
## Especificação v1: Lançamento de Atendimentos, Fila da Vez e Validação de Vendas (Thiago Ribeiro — Nov/2026)

> **Data da Análise:** 05 de Novembro de 2026  
> **Objetivo:** Confrontar a especificação proposta pelo Diretor Comercial (Thiago Ribeiro) com o código-fonte, banco de dados, arquitetura e regras de negócio homologadas no **Plannit (Líder Móveis Planejados)**.

---

## 1. O que JÁ ESTÁ DESENVOLVIDO no Plannit

Vários requisitos centrais da especificação já estão completamente implementados e em pleno funcionamento na base de código atual:

| Requisito na Spec v1 | Status no Plannit | Detalhes da Implementação Atual | Referência no Código |
| :--- | :--- | :--- | :--- |
| **Prontuário do Cliente & Histórico** (Seções 3.1 e 4.5) | **100% Concluído** | Ficha completa do cliente com timeline de observações pessoais, categorias configuráveis com cores/ícones, notas fixadas em destaque no topo e sincronização cross-tab via BroadcastChannel. | [`ProntuarioCliente`](file:///home/porto/codespace/Plannit/app/models/prontuario_cliente.ts)<br>[`show.tsx`](file:///home/porto/codespace/Plannit/inertia/pages/clientes/show.tsx) |
| **Integração CRM & Prontuário** (RN-L01 / Seção 4.2) | **100% Concluído** | No `LeadDrawer` do CRM, ao registrar qualquer contato (WhatsApp, Ligação, etc.), há a opção *"📌 Salvar também no Prontuário do Cliente"* com seleção instantânea de categoria. | [`crm/index.tsx`](file:///home/porto/codespace/Plannit/inertia/pages/crm/index.tsx#L1850) |
| **Múltiplos Projetos p/ Mesmo Cliente** (RN-L02 / RN-L03) | **100% Concluído** | Botão `+ Novo Projeto p/ este Cliente` disponível no `LeadDrawer` e na Ficha do Cliente, criando um novo card no CRM sem perder a amarração do cadastro original. | [`crm/index.tsx`](file:///home/porto/codespace/Plannit/inertia/pages/crm/index.tsx#L1498)<br>[`ClientesController`](file:///home/porto/codespace/Plannit/app/controllers/clientes_controller.ts) |
| **Módulo de Especificadores / Arquitetos** (RN-L20 / Seção 3.1) | **100% Concluído** | Cadastro completo (`Arquiteto`), tipos (`arquiteto`, `designer_interiores`, etc.), busca com tolerância a acentos (`EspecificadorAutocomplete`), cadastro rápido em modal sem perder rascunho (`ModalNovoParceiroRapido`), vínculo travado e histórico imutável de dono. | [`Arquiteto`](file:///home/porto/codespace/Plannit/app/models/arquiteto.ts)<br>[`EspecificadorAutocomplete.tsx`](file:///home/porto/codespace/Plannit/inertia/components/especificadores/EspecificadorAutocomplete.tsx) |
| **Kanban Multi-Quadros & Etapas Parametrizáveis** (Seção 4.3) | **100% Concluído** | Funil dividido em 4 Quadros (*Comercial*, *Pós-venda Conferência*, *Entrega & Montagem*, *Assistência Técnica*) totalmente gerenciáveis em `/configuracoes?tab=kanban` (ordem `↑`/`↓`, cores, ativação Verde/Vermelho). | [`KanbanFunisPanel.tsx`](file:///home/porto/codespace/Plannit/inertia/pages/configuracoes/components/KanbanFunisPanel.tsx)<br>[`KanbanQuadroCatalogo`](file:///home/porto/codespace/Plannit/app/models/kanban_quadro_catalogo.ts) |
| **Travas Obrigatórias de Avanço no Funil** (RN-L01 / RN-L22) | **100% Concluído** | Guardrails dinâmicos por coluna: trava de **Qualificação Obrigatória (RN001)** e trava de **Motivo da Perda Obrigatório (RF004)**. | [`LeadsController`](file:///home/porto/codespace/Plannit/app/controllers/leads_controller.ts)<br>[`lead.ts`](file:///home/porto/codespace/Plannit/app/validators/lead.ts) |
| **Agenda de Encontros e Compromissos** (Seção 4.2 / Módulo 12) | **100% Concluído** | Gestão de compromissos integrada ao CRM (`/agenda`), filtros pessoal vs equipe, tipos configuráveis e exibição na gaveta lateral do lead. | [`CompromissoAgenda`](file:///home/porto/codespace/Plannit/app/models/compromisso_agenda.ts)<br>[`agenda/index.tsx`](file:///home/porto/codespace/Plannit/inertia/pages/agenda/index.tsx) |
| **Auditoria e Logs Imutáveis (Append-only)** (Princípio 3) | **100% Concluído** | Rastreabilidade estrita de transições de status (`HistoricoStatusLead`, `HistoricoStatusProjeto`) com gravação de autor, carimbo temporal e cálculo exato de permanência em cada fase (SLA). Nada crítico é excluído fisicamente (RN017). | [`HistoricoStatusLead`](file:///home/porto/codespace/Plannit/app/models/historico_status_lead.ts)<br>[`tempo_colunas.ts`](file:///home/porto/codespace/Plannit/inertia/lib/tempo_colunas.ts) |

---

## 2. O que NÃO FOI DESENVOLVIDO (Escopo Novo / Faltante da v1)

Estes recursos foram propostos pelo Thiago mas ainda não existem no banco de dados, regras ou interfaces do sistema:

1. **Recepção e Fila da Vez da Loja Física (Seções 3.3, 4.1 e RN-L24 a RN-L27):**
   - **Registro de Fluxo da Porta (`EntradaLoja`):** Registro de toda pessoa que entra na loja física, registrando horário, categoria de produto procurado e desfecho (*Encaminhada* vs *Saiu sem atendimento com motivo*).
   - **Lista de Espera de Produtos (`ListaEsperaProduto`):** Captação opcional de nome/telefone com consentimento explícito (LGPD) para aviso futuro de mercadorias não encontradas no showroom.
   - **Painel da Fila da Vez da Recepção:** Controle diário do rodízio das vendedoras com base no botão *"Cheguei"*, status *Disponível / Indisponível (com motivos de lista curta)*, regras de avanço, encaminhamento direto por carteira e relatório de desvios da recepção.
2. **Termômetro do Lead / Temperatura (RN-L08, RN-L09 e Seção 3.1):**
   - Classificação explícita em **Quente** (fechamento no mês corrente), **Morno** (mês futuro) e **Frio** (sem previsão).
   - Histórico imutável de temperatura (`HistoricoTemperatura`).
   - Regra de revisão compulsória de Leads Quentes na virada do mês.
   - Cálculo de projeção ponderada por probabilidade:
     $$\text{Projeção} = \text{Realizado Confirmado} + \sum (\text{Valor Orçado} \times P(\text{temperatura}, \text{segmento}))$$
3. **Gestão de Versões de Orçamento Comercial (RN-L15, RN-L16 e Seção 3.1):**
   - Histórico imutável de orçamentos (`VersaoOrcamento`) contendo número da versão, valor orçado, valor de tabela declarado e motivo obrigatório da revisão (*mudança de escopo* ou *ajuste comercial*).
   - Métrica de **Erosão do Orçamento** (comparação percentual do 1º orçamento enviado contra a versão contratada).
4. **Venda em Dois Estágios: Declarada vs Confirmada (RN-L11 a RN-L17):**
   - Ação de "Marcar Venda como Declarada" pela vendedora.
   - Fila de validação para o Administrativo/Financeiro conferir checklist antes de torná-la Venda Confirmada.
   - Conferência de `valor_tabela_conferido`, cálculo de **Over** (tabela inflada) e **Desconto Real**.
   - Trava de **Alçada de Desconto** exigindo aprovação formal do Gestor (`AprovacaoDesconto`) para concessões acima do teto permitido.
5. **Divisão de Vendas entre Vendedoras (RN-L18):**
   - Rateio percentual de venda, meta e comissão entre duas ou mais vendedoras (`DivisaoVenda`), mantendo atendimento e conversão vinculados apenas ao vendedor principal.
6. **Métricas de Recepção e Indicadores da Fila (Seção 6.4):**
   - Indicadores de *Pulos de vez*, *Pulos com cliente esperando*, *Tempo indisponível*, *Saldo de vezes* e *Taxa de captação da porta da loja*.
7. **Controle Estrito de Carteira Fechada (RN-L30):**
   - Ocultação de dados cadastrais, histórico e valores para clientes que pertencem a outra vendedora (exibindo apenas *"Cliente já cadastrado, responsável: Nome"*), com fluxo de concessão de `AcessoTemporario`.

---

## 3. INCONGRUÊNCIAS CRÍTICAS E CONFLITOS DE PREMISSA

Existem **6 incongruências cruciais** entre o documento do Thiago e a arquitetura real do Plannit que precisam ser alinhadas antes do início do desenvolvimento:

### 🔴 Incongruência 1: Stack Tecnológica Descrita no Documento
- **O que a Spec v1 afirma:** *"o Plannit já está em operação (FastAPI, PostgreSQL, React, multi-tenant)."*
- **A Realidade do Código:** O Plannit **NÃO USA FastAPI** e **NÃO É multi-tenant** no banco de dados. O Plannit é um **monólito AdonisJS v7 + Inertia.js (React 19 + TypeScript) + Lucid ORM + PostgreSQL 16**, operando como sistema dedicado para a Líder Móveis Planejados. Todas as rotas são páginas Inertia e mutações controladas por controllers AdonisJS.

### 🔴 Incongruência 2: Conflito Conceitual sobre a palavra "Fila"
- **O que a Spec v1 propõe:** Trata a "Fila" como o **rodízio de balcão da loja física / recepção** (vendedora da vez, quem atendeu vai pro fim da fila, botão "Cheguei").
- **A Realidade do Plannit:** A rota `/fila` e o conceito de Fila existente no sistema (RN002, RN003) é a **Fila Técnica de Projetistas 3D** (distribuição de briefings com score $\ge$ 70 e monitoramento de limite WIP de 3 projetos por desenhista de Promob).
- **Impacto:** Chamar a fila da recepção apenas de "Fila" causará colisão direta de rotas, models e confusão operacional. Deve ser implementada sob um namespace explícito como **"Fila de Atendimento"** ou **"Recepção / Fila da Vez"** (`/recepcao/fila-da-vez`).

### 🔴 Incongruência 3: Entidade "Oportunidade" vs "Lead"
- **O que a Spec v1 propõe:** Criar a tabela `Oportunidade` como unidade de conversão separada do cliente e das interações.
- **A Realidade do Plannit:** O objeto que nasce no funil CRM e caminha pelas 42 colunas é o **`Lead`** (tabela `leads`). Quando o lead avança para briefing técnico, ele gera um **`Projeto`** (`PRJ-ANO-NNN`). O cliente (`Cliente`) é convertido a partir de um Lead qualificado.
- **Impacto:** Criar uma terceira entidade `Oportunidade` geraria duplicação desnecessária e retrabalho. O caminho arquitetural correto é evoluir o próprio `Lead` para suportar temperatura, valor orçado e versões de proposta, mantendo-o como a oportunidade de negócio vinculada ao `Cliente`.

### 🔴 Incongruência 4: Modelo de Negócio — "Móveis Soltos" vs "Planejados"
- **O que a Spec v1 propõe:** Divisão radical do negócio em dois segmentos: *Soltos* (contados em **peças**) e *Planejados* (contados em **ambientes**).
- **A Realidade do Plannit:** Todo o fluxo do SRS v3.0 da Líder Móveis foi desenhado para **móveis planejados sob medida de alto padrão** (Briefing Técnico detalhado, medição física na obra, Promob 3D, aprovação de render e handoff de fábrica). O sistema não possui catálogo nem checkout de produtos soltos pronta-entrega (ex: vender 1 sofá avulso). Se a loja vende soltos, será necessário criar um fluxo simplificado que dispense briefing de obra e modelagem Promob para itens prontos.

### 🔴 Incongruência 5: Existência de "Valor de Tabela"
- **O que a Spec v1 assume:** A existência de `valor_tabela_declarado` e `valor_tabela_conferido` para calcular "Over" e "Desconto Real".
- **A Realidade do Plannit:** Móveis planejados sob medida não possuem uma tabela de preços fixa de prateleira (o preço é formulado dinamicamente no software de engenharia/Promob de acordo com consumo de chapas, fitas de borda e ferragens). Não há catálogo de preços unitários no banco. O valor hoje é registrado como orçamento estimado ou valor contratual negociado.

### 🔴 Incongruência 6: Validação de Venda vs Handoff Técnico (RN006)
- **O que a Spec v1 propõe:** O Administrativo/Financeiro valida a venda através de um checklist de 3 itens (cadastro, contrato e forma de pagamento), confirmando a venda no Kanban.
- **A Realidade do Plannit:** O guardrail mais rígido do Plannit é o **Handoff Técnico (RN006)** em [`fechamentos_controller.ts`](file:///home/porto/codespace/Plannit/app/controllers/fechamentos_controller.ts), que exige conferência formal de **8 itens obrigatórios** (contrato, caderno comercial, plantas, fotos, briefing aprovado, aprovação financeira de crédito, pedido e liberação da obra) para liberar o projeto para medição fina e produção. A validação comercial proposta pelo Thiago deve atuar como um **gate prévio de fechamento**, integrando-se harmonicamente ao Handoff Técnico já existente, e não como um processo paralelo concorrente.

---

## 4. Recomendações e Plano de Ação Estruturado

1. **Ajuste de Nomenclatura e Namespace:**
   - Implementar a Fila de Vendedoras sob a rota `/recepcao` (ex: `/recepcao/fila`, `/recepcao/entradas`), preservando `/fila` para a esteira 3D dos projetistas.
2. **Evolução do Model `Lead` (Sem duplicar como Oportunidade):**
   - Acrescentar ao `Lead` os campos de `temperatura` (`quente`, `morno`, `frio`), `previsao_fechamento_mes`, `segmento` (`planejados`, `soltos`) e criar a tabela relacional `historico_temperaturas_lead`.
3. **Módulo de Orçamentos Comerciais:**
   - Criar `versoes_orcamentos` atrelada ao `Lead`/`Projeto`, gravando número de revisão, valor orçado e motivo da revisão.
4. **Alinhamento com o Thiago:**
   - Formalizar com o Thiago Ribeiro que o sistema roda sobre **AdonisJS v7 + Inertia (React 19)** e validar se a loja física opera de fato com móveis soltos com pronta-entrega ou se todos os pedidos passam por projeto técnico.

