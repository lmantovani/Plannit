# Handoff Report — Explorer 1 (R2)

## 1. Observation

Durante a investigação detalhada do código-fonte para o **Requisito R1: Integração Relacional de Especificadores/Parceiros no Briefing e Projetos**, foram observados os seguintes fatos:

1. **Modelos e Migrations:**
   - Em `database/migrations/1761885935178_add_arquiteto_id_to_projetos_and_leads.ts` (linhas 6–16), a coluna `arquiteto_id` existe na tabela `projetos` como chave estrangeira apontando para `arquitetos.id` com `onDelete('SET NULL')` e índice.
   - Em `app/models/projeto.ts` (linhas 126–129), o modelo `Projeto` define o relacionamento:
     ```typescript
     @belongsTo(() => Arquiteto, { foreignKey: 'arquitetoId' })
     declare arquiteto: BelongsTo<typeof Arquiteto>
     ```
   - Em `database/migrations/1761885935172_create_briefings_table.ts` (linhas 31–33), a tabela `briefings` possui apenas as colunas snapshot: `arquiteto_nome` (VARCHAR 200), `arquiteto_email` (VARCHAR 200) e `arquiteto_telefone` (VARCHAR 30). Não há chave estrangeira `arquiteto_id` na tabela `briefings`; ela reside exclusivamente na tabela `projetos`.
   - Em `app/models/arquiteto.ts` (linhas 54–77), o modelo `Arquiteto` define `@hasMany(() => Projeto, { foreignKey: 'arquitetoId' })`.

2. **Controller de Briefings (`app/controllers/briefings_controller.ts`):**
   - No método `edit` (linhas 161–172 e 256–269), a query já busca arquitetos ativos (`Arquiteto.query().where('is_active', true)`) e consultores ativos, e passa como props para o Inertia (`especificadores` e `consultores`), além de incluir `arquitetoId: briefing.projeto?.arquitetoId || null` no objeto `briefing` (linha 209).
   - No método `update` (linhas 375–401), o backend valida os dados com `saveBriefingValidator`, atualiza `briefing.arquitetoNome/Email/Telefone` e executa:
     ```typescript
     const projeto = await Projeto.query({ client: trx }).where('id', briefing.projetoId).first()
     if (projeto) {
       projeto.arquitetoId = payload.arquitetoId ?? null
       projeto.arquitetoNome = payload.arquitetoNome ?? null
       await projeto.save()
     }
     ```

3. **Validador de Briefing (`app/validators/briefing.ts`):**
   - Linha 21: `arquitetoId: vine.number().positive().nullable().optional()`.
   - Linha 24: `arquitetoTelefone: vine.string().trim().maxLength(20).nullable().optional()`. (No banco e em `arquiteto.ts`, o limite é 30).

4. **Frontend (`inertia/pages/briefings/edit.tsx`):**
   - Nas tipagens `BriefingData` (linhas 39–69) e `PageProps` (linhas 71–80), as propriedades `arquitetoId`, `especificadores` e `consultores` **não estão declaradas**.
   - Na assinatura do componente `const BriefingEdit: React.FC<PageProps> = ({ briefing })` (linha 82), as props `especificadores` e `consultores` **são ignoradas**.
   - No estado local `formData` (linhas 84–99), o campo `arquitetoId` **não existe**.
   - Nos métodos de submissão `handleSave` (linhas 187–208) e `handleEnviarFila` (linhas 227–254), o campo `arquitetoId` **não é enviado no payload**. Como resultado, `payload.arquitetoId` chega como `undefined` e a linha 398 de `briefings_controller.ts` sobrescreve `projeto.arquitetoId` com `null`.
   - Na Seção 6 (linhas 704–750), a interface exibe apenas três campos de texto avulsos (`arquitetoNome`, `arquitetoEmail`, `arquitetoTelefone`). Não há elemento `<select>`, não há auto-preenchimento e não há botão/modal de cadastro rápido.

5. **Endpoint de Criação de Especificadores (`app/controllers/arquitetos_controller.ts`):**
   - O método `store` (linhas 277–327) possui suporte nativo a JSON via `wantsJson(request)` (linhas 32–37):
     ```typescript
     if (this.wantsJson(request)) {
       return response.status(201).json(arquiteto)
     }
     ```
   - Uma chamada AJAX (`fetch` ou `axios`) com header `Accept: application/json` e token CSRF `X-XSRF-TOKEN` responde com status HTTP 201 e o objeto JSON do arquiteto criado, sem qualquer redirecionamento ou reload de página Inertia.

---

## 2. Logic Chain

1. **Premissa 1:** O requisito R1 exige selecionar parceiros da tabela `arquitetos` na Seção 6 com auto-preenchimento de Nome, Escritório, E-mail e Telefone, e sincronizar em `projetos.arquiteto_id`.
2. **Premissa 2:** O controller `briefings_controller.ts:edit` já recupera `especificadores` e `consultores` ativos e os entrega para o Inertia, mas o frontend `edit.tsx` não os recebe em sua lista de props.
3. **Premissa 3:** Como `edit.tsx` não mapeia `arquitetoId` no seu estado nem o envia em `handleSave`, qualquer salvamento de rascunho dispara `projeto.arquitetoId = payload.arquitetoId ?? null`, apagando qualquer associação prévia de `projetos.arquiteto_id` (bug silencioso de deleção relacional).
4. **Premissa 4:** Para atender o requisito de cadastro rápido "sem recarregar a tela (sem perda de rascunho)", o modal não pode utilizar o fluxo padrão de navegação do Inertia (`router.post`), pois um reload de página ou falha de redirect descartaria os dados não salvos nas Seções 1 a 5 (ambientes, medidas, observações).
5. **Premissa 5:** Como `ArquitetosController.store` já responde com status HTTP 201 JSON quando recebe `Accept: application/json`, o modal rápido pode submeter via AJAX diretamente. Ao receber a resposta 201, o frontend insere o arquiteto na lista local `listaEspecificadores`, define `formData.arquitetoId`, auto-preenche os dados de contato e fecha o modal.
6. **Conclusão Lógica:** A implementação de R1 requer ajustes coordenados:
   - Em `app/validators/briefing.ts`: Ajustar `arquitetoTelefone` para `maxLength(30)`.
   - Em `app/controllers/briefings_controller.ts`: Reforçar `update` para sincronizar `projeto.arquitetoId` defensivamente.
   - Em `inertia/pages/briefings/edit.tsx`: Adicionar tipagens, receber `especificadores` e `consultores`, gerenciar `formData.arquitetoId`, implementar o dropdown na Seção 6 com auto-preenchimento, incluir `arquitetoId` no payload de `handleSave` e integrar o modal inline de cadastro rápido via AJAX.

---

## 3. Caveats

1. **Autenticação CSRF em AJAX:** Ao realizar `fetch` direto para `POST /especificadores`, o token CSRF (`X-XSRF-TOKEN`) deve ser lido do cookie `XSRF-TOKEN` documentado na configuração do Adonis Shield (`config/shield.ts`). Se for utilizado `axios`, o cabeçalho é injetado automaticamente.
2. **Campos Opcionais do Arquiteto:** Nem todos os arquitetos cadastrados possuem `email`, `telefone` ou `escritorio`. O auto-preenchimento deve tratar valores `null` ou `undefined` substituindo-os por strings vazias para não quebrar os inputs controlados do React.
3. **Desvinculação:** Caso o usuário decida remover o parceiro do projeto, deve haver uma opção no select ("Nenhum parceiro / Sem arquiteto"), a qual define `arquitetoId = null` e limpa ou permite edição livre dos campos de texto.

---

## 4. Conclusion

O sistema possui todo o alicerce relacional de banco e backend pronto para suportar R1. A raiz do problema reside exclusivamente na desconexão das props e na ausência do componente de seleção e modal AJAX no frontend `edit.tsx`, gerando inclusive a remoção indesejada de `projetos.arquiteto_id` ao salvar o rascunho.
A implementação das propostas descritas no relatório técnico `/home/porto/codespace/Plannit/.agents/explorer_1_r2/report.md` sana integralmente o requisito R1 com zero risco de regressão.

---

## 5. Verification Method

Para verificar a solução de forma independente após a implementação:

1. **Verificação Estática e Build:**
   ```bash
   cd /home/porto/codespace/Plannit/plannit
   npm run typecheck
   npm run build
   ```
   *Condição de Sucesso:* 0 erros de tipagem TypeScript e compilação do Vite concluída com sucesso.

2. **Verificação de Dados no Banco via Node/Postgres:**
   - Criar/editar um briefing associando um `arquitetoId` existente.
   - Executar query no PostgreSQL:
     ```sql
     SELECT id, codigo, arquiteto_id, arquiteto_nome FROM projetos WHERE id = <projeto_id>;
     ```
   *Condição de Sucesso:* `projetos.arquiteto_id` deve estar preenchido com o ID do arquiteto selecionado.

3. **Verificação de Cadastro Rápido e Não-Perda de Rascunho:**
   - Preencher novos dados em ambientes na Seção 3 e observações na Seção 5 sem clicar em salvar.
   - Clicar em "+ Novo Parceiro" na Seção 6 e submeter o formulário do modal.
   - *Condição de Sucesso:* O modal fecha, o novo parceiro aparece selecionado na Seção 6 com dados preenchidos, e os campos das Seções 3 e 5 continuam com o texto digitado intacto (sem reload de página).
