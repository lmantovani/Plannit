import type User from '#models/user'
import { BaseTransformer } from '@adonisjs/core/transformers'

export default class UserTransformer extends BaseTransformer<User> {
  toObject() {
    return {
      id: this.resource.id,
      nome: this.resource.nome,
      email: this.resource.email,
      telefone: this.resource.telefone,
      perfil: this.resource.perfil,
      perfilLabel: this.resource.perfilLabel,
      isActive: this.resource.isActive,
      isSuperuser: this.resource.isSuperuser,
      initials: this.resource.initials,
      createdAt: this.resource.createdAt,
      updatedAt: this.resource.updatedAt,
    }
  }
}
