# Dispatch — Worker Frontend (R2)

## Identidade
- Archetype: teamwork_preview_worker
- Role: Frontend UI Developer
- Diretório de trabalho: /home/porto/codespace/Plannit/.agents/worker_frontend_r2
- Parent: orchestrator_r2 (Conversation ID: 2234a5b6-5818-4550-b8cb-1eaacedae0e7)

## Documentos de Referência Obrigatórios
1. /home/porto/codespace/Plannit/.agents/ORIGINAL_REQUEST.md (seção ## 2026-09-11T18:07:30Z)
2. /home/porto/codespace/Plannit/.agents/orchestrator_r2/PROJECT.md
3. /home/porto/codespace/Plannit/.agents/explorer_1_r2/handoff.md
4. /home/porto/codespace/Plannit/.agents/explorer_1_r2/report.md

## Aviso Obrigatório de Integridade
DO NOT CHEAT. All implementations must be genuine. DO NOT hardcode test results, create dummy/facade implementations, or circumvent the intended task. A teamwork_preview_auditor will independently verify your work. Integrity violations WILL be detected and your work WILL be rejected.

## Arquivos sob sua Posse Exclusiva (Write Ownership)
- `plannit/inertia/pages/briefings/edit.tsx`
(NÃO altere nenhum outro arquivo!)

## Escopo e Instruções Cirúrgicas de Implementação (Requisito R1)

1. **Tipagens em `inertia/pages/briefings/edit.tsx`**:
   - Atualizar a interface `BriefingData` para incluir `arquitetoId: number | null`.
   - Adicionar interface `EspecificadorItem`:
     ```typescript
     interface EspecificadorItem {
       id: number
       nome: string
       tipo: string
       email?: string | null
       telefone?: string | null
       escritorio?: string | null
       cauOuCrea?: string | null
       cidade?: string | null
       uf?: string | null
     }
     ```
   - Atualizar `PageProps` para receber:
     ```typescript
     especificadores?: EspecificadorItem[]
     consultores?: { id: number; nome: string }[]
     ```

2. **Props e Estado no Componente `BriefingEdit`**:
   - Desestruturar as props: `const BriefingEdit: React.FC<PageProps> = ({ briefing, especificadores = [], consultores = [] }) => {`
   - Criar estado para a lista local de especificadores (para permitir inclusão imediata ao cadastrar via modal sem recarregar tela):
     `const [listaEspecificadores, setListaEspecificadores] = useState<EspecificadorItem[]>(especificadores)`
   - No estado `formData`:
     `arquitetoId: briefing.arquitetoId || null,`
     `arquitetoNome: briefing.arquitetoNome || '',`
     `arquitetoEmail: briefing.arquitetoEmail || '',`
     `arquitetoTelefone: briefing.arquitetoTelefone || '',`
   - Estado para controlar o modal de cadastro rápido: `const [isModalNovoArquitetoOpen, setIsModalNovoArquitetoOpen] = useState(false)`

3. **Seção 6 — Especificador / Arquiteto Parceiro**:
   - Adicionar um `<select>` ou combobox com estilização consistente (Tailwind stone/warm-gold) para selecionar o arquiteto parceiro entre os itens de `listaEspecificadores`.
   - Incluir opção padrão: `<option value="">Nenhum parceiro selecionado (ou cadastro avulso)</option>`.
   - Ao selecionar um arquiteto (`handleSelectArquiteto(arquitetoId)`):
     - Atualizar `formData.arquitetoId = arquitetoId ? Number(arquitetoId) : null`.
     - Localizar o arquiteto selecionado e auto-preencher:
       - `formData.arquitetoNome = arquiteto.nome`
       - `formData.arquitetoEmail = arquiteto.email || ''`
       - `formData.arquitetoTelefone = arquiteto.telefone || ''`
     - Manter os campos de texto existentes preenchidos e editáveis se o usuário quiser ajustar algo.
   - Adicionar botão com ícone `+` ao lado do select: `+ Novo Parceiro` que abre o modal rápido.

4. **Modal Rápido de Cadastro de Parceiro (sem recarregar a tela / sem perda de rascunho)**:
   - Formulário com campos: Nome, Tipo (arquiteto, designer, etc.), Escritório, E-mail, Telefone, CAU/CREA.
   - Submissão via AJAX (`fetch('/especificadores', { method: 'POST', headers: { 'Content-Type': 'application/json', 'Accept': 'application/json', 'X-XSRF-TOKEN': getXsrfToken() }, body: JSON.stringify(...) })`):
     *(Função auxiliar `getXsrfToken` lendo cookie `XSRF-TOKEN`)*
   - Ao receber status 201 JSON com o arquiteto criado:
     - Adicionar à `listaEspecificadores`.
     - Definir `formData.arquitetoId = novoArquiteto.id`.
     - Auto-preencher `formData.arquitetoNome = novoArquiteto.nome`, `email`, `telefone`.
     - Fechar o modal.
     - Exibir notificação / feedback visual de sucesso.
     - O rascunho das outras seções (ambientes, medidas, observações) permanece 100% intacto!

5. **Payload de Salvamento (`handleSave` e `handleEnviarFila`)**:
   - Incluir explicitamente `arquitetoId: formData.arquitetoId` no objeto payload enviado para `PATCH /briefings/:id`.

## Verificação Obrigatória
Após implementar, execute no diretório `/home/porto/codespace/Plannit/plannit`:
`npm run typecheck`
`npm run build`
Ambos os comandos DEVEM concluir com sucesso absoluto e zero erros.
Registre os comandos e saídas em seu `handoff.md`.
Notifique o orchestrator_r2 via `send_message` ao concluir.

## 2026-09-11T18:21:15Z
Você é o Worker Frontend (R2).
Seu diretório de trabalho é /home/porto/codespace/Plannit/.agents/worker_frontend_r2.
Leia obrigatoriamente:
1. /home/porto/codespace/Plannit/.agents/ORIGINAL_REQUEST.md (seção ## 2026-09-11T18:07:30Z)
2. /home/porto/codespace/Plannit/.agents/worker_frontend_r2/DISPATCH.md
3. /home/porto/codespace/Plannit/.agents/orchestrator_r2/PROJECT.md
4. /home/porto/codespace/Plannit/.agents/explorer_1_r2/handoff.md

MANDATORY INTEGRITY WARNING:
DO NOT CHEAT. All implementations must be genuine. DO NOT hardcode test results, create dummy/facade implementations, or circumvent the intended task. A teamwork_preview_auditor will independently verify your work. Integrity violations WILL be detected and your work WILL be rejected.

Sua missão é implementar com precisão no arquivo sob sua posse exclusiva:
- plannit/inertia/pages/briefings/edit.tsx (Seção 6 com seleção de parceiros da tabela arquitetos, auto-preenchimento dos contatos, modal rápido via AJAX sem perda de rascunho, e inclusão de arquitetoId no payload de salvamento).

Execute npm run typecheck e npm run build no diretório /home/porto/codespace/Plannit/plannit para comprovar zero erros.
Gere seu relatório de handoff em /home/porto/codespace/Plannit/.agents/worker_frontend_r2/handoff.md e notifique o parent (id: 2234a5b6-5818-4550-b8cb-1eaacedae0e7) via send_message ao concluir.

