# Módulo Especificadores — Reconciliação de branches — Design

**Data:** 2026-07-24
**Branch de origem técnica:** `feature/especificadores` (base) + peças portadas de `origin/feature/arch`
**Branch nova a criar:** `feature/especificadores-reconciliado` (sugestão de nome, a partir de `feature/especificadores`)
**Status:** aprovado, aguardando plano de implementação

## Contexto

O módulo Especificadores foi implementado duas vezes, de forma independente, em duas máquinas diferentes, sem sincronia entre elas:

- **`feature/especificadores`** (PC pessoal, 23–24/07/2026, backend completo e testado — 133 testes — commitado e pushado; frontend só planejado, nunca implementado): segue o spec `docs/superpowers/specs/2026-07-16-especificadores-design.md`. Trouxe dono da carteira com histórico auditável e notificação, painel de KPIs, flag de especificador esfriando e meta de visitas configurável.
- **`origin/feature/arch`** (notebook do trabalho, 14–17/07/2026, backend + frontend completos e funcionando — 114 testes, build limpo — pushada, nunca mesclada em `main`): seguiu specs próprios (`docs/superpowers/specs/2026-07-07-especificadores-cadastro-design.md` e `2026-07-14-arquitetos-especificador-ui-design.md`, não commitados nesta branch). Trouxe funcionários do escritório, cliente vinculado ao especificador, e já fez o rename técnico completo do frontend (`EspecificadoresPage.jsx` e afins).

Uma comparação técnica verificada (diff real + testes rodados em worktree isolado das duas branches) mostrou que os modelos de dados são incompatíveis entre si — não dá pra mesclar diretamente — mas as duas implementações são funcionalmente complementares na maior parte. Este documento define como reconciliar as duas num design único, decidido campo a campo com o usuário.

**Achado à parte, fora do escopo deste documento:** `feature/arch` corrigiu, só dentro de `arquiteto_score.py`, uma comparação de datetime naive-vs-aware (`datetime.utcnow()` contra colunas `DateTime(timezone=True)`, que o Postgres devolve timezone-aware e o SQLite dos testes devolve naive, mascarando o bug). O mesmo padrão existe em outros 8 arquivos do backend do projeto inteiro. Corrigir isso no projeto todo é tarefa separada — aqui só adotamos a correção pontual dentro de `arquiteto_score.py`, já que vamos mexer nesse arquivo mesmo.

## Decisões de escopo (validadas com o usuário)

1. **Visibilidade aberta.** Todo especificador é visível e "trabalhável" (registrar interação, ver clientes/decisores) por qualquer usuário autenticado — mesma decisão do spec de 16/07. A checagem de acesso por linha que `feature/arch` implementou (`_checar_acesso_relacionamento`, vendedor só mexe no que é `vendedor_id == self`) **não é portada**. Só a reatribuição de dono continua restrita a `DIRETORIA`/`GERENTE_COMERCIAL`.
2. **`tipo` ganha 2 categorias a mais.** Além de Arquiteto, Engenheiro, Designer de Interiores e Decorador (já implementados), soma-se Corretor e Outro (de `feature/arch`).
3. **Dono da carteira usa o mecanismo de `feature/especificadores`.** `consultor_id` + `status_carteira` + `HistoricoDonoArquiteto` (log imutável) + `Notificacao` + endpoint dedicado `PATCH /dono`. O campo mais simples `vendedor_id` de `feature/arch` não é adotado — é o mesmo conceito, só que mais raso; ao portar o frontend da `arch`, todo uso de `vendedor_id`/`vendedor_nome` é renomeado para `consultor_id`/`consultor_nome`.
4. **Taxonomia de interação é a união das duas.** `ligacao, whatsapp, email, visita_escritorio, visita_loja, reuniao, evento, viagem, envio_brinde`. Continua um campo `String(50)` livre (não `SAEnum` rígido) — mesmo padrão de `InteracaoLead` e do restante do projeto. `lead_id` opcional (rastreabilidade de lead gerado) é mantido — só existia em `especificadores`.
5. **Decisores não muda.** `DecisorArquiteto` continua exatamente como está hoje em `main` (model, endpoints, UI). `FuncionarioArquiteto` de `feature/arch` não é adotado — é descartado da reconciliação.
6. **Cliente vinculado é adotado.** `Cliente.arquiteto_id` (nullable) + `GET /arquitetos/{id}/clientes`, portados de `feature/arch`.
7. **Rename técnico do frontend é adotado agora**, usando os 4 arquivos já prontos de `feature/arch` (`EspecificadoresPage.jsx`, `EspecificadorDrawer.jsx`, `EspecificadorTabs.jsx`, `EspecificadorDetalhePage.jsx`, rotas `/especificadores` e `/especificadores/:id`) como ponto de partida, adaptados às decisões deste documento. O plano de frontend escrito em 24/07 (`docs/superpowers/plans/2026-07-24-especificadores-frontend.md`, que mantinha `ArquitetoXxx` internamente) **fica obsoleto e não deve ser executado** — será substituído pelo plano de implementação que segue este spec.
8. **As duas regressões reais encontradas em `feature/arch` são corrigidas na reconciliação:** CRUD completo de `ConcorrenteArquiteto` (hoje só leitura em `feature/arch`) e botão "Desativar" (RN017) voltam a existir na UI nova.

## Notas técnicas para o plano de implementação

- **Sem Alembic versionado neste repo** (mesma nota já registrada no plano de backend de 23/07): `seed.py` usa `Base.metadata.create_all`, `alembic/versions/` está vazio. Mudanças de schema (novas colunas em `Arquiteto`/`Cliente`, tabela nova nenhuma além das já existentes de `especificadores`) não exigem migration nesta fase local/demo.
- **Verificação de backend** via SQLite in-memory + `TestClient` (`tests/conftest.py`), não Postgres real — mesmo padrão de todo o módulo até aqui.
- Dado o tamanho (mudança de backend + port de 4 arquivos de frontend com 5 ajustes cada), o plano de implementação pode — e provavelmente deve — ser dividido em dois documentos (backend primeiro, frontend depois), mesmo padrão já usado nas duas rodadas anteriores deste módulo. Essa divisão fica a critério de quem escrever o plano.

## 1. Campo `tipo` (final)

```python
class TipoEspecificador(str, enum.Enum):
    ARQUITETO = "arquiteto"
    ENGENHEIRO = "engenheiro"
    DESIGNER_INTERIORES = "designer_interiores"
    DECORADOR = "decorador"
    CORRETOR = "corretor"
    OUTRO = "outro"
```

Continua obrigatório em `ArquitetoCreate` (decisão já validada no spec de 16/07, reafirmada aqui). `especialidade` (texto livre, opcional) e `endereco_escritorio` (de `feature/arch`, texto livre, opcional) coexistem — são complementares, não conflitam.

## 2. Dono da carteira (sem mudança de design, só integração)

Modelo, endpoints e UI de `feature/especificadores` (já implementados e testados) valem como estão:

- `Arquiteto.consultor_id` + `Arquiteto.status_carteira` (`ATIVO`/`EM_PROSPECCAO`/`INATIVO`)
- `HistoricoDonoArquiteto` (log imutável)
- `PATCH /arquitetos/{id}/dono` (roles `DIRETORIA`/`GERENTE_COMERCIAL`) + `GET /arquitetos/{id}/historico-dono`
- `Notificacao` tipo `ESPECIFICADOR_TRANSFERIDO` disparada ao reatribuir
- `Arquiteto.consultor_nome` (property computada, já implementada) para exibir o dono a qualquer usuário sem depender de `GET /users/`

O trabalho desta reconciliação aqui é só de **frontend**: portar a tela de reatribuição + histórico (já desenhada no plano de 24/07, Task 10) para dentro do novo `EspecificadorTabs.jsx`/`EspecificadorDrawer.jsx`, usando `consultor_id`/`consultor_nome` em vez do `vendedor_id`/`vendedor_nome` que esses arquivos usam hoje.

## 3. Interações (união)

```python
# app/services/arquiteto_score.py e endpoints continuam lendo qualquer valor de tipo —
# a lista abaixo é documentação do valor esperado, não uma constraint de banco.
TIPOS_INTERACAO_ARQUITETO = [
    "ligacao", "whatsapp", "email",
    "visita_escritorio", "visita_loja", "reuniao",
    "evento", "viagem", "envio_brinde",
]
```

`InteracaoArquiteto` mantém os nomes de coluna de `feature/especificadores` (`resumo`, `responsavel_id`, `data`, tabela `interacoes_arquitetos`) — **não** adota `observacao`/`autor_id`/`criado_em`/`interacoes_arquiteto` de `feature/arch`. `lead_id` opcional continua existindo (só em `especificadores`). Sem `cascade="all, delete-orphan"` — a tabela é append-only, mesmo padrão do resto do projeto (RN017).

**Impacto na leitura dos dois KPIs existentes** (`GET /arquitetos/kpis` e `GET /arquitetos/metas-visitas/me`), que hoje filtram por `tipo == "visita"` — esse valor não existe mais sozinho, agora há `visita_escritorio` e `visita_loja`:

- `visitas_escritorio_mes` (KPI) e `visitas_realizadas_mes` (minha meta) passam a contar só `tipo == "visita_escritorio"` — é literalmente "visita ao escritório do especificador", o mesmo conceito que a meta de visitas sempre representou.
- `atendimentos_mes` passa a contar tudo que não é `visita_escritorio` (ou seja, inclui `visita_loja` também, além dos canais de contato) — o especificador visitando a loja é um atendimento nosso a ele, não uma visita nossa a ele.

Adota-se também o helper `_utc()` de `feature/arch` dentro de `arquiteto_score.py` (normaliza datetime naive/aware antes de comparar) — escopo mínimo, só onde já estamos mexendo no arquivo por causa da união de tipos.

## 4. Decisores — sem mudança

Nenhuma migração, nenhum novo endpoint. Fica exatamente como está em `main` hoje.

## 5. Cliente vinculado (adotado de `feature/arch`)

```python
# Cliente ganha:
arquiteto_id = Column(Integer, ForeignKey("arquitetos.id"), nullable=True)
arquiteto = relationship("Arquiteto", foreign_keys=[arquiteto_id])
```

`ClienteCreate`/`ClienteResponse` ganham `arquiteto_id: Optional[int]`. Novo endpoint `GET /arquitetos/{id}/clientes` (qualquer usuário autenticado, mesmo padrão de decisores/concorrentes). Sem mudança em `POST /clientes/` além do campo novo opcional.

## 6. KPIs, flag esfriando, meta de visitas — sem mudança de design

Ficam exatamente como implementados em `feature/especificadores` (`GET /kpis`, flag `especificador_esfriando`, `MetaVisitasConsultor` + 3 endpoints), com o ajuste de leitura de `tipo` descrito na seção 3. Nenhuma dessas telas existe em `feature/arch` hoje — são construídas do zero sobre a base de frontend portada, reaproveitando o desenho já feito no plano de 24/07 (KPI panel compartilhado com o Dashboard, modal de metas).

## 7. Frontend — base portada de `feature/arch`, com 5 ajustes

Ponto de partida: os 4 arquivos de `frontend/src/pages/especificadores/` de `feature/arch`, mais as mudanças em `App.jsx`/`Sidebar.jsx`/`lib/api.js`/`lib/constants.js` daquela branch (rotas `/especificadores`, `/especificadores/:id`, item de menu). Ajustes necessários sobre essa base:

1. **Renomear `vendedor_id`/`vendedor_nome` → `consultor_id`/`consultor_nome`** em todos os 4 arquivos e em `lib/api.js` (a checagem de acesso por linha do backend `arch` já não é portada — ver seção "Dono da carteira" — mas o campo continua existindo na tela como filtro e exibição, só com o nome do backend real).
2. **Reverter a aba "Decisores"** de `FuncionarioArquiteto` (`listarFuncionarios`/`criarFuncionario`/`atualizarFuncionario`/`removerFuncionario`) para `DecisorArquiteto` (`listarDecisores`/`criarDecisor`/`atualizarDecisor`/`removerDecisor`, já existentes em `lib/api.js` antes do rename da `arch` — precisam ser restaurados).
3. **Restaurar CRUD de concorrentes** (hoje só leitura, dentro da aba Score) — reaproveita `ConcorrenteForm` já existente em `ArquitetosPage.jsx` (código antigo, não deletado do repositório, só não portado pela `arch`) mais os 4 métodos de `lib/api.js` (`listarConcorrentes`/`criarConcorrente`/`atualizarConcorrente`/`removerConcorrente`).
4. **Restaurar botão "Desativar"** (RN017) na aba Perfil, com `ConfirmDialog`, chamando `arquitetosApi.desativar(id)` — também precisa voltar em `lib/api.js`.
5. **Adicionar as 3 telas que não existem em nenhuma das duas branches ainda como frontend pronto**: painel de KPIs (compartilhado com `DashboardPage.jsx`), reatribuição de dono + histórico, modal de meta de visitas. Reaproveita o desenho já validado no plano de 24/07 (Tasks 7, 8 e 10), adaptado pra dentro de `EspecificadorTabs.jsx`/`EspecificadorDrawer.jsx`/`EspecificadorDetalhePage.jsx` em vez de `ArquitetosPage.jsx`.

A aba/lista de clientes vinculados e a aba de interações **já existem** em `EspecificadorTabs.jsx` (portadas de `feature/arch`) — só precisam da lista de tipos de interação ampliada (seção 3) e do select opcional de "lead gerado" (que não existia na `arch` — soma-se aqui).

## Fora de escopo desta reconciliação

- Fix do bug de timezone naive/aware no restante do backend (fora de `arquiteto_score.py`) — vira tarefa separada.
- `FuncionarioArquiteto` — descartado, não vira dívida técnica porque nunca chega a ser commitado nesta branch nova.
- Migração de dados reais — ambiente de demo, sem dado real, mesma nota de todos os specs anteriores deste módulo.

## Testes

Backend: todos os 133 testes de `feature/especificadores` continuam valendo; somam-se testes para `Cliente.arquiteto_id`/`GET /clientes`, para os valores novos de `tipo` (Corretor, Outro), para a leitura ajustada de `visita_escritorio` vs `visita_loja` nos dois KPIs, e um teste de regressão pro fix de timezone dentro de `calcular_score` (mesmo padrão dos testes que `feature/arch` já escreveu pra isso, adaptado).

Frontend: sem framework de teste (mesma limitação já documentada) — `npm run build`/`npm run lint` a cada tarefa, checklist manual final cobrindo as 5 telas restauradas/adicionadas mais as já portadas (perfil, score, decisores, clientes, interações, KPIs, reatribuição de dono, metas de visitas).
