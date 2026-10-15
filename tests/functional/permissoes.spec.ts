import { test } from '@japa/runner'
import User, { PerfilUsuario } from '#models/user'
import PerfilPermissao from '#models/perfil_permissao'
import PerfilCatalogo from '#models/perfil_catalogo'
import PermissionService from '#services/permission_service'

test.group('Matriz Dinâmica de Permissões & Perfis (RBAC)', () => {
  test('bloqueia alteração de permissão para usuário não autenticado', async ({ client }) => {
    const response = await client
      .patch('/configuracoes/permissoes/toggle')
      .withCsrfToken()
      .json({
        perfil: PerfilUsuario.VENDEDOR,
        permissaoCodigo: 'crm.ver_todos',
        concedido: true,
      })

    response.assertRedirectsTo('/login')
  })

  test('bloqueia alteração de permissão para perfil sem permissão mestre (Vendedor recebe 403)', async ({ client }) => {
    let vendedor = await User.findBy('email', 'vendedor.perm.teste@lidermoveis.com.br')
    if (!vendedor) {
      vendedor = await User.create({
        nome: 'Vendedor Teste Perm',
        email: 'vendedor.perm.teste@lidermoveis.com.br',
        password: 'Password123!',
        perfil: PerfilUsuario.VENDEDOR,
        isActive: true,
        isSuperuser: false,
      })
    }

    const response = await client
      .patch('/configuracoes/permissoes/toggle')
      .withCsrfToken()
      .loginAs(vendedor)
      .json({
        perfil: PerfilUsuario.VENDEDOR,
        permissaoCodigo: 'crm.ver_todos',
        concedido: true,
      })

    response.assertStatus(403)
  })

  test('diretoria possui acesso mestre integral incondicional e permissão de gestão', async ({ client }) => {
    let diretoria = await User.findBy('email', 'diretoria.perm.teste@lidermoveis.com.br')
    if (!diretoria) {
      diretoria = await User.create({
        nome: 'Diretoria Teste Perm',
        email: 'diretoria.perm.teste@lidermoveis.com.br',
        password: 'Password123!',
        perfil: PerfilUsuario.DIRETORIA,
        isActive: true,
        isSuperuser: false,
      })
    }

    // Testa no PermissionService
    const podeGerenciar = await PermissionService.podeGerenciarPermissoes(diretoria)
    if (!podeGerenciar) {
      throw new Error('Diretoria deveria poder gerenciar permissões por padrão')
    }

    // Diretoria acessa página de configurações
    const response = await client.get('/configuracoes?format=json').loginAs(diretoria)
    response.assertStatus(200)

    const data = response.body()
    if (!data.podeGerenciarPermissoes) {
      throw new Error('podeGerenciarPermissoes deveria ser true para Diretoria')
    }
    if (!data.permissoesConfig) {
      throw new Error('permissoesConfig deveria vir populado para Diretoria')
    }
  })

  test('impede revogação de permissões da Diretoria por salvaguarda de governança mestre', async ({ client }) => {
    let diretoria = await User.findBy('email', 'diretoria.perm.teste@lidermoveis.com.br')
    if (!diretoria) {
      diretoria = await User.create({
        nome: 'Diretoria Teste Perm',
        email: 'diretoria.perm.teste@lidermoveis.com.br',
        password: 'Password123!',
        perfil: PerfilUsuario.DIRETORIA,
        isActive: true,
        isSuperuser: false,
      })
    }

    const response = await client
      .patch('/configuracoes/permissoes/toggle')
      .withCsrfToken()
      .loginAs(diretoria)
      .json({
        perfil: PerfilUsuario.DIRETORIA,
        permissaoCodigo: 'configuracoes.gerenciar_permissoes',
        concedido: false,
      })

    response.assertStatus(400)
    const body = response.body()
    if (!body.message?.includes('Diretoria possui acesso integral obrigatório')) {
      throw new Error(`Mensagem inesperada: ${JSON.stringify(body)}`)
    }
  })

  test('diretoria habilita Gerente Comercial para gerenciar permissões e este passa a poder alterar permissões', async ({ client }) => {
    let diretoria = await User.findBy('email', 'diretoria.perm.teste@lidermoveis.com.br')
    if (!diretoria) {
      diretoria = await User.create({
        nome: 'Diretoria Teste Perm',
        email: 'diretoria.perm.teste@lidermoveis.com.br',
        password: 'Password123!',
        perfil: PerfilUsuario.DIRETORIA,
        isActive: true,
        isSuperuser: false,
      })
    }

    let gerente = await User.findBy('email', 'gerente.perm.teste@lidermoveis.com.br')
    if (!gerente) {
      gerente = await User.create({
        nome: 'Gerente Teste Perm',
        email: 'gerente.perm.teste@lidermoveis.com.br',
        password: 'Password123!',
        perfil: PerfilUsuario.GERENTE_COMERCIAL,
        isActive: true,
        isSuperuser: false,
      })
    }

    // 1. Inicialmente Gerente não pode gerenciar permissões
    // Garante que no banco está false
    await PerfilPermissao.query()
      .where('perfil', PerfilUsuario.GERENTE_COMERCIAL)
      .where('permissao_codigo', 'configuracoes.gerenciar_permissoes')
      .update({ concedido: false })

    const resTentativa = await client
      .patch('/configuracoes/permissoes/toggle')
      .withCsrfToken()
      .loginAs(gerente)
      .json({
        perfil: PerfilUsuario.VENDEDOR,
        permissaoCodigo: 'fila.visualizar',
        concedido: true,
      })

    resTentativa.assertStatus(403)

    // 2. Diretoria concede a permissão mestre para Gerente Comercial
    const resConcessao = await client
      .patch('/configuracoes/permissoes/toggle')
      .withCsrfToken()
      .loginAs(diretoria)
      .json({
        perfil: PerfilUsuario.GERENTE_COMERCIAL,
        permissaoCodigo: 'configuracoes.gerenciar_permissoes',
        concedido: true,
      })

    resConcessao.assertStatus(200)

    // 3. Agora o Gerente Comercial consegue alterar permissões de outros perfis
    const resGerenteAltera = await client
      .patch('/configuracoes/permissoes/toggle')
      .withCsrfToken()
      .loginAs(gerente)
      .json({
        perfil: PerfilUsuario.VENDEDOR,
        permissaoCodigo: 'fila.visualizar',
        concedido: true,
      })

    resGerenteAltera.assertStatus(200)

    // Confere no banco se foi concedido
    const permVendedor = await PerfilPermissao.query()
      .where('perfil', PerfilUsuario.VENDEDOR)
      .where('permissao_codigo', 'fila.visualizar')
      .first()

    if (!permVendedor?.concedido) {
      throw new Error('Permissão fila.visualizar deveria estar concedida para Vendedor')
    }
  })

  test('concessão e revogação dinâmica de configuracoes.visualizar afeta acesso imediato à rota', async ({ client }) => {
    let diretoria = await User.findBy('email', 'diretoria.perm.teste@lidermoveis.com.br')
    if (!diretoria) {
      diretoria = await User.create({
        nome: 'Diretoria Teste Perm',
        email: 'diretoria.perm.teste@lidermoveis.com.br',
        password: 'Password123!',
        perfil: PerfilUsuario.DIRETORIA,
        isActive: true,
        isSuperuser: false,
      })
    }

    let conferente = await User.findBy('email', 'conferente.perm.teste@lidermoveis.com.br')
    if (!conferente) {
      conferente = await User.create({
        nome: 'Conferente Teste Perm',
        email: 'conferente.perm.teste@lidermoveis.com.br',
        password: 'Password123!',
        perfil: PerfilUsuario.CONFERENTE,
        isActive: true,
        isSuperuser: false,
      })
    }

    // 1. Conferente tenta acessar /configuracoes e recebe 403
    await PerfilPermissao.query()
      .where('perfil', PerfilUsuario.CONFERENTE)
      .where('permissao_codigo', 'configuracoes.visualizar')
      .update({ concedido: false })

    const resBloqueado = await client.get('/configuracoes').loginAs(conferente)
    resBloqueado.assertStatus(403)

    // 2. Diretoria concede acesso a configuracoes.visualizar para Conferente
    const resConcede = await client
      .patch('/configuracoes/permissoes/toggle')
      .withCsrfToken()
      .loginAs(diretoria)
      .json({
        perfil: PerfilUsuario.CONFERENTE,
        permissaoCodigo: 'configuracoes.visualizar',
        concedido: true,
      })

    resConcede.assertStatus(200)

    // 3. Conferente agora acessa /configuracoes com sucesso (200)
    const resPermitido = await client.get('/configuracoes').loginAs(conferente)
    resPermitido.assertStatus(200)

    // 4. Diretoria revoga o acesso
    const resRevoga = await client
      .patch('/configuracoes/permissoes/toggle')
      .withCsrfToken()
      .loginAs(diretoria)
      .json({
        perfil: PerfilUsuario.CONFERENTE,
        permissaoCodigo: 'configuracoes.visualizar',
        concedido: false,
      })

    resRevoga.assertStatus(200)

    // 5. Conferente volta a ser bloqueado com 403
    const resBloqueadoNovamente = await client.get('/configuracoes').loginAs(conferente)
    resBloqueadoNovamente.assertStatus(403)
  })

  test('bloqueia criação, edição e exclusão de perfis para usuário sem permissão mestre', async ({ client }) => {
    let vendedor = await User.findBy('email', 'vendedor.perm.teste@lidermoveis.com.br')
    if (!vendedor) {
      vendedor = await User.create({
        nome: 'Vendedor Teste Perm',
        email: 'vendedor.perm.teste@lidermoveis.com.br',
        password: 'Password123!',
        perfil: PerfilUsuario.VENDEDOR,
        isActive: true,
        isSuperuser: false,
      })
    }

    // Tentativa de criação
    const resCreate = await client
      .post('/configuracoes/perfis')
      .withCsrfToken()
      .loginAs(vendedor)
      .json({
        nome: 'Novo Perfil Inválido',
        slug: 'invalido',
      })
    resCreate.assertStatus(403)

    // Tentativa de edição
    const resUpdate = await client
      .put('/configuracoes/perfis/1')
      .withCsrfToken()
      .loginAs(vendedor)
      .json({
        nome: 'Tentativa Altera',
      })
    resUpdate.assertStatus(403)

    // Tentativa de exclusão
    const resDelete = await client
      .delete('/configuracoes/perfis/1')
      .withCsrfToken()
      .header('accept', 'application/json')
      .loginAs(vendedor)
    resDelete.assertStatus(403)
  })

  test('diretoria cria perfil customizado e herda permissões de outro perfil', async ({ client }) => {
    let diretoria = await User.findBy('email', 'diretoria.perm.teste@lidermoveis.com.br')
    if (!diretoria) {
      diretoria = await User.create({
        nome: 'Diretoria Teste Perm',
        email: 'diretoria.perm.teste@lidermoveis.com.br',
        password: 'Password123!',
        perfil: PerfilUsuario.DIRETORIA,
        isActive: true,
        isSuperuser: false,
      })
    }

    // Limpa se já existir de teste anterior
    await PerfilPermissao.query().where('perfil', 'coordenador_montagem').delete()
    await PerfilCatalogo.query().where('slug', 'coordenador_montagem').delete()

    const res = await client
      .post('/configuracoes/perfis')
      .withCsrfToken()
      .loginAs(diretoria)
      .json({
        nome: 'Coordenador de Montagem',
        slug: 'coordenador_montagem',
        descricao: 'Supervisiona equipes de montagem',
        copiarDePerfil: PerfilUsuario.PROJETISTA,
        ordem: 18,
      })

    res.assertStatus(200)
    const body = res.body()
    if (!body.perfil || body.perfil.slug !== 'coordenador_montagem') {
      throw new Error(`Perfil não retornado corretamente: ${JSON.stringify(body)}`)
    }

    // Verifica no banco
    const criado = await PerfilCatalogo.findBy('slug', 'coordenador_montagem')
    if (!criado) {
      throw new Error('Perfil coordenador_montagem não foi salvo no banco')
    }
    if (criado.isSistema) {
      throw new Error('Perfil criado não deve ser isSistema: true')
    }

    // Verifica se as permissões foram copiadas do projetista
    const permsProjetista = await PerfilPermissao.query().where('perfil', PerfilUsuario.PROJETISTA)
    const permsNovo = await PerfilPermissao.query().where('perfil', 'coordenador_montagem')

    if (permsNovo.length === 0) {
      throw new Error('Permissões do novo perfil não foram inicializadas')
    }

    for (const pProj of permsProjetista) {
      const pNovo = permsNovo.find((p) => p.permissaoCodigo === pProj.permissaoCodigo)
      if (!pNovo || pNovo.concedido !== pProj.concedido) {
        throw new Error(`Permissão ${pProj.permissaoCodigo} não foi copiada fielmente do Projetista`)
      }
    }
  })

  test('diretoria edita perfil customizado com sucesso', async ({ client }) => {
    let diretoria = await User.findBy('email', 'diretoria.perm.teste@lidermoveis.com.br')
    if (!diretoria) {
      diretoria = await User.create({
        nome: 'Diretoria Teste Perm',
        email: 'diretoria.perm.teste@lidermoveis.com.br',
        password: 'Password123!',
        perfil: PerfilUsuario.DIRETORIA,
        isActive: true,
        isSuperuser: false,
      })
    }

    const perfil = await PerfilCatalogo.findByOrFail('slug', 'coordenador_montagem')

    const res = await client
      .put(`/configuracoes/perfis/${perfil.id}`)
      .withCsrfToken()
      .loginAs(diretoria)
      .json({
        nome: 'Coordenador Geral de Montagem',
        descricao: 'Gestor responsável pelo time de montadores',
        ordem: 25,
      })

    res.assertStatus(200)

    await perfil.refresh()
    if (perfil.nome !== 'Coordenador Geral de Montagem' || perfil.ordem !== 25) {
      throw new Error(`Perfil não foi atualizado: ${JSON.stringify(perfil.toJSON())}`)
    }
  })

  test('impede desativação e exclusão de perfis nativos do sistema', async ({ client }) => {
    let diretoria = await User.findBy('email', 'diretoria.perm.teste@lidermoveis.com.br')
    if (!diretoria) {
      diretoria = await User.create({
        nome: 'Diretoria Teste Perm',
        email: 'diretoria.perm.teste@lidermoveis.com.br',
        password: 'Password123!',
        perfil: PerfilUsuario.DIRETORIA,
        isActive: true,
        isSuperuser: false,
      })
    }

    const perfilVendedor = await PerfilCatalogo.findByOrFail('slug', PerfilUsuario.VENDEDOR)

    // Tentativa de desativar
    const resDesativa = await client
      .put(`/configuracoes/perfis/${perfilVendedor.id}`)
      .withCsrfToken()
      .loginAs(diretoria)
      .json({
        isActive: false,
      })

    resDesativa.assertStatus(400)
    const bodyDesativa = resDesativa.body()
    if (!bodyDesativa.message?.includes('Perfis nativos do sistema não podem ser desativados')) {
      throw new Error(`Mensagem inesperada ao tentar desativar: ${JSON.stringify(bodyDesativa)}`)
    }

    // Tentativa de excluir
    const resExclui = await client
      .delete(`/configuracoes/perfis/${perfilVendedor.id}`)
      .withCsrfToken()
      .header('accept', 'application/json')
      .loginAs(diretoria)

    resExclui.assertStatus(400)
    const bodyExclui = resExclui.body()
    if (!bodyExclui.message?.includes('Perfis nativos do sistema não podem ser excluídos')) {
      throw new Error(`Mensagem inesperada ao tentar excluir: ${JSON.stringify(bodyExclui)}`)
    }
  })

  test('impede exclusão de perfil customizado com usuários vinculados e permite exclusão quando limpo', async ({ client }) => {
    let diretoria = await User.findBy('email', 'diretoria.perm.teste@lidermoveis.com.br')
    if (!diretoria) {
      diretoria = await User.create({
        nome: 'Diretoria Teste Perm',
        email: 'diretoria.perm.teste@lidermoveis.com.br',
        password: 'Password123!',
        perfil: PerfilUsuario.DIRETORIA,
        isActive: true,
        isSuperuser: false,
      })
    }

    // 1. Cria perfil lider_operacoes
    await User.query().where('email', 'lider.teste@lidermoveis.com.br').delete()
    await PerfilPermissao.query().where('perfil', 'lider_operacoes').delete()
    await PerfilCatalogo.query().where('slug', 'lider_operacoes').delete()

    const perfilLider = await PerfilCatalogo.create({
      nome: 'Líder de Operações',
      slug: 'lider_operacoes',
      isSistema: false,
      isActive: true,
      ordem: 30,
    })

    await PerfilPermissao.create({
      perfil: 'lider_operacoes',
      modulo: 'Geral',
      permissaoCodigo: 'fila.visualizar',
      descricao: 'Visualizar fila',
      concedido: true,
    })

    // 2. Cria usuário com este perfil
    const usuarioLider = await User.create({
      nome: 'Usuário Líder Teste',
      email: 'lider.teste@lidermoveis.com.br',
      password: 'Password123!',
      perfil: 'lider_operacoes',
      isActive: true,
      isSuperuser: false,
    })

    // 3. Tenta excluir o perfil com usuário vinculado -> 400
    const resBloqueio = await client
      .delete(`/configuracoes/perfis/${perfilLider.id}`)
      .withCsrfToken()
      .header('accept', 'application/json')
      .loginAs(diretoria)

    resBloqueio.assertStatus(400)
    const bodyBloqueio = resBloqueio.body()
    if (!bodyBloqueio.message?.includes('usuário(s) com este perfil atribuído')) {
      throw new Error(`Mensagem inesperada: ${JSON.stringify(bodyBloqueio)}`)
    }

    // 4. Remove o usuário vinculado
    await usuarioLider.delete()

    // 5. Agora a exclusão deve funcionar com sucesso (200)
    const resSucesso = await client
      .delete(`/configuracoes/perfis/${perfilLider.id}`)
      .withCsrfToken()
      .header('accept', 'application/json')
      .loginAs(diretoria)

    resSucesso.assertStatus(200)

    // Confere remoção do perfil e de suas permissões
    const perfilExiste = await PerfilCatalogo.find(perfilLider.id)
    if (perfilExiste) {
      throw new Error('Perfil não deveria existir mais no banco')
    }

    const permsSobrando = await PerfilPermissao.query().where('perfil', 'lider_operacoes')
    if (permsSobrando.length > 0) {
      throw new Error('Permissões do perfil excluído não foram limpas')
    }
  })

  test('diretoria visualiza a listagem de usuários do sistema com seus e-mails e perfis em /configuracoes', async ({ client }) => {
    let diretoria = await User.findBy('email', 'diretoria.perm.teste@lidermoveis.com.br')
    if (!diretoria) {
      diretoria = await User.create({
        nome: 'Diretoria Teste Perm',
        email: 'diretoria.perm.teste@lidermoveis.com.br',
        password: 'Password123!',
        perfil: PerfilUsuario.DIRETORIA,
        isActive: true,
        isSuperuser: false,
      })
    }

    const res = await client.get('/configuracoes?format=json').loginAs(diretoria)
    res.assertStatus(200)

    const data = res.body()
    if (!Array.isArray(data.usuarios) || data.usuarios.length === 0) {
      throw new Error('Lista de usuários deveria vir populada no payload de configurações')
    }

    // Verifica que cada usuário possui as informações seguras necessárias
    for (const u of data.usuarios) {
      if (!u.id || !u.nome || !u.email || !u.perfil || !u.perfilLabel) {
        throw new Error(`Dados do usuário incompletos: ${JSON.stringify(u)}`)
      }
      if ('password' in u) {
        throw new Error('A propriedade password NUNCA deve ser exposta no payload de usuários')
      }
    }

    // Verifica que o usuário da diretoria está na lista
    const diretorNaLista = data.usuarios.find((u: any) => u.email === diretoria.email)
    if (!diretorNaLista) {
      throw new Error('Usuário de Diretoria não encontrado na lista retornada')
    }
    if (diretorNaLista.perfil !== PerfilUsuario.DIRETORIA) {
      throw new Error(`Perfil do diretor incorreto: ${diretorNaLista.perfil}`)
    }

    // Confere que perfisCatalogo também veio para os filtros
    if (!Array.isArray(data.perfisCatalogo) || data.perfisCatalogo.length === 0) {
      throw new Error('perfisCatalogo deveria vir no payload para suporte aos filtros de usuários')
    }
  })
})


