/* eslint-disable prettier/prettier */
import type { routes } from './index.ts'

export interface ApiDefinition {
  session: {
    create: typeof routes['session.create']
    store: typeof routes['session.store']
    destroy: typeof routes['session.destroy']
  }
  dashboard: typeof routes['dashboard']
  crm: {
    index: typeof routes['crm.index']
    leads: {
      store: typeof routes['crm.leads.store']
      updateStatus: typeof routes['crm.leads.update_status']
      qualificar: typeof routes['crm.leads.qualificar']
      marcarPerdido: typeof routes['crm.leads.marcar_perdido']
      registrarInteracao: typeof routes['crm.leads.registrar_interacao']
    }
  }
  briefings: {
    index: typeof routes['briefings.index']
    store: typeof routes['briefings.store']
    calcularScore: typeof routes['briefings.calcular_score']
    edit: typeof routes['briefings.edit']
    update: typeof routes['briefings.update']
    enviarParaFila: typeof routes['briefings.enviar_para_fila']
  }
  fila: {
    index: typeof routes['fila.index']
    alocar: typeof routes['fila.alocar']
    desalocar: typeof routes['fila.desalocar']
    iniciar: typeof routes['fila.iniciar']
  }
  wip: {
    configurar: typeof routes['wip.configurar']
  }
  projetos: {
    arquivar: typeof routes['projetos.arquivar']
  }
  especificadores: {
    index: typeof routes['especificadores.index']
    store: typeof routes['especificadores.store']
    kpis: typeof routes['especificadores.kpis']
    metas: {
      index: typeof routes['especificadores.metas.index']
      update: typeof routes['especificadores.metas.update']
      me: typeof routes['especificadores.metas.me']
    }
    show: typeof routes['especificadores.show']
    update: typeof routes['especificadores.update']
    destroy: typeof routes['especificadores.destroy']
    reatribuirDono: typeof routes['especificadores.reatribuir_dono']
    historicoDono: typeof routes['especificadores.historico_dono']
    score: typeof routes['especificadores.score']
    decisores: {
      index: typeof routes['especificadores.decisores.index']
      store: typeof routes['especificadores.decisores.store']
      update: typeof routes['especificadores.decisores.update']
      destroy: typeof routes['especificadores.decisores.destroy']
    }
    concorrentes: {
      index: typeof routes['especificadores.concorrentes.index']
      store: typeof routes['especificadores.concorrentes.store']
      update: typeof routes['especificadores.concorrentes.update']
      destroy: typeof routes['especificadores.concorrentes.destroy']
    }
    interacoes: {
      index: typeof routes['especificadores.interacoes.index']
      store: typeof routes['especificadores.interacoes.store']
    }
  }
}
