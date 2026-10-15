# Guia de Deploy Passo a Passo — Railway App 🚂

Este guia detalha o processo completo para subir a plataforma **Plannit** na nuvem através do **Railway App** com alta disponibilidade, banco de dados PostgreSQL integrado e migrações automáticas.

---

## 📋 Pré-requisitos

1. Uma conta ativa no [Railway](https://railway.app/).
2. Acesso ao repositório GitHub (`feature/railway-deploy` ou `main`).
3. Uma chave `APP_KEY` segura gerada para o AdonisJS (gerada via `node ace generate:key`).

---

## 🚀 Passo a Passo no Painel do Railway

### 1. Criar um Novo Projeto no Railway
1. Acesse o painel do [Railway Dashboard](https://railway.app/dashboard).
2. Clique no botão **`+ New Project`**.
3. Selecione a opção **`Deploy from GitHub repo`**.
4. Escolha o repositório **`Plannit`**.
5. Se for solicitado a branch, selecione **`feature/railway-deploy`** (ou a branch que você desejar utilizar para produção).

---

### 2. Adicionar o Banco de Dados PostgreSQL
1. No canvas do seu projeto no Railway, clique em **`+ New`** (ou botão direito no canvas).
2. Selecione **`Database`** ➔ **`Add PostgreSQL`**.
3. O Railway irá provisionar um banco PostgreSQL dedicado em poucos segundos.

---

### 3. Conectar a Aplicação ao Banco de Dados & Configurar Variáveis
1. Clique no card do serviço da sua aplicação (**Plannit**).
2. Vá até a aba **`Variables`**.
3. Adicione as seguintes variáveis de ambiente:

| Variável | Valor Recomendado | Descrição |
|:---|:---|:---|
| **`DATABASE_URL`** | `${{Postgres.DATABASE_URL}}` | Vincula automaticamente à URL de conexão do PostgreSQL gerenciado pelo Railway. |
| **`NODE_ENV`** | `production` | Define o ambiente como produção para otimização de performance. |
| **`HOST`** | `0.0.0.0` | Permite que o container escute conexões de rede externas. |
| **`APP_KEY`** | *(Sua chave gerada)* | Chave de 32 bytes gerada localmente com `node ace generate:key`. |
| **`SESSION_DRIVER`** | `cookie` | Sessão baseada em cookies HTTP-only encriptados. |
| **`LOG_LEVEL`** | `info` | Nível de logs da aplicação. |
| **`APP_URL`** | *(URL gerada pelo Railway)* | Ex.: `https://plannit-production.up.railway.app` (pode preencher após gerar o domínio). |

> [!NOTE]
> **Sobre a porta (`PORT`):** O Railway injeta a variável `PORT` automaticamente no container. O AdonisJS v7 lerá esse valor de forma nativa. Não é necessário fixar a porta `PORT` manualmente.

---

### 4. Gerar o Domínio Público (URL de Acesso)
1. No serviço da aplicação **Plannit**, acesse a aba **`Settings`**.
2. Na seção **`Networking`**, clique em **`Generate Domain`**.
3. O Railway criará uma URL pública (ex.: `seu-projeto.up.railway.app`).
4. Copie essa URL e atualize a variável **`APP_URL`** na aba `Variables` com ela (incluindo `https://`).

---

### 5. Deploy & Migrations Automáticas
1. Quando você salva as variáveis ou envia novos commits, o Railway inicia o build automaticamente utilizando o [`Dockerfile`](file:///home/porto/codespace/Plannit/Dockerfile) e o [`railway.toml`](file:///home/porto/codespace/Plannit/railway.toml).
2. O Dockerfile compila:
   - Todo o backend em TypeScript (`node ace build`).
   - Todo o frontend React 19 + Inertia via Vite (`public/assets`).
3. Ao iniciar o container, o [`docker-entrypoint.sh`](file:///home/porto/codespace/Plannit/docker-entrypoint.sh) detecta o PostgreSQL e executa automaticamente:
   ```bash
   node ace.js migration:run --force
   ```
   criando todas as tabelas necessárias no banco antes de subir o servidor web.

---

### 6. Executar o Seed Inicial (Usuários e Catálogos Padrão)
Para popular o banco na primeira vez com os usuários de teste (Diretoria, Gerente, Vendedores, etc.) e os 18 roteiros de apoio e catálogos:

#### Opção A — Pelo Console do Railway (Navegador):
1. No painel do Railway, clique no serviço da aplicação.
2. Vá até a aba **`Deployments`** e clique no deployment ativo.
3. Clique no botão **`Terminal`** (ou `View Logs` ➔ ícone de terminal).
4. Digite e pressione Enter:
   ```bash
   node ace.js db:seed
   ```
5. Você verá a saída com a confirmação de todos os seeders concluídos com sucesso.

#### Opção B — Pela Railway CLI (Local):
Caso utilize a CLI do Railway na sua máquina:
```bash
railway run node ace.js db:seed
```

---

## 🔑 Credenciais Padrão Provisionadas

Após rodar o seed, você já poderá efetuar login com:

| Perfil | E-mail | Senha Padrão |
|:---|:---|:---|
| 👑 **Diretoria (Admin)** | `admin@plannit.com.br` | `Admin@123456` |
| 💼 **Gerente Comercial** | `gerente@lidermoveis.com.br` | `Teste@123` |
| 🤝 **Vendedor** | `vendedor@lidermoveis.com.br` | `Teste@123` |
| 🎨 **Projetista** | `projetista@lidermoveis.com.br` | `Teste@123` |
| 📐 **Conferente** | `conferente@lidermoveis.com.br` | `Teste@123` |

---

## 🔍 Monitoramento e Logs

- **Logs em Tempo Real:** Na aba **`Deployments`** ➔ clique no deploy atual ➔ **`Deploy Logs`** (durante o build) ou **`Runtime Logs`** (com a aplicação rodando).
- **Healthcheck:** O Railway verifica periodicamente a rota `/` (definida no `railway.toml`) para garantir que o serviço esteja online e saudável.
