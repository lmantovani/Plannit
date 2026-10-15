## 2026-10-14T22:18:48Z

Você é o SWE Light Orchestrator responsável por conduzir a implementação da seguinte tarefa auto-contida.

Seu diretório de trabalho é: `/home/porto/codespace/Plannit/.agents/teamwork/swe_1`
Diretório da aplicação: `/home/porto/codespace/Plannit/plannit`
Arquivo da solicitação original: `/home/porto/codespace/Plannit/.agents/teamwork/ORIGINAL_REQUEST.md`

Regra obrigatória: Sempre que montar um plano de ação faça em pt-br.
Mantenha seu `BRIEFING.md` e `progress.md` sempre atualizados no seu diretório de trabalho.

## Solicitação do Usuário

Implementar na tela de edição de Briefing (`inertia/pages/briefings/edit.tsx`) um Sidebar lateral direito (Drawer) de apoio ao vendedor/atendente, que renderize o roteiro de perguntas e diretrizes técnicas extraído dos 18 arquivos PDF localizados em `docs/briefings/`, com mapeamento inteligente para o ambiente em detalhamento.

Working directory: /home/porto/codespace/Plannit/plannit
Integrity mode: development

## Requirements

### R1. Extração e Estruturação dos Roteiros Técnicos dos 18 PDFs
- Extrair o texto completo e estruturado de todos os 18 arquivos PDF em `/home/porto/codespace/Plannit/docs/briefings/` (`pdftotext`).
- Criar a base de dados em `inertia/lib/roteiros_briefings.ts` contendo:
  - Identificador slug, título do ambiente, lista de seções, perguntas estratégicas e tópicos de checagem técnica.
  - Mapeamento robusto entre os nomes dos ambientes do catálogo (`Living`, `Home Theater`, `Suíte Master`, `Quarto do Filho`, `Quarto da Filha`, `Quarto de Visita`, `Closet`, `Cozinha`, `Espaço Gourmet`, `Varanda`, `Banheiro`, `Lavabo`, `Home Office`, `Área de Serviço`, `Adega`, `Despensa`, `Hall de Entrada`, `Louceiro`, `Rouparia`, `Sala de Jantar`) e o PDF correspondente.

### R2. Componente de Sidebar Lateral Direito (`RoteiroAmbienteDrawer.tsx`)
- Criar o componente `inertia/pages/briefings/components/RoteiroAmbienteDrawer.tsx` seguindo o design system do Plannit (semelhante ao `LeadDrawer` do CRM):
  - Animação de entrada suave pela direita (`fixed inset-y-0 right-0 w-full sm:w-[500px] lg:w-[560px] bg-white shadow-2xl z-50 flex flex-col animate-slide-in-right`).
  - Backdrop suave com blur e fechamento ao clicar fora ou pressionar `Esc`.
  - Cabeçalho com badge do ambiente, título, subtítulo e botão de fechar (`X`).
  - Dropdown / seletor no topo para permitir alternar entre qualquer um dos 18 roteiros de ambientes a qualquer momento.
  - Barra de busca interna para filtrar perguntas e tópicos do ambiente em tempo real.
  - Renderização estruturada com cards de destaque para **Perguntas Estratégicas** (estilo callout âmbar/dourado) e listas de itens/opções.
  - Botão de ação rápida para copiar uma pergunta ou trecho para a área de transferência.

### R3. Integração na Seção 3 do Briefing (`edit.tsx`)
- Na Seção 3 ("3. Detalhamento Técnico dos Ambientes"):
  - No cabeçalho da seção, incluir botão geral: `Consultar Guia Técnico` com ícone `BookOpen`.
  - Em cada card de ambiente detalhado adicionado, incluir botão junto ao seletor de ambiente: `Guia do Ambiente` com ícone de livro/ajuda, abrindo diretamente o roteiro correspondente àquele ambiente selecionado.
  - Se o ambiente no card for alterado (ex.: de "Living" para "Quarto da Filha"), abrir o guia direcionado automaticamente para o novo ambiente.

## Acceptance Criteria

### Integridade de Extração e Dados
- [ ] Todos os 18 PDFs em `docs/briefings/` possuem conteúdo extraído e acessível sem perda de tópicos ou perguntas.
- [ ] Mapeamento bidirecional cobre tanto ambientes solicitados quanto catálogo completo e nomes alternativos (ex.: "Quarto da Filha" mapeia para "BRIEFING QUARTO DOS FILHOS").

### Interface e Usabilidade
- [ ] Botão no cabeçalho e em cada card de ambiente abre o sidebar lateral sem recarregar a tela e sem perder rascunho de preenchimento.
- [ ] Sidebar renderiza títulos, listas e perguntas estratégicas com hierarquia visual e tipografia de alta legibilidade.
- [ ] Seletor interno no Drawer permite trocar de ambiente sem fechar a barra lateral.
- [ ] Busca em tempo real filtra os tópicos do roteiro ativo.

### Compilação e Testes
- [ ] `npm run typecheck` executado com sucesso e zero erros de tipagem TypeScript.
- [ ] `npm run build` executado com sucesso gerando bundles dos novos componentes sem falhas.
- [ ] Testes funcionais Japa executados sem regressões.

