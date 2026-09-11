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
  declare perfil: PerfilUsuario

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
    return PERFIL_LABELS[this.perfil] || this.perfil
  }

  hasRole(roles: PerfilUsuario | PerfilUsuario[]): boolean {
    if (this.isSuperuser || this.perfil === PerfilUsuario.DIRETORIA) {
      return true
    }
    const roleList = Array.isArray(roles) ? roles : [roles]
    return roleList.includes(this.perfil)
  }

  get isGestor(): boolean {
    return this.hasRole(PERFIS_GESTAO)
  }

  get isInterno(): boolean {
    return this.hasRole(PERFIS_INTERNOS)
  }
}
