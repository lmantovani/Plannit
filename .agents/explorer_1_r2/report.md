# Relatório de Investigação Técnica — Requisito R1

**Data:** 2026-09-11  
**Investigador:** Explorer 1 (R2)  
**Escopo:** Requisito R1 — Integração Relacional de Especificadores/Parceiros no Briefing e Projetos  
**Repositório:** `/home/porto/codespace/Plannit/plannit`  
**Stack:** AdonisJS v7, Lucid ORM, PostgreSQL, Inertia.js, React 19, TypeScript  

---

## 1. Sumário Executivo

O requisito **R1** visa integrar relacionalmente a gestão de Especificadores (Arquitetos, Designers de Interiores e Decoradores) com o módulo de Briefings e Projetos.
Especificamente:
1. Na **Seção 6** de `inertia/pages/briefings/edit.tsx`, permitir a seleção de parceiros cadastrados na tabela `arquitetos` com auto-preenchimento instantâneo dos dados de contato (Nome, Escritório, E-mail e Telefone).
2. Fornecer uma opção de cadastro rápido de novo parceiro via modal inline sem recarregar a página e sem perder os dados já preenchidos no rascunho do briefing.
3. Em `app/controllers/briefings_controller.ts` (`edit` e `update`) e `app/validators/briefing.ts`, receber `arquitetoId` e sincronizar de forma íntegra em `projetos.arquiteto_id` e `projetos.arquiteto_nome`.

A investigação identificou uma inconsistência crítica no código atual:
- O backend (`briefings_controller.ts:edit`) **já busca e envia** `especificadores` e `consultores` nas props do Inertia, e o model `Projeto` já possui a foreign key `arquitetoId`.
- No entanto, o frontend (`edit.tsx`) **ignora essas props**, não define `arquitetoId` no seu estado nem na tipagem de `BriefingData`, e exibe na Seção 6 apenas três campos de texto avulsos.
- Pior: ao salvar o briefing (`handleSave`), `edit.tsx` **não envia `arquitetoId`**, fazendo com que `briefings_controller.ts:update` execute `projeto.arquitetoId = payload.arquitetoId ?? null`, **limpando qualquer vínculo pré-existente de `projetos.arquiteto_id` no banco de dados**.

---

## 2. Mapeamento Arquitetural de Domínio e Banco de Dados

### 2.1 Esquema de Dados e Relacionamentos

```
┌─────────────────────────────────┐           ┌──────────────────────────────────┐
│           arquitetos            │           │             projetos             │
├─────────────────────────────────┤           ├──────────────────────────────────┤
│ id (PK)                         │◄──────────│ arquiteto_id (FK, nullable)      │
│ nome                            │           │ arquiteto_nome (VARCHAR 200)     │
│ escritorio                      │           │ cliente_id (FK, nullable)        │
│ telefone (VARCHAR 30)           │           │ cliente_nome                     │
│ email (VARCHAR 200)             │           │ status                           │
│ is_active (BOOLEAN)             │           │ ...                              │
└─────────────────────────────────┘           └──────────────────────────────────┘
                                                               ▲
                                                               │ 1:1
                                                               │ (projeto_id)
                                              ┌────────────────┴─────────────────┐
                                              │            briefings             │
                                              ├──────────────────────────────────┤
                                              │ id (PK)                          │
                                              │ projeto_id (FK, unique)          │
                                              │ arquiteto_nome (snapshot)        │
                                              │ arquiteto_email (snapshot)       │
                                              │ arquiteto_telefone (snapshot)    │
                                              │ score                            │
                                              │ score_minimo                     │
                                              │ status                           │
                                              └──────────────────────────────────┘
```

#### Observações sobre o Schema:
- **`projetos`**: Possui a chave estrangeira `arquiteto_id` referenciando `arquitetos.id` com `onDelete('SET NULL')`, criada na migration `1761885935178_add_arquiteto_id_to_projetos_and_leads.ts`. Também possui a coluna `arquiteto_nome` (VARCHAR 200).
- **`briefings`**: Tabela operacional de levantamento comercial (migration `1761885935172_create_briefings_table.ts`). Armazena os campos de snapshot: `arquiteto_nome`, `arquiteto_email` e `arquiteto_telefone`. **Não possui coluna `arquiteto_id`**. O vínculo relacional formal é mantido estritamente em `projetos.arquiteto_id`.
- **`arquitetos`**: Criada na migration `1761885935177_create_arquitetos_tables.ts`. Possui `id`, `nome`, `escritorio`, `telefone`, `email`, `tipo`, `nivel_parceria`, `is_active`, `consultor_id`.

### 2.2 Modelos Lucid ORM

| Arquivo | Modelo | Relacionamentos e Colunas Relevantes |
|---|---|---|
| `app/models/arquiteto.ts` | `Arquiteto` | `@hasMany(() => Projeto, { foreignKey: 'arquitetoId' })` |
| `app/models/projeto.ts` | `Projeto` | `@belongsTo(() => Arquiteto, { foreignKey: 'arquitetoId' })` declare arquiteto: BelongsTo<typeof Arquiteto><br>`@hasOne(() => Briefing, { foreignKey: 'projetoId' })` declare briefing: HasOne<typeof Briefing> |
| `app/models/briefing.ts` | `Briefing` | `@belongsTo(() => Projeto, { foreignKey: 'projetoId' })` declare projeto: BelongsTo<typeof Projeto><br>Colunas: `arquitetoNome`, `arquitetoEmail`, `arquitetoTelefone` |

---

## 3. Análise Detalhada dos Componentes

### 3.1 `app/controllers/briefings_controller.ts`

#### Método `edit` (Linhas 139–271):
- **Comportamento atual:**
  ```typescript
  // Linhas 161-172: Já busca os especificadores ativos e os consultores
  const especificadores = await Arquiteto.query()
    .where('is_active', true)
    .select('id', 'nome', 'escritorio', 'telefone', 'email', 'tipo', 'nivelParceria')
    .orderBy('nome', 'asc')

  const consultores = await User.query()
    .where('is_active', true)
    .select('id', 'nome', 'email')
    .orderBy('nome', 'asc')
  ```
  E entrega nas props de `inertia.render('briefings/edit', ...)`:
  - `briefing.arquitetoId: briefing.projeto?.arquitetoId || null`
  - `briefing.arquitetoNome: briefing.arquitetoNome || briefing.projeto?.arquiteto?.nome || ''`
  - `briefing.arquitetoEmail: briefing.arquitetoEmail || briefing.projeto?.arquiteto?.email || ''`
  - `briefing.arquitetoTelefone: briefing.arquitetoTelefone || briefing.projeto?.arquiteto?.telefone || ''`
  - `especificadores: [...]`
  - `consultores: [...]`

- **Avaliação:** O método `edit` já está bem estruturado. Precisa apenas assegurar que `briefing.arquitetoId` seja devidamente consumido pelo frontend.

#### Método `update` (Linhas 364–444):
- **Comportamento atual:**
  ```typescript
  const payload = await request.validateUsing(saveBriefingValidator)

  await db.transaction(async (trx) => {
    briefing.useTransaction(trx)
    // ...
    briefing.arquitetoNome = payload.arquitetoNome ?? null
    briefing.arquitetoEmail = payload.arquitetoEmail ?? null
    briefing.arquitetoTelefone = payload.arquitetoTelefone ?? null

    // Sincroniza o arquiteto no projeto associado
    const projeto = await Projeto.query({ client: trx }).where('id', briefing.projetoId).first()
    if (projeto) {
      projeto.arquitetoId = payload.arquitetoId ?? null
      projeto.arquitetoNome = payload.arquitetoNome ?? null
      await projeto.save()
    }
    // ...
  ```
- **Vulnerabilidade Identificada:**
  1. Se o payload não enviar `arquitetoId` (como ocorre atualmente no frontend), `payload.arquitetoId` é `undefined`. O operador `??` atribui `null`, apagando `projeto.arquitetoId`.
  2. Se o usuário selecionou um `arquitetoId` mas deixou `arquitetoNome` em branco (ou omitiu), `projeto.arquitetoNome` ficaria nulo. O backend deve preencher defensivamente o nome a partir da tabela `arquitetos`.

### 3.2 `app/validators/briefing.ts`

- **Estado atual:**
  ```typescript
  export const saveBriefingValidator = vine.create({
    // ...
    arquitetoId: vine.number().positive().nullable().optional(),
    arquitetoNome: vine.string().trim().maxLength(200).nullable().optional(),
    arquitetoEmail: vine.string().trim().email().nullable().optional(),
    arquitetoTelefone: vine.string().trim().maxLength(20).nullable().optional(),
    // ...
  })
  ```
- **Inconsistências Encontradas:**
  1. `arquitetoTelefone`: `maxLength(20)`. No schema do banco (`briefings.arquiteto_telefone` e `arquitetos.telefone`) o tamanho é `VARCHAR(30)`. No validator de especificadores (`app/validators/arquiteto.ts`), é `maxLength(30)`. Telefones com DDI ou ramal formatados podem ter até 30 caracteres e ser rejeitados se o limite for 20. Deve ser ajustado para `maxLength(30)`.
  2. Tratamento de e-mail vazio: Vine valida `.email()` mesmo que seja string vazia `""` se não for convertido para `null`. O frontend deve converter `""` em `null` antes de submeter, ou o validator deve lidar com nullable de forma tolerante.

### 3.3 `inertia/pages/briefings/edit.tsx`

#### 1. Tipagem e Props
- A interface `PageProps` e o tipo `BriefingData` não incluem `arquitetoId`, `especificadores` nem `consultores`:
  ```typescript
  // ATUAL
  type BriefingData = {
    // ...
    arquitetoNome: string
    arquitetoEmail: string
    arquitetoTelefone: string
    // falta arquitetoId!
  }

  type PageProps = {
    briefing: BriefingData
    scoreBreakdown: ...
    // faltam especificadores e consultores!
  }
  ```

#### 2. Estado do Formulário (`formData`)
- Não inicializa `arquitetoId`:
  ```typescript
  // ATUAL
  const [formData, setFormData] = useState({
    // ...
    arquitetoNome: briefing.arquitetoNome || '',
    arquitetoEmail: briefing.arquitetoEmail || '',
    arquitetoTelefone: briefing.arquitetoTelefone || '',
    // falta arquitetoId!
  })
  ```

#### 3. Salvamento do Formulário (`handleSave` e `handleEnviarFila`)
- Não enviam `arquitetoId` no payload:
  ```typescript
  // ATUAL (Linha 187-204 e 227-244)
  router.put(`/briefings/${briefing.id}`, {
    // ...
    arquitetoNome: formData.arquitetoNome || null,
    arquitetoEmail: formData.arquitetoEmail || null,
    arquitetoTelefone: formData.arquitetoTelefone || null,
    // falta arquitetoId: formData.arquitetoId ? Number(formData.arquitetoId) : null!
  })
  ```

#### 4. Seção 6 — Interface de Usuário
- Não possui componente de seleção (`<select>` ou combobox).
- Não possui botão para abertura de modal de cadastro rápido.
- Não possui auto-preenchimento ao selecionar parceiro da lista.

#### 5. Requisito de "Cadastro Rápido via Modal sem Recarregar a Tela (sem Perda de Rascunho)"
- Se o modal utilizar `router.post('/especificadores')` do Inertia, pode disparar ciclo de render/reload de página, arriscando descartar rascunhos não salvos pelo usuário nos outros 5 blocos do formulário.
- **Solução Arquitetural:**
  - O endpoint `POST /especificadores` (`ArquitetosController.store`) possui suporte nativo a JSON via método `wantsJson(request)` (linhas 32-37 e 321-323 de `arquitetos_controller.ts`):
    ```typescript
    if (this.wantsJson(request)) {
      return response.status(201).json(arquiteto)
    }
    ```
  - Ao realizar uma requisição AJAX (`fetch` ou `axios`) com header `Accept: application/json` e token `X-XSRF-TOKEN`:
    1. O Adonis processa e insere o arquiteto na tabela `arquitetos` dentro de transação atômica e registra o histórico inicial.
    2. Retorna resposta HTTP 201 com o payload JSON do arquiteto recém-criado.
    3. O frontend do briefing captura a resposta, adiciona o novo registro à lista local de especificadores, seleciona-o como `arquitetoId` ativo e auto-preenche os campos de contato (`arquitetoNome`, `arquitetoEmail`, `arquitetoTelefone`).
    4. O modal é fechado e exibe toast de sucesso.
    5. **Zero recarregamento de página: 100% dos dados em edição nos outros blocos continuam estritamente preservados.**

---

## 4. Proposta de Alterações Técnicas Estruturadas

### 4.1 Modificações em `app/validators/briefing.ts`
- Alterar `arquitetoTelefone` para `maxLength(30)` em `saveBriefingValidator` e `calcularScoreValidator`:
```typescript
arquitetoTelefone: vine.string().trim().maxLength(30).nullable().optional(),
```

### 4.2 Modificações em `app/controllers/briefings_controller.ts`
No método `update`:
- Garantir a sincronização segura de `arquitetoId` e `arquitetoNome`:
```typescript
// Sincroniza o arquiteto no projeto associado
const projeto = await Projeto.query({ client: trx }).where('id', briefing.projetoId).first()
if (projeto) {
  let arqNome = payload.arquitetoNome ?? null
  if (payload.arquitetoId && !arqNome) {
    const arq = await Arquiteto.find(payload.arquitetoId, { client: trx })
    if (arq) {
      arqNome = arq.nome
      if (!briefing.arquitetoNome) briefing.arquitetoNome = arq.nome
      if (!briefing.arquitetoEmail) briefing.arquitetoEmail = arq.email
      if (!briefing.arquitetoTelefone) briefing.arquitetoTelefone = arq.telefone
    }
  }
  if (payload.arquitetoId !== undefined) {
    projeto.arquitetoId = payload.arquitetoId ?? null
  }
  projeto.arquitetoNome = arqNome
  await projeto.save()
}
```

### 4.3 Modificações em `inertia/pages/briefings/edit.tsx`

#### 1. Tipagem
```typescript
type EspecificadorOption = {
  id: number
  nome: string
  escritorio: string | null
  telefone: string | null
  email: string | null
  tipo: string
  nivelParceria: string
}

type ConsultorOption = {
  id: number
  nome: string
  email: string
}

type BriefingData = {
  // ...
  arquitetoId: number | null
  arquitetoNome: string
  arquitetoEmail: string
  arquitetoTelefone: string
  // ...
}

type PageProps = {
  briefing: BriefingData
  scoreBreakdown: any
  especificadores?: EspecificadorOption[]
  consultores?: ConsultorOption[]
}
```

#### 2. Estado e Manipulação
```typescript
const BriefingEdit: React.FC<PageProps> = ({
  briefing,
  especificadores = [],
  consultores = [],
}) => {
  const [listaEspecificadores, setListaEspecificadores] = useState<EspecificadorOption[]>(especificadores)
  const [modalNovoArquitetoOpen, setModalNovoArquitetoOpen] = useState(false)

  const [formData, setFormData] = useState({
    // ...
    arquitetoId: briefing.arquitetoId ?? briefing.projeto?.arquitetoId ?? null,
    arquitetoNome: briefing.arquitetoNome || '',
    arquitetoEmail: briefing.arquitetoEmail || '',
    arquitetoTelefone: briefing.arquitetoTelefone || '',
    // ...
  })

  // Manipulador de seleção de especificador com auto-preenchimento
  const handleSelectEspecificador = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value
    if (!val) {
      setFormData((prev) => ({
        ...prev,
        arquitetoId: null,
      }))
      return
    }

    const selectedId = Number(val)
    const arq = listaEspecificadores.find((item) => item.id === selectedId)
    if (arq) {
      setFormData((prev) => ({
        ...prev,
        arquitetoId: arq.id,
        arquitetoNome: arq.nome,
        arquitetoEmail: arq.email || '',
        arquitetoTelefone: arq.telefone || '',
      }))
    }
  }

  // Callback de sucesso do modal rápido
  const handleArquitetoCriado = (novoArq: EspecificadorOption) => {
    setListaEspecificadores((prev) => [...prev, novoArq].sort((a, b) => a.nome.localeCompare(b.nome)))
    setFormData((prev) => ({
      ...prev,
      arquitetoId: novoArq.id,
      arquitetoNome: novoArq.nome,
      arquitetoEmail: novoArq.email || '',
      arquitetoTelefone: novoArq.telefone || '',
    }))
    setModalNovoArquitetoOpen(false)
  }
```

#### 3. Payload em `handleSave` e `handleEnviarFila`
```typescript
arquitetoId: formData.arquitetoId ? Number(formData.arquitetoId) : null,
arquitetoNome: formData.arquitetoNome || null,
arquitetoEmail: formData.arquitetoEmail || null,
arquitetoTelefone: formData.arquitetoTelefone || null,
```

#### 4. Interface da Seção 6
- Seletor de parceiro com indicação de escritório e nível de parceria.
- Botão "Cadastrar Rápido / + Novo Parceiro" que abre o modal inline.
- Campos de Nome, E-mail e Telefone auto-preenchidos, com indicador visual de sincronização relacional.
- Modal de criação rápida submetendo via `fetch('/especificadores?format=json', ...)` com `Accept: application/json` e `X-XSRF-TOKEN` obtido de cookie, garantindo zero recarregamento e zero perda de rascunho.

---

## 5. Rastreabilidade e Critérios de Aceitação

| Critério de Aceitação | Mecanismo de Verificação | Status Atual |
|---|---|---|
| Seção 6 permite escolher parceiro da tabela `arquitetos` | Dropdown populado por `props.especificadores` | ❌ Ausente no frontend |
| Auto-preenchimento de Nome, Escritório, E-mail e Telefone | Handler `onChange` no select atualizando `formData` | ❌ Ausente no frontend |
| Cadastro rápido sem recarregar tela e sem perda de rascunho | Modal inline via AJAX (`Accept: application/json`) | ❌ Ausente no frontend |
| Persistência e sincronização de `arquitetoId` em `projetos.arquiteto_id` | `briefings_controller.ts:update` gravando na tabela `projetos` | ⚠️ Backend suporta, mas frontend não envia `arquitetoId` (causando deleção) |
| Tipagem e compilação sem erros (`npm run typecheck` e `npm run build`) | Execução de tsc e vite | ✅ Ambos passam atualmente |

---

## 6. Conclusão da Investigação

O backend do Plannit já dispõe da infraestrutura relacional necessária para o requisito R1 (models, migrations, endpoints JSON, preloads e validações). O gargalo encontra-se concentrado na desconexão entre as props fornecidas pelo backend e a interface de `inertia/pages/briefings/edit.tsx`.
A implementação das correções delineadas nesta investigação restabelece a integridade relacional, elimina o bug de perda de `arquiteto_id` no salvamento e entrega uma experiência fluida de cadastro sem perda de rascunhos para os consultores de venda.
