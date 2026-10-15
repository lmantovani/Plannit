---
name: sincronizacao-catalogos-configuracoes
description: >-
  Contrato do Plannit para que mudanças feitas em Configurações (/configuracoes — ambientes,
  origens, campanhas, tipos de compromisso ou qualquer catálogo novo) apareçam sozinhas nas telas
  que usam esses catálogos, sem recarregar a página, e para que o backend só aceite valores do
  catálogo ativo. Use esta skill sempre que criar ou alterar um formulário, modal, filtro, select,
  busca, relatório ou validação que dependa de um catálogo de Configurações; ao adicionar um
  catálogo novo ou uma aba nova em /configuracoes; e ao investigar por que uma alteração feita em
  Configurações não apareceu em outra tela — mesmo que o pedido não fale em "sincronização",
  "catálogo" ou "localStorage".
---

# Sincronização de catálogos de Configurações

Os gestores (Diretoria e Gerente Comercial) mantêm listas de apoio em `/configuracoes`: ambientes,
origens de lead, campanhas, tipos de compromisso. Essas listas aparecem em formulários de outras
telas (Novo Lead, Qualificação, Briefing, Agenda). O comportamento esperado pelo usuário é:
**alterou em Configurações, a tela que usa o catálogo já mostra a mudança** — mesmo com o modal
aberto em outra aba do navegador — e o backend nunca aceita um valor fora do catálogo ativo.

Esta skill cobre esse contrato. Para decidir **se** um campo deve virar catálogo e para montar a
tabela, o CRUD e a aba em Configurações, use antes a skill `parametrizacao-campos-configuracoes`
(em `.agents/skills/`). As duas se complementam: aquela cria o catálogo, esta faz o resto do
sistema enxergá-lo.

## Como o mecanismo funciona

```
/configuracoes (produtor)                       tela que usa o catálogo (consumidor)
─────────────────────────                       ─────────────────────────────────────
salvou / editou / ativou / excluiu              ouve 'storage' (outra aba avisou) e 'focus'
  └─ notifyCatalogoUpdate('<chave>')              └─ router.reload({ only: ['<prop>'] })
       └─ localStorage 'plannit_catalogo_updated'      └─ o controller consulta de novo só os
          = '<chave>:<timestamp>'                         itens ATIVOS e devolve a prop
```

- O evento `storage` só dispara nas **outras** abas; por isso o consumidor também recarrega no
  `focus`, que é quando o gestor volta da aba de Configurações para a aba do formulário.
- `router.reload({ only: [...] })` é um reload parcial do Inertia: busca só as props listadas e
  preserva o estado do formulário que o usuário já preencheu.
- O valor do sinal é `'<chave>:<timestamp>'` (ex.: `campanhas:1759...`). Chamadas antigas gravam só
  o timestamp. Trate valor sem chave como "algum catálogo mudou" e recarregue.
- Chaves atuais, iguais às abas de `/configuracoes`: `ambientes`, `origens`, `campanhas`,
  `tipos_compromisso`.

## Checklist A — criar algo que USA um catálogo

Siga na ordem. Cada item evita um defeito que já aconteceu no projeto.

1. **Backend entrega só itens ativos, ordenados.** No controller da tela, consulte o catálogo com
   `is_active = true` e a ordem do catálogo, e devolva só os campos que a tela usa. Prefira os scopes
   do model (`ativos()`, `ordenados()`, como em `app/models/tipo_compromisso_catalogo.ts`) a repetir
   `where` em cada controller.
2. **Nome da prop = nome usado no reload.** Use `<catalogo>Catalogo` (`ambientesCatalogo`,
   `origensCatalogo`, `campanhasCatalogo`). O `only: [...]` do reload precisa citar exatamente esse
   nome; se divergir, o reload volta sem a lista e nada atualiza, sem erro nenhum.
3. **Decida o que o registro grava e anote a decisão.** Hoje a origem grava o `slug`, campanha e
   ambientes gravam o `nome`, e o tipo de compromisso grava o `id`. Valor em texto (slug ou nome)
   não acompanha renomeação: renomear "Campanha X" deixa os leads antigos com o nome antigo. Slugs
   que o código usa diretamente (`arquiteto`, `outro`) não podem mudar. Para dado novo, prefira FK
   (`id`) quando o item tiver vida própria, e texto quando for só um rótulo para relatório.
4. **Valide no backend contra o catálogo ativo.** No validator VineJS, use `.exists()` com filtro
   `is_active` e uma mensagem em português via `SimpleMessagesProvider` (exemplo: `campanha` em
   `app/validators/lead.ts`). A tela pode estar desatualizada ou ser burlada; o servidor é a última
   barreira.
5. **Componente de escolha.** Uma opção com busca: `components/ui/BuscaAutocomplete.tsx`, base de
   `CampanhaAutocomplete` e `EspecificadorAutocomplete`. Várias opções: chips, como os ambientes na
   qualificação e no briefing. Evite `<datalist>` e texto livre: foi o texto livre que impediu KPIs
   confiáveis por campanha.
6. **Mostre o que já está gravado, mesmo inativo.** Monte a lista como catálogo ativo + valores já
   selecionados que não estão nele (item desativado ou valor antigo). Sem isso, o registro "perde"
   o valor na tela e o próximo salvamento apaga o dado.
7. **Ligue a sincronização.** Use o hook `useSincronizarCatalogos(['<prop>'])` de
   `inertia/lib/catalogos.ts`: ele ouve `storage` (chave `plannit_catalogo_updated`) e `focus`, chama
   `router.reload({ only: [...] })` e remove os listeners no cleanup. O botão "Sincronizar" usa
   `recarregarCatalogos` do mesmo arquivo. Exemplo de uso: `pages/briefings/edit.tsx`. Ainda há três
   cópias antigas do efeito, escritas antes do hook (`NovoLeadModal` em `pages/crm/index.tsx`,
   `components/crm/QualificarLeadModal.tsx` e `pages/agenda/components/ModalNovoCompromisso.tsx`);
   se estiver mexendo em um desses arquivos, troque a cópia pelo hook.
8. **Atalhos para gestores.** Para Diretoria/Gerente (`canManageConfig`), mostre ao lado do rótulo
   o link "Configurar ↗" para `/configuracoes?tab=<chave>` em nova aba e, se útil, o botão
   "Sincronizar". O vendedor não vê esses atalhos: as rotas de Configurações dariam 403 para ele.
9. **Cadastro rápido (opcional).** Se fizer sentido criar o item sem sair do formulário, faça
   `fetch` JSON para `POST /configuracoes/<chave>` com o header `X-XSRF-TOKEN` (`getXsrfToken()` de
   `inertia/lib/http.ts`), selecione o item criado e avise as outras abas com o mesmo sinal. Exemplo:
   `components/crm/CampanhaAutocomplete.tsx`. Ofereça só a quem pode cadastrar no catálogo.
10. **Lista local não pode congelar a prop.** Se o componente guarda uma cópia local da lista (para
    incluir o item recém-criado), combine-a com a prop a cada render (`useMemo` sobre prop +
    criados), em vez de copiar a prop uma vez no `useState`. Uma cópia feita só no `useState` ignora
    todos os reloads seguintes, e a sincronização para de funcionar sem nenhum erro aparente.
11. **Teste.** Escreva um teste Japa funcional que aceita item ativo e recusa item inativo ou
    inexistente (padrão em `tests/functional/leads_campanha.spec.ts`), limpando os registros no
    teardown, porque os testes rodam no banco de desenvolvimento.

## Checklist B — criar um catálogo NOVO em Configurações

Complementa a skill `parametrizacao-campos-configuracoes`, que cobre tabela, CRUD, aba e seeder.

1. **Chave da aba** em `inertia/pages/configuracoes/index.tsx`: inclua no tipo `TabKey` e na lista
   de abas aceitas em `?tab=` (estado inicial de `activeTab`). Sem isso, o link "Configurar ↗" abre
   na aba errada.
2. **Avise em toda mutação bem-sucedida:** criar, editar, ativar/desativar e excluir chamam
   `notifyCatalogoUpdate('<chave>')` no `onSuccess`. Se faltar em uma delas, só aquela operação
   deixa de refletir nas outras telas.
3. **JSON além do redirect:** os endpoints do catálogo respondem JSON quando `wantsJson()` (201 na
   criação, com o item criado), para permitir o cadastro rápido nas telas consumidoras.
4. **Prefira desativar a excluir.** Hoje a exclusão em Configurações é física e não verifica uso.
   Os registros que gravaram o valor continuam com ele, mas o item some das listas. Oriente o
   usuário a desativar itens em uso e a excluir só o que foi cadastrado por engano.
5. **Model com scopes** `ativos()` e `ordenados()`, para os consumidores não repetirem filtros.
6. **Documente no `AGENTS.md`:** a linha do módulo consumidor e qualquer slug que o código usa
   diretamente.

## Erros que já aconteceram

- **Lista fixa no código paralela ao catálogo:** o briefing tinha uma lista própria de ambientes,
  com valores diferentes dos do catálogo, e os ambientes vindos do lead não apareciam marcados.
- **Texto livre com sugestões:** a campanha aceitava qualquer texto, e "Campanha Cozinhas" e
  "campanha cozinha" viravam campanhas diferentes nos relatórios.
- **Prop renomeada sem atualizar o `only`:** o reload não traz nada e a tela fica parada em
  silêncio.

## Pendências conhecidas (corrija quando mexer nesses pontos)

- Três consumidores ainda usam cópias do efeito de sincronização em vez do hook (ver item 7 do
  checklist A).
- A `origem` do lead não é validada contra o catálogo no backend; só a campanha é.
- `CampanhaAutocomplete` e algumas chamadas de `notifyCatalogoUpdate()` gravam o sinal sem a chave.
- A Agenda usa a prop `tipos` em vez de `tiposCompromissoCatalogo`. Funciona, mas foge do item 2
  do checklist A.

## Exemplos de código

`references/exemplos.md` tem os trechos prontos: consulta no controller, validator com mensagem,
hook de sincronização, atalhos para gestores, lista combinada, cadastro rápido, sinal do produtor e
teste Japa. Leia quando for implementar.
