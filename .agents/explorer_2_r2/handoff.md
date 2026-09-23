# Handoff Report — Explorer 2 (R2)

**Data:** 2026-09-11T18:25:00Z  
**Origem:** Explorer 2 (R2) — Reposição (`.agents/explorer_2_r2`)  
**Destino:** Orchestrator R2 (`2234a5b6-5818-4550-b8cb-1eaacedae0e7`)  
**Assunto:** Investigação estática completa dos Requisitos R2 e R3 (Plannit AdonisJS v7)  

---

## 1. Observation

### Observação 1 — Conversão de Lead não vincula Projetos ao Cliente
- **Arquivo:** `plannit/app/controllers/clientes_controller.ts`
- **Linhas 294 a 326:**
  ```typescript
  async converterLead({ params, request, response, session }: HttpContext) {
    const lead = await Lead.find(params.leadId)
    if (!lead) {
      session.flash('error', 'Lead não encontrado')
      return response.redirect().back()
    }

    const payload = await request.validateUsing(createClienteValidator)

    const { endereco, ...dadosCliente } = payload

    const cliente = await Cliente.create({
      ...dadosCliente,
      arquitetoId: lead.arquitetoId || dadosCliente.arquitetoId,
    })

    if (endereco && endereco.logradouro) {
      await EnderecoCliente.create({
        clienteId: cliente.id,
        ...endereco,
        isPrincipal: true,
      })
    }

    // Atualiza o Lead no funil
    lead.convertidoEmCliente = true
    lead.clienteId = cliente.id
    lead.statusFunil = 'fechado'
    await lead.save()

    session.flash('success', `Lead ${lead.nome} convertido com sucesso em Cliente!`)
    return response.redirect().toRoute('clientes.show', { id: cliente.id })
  }
  ```
- **Fato observado:** Não existe nenhuma instrução atualizando a tabela `projetos` com `cliente_id = cliente.id` para os registros cujo `lead_id = lead.id`. Além disso, `Projeto` não está importado no arquivo.

### Observação 2 — Criação de Projeto no Briefing não associa nem cria Cliente
- **Arquivo:** `plannit/app/controllers/briefings_controller.ts`
- **Linhas 311 a 320:**
  ```typescript
      projeto = await Projeto.create({
        codigo,
        clienteNome: clienteNome.trim(),
        leadId: leadId ? Number(leadId) : null,
        vendedorId: user.id,
        status: StatusProjeto.EM_BRIEFING,
        arquivado: false,
        alertaParado: false,
        statusAlteradoEm: DateTime.now(),
      })
  ```
- **Fato observado:** O campo `clienteId` é omitido na criação do `Projeto`. Nenhum registro em `Cliente` é buscado ou instanciado. Os models `Cliente` e `Lead` não estão importados em `briefings_controller.ts`.

### Observação 3 — Envio para a Fila não grava auditoria imutável (RN017)
- **Arquivo:** `plannit/app/controllers/briefings_controller.ts`
- **Linhas 449 a 529:**
  ```typescript
  async enviarParaFila({ params, response, session }: HttpContext) {
  ...
      // Atualiza status do projeto para NA_FILA
      if (briefing.projeto) {
        briefing.projeto.useTransaction(trx)
        briefing.projeto.status = StatusProjeto.NA_FILA
        briefing.projeto.statusAlteradoEm = DateTime.now()
        await briefing.projeto.save()
      }
    })
  ```
- **Fato observado:** O método altera o status do projeto para `NA_FILA`, mas **não chama** `HistoricoStatusProjeto.create`. O parâmetro `auth` não consta na assinatura do método (`{ params, response, session }: HttpContext`), impossibilitando a captura de `auth.user.id`.

### Observação 4 — Relação e Exibição de Projetos no Cliente
- **Arquivo:** `plannit/app/models/cliente.ts` (linhas 22 a 25):
  ```typescript
  @hasMany(() => Projeto, {
    foreignKey: 'clienteId',
  })
  declare projetos: HasMany<typeof Projeto>
  ```
- **Arquivo:** `plannit/app/controllers/clientes_controller.ts` (linhas 137 a 143):
  ```typescript
      .preload('projetos', (q) => {
        q.preload('vendedor')
          .preload('projetista')
          .preload('briefing')
          .orderBy('createdAt', 'desc')
      })
  ```
- **Fato observado:** A ficha do cliente (`/clientes/:id`) depende estritamente da chave estrangeira `projetos.cliente_id`. Se os projetos do lead não forem atualizados na conversão, a ficha do cliente sempre exibirá 0 projetos e total de compras R$ 0,00.

---

## 2. Logic Chain

1. **Premissa 1 (R2 - Projetos de Leads):** Quando um lead é qualificado e tem um ou mais projetos iniciados nas etapas preliminares do funil, esses projetos são instanciados com `lead_id = lead.id` e `cliente_id = null`.
2. **Premissa 2 (R2 - Conversão):** Ao converter o lead via `ClientesController.converterLead`, uma nova tupla é inserida na tabela `clientes` com `id = X`. O `lead` é atualizado para `cliente_id = X`.
3. **Inferência 1 (R2 - Inconsistência):** Conforme Observação 1, os projetos associados a esse lead continuam com `cliente_id = null`. Consequentemente, conforme Observação 4, `Cliente.projetos` falha em associá-los, rompendo o histórico de compras do cliente na esteira comercial e de produção.
4. **Premissa 3 (R2 - Criação de Projeto):** Conforme Observação 2, quando um projeto é criado pelo modal de novo projeto/briefing via `BriefingsController.store`, `clienteId` nunca é informado no `Projeto.create`, gerando projetos sem vínculo com a tabela `clientes`.
5. **Premissa 4 (R3 - Regra RN017):** A regra RN017 determina que toda e qualquer transição de status de projeto deve ser imutável e auditável através da tabela `historico_status_projeto`, contendo `projetoId`, `statusDe`, `statusPara`, `alteradoPorId` e justificativa.
6. **Inferência 2 (R3 - Quebra de Auditoria e SLA):** Conforme Observação 3, o método `enviarParaFila` atualiza `briefing.projeto.status` para `na_fila`, mas omite a gravação em `HistoricoStatusProjeto`. Isso impede o rastreamento do SLA da transição de briefing para fila e omite esse marco da timeline exibida na Sala de Controle (`ProjetosController.show`).

---

## 3. Caveats

- **Ambiente de Testes:** Não foram executados testes dinâmicos ou comandos shell (`run_command`), em cumprimento estrito à regra crítica de análise estática.
- **Formulário de Criação de Projetos:** Os modais em `inertia/pages/projetos/index.tsx` e `inertia/pages/briefings/index.tsx` solicitam apenas `clienteNome`. Não há campos de telefone/documento nesses modais, exigindo que o backend use valores de fallback caso o cliente ainda não exista e não haja `leadId` associado.
- **Transações Atômicas:** A execução de `Projeto.query().where('lead_id', lead.id).update({ cliente_id: cliente.id })` deve ser executada dentro da transação `db.transaction` para garantir atomicidade.

---

## 4. Conclusion

A implementação dos requisitos R2 e R3 exige intervenções pontuais e cirúrgicas em apenas dois arquivos do backend:

1. **`app/controllers/clientes_controller.ts`**:
   - Importar `db` e `Projeto`.
   - Em `converterLead`: envolver em `db.transaction`, validar `lead.qualificado` (RN001 / R5) e executar `await Projeto.query({ client: trx }).where('lead_id', lead.id).update({ cliente_id: cliente.id })`.
2. **`app/controllers/briefings_controller.ts`**:
   - Importar `Cliente` e `Lead`.
   - Em `store`: validar `lead.qualificado` caso `leadId` seja passado; resolver ou criar entidade `Cliente` e popular `clienteId: cliente.id` em `Projeto.create`.
   - Em `enviarParaFila`: desestruturar `auth` no `HttpContext` e gravar registro imutável em `HistoricoStatusProjeto` (`statusDe: statusAnterior`, `statusPara: StatusProjeto.NA_FILA`, `alteradoPorId: user.id`, com observação descritiva).

Os modelos (`Cliente`, `Projeto`, `Lead`, `HistoricoStatusProjeto`) e as migrations do PostgreSQL já contêm todas as colunas necessárias (`cliente_id`, `lead_id`, `alterado_por_id`, etc.), não demandando nenhuma alteração de schema ou novas migrations de banco.

---

## 5. Verification Method

Para validação independente por parte dos revisores e implementadores:

1. **Verificação de Tipagem TypeScript:**
   ```bash
   npm run typecheck
   ```
   Deve retornar 0 erros tanto no AdonisJS quanto no Inertia.

2. **Verificação de Integridade de Clientes (R2):**
   - Executar seeder ou script de teste onde um lead com projeto é convertido em cliente via `POST /clientes/converter-lead/:leadId`.
   - Inspecionar banco:
     ```sql
     SELECT id, codigo, cliente_id, lead_id FROM projetos WHERE lead_id = <leadId>;
     ```
     O campo `cliente_id` deve ser preenchido com o ID do cliente recém-criado.
   - Acessar `GET /clientes/<clienteId>` e verificar se a lista `props.cliente.projetos` contém os projetos associados.

3. **Verificação de Auditoria Imutável (R3 - RN017):**
   - Submeter envio de briefing com score >= 70 via `POST /briefings/:id/enviar-para-fila`.
   - Inspecionar banco:
     ```sql
     SELECT * FROM historico_status_projeto WHERE projeto_id = <projetoId> ORDER BY created_at DESC LIMIT 1;
     ```
     Deve retornar `status_de = 'em_briefing'`, `status_para = 'na_fila'`, `alterado_por_id` preenchido e observação descritiva.
