# Módulo de Especificadores — Sub-projeto 1: Cadastro (fundação)

**Status:** Aprovado para implementação
**Branch:** `feature/arch`
**Documento-fonte:** `C:\Users\thiag\Documents\Claude\Especificacao_Modulo_Especificadores_Plannit.md`

## Contexto

O documento-fonte especifica um módulo completo de gestão de carteira de especificadores
(arquitetos, designers de interiores, engenheiros) com 10 telas, motor de RFV, matriz
Potencial×Lealdade, Next Best Action, campanhas de premiação, gestão de eventos, rede de
relacionamento, satisfação, sazonalidade, cartão de visita digital e exportações.

Isso é grande demais para um único ciclo spec → plano → implementação. Foi decomposto em
sub-projetos independentes, cada um com seu próprio ciclo:

1. **Cadastro do Especificador (este documento)** — fundação: model PF/PJ, tipos
   configuráveis, pessoas vinculadas, portfólio, checklist de ativação, ficha.
2. **RFV** — recência/frequência/valor, 11 segmentos, matriz RFV, histórico de segmento.
   Depende de definir a fonte do "pedido" (provável candidato: `Fechamento`).
3. **Potencial × Lealdade** — quadrantes estratégicos, análise combinada RFV+P×L.
4. **Painel do Vendedor + Agenda de Carteira + Next Best Action**.
5. **Metas e Campanhas de Premiação**.
6. **Concorrentes / Share of Wallet**.
7. **Rede de Relacionamento + Eventos**.
8. **Satisfação, Sazonalidade e Rastreabilidade de Indicações**.
9. **Cartão de Visita Digital + Exportações Excel**.

### Decisões de arquitetura que valem para o módulo inteiro

- **Multi-tenancy:** o documento-fonte descreve arquitetura multi-tenant, mas o Plannit hoje
  é single-tenant (só Líder Móveis, sem `tenant_id` em nenhuma tabela). Decisão: **ignorar
  multi-tenancy por completo neste e nos próximos sub-projetos**. Isso fica como um projeto de
  arquitetura separado, só se/quando o Plannit virar produto vendido a múltiplas lojas.
- **Nomenclatura:** renomear tudo de `Arquiteto` para `Especificador` (model, tabela,
  endpoint, página) — evita colisão com `PerfilUsuario.ARQUITETO` (que é outra coisa: um
  perfil de usuário do sistema) e reflete que há múltiplos tipos (Arquiteto, Designer de
  Interiores, Engenheiro).
- **Mapeamento de papéis** do documento para `PerfilUsuario` existente:
  Vendedor = `VENDEDOR`, Gestor = `GERENTE_COMERCIAL`, Admin = `DIRETORIA`.
- **Dado de produção:** a tabela `arquitetos` atual está vazia/só com dados de teste — a
  migration deste sub-projeto não precisa preservar dados reais.

---

## Escopo deste sub-projeto

Cobre as seções 2, 3, 4.1–4.5, 4.8, 4.9 e 10 do documento-fonte. **Fora de escopo** (entram em
sub-projetos futuros): 4.6 (concorrentes/share of wallet → sub-projeto 6), 4.7 (rede de
relacionamento → sub-projeto 7), RFV, P×L quadrantes, Next Best Action, campanhas, eventos,
satisfação, sazonalidade, cartão de visita, exportações.

## Modelo de dados

Novo arquivo `app/models/especificador.py` (substitui a classe `Arquiteto` que hoje vive em
`app/models/crm.py`).

### `TipoEspecificador`
Configurável pelo Admin. `id, nome, ativo, ordem`.
Seed: Arquiteto, Designer de Interiores, Engenheiro.

### `Especificador` (renomeia tabela `arquitetos` → `especificadores`)
- `tipo_cadastro`: enum `pf` / `pj`
- `tipo_especificador_id`: FK → `TipoEspecificador`
- `nome` / `razao_social`, `cpf_cnpj` (nullable), `telefone` (obrigatório), `email` (nullable,
  unique se presente), `endereco_escritorio` (nullable)
- `aniversario_dia`, `aniversario_mes` (int, nullable), `aniversario_ano` (int, nullable) —
  colunas separadas em vez de `Date`, para permitir dia/mês sem ano.
- `estagio_carreira`: enum nullable (iniciante/estabelecido/senior/socio)
- `especialidade`: enum nullable (residencial_alto_padrao/residencial_medio/comercial/
  hoteleiro/corporativo/outro)
- `fit_portfolio`: enum nullable (alto/medio/baixo) — declarado manualmente
- `potencial`: int (1-5) — **calculado automaticamente** (ver seção "Potencial automático"
  abaixo), não editável via formulário.
- `lealdade`: int nullable (1-5) — **fica nulo neste sub-projeto**. Cálculo automático (share
  of wallet real) entra no sub-projeto 2 (RFV), quando existir receita real vinculada. Sem
  input manual.
- `status`: enum `ativo` / `inativo` / `prospect` — default `prospect` na criação. Neste
  sub-projeto, a única transição automática é `inativo` (via DELETE, manual). A transição
  `prospect → ativo` fica para o sub-projeto 2 (RFV), disparada quando o especificador tiver
  seu primeiro pedido fechado vinculado — até lá, especificadores novos permanecem `prospect`
  indefinidamente, a menos que desativados manualmente.
- Campos de portfólio (doc 4.5): `faixa_valor_tipica` (string), `estilo_predominante`
  (string), `tipos_projeto_frequentes` (string), `obras_por_ano` (int nullable),
  `valor_medio_obra` (float nullable), `regioes_atuacao` (string), `instagram`, `linkedin`,
  `site` (strings nullable), `influenciador` (bool), `observacoes_portfolio` (text)
- `criado_em`, `atualizado_em`

**Potencial anual bruto** = `obras_por_ano × valor_medio_obra` — calculado on-the-fly
(propriedade, não persistido).

### Potencial automático (substitui a nota manual do documento-fonte)

O documento original pede nota manual de Potencial dada pelo vendedor. Decisão: eliminar a
subjetividade — `potencial` é derivado automaticamente do `potencial_anual_bruto` (que já é
um número factual estimado, não um "chute"), usando faixas configuráveis:

### `FaixaPotencial`
Configurável pelo Admin. `id, nota (1-5), valor_minimo`.
Seed inicial (placeholder, ajustável sem dado histórico ainda):
P5 ≥ R$ 3.000.000/ano · P4 ≥ R$ 1.500.000 · P3 ≥ R$ 700.000 · P2 ≥ R$ 300.000 · P1 abaixo disso.

### `PessoaVinculada`
Só relevante quando `tipo_cadastro=pj` (UI esconde a aba para PF; sem constraint no banco).
`especificador_id` (FK), `nome`, `papel` (enum: responsavel/decisor/funcionario), `telefone`,
`email`, `aniversario_dia/mes/ano`, `observacao`.

### `TipoAtributoDinamico` + `AtributoDinamico`
Config Admin: `TipoAtributoDinamico(id, nome, ativo)`. Seed: Decisor, Time, Hobbie, Indicado
por, Parceiro de negócios, Outro.
Dado: `AtributoDinamico(especificador_id, tipo, valor)` — repetível.

### `ObservacaoEspecificador`
Append-only. `especificador_id, autor_id, texto, criado_em`. Sem edição/remoção.

### `ResponsavelHistorico`
`especificador_id, vendedor_id, data_inicio, data_fim` (null = vigente). RN008: ao trocar
responsável, o vínculo atual recebe `data_fim` e um novo é aberto.

### `ChecklistTemplateItem` + `EspecificadorChecklistItem`
Config Admin: `ChecklistTemplateItem(id, tipo_especificador_id, descricao, ordem, ativo)`.
Seed exemplo (doc seção 10): Enviar kit de boas-vindas, Agendar visita ao showroom, Apresentar
portfólio de projetos, Adicionar ao grupo de WhatsApp da loja, Convidar para o próximo evento.
Snapshot por especificador: `EspecificadorChecklistItem(especificador_id, descricao, ordem,
concluido, concluido_em)` — copiado do template ativo do tipo no momento do cadastro.

### Alteração em `Lead`
Coluna `arquiteto_id` renomeada para `especificador_id`; relationship atualizado para
`Especificador`.

---

## API

Prefixo `/especificadores` (substitui `/arquitetos`).

| Endpoint | Método | Quem pode |
|---|---|---|
| `/especificadores` | GET (filtros: tipo, status, responsável) | Vendedor: só própria carteira (responsável atual = ele). Gestor/Admin: tudo. |
| `/especificadores` | POST | Vendedor, Gestor, Admin |
| `/especificadores/{id}` | GET (ficha completa) | Vendedor (dono), Gestor, Admin |
| `/especificadores/{id}` | PATCH | Vendedor (dono), Gestor, Admin |
| `/especificadores/{id}` | DELETE → `status=inativo` (nunca apaga) | Gestor, Admin |
| `/especificadores/{id}/pessoas` | POST/PATCH/DELETE | Vendedor (dono), Gestor, Admin |
| `/especificadores/{id}/atributos` | POST/DELETE | Vendedor (dono), Gestor, Admin |
| `/especificadores/{id}/observacoes` | POST (append-only) | Vendedor (dono), Gestor, Admin |
| `/especificadores/{id}/checklist/{item_id}/concluir` | POST | Vendedor (dono), Gestor, Admin |
| `/especificadores/{id}/transferir` | POST | Gestor, Admin |
| `/especificadores/tipos` | CRUD | Admin |
| `/especificadores/tipos-atributo` | CRUD | Admin |
| `/especificadores/checklist-templates` | CRUD | Admin |
| `/especificadores/faixas-potencial` | CRUD | Admin |

Regras:
- "Vendedor (dono)" = existe `ResponsavelHistorico` com `data_fim IS NULL` e
  `vendedor_id = current_user.id`.
- Na criação: se quem cria é `VENDEDOR`, ele vira responsável automaticamente. Se
  `GERENTE_COMERCIAL`/`DIRETORIA`, escolhe o vendedor responsável no formulário.
- Na criação: dispara automaticamente o snapshot do checklist (do template ativo do tipo
  escolhido) e define `status=prospect`.

---

## Frontend

- **`especificadoresApi`** em `lib/api.js` (substitui `arquitetosApi`), espelhando os
  endpoints acima, incluindo os CRUDs de config usados só na tela de Admin.
- **`EspecificadoresPage.jsx`** (rota `/especificadores`, sidebar "Arquitetos" →
  "Especificadores"):
  - Lista/grid com filtros: tipo, status, responsável (filtro de responsável só visível para
    Gestor/Admin).
  - Card: nome, tipo, status, badge de potencial (calculado), responsável.
  - Drawer da ficha com abas: **Perfil** (dados principais + pessoas vinculadas se PJ),
    **Portfólio** (campos 4.5 + potencial anual bruto read-only), **Atributos** (dinâmicos),
    **Observações** (cronológico + campo "Anotar"), **Checklist** (itens com checkbox, visível
    se `status=prospect` ou checklist incompleto).
  - Botão "Transferir responsável" no header do drawer (só Gestor/Admin).
- **Botão flutuante "+"** em `AppLayout.jsx`: menu com "Novo Especificador" (funcional, abre
  formulário de criação), "Novo Cliente" e "Novo Lead" (navegam para `/crm` e `/clientes`
  sem pré-abrir modal — fluxos existentes continuam intactos).
- **`EspecificadoresConfigPage.jsx`** (rota `/especificadores/config`, só Admin): abas internas
  — Tipos, Tipos de Atributo, Checklist Templates, Faixas de Potencial.

---

## Migration e organização de código

- Migration Alembic única: renomeia tabela `arquitetos` → `especificadores`, renomeia coluna
  `leads.arquiteto_id` → `leads.especificador_id`, adiciona colunas novas, cria as tabelas
  novas listadas acima. Sem necessidade de preservar dados (tabela vazia/teste).
- Novo arquivo `app/models/especificador.py` — os models saem de `crm.py` (que fica só com
  Lead/Cliente/InteracaoLead).
- `schemas/especificador.py` novo (substitui `ArquitetoCreate`/`ArquitetoResponse` de
  `schemas/crm.py`).
- `seed.py` ganha: 3 tipos padrão, 6 tipos de atributo padrão, 1 checklist-template exemplo (5
  itens), faixas de potencial padrão (placeholders configuráveis).

---

## Fora de escopo (fica para sub-projetos futuros)

- Concorrentes / share of wallet (4.6) → sub-projeto 6.
- Rede de relacionamento (4.7) → sub-projeto 7.
- RFV, matriz P×L, Next Best Action, campanhas, eventos, satisfação, sazonalidade, cartão de
  visita, exportações → sub-projetos 2–9.
- Cálculo automático de Lealdade (depende de receita real — sub-projeto 2).
- Histórico de mudança de segmento RFV/quadrante P×L (não existe segmento ainda).
