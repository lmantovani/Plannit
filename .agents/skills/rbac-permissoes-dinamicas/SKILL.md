---
name: rbac-permissoes-dinamicas
description: >-
  Use esta skill sempre que adicionar novas rotas, botões, telas ou ações restritas no Plannit. A
  skill orienta o registro correto de capacidades na Matriz Dinâmica de Permissões (tabela
  perfil_permissoes), a proteção no backend via middleware e PermissionService, a governança mestre
  da Diretoria e a renderização condicional no frontend React.
---

# Matriz Dinâmica de Permissões (RBAC) no Plannit

O Plannit utiliza uma **Matriz Dinâmica de Permissões por Perfil**, gerenciada diretamente pela Diretoria na aba "Perfis & Permissões" de `/configuracoes`. As capacidades não são fixas no código; elas são persistidas no banco e verificadas em tempo real.

---

## 🎯 Regras de Ouro de Segurança

1. **Governança Mestre Irrevogável da Diretoria:** Usuários com perfil `DIRETORIA` ou flag `isSuperuser === true` possuem bypass automático incondicional no backend. O sistema nunca bloqueia a Diretoria.
2. **Nunca use checagem estática no frontend como segurança:** O frontend apenas esconde botões para melhor experiência visual; a segurança real deve ser garantida no backend pelo middleware de rota ou no controller.
3. **Delegação da Gestão:** A permissão mestre `configuracoes.gerenciar_permissoes` autoriza alterar a matriz. Por padrão, pertence à Diretoria, mas pode ser concedida dinamicamente a outros perfis (como Gerente Comercial).

---

## 🛠️ Passo a Passo para Criar uma Nova Permissão

Quando criar uma nova funcionalidade que precise de controle de acesso:

### 1. Definir o Código da Permissão
Adote a convenção `modulo.acao`:
- Exemplos: `crm.exportar_leads`, `projetos.aprovar_render`, `financeiro.estornar_parcela`.

### 2. Registrar no Seeder Inicial (`database/seeders/perfil_permissoes_seeder.ts`)
Inclua a permissão no mapa de permissões padrão para que novos ambientes recebam o cadastro:

```typescript
// Exemplo de adição no catálogo de permissões
{
  codigo: 'projetos.aprovar_render',
  nome: 'Aprovação de Render 3D',
  modulo: 'Projetos',
  descricao: 'Permite validar e aprovar versões comerciais de renderização 3D.',
}
```

### 3. Proteger a Rota no Backend (`start/routes.ts`)
Adicione o middleware `middleware.permission('codigo')` na rota correspondente:

```typescript
router
  .patch('/projetos/:id/render/aprovar', [controllers.Projetos, 'aprovarRender'])
  .use(middleware.permission('projetos.aprovar_render'))
```

Ou realize a checagem programática dentro do Controller:

```typescript
import PermissionService from '#services/permission_service'

async aprovarRender({ auth, response, session }: HttpContext) {
  const user = auth.user!
  const autorizada = await PermissionService.hasPermission(user, 'projetos.aprovar_render')

  if (!autorizada) {
    session.flash('error', 'Seu perfil não tem permissão para aprovar renders 3D.')
    return response.redirect().back()
  }
  // Continua execução...
}
```

---

## 🎨 Consumo no Frontend (React 19 / Inertia)

O middleware `InertiaMiddleware` compartilha globalmente o array de permissões do usuário em `props.permissoes` (e em `props.user.permissoes`).

### No componente React:
```tsx
import { usePage } from '@inertiajs/react'

export function AcoesProjeto({ projeto }) {
  const { permissoes = [], user } = usePage().props as any

  // Diretoria sempre tem acesso
  const isDiretoria = user?.perfil === 'diretoria' || user?.isSuperuser
  const podeAprovar = isDiretoria || permissoes.includes('projetos.aprovar_render')

  return (
    <div>
      {podeAprovar && (
        <button className="btn-primary" onClick={handleAprovar}>
          Aprovar Render 3D
        </button>
      )}
    </div>
  )
}
```

