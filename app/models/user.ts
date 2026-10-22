import { UserSchema } from '#database/schema'
import hash from '@adonisjs/core/services/hash'
import { compose } from '@adonisjs/core/helpers'
import { withAuthFinder } from '@adonisjs/auth/mixins/lucid'
import { hasMany, hasOne } from '@adonisjs/lucid/orm'
import type { HasMany, HasOne } from '@adonisjs/lucid/types/relations'
import Arquiteto from '#models/arquiteto'
import MetaVisitasConsultor from '#models/meta_visitas_consultor'

export enum PerfilUsuario {
  DIRETORIA = 'diretoria',
  GERENTE_COMERCIAL = 'gerente_comercial',
  VENDEDOR = 'vendedor',
  RECEPCAO = 'recepcao',
  PROJETISTA = 'projetista',
  CONFERENTE = 'conferente',
  SUPERVISOR_MONTAGEM = 'supervisor_montagem',
  GESTOR_LOGISTICA = 'gestor_logistica',
  SAC = 'sac',
  FINANCEIRO = 'financeiro',
  MONTADOR_PROPRIO = 'montador_proprio',
  MONTADOR_TERCEIRO = 'montador_terceiro',
  ARQUITETO = 'arquiteto',
  RH = 'rh',
  CLIENTE = 'cliente',
}

export const PERFIL_LABELS: Record<PerfilUsuario, string> = {
  [PerfilUsuario.DIRETORIA]: 'Diretoria',
  [PerfilUsuario.GERENTE_COMERCIAL]: 'Gerente Comercial',
  [PerfilUsuario.VENDEDOR]: 'Vendedor',
  [PerfilUsuario.RECEPCAO]: 'Recepção',
  [PerfilUsuario.PROJETISTA]: 'Projetista',
  [PerfilUsuario.CONFERENTE]: 'Conferente Técnico',
  [PerfilUsuario.SUPERVISOR_MONTAGEM]: 'Supervisor de Montagem',
  [PerfilUsuario.GESTOR_LOGISTICA]: 'Logística',
  [PerfilUsuario.SAC]: 'SAC / Pós-Venda',
  [PerfilUsuario.FINANCEIRO]: 'Financeiro',
  [PerfilUsuario.MONTADOR_PROPRIO]: 'Montador',
  [PerfilUsuario.MONTADOR_TERCEIRO]: 'Montador Terceiro',
  [PerfilUsuario.ARQUITETO]: 'Arquiteto',
  [PerfilUsuario.RH]: 'RH',
  [PerfilUsuario.CLIENTE]: 'Cliente',
}

export const PERFIS_GESTAO: PerfilUsuario[] = [
  PerfilUsuario.DIRETORIA,
  PerfilUsuario.GERENTE_COMERCIAL,
]

export const PERFIS_INTERNOS: PerfilUsuario[] = [
  PerfilUsuario.DIRETORIA,
  PerfilUsuario.GERENTE_COMERCIAL,
  PerfilUsuario.VENDEDOR,
  PerfilUsuario.RECEPCAO,
  PerfilUsuario.PROJETISTA,
  PerfilUsuario.CONFERENTE,
  PerfilUsuario.SUPERVISOR_MONTAGEM,
  PerfilUsuario.GESTOR_LOGISTICA,
  PerfilUsuario.SAC,
  PerfilUsuario.FINANCEIRO,
  PerfilUsuario.MONTADOR_PROPRIO,
  PerfilUsuario.MONTADOR_TERCEIRO,
  PerfilUsuario.RH,
]

export const PERFIS_EXTERNOS: PerfilUsuario[] = [
  PerfilUsuario.ARQUITETO,
  PerfilUsuario.CLIENTE,
]

export default class User extends compose(UserSchema, withAuthFinder(hash)) {
  declare perfil: PerfilUsuario | string

  // Estado efêmero de simulação de perfil ("Ver como...") durante o ciclo da requisição
  isImpersonating: boolean = false
  perfilOriginal?: string
  perfilOriginalLabel?: string
  isSuperuserOriginal?: boolean
  private _customPerfilLabel?: string

  @hasMany(() => Arquiteto, { foreignKey: 'consultorId' })
  declare arquitetos: HasMany<typeof Arquiteto>

  @hasOne(() => MetaVisitasConsultor, { foreignKey: 'consultorId' })
  declare metaVisitas: HasOne<typeof MetaVisitasConsultor>

  get initials() {
    const [first, last] = this.nome ? this.nome.trim().split(/\s+/) : this.email.split('@')
    if (first && last) {
      return `${first.charAt(0)}${last.charAt(0)}`.toUpperCase()
    }
    return `${first.slice(0, 2)}`.toUpperCase()
  }

  get perfilLabel(): string {
    if (this._customPerfilLabel) return this._customPerfilLabel
    return (PERFIL_LABELS as Record<string, string>)[this.perfil] || this.perfil
  }

  /**
   * Indica se o usuário REAL (no banco de dados, antes de qualquer simulação)
   * pertence à Diretoria ou é Superusuário, podendo utilizar o seletor "Ver como...".
   */
  get canImpersonate(): boolean {
    const realPerfil = this.perfilOriginal ?? this.perfil
    const realSuper = this.isSuperuserOriginal ?? this.isSuperuser
    return Boolean(realSuper || realPerfil === PerfilUsuario.DIRETORIA)
  }

  /**
   * Aplica em memória (sem persistir no banco) o perfil simulado na sessão.
   * Idempotente: preserva os dados originais na primeira chamada.
   */
  applyImpersonation(impersonatedPerfil?: string | null, impersonatedLabel?: string | null) {
    if (this.perfilOriginal === undefined) {
      this.perfilOriginal = this.perfil
      this.perfilOriginalLabel =
        (PERFIL_LABELS as Record<string, string>)[this.perfil] || this.perfil
      this.isSuperuserOriginal = Boolean(this.isSuperuser)
    }

    if (!this.canImpersonate) {
      return
    }

    const alvo = impersonatedPerfil ? String(impersonatedPerfil).trim() : ''
    if (alvo && alvo !== this.perfilOriginal) {
      this.isImpersonating = true
      this.perfil = alvo
      this.isSuperuser = false
      this._customPerfilLabel =
        impersonatedLabel || (PERFIL_LABELS as Record<string, string>)[alvo] || alvo
    } else {
      this.isImpersonating = false
      this.perfil = this.perfilOriginal!
      this.isSuperuser = Boolean(this.isSuperuserOriginal)
      this._customPerfilLabel = undefined
    }
  }

  hasRole(roles: (PerfilUsuario | string) | (PerfilUsuario | string)[]): boolean {
    if (this.isSuperuser || this.perfil === PerfilUsuario.DIRETORIA) {
      return true
    }
    const roleList = Array.isArray(roles) ? roles : [roles]
    return (roleList as string[]).includes(this.perfil)
  }

  get isGestor(): boolean {
    return this.hasRole(PERFIS_GESTAO)
  }

  get isInterno(): boolean {
    return this.hasRole(PERFIS_INTERNOS)
  }

  async can(permissaoCodigo: string): Promise<boolean> {
    const { default: PermissionService } = await import('#services/permission_service')
    return PermissionService.hasPermission(this, permissaoCodigo)
  }

  async getPermissoes(): Promise<string[]> {
    const { default: PermissionService } = await import('#services/permission_service')
    return PermissionService.getPermissions(this)
  }
}
