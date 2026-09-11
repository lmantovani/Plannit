/* eslint-disable prettier/prettier */
import type { AdonisEndpoint } from '@tuyau/core/types'
import type { Registry } from './schema.d.ts'
import type { ApiDefinition } from './tree.d.ts'

const placeholder: any = {}

const routes = {
  'session.create': {
    methods: ["GET","HEAD"],
    pattern: '/login',
    tokens: [{"old":"/login","type":0,"val":"login","end":""}],
    types: placeholder as Registry['session.create']['types'],
  },
  'session.store': {
    methods: ["POST"],
    pattern: '/login',
    tokens: [{"old":"/login","type":0,"val":"login","end":""}],
    types: placeholder as Registry['session.store']['types'],
  },
  'dashboard': {
    methods: ["GET","HEAD"],
    pattern: '/dashboard',
    tokens: [{"old":"/dashboard","type":0,"val":"dashboard","end":""}],
    types: placeholder as Registry['dashboard']['types'],
  },
  'session.destroy': {
    methods: ["POST"],
    pattern: '/logout',
    tokens: [{"old":"/logout","type":0,"val":"logout","end":""}],
    types: placeholder as Registry['session.destroy']['types'],
  },
  'crm.index': {
    methods: ["GET","HEAD"],
    pattern: '/crm',
    tokens: [{"old":"/crm","type":0,"val":"crm","end":""}],
    types: placeholder as Registry['crm.index']['types'],
  },
  'crm.leads.store': {
    methods: ["POST"],
    pattern: '/crm/leads',
    tokens: [{"old":"/crm/leads","type":0,"val":"crm","end":""},{"old":"/crm/leads","type":0,"val":"leads","end":""}],
    types: placeholder as Registry['crm.leads.store']['types'],
  },
  'crm.leads.update_status': {
    methods: ["PATCH"],
    pattern: '/crm/leads/:id/status',
    tokens: [{"old":"/crm/leads/:id/status","type":0,"val":"crm","end":""},{"old":"/crm/leads/:id/status","type":0,"val":"leads","end":""},{"old":"/crm/leads/:id/status","type":1,"val":"id","end":""},{"old":"/crm/leads/:id/status","type":0,"val":"status","end":""}],
    types: placeholder as Registry['crm.leads.update_status']['types'],
  },
  'crm.leads.qualificar': {
    methods: ["POST"],
    pattern: '/crm/leads/:id/qualificar',
    tokens: [{"old":"/crm/leads/:id/qualificar","type":0,"val":"crm","end":""},{"old":"/crm/leads/:id/qualificar","type":0,"val":"leads","end":""},{"old":"/crm/leads/:id/qualificar","type":1,"val":"id","end":""},{"old":"/crm/leads/:id/qualificar","type":0,"val":"qualificar","end":""}],
    types: placeholder as Registry['crm.leads.qualificar']['types'],
  },
  'crm.leads.marcar_perdido': {
    methods: ["POST"],
    pattern: '/crm/leads/:id/perder',
    tokens: [{"old":"/crm/leads/:id/perder","type":0,"val":"crm","end":""},{"old":"/crm/leads/:id/perder","type":0,"val":"leads","end":""},{"old":"/crm/leads/:id/perder","type":1,"val":"id","end":""},{"old":"/crm/leads/:id/perder","type":0,"val":"perder","end":""}],
    types: placeholder as Registry['crm.leads.marcar_perdido']['types'],
  },
  'crm.leads.registrar_interacao': {
    methods: ["POST"],
    pattern: '/crm/leads/:id/interacoes',
    tokens: [{"old":"/crm/leads/:id/interacoes","type":0,"val":"crm","end":""},{"old":"/crm/leads/:id/interacoes","type":0,"val":"leads","end":""},{"old":"/crm/leads/:id/interacoes","type":1,"val":"id","end":""},{"old":"/crm/leads/:id/interacoes","type":0,"val":"interacoes","end":""}],
    types: placeholder as Registry['crm.leads.registrar_interacao']['types'],
  },
  'briefings.index': {
    methods: ["GET","HEAD"],
    pattern: '/briefings',
    tokens: [{"old":"/briefings","type":0,"val":"briefings","end":""}],
    types: placeholder as Registry['briefings.index']['types'],
  },
  'briefings.store': {
    methods: ["POST"],
    pattern: '/briefings',
    tokens: [{"old":"/briefings","type":0,"val":"briefings","end":""}],
    types: placeholder as Registry['briefings.store']['types'],
  },
  'briefings.calcular_score': {
    methods: ["POST"],
    pattern: '/briefings/calcular-score',
    tokens: [{"old":"/briefings/calcular-score","type":0,"val":"briefings","end":""},{"old":"/briefings/calcular-score","type":0,"val":"calcular-score","end":""}],
    types: placeholder as Registry['briefings.calcular_score']['types'],
  },
  'briefings.edit': {
    methods: ["GET","HEAD"],
    pattern: '/briefings/:id/edit',
    tokens: [{"old":"/briefings/:id/edit","type":0,"val":"briefings","end":""},{"old":"/briefings/:id/edit","type":1,"val":"id","end":""},{"old":"/briefings/:id/edit","type":0,"val":"edit","end":""}],
    types: placeholder as Registry['briefings.edit']['types'],
  },
  'briefings.update': {
    methods: ["PUT"],
    pattern: '/briefings/:id',
    tokens: [{"old":"/briefings/:id","type":0,"val":"briefings","end":""},{"old":"/briefings/:id","type":1,"val":"id","end":""}],
    types: placeholder as Registry['briefings.update']['types'],
  },
  'briefings.enviar_para_fila': {
    methods: ["POST"],
    pattern: '/briefings/:id/enviar-para-fila',
    tokens: [{"old":"/briefings/:id/enviar-para-fila","type":0,"val":"briefings","end":""},{"old":"/briefings/:id/enviar-para-fila","type":1,"val":"id","end":""},{"old":"/briefings/:id/enviar-para-fila","type":0,"val":"enviar-para-fila","end":""}],
    types: placeholder as Registry['briefings.enviar_para_fila']['types'],
  },
  'fila.index': {
    methods: ["GET","HEAD"],
    pattern: '/fila',
    tokens: [{"old":"/fila","type":0,"val":"fila","end":""}],
    types: placeholder as Registry['fila.index']['types'],
  },
  'wip.configurar': {
    methods: ["POST"],
    pattern: '/wip/configuracoes',
    tokens: [{"old":"/wip/configuracoes","type":0,"val":"wip","end":""},{"old":"/wip/configuracoes","type":0,"val":"configuracoes","end":""}],
    types: placeholder as Registry['wip.configurar']['types'],
  },
  'fila.alocar': {
    methods: ["POST"],
    pattern: '/fila/:id/alocar',
    tokens: [{"old":"/fila/:id/alocar","type":0,"val":"fila","end":""},{"old":"/fila/:id/alocar","type":1,"val":"id","end":""},{"old":"/fila/:id/alocar","type":0,"val":"alocar","end":""}],
    types: placeholder as Registry['fila.alocar']['types'],
  },
  'fila.desalocar': {
    methods: ["POST"],
    pattern: '/fila/:id/desalocar',
    tokens: [{"old":"/fila/:id/desalocar","type":0,"val":"fila","end":""},{"old":"/fila/:id/desalocar","type":1,"val":"id","end":""},{"old":"/fila/:id/desalocar","type":0,"val":"desalocar","end":""}],
    types: placeholder as Registry['fila.desalocar']['types'],
  },
  'fila.iniciar': {
    methods: ["POST"],
    pattern: '/fila/:id/iniciar',
    tokens: [{"old":"/fila/:id/iniciar","type":0,"val":"fila","end":""},{"old":"/fila/:id/iniciar","type":1,"val":"id","end":""},{"old":"/fila/:id/iniciar","type":0,"val":"iniciar","end":""}],
    types: placeholder as Registry['fila.iniciar']['types'],
  },
  'projetos.arquivar': {
    methods: ["POST"],
    pattern: '/projetos/:id/arquivar',
    tokens: [{"old":"/projetos/:id/arquivar","type":0,"val":"projetos","end":""},{"old":"/projetos/:id/arquivar","type":1,"val":"id","end":""},{"old":"/projetos/:id/arquivar","type":0,"val":"arquivar","end":""}],
    types: placeholder as Registry['projetos.arquivar']['types'],
  },
  'especificadores.index': {
    methods: ["GET","HEAD"],
    pattern: '/especificadores',
    tokens: [{"old":"/especificadores","type":0,"val":"especificadores","end":""}],
    types: placeholder as Registry['especificadores.index']['types'],
  },
  'especificadores.store': {
    methods: ["POST"],
    pattern: '/especificadores',
    tokens: [{"old":"/especificadores","type":0,"val":"especificadores","end":""}],
    types: placeholder as Registry['especificadores.store']['types'],
  },
  'especificadores.kpis': {
    methods: ["GET","HEAD"],
    pattern: '/especificadores/kpis',
    tokens: [{"old":"/especificadores/kpis","type":0,"val":"especificadores","end":""},{"old":"/especificadores/kpis","type":0,"val":"kpis","end":""}],
    types: placeholder as Registry['especificadores.kpis']['types'],
  },
  'especificadores.metas.index': {
    methods: ["GET","HEAD"],
    pattern: '/especificadores/metas-visitas',
    tokens: [{"old":"/especificadores/metas-visitas","type":0,"val":"especificadores","end":""},{"old":"/especificadores/metas-visitas","type":0,"val":"metas-visitas","end":""}],
    types: placeholder as Registry['especificadores.metas.index']['types'],
  },
  'especificadores.metas.update': {
    methods: ["PUT"],
    pattern: '/especificadores/metas-visitas',
    tokens: [{"old":"/especificadores/metas-visitas","type":0,"val":"especificadores","end":""},{"old":"/especificadores/metas-visitas","type":0,"val":"metas-visitas","end":""}],
    types: placeholder as Registry['especificadores.metas.update']['types'],
  },
  'especificadores.metas.me': {
    methods: ["GET","HEAD"],
    pattern: '/especificadores/metas-visitas/me',
    tokens: [{"old":"/especificadores/metas-visitas/me","type":0,"val":"especificadores","end":""},{"old":"/especificadores/metas-visitas/me","type":0,"val":"metas-visitas","end":""},{"old":"/especificadores/metas-visitas/me","type":0,"val":"me","end":""}],
    types: placeholder as Registry['especificadores.metas.me']['types'],
  },
  'especificadores.show': {
    methods: ["GET","HEAD"],
    pattern: '/especificadores/:id',
    tokens: [{"old":"/especificadores/:id","type":0,"val":"especificadores","end":""},{"old":"/especificadores/:id","type":1,"val":"id","end":""}],
    types: placeholder as Registry['especificadores.show']['types'],
  },
  'especificadores.update': {
    methods: ["PATCH"],
    pattern: '/especificadores/:id',
    tokens: [{"old":"/especificadores/:id","type":0,"val":"especificadores","end":""},{"old":"/especificadores/:id","type":1,"val":"id","end":""}],
    types: placeholder as Registry['especificadores.update']['types'],
  },
  'especificadores.destroy': {
    methods: ["DELETE"],
    pattern: '/especificadores/:id',
    tokens: [{"old":"/especificadores/:id","type":0,"val":"especificadores","end":""},{"old":"/especificadores/:id","type":1,"val":"id","end":""}],
    types: placeholder as Registry['especificadores.destroy']['types'],
  },
  'especificadores.reatribuir_dono': {
    methods: ["PATCH"],
    pattern: '/especificadores/:id/dono',
    tokens: [{"old":"/especificadores/:id/dono","type":0,"val":"especificadores","end":""},{"old":"/especificadores/:id/dono","type":1,"val":"id","end":""},{"old":"/especificadores/:id/dono","type":0,"val":"dono","end":""}],
    types: placeholder as Registry['especificadores.reatribuir_dono']['types'],
  },
  'especificadores.historico_dono': {
    methods: ["GET","HEAD"],
    pattern: '/especificadores/:id/historico-dono',
    tokens: [{"old":"/especificadores/:id/historico-dono","type":0,"val":"especificadores","end":""},{"old":"/especificadores/:id/historico-dono","type":1,"val":"id","end":""},{"old":"/especificadores/:id/historico-dono","type":0,"val":"historico-dono","end":""}],
    types: placeholder as Registry['especificadores.historico_dono']['types'],
  },
  'especificadores.score': {
    methods: ["GET","HEAD"],
    pattern: '/especificadores/:id/score',
    tokens: [{"old":"/especificadores/:id/score","type":0,"val":"especificadores","end":""},{"old":"/especificadores/:id/score","type":1,"val":"id","end":""},{"old":"/especificadores/:id/score","type":0,"val":"score","end":""}],
    types: placeholder as Registry['especificadores.score']['types'],
  },
  'especificadores.decisores.index': {
    methods: ["GET","HEAD"],
    pattern: '/especificadores/:id/decisores',
    tokens: [{"old":"/especificadores/:id/decisores","type":0,"val":"especificadores","end":""},{"old":"/especificadores/:id/decisores","type":1,"val":"id","end":""},{"old":"/especificadores/:id/decisores","type":0,"val":"decisores","end":""}],
    types: placeholder as Registry['especificadores.decisores.index']['types'],
  },
  'especificadores.decisores.store': {
    methods: ["POST"],
    pattern: '/especificadores/:id/decisores',
    tokens: [{"old":"/especificadores/:id/decisores","type":0,"val":"especificadores","end":""},{"old":"/especificadores/:id/decisores","type":1,"val":"id","end":""},{"old":"/especificadores/:id/decisores","type":0,"val":"decisores","end":""}],
    types: placeholder as Registry['especificadores.decisores.store']['types'],
  },
  'especificadores.decisores.update': {
    methods: ["PATCH"],
    pattern: '/especificadores/:id/decisores/:decisorId',
    tokens: [{"old":"/especificadores/:id/decisores/:decisorId","type":0,"val":"especificadores","end":""},{"old":"/especificadores/:id/decisores/:decisorId","type":1,"val":"id","end":""},{"old":"/especificadores/:id/decisores/:decisorId","type":0,"val":"decisores","end":""},{"old":"/especificadores/:id/decisores/:decisorId","type":1,"val":"decisorId","end":""}],
    types: placeholder as Registry['especificadores.decisores.update']['types'],
  },
  'especificadores.decisores.destroy': {
    methods: ["DELETE"],
    pattern: '/especificadores/:id/decisores/:decisorId',
    tokens: [{"old":"/especificadores/:id/decisores/:decisorId","type":0,"val":"especificadores","end":""},{"old":"/especificadores/:id/decisores/:decisorId","type":1,"val":"id","end":""},{"old":"/especificadores/:id/decisores/:decisorId","type":0,"val":"decisores","end":""},{"old":"/especificadores/:id/decisores/:decisorId","type":1,"val":"decisorId","end":""}],
    types: placeholder as Registry['especificadores.decisores.destroy']['types'],
  },
  'especificadores.concorrentes.index': {
    methods: ["GET","HEAD"],
    pattern: '/especificadores/:id/concorrentes',
    tokens: [{"old":"/especificadores/:id/concorrentes","type":0,"val":"especificadores","end":""},{"old":"/especificadores/:id/concorrentes","type":1,"val":"id","end":""},{"old":"/especificadores/:id/concorrentes","type":0,"val":"concorrentes","end":""}],
    types: placeholder as Registry['especificadores.concorrentes.index']['types'],
  },
  'especificadores.concorrentes.store': {
    methods: ["POST"],
    pattern: '/especificadores/:id/concorrentes',
    tokens: [{"old":"/especificadores/:id/concorrentes","type":0,"val":"especificadores","end":""},{"old":"/especificadores/:id/concorrentes","type":1,"val":"id","end":""},{"old":"/especificadores/:id/concorrentes","type":0,"val":"concorrentes","end":""}],
    types: placeholder as Registry['especificadores.concorrentes.store']['types'],
  },
  'especificadores.concorrentes.update': {
    methods: ["PATCH"],
    pattern: '/especificadores/:id/concorrentes/:concorrenteId',
    tokens: [{"old":"/especificadores/:id/concorrentes/:concorrenteId","type":0,"val":"especificadores","end":""},{"old":"/especificadores/:id/concorrentes/:concorrenteId","type":1,"val":"id","end":""},{"old":"/especificadores/:id/concorrentes/:concorrenteId","type":0,"val":"concorrentes","end":""},{"old":"/especificadores/:id/concorrentes/:concorrenteId","type":1,"val":"concorrenteId","end":""}],
    types: placeholder as Registry['especificadores.concorrentes.update']['types'],
  },
  'especificadores.concorrentes.destroy': {
    methods: ["DELETE"],
    pattern: '/especificadores/:id/concorrentes/:concorrenteId',
    tokens: [{"old":"/especificadores/:id/concorrentes/:concorrenteId","type":0,"val":"especificadores","end":""},{"old":"/especificadores/:id/concorrentes/:concorrenteId","type":1,"val":"id","end":""},{"old":"/especificadores/:id/concorrentes/:concorrenteId","type":0,"val":"concorrentes","end":""},{"old":"/especificadores/:id/concorrentes/:concorrenteId","type":1,"val":"concorrenteId","end":""}],
    types: placeholder as Registry['especificadores.concorrentes.destroy']['types'],
  },
  'especificadores.interacoes.index': {
    methods: ["GET","HEAD"],
    pattern: '/especificadores/:id/interacoes',
    tokens: [{"old":"/especificadores/:id/interacoes","type":0,"val":"especificadores","end":""},{"old":"/especificadores/:id/interacoes","type":1,"val":"id","end":""},{"old":"/especificadores/:id/interacoes","type":0,"val":"interacoes","end":""}],
    types: placeholder as Registry['especificadores.interacoes.index']['types'],
  },
  'especificadores.interacoes.store': {
    methods: ["POST"],
    pattern: '/especificadores/:id/interacoes',
    tokens: [{"old":"/especificadores/:id/interacoes","type":0,"val":"especificadores","end":""},{"old":"/especificadores/:id/interacoes","type":1,"val":"id","end":""},{"old":"/especificadores/:id/interacoes","type":0,"val":"interacoes","end":""}],
    types: placeholder as Registry['especificadores.interacoes.store']['types'],
  },
} as const satisfies Record<string, AdonisEndpoint>

export { routes }

export const registry = {
  routes,
  $tree: {} as ApiDefinition,
}

declare module '@tuyau/core/types' {
  export interface UserRegistry {
    routes: typeof routes
    $tree: ApiDefinition
  }
}
