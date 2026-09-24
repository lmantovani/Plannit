/*
|--------------------------------------------------------------------------
| Routes file
|--------------------------------------------------------------------------
|
| The routes file is used for defining the HTTP routes.
|
*/

import { middleware } from '#start/kernel'
import { controllers } from '#generated/controllers'
import router from '@adonisjs/core/services/router'

router
  .group(() => {
    router.get('login', [controllers.Session, 'create']).as('session.create')
    router.post('login', [controllers.Session, 'store']).as('session.store')
  })
  .use(middleware.guest())

router
  .group(() => {
    router.get('/', ({ response }) => response.redirect().toRoute('dashboard'))
    router.get('dashboard', [controllers.Dashboard, 'index']).as('dashboard')
    router.post('logout', [controllers.Session, 'destroy']).as('session.destroy')


    // CRM / Leads (Fase 2)
    router.get('crm', [controllers.Leads, 'index']).as('crm.index')
    router.post('crm/leads', [controllers.Leads, 'store']).as('crm.leads.store')
    router.patch('crm/leads/:id/status', [controllers.Leads, 'updateStatus']).as('crm.leads.update_status')
    router.post('crm/leads/:id/qualificar', [controllers.Leads, 'qualificar']).as('crm.leads.qualificar')
    router.post('crm/leads/:id/desqualificar', [controllers.Leads, 'desqualificar']).as('crm.leads.desqualificar')
    router.post('crm/leads/:id/perder', [controllers.Leads, 'marcarPerdido']).as('crm.leads.marcar_perdido')
    router.post('crm/leads/:id/interacoes', [controllers.Leads, 'registrarInteracao']).as('crm.leads.registrar_interacao')

    // Briefings & Score Inteligente (Fase 3 - RN002)
    // Rotas com caminhos fixos antes de caminhos com parâmetros dinâmicos
    router.get('briefings', [controllers.Briefings, 'index']).as('briefings.index')
    router.post('briefings', [controllers.Briefings, 'store']).as('briefings.store')
    router.post('briefings/calcular-score', [controllers.Briefings, 'calcularScore']).as('briefings.calcular_score')
    router.get('briefings/:id/edit', [controllers.Briefings, 'edit']).as('briefings.edit')
    router.put('briefings/:id', [controllers.Briefings, 'update']).as('briefings.update')
    router.post('briefings/:id/enviar-para-fila', [controllers.Briefings, 'enviarParaFila']).as('briefings.enviar_para_fila')

    // Fila de Projetos & Controle WIP (Fase 4 - RN003)
    router.get('fila', [controllers.Fila, 'index']).as('fila.index')
    router.post('wip/configuracoes', [controllers.Fila, 'configurarWip']).as('wip.configurar')
    router.post('fila/:id/alocar', [controllers.Fila, 'alocar']).as('fila.alocar')
    router.post('fila/:id/desalocar', [controllers.Fila, 'desalocar']).as('fila.desalocar')
    router.post('fila/:id/iniciar', [controllers.Fila, 'iniciarExecucao']).as('fila.iniciar')

    // Especificadores (Fase 5 - R1 a R4)
    // Rotas com caminhos fixos primeiro
    router.get('especificadores', [controllers.Arquitetos, 'index']).as('especificadores.index')
    router.post('especificadores', [controllers.Arquitetos, 'store']).as('especificadores.store')
    router.get('especificadores/kpis', [controllers.Arquitetos, 'kpis']).as('especificadores.kpis')
    router.get('especificadores/metas-visitas', [controllers.Arquitetos, 'listarMetas']).as('especificadores.metas.index')
    router.put('especificadores/metas-visitas', [controllers.Arquitetos, 'definirMeta']).as('especificadores.metas.update')
    router.get('especificadores/metas-visitas/me', [controllers.Arquitetos, 'minhaMeta']).as('especificadores.metas.me')

    // Rotas com ID dinâmico
    router.get('especificadores/:id', [controllers.Arquitetos, 'show']).as('especificadores.show')
    router.patch('especificadores/:id', [controllers.Arquitetos, 'update']).as('especificadores.update')
    router.delete('especificadores/:id', [controllers.Arquitetos, 'destroy']).as('especificadores.destroy')
    router.patch('especificadores/:id/dono', [controllers.Arquitetos, 'reatribuirDono']).as('especificadores.reatribuir_dono')
    router.get('especificadores/:id/historico-dono', [controllers.Arquitetos, 'historicoDono']).as('especificadores.historico_dono')
    router.get('especificadores/:id/score', [controllers.Arquitetos, 'score']).as('especificadores.score')

    // Sub-recursos: Decisores
    router.get('especificadores/:id/decisores', [controllers.Arquitetos, 'listarDecisores']).as('especificadores.decisores.index')
    router.post('especificadores/:id/decisores', [controllers.Arquitetos, 'criarDecisor']).as('especificadores.decisores.store')
    router.patch('especificadores/:id/decisores/:decisorId', [controllers.Arquitetos, 'atualizarDecisor']).as('especificadores.decisores.update')
    router.delete('especificadores/:id/decisores/:decisorId', [controllers.Arquitetos, 'removerDecisor']).as('especificadores.decisores.destroy')

    // Sub-recursos: Concorrentes
    router.get('especificadores/:id/concorrentes', [controllers.Arquitetos, 'listarConcorrentes']).as('especificadores.concorrentes.index')
    router.post('especificadores/:id/concorrentes', [controllers.Arquitetos, 'criarConcorrente']).as('especificadores.concorrentes.store')
    router.patch('especificadores/:id/concorrentes/:concorrenteId', [controllers.Arquitetos, 'atualizarConcorrente']).as('especificadores.concorrentes.update')
    router.delete('especificadores/:id/concorrentes/:concorrenteId', [controllers.Arquitetos, 'removerConcorrente']).as('especificadores.concorrentes.destroy')

    // Sub-recursos: Interações
    router.get('especificadores/:id/interacoes', [controllers.Arquitetos, 'listarInteracoes']).as('especificadores.interacoes.index')
    router.post('especificadores/:id/interacoes', [controllers.Arquitetos, 'criarInteracao']).as('especificadores.interacoes.store')

    // Colaboradores & RH (Fase 6 - RH-RN009 & RH-RN011)
    // 1. Departamentos & Cargos (caminhos fixos primeiro)
    router.get('colaboradores/departamentos', [controllers.Colaboradores, 'listarDepartamentos']).as('colaboradores.departamentos.index')
    router.post('colaboradores/departamentos', [controllers.Colaboradores, 'criarDepartamento']).as('colaboradores.departamentos.store')
    router.put('colaboradores/departamentos/:id', [controllers.Colaboradores, 'atualizarDepartamento']).as('colaboradores.departamentos.update')

    router.get('colaboradores/cargos', [controllers.Colaboradores, 'listarCargos']).as('colaboradores.cargos.index')
    router.post('colaboradores/cargos', [controllers.Colaboradores, 'criarCargo']).as('colaboradores.cargos.store')
    router.put('colaboradores/cargos/:id', [controllers.Colaboradores, 'atualizarCargo']).as('colaboradores.cargos.update')

    // 2. Colaboradores principais
    router.get('colaboradores', [controllers.Colaboradores, 'index']).as('colaboradores.index')
    router.post('colaboradores', [controllers.Colaboradores, 'store']).as('colaboradores.store')

    // 3. Rotas com ID dinâmico
    router.get('colaboradores/:id', [controllers.Colaboradores, 'show']).as('colaboradores.show')
    router.put('colaboradores/:id', [controllers.Colaboradores, 'update']).as('colaboradores.update')
    router.patch('colaboradores/:id', [controllers.Colaboradores, 'update']).as('colaboradores.patch')
    router.delete('colaboradores/:id', [controllers.Colaboradores, 'destroy']).as('colaboradores.destroy')

    // 4. Sub-recursos: Histórico Salarial, Histórico de Cargos e Desligamento (RH-RN009 / RH-RN011)
    router.post('colaboradores/:id/historico-salarial', [controllers.Colaboradores, 'lancarHistoricoSalarial']).as('colaboradores.historico_salarial.store')
    router.post('colaboradores/:id/historico-cargo', [controllers.Colaboradores, 'lancarHistoricoCargo']).as('colaboradores.historico_cargo.store')
    router.post('colaboradores/:id/desligar', [controllers.Colaboradores, 'desligar']).as('colaboradores.desligar')

    // 5. Documentos funcionais
    router.post('colaboradores/:id/documentos', [controllers.Colaboradores, 'adicionarDocumento']).as('colaboradores.documentos.store')
    router.delete('colaboradores/:id/documentos/:documentoId', [controllers.Colaboradores, 'removerDocumento']).as('colaboradores.documentos.destroy')

    // ==========================================
    // MÓDULO DE CLIENTES (FASE 7)
    // ==========================================
    router.get('clientes', [controllers.Clientes, 'index']).as('clientes.index')
    router.post('clientes', [controllers.Clientes, 'store']).as('clientes.store')
    router.get('clientes/:id', [controllers.Clientes, 'show']).as('clientes.show')
    router.put('clientes/:id', [controllers.Clientes, 'update']).as('clientes.update')
    router.patch('clientes/:id', [controllers.Clientes, 'update']).as('clientes.patch')
    router.post('clientes/:id/aprovar', [controllers.Clientes, 'aprovarCadastro']).as('clientes.aprovar')
    router.post('clientes/:id/enderecos', [controllers.Clientes, 'adicionarEndereco']).as('clientes.enderecos.store')
    router.delete('clientes/:id/enderecos/:enderecoId', [controllers.Clientes, 'removerEndereco']).as('clientes.enderecos.destroy')
    router.post('clientes/converter-lead/:leadId', [controllers.Clientes, 'converterLead']).as('clientes.converter_lead')

    // ==========================================
    // PROJETOS & RENDER (FASE 9 - RN004, RN005, RN017)
    // ==========================================
    router.get('projetos', [controllers.Projetos, 'index']).as('projetos.index')
    router.get('projetos/:id', [controllers.Projetos, 'show']).as('projetos.show')
    router.post('projetos/:id/status', [controllers.Projetos, 'mudarStatus']).as('projetos.mudar_status')
    router.post('projetos/:id/arquivar', [controllers.Projetos, 'arquivar']).as('projetos.arquivar')
    router.post('projetos/:id/versoes-3d', [controllers.Projetos, 'submeterVersao3D']).as('projetos.versoes_3d.store')
    router.post('projetos/:id/versoes-3d/:versaoId/avaliar', [controllers.Projetos, 'avaliarVersao3D']).as('projetos.versoes_3d.avaliar')
    router.post('projetos/:id/versoes-3d/:versaoId/concluir-render', [controllers.Projetos, 'concluirRender']).as('projetos.versoes_3d.concluir_render')

    // ==========================================
    // FECHAMENTO COMERCIAL & HANDOFF (FASE 10 - RN006, RF024-RF031)
    // ==========================================
    router.get('projetos/:id/fechamento', [controllers.Fechamentos, 'show']).as('projetos.fechamento.show')
    router.post('projetos/:id/fechamento', [controllers.Fechamentos, 'salvarFechamento']).as('projetos.fechamento.store')
    router.post('projetos/:id/fechamento/parcelas/:parcelaId/pagar', [controllers.Fechamentos, 'liquidarParcela']).as('projetos.fechamento.parcelas.pagar')
    router.post('projetos/:id/handoff', [controllers.Fechamentos, 'salvarHandoff']).as('projetos.handoff.store')
  })
  .use(middleware.auth())



