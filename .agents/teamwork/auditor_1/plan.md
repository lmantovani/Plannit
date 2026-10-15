# Plano de Ação da Auditoria de Vitória

## Objetivo
Realizar uma auditoria rigorosa, independente e adversária sobre a implementação da funcionalidade de Roteiros Técnicos de Briefings (18 PDFs) e seu respectivo Drawer lateral no Plannit, verificando se todos os requisitos e critérios de aceitação foram cumpridos com total integridade e sem adulterações.

---

## Etapas do Plano de Ação

### 1. Auditoria de Linha do Tempo e Proveniência (Fase A)
- Verificar status do repositório git (`git status`, `git log -n 10 --stat`).
- Mapear quais arquivos foram criados ou alterados na implementação.
- Verificar consistência de timestamps e histórico de modificações.

### 2. Auditoria Forense de Integridade (Fase B)
- Inspecionar `roteiros_briefings.ts`, `RoteiroAmbienteDrawer.tsx`, `edit.tsx` e `tests/functional/roteiros_briefings.spec.ts`.
- Verificar se há saídas forjadas, resultados de testes estáticos forçados para passar (`true == true`), mocks que burlam a verificação real ou fachadas que não implementam a lógica de negócio solicitada.
- Verificar integridade de modo de desenvolvimento: sem trapaças, fachadas ou testes auto-certificantes vazios.

### 3. Verificação Técnica e Confrontação dos 18 PDFs
- Listar todos os 18 arquivos em `docs/briefings/`.
- Extrair texto de amostras e confrontar com o conteúdo registrado em `plannit/inertia/lib/roteiros_briefings.ts`.
- Verificar se todos os 18 PDFs têm slugs correspondentes, títulos corretos, perguntas estratégicas e diretrizes técnicas completas.
- Verificar o mapeamento inteligente de nomes de ambientes (ambientes do catálogo, sinônimos como "Quarto da Filha" -> "BRIEFING QUARTO DOS FILHOS", "Lavabo" -> "BRIEFING BANHEIRO / LAVABO", etc.).

### 4. Inspeção do Componente React e Integração no Briefing
- Inspecionar `RoteiroAmbienteDrawer.tsx`:
  - Animação e classes Tailwind (`fixed inset-y-0 right-0 w-full sm:w-[500px] lg:w-[560px] bg-white shadow-2xl z-50 flex flex-col animate-slide-in-right`).
  - Backdrop com fechamento ao clicar fora e suporte à tecla `Esc`.
  - Cabeçalho com badge, título, subtítulo e botão de fechar.
  - Seletor/dropdown para alternar entre os 18 roteiros a qualquer momento.
  - Barra de busca em tempo real com filtragem de perguntas e tópicos.
  - Cards de destaque para perguntas estratégicas (estilo âmbar/dourado).
  - Ação de cópia para a área de transferência (`navigator.clipboard`).
- Inspecionar `edit.tsx`:
  - Botão geral "Consultar Guia Técnico" com ícone `BookOpen` no cabeçalho da Seção 3.
  - Botão em cada card de ambiente "Guia do Ambiente" que abre diretamente no roteiro correspondente.
  - Atualização automática do roteiro direcionado se o ambiente do card for alterado.
  - Garantia de que a abertura e navegação do drawer não recarregam a página e não causam perda de dados preenchidos no formulário.

### 5. Execução Independente de Testes e Compilação (Fase C)
- Executar `npm run typecheck` na pasta `plannit/` e registrar resultado exato.
- Executar `npm run build` na pasta `plannit/` e verificar compilação do bundle Vite/Inertia sem erros.
- Executar testes funcionais do Japa (`node ace test functional --files=tests/functional/roteiros_briefings.spec.ts` e suíte completa relevante).
- Validar se os testes cobrem os cenários reais e testam a funcionalidade de ponta a ponta.

### 6. Análise Adversária de Estresse e Casos de Borda
- Testar ambientes com nomes desconhecidos ou nulos no seletor de mapeamento (fallback gracioso).
- Testar buscas vazias, buscas com caracteres especiais, diacríticos/acentos e termos inexistentes.
- Testar comportamento de cópia para clipboard em ambientes onde a API pode falhar ou não estar disponível.
- Verificar impacto no bundle size e renderização no cliente.

### 7. Emissão do Veredito e Relatório Final
- Gerar o relatório estruturado no padrão `VICTORY AUDIT REPORT` em `/home/porto/codespace/Plannit/.agents/teamwork/auditor_1/handoff.md`.
- Concluir com veredito inequívoco: `VICTORY CONFIRMED` ou `VICTORY REJECTED`.
- Enviar notificação formal ao parent agent via `send_message`.
