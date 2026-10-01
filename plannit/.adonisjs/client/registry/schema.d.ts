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
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/dashboard_controller').default['index']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/dashboard_controller').default['index']>>>
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
      body: ExtractBody<InferInput<(typeof import('#validators/lead').qualificarLeadValidator)>>
      paramsTuple: [ParamValue]
      params: { id: ParamValue }
      query: ExtractQuery<InferInput<(typeof import('#validators/lead').qualificarLeadValidator)>>
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/leads_controller').default['qualificar']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/leads_controller').default['qualificar']>>> | { status: 422; response: { errors: SimpleError[] } }
    }
  }
  'crm.leads.desqualificar': {
    methods: ["POST"]
    pattern: '/crm/leads/:id/desqualificar'
    types: {
      body: ExtractBody<InferInput<(typeof import('#validators/lead').desqualificarLeadValidator)>>
      paramsTuple: [ParamValue]
      params: { id: ParamValue }
      query: ExtractQuery<InferInput<(typeof import('#validators/lead').desqualificarLeadValidator)>>
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/leads_controller').default['desqualificar']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/leads_controller').default['desqualificar']>>> | { status: 422; response: { errors: SimpleError[] } }
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
  'colaboradores.departamentos.index': {
    methods: ["GET","HEAD"]
    pattern: '/colaboradores/departamentos'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/colaboradores_controller').default['listarDepartamentos']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/colaboradores_controller').default['listarDepartamentos']>>>
    }
  }
  'colaboradores.departamentos.store': {
    methods: ["POST"]
    pattern: '/colaboradores/departamentos'
    types: {
      body: ExtractBody<InferInput<(typeof import('#validators/colaborador').createDepartamentoValidator)>>
      paramsTuple: []
      params: {}
      query: ExtractQuery<InferInput<(typeof import('#validators/colaborador').createDepartamentoValidator)>>
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/colaboradores_controller').default['criarDepartamento']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/colaboradores_controller').default['criarDepartamento']>>> | { status: 422; response: { errors: SimpleError[] } }
    }
  }
  'colaboradores.departamentos.update': {
    methods: ["PUT"]
    pattern: '/colaboradores/departamentos/:id'
    types: {
      body: ExtractBody<InferInput<(typeof import('#validators/colaborador').updateDepartamentoValidator)>>
      paramsTuple: [ParamValue]
      params: { id: ParamValue }
      query: ExtractQuery<InferInput<(typeof import('#validators/colaborador').updateDepartamentoValidator)>>
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/colaboradores_controller').default['atualizarDepartamento']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/colaboradores_controller').default['atualizarDepartamento']>>> | { status: 422; response: { errors: SimpleError[] } }
    }
  }
  'colaboradores.cargos.index': {
    methods: ["GET","HEAD"]
    pattern: '/colaboradores/cargos'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/colaboradores_controller').default['listarCargos']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/colaboradores_controller').default['listarCargos']>>>
    }
  }
  'colaboradores.cargos.store': {
    methods: ["POST"]
    pattern: '/colaboradores/cargos'
    types: {
      body: ExtractBody<InferInput<(typeof import('#validators/colaborador').createCargoValidator)>>
      paramsTuple: []
      params: {}
      query: ExtractQuery<InferInput<(typeof import('#validators/colaborador').createCargoValidator)>>
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/colaboradores_controller').default['criarCargo']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/colaboradores_controller').default['criarCargo']>>> | { status: 422; response: { errors: SimpleError[] } }
    }
  }
  'colaboradores.cargos.update': {
    methods: ["PUT"]
    pattern: '/colaboradores/cargos/:id'
    types: {
      body: ExtractBody<InferInput<(typeof import('#validators/colaborador').updateCargoValidator)>>
      paramsTuple: [ParamValue]
      params: { id: ParamValue }
      query: ExtractQuery<InferInput<(typeof import('#validators/colaborador').updateCargoValidator)>>
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/colaboradores_controller').default['atualizarCargo']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/colaboradores_controller').default['atualizarCargo']>>> | { status: 422; response: { errors: SimpleError[] } }
    }
  }
  'colaboradores.index': {
    methods: ["GET","HEAD"]
    pattern: '/colaboradores'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/colaboradores_controller').default['index']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/colaboradores_controller').default['index']>>>
    }
  }
  'colaboradores.store': {
    methods: ["POST"]
    pattern: '/colaboradores'
    types: {
      body: ExtractBody<InferInput<(typeof import('#validators/colaborador').createColaboradorValidator)>>
      paramsTuple: []
      params: {}
      query: ExtractQuery<InferInput<(typeof import('#validators/colaborador').createColaboradorValidator)>>
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/colaboradores_controller').default['store']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/colaboradores_controller').default['store']>>> | { status: 422; response: { errors: SimpleError[] } }
    }
  }
  'colaboradores.show': {
    methods: ["GET","HEAD"]
    pattern: '/colaboradores/:id'
    types: {
      body: {}
      paramsTuple: [ParamValue]
      params: { id: ParamValue }
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/colaboradores_controller').default['show']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/colaboradores_controller').default['show']>>>
    }
  }
  'colaboradores.update': {
    methods: ["PUT"]
    pattern: '/colaboradores/:id'
    types: {
      body: ExtractBody<InferInput<(typeof import('#validators/colaborador').updateColaboradorValidator)>>
      paramsTuple: [ParamValue]
      params: { id: ParamValue }
      query: ExtractQuery<InferInput<(typeof import('#validators/colaborador').updateColaboradorValidator)>>
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/colaboradores_controller').default['update']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/colaboradores_controller').default['update']>>> | { status: 422; response: { errors: SimpleError[] } }
    }
  }
  'colaboradores.patch': {
    methods: ["PATCH"]
    pattern: '/colaboradores/:id'
    types: {
      body: ExtractBody<InferInput<(typeof import('#validators/colaborador').updateColaboradorValidator)>>
      paramsTuple: [ParamValue]
      params: { id: ParamValue }
      query: ExtractQuery<InferInput<(typeof import('#validators/colaborador').updateColaboradorValidator)>>
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/colaboradores_controller').default['update']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/colaboradores_controller').default['update']>>> | { status: 422; response: { errors: SimpleError[] } }
    }
  }
  'colaboradores.destroy': {
    methods: ["DELETE"]
    pattern: '/colaboradores/:id'
    types: {
      body: {}
      paramsTuple: [ParamValue]
      params: { id: ParamValue }
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/colaboradores_controller').default['destroy']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/colaboradores_controller').default['destroy']>>>
    }
  }
  'colaboradores.historico_salarial.store': {
    methods: ["POST"]
    pattern: '/colaboradores/:id/historico-salarial'
    types: {
      body: ExtractBody<InferInput<(typeof import('#validators/colaborador').historicoSalarialValidator)>>
      paramsTuple: [ParamValue]
      params: { id: ParamValue }
      query: ExtractQuery<InferInput<(typeof import('#validators/colaborador').historicoSalarialValidator)>>
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/colaboradores_controller').default['lancarHistoricoSalarial']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/colaboradores_controller').default['lancarHistoricoSalarial']>>> | { status: 422; response: { errors: SimpleError[] } }
    }
  }
  'colaboradores.historico_cargo.store': {
    methods: ["POST"]
    pattern: '/colaboradores/:id/historico-cargo'
    types: {
      body: ExtractBody<InferInput<(typeof import('#validators/colaborador').historicoCargoValidator)>>
      paramsTuple: [ParamValue]
      params: { id: ParamValue }
      query: ExtractQuery<InferInput<(typeof import('#validators/colaborador').historicoCargoValidator)>>
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/colaboradores_controller').default['lancarHistoricoCargo']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/colaboradores_controller').default['lancarHistoricoCargo']>>> | { status: 422; response: { errors: SimpleError[] } }
    }
  }
  'colaboradores.desligar': {
    methods: ["POST"]
    pattern: '/colaboradores/:id/desligar'
    types: {
      body: ExtractBody<InferInput<(typeof import('#validators/colaborador').desligamentoValidator)>>
      paramsTuple: [ParamValue]
      params: { id: ParamValue }
      query: ExtractQuery<InferInput<(typeof import('#validators/colaborador').desligamentoValidator)>>
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/colaboradores_controller').default['desligar']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/colaboradores_controller').default['desligar']>>> | { status: 422; response: { errors: SimpleError[] } }
    }
  }
  'colaboradores.documentos.store': {
    methods: ["POST"]
    pattern: '/colaboradores/:id/documentos'
    types: {
      body: ExtractBody<InferInput<(typeof import('#validators/colaborador').documentoValidator)>>
      paramsTuple: [ParamValue]
      params: { id: ParamValue }
      query: ExtractQuery<InferInput<(typeof import('#validators/colaborador').documentoValidator)>>
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/colaboradores_controller').default['adicionarDocumento']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/colaboradores_controller').default['adicionarDocumento']>>> | { status: 422; response: { errors: SimpleError[] } }
    }
  }
  'colaboradores.documentos.destroy': {
    methods: ["DELETE"]
    pattern: '/colaboradores/:id/documentos/:documentoId'
    types: {
      body: {}
      paramsTuple: [ParamValue, ParamValue]
      params: { id: ParamValue; documentoId: ParamValue }
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/colaboradores_controller').default['removerDocumento']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/colaboradores_controller').default['removerDocumento']>>>
    }
  }
  'clientes.index': {
    methods: ["GET","HEAD"]
    pattern: '/clientes'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/clientes_controller').default['index']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/clientes_controller').default['index']>>>
    }
  }
  'clientes.store': {
    methods: ["POST"]
    pattern: '/clientes'
    types: {
      body: ExtractBody<InferInput<(typeof import('#validators/cliente').createClienteValidator)>>
      paramsTuple: []
      params: {}
      query: ExtractQuery<InferInput<(typeof import('#validators/cliente').createClienteValidator)>>
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/clientes_controller').default['store']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/clientes_controller').default['store']>>> | { status: 422; response: { errors: SimpleError[] } }
    }
  }
  'clientes.show': {
    methods: ["GET","HEAD"]
    pattern: '/clientes/:id'
    types: {
      body: {}
      paramsTuple: [ParamValue]
      params: { id: ParamValue }
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/clientes_controller').default['show']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/clientes_controller').default['show']>>>
    }
  }
  'clientes.update': {
    methods: ["PUT"]
    pattern: '/clientes/:id'
    types: {
      body: ExtractBody<InferInput<(typeof import('#validators/cliente').updateClienteValidator)>>
      paramsTuple: [ParamValue]
      params: { id: ParamValue }
      query: ExtractQuery<InferInput<(typeof import('#validators/cliente').updateClienteValidator)>>
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/clientes_controller').default['update']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/clientes_controller').default['update']>>> | { status: 422; response: { errors: SimpleError[] } }
    }
  }
  'clientes.patch': {
    methods: ["PATCH"]
    pattern: '/clientes/:id'
    types: {
      body: ExtractBody<InferInput<(typeof import('#validators/cliente').updateClienteValidator)>>
      paramsTuple: [ParamValue]
      params: { id: ParamValue }
      query: ExtractQuery<InferInput<(typeof import('#validators/cliente').updateClienteValidator)>>
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/clientes_controller').default['update']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/clientes_controller').default['update']>>> | { status: 422; response: { errors: SimpleError[] } }
    }
  }
  'clientes.aprovar': {
    methods: ["POST"]
    pattern: '/clientes/:id/aprovar'
    types: {
      body: {}
      paramsTuple: [ParamValue]
      params: { id: ParamValue }
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/clientes_controller').default['aprovarCadastro']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/clientes_controller').default['aprovarCadastro']>>>
    }
  }
  'clientes.enderecos.store': {
    methods: ["POST"]
    pattern: '/clientes/:id/enderecos'
    types: {
      body: ExtractBody<InferInput<(typeof import('#validators/cliente').createEnderecoValidator)>>
      paramsTuple: [ParamValue]
      params: { id: ParamValue }
      query: ExtractQuery<InferInput<(typeof import('#validators/cliente').createEnderecoValidator)>>
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/clientes_controller').default['adicionarEndereco']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/clientes_controller').default['adicionarEndereco']>>> | { status: 422; response: { errors: SimpleError[] } }
    }
  }
  'clientes.enderecos.destroy': {
    methods: ["DELETE"]
    pattern: '/clientes/:id/enderecos/:enderecoId'
    types: {
      body: {}
      paramsTuple: [ParamValue, ParamValue]
      params: { id: ParamValue; enderecoId: ParamValue }
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/clientes_controller').default['removerEndereco']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/clientes_controller').default['removerEndereco']>>>
    }
  }
  'clientes.converter_lead': {
    methods: ["POST"]
    pattern: '/clientes/converter-lead/:leadId'
    types: {
      body: ExtractBody<InferInput<(typeof import('#validators/cliente').createClienteValidator)>>
      paramsTuple: [ParamValue]
      params: { leadId: ParamValue }
      query: ExtractQuery<InferInput<(typeof import('#validators/cliente').createClienteValidator)>>
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/clientes_controller').default['converterLead']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/clientes_controller').default['converterLead']>>> | { status: 422; response: { errors: SimpleError[] } }
    }
  }
  'projetos.index': {
    methods: ["GET","HEAD"]
    pattern: '/projetos'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/projetos_controller').default['index']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/projetos_controller').default['index']>>>
    }
  }
  'projetos.show': {
    methods: ["GET","HEAD"]
    pattern: '/projetos/:id'
    types: {
      body: {}
      paramsTuple: [ParamValue]
      params: { id: ParamValue }
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/projetos_controller').default['show']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/projetos_controller').default['show']>>>
    }
  }
  'projetos.mudar_status': {
    methods: ["POST"]
    pattern: '/projetos/:id/status'
    types: {
      body: ExtractBody<InferInput<(typeof import('#validators/projeto').mudarStatusProjetoValidator)>>
      paramsTuple: [ParamValue]
      params: { id: ParamValue }
      query: ExtractQuery<InferInput<(typeof import('#validators/projeto').mudarStatusProjetoValidator)>>
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/projetos_controller').default['mudarStatus']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/projetos_controller').default['mudarStatus']>>> | { status: 422; response: { errors: SimpleError[] } }
    }
  }
  'projetos.arquivar': {
    methods: ["POST"]
    pattern: '/projetos/:id/arquivar'
    types: {
      body: ExtractBody<InferInput<(typeof import('#validators/projeto').arquivarProjetoValidator)>>
      paramsTuple: [ParamValue]
      params: { id: ParamValue }
      query: ExtractQuery<InferInput<(typeof import('#validators/projeto').arquivarProjetoValidator)>>
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/projetos_controller').default['arquivar']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/projetos_controller').default['arquivar']>>> | { status: 422; response: { errors: SimpleError[] } }
    }
  }
  'projetos.versoes_3d.store': {
    methods: ["POST"]
    pattern: '/projetos/:id/versoes-3d'
    types: {
      body: ExtractBody<InferInput<(typeof import('#validators/projeto').submeterVersao3DValidator)>>
      paramsTuple: [ParamValue]
      params: { id: ParamValue }
      query: ExtractQuery<InferInput<(typeof import('#validators/projeto').submeterVersao3DValidator)>>
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/projetos_controller').default['submeterVersao3D']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/projetos_controller').default['submeterVersao3D']>>> | { status: 422; response: { errors: SimpleError[] } }
    }
  }
  'projetos.versoes_3d.avaliar': {
    methods: ["POST"]
    pattern: '/projetos/:id/versoes-3d/:versaoId/avaliar'
    types: {
      body: ExtractBody<InferInput<(typeof import('#validators/projeto').avaliarVersao3DValidator)>>
      paramsTuple: [ParamValue, ParamValue]
      params: { id: ParamValue; versaoId: ParamValue }
      query: ExtractQuery<InferInput<(typeof import('#validators/projeto').avaliarVersao3DValidator)>>
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/projetos_controller').default['avaliarVersao3D']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/projetos_controller').default['avaliarVersao3D']>>> | { status: 422; response: { errors: SimpleError[] } }
    }
  }
  'projetos.versoes_3d.concluir_render': {
    methods: ["POST"]
    pattern: '/projetos/:id/versoes-3d/:versaoId/concluir-render'
    types: {
      body: ExtractBody<InferInput<(typeof import('#validators/projeto').concluirRenderValidator)>>
      paramsTuple: [ParamValue, ParamValue]
      params: { id: ParamValue; versaoId: ParamValue }
      query: ExtractQuery<InferInput<(typeof import('#validators/projeto').concluirRenderValidator)>>
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/projetos_controller').default['concluirRender']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/projetos_controller').default['concluirRender']>>> | { status: 422; response: { errors: SimpleError[] } }
    }
  }
  'projetos.fechamento.show': {
    methods: ["GET","HEAD"]
    pattern: '/projetos/:id/fechamento'
    types: {
      body: {}
      paramsTuple: [ParamValue]
      params: { id: ParamValue }
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/fechamentos_controller').default['show']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/fechamentos_controller').default['show']>>>
    }
  }
  'projetos.fechamento.store': {
    methods: ["POST"]
    pattern: '/projetos/:id/fechamento'
    types: {
      body: ExtractBody<InferInput<(typeof import('#validators/fechamento').salvarFechamentoValidator)>>
      paramsTuple: [ParamValue]
      params: { id: ParamValue }
      query: ExtractQuery<InferInput<(typeof import('#validators/fechamento').salvarFechamentoValidator)>>
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/fechamentos_controller').default['salvarFechamento']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/fechamentos_controller').default['salvarFechamento']>>> | { status: 422; response: { errors: SimpleError[] } }
    }
  }
  'projetos.fechamento.parcelas.pagar': {
    methods: ["POST"]
    pattern: '/projetos/:id/fechamento/parcelas/:parcelaId/pagar'
    types: {
      body: ExtractBody<InferInput<(typeof import('#validators/fechamento').liquidarParcelaValidator)>>
      paramsTuple: [ParamValue, ParamValue]
      params: { id: ParamValue; parcelaId: ParamValue }
      query: ExtractQuery<InferInput<(typeof import('#validators/fechamento').liquidarParcelaValidator)>>
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/fechamentos_controller').default['liquidarParcela']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/fechamentos_controller').default['liquidarParcela']>>> | { status: 422; response: { errors: SimpleError[] } }
    }
  }
  'projetos.handoff.store': {
    methods: ["POST"]
    pattern: '/projetos/:id/handoff'
    types: {
      body: ExtractBody<InferInput<(typeof import('#validators/fechamento').salvarHandoffValidator)>>
      paramsTuple: [ParamValue]
      params: { id: ParamValue }
      query: ExtractQuery<InferInput<(typeof import('#validators/fechamento').salvarHandoffValidator)>>
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/fechamentos_controller').default['salvarHandoff']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/fechamentos_controller').default['salvarHandoff']>>> | { status: 422; response: { errors: SimpleError[] } }
    }
  }
  'configuracoes.index': {
    methods: ["GET","HEAD"]
    pattern: '/configuracoes'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/configuracoes_controller').default['index']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/configuracoes_controller').default['index']>>>
    }
  }
  'configuracoes.ambientes.store': {
    methods: ["POST"]
    pattern: '/configuracoes/ambientes'
    types: {
      body: ExtractBody<InferInput<(typeof import('#validators/configuracao').createAmbienteValidator)>>
      paramsTuple: []
      params: {}
      query: ExtractQuery<InferInput<(typeof import('#validators/configuracao').createAmbienteValidator)>>
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/configuracoes_controller').default['storeAmbiente']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/configuracoes_controller').default['storeAmbiente']>>> | { status: 422; response: { errors: SimpleError[] } }
    }
  }
  'configuracoes.ambientes.update': {
    methods: ["PUT"]
    pattern: '/configuracoes/ambientes/:id'
    types: {
      body: ExtractBody<InferInput<(typeof import('#validators/configuracao').updateAmbienteValidator)>>
      paramsTuple: [ParamValue]
      params: { id: ParamValue }
      query: ExtractQuery<InferInput<(typeof import('#validators/configuracao').updateAmbienteValidator)>>
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/configuracoes_controller').default['updateAmbiente']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/configuracoes_controller').default['updateAmbiente']>>> | { status: 422; response: { errors: SimpleError[] } }
    }
  }
  'configuracoes.ambientes.toggle': {
    methods: ["PATCH"]
    pattern: '/configuracoes/ambientes/:id/toggle'
    types: {
      body: {}
      paramsTuple: [ParamValue]
      params: { id: ParamValue }
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/configuracoes_controller').default['toggleAmbiente']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/configuracoes_controller').default['toggleAmbiente']>>>
    }
  }
  'configuracoes.ambientes.destroy': {
    methods: ["DELETE"]
    pattern: '/configuracoes/ambientes/:id'
    types: {
      body: {}
      paramsTuple: [ParamValue]
      params: { id: ParamValue }
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/configuracoes_controller').default['destroyAmbiente']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/configuracoes_controller').default['destroyAmbiente']>>>
    }
  }
  'configuracoes.origens.store': {
    methods: ["POST"]
    pattern: '/configuracoes/origens'
    types: {
      body: ExtractBody<InferInput<(typeof import('#validators/configuracao').createOrigemValidator)>>
      paramsTuple: []
      params: {}
      query: ExtractQuery<InferInput<(typeof import('#validators/configuracao').createOrigemValidator)>>
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/configuracoes_controller').default['storeOrigem']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/configuracoes_controller').default['storeOrigem']>>> | { status: 422; response: { errors: SimpleError[] } }
    }
  }
  'configuracoes.origens.update': {
    methods: ["PUT"]
    pattern: '/configuracoes/origens/:id'
    types: {
      body: ExtractBody<InferInput<(typeof import('#validators/configuracao').updateOrigemValidator)>>
      paramsTuple: [ParamValue]
      params: { id: ParamValue }
      query: ExtractQuery<InferInput<(typeof import('#validators/configuracao').updateOrigemValidator)>>
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/configuracoes_controller').default['updateOrigem']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/configuracoes_controller').default['updateOrigem']>>> | { status: 422; response: { errors: SimpleError[] } }
    }
  }
  'configuracoes.origens.toggle': {
    methods: ["PATCH"]
    pattern: '/configuracoes/origens/:id/toggle'
    types: {
      body: {}
      paramsTuple: [ParamValue]
      params: { id: ParamValue }
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/configuracoes_controller').default['toggleOrigem']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/configuracoes_controller').default['toggleOrigem']>>>
    }
  }
  'configuracoes.origens.destroy': {
    methods: ["DELETE"]
    pattern: '/configuracoes/origens/:id'
    types: {
      body: {}
      paramsTuple: [ParamValue]
      params: { id: ParamValue }
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/configuracoes_controller').default['destroyOrigem']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/configuracoes_controller').default['destroyOrigem']>>>
    }
  }
  'configuracoes.campanhas.store': {
    methods: ["POST"]
    pattern: '/configuracoes/campanhas'
    types: {
      body: ExtractBody<InferInput<(typeof import('#validators/configuracao').createCampanhaValidator)>>
      paramsTuple: []
      params: {}
      query: ExtractQuery<InferInput<(typeof import('#validators/configuracao').createCampanhaValidator)>>
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/configuracoes_controller').default['storeCampanha']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/configuracoes_controller').default['storeCampanha']>>> | { status: 422; response: { errors: SimpleError[] } }
    }
  }
  'configuracoes.campanhas.update': {
    methods: ["PUT"]
    pattern: '/configuracoes/campanhas/:id'
    types: {
      body: ExtractBody<InferInput<(typeof import('#validators/configuracao').updateCampanhaValidator)>>
      paramsTuple: [ParamValue]
      params: { id: ParamValue }
      query: ExtractQuery<InferInput<(typeof import('#validators/configuracao').updateCampanhaValidator)>>
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/configuracoes_controller').default['updateCampanha']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/configuracoes_controller').default['updateCampanha']>>> | { status: 422; response: { errors: SimpleError[] } }
    }
  }
  'configuracoes.campanhas.toggle': {
    methods: ["PATCH"]
    pattern: '/configuracoes/campanhas/:id/toggle'
    types: {
      body: {}
      paramsTuple: [ParamValue]
      params: { id: ParamValue }
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/configuracoes_controller').default['toggleCampanha']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/configuracoes_controller').default['toggleCampanha']>>>
    }
  }
  'configuracoes.campanhas.destroy': {
    methods: ["DELETE"]
    pattern: '/configuracoes/campanhas/:id'
    types: {
      body: {}
      paramsTuple: [ParamValue]
      params: { id: ParamValue }
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/configuracoes_controller').default['destroyCampanha']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/configuracoes_controller').default['destroyCampanha']>>>
    }
  }
}
