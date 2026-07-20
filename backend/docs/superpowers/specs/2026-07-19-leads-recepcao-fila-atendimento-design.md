# Design — Frente A: Recepção + Fila de Atendimento (módulo Leads)

## Contexto

O módulo de Leads hoje (`app/models/crm.py`, `app/api/v1/endpoints/leads.py`, `frontend/src/pages/crm/CRMPage.jsx`) cobre cadastro básico de lead, histórico de interações e funil por status. Não existe nenhum conceito de fila/ordem de atendimento nem de roteamento automático — todo lead é atribuído manualmente a um `vendedor_id`, e o vendedor logado é auto-atribuído quando cria um lead sem informar `vendedor_id`.

Este documento cobre a primeira de três frentes identificadas para o módulo de Leads:

- **A. Recepção + Fila de Atendimento** ← este documento
- B. Registro do Vendedor (interesse do cliente, jornada) — spec futura
- C. Pedido/Venda e Métricas (conversão, ticket médio, itens por venda) — spec futura

## Objetivo

Permitir que a recepção organize o atendimento presencial por ordem de chegada dos vendedores, cadastre contatos de redes sociais/telefone numa fila compartilhada, e que os vendedores disponíveis "puxem" esses contatos o mais rápido possível — com o vínculo a especificadores (quando existir) já alimentando o módulo de Especificadores (branch `arch`).

## Modelo de dados

### `Lead` (ajustes em `app/models/crm.py`)

- `OrigemLead`: adicionar `WHATSAPP = "whatsapp"` e `TELEFONE = "telefone"` (hoje só existe `INSTAGRAM`, `INDICACAO`, `SITE_GOOGLE`, `CONSTRUTORA`, `SHOWROOM`, `ARQUITETO`, `OUTRO`).
- `criado_por_id` (FK `users.id`, nullable) — quem cadastrou (recepção ou vendedor), para métricas futuras (Frente C) e para diferenciar canal de entrada.
- Nenhum campo novo de "status de fila": um lead com `vendedor_id = null` **é** a fila de aguardando. Evita duplicar conceito de estado.

### `FilaAtendimento` (nova tabela)

Fila de vendedores para atendimento presencial — um registro "vivo" por vendedor, atualizado por check-in/check-out, não histórico.

| Campo | Tipo | Descrição |
|---|---|---|
| `id` | PK | |
| `vendedor_id` | FK `users.id`, único | |
| `posicao` | int | ordem na fila |
| `disponivel` | bool, default `true` | |
| `motivo_indisponivel_categoria` | enum (`atendimento_marcado`, `orcamento_pedido`, `almoco`, `outro`), nullable | obrigatório quando `disponivel=false` |
| `motivo_indisponivel_obs` | texto, nullable | obrigatório só se categoria = `outro` |
| `checkin_em` | timestamp, nullable | |
| `ativo_hoje` | bool, default `false` | `true` entre check-in e check-out/reset diário |
| `data_referencia` | date | dia do check-in atual, usado pelo reset automático |

### `ConfigFilaAtendimento` (nova tabela, singleton — mesmo padrão de `ConfigWIP`)

| Campo | Tipo | Descrição |
|---|---|---|
| `minutos_alerta` | int, default `15` | tempo até o lead ganhar destaque visual na fila de aguardando |
| `minutos_escalonamento` | int, default `30` | tempo até gerar notificação de escalonamento pra recepção/gestão |

### `TipoInteracaoArquiteto` (ajuste em `app/models/crm.py`)

Adicionar `INDICACAO_LEAD = "indicacao_lead"` ao enum — usado quando um lead não-presencial é vinculado a um especificador (ver seção de Integração abaixo).

## Fluxo 1 — Atendimento presencial

**Check-in / check-out:** vendedor marca "Cheguei" ao chegar na loja → cria/atualiza seu registro em `FilaAtendimento` com `posicao` = maior atual + 1, `disponivel=true`, `ativo_hoje=true`, `data_referencia=hoje`. Marca "Saí" no fim do expediente → `ativo_hoje=false`.

**Indisponibilidade:** vendedor marca indisponível, escolhendo categoria (+ observação livre obrigatória se categoria = "outro"). Enquanto indisponível, é pulado nas sugestões de atendimento, mas **mantém sua `posicao`** — ao voltar a ficar disponível, não perde o lugar.

**Reordenar:** recepção (perfil `RECEPCAO` + gestores) pode reordenar a fila livremente a qualquer momento (drag-and-drop na UI, `PATCH` de posições no backend).

**Alerta "próximo da vez":** vendedor com menor `posicao` entre os `disponivel=true` e `ativo_hoje=true` vê um banner na tela dele.

**Duas formas de um lead presencial entrar no sistema:**
1. **Recepção cadastra** quando o cliente chega — formulário sugere o vendedor no topo da fila entre os disponíveis, mas ela pode escolher outro manualmente (cliente pede alguém específico, ou tem especificador vinculado a outro vendedor via `Arquiteto.vendedor_id` — nesse caso o sistema já pode sugerir automaticamente esse vendedor).
2. **Vendedor cadastra para si mesmo** — já suportado hoje no backend (auto-atribuição), só precisa ficar acessível no frontend também para o caso presencial (hoje só é usado implicitamente).

Em ambos os casos, o lead nasce **já com `vendedor_id` preenchido** — não passa pela fila de aguardando.

**Fim do atendimento:** o vendedor atribuído vai para o final da fila (`posicao` = maior atual + 1 no momento da atribuição).

## Fluxo 2 — Redes sociais / telefone (fila de aguardando)

**Cadastro:** recepção (ou quem administra WhatsApp/Instagram da loja) cadastra o lead assim que a mensagem/ligação chega, com origem `whatsapp`, `instagram` ou `telefone`.

**Atribuição direta (bypass da fila):** se já dá pra identificar o vendedor certo (indicação nomeada, ou especificador vinculado a um vendedor específico via `Arquiteto.vendedor_id`), a recepção atribui direto — lead nasce com `vendedor_id` preenchido e cai direto na coluna do vendedor, sem passar pela fila.

**Fila de aguardando:** sem indicação clara, o lead nasce com `vendedor_id = null` e aparece na lista "Aguardando" (todos os leads com `vendedor_id is null`), ordenada por `criado_em` ascendente.

**Puxar:** qualquer vendedor disponível pode puxar — sem toggle de disponibilidade nesse fluxo, é livre — mas só pode puxar o lead **mais antigo** da lista. A UI só libera o botão "Puxar" no primeiro card; o backend valida a regra (ver Detalhes Técnicos).

**Devolução voluntária:** o vendedor que puxou pode devolver o lead pra fila, com justificativa obrigatória (texto livre). Gera uma `InteracaoLead` automática ("Devolvido à fila: [motivo]").

**Reatribuição pelo gestor:** `DIRETORIA`/`GERENTE_COMERCIAL` podem devolver um lead puxado de volta pra fila, ou transferir direto pra outro vendedor.

**Posição ao devolver (voluntária ou por gestor):** o lead reentra na fila usando a `criado_em` **original** — continua "antigo", prioridade alta pra ser puxado de novo. Não perde o lugar por ter sido puxado e devolvido.

## Integração com módulo Especificadores (branch `arch`)

Campo novo no formulário de Novo Lead (recepção e vendedor, qualquer canal): **"Acompanhado de especificador"** — busca/seleciona um `Arquiteto` já cadastrado.

Ao selecionar:
- Salva `Lead.arquiteto_id` (campo já existe no model).
- Gera automaticamente uma `InteracaoArquiteto`:
  - tipo `visita_loja` se o lead for presencial (origem `showroom`);
  - tipo `indicacao_lead` (novo) para os demais canais.
- O vínculo via `arquiteto_id` já alimenta o "potencial" do score RFV do especificador automaticamente (`arquiteto_score.py` conta `leads_ativos` por `arquiteto_id`) — não precisa de lógica adicional pro score em si, só a interação qualitativa na timeline.

## Permissões

| Ação | Quem pode |
|---|---|
| Cadastrar lead com atribuição direta a vendedor específico | `RECEPCAO`, `DIRETORIA`, `GERENTE_COMERCIAL`, e o próprio `VENDEDOR` (só pra si mesmo) |
| Reordenar fila presencial | `RECEPCAO`, `DIRETORIA`, `GERENTE_COMERCIAL` |
| Check-in / check-out / marcar indisponível | o próprio vendedor |
| Puxar lead da fila de aguardando | qualquer `VENDEDOR` |
| Devolver lead puxado (voluntário) | o vendedor que puxou |
| Reatribuir/devolver lead de outro vendedor | `DIRETORIA`, `GERENTE_COMERCIAL` |
| Editar limiares de alerta/escalonamento (`ConfigFilaAtendimento`) | `DIRETORIA`, `GERENTE_COMERCIAL` |
| Ver fila de aguardando e fila presencial | todos os perfis acima |

## Refinamentos operacionais

- **Alerta de tempo parado:** lead na fila de aguardando há mais de `minutos_alerta` sem ser puxado ganha destaque visual (mesmo padrão do `border-l-amber-400` já usado no `LeadCard` para "sem interação há 3 dias").
- **Escalonamento automático:** lead há mais de `minutos_escalonamento` sem ser puxado gera uma `Notificacao` (reaproveitando `models/notificacao.py`) pra recepção e gestão.
- **Notificação de lead novo:** tela de Atendimento usa polling curto (20–30s, mesmo padrão do auto-refresh do Dashboard) + toast quando aparece um lead novo na fila de aguardando.
- **Primeira interação automática:** ao ser atribuído (direto ou via "puxar"), gera automaticamente a primeira `InteracaoLead` (resumo padrão tipo "Lead recebido — origem: Instagram"), já iniciando a jornada.
- **Aviso de duplicado:** antes de salvar, o formulário consulta se já existe lead ou cliente com aquele telefone e mostra aviso não-bloqueante ("Já existe um cadastro com este telefone — [ver]").
- **Painel gerencial da fila:** novo KPI no Dashboard — leads aguardando agora, tempo médio de espera até ser puxado, quantos vendedores disponíveis neste momento.
- **Contador diário por vendedor:** "você atendeu N leads hoje", calculado a partir dos leads atribuídos a ele hoje — visível junto ao indicador de disponibilidade.

## Detalhes técnicos

**Concorrência no "puxar":** dois vendedores podem clicar "Puxar" no mesmo lead ao mesmo tempo. O endpoint `POST /leads/{id}/puxar` deve fazer um `UPDATE` condicional (`WHERE vendedor_id IS NULL`) — se zero linhas forem afetadas, retorna 409 e o frontend re-sincroniza a lista (quem tentou perdeu a corrida).

**Regra do "mais antigo primeiro":** o backend valida, ao puxar, que não existe nenhum lead com `vendedor_id IS NULL` mais antigo que o solicitado; caso exista, rejeita com 400 e mensagem indicando qual é o lead correto a puxar.

**Reset diário da fila:** job agendado à meia-noite marca `ativo_hoje=false` para todos os registros de `FilaAtendimento`. Quem não fizer check-in de novo no dia seguinte não aparece na fila.

**Job de escalonamento:** processo periódico (ex: a cada 5 min) varre leads com `vendedor_id IS NULL` e `criado_em` mais antigo que `minutos_escalonamento`, gerando `Notificacao` uma única vez por lead (flag ou checagem de notificação já existente para evitar duplicar).

## Frontend — telas novas

- **Nova aba "Atendimento"** dentro do módulo CRM, com duas listas lado a lado:
  - *Fila de Vendedores* — ordem, disponibilidade (com motivo), drag-and-drop para recepção reordenar, banner "você é o próximo" para o vendedor logado.
  - *Aguardando* — leads sem dono, mais antigo no topo, destaque visual por tempo de espera, botão "Puxar" habilitado só no primeiro card.
- **Indicador de disponibilidade** sempre visível para o vendedor logado (header/sidebar): check-in, check-out, marcar indisponível (categoria + observação condicional), contador "N leads hoje".
- **Modal "Novo Lead"** ganha: origem incluindo `whatsapp`/`telefone`, campo "Atribuir a" (sugestão automática + override manual), toggle "Acompanhado de especificador" com busca de `Arquiteto`, aviso não-bloqueante de telefone duplicado.
- **Tela de configuração** (gestor): editar `minutos_alerta` e `minutos_escalonamento`.
- **Dashboard:** novo card de KPI com o resumo da fila (aguardando, tempo médio, vendedores disponíveis).

## Fora de escopo desta frente

- Limite de leads simultâneos (WIP) por vendedor — considerado e descartado por ora; pode ser revisitado se virar problema real na operação.
- Notificação automática ao especificador quando um lead dele é criado — não existe portal do especificador hoje.
- Suporte a múltiplas lojas/filas paralelas — a fila é única, assumindo uma loja física.
- Integração real com API do WhatsApp/Instagram (webhook automático) — cadastro continua manual pela recepção nesta frente.
- Campo de interesse do cliente, registro detalhado da jornada além de `InteracaoLead` — fica para a Frente B.
- Conversão em pedido e métricas de conversão/ticket médio/itens por venda — fica para a Frente C.
