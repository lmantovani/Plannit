---
name: padrao-testes-japa-plannit
description: >-
  Use esta skill sempre que escrever, corrigir ou executar testes funcionais no Plannit com o
  framework Japa. A skill cobre o ambiente de banco de dados compartilhado, o isolamento seguro de
  registros de teste, a autenticação com client.loginAs() e a validação de fluxos Inertia e JSON.
---

# Padrão de Testes Funcionais com Japa no Plannit

O Plannit utiliza a suíte de testes **Japa** (`@japa/runner`, `@japa/api-client`, `@japa/assert`) em `tests/functional/`.

---

## 🚨 Regra Crítica: Banco de Dados Compartilhado

- Os testes rodam contra o **mesmo PostgreSQL de desenvolvimento** (`plannit`).
- O arquivo `.env.test` apenas sobrescreve `SESSION_DRIVER=memory`.
- O `tests/bootstrap.ts` **não faz rollback nem truncate** no banco para não apagar os dados reais do desenvolvedor.

> [!IMPORTANT]
> **Isolamento Obrigatório:** Todo registro criado em testes (códigos de projetos, e-mails, títulos) **deve usar sufixos únicos** baseados em timestamp para evitar conflitos de unique constraint ou colisões:
> ```typescript
> const emailUnico = `teste_${Date.now()}@lidermoveis.com.br`
> const codigoProjeto = `PRJ-TEST-${Date.now()}`
> ```

---

## 💻 Estrutura Canônica de um Teste Funcional

Crie seus testes em `tests/functional/<modulo>.spec.ts`:

```typescript
import { test } from '@japa/runner'
import User, { PerfilUsuario } from '#models/user'
import Projeto, { StatusProjeto } from '#models/projeto'

test.group('Módulo X — Regras de Negócio', () => {
  test('bloqueia ação para usuário não autenticado', async ({ client }) => {
    const response = await client.get('/meu-modulo')
    response.assertRedirectsTo('/login')
  })

  test('vendedor autenticado cria registro com sucesso', async ({ client }) => {
    // 1. Obter ou criar usuário com perfil apropriado
    const vendedor = await User.findByOrFail('email', 'vendedor@lidermoveis.com.br')

    // 2. Disparar requisição autenticada
    const response = await client
      .post('/meu-modulo')
      .loginAs(vendedor)
      .header('x-inertia', 'true') // Simula requisição originada do Inertia
      .form({
        nome: `Item Teste ${Date.now()}`,
      })

    // 3. Asserções do padrão Inertia (Redirect + Flash)
    response.assertStatus(302)
    response.assertSession('success', 'Item criado com sucesso!')
  })

  test('valida guardrail com retorno JSON quando solicitado', async ({ client }) => {
    const vendedor = await User.findByOrFail('email', 'vendedor@lidermoveis.com.br')

    // Simula chamada de API / script automatizado
    const response = await client
      .post('/projetos/123/mudar-status')
      .loginAs(vendedor)
      .header('accept', 'application/json')
      .json({
        status: StatusProjeto.APRESENTACAO,
      })

    response.assertStatus(400)
    response.assertBodyContains({
      code: 'RN005_RENDER_NAO_CONCLUIDO',
    })
  })
})
```

---

## ⚡ Comandos para Executar Testes

Execute diretamente da raiz do repositório:

```bash
# Rodar todos os testes funcionais:
node ace test functional

# Rodar apenas um arquivo específico:
node ace test functional --files=tests/functional/roteiros_catalogo.spec.ts

# Filtrar por nome do teste:
node ace test --tests="bloqueia ação para usuário não autenticado"
```

