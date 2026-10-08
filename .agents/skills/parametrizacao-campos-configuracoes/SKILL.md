---
name: parametrizacao-campos-configuracoes
description: >-
  Use esta skill sempre que planejar, modelar ou implementar campos de tipos, categorias, enums,
  classificações ou listas de seleção no Plannit. A skill garante que o agente consulte o usuário
  sobre transformar o campo em um catálogo parametrizável na aba de Configurações (/configuracoes),
  mantendo o sistema flexível e personalizável.
---

# Parametrização de Campos no Catálogo de Configurações

Esta skill define o padrão de arquitetura do Plannit para campos de seleção, tipos, categorias e enums, garantindo que o sistema seja altamente personalizável e administrável pelos gestores (Diretoria e Gerente Comercial).

Esta skill cobre a decisão e a criação do catálogo. As telas que **usam** o catálogo (sincronização com Configurações, validação contra itens ativos, atalhos para gestores, cadastro rápido) seguem a skill complementar `sincronizacao-catalogos-configuracoes`.

## 🎯 Regra de Ouro: Consulta Obrigatória

Sempre que surgir uma nova funcionalidade, tabela ou formulário que demande um campo com opções pré-definidas (exemplos: **tipos de compromisso da agenda**, **motivos de perda de lead**, **fases/etapas**, **tipos de tarefas**, **categorias operacionais**), o agente **NÃO deve assumir um `enum` estático chumbado no código**.

O agente deve:
1. **Identificar os valores sugeridos/iniciais** para o campo.
2. **Consultar o usuário explicitamente**, perguntando se prefere que o campo seja gerenciável dinamicamente na aba de **Configurações** (`/configuracoes`) ou se deve permanecer estático.

---

## 🛠️ Padrão de Implementação para Campos Parametrizáveis

Quando o usuário optar pela parametrização (ou quando o padrão do módulo exigir), siga estritamente o padrão já consagrado de tabelas de apoio do Plannit (como `ambientes_catalogo`, `origens_lead_catalogo` e `campanhas_lead`):

### 1. Modelagem no Banco de Dados (PostgreSQL / Lucid ORM)
* Tabela de catálogo dedicada: ex. `<nome_entidade>_catalogo` ou `tipos_<entidade>` contendo:
  * `id`: serial / integer primary key
  * `nome`: string (rótulo exibido para os usuários)
  * `slug` ou `codigo`: string único para identificação no sistema
  * `categoria` (se aplicável): agrupador visual
  * `is_active`: boolean (padrão `true`) para permitir desativação sem deleção física
  * `ordem`: integer (para ordenação customizada nas telas)
  * `created_at` e `updated_at`: timestamps com timezone UTC
* Na tabela consumidora:
  * Armazenar a referência (FK para `id` ou string `slug`), garantindo integridade.

### 2. Backend & Controller (`configuracoes_controller.ts`)
* Adicionar os endpoints CRUD dentro do módulo de configurações:
  * `GET /configuracoes`: carrega a lista do catálogo na view Inertia.
  * `POST /configuracoes/<entidade>`: criação com VineJS validator.
  * `PUT/PATCH /configuracoes/<entidade>/:id`: atualização de nome, categoria, ordem.
  * `PATCH /configuracoes/<entidade>/:id/toggle`: alternar status ativo/inativo.
  * `DELETE /configuracoes/<entidade>/:id`: soft delete ou exclusão protegida.
* Garantir acesso restrito via middleware e helpers de perfil (`DIRETORIA` e `GERENTE_COMERCIAL`).

### 3. Frontend em Configurações (`inertia/pages/configuracoes/index.tsx`)
* Criar uma nova aba correspondente (com contagem de ativos/cadastrados).
* Renderizar a tabela padronizada com colunas: Ordem, Nome, Categoria/Slug, Status (`Ativo`/`Inativo`), e Ações (Editar, Ativar/Desativar).
* Modal de criação e edição seguindo o design system (Playfair Display, botões `.btn-primary`, toasts `sonner`).

### 4. Consumo nos Formulários e Modais do Sistema
* O passo a passo completo desta etapa, com exemplos de código, está na skill `sincronizacao-catalogos-configuracoes` — siga aquela skill ao implementar o consumo; os itens abaixo são só o resumo.
* No formulário ou modal que consome o campo (ex: modal de novo lead, modal de agendamento):
  * Carregar apenas as opções ativas (`is_active = true`), ordenadas por `ordem` / `nome`.
  * Se o usuário for gestor (`canManageConfig`), exibir o link rápido **"Configurar ↗"** que abre `/configuracoes?tab=<slug>` em uma nova aba.
  * Incluir o botão e listener de **sincronização cross-tab** (`window.addEventListener('storage')` e `window.focus`), para que qualquer alteração feita na aba de configurações reflita instantaneamente no modal aberto.

### 5. Seeder Idempotente
* Criar ou atualizar o seeder correspondente para garantir que novas instâncias de homologação/produção já nasçam com os valores padrão funcionais.

