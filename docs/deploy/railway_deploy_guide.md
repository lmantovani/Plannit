# Guia de Deploy & Migração — Railway App 🚂

Este guia detalha o processo para atualizar um projeto **já existente no Railway** (que rodava o código legado em Python na branch `main`) para o novo monólito unificado **Plannit (AdonisJS v7 + Inertia React 19)**, com foco especial na **substituição e reset limpo do banco de dados PostgreSQL**.

---

## 🔄 Cenário 1: Atualizando o Projeto que Já Existe no Railway

Se você já tem o serviço e o banco PostgreSQL rodando no Railway na branch `main` antiga:

### 1. Atualizar a Branch de Deploy no Railway
1. Acesse o [Railway Dashboard](https://railway.app/dashboard) e clique no seu projeto existente.
2. Clique no card do serviço da aplicação.
3. Vá na aba **`Settings`**.
4. Na seção **`Source`**, localize o campo **`Branch`**:
   - Se você fez `git push origin main`, mantenha **`main`**.
   - Se estiver usando a branch de teste, mude para **`feature/railway-deploy`**.

---

### 2. Substituir ou Resetar o Banco de Dados PostgreSQL ⚠️
Como a estrutura anterior do Python/Alembic é incompatível com as novas tabelas e relacionamentos do Lucid ORM, o banco de dados deve ser zerado/substituído para que as novas migrations do Adonis rodem com 100% de integridade.

Você pode escolher uma das duas opções abaixo:

#### 🟢 Opção A (Mais Simples e Recomendada): Recriar o Serviço do PostgreSQL
1. No canvas do Railway, clique no card do seu serviço **PostgreSQL atual**.
2. Vá até a aba **`Settings`**, desça até o final da página e clique em **`Delete Service`** (confirme o nome para excluir).
3. No canto superior direito do canvas, clique em **`+ New`** ➔ **`Database`** ➔ **`Add PostgreSQL`**.
4. O Railway provisionará um novo banco limpo instantaneamente.
5. *(Se sua variável `DATABASE_URL` no serviço do Plannit usa `${{Postgres.DATABASE_URL}}`, ela reconectará automaticamente ao novo banco).*

#### 🟡 Opção B: Resetar o Banco Existente (Sem Deletar o Serviço)
Se preferir manter o mesmo container do Postgres:
1. Clique no card do **PostgreSQL** no canvas do Railway.
2. Acesse a aba **`Data`** (ou use a aba **`Connect`** para rodar via psql).
3. Execute o seguinte comando SQL para limpar todas as tabelas antigas do Python de uma vez:
   ```sql
   DROP SCHEMA public CASCADE;
   CREATE SCHEMA public;
   GRANT ALL ON SCHEMA public TO postgres;
   GRANT ALL ON SCHEMA public TO public;
   ```
4. Pronto! O banco estará zerado e pronto para receber o novo schema.

---

### 3. Atualizar as Variáveis de Ambiente (De Python para AdonisJS)
No serviço da aplicação (Plannit), vá na aba **`Variables`**:

1. **Remova** variáveis obsoletas do Python (como `SECRET_KEY`, `ACCESS_TOKEN_EXPIRE_MINUTES`, `ALGORITHM`).
2. **Adicione / Ajuste** as variáveis necessárias do AdonisJS:

| Variável | Valor | Finalidade |
|:---|:---|:---|
| **`DATABASE_URL`** | `${{Postgres.DATABASE_URL}}` | Vincula à conexão do PostgreSQL no Railway. |
| **`NODE_ENV`** | `production` | Ativa o modo compilado e otimizações de performance. |
| **`HOST`** | `0.0.0.0` | **Obrigatório:** permite que o container escute o tráfego externo. |
| **`APP_KEY`** | *(sua chave gerada)* | Chave de segurança gerada via `node ace generate:key`. |
| **`SESSION_DRIVER`** | `cookie` | Sessão encriptada para login via cookies HTTP-only. |
| **`LOG_LEVEL`** | `info` | Nível de logs da aplicação em produção. |
| **`APP_URL`** | `https://sua-url.up.railway.app` | A URL pública que já está ativa no Railway. |

> [!NOTE]
> **Sobre a Porta (`PORT`):** O Railway injeta a variável `PORT` automaticamente. O AdonisJS v7 já está configurado para ler essa porta sem que você precise declará-la manualmente.

---

### 4. Deploy Automático & Execução das Migrations
1. Assim que a branch e as variáveis forem salvas (ou ao disparar um novo deploy), o Railway iniciará o build com o [`Dockerfile`](file:///home/porto/codespace/Plannit/Dockerfile) e [`railway.toml`](file:///home/porto/codespace/Plannit/railway.toml).
2. Durante a inicialização, o [`docker-entrypoint.sh`](file:///home/porto/codespace/Plannit/docker-entrypoint.sh) detectará o novo PostgreSQL e executará automaticamente:
   ```bash
   node ace.js migration:run --force
   ```
   Isso criará todas as 15+ tabelas, constraints e relacionamentos limpos no banco antes de abrir o servidor web.

---

### 5. Executar o Seed Inicial (Usuários, Roteiros e Catálogos)
Para popular o banco novo com todos os usuários de teste (Diretoria, Gerente, Vendedores, etc.), catálogos e os 18 roteiros técnicos de briefing:

1. No painel do Railway, clique no serviço **Plannit** ➔ aba **`Deployments`** ➔ clique no deploy ativo.
2. Clique no botão **`Terminal`** (console do container).
3. Execute:
   ```bash
   node ace.js db:seed
   ```
4. Você verá a confirmação do seeder concluído com sucesso.

---

### 6. Login na Plataforma
Acesse a URL do Railway e faça login com:
- **Diretoria (Admin):** `admin@plannit.com.br` / `Admin@123456`
- **Gerente Comercial:** `gerente@lidermoveis.com.br` / `Teste@123`
- **Vendedor:** `vendedor@lidermoveis.com.br` / `Teste@123`

---

## 🆕 Cenário 2: Criando um Novo Projeto do Zero no Railway

Caso prefira criar um ambiente novo paralelo:
1. No [Railway](https://railway.app/dashboard), clique em **`+ New Project`** ➔ **`Deploy from GitHub repo`** ➔ Selecione `Plannit`.
2. Clique em **`+ New`** ➔ **`Database`** ➔ **`Add PostgreSQL`**.
3. Configure as variáveis descritas no Passo 3.
4. Em **`Settings`** ➔ **`Networking`**, clique em **`Generate Domain`** para gerar a URL pública.
5. Acesse o **`Terminal`** do deployment e execute `node ace.js db:seed`.
