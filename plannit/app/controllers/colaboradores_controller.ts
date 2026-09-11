import type { HttpContext } from '@adonisjs/core/http'
import { DateTime } from 'luxon'
import db from '@adonisjs/lucid/services/db'
import Colaborador, { RegimeContratacao, ModalidadeTrabalho } from '#models/colaborador'
import Departamento from '#models/departamento'
import Cargo from '#models/cargo'
import HistoricoSalarialColaborador from '#models/historico_salarial_colaborador'
import HistoricoCargoColaborador from '#models/historico_cargo_colaborador'
import DocumentoColaborador from '#models/documento_colaborador'
import User from '#models/user'
import {
  createColaboradorValidator,
  updateColaboradorValidator,
  historicoSalarialValidator,
  historicoCargoValidator,
  desligamentoValidator,
  createDepartamentoValidator,
  updateDepartamentoValidator,
  createCargoValidator,
  updateCargoValidator,
  documentoValidator,
} from '#validators/colaborador'

export default class ColaboradoresController {
  private wantsJson(request: HttpContext['request']): boolean {
    const isInertia = request.header('x-inertia') === 'true'
    if (isInertia) return false
    const accept = request.header('accept') || ''
    return accept.includes('application/json') || request.qs().format === 'json'
  }

  private isDiretoria(user: User): boolean {
    if (user.isSuperuser) return true
    const perfil = String(user.perfil || '').toLowerCase()
    return perfil === 'diretoria' || perfil === 'admin'
  }

  private isAuthorized(user: User): boolean {
    if (user.isSuperuser) return true
    const perfil = String(user.perfil || '').toLowerCase()
    return ['diretoria', 'rh', 'admin'].includes(perfil)
  }

  /**
   * Listagem de colaboradores com filtros combinados e KPIs de headcount.
   */
  async index({ request, inertia, response, auth }: HttpContext) {
    const user = auth.user!
    if (!this.isAuthorized(user)) {
      return response.status(403).json({ message: 'Acesso restrito ao RH e Diretoria' })
    }

    const query = request.qs()
    const search = (query.q || query.busca || '').trim()
    const departamentoFilter = query.departamentoId ? Number(query.departamentoId) : null
    const cargoFilter = query.cargoId ? Number(query.cargoId) : null
    const regimeFilter = query.regime
    const modalidadeFilter = query.modalidade
    const includeInactive = query.includeInactive === 'true' || query.includeInactive === '1'

    const colaboradoresQuery = Colaborador.query()

    if (!includeInactive) {
      colaboradoresQuery.where('is_active', true)
    }

    if (departamentoFilter) {
      colaboradoresQuery.where('departamento_id', departamentoFilter)
    }

    if (cargoFilter) {
      colaboradoresQuery.where('cargo_id', cargoFilter)
    }

    if (regimeFilter) {
      colaboradoresQuery.where('regime', regimeFilter)
    }

    if (modalidadeFilter) {
      colaboradoresQuery.where('modalidade', modalidadeFilter)
    }

    if (search) {
      colaboradoresQuery.where((builder) => {
        builder
          .whereILike('nome', `%${search}%`)
          .orWhereILike('cpf', `%${search}%`)
          .orWhereILike('email_corporativo', `%${search}%`)
          .orWhereILike('email_pessoal', `%${search}%`)
      })
    }

    colaboradoresQuery
      .preload('cargo')
      .preload('departamento')
      .preload('gestor', (gQuery) => gQuery.select('id', 'nome'))
      .orderBy('nome', 'asc')

    const rawColaboradores = await colaboradoresQuery

    // KPIs consolidados de headcount
    const todosColaboradores = await Colaborador.all()
    const kpis = {
      total: todosColaboradores.length,
      ativos: todosColaboradores.filter((c) => c.isActive).length,
      desligados: todosColaboradores.filter((c) => !c.isActive).length,
      clt: todosColaboradores.filter((c) => c.isActive && c.regime === RegimeContratacao.CLT).length,
      pj: todosColaboradores.filter((c) => c.isActive && c.regime === RegimeContratacao.PJ).length,
      presencial: todosColaboradores.filter((c) => c.isActive && c.modalidade === ModalidadeTrabalho.PRESENCIAL).length,
      hibrido: todosColaboradores.filter((c) => c.isActive && c.modalidade === ModalidadeTrabalho.HIBRIDO).length,
      remoto: todosColaboradores.filter((c) => c.isActive && c.modalidade === ModalidadeTrabalho.REMOTO).length,
    }

    const colaboradores = rawColaboradores.map((c) => ({
      id: c.id,
      nome: c.nome,
      cpf: c.cpf,
      rg: c.rg,
      emailCorporativo: c.emailCorporativo,
      telefoneCorporativo: c.telefoneCorporativo,
      fotoUrl: c.fotoUrl,
      regime: c.regime,
      modalidade: c.modalidade,
      salarioClt: c.salarioClt ? Number(c.salarioClt) : null,
      remuneracaoComplementar: c.remuneracaoComplementar ? Number(c.remuneracaoComplementar) : null,
      pjValorMensal: c.pjValorMensal ? Number(c.pjValorMensal) : null,
      dataAdmissao: c.dataAdmissao ? c.dataAdmissao.toISODate() : null,
      isActive: c.isActive,
      dataDesligamento: c.dataDesligamento ? c.dataDesligamento.toISODate() : null,
      tipoDesligamento: c.tipoDesligamento,
      perfilDiscPrimario: c.perfilDiscPrimario,
      perfilDiscSecundario: c.perfilDiscSecundario,
      cargo: c.cargo ? { id: c.cargo.id, nome: c.cargo.nome } : null,
      departamento: c.departamento ? { id: c.departamento.id, nome: c.departamento.nome } : null,
      gestor: c.gestor ? { id: c.gestor.id, nome: c.gestor.nome } : null,
    }))

    const departamentos = await Departamento.query().where('ativo', true).orderBy('nome', 'asc')
    const cargos = await Cargo.query().where('ativo', true).preload('departamento').orderBy('nome', 'asc')
    const gestoresDisponiveis = await Colaborador.query()
      .where('is_active', true)
      .select('id', 'nome')
      .orderBy('nome', 'asc')

    if (this.wantsJson(request)) {
      return response.json({
        colaboradores,
        kpis,
        departamentos,
        cargos,
      })
    }

    return inertia.render('colaboradores/index', {
      colaboradores,
      kpis,
      departamentos: departamentos.map((d) => ({ id: d.id, nome: d.nome })),
      cargos: cargos.map((cg) => ({ id: cg.id, nome: cg.nome, departamentoId: cg.departamentoId })),
      gestores: gestoresDisponiveis.map((g) => ({ id: g.id, nome: g.nome })),
      filtros: {
        q: search,
        departamentoId: departamentoFilter || '',
        cargoId: cargoFilter || '',
        regime: regimeFilter || '',
        modalidade: modalidadeFilter || '',
        includeInactive,
      },
      isDiretoria: this.isDiretoria(user),
    })
  }

  /**
   * Prontuário detalhado de colaborador com todos os históricos e documentos.
   */
  async show({ params, request, inertia, response, auth }: HttpContext) {
    const user = auth.user!
    if (!this.isAuthorized(user)) {
      return response.status(403).json({ message: 'Acesso restrito ao RH e Diretoria' })
    }

    const colaborador = await Colaborador.query()
      .where('id', params.id)
      .preload('cargo')
      .preload('departamento')
      .preload('gestor', (gQuery) => gQuery.select('id', 'nome', 'email_corporativo'))
      .preload('subordinados', (sQuery) => sQuery.select('id', 'nome', 'cargo_id').preload('cargo'))
      .preload('historicoSalarial', (hsQuery) => {
        hsQuery.preload('registradoPor', (rQuery) => rQuery.select('id', 'nome')).orderBy('data_vigencia', 'desc').orderBy('id', 'desc')
      })
      .preload('historicoCargos', (hcQuery) => {
        hcQuery
          .preload('cargoAnterior')
          .preload('cargoNovo')
          .preload('aprovadoPor', (aQuery) => aQuery.select('id', 'nome'))
          .orderBy('data', 'desc')
          .orderBy('id', 'desc')
      })
      .preload('documentos', (dQuery) => dQuery.orderBy('created_at', 'desc'))
      .first()

    if (!colaborador) {
      if (this.wantsJson(request)) {
        return response.status(404).json({ message: 'Colaborador não encontrado' })
      }
      return response.redirect().toPath('/colaboradores')
    }

    const payloadColaborador = {
      id: colaborador.id,
      userId: colaborador.userId,
      nome: colaborador.nome,
      cpf: colaborador.cpf,
      rg: colaborador.rg,
      dataNascimento: colaborador.dataNascimento ? colaborador.dataNascimento.toISODate() : null,
      sexo: colaborador.sexo,
      estadoCivil: colaborador.estadoCivil,
      fotoUrl: colaborador.fotoUrl,
      perfilDiscPrimario: colaborador.perfilDiscPrimario,
      perfilDiscSecundario: colaborador.perfilDiscSecundario,
      observacoesComportamentais: colaborador.observacoesComportamentais,
      telefonePessoal: colaborador.telefonePessoal,
      telefoneCorporativo: colaborador.telefoneCorporativo,
      emailPessoal: colaborador.emailPessoal,
      emailCorporativo: colaborador.emailCorporativo,
      enderecoLogradouro: colaborador.enderecoLogradouro,
      enderecoNumero: colaborador.enderecoNumero,
      enderecoComplemento: colaborador.enderecoComplemento,
      enderecoBairro: colaborador.enderecoBairro,
      enderecoCidade: colaborador.enderecoCidade,
      enderecoEstado: colaborador.enderecoEstado,
      enderecoCep: colaborador.enderecoCep,
      dataAdmissao: colaborador.dataAdmissao ? colaborador.dataAdmissao.toISODate() : null,
      cargoId: colaborador.cargoId,
      departamentoId: colaborador.departamentoId,
      regime: colaborador.regime,
      tipoContrato: colaborador.tipoContrato,
      pjCnpj: colaborador.pjCnpj,
      pjContratoUrl: colaborador.pjContratoUrl,
      pjValorMensal: colaborador.pjValorMensal ? Number(colaborador.pjValorMensal) : null,
      pjVigenciaInicio: colaborador.pjVigenciaInicio ? colaborador.pjVigenciaInicio.toISODate() : null,
      pjVigenciaFim: colaborador.pjVigenciaFim ? colaborador.pjVigenciaFim.toISODate() : null,
      salarioClt: colaborador.salarioClt ? Number(colaborador.salarioClt) : null,
      remuneracaoComplementar: colaborador.remuneracaoComplementar ? Number(colaborador.remuneracaoComplementar) : null,
      dataVigenciaSalario: colaborador.dataVigenciaSalario ? colaborador.dataVigenciaSalario.toISODate() : null,
      cargaHoraria: colaborador.cargaHoraria,
      escala: colaborador.escala,
      modalidade: colaborador.modalidade,
      jornadaEspecial: colaborador.jornadaEspecial,
      banco: colaborador.banco,
      agencia: colaborador.agencia,
      conta: colaborador.conta,
      tipoConta: colaborador.tipoConta,
      gestorId: colaborador.gestorId,
      isActive: colaborador.isActive,
      dataDesligamento: colaborador.dataDesligamento ? colaborador.dataDesligamento.toISODate() : null,
      tipoDesligamento: colaborador.tipoDesligamento,
      motivoDesligamento: colaborador.motivoDesligamento,
      entrevistaSaida: colaborador.entrevistaSaida,
      cargo: colaborador.cargo ? { id: colaborador.cargo.id, nome: colaborador.cargo.nome } : null,
      departamento: colaborador.departamento ? { id: colaborador.departamento.id, nome: colaborador.departamento.nome } : null,
      gestor: colaborador.gestor ? { id: colaborador.gestor.id, nome: colaborador.gestor.nome, emailCorporativo: colaborador.gestor.emailCorporativo } : null,
      subordinados: (colaborador.subordinados || []).map((s) => ({
        id: s.id,
        nome: s.nome,
        cargoNome: s.cargo?.nome || null,
      })),
      historicoSalarial: (colaborador.historicoSalarial || []).map((hs) => ({
        id: hs.id,
        salarioClt: Number(hs.salarioClt),
        remuneracaoComplementar: hs.remuneracaoComplementar ? Number(hs.remuneracaoComplementar) : null,
        dataVigencia: hs.dataVigencia.toISODate(),
        motivo: hs.motivo,
        registradoPorNome: hs.registradoPor?.nome || 'Sistema',
        createdAt: hs.createdAt ? hs.createdAt.toISO() : null,
      })),
      historicoCargos: (colaborador.historicoCargos || []).map((hc) => ({
        id: hc.id,
        cargoAnteriorNome: hc.cargoAnterior?.nome || 'Admissão',
        cargoNovoNome: hc.cargoNovo?.nome || '',
        cargoNovoId: hc.cargoNovoId,
        data: hc.data.toISODate(),
        justificativa: hc.justificativa,
        aprovadoPorNome: hc.aprovadoPor?.nome || 'Sistema',
        createdAt: hc.createdAt ? hc.createdAt.toISO() : null,
      })),
      documentos: (colaborador.documentos || []).map((doc) => ({
        id: doc.id,
        tipo: doc.tipo,
        url: doc.url,
        dataVencimento: doc.dataVencimento ? doc.dataVencimento.toISODate() : null,
        createdAt: doc.createdAt ? doc.createdAt.toISO() : null,
      })),
    }

    if (this.wantsJson(request)) {
      return response.json(payloadColaborador)
    }

    const departamentos = await Departamento.query().where('ativo', true).orderBy('nome', 'asc')
    const cargos = await Cargo.query().where('ativo', true).preload('departamento').orderBy('nome', 'asc')
    const gestoresDisponiveis = await Colaborador.query()
      .where('is_active', true)
      .whereNot('id', colaborador.id)
      .select('id', 'nome')
      .orderBy('nome', 'asc')

    return inertia.render('colaboradores/show', {
      colaborador: payloadColaborador,
      departamentos: departamentos.map((d) => ({ id: d.id, nome: d.nome })),
      cargos: cargos.map((cg) => ({ id: cg.id, nome: cg.nome, departamentoId: cg.departamentoId })),
      gestores: gestoresDisponiveis.map((g) => ({ id: g.id, nome: g.nome })),
      isDiretoria: this.isDiretoria(user),
    })
  }

  /**
   * Cadastro de Colaborador com lançamentos inaugurais automáticos de admissão.
   */
  async store({ request, response, auth, session }: HttpContext) {
    const user = auth.user!
    if (!this.isAuthorized(user)) {
      return response.status(403).json({ message: 'Acesso restrito ao RH e Diretoria' })
    }

    const payload = await request.validateUsing(createColaboradorValidator)

    // Unicidade de CPF
    const existingCpf = await Colaborador.findBy('cpf', payload.cpf)
    if (existingCpf) {
      if (this.wantsJson(request)) {
        return response.status(400).json({ message: 'CPF já cadastrado para outro colaborador' })
      }
      session.flash('error', 'CPF já cadastrado para outro colaborador.')
      return response.redirect().back()
    }

    // Validação de cargo e departamento
    const cargo = await Cargo.find(payload.cargoId)
    if (!cargo) {
      if (this.wantsJson(request)) {
        return response.status(400).json({ message: 'Cargo inválido' })
      }
      session.flash('error', 'Cargo selecionado é inválido.')
      return response.redirect().back()
    }

    if (cargo.departamentoId !== payload.departamentoId) {
      if (this.wantsJson(request)) {
        return response.status(400).json({ message: 'O departamento informado não corresponde ao departamento do cargo selecionado' })
      }
      session.flash('error', 'O departamento informado não corresponde ao departamento do cargo selecionado.')
      return response.redirect().back()
    }

    if (payload.gestorId) {
      const gestor = await Colaborador.find(payload.gestorId)
      if (!gestor) {
        if (this.wantsJson(request)) {
          return response.status(400).json({ message: 'Gestor inválido' })
        }
        session.flash('error', 'Gestor informado é inválido.')
        return response.redirect().back()
      }
    }

    if (payload.userId) {
      const u = await User.find(payload.userId)
      if (!u) {
        if (this.wantsJson(request)) {
          return response.status(400).json({ message: 'Usuário do sistema inválido' })
        }
        session.flash('error', 'Usuário do sistema informado é inválido.')
        return response.redirect().back()
      }
    }

    const dataAdmissaoDt = DateTime.fromISO(payload.dataAdmissao)
    const dataVigenciaSalarioDt = payload.dataVigenciaSalario
      ? DateTime.fromISO(payload.dataVigenciaSalario)
      : dataAdmissaoDt

    const colaborador = await db.transaction(async (trx) => {
      const c = new Colaborador()
      c.useTransaction(trx)
      c.fill({
        userId: payload.userId || null,
        nome: payload.nome,
        cpf: payload.cpf,
        rg: payload.rg || null,
        dataNascimento: payload.dataNascimento ? DateTime.fromISO(payload.dataNascimento) : null,
        sexo: payload.sexo || null,
        estadoCivil: payload.estadoCivil || null,
        fotoUrl: payload.fotoUrl || null,
        perfilDiscPrimario: payload.perfilDiscPrimario || null,
        perfilDiscSecundario: payload.perfilDiscSecundario || null,
        observacoesComportamentais: payload.observacoesComportamentais || null,
        telefonePessoal: payload.telefonePessoal || null,
        telefoneCorporativo: payload.telefoneCorporativo || null,
        emailPessoal: payload.emailPessoal || null,
        emailCorporativo: payload.emailCorporativo || null,
        enderecoLogradouro: payload.enderecoLogradouro || null,
        enderecoNumero: payload.enderecoNumero || null,
        enderecoComplemento: payload.enderecoComplemento || null,
        enderecoBairro: payload.enderecoBairro || null,
        enderecoCidade: payload.enderecoCidade || null,
        enderecoEstado: payload.enderecoEstado || null,
        enderecoCep: payload.enderecoCep || null,
        dataAdmissao: dataAdmissaoDt,
        cargoId: payload.cargoId,
        departamentoId: payload.departamentoId,
        regime: payload.regime || RegimeContratacao.CLT,
        tipoContrato: payload.tipoContrato || null,
        pjCnpj: payload.pjCnpj || null,
        pjContratoUrl: payload.pjContratoUrl || null,
        pjValorMensal: payload.pjValorMensal !== undefined && payload.pjValorMensal !== null ? String(payload.pjValorMensal) : null,
        pjVigenciaInicio: payload.pjVigenciaInicio ? DateTime.fromISO(payload.pjVigenciaInicio) : null,
        pjVigenciaFim: payload.pjVigenciaFim ? DateTime.fromISO(payload.pjVigenciaFim) : null,
        salarioClt: payload.salarioClt !== undefined && payload.salarioClt !== null ? String(payload.salarioClt) : null,
        remuneracaoComplementar: payload.remuneracaoComplementar !== undefined && payload.remuneracaoComplementar !== null ? String(payload.remuneracaoComplementar) : null,
        dataVigenciaSalario: dataVigenciaSalarioDt,
        cargaHoraria: payload.cargaHoraria || null,
        escala: payload.escala || null,
        modalidade: payload.modalidade || ModalidadeTrabalho.PRESENCIAL,
        jornadaEspecial: payload.jornadaEspecial || null,
        banco: payload.banco || null,
        agencia: payload.agencia || null,
        conta: payload.conta || null,
        tipoConta: payload.tipoConta || null,
        gestorId: payload.gestorId || null,
        isActive: true,
      })

      await c.save()

      // Histórico Salarial Inaugural (Admissão)
      if (c.salarioClt !== null && c.salarioClt !== undefined) {
        const hs = new HistoricoSalarialColaborador()
        hs.useTransaction(trx)
        hs.fill({
          colaboradorId: c.id,
          salarioClt: String(c.salarioClt),
          remuneracaoComplementar: c.remuneracaoComplementar ? String(c.remuneracaoComplementar) : null,
          dataVigencia: c.dataVigenciaSalario || c.dataAdmissao,
          motivo: 'Admissão',
          registradoPorId: user.id,
        })
        await hs.save()
      }

      // Histórico de Cargo Inaugural (Admissão)
      const hc = new HistoricoCargoColaborador()
      hc.useTransaction(trx)
      hc.fill({
        colaboradorId: c.id,
        cargoAnteriorId: null,
        cargoNovoId: c.cargoId,
        data: c.dataAdmissao,
        aprovadoPorId: user.id,
        justificativa: 'Admissão',
      })
      await hc.save()

      return c
    })

    if (this.wantsJson(request)) {
      return response.status(201).json(colaborador)
    }

    session.flash('success', `Colaborador "${colaborador.nome}" cadastrado com sucesso!`)
    return response.redirect().toPath(`/colaboradores/${colaborador.id}`)
  }

  /**
   * Atualização cadastral.
   * RH-RN009: Bloqueia qualquer alteração direta de salário ou cargo!
   */
  async update({ params, request, response, auth, session }: HttpContext) {
    const user = auth.user!
    if (!this.isAuthorized(user)) {
      return response.status(403).json({ message: 'Acesso restrito ao RH e Diretoria' })
    }

    const colaborador = await Colaborador.find(params.id)
    if (!colaborador) {
      if (this.wantsJson(request)) {
        return response.status(404).json({ message: 'Colaborador não encontrado' })
      }
      return response.redirect().toPath('/colaboradores')
    }

    const body = request.body()
    // RH-RN009 Guardrail: Rejeição estrita se tentar alterar salário ou cargo direto
    if ('salarioClt' in body || 'salario_clt' in body) {
      const msg = 'RH-RN009: Alteração direta de salário não é permitida. Registre um novo lançamento no Histórico Salarial.'
      if (this.wantsJson(request)) return response.status(400).json({ message: msg })
      session.flash('error', msg)
      return response.redirect().back()
    }

    if ('cargoId' in body || 'cargo_id' in body) {
      const msg = 'RH-RN009: Alteração direta de cargo não é permitida. Registre uma nova progressão no Histórico de Cargos.'
      if (this.wantsJson(request)) return response.status(400).json({ message: msg })
      session.flash('error', msg)
      return response.redirect().back()
    }

    const payload = await request.validateUsing(updateColaboradorValidator)

    if (payload.gestorId !== undefined && payload.gestorId !== null) {
      if (payload.gestorId === colaborador.id) {
        const msg = 'Colaborador não pode ser gestor de si mesmo.'
        if (this.wantsJson(request)) return response.status(400).json({ message: msg })
        session.flash('error', msg)
        return response.redirect().back()
      }
      const g = await Colaborador.find(payload.gestorId)
      if (!g) {
        const msg = 'Gestor informado é inválido.'
        if (this.wantsJson(request)) return response.status(400).json({ message: msg })
        session.flash('error', msg)
        return response.redirect().back()
      }
    }

    colaborador.merge({
      userId: payload.userId !== undefined ? payload.userId : colaborador.userId,
      nome: payload.nome || colaborador.nome,
      rg: payload.rg !== undefined ? payload.rg : colaborador.rg,
      dataNascimento: payload.dataNascimento ? DateTime.fromISO(payload.dataNascimento) : colaborador.dataNascimento,
      sexo: payload.sexo !== undefined ? payload.sexo : colaborador.sexo,
      estadoCivil: payload.estadoCivil !== undefined ? payload.estadoCivil : colaborador.estadoCivil,
      fotoUrl: payload.fotoUrl !== undefined ? payload.fotoUrl : colaborador.fotoUrl,
      perfilDiscPrimario: payload.perfilDiscPrimario !== undefined ? payload.perfilDiscPrimario : colaborador.perfilDiscPrimario,
      perfilDiscSecundario: payload.perfilDiscSecundario !== undefined ? payload.perfilDiscSecundario : colaborador.perfilDiscSecundario,
      observacoesComportamentais: payload.observacoesComportamentais !== undefined ? payload.observacoesComportamentais : colaborador.observacoesComportamentais,
      telefonePessoal: payload.telefonePessoal !== undefined ? payload.telefonePessoal : colaborador.telefonePessoal,
      telefoneCorporativo: payload.telefoneCorporativo !== undefined ? payload.telefoneCorporativo : colaborador.telefoneCorporativo,
      emailPessoal: payload.emailPessoal !== undefined ? payload.emailPessoal : colaborador.emailPessoal,
      emailCorporativo: payload.emailCorporativo !== undefined ? payload.emailCorporativo : colaborador.emailCorporativo,
      enderecoLogradouro: payload.enderecoLogradouro !== undefined ? payload.enderecoLogradouro : colaborador.enderecoLogradouro,
      enderecoNumero: payload.enderecoNumero !== undefined ? payload.enderecoNumero : colaborador.enderecoNumero,
      enderecoComplemento: payload.enderecoComplemento !== undefined ? payload.enderecoComplemento : colaborador.enderecoComplemento,
      enderecoBairro: payload.enderecoBairro !== undefined ? payload.enderecoBairro : colaborador.enderecoBairro,
      enderecoCidade: payload.enderecoCidade !== undefined ? payload.enderecoCidade : colaborador.enderecoCidade,
      enderecoEstado: payload.enderecoEstado !== undefined ? payload.enderecoEstado : colaborador.enderecoEstado,
      enderecoCep: payload.enderecoCep !== undefined ? payload.enderecoCep : colaborador.enderecoCep,
      regime: payload.regime || colaborador.regime,
      tipoContrato: payload.tipoContrato !== undefined ? payload.tipoContrato : colaborador.tipoContrato,
      pjCnpj: payload.pjCnpj !== undefined ? payload.pjCnpj : colaborador.pjCnpj,
      pjContratoUrl: payload.pjContratoUrl !== undefined ? payload.pjContratoUrl : colaborador.pjContratoUrl,
      pjValorMensal: payload.pjValorMensal !== undefined && payload.pjValorMensal !== null ? String(payload.pjValorMensal) : colaborador.pjValorMensal,
      pjVigenciaInicio: payload.pjVigenciaInicio ? DateTime.fromISO(payload.pjVigenciaInicio) : colaborador.pjVigenciaInicio,
      pjVigenciaFim: payload.pjVigenciaFim ? DateTime.fromISO(payload.pjVigenciaFim) : colaborador.pjVigenciaFim,
      cargaHoraria: payload.cargaHoraria !== undefined ? payload.cargaHoraria : colaborador.cargaHoraria,
      escala: payload.escala !== undefined ? payload.escala : colaborador.escala,
      modalidade: payload.modalidade || colaborador.modalidade,
      jornadaEspecial: payload.jornadaEspecial !== undefined ? payload.jornadaEspecial : colaborador.jornadaEspecial,
      banco: payload.banco !== undefined ? payload.banco : colaborador.banco,
      agencia: payload.agencia !== undefined ? payload.agencia : colaborador.agencia,
      conta: payload.conta !== undefined ? payload.conta : colaborador.conta,
      tipoConta: payload.tipoConta !== undefined ? payload.tipoConta : colaborador.tipoConta,
      gestorId: payload.gestorId !== undefined ? payload.gestorId : colaborador.gestorId,
    })

    await colaborador.save()

    if (this.wantsJson(request)) {
      return response.json(colaborador)
    }

    session.flash('success', 'Dados do colaborador atualizados com sucesso!')
    return response.redirect().back()
  }

  /**
   * RH-RN009: Lançamento no Histórico Salarial Imutável.
   */
  async lancarHistoricoSalarial({ params, request, response, auth, session }: HttpContext) {
    const user = auth.user!
    if (!this.isAuthorized(user)) {
      return response.status(403).json({ message: 'Acesso restrito ao RH e Diretoria' })
    }

    const colaborador = await Colaborador.find(params.id)
    if (!colaborador) {
      return response.status(404).json({ message: 'Colaborador não encontrado' })
    }

    const payload = await request.validateUsing(historicoSalarialValidator)

    const registro = await db.transaction(async (trx) => {
      const dataVigenciaDt = DateTime.fromISO(payload.dataVigencia)

      const hs = new HistoricoSalarialColaborador()
      hs.useTransaction(trx)
      hs.fill({
        colaboradorId: colaborador.id,
        salarioClt: String(payload.salarioClt),
        remuneracaoComplementar: payload.remuneracaoComplementar ? String(payload.remuneracaoComplementar) : null,
        dataVigencia: dataVigenciaDt,
        motivo: payload.motivo,
        registradoPorId: user.id,
      })
      await hs.save()

      // Carry-forward: só atualiza denormalizado se for o mais recente
      const dataVigenciaAtual = colaborador.dataVigenciaSalario

      const eMaisRecente = !dataVigenciaAtual || dataVigenciaDt >= dataVigenciaAtual

      if (eMaisRecente) {
        colaborador.useTransaction(trx)
        colaborador.salarioClt = String(payload.salarioClt)
        if (payload.remuneracaoComplementar !== undefined && payload.remuneracaoComplementar !== null) {
          colaborador.remuneracaoComplementar = String(payload.remuneracaoComplementar)
        }
        colaborador.dataVigenciaSalario = dataVigenciaDt
        await colaborador.save()
      }

      return hs
    })

    if (this.wantsJson(request)) {
      return response.status(201).json(registro)
    }

    session.flash('success', 'Novo salário registrado com sucesso no histórico!')
    return response.redirect().back()
  }

  /**
   * RH-RN009: Lançamento no Histórico de Cargos Imutável.
   */
  async lancarHistoricoCargo({ params, request, response, auth, session }: HttpContext) {
    const user = auth.user!
    if (!this.isAuthorized(user)) {
      return response.status(403).json({ message: 'Acesso restrito ao RH e Diretoria' })
    }

    const colaborador = await Colaborador.find(params.id)
    if (!colaborador) {
      return response.status(404).json({ message: 'Colaborador não encontrado' })
    }

    const payload = await request.validateUsing(historicoCargoValidator)

    const cargoNovo = await Cargo.find(payload.cargoNovoId)
    if (!cargoNovo) {
      return response.status(400).json({ message: 'Cargo selecionado é inválido' })
    }

    const registro = await db.transaction(async (trx) => {
      const dataNova = DateTime.fromISO(payload.data)

      const hc = new HistoricoCargoColaborador()
      hc.useTransaction(trx)
      hc.fill({
        colaboradorId: colaborador.id,
        cargoAnteriorId: colaborador.cargoId,
        cargoNovoId: payload.cargoNovoId,
        data: dataNova,
        aprovadoPorId: user.id,
        justificativa: payload.justificativa || null,
      })
      await hc.save()

      // Obtém o último histórico registrado
      const ultimo = await HistoricoCargoColaborador.query()
        .where('colaborador_id', colaborador.id)
        .orderBy('data', 'desc')
        .orderBy('id', 'desc')
        .first()

      const dataUltima = ultimo ? ultimo.data : null

      if (!dataUltima || dataNova >= dataUltima) {
        colaborador.useTransaction(trx)
        colaborador.cargoId = payload.cargoNovoId
        colaborador.departamentoId = cargoNovo.departamentoId
        await colaborador.save()
      }

      return hc
    })

    if (this.wantsJson(request)) {
      return response.status(201).json(registro)
    }

    session.flash('success', 'Progressão de cargo registrada com sucesso no histórico!')
    return response.redirect().back()
  }

  /**
   * RH-RN009: Processo formal de Desligamento de Colaborador (Soft Delete).
   */
  async desligar({ params, request, response, auth, session }: HttpContext) {
    const user = auth.user!
    if (!this.isAuthorized(user)) {
      return response.status(403).json({ message: 'Acesso restrito ao RH e Diretoria' })
    }

    const colaborador = await Colaborador.find(params.id)
    if (!colaborador) {
      return response.status(404).json({ message: 'Colaborador não encontrado' })
    }

    if (!colaborador.isActive) {
      const msg = 'Colaborador já está formalmente desligado.'
      if (this.wantsJson(request)) return response.status(400).json({ message: msg })
      session.flash('error', msg)
      return response.redirect().back()
    }

    const payload = await request.validateUsing(desligamentoValidator)

    colaborador.merge({
      isActive: false,
      dataDesligamento: DateTime.fromISO(payload.dataDesligamento),
      tipoDesligamento: payload.tipoDesligamento,
      motivoDesligamento: payload.motivoDesligamento,
      entrevistaSaida: payload.entrevistaSaida || null,
    })

    await colaborador.save()

    if (this.wantsJson(request)) {
      return response.json(colaborador)
    }

    session.flash('success', `Desligamento de "${colaborador.nome}" formalizado com sucesso.`)
    return response.redirect().back()
  }

  /**
   * RH-RN011: Exceção Administrativa de Purga Definitiva (Hard Delete).
   * Restrita estritamente à DIRETORIA e SOMENTE se o colaborador já estiver desligado.
   */
  async destroy({ params, request, response, auth, session }: HttpContext) {
    const user = auth.user!
    // Trava 1: Exclusivo para Diretoria
    if (!this.isDiretoria(user)) {
      const msg = 'RH-RN011: Exclusão definitiva de cadastro é restrita exclusivamente à Diretoria.'
      if (this.wantsJson(request)) return response.status(403).json({ message: msg })
      session.flash('error', msg)
      return response.redirect().back()
    }

    const colaborador = await Colaborador.find(params.id)
    if (!colaborador) {
      return response.status(404).json({ message: 'Colaborador não encontrado' })
    }

    // Trava 2: Apenas se já estiver desligado (evita atalho para demissão)
    if (colaborador.isActive) {
      const msg = 'RH-RN011: Desligue o colaborador antes de excluir o cadastro definitivamente.'
      if (this.wantsJson(request)) return response.status(400).json({ message: msg })
      session.flash('error', msg)
      return response.redirect().back()
    }

    await db.transaction(async (trx) => {
      // Remove dependências de organograma
      await Colaborador.query({ client: trx })
        .where('gestor_id', colaborador.id)
        .update({ gestor_id: null })

      // Remove históricos e documentos
      await HistoricoSalarialColaborador.query({ client: trx })
        .where('colaborador_id', colaborador.id)
        .delete()

      await HistoricoCargoColaborador.query({ client: trx })
        .where('colaborador_id', colaborador.id)
        .delete()

      await DocumentoColaborador.query({ client: trx })
        .where('colaborador_id', colaborador.id)
        .delete()

      // Exclui definitivamente
      colaborador.useTransaction(trx)
      await colaborador.delete()
    })

    if (this.wantsJson(request)) {
      return response.status(204).send(null)
    }

    session.flash('success', 'Cadastro expurgado definitivamente do banco de dados (RH-RN011).')
    return response.redirect().toPath('/colaboradores')
  }

  // === DEPARTAMENTOS ===
  async listarDepartamentos({ response }: HttpContext) {
    const departamentos = await Departamento.query().orderBy('nome', 'asc')
    return response.json(departamentos)
  }

  async criarDepartamento({ request, response }: HttpContext) {
    const payload = await request.validateUsing(createDepartamentoValidator)
    const departamento = await Departamento.create({
      nome: payload.nome,
      ativo: payload.ativo ?? true,
    })
    return response.status(201).json(departamento)
  }

  async atualizarDepartamento({ params, request, response }: HttpContext) {
    const departamento = await Departamento.find(params.id)
    if (!departamento) return response.status(404).json({ message: 'Departamento não encontrado' })
    const payload = await request.validateUsing(updateDepartamentoValidator)
    departamento.merge(payload)
    await departamento.save()
    return response.json(departamento)
  }

  // === CARGOS ===
  async listarCargos({ request, response }: HttpContext) {
    const { departamentoId } = request.qs()
    const query = Cargo.query().preload('departamento').orderBy('nome', 'asc')
    if (departamentoId) query.where('departamento_id', departamentoId)
    const cargos = await query
    return response.json(cargos)
  }

  async criarCargo({ request, response }: HttpContext) {
    const payload = await request.validateUsing(createCargoValidator)
    const depto = await Departamento.find(payload.departamentoId)
    if (!depto) return response.status(400).json({ message: 'Departamento inválido' })
    const cargo = await Cargo.create({
      nome: payload.nome,
      departamentoId: payload.departamentoId,
      ativo: payload.ativo ?? true,
    })
    return response.status(201).json(cargo)
  }

  async atualizarCargo({ params, request, response }: HttpContext) {
    const cargo = await Cargo.find(params.id)
    if (!cargo) return response.status(404).json({ message: 'Cargo não encontrado' })
    const payload = await request.validateUsing(updateCargoValidator)
    if (payload.departamentoId) {
      const depto = await Departamento.find(payload.departamentoId)
      if (!depto) return response.status(400).json({ message: 'Departamento inválido' })
    }
    cargo.merge(payload)
    await cargo.save()
    return response.json(cargo)
  }

  // === DOCUMENTOS ===
  async adicionarDocumento({ params, request, response, session }: HttpContext) {
    const colaborador = await Colaborador.find(params.id)
    if (!colaborador) return response.status(404).json({ message: 'Colaborador não encontrado' })
    const payload = await request.validateUsing(documentoValidator)

    const doc = await DocumentoColaborador.create({
      colaboradorId: colaborador.id,
      tipo: payload.tipo,
      url: payload.url,
      dataVencimento: payload.dataVencimento ? DateTime.fromISO(payload.dataVencimento) : null,
    })

    if (this.wantsJson(request)) return response.status(201).json(doc)
    session.flash('success', 'Documento funcional anexado com sucesso!')
    return response.redirect().back()
  }

  async removerDocumento({ params, request, response, session }: HttpContext) {
    const doc = await DocumentoColaborador.query()
      .where('id', params.documentoId)
      .where('colaborador_id', params.id)
      .first()

    if (!doc) return response.status(404).json({ message: 'Documento não encontrado' })
    await doc.delete()

    if (this.wantsJson(request)) return response.status(204).send(null)
    session.flash('success', 'Documento excluído com sucesso!')
    return response.redirect().back()
  }
}
