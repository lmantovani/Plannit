# 🛋️ Plannit — Plataforma Operacional Líder Móveis

Plataforma unificada de Gestão Operacional para Móveis Planejados de Alto Padrão (Líder Móveis Planejados).  
Construída como monólito moderno em **AdonisJS v7 + Inertia.js (React 19 + TypeScript + TailwindCSS)** e **PostgreSQL**, baseada no SRS v3.0 (23 módulos, 74 RFs, 18 RNs e 32 etapas de fluxo operacional).

---

## 🏗️ Estrutura do Monólito

```
/ (Raiz do Projeto)
├── app/
│   ├── controllers/            # Controladores HTTP (Inertia + JSON APIs)
│   │   ├── auth_controller.ts          # Autenticação, sessão e RBAC
│   │   ├── dashboard_controller.ts     # KPIs executivos e estagnação (RN016)
│   │   ├── leads_controller.ts         # CRM, funil e qualificação (RN001)
│   │   ├── briefings_controller.ts     # Briefings técnicos, score (RN002) e roteiros
│   │   ├── fila_controller.ts          # Fila de projetos e controle WIP (RN003)
│   │   ├── projetos_controller.ts      # Versões 3D, validação de render (RN004/RN005)
│   │   ├── fechamentos_controller.ts   # Contratos, parcelas e handoff técnico
│   │   ├── clientes_controller.ts      # Ficha 360°, endereços e aprovação cadastral
│   │   ├── arquitetos_controller.ts    # Especificadores, score RFV e metas
│   │   ├── colaboradores_controller.ts # RH, cargos, salários e desligamento
│   │   ├── agenda_controller.ts        # Compromissos e integração com funil CRM
│   │   └── configuracoes_controller.ts # Gestão de catálogos, roteiros e permissões
│   ├── models/                 # Modelos Lucid ORM com PostgreSQL
│   ├── services/               # Motores de cálculo (Score Briefing, WIP, Score RFV, RBAC)
│   └── validators/             # Schemas de validação estrita VineJS
├── database/
│   ├── migrations/             # Migrações versionadas do PostgreSQL
│   └── seeders/                # Dados padrão e usuários de teste
├── inertia/
│   ├── pages/                  # Telas em React 19 (Dashboard, CRM, Briefing, etc.)
│   ├── components/             # Componentes reutilizáveis de UI
│   └── layouts/                # Layout mestre com Sidebar e Header
├── start/
│   └── routes.ts               # Mapeamento central de rotas e middlewares
├── build/                      # Build compilado para produção
├── Dockerfile                  # Dockerfile multi-stage otimizado para deploy em nuvem (Railway)
├── railway.toml                # Configuração do Railway App
├── Makefile                    # Atalhos de desenvolvimento e banco
├── package.json
└── tsconfig.json
```

---

## 🚀 Como Rodar o Projeto

### 1. Pré-requisitos
* **Node.js:** versão 24+ (`node -v`)
* **Docker & Docker Compose:** para o PostgreSQL local
* **NPM:** versão 10+

---

### 2. Passo a Passo de Execução Local

#### Passo 1: Subir o Banco de Dados (PostgreSQL no Docker)
Na raiz do repositório, execute:
```bash
make db-up
# Ou via docker compose direto:
docker compose up -d postgres
```
*(O container `plannit-postgres` iniciará na porta `5432` com usuário `postgres` e banco `plannit`).*

#### Passo 2: Configurar Variáveis de Ambiente
```bash
cp -n .env.example .env && node ace generate:key
```

#### Passo 3: Executar Migrations e Seed Inicial
```bash
make migrate
make seed
# Ou via ace direto:
node ace migration:run
node ace db:seed
```

---

### 3. Modos de Execução da Aplicação

#### 🔹 Modo Desenvolvimento (com Hot Reload, Vite e TypeScript)
```bash
make dev
# Ou:
npm run dev
```
Acesse no navegador: **[http://localhost:3333](http://localhost:3333)**

---

#### 🔹 Modo Produção (Compilado de Alta Performance)
```bash
make build
make start
# Ou:
npm run build && node --env-file=.env build/bin/server.js
```

---

#### 🔹 Verificação de Tipos TypeScript
```bash
make typecheck
# Ou:
npm run typecheck
```

---

## 🚂 Deploy no Railway App

O projeto está 100% preparado para deploy contínuo na plataforma **Railway**:
1. Conecte o repositório GitHub ao projeto no Railway.
2. Adicione o plugin **PostgreSQL** no Railway.
3. Nas variáveis de ambiente do serviço principal, configure:
   - `DATABASE_URL`: `${{Postgres.DATABASE_URL}}` (ou variáveis individuais `DB_HOST`, `DB_PORT`, `DB_USER`, `DB_PASSWORD`, `DB_DATABASE`)
   - `NODE_ENV`: `production`
   - `HOST`: `0.0.0.0`
   - `APP_KEY`: gerada via `node ace generate:key`
   - `APP_URL`: URL pública gerada pelo Railway (ex.: `https://seu-app.up.railway.app`)
   - `SESSION_DRIVER`: `cookie`
4. O `Dockerfile` multi-stage com `docker-entrypoint.sh` executa automaticamente as migrations (`node ace.js migration:run --force`) antes de iniciar o servidor na porta `$PORT`.
5. Para rodar o seed inicial no Railway, abra o console/terminal do serviço e execute:
   ```bash
   node ace.js db:seed
   ```

---

## 🔑 Credenciais de Teste (Ambiente Local)

Todos os usuários abaixo são provisionados pelo seeder (`node ace db:seed`):

| Perfil | E-mail | Senha Padrão | Acesso e Responsabilidade |
|:---|:---|:---|:---|
| 👑 **Diretoria / Admin** | `admin@plannit.com.br` | `Admin@123456` | Acesso total, configurações gerenciais e purga |
| 💼 **Gerente Comercial** | `gerente@lidermoveis.com.br` | `Teste@123` | Funil de vendas, metas, WIP e aprovações |
| 🤝 **Vendedor** | `vendedor@lidermoveis.com.br` | `Teste@123` | CRM, briefings, validação de render e contratos |
| 🎨 **Projetista** | `projetista@lidermoveis.com.br` | `Teste@123` | Fila de projetos, modelagem 3D e renderização |
| 📐 **Conferente** | `conferente@lidermoveis.com.br` | `Teste@123` | Medição in loco, laudos e adequações técnicas |

---

## 🧠 Principais Regras de Negócio e Guardrails

| Regra | Descrição | Onde está implementada |
|:---|:---|:---|
| **RN001** | Lead não avança no funil sem qualificação (orçamento, imóvel, prazo) | `leads_controller.ts` & `briefings_controller.ts` |
| **RN002** | Briefing com score < 70 é bloqueado para a fila de desenho 3D | `briefings_controller.ts:enviarParaFila` |
| **RN003** | Limite WIP por projetista (máximo de 3 projetos ativos simultâneos) | `wip_service.ts` & `fila_controller.ts:alocar` |
| **RN004/RN005** | Render 3D exige validação do vendedor; apresentação requer render aprovado | `projetos_controller.ts:validarVersao3D` |
| **RN016** | Alerta automático de estagnação para projetos parados > 5 dias | `dashboard_controller.ts` & `projetos_controller.ts` |
| **RN017** | Histórico imutável de status (`HistoricoStatusProjeto`) e soft delete obrigatório | Em todas as transições de status e arquivamento |
| **RH-RN009** | Desligamento formal e histórico salarial/cargos estritamente imutável | `colaboradores_controller.ts` |

---

## 📖 Manual Completo do Usuário

O manual visual e operacional completo com o passo a passo de cada tela, perfis autorizados e regras de negócio está disponível em:
* Arquivo HTML: `docs/manual/manual_do_usuario_plannit.html` (abrir no navegador para leitura interativa).

---

*Líder Móveis Planejados · Plannit v2.0 (AdonisJS v7 + Inertia)*
