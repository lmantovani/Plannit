# Arquitetos → "Especificador" (UI) — Lista, Perfil, Score e Decisores

**Status:** Aprovado para implementação
**Branch:** `feature/arch`

## Contexto

O módulo `Arquiteto` existe hoje só no backend (`app/models/crm.py::Arquiteto`,
`app/api/v1/endpoints/arquitetos.py`) — CRUD simples (`nome`, `escritorio`, `telefone`,
`email`, `nivel_parceria`, `is_active`). **Não existe nenhuma página no frontend para esse
módulo hoje** — não há rota, nem `arquitetosApi` em `lib/api.js`, apesar de documentação
anterior (CLAUDE.md/memória) descrever essa tela como implementada. Este spec parte do zero
no frontend.

Também existe um spec anterior (`2026-07-07-especificadores-cadastro-design.md`, aprovado mas
não implementado) que propõe substituir `Arquiteto` por um módulo `Especificador` bem mais
amplo (PF/PJ, tipos configuráveis, portfólio, checklist, RFV, etc.). **Decisão explícita deste
spec: não seguir esse caminho agora.** Mantemos o model/tabela/endpoint internos como
`Arquiteto`/`arquitetos` (evita a migração grande), e tratamos "Especificador" apenas como o
nome exibido na interface (sidebar, título de página, rota). Se o módulo completo for
retomado no futuro, esta decisão pode ser revisitada.

De forma semelhante, não existe hoje nenhuma tela nem API client-side para `Cliente` no
frontend (só existe no backend). Isso limita o que a aba Perfil pode fazer com "clientes
vinculados" — ver seção correspondente abaixo.

## Escopo

- Renomear a interface de "Arquitetos" para "Especificadores" (sidebar, título, rota),
  mantendo nomes internos (model/tabela/endpoint) como `Arquiteto`/`arquitetos`.
- Adicionar campo `tipo` (arquiteto/engenheiro/designer/corretor/outro) ao cadastro.
- Lista em formato de tabela, ordenada alfabeticamente, com filtros.
- Drawer lateral com 3 abas: Perfil, Score, Decisores.
- Página completa equivalente ao drawer, acessível a partir do nome no header do drawer.
- Histórico de interações estruturado (tipo fixo + observação livre).
- Vínculo direto `Cliente.arquiteto_id` (mesmo sem tela de Cliente ainda existir).
- Funcionários do escritório (aba Decisores) com flag de decisor.

**Fora de escopo:** RFV real (aba Score fica em estado vazio/explicativo), tela de cadastro de
Cliente (fica para outro momento — ver seção "Clientes vinculados"), tornar tipos de
interação configuráveis pelo admin, renomear o model/tabela para `Especificador`.

## Modelo de dados

### `Arquiteto` (tabela `arquitetos`, model existente) — campos novos
- `tipo`: enum `arquiteto` / `engenheiro` / `designer` / `corretor` / `outro` — obrigatório,
  sem default (força escolha na criação).
- `endereco_escritorio`: string, nullable.
- `vendedor_id`: FK → `users.id`, nullable — "vendedor vinculado". Só pode ser definido/alterado
  por Diretoria ou Gerente Comercial (não pelo próprio vendedor).

### `Cliente` (tabela `clientes`, model existente) — campo novo
- `arquiteto_id`: FK → `arquitetos.id`, nullable. Editável no cadastro/edição do cliente
  (endpoint de backend já existe; frontend de Cliente ainda não existe — ver observação acima).

### `InteracaoArquiteto` (tabela nova)
Espelha o padrão já usado em `InteracaoLead`. Append-only — sem edição ou remoção.
- `id`, `arquiteto_id` (FK), `autor_id` (FK `users.id`)
- `tipo`: enum fixo — `visita_escritorio`, `ligacao`, `visita_loja`, `evento`, `viagem`,
  `envio_brinde`
- `observacao`: text, obrigatório
- `criado_em`: datetime, server default now

### `FuncionarioArquiteto` (tabela nova)
Cobre a aba Decisores.
- `id`, `arquiteto_id` (FK)
- `nome`: string, obrigatório
- `funcao`: string, texto livre (ex: "Sócio", "Estagiário"), nullable
- `telefone`: string, nullable
- `email`: string, nullable
- `observacoes`: text, nullable
- `decisor`: boolean, default `false`

## API (backend)

Estende `app/api/v1/endpoints/arquitetos.py`:

| Endpoint | Método | Quem pode |
|---|---|---|
| `/arquitetos` | GET | Qualquer usuário autenticado (já existente; passa a incluir `tipo`, `endereco_escritorio`, `vendedor_id`/nome do vendedor no response) |
| `/arquitetos` | POST | Diretoria, Gerente, Recepção (já existente; passa a exigir `tipo`) |
| `/arquitetos/{id}` | PATCH | Diretoria, Gerente, Recepção (já existente). Campo `vendedor_id` só é aceito se `current_user` for Diretoria/Gerente — se um vendedor tentar alterá-lo, erro 403. |
| `/arquitetos/{id}` | DELETE | Diretoria, Gerente (já existente, sem mudança) |
| `/arquitetos/{id}/clientes` | GET | Qualquer usuário autenticado — lista clientes com `arquiteto_id` igual a este |
| `/arquitetos/{id}/interacoes` | GET | Qualquer usuário autenticado |
| `/arquitetos/{id}/interacoes` | POST | Diretoria, Gerente, Recepção, ou o vendedor vinculado (`Arquiteto.vendedor_id == current_user.id`) |
| `/arquitetos/{id}/funcionarios` | GET | Qualquer usuário autenticado |
| `/arquitetos/{id}/funcionarios` | POST/PATCH/DELETE | Diretoria, Gerente, Recepção, ou o vendedor vinculado |
| `/clientes/{id}` (endpoint existente) | PATCH | Sem mudança de permissão; passa a aceitar `arquiteto_id` no payload |

Padrão de serialização: seguir o que já está em `arquitetos.py` (`response_model` Pydantic via
`schemas/crm.py`), não o padrão de dict manual usado em outros módulos do projeto.

## Frontend

### Renomeação de interface
- Sidebar: item "Arquitetos" → "Especificadores" (mesmo ícone atual, se houver, ou escolher um
  ícone da lucide-react coerente — ex: `Compass` ou `Building2`, a definir na implementação).
- Rota: `/especificadores` (lista) e `/especificadores/:id` (página completa). Título da página:
  "Especificadores".
- `arquitetosApi` novo em `lib/api.js`, espelhando os endpoints acima (nome do arquivo/objeto
  interno pode ficar `arquitetosApi` — só o texto exibido ao usuário muda).

### Lista (`/especificadores`)
Tabela (não grid/cards), ordenada alfabeticamente por `nome`. Colunas: Nome, Tipo (badge),
Escritório, Telefone, Nível de parceria, Vendedor vinculado. Filtros no topo: tipo, nível de
parceria, vendedor (filtro de vendedor visível só para Diretoria/Gerente). Botão "Novo
Especificador" no header, abre formulário de criação (nome, tipo, escritório, telefone, email,
nível de parceria — `vendedor_id`/`endereco_escritorio` podem ser preenchidos depois, via
edição). Clicar no nome de uma linha abre o drawer lateral.

### Drawer lateral (3 abas)
Header do drawer: nome do especificador (clicável → navega para `/especificadores/:id`) +
botão "Editar" (abre formulário com nome, tipo, escritório, telefone, email, nível de
parceria, endereço; campo `vendedor_id` só aparece editável para Diretoria/Gerente — outros
perfis veem o vendedor vinculado como texto somente-leitura).

**Aba Perfil:**
- Dados principais somente leitura (edição via botão do header).
- Bloco "Clientes vinculados": lista de nomes vindos de `GET /arquitetos/{id}/clientes`. Cada
  nome aparece como texto não-clicável (sem link — tela de Cliente não existe ainda). Se a
  lista estiver vazia, mostrar "Nenhum cliente vinculado ainda".
- Bloco "Histórico de interações": formulário no topo — dropdown de tipo (6 opções fixas) +
  textarea de observação + botão "Registrar" (habilitado apenas se `vendedor_id` do
  especificador for o usuário atual, ou se o usuário for Diretoria/Gerente/Recepção). Abaixo,
  timeline cronológica (mais recente primeiro): tipo (ícone/label), autor, data, observação.

**Aba Score:**
- Estado vazio: mensagem explicando que o RFV ainda não está disponível porque depende de
  pedidos/fechamentos vinculados a este especificador (funcionalidade futura, fora de escopo
  deste spec). Visual reaproveitando o padrão do `PlaceholderPage` já existente
  (`pages/PlaceholderPages.jsx`), adaptado para caber dentro da aba do drawer/página.

**Aba Decisores:**
- Lista de funcionários (`FuncionarioArquiteto`): nome, função, telefone, email, observações,
  toggle "Decisor". Botão "Adicionar funcionário" abre formulário/modal. Edição inline e opção
  de remover (delete real — sem histórico, diferente do padrão RN017 usado em Projetos, pois
  `FuncionarioArquiteto` não é uma entidade de negócio crítica).
- Mesma regra de permissão da aba Perfil (dono vinculado, ou Diretoria/Gerente/Recepção) para
  adicionar/editar/remover.

### Página completa (`/especificadores/:id`)
Mesmo conteúdo das 3 abas do drawer, em layout de página cheia, com as mesmas ações
(editar/registrar interação/gerenciar funcionários). Acessível clicando no nome dentro do
drawer, ou navegando direto pela URL.

## Permissões — resumo

| Ação | Diretoria/Gerente/Recepção | Vendedor vinculado | Outro vendedor/perfil |
|---|---|---|---|
| Ver lista/perfil/score/decisores | Sim | Sim | Sim (somente leitura) |
| Criar especificador | Sim (Recepção também) | — | Não |
| Editar dados principais | Sim | Não | Não |
| Definir/trocar vendedor vinculado | Sim (só Diretoria/Gerente) | Não | Não |
| Registrar interação | Sim | Sim (só se for o vinculado) | Não |
| Adicionar/editar/remover funcionário | Sim | Sim (só se for o vinculado) | Não |

## Fora de escopo (para depois)

- RFV real / cálculo automático de score.
- Tela de cadastro/edição de Cliente no frontend (e, por consequência, o clique no nome do
  cliente vinculado permanecer não-clicável até essa tela existir).
- Tornar tipos de interação configuráveis pelo admin.
- Renomear model/tabela/endpoint de `Arquiteto` para `Especificador` internamente.
