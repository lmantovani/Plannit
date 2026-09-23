# 🛋️ Plannit — Plataforma Operacional Líder Móveis

Plataforma unificada de Gestão Operacional para Móveis Planejados de Alto Padrão (Líder Móveis Planejados).  
Construída como monólito moderno em **AdonisJS v7 + Inertia.js (React 19 + TypeScript + TailwindCSS)** e **PostgreSQL**, baseada no SRS v3.0 (23 módulos, 74 RFs, 18 RNs e 32 etapas de fluxo operacional).

---

## 🏗️ Estrutura do Monólito

```
plannit/
├── app/
│   ├── controllers/            # Controladores HTTP (Inertia + JSON APIs)
│   │   ├── auth_controller.ts          # Autenticação, sessão e RBAC
│   │   ├── dashboard_controller.ts     # KPIs executivos e estagnação (RN016)
│   │   ├── leads_controller.ts         # CRM, funil e qualificação (RN001)
│   │   ├── briefings_controller.ts     # Briefings técnicos, score (RN002) e parceiros
│   │   ├── fila_controller.ts          # Fila de projetos e controle WIP (RN003)
│   │   ├── projetos_controller.ts      # Versões 3D, validação de render (RN004/RN005)
│   │   ├── fechamentos_controller.ts   # Contratos, parcelas e handoff técnico
│   │   ├── clientes_controller.ts      # Ficha 360°, endereços e aprovação cadastral
│   │   ├── arquitetos_controller.ts    # Especificadores, score RFV e metas
│   │   └── colaboradores_controller.ts # RH, cargos, salários e desligamento
│   ├── models/                 # Modelos Lucid ORM com PostgreSQL
│   ├── services/               # Motores de cálculo (Score Briefing, WIP, Score RFV)
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

### 2. Passo a Passo de Execução

#### Passo 1: Subir o Banco de Dados (PostgreSQL no Docker)
Na raiz do repositório (`/home/porto/codespace/Plannit`), execute:
```bash
docker compose up -d postgres
# Ou pelo Makefile raiz:
make db-up
```
*(O container `plannit-postgres` iniciará na porta `5432` com usuário `postgres` e banco `plannit`).*

#### Passo 2: Acessar a pasta da aplicação
```bash
cd plannit
```

#### Passo 3: Configurar Variáveis de Ambiente (se necessário)
Certifique-se de que o arquivo `.env` existe (já configurado por padrão):
```bash
cp -n .env.example .env || true
```

#### Passo 4: Executar Migrations e Seed Inicial (se for a primeira execução)
```bash
node ace migration:run
node ace db:seed
# Ou via Makefile na raiz: make adonis-migrate && make adonis-seed
```

---

### 3. Modos de Execução da Aplicação

#### 🔹 Modo Desenvolvimento (com Hot Reload, Vite e TypeScript)
Ideal para desenvolvimento diário com recarregamento em tempo real:
```bash
npm run dev
# Ou pela raiz: make adonis-dev
```
Acesse no navegador: **[http://localhost:3333](http://localhost:3333)**

---

#### 🔹 Modo Produção (Compilado de Alta Performance)
Para testar a compilação final otimizada para deploy:
```bash
# 1. Compilar frontend (Vite) e backend (TypeScript)
npm run build

# 2. Iniciar o servidor Node de produção
node --env-file=.env build/bin/server.js
# Ou pela raiz: make adonis-start
```

---

#### 🔹 Verificação de Tipos TypeScript
Para validar a integridade estática do backend e frontend:
```bash
npm run typecheck
# Ou pela raiz: make adonis-typecheck
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

