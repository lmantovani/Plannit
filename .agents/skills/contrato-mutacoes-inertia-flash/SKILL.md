---
name: contrato-mutacoes-inertia-flash
description: >-
  Use esta skill sempre que criar ou alterar Controllers, endpoints de mutação (POST/PATCH/DELETE)
  ou formulários no Plannit. A skill garante o cumprimento do contrato Inertia.js (React 19), o
  padrão de flash messages repassadas ao Sonner (apenas 'error', 'success' e 'info'), a validação
  VineJS e o suporte a respostas JSON paralelas via wantsJson().
---

# Contrato de Mutações Inertia & Flash Messages

O Plannit é um monólito unificado em **AdonisJS v7 + Inertia.js (React 19)**. Não existe uma API REST separada (`/api/v1`). Toda mutação de interface segue o padrão do Inertia: requisição HTTP ➔ validação VineJS ➔ mutação no banco ➔ flash message ➔ redirecionamento (`redirect().back()`).

---

## 🎯 Regras Obrigatórias do Controller

### 1. Flash Messages — Somente Chaves Autorizadas
O middleware do Inertia (`InertiaMiddleware.flash`) repassa para o frontend **apenas** 3 chaves específicas:
- `session.flash('error', 'Mensagem de erro')`
- `session.flash('success', 'Mensagem de sucesso')`
- `session.flash('info', 'Mensagem informativa')`

> [!CAUTION]
> **Atenção:** Qualquer outra chave de flash (como `warning`, `message`, `status`, `alerta`) é **descartada silenciosamente** pelo middleware e **nunca** aparecerá como toast no frontend.

### 2. Nunca responda JSON para requisições Inertia
Quando o frontend dispara um formulário via `useForm` ou `router.post`, o cabeçalho `X-Inertia: true` está presente.
- ❌ **Incorreto:** `return response.badRequest({ message: 'Erro...' })` (quebra a tela do usuário com modal cinza de erro do Inertia).
- ✅ **Correto:** Gravar a mensagem no flash e redirecionar:
  ```typescript
  session.flash('error', 'Não foi possível concluir a ação.')
  return response.redirect().back()
  ```

### 3. Suporte a JSON Paralelo com `wantsJson()`
Para suportar scripts automatizados de teste HTTP, testes Japa e eventuais chamadas assíncronas, todo controller de mutação deve implementar o helper privado `wantsJson()`:

```typescript
private wantsJson(request: HttpContext['request']): boolean {
  const isInertia = Boolean(request.header('x-inertia'))
  if (isInertia) return false
  const accept = request.header('accept') || ''
  return accept.includes('application/json') || request.ajax() || request.qs().format === 'json'
}
```

Quando `wantsJson()` for verdadeiro, retorne JSON estruturado com status HTTP adequado e códigos de erro de regra de negócio (ex.: `code: 'RN005_RENDER_NAO_CONCLUIDO'`).

---

## 💻 Estrutura Canônica de um Método de Mutação

```typescript
import type { HttpContext } from '@adonisjs/core/http'
import { atualizarItemValidator } from '#validators/item'

export default class ItensController {
  private wantsJson(request: HttpContext['request']): boolean {
    const isInertia = Boolean(request.header('x-inertia'))
    if (isInertia) return false
    const accept = request.header('accept') || ''
    return accept.includes('application/json') || request.ajax() || request.qs().format === 'json'
  }

  async update({ request, response, session, auth }: HttpContext) {
    const user = auth.user!

    // 1. Validação estrita VineJS
    const payload = await request.validateUsing(atualizarItemValidator)

    // 2. Validação de Regra de Negócio
    if (condicaoInvalida) {
      if (this.wantsJson(request)) {
        return response.badRequest({
          code: 'RN_REGRA_VIOLADA',
          message: 'Descrição clara da regra que impediu a ação.',
        })
      }
      session.flash('error', 'Descrição clara da regra que impediu a ação.')
      return response.redirect().back()
    }

    // 3. Execução no banco
    await item.merge(payload).save()

    // 4. Retorno padronizado
    if (this.wantsJson(request)) {
      return response.ok({ success: true, item })
    }

    session.flash('success', 'Item atualizado com sucesso!')
    return response.redirect().back()
  }
}
```

---

## 🎨 Consumo no Frontend (React 19 / Inertia)

No frontend, utilize `useForm` ou `router` do `@inertiajs/react`. Os toasts são exibidos automaticamente pelo componente `Toaster` do Sonner em `app_layout.tsx`:

```tsx
import { useForm } from '@inertiajs/react'

export function MeuFormulario() {
  const { data, setData, post, processing, errors } = useForm({
    nome: '',
  })

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    post('/meu-endpoint', {
      preserveScroll: true,
      onSuccess: () => {
        // O toast de sucesso já é disparado automaticamente pela flash message!
        fecharModal()
      },
    })
  }

  return (
    <form onSubmit={handleSubmit}>
      {/* ... inputs com feedback visual de errors ... */}
    </form>
  )
}
```
