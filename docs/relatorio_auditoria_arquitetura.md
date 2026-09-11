# Relatório de Consultoria: Auditoria Arquitetural de Backend

**Projeto:** Plannit (Módulo Backend)
**Objetivo:** Avaliar a aderência da arquitetura atual às boas práticas de engenharia de software do mercado, focando em escalabilidade, segurança e manutenibilidade.

---

## 1. Sumário Executivo

A arquitetura de backend atual do Plannit apresenta características clássicas de um MVP (Minimum Viable Product). As escolhas tecnológicas (FastAPI, SQLAlchemy, PostgreSQL) são modernas e corretas. A decisão de separar os dados de Login (`users`) dos dados de RH (`colaboradores`) foi um grande acerto inicial.

Entretanto, o código apresenta **forte acoplamento de responsabilidades** e **estruturas de dados rígidas** que causarão "travamentos" sistêmicos assim que o volume de clientes crescer, a equipe for expandida ou a empresa transicionar para um modelo de franquias (multi-tenancy). 

Abaixo, listamos os 4 principais débitos técnicos arquiteturais encontrados e as recomendações para mitigá-los.

---

## 2. Achados e Recomendações Técnicas

### Achado 1: Gestão de Acessos (IAM) Rígida e Limitada
* **Contexto:** A tabela de usuários (`models/user.py`) utiliza um Enum (`PerfilUsuario`) para definir o nível de acesso de cada pessoa.
* **O Problema:** Um Enum restringe o usuário a possuir **apenas um papel (role)** no sistema por vez. No cenário real de uma loja, um "Diretor" frequentemente precisa operar como "Vendedor", ou um "Projetista" recém-promovido a "Gerente" ainda precisa finalizar projetos antigos. A estrutura atual impede que um usuário "vista múltiplos chapéus", forçando a criação de contas duplicadas ou o compartilhamento de senhas (grave falha de segurança).
* **Risco de Negócio:** Engessamento da operação e dificuldade de adequação às normas de segurança (LGPD).
* **Recomendação (Mercado):** Refatorar o controle de acessos para o padrão **RBAC (Role-Based Access Control)**. 
  - Remover a coluna `perfil` da tabela `users`.
  - Criar uma tabela associativa `user_roles` (Muitos-para-Muitos), permitindo que um usuário possua permissões cumulativas.

### Achado 2: Desconexão Física (Acoplamento Fraco) entre Identidade e Negócio
* **Contexto:** Existem tabelas físicas separadas para o Usuário de acesso (`users`) e as entidades físicas (`colaboradores`, `clientes`, `arquitetos`).
* **O Problema:** Embora a tabela `colaboradores` tenha uma chave apontando para `user_id`, a tabela primária de `users` é "cega". Quando um usuário faz login e recebe seu token, a API não sabe fisicamente se aquele token pertence a um funcionário, cliente ou arquiteto externo sem fazer consultas adicionais e muitas vezes dependendo de e-mails iguais.
* **Risco de Negócio:** Inconsistência de dados (registros órfãos) e falhas de segurança (um cliente conseguindo acessar rotas de funcionários caso o Enum falhe).
* **Recomendação (Mercado):** Implementar chaves estrangeiras explícitas na tabela de `User`. 
  - O `User` deve conter as colunas `colaborador_id`, `cliente_id` e `arquiteto_id` (nulas por padrão). Isso cria uma amarra estrutural em nível de banco de dados (Foreign Key), garantindo integridade referencial absoluta.

### Achado 3: Vazamento de Regra de Negócio na Camada de API (Fat Controllers)
* **Contexto:** A lógica de como o sistema opera está escrita diretamente dentro dos roteadores HTTP (ex: `api/v1/endpoints/projetos.py`).
* **O Problema:** O endpoint `POST /projetos/` atualmente busca o cliente, checa as regras financeiras (`cadastro_aprovado`), gera o código do projeto, atribui o vendedor e salva no banco. Isso significa que a "Regra de Negócio" está fundida com a "Rota da Web".
* **Risco de Negócio:** Dificuldade de expansão. Se amanhã o Plannit precisar criar um projeto automaticamente através de uma integração externa (Webhook do Pipedrive) ou um processo agendado, a regra não poderá ser reaproveitada sem duplicar o código.
* **Recomendação (Mercado):** Adotar o padrão **Clean Architecture / Service Layer**.
  - Isolar a lógica de negócio em arquivos de serviço (ex: `services/projeto_service.py`).
  - A camada de API (Roteador) deve atuar apenas como um "mensageiro": recebe o JSON da web, entrega para o Serviço processar, e devolve a resposta HTTP para o cliente.

### Achado 4: Ausência de Governança sobre a Exclusão de Dados
* **Contexto:** Alguns módulos lidam bem com a exclusão (ex: projetos usam arquivamento), mas outras relações dependem de exclusões físicas em cascata no banco de dados (`cascade="all, delete-orphan"` em Leads e Interações).
* **O Problema:** O SQLAlchemy não foi configurado de forma global para impedir exclusões reais (Hard Delete). Um bug em produção ou um DELETE mal-intencionado pode apagar irreversivelmente o histórico de contatos de um cliente, afetando as métricas de conversão de vendas.
* **Risco de Negócio:** Perda irreparável de rastreabilidade, auditoria comprometida e KPIs financeiros distorcidos.
* **Recomendação (Mercado):** Implementar o padrão **Soft Delete**.
  - Criar uma classe abstrata (`SoftDeleteMixin`) que adiciona automaticamente uma coluna `deleted_at` em todas as tabelas do sistema.
  - Sobrescrever os métodos de deleção do banco de dados para que eles apenas preencham a data de exclusão, mantendo os dados preservados para análises (Data Warehouse).

---

## 3. Conclusão da Consultoria

O sistema possui uma fundação sólida, mas necessita de uma **Refatoração Estrutural (Fase 2)** focada no isolamento de camadas e gestão de identidade antes que o volume de dados da operação seja escalado. Priorizar o item 1 (RBAC) e o item 3 (Service Layer) trará o maior retorno sobre investimento imediato, liberando a equipe para criar novas integrações de forma rápida e segura.
