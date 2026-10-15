# Guia de Deploy & Migração — Railway App 🚂

Este guia detalha o processo para atualizar um projeto **já existente no Railway** (que rodava o código legado em Python na branch `main`) para o novo monólito unificado **Plannit (AdonisJS v7 + Inertia React 19)**, além de cobrir o setup do zero se necessário.

---

## 🔄 Cenário 1: Atualizando o Projeto que Já Existe no Railway (Recomendado)

Se você já tem o projeto e o banco PostgreSQL rodando no Railway na branch `main` antiga:

### 1. Atualizar a Branch de Deploy no Railway
1. Acesse o [Railway Dashboard](https://railway.app/dashboard) e clique no seu projeto existente.
2. Clique no card do serviço da aplicação.
3. Vá na aba **`Settings`**.
4. Na seção **`Source`**, localize o campo **`Branch`**:
   - Altere de `main` para **`feature/railway-deploy`** (ou para a branch nova onde está o monólito).
   - *(Nota: Caso você decida fazer o merge/substituição da `main` no GitHub, basta manter `main`).*

---

### 2. Atualizar as Variáveis de Ambiente (De Python para AdonisJS)
No código antigo em FastAPI eram usadas variáveis como `SECRET_KEY`, `POSTGRES_USER`, etc. Agora precisamos garantir que as variáveis do **AdonisJS v7** estejam configuradas:

1. No serviço da aplicação, vá na aba **`Variables`**.
2. **Remova** variáveis obsoletas do Python (como `SECRET_KEY`, `ACCESS_TOKEN_EXPIRE_MINUTES`, `ALGORITHM`).
3. **Adicione / Ajuste** as variáveis necessárias do AdonisJS:

| Variável | Valor | Finalidade |
|:---|:---|:---|
| **`DATABASE_URL`** | `${{Postgres.DATABASE_URL}}` | Vincula à conexão do PostgreSQL existente no Railway. |
| **`NODE_ENV`** | `production` | Ativa o modo compilado e otimizações de performance. |
| **`HOST`** | `0.0.0.0` | **Obrigatório:** permite que o container escute o tráfego externo. |
| **`APP_KEY`** | *(sua chave gerada)* | Chave de segurança gerada localmente via `node ace generate:key`. |
| **`SESSION_DRIVER`** | `cookie` | Sessão encriptada para login via cookies HTTP-only. |
| **`LOG_LEVEL`** | `info` | Nível de logs da aplicação em produção. |
| **`APP_URL`** | `https://sua-url.up.railway.app` | A URL pública que já está ativa no Railway. |

> [!NOTE]
> **Sobre o `PORT`:** O Railway injeta a variável `PORT` automaticamente. O AdonisJS v7 já está configurado para ler essa porta sem que você precise declará-la manualmente.

---

### 3. Deploy Automático & Execução das Migrations
1. Assim que a branch e as variáveis forem salvas, o Railway disparará um novo deploy.
2. O Railway detectará o [`Dockerfile`](file:///home/porto/codespace/Plannit/Dockerfile) e o [`railway.toml`](file:///home/porto/codespace/Plannit/railway.toml).
3. O script [`docker-entrypoint.sh`](file:///home/porto/codespace/Plannit/docker-entrypoint.sh) iniciará o container rodando automaticamente:
   ```bash
   node ace.js migration:run --force
   ```
   Isso criará e atualizará todas as tabelas no PostgreSQL do Railway antes de subir o servidor web.

---

### 4. Executar os Seeds Iniciais no Railway
Para garantir que o banco de dados receba os usuários padrão (Diretoria, Gerente, Vendedores) e os 18 roteiros de apoio e catálogos:

1. No painel do Railway, clique no serviço da aplicação ➔ aba **`Deployments`** ➔ clique no deploy ativo.
2. Clique na aba ou botão **`Terminal`** (console SSH do container).
3. Digite e execute:
   ```bash
   node ace.js db:seed
   ```
4. Você verá a confirmação do seeder concluído com sucesso.

---

### 5. Login na Plataforma
Acesse a URL do Railway e faça login com:
- **Diretoria (Admin):** `admin@plannit.com.br` / `Admin@123456`
- **Gerente Comercial:** `gerente@lidermoveis.com.br` / `Teste@123`
- **Vendedor:** `vendedor@lidermoveis.com.br` / `Teste@123`

---

## 🆕 Cenário 2: Criando um Novo Projeto do Zero no Railway

Caso queira criar um ambiente paralelo ou novo serviço:
1. No [Railway](https://railway.app/dashboard), clique em **`+ New Project`** ➔ **`Deploy from GitHub repo`** ➔ Selecione `Plannit` e a branch `feature/railway-deploy`.
2. Clique em **`+ New`** ➔ **`Database`** ➔ **`Add PostgreSQL`**.
3. Configure as variáveis descritas na tabela acima (especialmente `DATABASE_URL: ${{Postgres.DATABASE_URL}}` e `HOST: 0.0.0.0`).
4. Em **`Settings`** ➔ **`Networking`**, clique em **`Generate Domain`** para gerar a URL pública.
5. Acesse o **`Terminal`** do deployment e execute `node ace.js db:seed`.
