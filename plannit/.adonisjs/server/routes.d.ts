import '@adonisjs/core/types/http'

type ParamValue = string | number | bigint | boolean

export type ScannedRoutes = {
  ALL: {
    'session.create': { paramsTuple?: []; params?: {} }
    'session.store': { paramsTuple?: []; params?: {} }
    'dashboard': { paramsTuple?: []; params?: {} }
    'session.destroy': { paramsTuple?: []; params?: {} }
    'crm.index': { paramsTuple?: []; params?: {} }
    'crm.leads.store': { paramsTuple?: []; params?: {} }
    'crm.leads.update_status': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'crm.leads.qualificar': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'crm.leads.desqualificar': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'crm.leads.marcar_perdido': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'crm.leads.registrar_interacao': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'briefings.index': { paramsTuple?: []; params?: {} }
    'briefings.store': { paramsTuple?: []; params?: {} }
    'briefings.calcular_score': { paramsTuple?: []; params?: {} }
    'briefings.edit': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'briefings.update': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'briefings.enviar_para_fila': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'fila.index': { paramsTuple?: []; params?: {} }
    'wip.configurar': { paramsTuple?: []; params?: {} }
    'fila.alocar': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'fila.desalocar': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'fila.iniciar': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'especificadores.index': { paramsTuple?: []; params?: {} }
    'especificadores.store': { paramsTuple?: []; params?: {} }
    'especificadores.kpis': { paramsTuple?: []; params?: {} }
    'especificadores.metas.index': { paramsTuple?: []; params?: {} }
    'especificadores.metas.update': { paramsTuple?: []; params?: {} }
    'especificadores.metas.me': { paramsTuple?: []; params?: {} }
    'especificadores.show': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'especificadores.update': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'especificadores.destroy': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'especificadores.reatribuir_dono': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'especificadores.historico_dono': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'especificadores.score': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'especificadores.decisores.index': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'especificadores.decisores.store': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'especificadores.decisores.update': { paramsTuple: [ParamValue,ParamValue]; params: {'id': ParamValue,'decisorId': ParamValue} }
    'especificadores.decisores.destroy': { paramsTuple: [ParamValue,ParamValue]; params: {'id': ParamValue,'decisorId': ParamValue} }
    'especificadores.concorrentes.index': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'especificadores.concorrentes.store': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'especificadores.concorrentes.update': { paramsTuple: [ParamValue,ParamValue]; params: {'id': ParamValue,'concorrenteId': ParamValue} }
    'especificadores.concorrentes.destroy': { paramsTuple: [ParamValue,ParamValue]; params: {'id': ParamValue,'concorrenteId': ParamValue} }
    'especificadores.interacoes.index': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'especificadores.interacoes.store': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'colaboradores.departamentos.index': { paramsTuple?: []; params?: {} }
    'colaboradores.departamentos.store': { paramsTuple?: []; params?: {} }
    'colaboradores.departamentos.update': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'colaboradores.cargos.index': { paramsTuple?: []; params?: {} }
    'colaboradores.cargos.store': { paramsTuple?: []; params?: {} }
    'colaboradores.cargos.update': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'colaboradores.index': { paramsTuple?: []; params?: {} }
    'colaboradores.store': { paramsTuple?: []; params?: {} }
    'colaboradores.show': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'colaboradores.update': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'colaboradores.patch': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'colaboradores.destroy': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'colaboradores.historico_salarial.store': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'colaboradores.historico_cargo.store': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'colaboradores.desligar': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'colaboradores.documentos.store': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'colaboradores.documentos.destroy': { paramsTuple: [ParamValue,ParamValue]; params: {'id': ParamValue,'documentoId': ParamValue} }
    'clientes.index': { paramsTuple?: []; params?: {} }
    'clientes.store': { paramsTuple?: []; params?: {} }
    'clientes.show': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'clientes.update': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'clientes.patch': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'clientes.aprovar': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'clientes.enderecos.store': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'clientes.enderecos.destroy': { paramsTuple: [ParamValue,ParamValue]; params: {'id': ParamValue,'enderecoId': ParamValue} }
    'clientes.converter_lead': { paramsTuple: [ParamValue]; params: {'leadId': ParamValue} }
    'projetos.index': { paramsTuple?: []; params?: {} }
    'projetos.show': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'projetos.mudar_status': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'projetos.arquivar': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'projetos.versoes_3d.store': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'projetos.versoes_3d.avaliar': { paramsTuple: [ParamValue,ParamValue]; params: {'id': ParamValue,'versaoId': ParamValue} }
    'projetos.versoes_3d.concluir_render': { paramsTuple: [ParamValue,ParamValue]; params: {'id': ParamValue,'versaoId': ParamValue} }
    'projetos.fechamento.show': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'projetos.fechamento.store': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'projetos.fechamento.parcelas.pagar': { paramsTuple: [ParamValue,ParamValue]; params: {'id': ParamValue,'parcelaId': ParamValue} }
    'projetos.handoff.store': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
  }
  GET: {
    'session.create': { paramsTuple?: []; params?: {} }
    'dashboard': { paramsTuple?: []; params?: {} }
    'crm.index': { paramsTuple?: []; params?: {} }
    'briefings.index': { paramsTuple?: []; params?: {} }
    'briefings.edit': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'fila.index': { paramsTuple?: []; params?: {} }
    'especificadores.index': { paramsTuple?: []; params?: {} }
    'especificadores.kpis': { paramsTuple?: []; params?: {} }
    'especificadores.metas.index': { paramsTuple?: []; params?: {} }
    'especificadores.metas.me': { paramsTuple?: []; params?: {} }
    'especificadores.show': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'especificadores.historico_dono': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'especificadores.score': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'especificadores.decisores.index': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'especificadores.concorrentes.index': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'especificadores.interacoes.index': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'colaboradores.departamentos.index': { paramsTuple?: []; params?: {} }
    'colaboradores.cargos.index': { paramsTuple?: []; params?: {} }
    'colaboradores.index': { paramsTuple?: []; params?: {} }
    'colaboradores.show': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'clientes.index': { paramsTuple?: []; params?: {} }
    'clientes.show': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'projetos.index': { paramsTuple?: []; params?: {} }
    'projetos.show': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'projetos.fechamento.show': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
  }
  HEAD: {
    'session.create': { paramsTuple?: []; params?: {} }
    'dashboard': { paramsTuple?: []; params?: {} }
    'crm.index': { paramsTuple?: []; params?: {} }
    'briefings.index': { paramsTuple?: []; params?: {} }
    'briefings.edit': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'fila.index': { paramsTuple?: []; params?: {} }
    'especificadores.index': { paramsTuple?: []; params?: {} }
    'especificadores.kpis': { paramsTuple?: []; params?: {} }
    'especificadores.metas.index': { paramsTuple?: []; params?: {} }
    'especificadores.metas.me': { paramsTuple?: []; params?: {} }
    'especificadores.show': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'especificadores.historico_dono': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'especificadores.score': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'especificadores.decisores.index': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'especificadores.concorrentes.index': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'especificadores.interacoes.index': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'colaboradores.departamentos.index': { paramsTuple?: []; params?: {} }
    'colaboradores.cargos.index': { paramsTuple?: []; params?: {} }
    'colaboradores.index': { paramsTuple?: []; params?: {} }
    'colaboradores.show': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'clientes.index': { paramsTuple?: []; params?: {} }
    'clientes.show': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'projetos.index': { paramsTuple?: []; params?: {} }
    'projetos.show': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'projetos.fechamento.show': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
  }
  POST: {
    'session.store': { paramsTuple?: []; params?: {} }
    'session.destroy': { paramsTuple?: []; params?: {} }
    'crm.leads.store': { paramsTuple?: []; params?: {} }
    'crm.leads.qualificar': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'crm.leads.desqualificar': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'crm.leads.marcar_perdido': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'crm.leads.registrar_interacao': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'briefings.store': { paramsTuple?: []; params?: {} }
    'briefings.calcular_score': { paramsTuple?: []; params?: {} }
    'briefings.enviar_para_fila': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'wip.configurar': { paramsTuple?: []; params?: {} }
    'fila.alocar': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'fila.desalocar': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'fila.iniciar': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'especificadores.store': { paramsTuple?: []; params?: {} }
    'especificadores.decisores.store': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'especificadores.concorrentes.store': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'especificadores.interacoes.store': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'colaboradores.departamentos.store': { paramsTuple?: []; params?: {} }
    'colaboradores.cargos.store': { paramsTuple?: []; params?: {} }
    'colaboradores.store': { paramsTuple?: []; params?: {} }
    'colaboradores.historico_salarial.store': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'colaboradores.historico_cargo.store': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'colaboradores.desligar': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'colaboradores.documentos.store': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'clientes.store': { paramsTuple?: []; params?: {} }
    'clientes.aprovar': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'clientes.enderecos.store': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'clientes.converter_lead': { paramsTuple: [ParamValue]; params: {'leadId': ParamValue} }
    'projetos.mudar_status': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'projetos.arquivar': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'projetos.versoes_3d.store': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'projetos.versoes_3d.avaliar': { paramsTuple: [ParamValue,ParamValue]; params: {'id': ParamValue,'versaoId': ParamValue} }
    'projetos.versoes_3d.concluir_render': { paramsTuple: [ParamValue,ParamValue]; params: {'id': ParamValue,'versaoId': ParamValue} }
    'projetos.fechamento.store': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'projetos.fechamento.parcelas.pagar': { paramsTuple: [ParamValue,ParamValue]; params: {'id': ParamValue,'parcelaId': ParamValue} }
    'projetos.handoff.store': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
  }
  PATCH: {
    'crm.leads.update_status': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'especificadores.update': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'especificadores.reatribuir_dono': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'especificadores.decisores.update': { paramsTuple: [ParamValue,ParamValue]; params: {'id': ParamValue,'decisorId': ParamValue} }
    'especificadores.concorrentes.update': { paramsTuple: [ParamValue,ParamValue]; params: {'id': ParamValue,'concorrenteId': ParamValue} }
    'colaboradores.patch': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'clientes.patch': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
  }
  PUT: {
    'briefings.update': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'especificadores.metas.update': { paramsTuple?: []; params?: {} }
    'colaboradores.departamentos.update': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'colaboradores.cargos.update': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'colaboradores.update': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'clientes.update': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
  }
  DELETE: {
    'especificadores.destroy': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'especificadores.decisores.destroy': { paramsTuple: [ParamValue,ParamValue]; params: {'id': ParamValue,'decisorId': ParamValue} }
    'especificadores.concorrentes.destroy': { paramsTuple: [ParamValue,ParamValue]; params: {'id': ParamValue,'concorrenteId': ParamValue} }
    'colaboradores.destroy': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'colaboradores.documentos.destroy': { paramsTuple: [ParamValue,ParamValue]; params: {'id': ParamValue,'documentoId': ParamValue} }
    'clientes.enderecos.destroy': { paramsTuple: [ParamValue,ParamValue]; params: {'id': ParamValue,'enderecoId': ParamValue} }
  }
}
declare module '@adonisjs/core/types/http' {
  export interface RoutesList extends ScannedRoutes {}
}