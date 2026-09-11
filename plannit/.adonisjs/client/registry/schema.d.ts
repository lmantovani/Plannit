/* eslint-disable prettier/prettier */
/// <reference path="../manifest.d.ts" />

import type { ExtractBody, ExtractErrorResponse, ExtractQuery, ExtractQueryForGet, ExtractResponse } from '@tuyau/core/types'
import type { InferInput, SimpleError } from '@vinejs/vine/types'

export type ParamValue = string | number | bigint | boolean

export interface Registry {
  'session.create': {
    methods: ["GET","HEAD"]
    pattern: '/login'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/session_controller').default['create']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/session_controller').default['create']>>>
    }
  }
  'session.store': {
    methods: ["POST"]
    pattern: '/login'
    types: {
      body: ExtractBody<InferInput<(typeof import('#validators/user').loginValidator)>>
      paramsTuple: []
      params: {}
      query: ExtractQuery<InferInput<(typeof import('#validators/user').loginValidator)>>
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/session_controller').default['store']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/session_controller').default['store']>>> | { status: 422; response: { errors: SimpleError[] } }
    }
  }
  'dashboard': {
    methods: ["GET","HEAD"]
    pattern: '/dashboard'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: {}
      response: unknown
      errorResponse: unknown
    }
  }
  'session.destroy': {
    methods: ["POST"]
    pattern: '/logout'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/session_controller').default['destroy']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/session_controller').default['destroy']>>>
    }
  }
  'crm.index': {
    methods: ["GET","HEAD"]
    pattern: '/crm'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/leads_controller').default['index']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/leads_controller').default['index']>>>
    }
  }
  'crm.leads.store': {
    methods: ["POST"]
    pattern: '/crm/leads'
    types: {
      body: ExtractBody<InferInput<(typeof import('#validators/lead').createLeadValidator)>>
      paramsTuple: []
      params: {}
      query: ExtractQuery<InferInput<(typeof import('#validators/lead').createLeadValidator)>>
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/leads_controller').default['store']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/leads_controller').default['store']>>> | { status: 422; response: { errors: SimpleError[] } }
    }
  }
  'crm.leads.update_status': {
    methods: ["PATCH"]
    pattern: '/crm/leads/:id/status'
    types: {
      body: ExtractBody<InferInput<(typeof import('#validators/lead').updateStatusValidator)>>
      paramsTuple: [ParamValue]
      params: { id: ParamValue }
      query: ExtractQuery<InferInput<(typeof import('#validators/lead').updateStatusValidator)>>
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/leads_controller').default['updateStatus']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/leads_controller').default['updateStatus']>>> | { status: 422; response: { errors: SimpleError[] } }
    }
  }
  'crm.leads.qualificar': {
    methods: ["POST"]
    pattern: '/crm/leads/:id/qualificar'
    types: {
      body: {}
      paramsTuple: [ParamValue]
      params: { id: ParamValue }
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/leads_controller').default['qualificar']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/leads_controller').default['qualificar']>>>
    }
  }
  'crm.leads.marcar_perdido': {
    methods: ["POST"]
    pattern: '/crm/leads/:id/perder'
    types: {
      body: ExtractBody<InferInput<(typeof import('#validators/lead').perderLeadValidator)>>
      paramsTuple: [ParamValue]
      params: { id: ParamValue }
      query: ExtractQuery<InferInput<(typeof import('#validators/lead').perderLeadValidator)>>
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/leads_controller').default['marcarPerdido']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/leads_controller').default['marcarPerdido']>>> | { status: 422; response: { errors: SimpleError[] } }
    }
  }
  'crm.leads.registrar_interacao': {
    methods: ["POST"]
    pattern: '/crm/leads/:id/interacoes'
    types: {
      body: ExtractBody<InferInput<(typeof import('#validators/lead').interacaoValidator)>>
      paramsTuple: [ParamValue]
      params: { id: ParamValue }
      query: ExtractQuery<InferInput<(typeof import('#validators/lead').interacaoValidator)>>
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/leads_controller').default['registrarInteracao']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/leads_controller').default['registrarInteracao']>>> | { status: 422; response: { errors: SimpleError[] } }
    }
  }
  'briefings.index': {
    methods: ["GET","HEAD"]
    pattern: '/briefings'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/briefings_controller').default['index']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/briefings_controller').default['index']>>>
    }
  }
  'briefings.store': {
    methods: ["POST"]
    pattern: '/briefings'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/briefings_controller').default['store']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/briefings_controller').default['store']>>>
    }
  }
  'briefings.calcular_score': {
    methods: ["POST"]
    pattern: '/briefings/calcular-score'
    types: {
      body: ExtractBody<InferInput<(typeof import('#validators/briefing').calcularScoreValidator)>>
      paramsTuple: []
      params: {}
      query: ExtractQuery<InferInput<(typeof import('#validators/briefing').calcularScoreValidator)>>
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/briefings_controller').default['calcularScore']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/briefings_controller').default['calcularScore']>>> | { status: 422; response: { errors: SimpleError[] } }
    }
  }
  'briefings.edit': {
    methods: ["GET","HEAD"]
    pattern: '/briefings/:id/edit'
    types: {
      body: {}
      paramsTuple: [ParamValue]
      params: { id: ParamValue }
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/briefings_controller').default['edit']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/briefings_controller').default['edit']>>>
    }
  }
  'briefings.update': {
    methods: ["PUT"]
    pattern: '/briefings/:id'
    types: {
      body: ExtractBody<InferInput<(typeof import('#validators/briefing').saveBriefingValidator)>>
      paramsTuple: [ParamValue]
      params: { id: ParamValue }
      query: ExtractQuery<InferInput<(typeof import('#validators/briefing').saveBriefingValidator)>>
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/briefings_controller').default['update']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/briefings_controller').default['update']>>> | { status: 422; response: { errors: SimpleError[] } }
    }
  }
  'briefings.enviar_para_fila': {
    methods: ["POST"]
    pattern: '/briefings/:id/enviar-para-fila'
    types: {
      body: {}
      paramsTuple: [ParamValue]
      params: { id: ParamValue }
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/briefings_controller').default['enviarParaFila']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/briefings_controller').default['enviarParaFila']>>>
    }
  }
  'fila.index': {
    methods: ["GET","HEAD"]
    pattern: '/fila'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/fila_controller').default['index']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/fila_controller').default['index']>>>
    }
  }
  'wip.configurar': {
    methods: ["POST"]
    pattern: '/wip/configuracoes'
    types: {
      body: ExtractBody<InferInput<(typeof import('#validators/fila').configurarWipValidator)>>
      paramsTuple: []
      params: {}
      query: ExtractQuery<InferInput<(typeof import('#validators/fila').configurarWipValidator)>>
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/fila_controller').default['configurarWip']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/fila_controller').default['configurarWip']>>> | { status: 422; response: { errors: SimpleError[] } }
    }
  }
  'fila.alocar': {
    methods: ["POST"]
    pattern: '/fila/:id/alocar'
    types: {
      body: ExtractBody<InferInput<(typeof import('#validators/fila').alocarProjetistaValidator)>>
      paramsTuple: [ParamValue]
      params: { id: ParamValue }
      query: ExtractQuery<InferInput<(typeof import('#validators/fila').alocarProjetistaValidator)>>
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/fila_controller').default['alocar']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/fila_controller').default['alocar']>>> | { status: 422; response: { errors: SimpleError[] } }
    }
  }
  'fila.desalocar': {
    methods: ["POST"]
    pattern: '/fila/:id/desalocar'
    types: {
      body: {}
      paramsTuple: [ParamValue]
      params: { id: ParamValue }
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/fila_controller').default['desalocar']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/fila_controller').default['desalocar']>>>
    }
  }
  'fila.iniciar': {
    methods: ["POST"]
    pattern: '/fila/:id/iniciar'
    types: {
      body: {}
      paramsTuple: [ParamValue]
      params: { id: ParamValue }
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/fila_controller').default['iniciarExecucao']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/fila_controller').default['iniciarExecucao']>>>
    }
  }
  'projetos.arquivar': {
    methods: ["POST"]
    pattern: '/projetos/:id/arquivar'
    types: {
      body: ExtractBody<InferInput<(typeof import('#validators/fila').arquivarProjetoValidator)>>
      paramsTuple: [ParamValue]
      params: { id: ParamValue }
      query: ExtractQuery<InferInput<(typeof import('#validators/fila').arquivarProjetoValidator)>>
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/fila_controller').default['arquivar']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/fila_controller').default['arquivar']>>> | { status: 422; response: { errors: SimpleError[] } }
    }
  }
  'especificadores.index': {
    methods: ["GET","HEAD"]
    pattern: '/especificadores'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/arquitetos_controller').default['index']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/arquitetos_controller').default['index']>>>
    }
  }
  'especificadores.store': {
    methods: ["POST"]
    pattern: '/especificadores'
    types: {
      body: ExtractBody<InferInput<(typeof import('#validators/arquiteto').createArquitetoValidator)>>
      paramsTuple: []
      params: {}
      query: ExtractQuery<InferInput<(typeof import('#validators/arquiteto').createArquitetoValidator)>>
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/arquitetos_controller').default['store']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/arquitetos_controller').default['store']>>> | { status: 422; response: { errors: SimpleError[] } }
    }
  }
  'especificadores.kpis': {
    methods: ["GET","HEAD"]
    pattern: '/especificadores/kpis'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/arquitetos_controller').default['kpis']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/arquitetos_controller').default['kpis']>>>
    }
  }
  'especificadores.metas.index': {
    methods: ["GET","HEAD"]
    pattern: '/especificadores/metas-visitas'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/arquitetos_controller').default['listarMetas']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/arquitetos_controller').default['listarMetas']>>>
    }
  }
  'especificadores.metas.update': {
    methods: ["PUT"]
    pattern: '/especificadores/metas-visitas'
    types: {
      body: ExtractBody<InferInput<(typeof import('#validators/arquiteto').metaVisitasValidator)>>
      paramsTuple: []
      params: {}
      query: ExtractQuery<InferInput<(typeof import('#validators/arquiteto').metaVisitasValidator)>>
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/arquitetos_controller').default['definirMeta']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/arquitetos_controller').default['definirMeta']>>> | { status: 422; response: { errors: SimpleError[] } }
    }
  }
  'especificadores.metas.me': {
    methods: ["GET","HEAD"]
    pattern: '/especificadores/metas-visitas/me'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/arquitetos_controller').default['minhaMeta']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/arquitetos_controller').default['minhaMeta']>>>
    }
  }
  'especificadores.show': {
    methods: ["GET","HEAD"]
    pattern: '/especificadores/:id'
    types: {
      body: {}
      paramsTuple: [ParamValue]
      params: { id: ParamValue }
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/arquitetos_controller').default['show']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/arquitetos_controller').default['show']>>>
    }
  }
  'especificadores.update': {
    methods: ["PATCH"]
    pattern: '/especificadores/:id'
    types: {
      body: ExtractBody<InferInput<(typeof import('#validators/arquiteto').updateArquitetoValidator)>>
      paramsTuple: [ParamValue]
      params: { id: ParamValue }
      query: ExtractQuery<InferInput<(typeof import('#validators/arquiteto').updateArquitetoValidator)>>
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/arquitetos_controller').default['update']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/arquitetos_controller').default['update']>>> | { status: 422; response: { errors: SimpleError[] } }
    }
  }
  'especificadores.destroy': {
    methods: ["DELETE"]
    pattern: '/especificadores/:id'
    types: {
      body: {}
      paramsTuple: [ParamValue]
      params: { id: ParamValue }
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/arquitetos_controller').default['destroy']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/arquitetos_controller').default['destroy']>>>
    }
  }
  'especificadores.reatribuir_dono': {
    methods: ["PATCH"]
    pattern: '/especificadores/:id/dono'
    types: {
      body: ExtractBody<InferInput<(typeof import('#validators/arquiteto').reatribuirDonoValidator)>>
      paramsTuple: [ParamValue]
      params: { id: ParamValue }
      query: ExtractQuery<InferInput<(typeof import('#validators/arquiteto').reatribuirDonoValidator)>>
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/arquitetos_controller').default['reatribuirDono']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/arquitetos_controller').default['reatribuirDono']>>> | { status: 422; response: { errors: SimpleError[] } }
    }
  }
  'especificadores.historico_dono': {
    methods: ["GET","HEAD"]
    pattern: '/especificadores/:id/historico-dono'
    types: {
      body: {}
      paramsTuple: [ParamValue]
      params: { id: ParamValue }
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/arquitetos_controller').default['historicoDono']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/arquitetos_controller').default['historicoDono']>>>
    }
  }
  'especificadores.score': {
    methods: ["GET","HEAD"]
    pattern: '/especificadores/:id/score'
    types: {
      body: {}
      paramsTuple: [ParamValue]
      params: { id: ParamValue }
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/arquitetos_controller').default['score']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/arquitetos_controller').default['score']>>>
    }
  }
  'especificadores.decisores.index': {
    methods: ["GET","HEAD"]
    pattern: '/especificadores/:id/decisores'
    types: {
      body: {}
      paramsTuple: [ParamValue]
      params: { id: ParamValue }
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/arquitetos_controller').default['listarDecisores']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/arquitetos_controller').default['listarDecisores']>>>
    }
  }
  'especificadores.decisores.store': {
    methods: ["POST"]
    pattern: '/especificadores/:id/decisores'
    types: {
      body: ExtractBody<InferInput<(typeof import('#validators/arquiteto').decisorValidator)>>
      paramsTuple: [ParamValue]
      params: { id: ParamValue }
      query: ExtractQuery<InferInput<(typeof import('#validators/arquiteto').decisorValidator)>>
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/arquitetos_controller').default['criarDecisor']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/arquitetos_controller').default['criarDecisor']>>> | { status: 422; response: { errors: SimpleError[] } }
    }
  }
  'especificadores.decisores.update': {
    methods: ["PATCH"]
    pattern: '/especificadores/:id/decisores/:decisorId'
    types: {
      body: ExtractBody<InferInput<(typeof import('#validators/arquiteto').updateDecisorValidator)>>
      paramsTuple: [ParamValue, ParamValue]
      params: { id: ParamValue; decisorId: ParamValue }
      query: ExtractQuery<InferInput<(typeof import('#validators/arquiteto').updateDecisorValidator)>>
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/arquitetos_controller').default['atualizarDecisor']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/arquitetos_controller').default['atualizarDecisor']>>> | { status: 422; response: { errors: SimpleError[] } }
    }
  }
  'especificadores.decisores.destroy': {
    methods: ["DELETE"]
    pattern: '/especificadores/:id/decisores/:decisorId'
    types: {
      body: {}
      paramsTuple: [ParamValue, ParamValue]
      params: { id: ParamValue; decisorId: ParamValue }
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/arquitetos_controller').default['removerDecisor']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/arquitetos_controller').default['removerDecisor']>>>
    }
  }
  'especificadores.concorrentes.index': {
    methods: ["GET","HEAD"]
    pattern: '/especificadores/:id/concorrentes'
    types: {
      body: {}
      paramsTuple: [ParamValue]
      params: { id: ParamValue }
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/arquitetos_controller').default['listarConcorrentes']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/arquitetos_controller').default['listarConcorrentes']>>>
    }
  }
  'especificadores.concorrentes.store': {
    methods: ["POST"]
    pattern: '/especificadores/:id/concorrentes'
    types: {
      body: ExtractBody<InferInput<(typeof import('#validators/arquiteto').concorrenteValidator)>>
      paramsTuple: [ParamValue]
      params: { id: ParamValue }
      query: ExtractQuery<InferInput<(typeof import('#validators/arquiteto').concorrenteValidator)>>
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/arquitetos_controller').default['criarConcorrente']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/arquitetos_controller').default['criarConcorrente']>>> | { status: 422; response: { errors: SimpleError[] } }
    }
  }
  'especificadores.concorrentes.update': {
    methods: ["PATCH"]
    pattern: '/especificadores/:id/concorrentes/:concorrenteId'
    types: {
      body: ExtractBody<InferInput<(typeof import('#validators/arquiteto').updateConcorrenteValidator)>>
      paramsTuple: [ParamValue, ParamValue]
      params: { id: ParamValue; concorrenteId: ParamValue }
      query: ExtractQuery<InferInput<(typeof import('#validators/arquiteto').updateConcorrenteValidator)>>
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/arquitetos_controller').default['atualizarConcorrente']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/arquitetos_controller').default['atualizarConcorrente']>>> | { status: 422; response: { errors: SimpleError[] } }
    }
  }
  'especificadores.concorrentes.destroy': {
    methods: ["DELETE"]
    pattern: '/especificadores/:id/concorrentes/:concorrenteId'
    types: {
      body: {}
      paramsTuple: [ParamValue, ParamValue]
      params: { id: ParamValue; concorrenteId: ParamValue }
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/arquitetos_controller').default['removerConcorrente']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/arquitetos_controller').default['removerConcorrente']>>>
    }
  }
  'especificadores.interacoes.index': {
    methods: ["GET","HEAD"]
    pattern: '/especificadores/:id/interacoes'
    types: {
      body: {}
      paramsTuple: [ParamValue]
      params: { id: ParamValue }
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/arquitetos_controller').default['listarInteracoes']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/arquitetos_controller').default['listarInteracoes']>>>
    }
  }
  'especificadores.interacoes.store': {
    methods: ["POST"]
    pattern: '/especificadores/:id/interacoes'
    types: {
      body: ExtractBody<InferInput<(typeof import('#validators/arquiteto').interacaoArquitetoValidator)>>
      paramsTuple: [ParamValue]
      params: { id: ParamValue }
      query: ExtractQuery<InferInput<(typeof import('#validators/arquiteto').interacaoArquitetoValidator)>>
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/arquitetos_controller').default['criarInteracao']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/arquitetos_controller').default['criarInteracao']>>> | { status: 422; response: { errors: SimpleError[] } }
    }
  }
}
