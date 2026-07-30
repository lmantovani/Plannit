# Plannit — Contexto Completo para Claude Code

## Sobre o Projeto
Plataforma de gestão operacional para **Líder Móveis Planejados** (móveis planejados de alto padrão).
Desenvolvido por Leandro Mantovani em parceria comercial. Baseado no SRS v3.0 (23 módulos, 74 RFs, 18 RNs, 32 etapas de fluxo).
Projeto em desenvolvimento ativo — Claude Code é o co-piloto principal.

## Stack Tecnológica
- **Backend:** Python 3.11 (Homebrew), FastAPI 0.111, PostgreSQL 18, SQLAlchemy 2.0, Alembic, JWT/bcrypt
- **Frontend:** React 19, Vite 8, TailwindCSS 3, Zustand, Axios, Lucide React, clsx
- **Deploy:** Railway (backend + frontend + PostgreSQL como serviços separados)
- **OS:** macOS, PyCharm (backend), VS Code (frontend). Windows também suportado — ver seção dedicada de setup abaixo.

## URLs de Produção (Railway)
- **Frontend:** https://plannit-frontend-production.up.railway.app
- **Backend API:** https://plannit-production.up.railway.app
- **Credenciais demo:** admin@plannit.com.br / Admin@123456

## Decisões de Arquitetura
- **Railway** escolhido para fase demo/evolução; migração para **AWS EC2** planejada quando virar negócio real
- **Drag-and-drop no Kanban** intencionalmente fora do escopo — mudança de status é feita pelo drawer do card
- Ambiente de demo: dados são de teste, sem valor real. Ao virar produto: rotacionar SECRET_KEY, trocar senhas e mover credenciais para variáveis de ambiente seguras

## Estrutura de Pastas
```
lider-moveis/                    ← raiz do projeto
├── CLAUDE.md                    ← este arquivo
├── backend/
│   ├── app/
│   │   ├── api/v1/
│   │   │   ├── __init__.py      ← registra todos os routers
│   │   │   └── endpoints/
│   │   │       ├── auth.py
│   │   │       ├── users.py
│   │   │       ├── leads.py
│   │   │       ├── briefings.py
│   │   │       ├── dashboard.py
│   │   │       ├── arquitetos.py  ← módulo Especificadores completo (rota /arquitetos — nome do módulo é "Especificadores", endpoint manteve o nome de arquivo)
│   │   │       ├── projetos.py    ← módulo projetos completo
│   │   │       └── clientes.py    ← CRUD básico clientes
│   │   ├── core/
│   │   │   ├── config.py        ← pydantic-settings, extra="ignore"
│   │   │   ├── database.py      ← SQLAlchemy engine
│   │   │   └── security.py      ← JWT, bcrypt, require_roles()
│   │   ├── models/
│   │   │   ├── __init__.py      ← importa todos os models
│   │   │   ├── user.py          ← User, PerfilUsuario (14 perfis)
│   │   │   ├── crm.py           ← Lead, Cliente, Arquiteto (Especificador), DecisorArquiteto, ConcorrenteArquiteto, HistoricoDonoArquiteto, InteracaoArquiteto, MetaVisitasConsultor
│   │   │   ├── projeto.py       ← Projeto, Briefing, FilaProjeto, ConfigWIP, HistoricoStatus
│   │   │   ├── fechamento.py    ← ProjetoComercial, Fechamento, Parcela, Handoff
│   │   │   └── notificacao.py   ← Notificacao, TipoNotificacao (inclui RN019-RN022)
│   │   ├── schemas/
│   │   │   ├── auth.py
│   │   │   └── crm.py           ← inclui todos os schemas Pydantic v2 do módulo Especificadores (ArquitetoCreate/Update/Response, DecisorArquitetoResponse, ConcorrenteArquitetoResponse, ArquitetoScoreResponse, EspecificadoresKpiResponse, MetaVisitasResponse, etc.) — NÃO existe schemas/arquiteto.py separado
│   │   ├── services/
│   │   │   ├── briefing_score.py    ← score 0-100, 10 critérios
│   │   │   ├── wip_service.py       ← WIP limit por projetista
│   │   │   └── arquiteto_score.py   ← RFV × Potencial × Lealdade do módulo Especificadores
│   │   └── main.py
│   ├── alembic/                 ← fonte de verdade do schema a partir da migration 94d29e691390 (ver seção dedicada abaixo)
│   ├── seed.py                  ← cria usuários + dados de teste (NÃO mais cria tabelas via create_all — ver seção Alembic)
│   ├── requirements.txt
│   ├── .python-version          ← "3.12" (exigido pelo Railway)
│   ├── Dockerfile
│   └── railway.toml
└── frontend/
    ├── src/
    │   ├── App.jsx              ← rotas: /dashboard /crm /projetos /especificadores /especificadores/:id
    │   ├── main.jsx
    │   ├── components/
    │   │   ├── layout/          ← AppLayout, Sidebar, Header, AuthGuard
    │   │   ├── ui/index.jsx     ← KpiCard, Modal, ConfirmDialog, StatusBadge, Tabs, ScoreBar, etc.
    │   │   └── especificadores/EspecificadoresKpiPanel.jsx  ← painel de KPIs da carteira (topo da listagem)
    │   ├── lib/
    │   │   ├── api.js           ← axios + APIs por módulo (authApi, leadsApi, projetosApi, arquitetosApi, etc.)
    │   │   └── constants.js     ← STATUS_CONFIG (32 status), TIPO_ARQUITETO_LABELS, TIPO_INTERACAO_ARQUITETO_LABELS, SEGMENTO_CONFIG, FLAG_CONFIG, STATUS_CARTEIRA_CONFIG, formatCurrency, timeAgo
    │   ├── pages/
    │   │   ├── auth/LoginPage.jsx
    │   │   ├── dashboard/DashboardPage.jsx
    │   │   ├── crm/CRMPage.jsx
    │   │   ├── briefing/BriefingPage.jsx      ← formulário + score em tempo real (mirror local de briefing_score.py)
    │   │   ├── projetos/ProjetosPage.jsx      ← Kanban + Lista + Fila WIP
    │   │   ├── especificadores/               ← módulo Especificadores (renomeado de "Arquitetos" nesta reconciliação; ArquitetosPage.jsx antigo foi removido)
    │   │   │   ├── EspecificadoresPage.jsx     ← listagem + filtros + modal de criação
    │   │   │   ├── EspecificadorDetalhePage.jsx
    │   │   │   ├── EspecificadorDrawer.jsx
    │   │   │   ├── EspecificadorTabs.jsx       ← abas Perfil/Score/Decisores (PerfilTab, ScoreTab, ContatosTabContent, EditarEspecificadorModal)
    │   │   │   └── MetasVisitasModal.jsx       ← metas mensais de visita por consultor (gestor)
    │   │   └── PlaceholderPages.jsx           ← módulos futuros sinalizados
    │   ├── store/index.js       ← useAuthStore (persist) + useUIStore
    │   └── styles/globals.css   ← design system completo
    ├── Dockerfile               ← multi-stage: build React + nginx
    ├── nginx.conf               ← SPA routing (try_files → index.html) + /health
    └── railway.toml
```

## Módulos Implementados ✅

### Backend
- **Auth:** JWT 8h, 14 perfis (PerfilUsuario enum), require_roles() dependency
- **CRM/Leads:** CRUD + interações + qualificar/perder + histórico
- **Briefing:** formulário + score automático (10 critérios, max 100pts) + envio para fila
- **Projetos:** fila WIP, kanban por fase, mudança status com histórico imutável, alocação gestor, flag estratégico
- **Especificadores** (ex-"Arquitetos"): score RFV × Potencial × Lealdade, 7 segmentos, 5 flags, decisores multi-contato, concorrentes, dono da carteira (consultor_id/consultor_nome) com reatribuição + histórico imutável (HistoricoDonoArquiteto), metas mensais de visita por consultor (MetaVisitasConsultor), endpoint de KPIs da carteira, taxonomia unificada de 9 tipos de interação
- **Dashboard:** KPIs gerenciais, funil leads, projetos ativos, KPIs de carteira de especificadores
- **Clientes:** CRUD básico (inclui vínculo opcional a um especificador via `arquiteto_id`)
- **Colaboradores (RH01 — Cadastro do Colaborador):** ficha completa (identificação, contato pessoal/corporativo, endereço, contratação CLT/PJ, perfil comportamental DISC primário/secundário + observações, regime de trabalho, dados bancários, organograma), histórico salarial e de cargo imutáveis, documentos, desligamento (nunca exclusão — RH-RN009) e exclusão definitiva administrativa (RH-RN011, exceção à RH-RN009). Departamentos e Cargos como cadastros próprios. Branch `feature/rh`, mergeada em `main` via PR #3 (2026-07-29).

### Frontend
- **Login:** dark, branding Líder Móveis
- **Dashboard:** KPIs + funil + tabela projetos + auto-refresh 60s
- **CRM:** Kanban + Lista + Drawer + histórico interações
- **Briefing:** formulário com score em tempo real
- **Projetos:** Kanban (5 fases) + Lista + Fila WIP + Drawer (Detalhes/Status/Histórico)
- **Especificadores:** listagem + filtros (tipo/status/consultor) + painel de KPIs + drawer com abas (Perfil/Score/Decisores e concorrentes) + modal de metas de visita
- **Colaboradores:** listagem + filtros (departamento/cargo/regime/status) + modal "Novo Colaborador" + modal "Departamentos & Cargos" + drawer com 5 abas (Perfil, Contratação, Remuneração, Cargo & Progressão, Documentos)

## Módulos Pendentes (MVP Fase 1) ⏳
1. **Fechamento + Handoff** — checklist 8 itens, contrato, bloqueios RN006 (model já existe em fechamento.py)
2. **Financeiro básico** — parcelas, aprovação cadastro, bloqueios RN011
3. **Gestão Documental** — centralização arquivos com versionamento

## Regras de Negócio Implementadas
| RN | Descrição | Implementado em |
|----|-----------|-----------------|
| RN001 | Lead não avança sem qualificação | leads.py → qualificar() |
| RN002 | Briefing bloqueado se score < 70 | briefings.py → enviar_para_fila() |
| RN003 | WIP limit por projetista | wip_service.py + projetos.py → alocar_projetista() |
| RN004 | Render só após aprovação vendedor | projetos.py → mudar_status() |
| RN005 | Apresentação só após render concluído | projetos.py → mudar_status() |
| RN016 | Alerta projeto parado > 5 dias | dashboard.py, ProjetosPage.jsx |
| RN017 | Projetos nunca deletados, só arquivados; histórico imutável | projetos.py → arquivar(), HistoricoStatusProjeto |
| RN019-022 | Notificações módulo Especificadores (ex: ESPECIFICADOR_TRANSFERIDO na reatribuição de dono) | tipos criados em notificacao.py (motor pendente Fase 2) |

## Módulo Especificadores (ex-"Arquitetos") — regras específicas
- Nome do módulo é **Especificadores** (frontend: `/especificadores`, `pages/especificadores/`); o model, a tabela (`arquitetos`) e o router backend (`endpoints/arquitetos.py`, prefixo `/arquitetos`) mantiveram o nome histórico "Arquiteto" — não renomeados nesta reconciliação
- `tipo` (enum `TipoEspecificador`, 6 categorias): `arquiteto`, `engenheiro`, `designer_interiores`, `decorador`, `corretor`, `outro` (Corretor e Outro adicionados nesta reconciliação)
- Campos do cadastro: nome, escritorio, `endereco_escritorio`, telefone, email, nivel_parceria, `especialidade`, além de tipo e status_carteira
- `Cliente.arquiteto_id` — vínculo opcional de um cliente ao especificador que o indicou
- Score calculado SEMPRE no backend (`services/arquiteto_score.py`) — frontend NUNCA envia o score, só consome `GET /arquitetos/{id}/score`
- Score = média de 3 pilares (RFV, Potencial, Lealdade), cada um média de 3 critérios 0-100:
  - RFV: recência (dias desde último projeto), frequência (projetos últimos 12 meses), valor (soma contratos últimos 12 meses)
  - Potencial: quantidade de leads + projetos ativos
  - Lealdade: tempo de parceria (meses desde cadastro), consistência (meses c/ projeto nos últimos 12), taxa de conversão de leads
- 7 segmentos (`determinar_segmento`): `inativo`, `novo_promissor`, `em_risco`, `campeao`, `parceiro_fiel`, `em_ascensao`, `ocasional`
- 5 flags (`determinar_flags`): `top_indicador`, `em_risco_de_perda`, `alto_potencial`, `indicacao_alto_valor`, `especificador_esfriando` (esta última adicionada nesta reconciliação — exige em_risco + dono definido + >30 dias sem interação)
- Datas de corte de score sempre com `datetime.now(timezone.utc)` (nunca `datetime.utcnow()`) — bug de naive/aware já corrigido também nos endpoints de KPIs
- Dono da carteira: `Arquiteto.consultor_id` (FK User) + `consultor_nome` (property calculada, não persistida) — reatribuído via `PATCH /arquitetos/{id}/dono` (DIRETORIA/GERENTE_COMERCIAL), com histórico imutável em `HistoricoDonoArquiteto` (RN017) e notificação `ESPECIFICADOR_TRANSFERIDO` ao novo consultor
- Metas de visita: `MetaVisitasConsultor` (meta mensal por vendedor, configurada pelo gestor) + `GET /arquitetos/metas-visitas/me` para o vendedor acompanhar seu progresso
- `GET /arquitetos/kpis` — KPIs agregados da carteira (ativos, % venda com especificador no mês/ano, atendimentos e visitas ao escritório no mês)
- Interações (`InteracaoArquiteto`) usam taxonomia unificada de 9 tipos: `ligacao`, `whatsapp`, `email`, `visita_escritorio`, `visita_loja`, `reuniao`, `evento`, `viagem`, `envio_brinde` — cada interação pode referenciar o lead que gerou (`lead_id`, rastreabilidade)
- Especificador (Arquiteto) nunca deletado — desativado com `is_active=False` (`DELETE /arquitetos/{id}`, RN017). Já Decisores e Concorrentes SÃO hard-deletados hoje (`db.delete(...)`) — nota de divergência com o padrão RN017, não coberta por esta reconciliação
- Vendedor vê apenas sua carteira via `consultor_id` na maioria das listagens; exceção: `GET /leads/?arquiteto_id=X` é intencionalmente de visibilidade aberta (mostra todos os leads gerados por um especificador, de qualquer vendedor, convertidos ou não) — usado pelo select "Lead gerado" na aba Perfil
- **Cuidado histórico:** existiu uma branch paralela (`feature/arch`, PR #4) com um desenho divergente e mais antigo deste módulo (`TipoArquiteto`, `vendedor_id`, `FuncionarioArquiteto` como aba Decisores) que foi **descartado** ao resolver os conflitos da PR #4 em favor do desenho acima, já reconciliado e em produção — incluindo uma migration Alembic daquela branch que apagaria as tabelas de RH e desta reconciliação (nunca deve ser aplicada)

## Módulo Projetos — fluxo de status
- Transições seguem fluxo linear do SRS (32 etapas) — mapa PROXIMOS_STATUS em ProjetosPage.jsx
- Kanban agrupa status por fase: Comercial → Apresentação → Técnico → Produção → Montagem
- Toda mudança de status registra em HistoricoStatusProjeto (imutável, com autor e observação)
- Cancelamento exige observação obrigatória
- Código gerado automaticamente: PROJ-ANO-NNN (ex: PROJ-2025-001)
- Projetista/Vendedor veem apenas seus projetos; gestores veem todos

## Módulo Colaboradores (RH01 — Cadastro do Colaborador)
- Primeiro de 11 submódulos de um SRS de RH/Departamento Pessoal (RH01-RH11) trazido pelo usuário; os demais (RH02 Comissões, RH03 Férias e Afastamentos, RH04 Acordos e Ajustes, RH05 Avaliação de Desempenho + PDI, RH06-RH11) ainda não têm spec — decompostos intencionalmente em specs sequenciais, um de cada vez. Spec do RH01: `docs/superpowers/specs/2026-07-26-colaboradores-rh01-design.md`
- Novo perfil `RH` no `PerfilUsuario` — só `RH` e `DIRETORIA` acessam o módulo (gate client-side via `podeGerenciarColaboradores(perfil)` em `store/index.js`, além do `require_roles` no backend)
- `Colaborador` linkado a `User` via `user_id` opcional; `Departamento`/`Cargo` como entidades próprias, sem constraint de unicidade de nome
- Contato dividido em pessoal/corporativo tanto para telefone (`telefone_pessoal`/`telefone_corporativo`) quanto para e-mail (`email_pessoal`/`email_corporativo`)
- Perfil comportamental DISC como par `perfil_disc_primario`/`perfil_disc_secundario` (uma avaliação DISC real normalmente resulta em 2 traços, não 1) + `observacoes_comportamentais` (texto livre) — nenhum dos dois é validado por enum no backend, só por dropdown no frontend (`PERFIL_DISC_LABELS` em `lib/constants.js`)
- Documentos só com campo URL (sem upload real — projeto não tem infra de upload em lugar nenhum); dados bancários sem criptografia ainda (ambiente demo)
- Histórico salarial e de cargo (promoções) imutáveis — só `POST` nos endpoints de histórico; `PUT /colaboradores/{id}` rejeita `salario_clt`/`remuneracao_complementar`/`data_vigencia_salario`/`cargo_id` diretamente
- `gestor_id` auto-relacionamento em `Colaborador` (mini organograma: gestor direto + subordinados diretos), validado contra auto-referência e contra gestor inexistente
- **RH-RN009:** colaborador nunca é excluído, só desligado (`is_active=False` + data/tipo/motivo/entrevista de saída)
- **RH-RN011 (exceção deliberada à RH-RN009):** exclusão definitiva (hard delete) via `DELETE /colaboradores/{id}`, restrita ao perfil `DIRETORIA` e só permitida se o colaborador já estiver desligado — serve como purga administrativa de um cadastro já encerrado (ex.: erro de cadastro), não como atalho para o desligamento. Apaga em cascata histórico salarial, histórico de cargo e documentos vinculados, e desatrela `gestor_id` de quem tinha esse colaborador como gestor direto. Não desvincula o `User` associado (`user_id`), se houver — a conta de login continua ativa
- Drawer com 5 abas (`ColaboradorDrawer.jsx` + `ColaboradorTabs.jsx`, mesmo padrão de `EspecificadorDrawer`/`EspecificadorTabs`): Perfil (dados cadastrais + organograma + Editar/Desligar/Excluir definitivamente), Contratação (regime, tipo de contrato, dados PJ se `regime=pj`, regime de trabalho, dados bancários, reatribuição de gestor), Remuneração, Cargo & Progressão, Documentos

## Padrões de Código

### Backend
- Endpoints usam serialização manual (dict), não response_model Pydantic
- `require_roles(*perfis)` como dependency para controle de acesso
- `get_current_user` para rotas autenticadas sem restrição de perfil
- Migrations via Alembic — rodar após qualquer alteração de model (ver regra obrigatória na seção dedicada abaixo)
- `model_config = {"env_file": ".env", "extra": "ignore"}` no config.py
- IMPORTANTE FastAPI: rotas fixas (ex: /fila/lista, /wip/configuracoes) declaradas ANTES de rotas dinâmicas (/{id}) para evitar conflito de matching

### Frontend
- Componentes de página em `pages/<modulo>/<ModuloPage>.jsx`
- Componentes UI reutilizáveis em `components/ui/index.jsx`
- Todas as chamadas API em `lib/api.js` agrupadas por módulo (Ex: `projetosApi.list()`)
- Design system: cores `primary` (warm-gold), `stone` (neutros)
- Fontes: Playfair Display (display/títulos) + DM Sans (corpo)
- Animações: `animate-fade-in`, `animate-slide-in-right` via globals.css
- Classes utilitárias custom: `.card`, `.card-hover`, `.btn-primary`, `.btn-secondary`, `.input`, `.label`, `.kanban-col`, `.kanban-card`, `.kpi-card`, `.badge-*`, `.table-base`

## Deploy no Railway (fluxo e lições)
- Deploy é AUTOMÁTICO a cada `git push origin main` — nada a fazer no painel
- Monorepo: cada serviço tem Root Directory próprio (`backend` e `frontend`)
- Backend roda na porta 8000, frontend (nginx) na porta 80 — configurar variável PORT em cada serviço
- O seed NÃO roda automaticamente no deploy: rodar `python seed.py` via Console do Railway,
  e somente DEPOIS do banco PostgreSQL existir (rodar antes causa crash)
- Alterar FIRST_ADMIN_PASSWORD nas Variables NÃO troca a senha de usuário já criado —
  a variável só é usada na primeira execução do seed
- /docs desabilitado em produção (DEBUG=false) — comportamento esperado, não é bug
- **Alembic é a fonte de verdade do schema a partir da migration `94d29e691390` (2026-07-28) — ver regra obrigatória na seção dedicada abaixo.** Antes disso, o schema era aplicado por `Base.metadata.create_all()` em `seed.py`; esse modo antigo está obsoleto e não deve mais ser usado para alterar tabelas existentes.
- Após alterar models: rodar migration também no Railway (Console → `alembic upgrade head`)
- Build do frontend: VITE_API_URL é injetada em BUILD TIME (ARG no Dockerfile) — mudar a variável exige redeploy

## Variáveis de Ambiente

### Backend (.env local)
```
DATABASE_URL=postgresql://postgres:861401@localhost:5432/plannit
SECRET_KEY=7f3d2a1e8b4c9f6d0e5a2b7c4d1f8e3a6b9c2d5e8f1a4b7c0d3e6f9a2b5c8d1
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=480
APP_ENV=development
DEBUG=true
ALLOWED_ORIGINS=["http://localhost:3000","http://localhost:5173"]
FIRST_ADMIN_EMAIL=admin@plannit.com.br
FIRST_ADMIN_PASSWORD=Admin@123456
FIRST_ADMIN_NAME=Administrador
```
Nota: credenciais de ambiente de desenvolvimento/demo, sem dados reais.
Ao migrar para produto real (AWS): rotacionar SECRET_KEY e senhas.

### Frontend (.env local)
```
VITE_API_URL=http://localhost:8000/api/v1
```

### Railway (produção)
Mesmas variáveis do backend, com:
- DATABASE_URL apontando para o PostgreSQL do Railway
- APP_ENV=production, DEBUG=false
- ALLOWED_ORIGINS=["https://plannit-frontend-production.up.railway.app"]
- PORT=8000 (backend) / PORT=80 (frontend)
- Frontend: VITE_API_URL=https://plannit-production.up.railway.app/api/v1

## Credenciais de Teste (após seed.py)
| Perfil | E-mail | Senha |
|--------|--------|-------|
| Diretoria | admin@plannit.com.br | Admin@123456 |
| Vendedor | vendedor@lidermoveis.com.br | Teste@123 |
| Gerente | gerente@lidermoveis.com.br | Teste@123 |
| Projetista | projetista@lidermoveis.com.br | Teste@123 |
| Conferente | conferente@lidermoveis.com.br | Teste@123 |

## Lições Aprendidas (problemas já resolvidos)
- `pydantic-settings` requer `extra="ignore"` para ignorar variáveis extras do .env
- `ALLOWED_ORIGINS` no .env precisa ser JSON array: `["http://..."]`
- `bcrypt==4.0.1` separado do `passlib==1.7.4` no requirements.txt
- `.python-version` com valor `3.12` necessário para Railway (Railpack auto-seleciona 3.13 que quebra pydantic-core)
- PostgreSQL PATH no Mac: `/Library/PostgreSQL/18/bin/`
- Python 3.14 local é incompatível com psycopg2 — usar Python 3.11 (Homebrew)
- Claude Code instalado via npm em ~/.npm-global — PATH configurado no ~/.zshrc
- Após alterar models, sempre rodar: `alembic revision --autogenerate -m "descricao"` e `alembic upgrade head`

## Setup do Ambiente Windows — lições completas (psycopg2 + Alembic)
Se um novo colaborador for configurar o projeto no Windows, este é o caminho testado:

1. **Python:** usar 3.11 ou 3.12 — Python 3.13+ não tem wheel pronto de `psycopg2-binary==2.9.9`
   e tenta compilar do zero, exigindo `pg_config` (PostgreSQL) no PATH
2. **PowerShell:** liberar execução de scripts na sessão antes de ativar o venv:
   `Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser`
3. **PostgreSQL:** instalar localmente (postgresql.org/download/windows), anotar a senha
   do superusuário `postgres` definida na instalação — é fácil esquecer ou digitar errado
4. **Criar banco local:** via pgAdmin (botão direito em Databases → Create → Database → `plannit`)
5. **Bug conhecido — UnicodeDecodeError no psycopg2 no Windows:** se o PostgreSQL local estiver
   em locale pt-BR, mensagens de erro do servidor (com acentos) quebram o parser UTF-8 do
   psycopg2 ANTES de mostrar o erro real — mascarando problemas como senha incorreta.
   Diagnóstico: trocar temporariamente para `psycopg` (v3) que trata isso melhor:
   `pip install "psycopg[binary]"`, testar conexão isolada, e então corrigir a causa raiz
   (geralmente senha incorreta no `.env`).
   Solução definitiva testada: usar driver `psycopg` (v3) na DATABASE_URL:
   `postgresql+psycopg://usuario:senha@localhost:5432/banco`
6. **.env no Windows:** evitar Notepad puro (pode gravar em ANSI/Windows-1252 e corromper
   caracteres). Gravar via PowerShell forçando ASCII:
   ```powershell
   [System.IO.File]::WriteAllText("$PWD\.env", $conteudo, [System.Text.Encoding]::ASCII)
   ```
7. **alembic/script.py.mako ausente:** esse arquivo é gerado por `alembic init` mas pode não
   estar commitado no repo. Recriar manualmente se faltar (template padrão do Alembic).
8. **alembic/versions/ ausente:** criar a pasta manualmente se o Alembic reclamar de
   `FileNotFoundError` ao gerar a primeira revision: `New-Item -ItemType Directory -Path "alembic\versions" -Force`

## Alembic — regra obrigatória a partir da migration inicial (2026-07-28)
- **seed.py** originalmente criava tabelas via `Base.metadata.create_all()` — isso NÃO deve
  mais ser a fonte de verdade do schema. A partir da primeira migration (`94d29e691390_schema_inicial_completo`),
  todo o controle de schema passa a ser feito via Alembic.
- Fluxo correto para qualquer alteração de model:
  1. Alterar o model em `app/models/`
  2. Local: `alembic revision --autogenerate -m "descricao da mudanca"`
  3. Revisar o arquivo gerado em `alembic/versions/` — **conferir com cuidado se não há
     `op.drop_table`/`op.drop_column` inesperados**, sintoma de que o autogenerate rodou
     contra um checkout de models desatualizado (já aconteceu: ver nota na seção do módulo Especificadores)
  4. Commit + push
  5. Após deploy no Railway: Console → `alembic upgrade head`
- **Se o banco já tiver as tabelas criadas por `create_all()` antes do Alembic existir**
  (nosso caso — banco de produção já tinha tudo, tanto do módulo Projetos/Especificadores
  quanto do módulo de Colaboradores/RH): rodar UMA VEZ
  `alembic stamp head` para sincronizar o histórico sem tentar recriar tabelas existentes.
  Depois disso, seguir o fluxo normal de migrations.
- Erro `DuplicateObject: type "X" already exists` ao rodar `alembic upgrade head` é o sintoma
  clássico desse conflito create_all() vs Alembic — a solução é `alembic stamp head`, não
  apagar tabelas.
- Tabelas confirmadas no banco na migration inicial (`94d29e691390`): `departamentos`, `cargos`,
  `colaboradores` (indexado por `cpf`), `historico_cargo_colaboradores`, `historico_salarial_colaboradores`,
  `documentos_colaboradores`, `metas_visitas_consultor`, `concorrentes_arquitetos`, `historico_dono_arquitetos`,
  `interacoes_arquitetos`, `decisores_arquitetos` — todas já documentadas nas seções de Especificadores e
  Colaboradores acima.

## Como Rodar Localmente
```bash
# Backend (PyCharm)
cd backend
source venv/bin/activate
uvicorn app.main:app --reload --port 8000
# Acesse: http://localhost:8000/docs

# Frontend (VS Code)
cd frontend
npm run dev
# Acesse: http://localhost:5173

# Seed (popular banco)
cd backend && python seed.py
```

## Como Trabalhar Neste Projeto (para novos colaboradores)
1. Clone o repo e leia este CLAUDE.md por completo
2. Configure os .env conforme seção acima
3. Rode o seed para popular o banco local
4. Use Claude Code na RAIZ do projeto (lider-moveis/) — não dentro de backend/ ou frontend/
5. Toda decisão importante (nova RN, mudança de arquitetura, problema resolvido) deve ser
   registrada NESTE arquivo e commitada — este arquivo é a memória compartilhada do projeto
6. git push origin main = deploy automático no Railway (~3-5 min)
7. **Antes de escrever código em qualquer branch, dar `git pull` / conferir se `main` já não
   avançou** — já aconteceu de uma branch (`feature/arch`, PR #4) ficar semanas desatualizada
   em relação a um trabalho de reconciliação feito em paralelo em `main`, gerando conflitos
   de desenho (não só textuais) e uma migration autogenerada que apagaria tabelas reais
