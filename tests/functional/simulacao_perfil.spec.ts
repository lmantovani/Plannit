import { test } from '@japa/runner'
import User, { PerfilUsuario } from '#models/user'

async function garantirUsuario(
  email: string,
  nome: string,
  perfil: PerfilUsuario,
  isSuperuser = false
) {
  const existente = await User.findBy('email', email)
  if (existente) {
    existente.perfil = perfil
    existente.isSuperuser = isSuperuser
    existente.isActive = true
    await existente.save()
    return existente
  }
  return User.create({
    nome,
    email,
    password: 'Password123!',
    perfil,
    isActive: true,
    isSuperuser,
  })
}

test.group('Segurança & Governança — Simulação de Perfil ("Ver como...")', () => {
  test('bloqueia tentativa de simulação de perfil por usuário que não é da Diretoria (403)', async ({
    client,
    assert,
  }) => {
    const vendedor = await garantirUsuario(
      'vendedor.teste.sim@lidermoveis.com.br',
      'Vendedor Sem Permissão Simulação',
      PerfilUsuario.VENDEDOR,
      false
    )

    const response = await client
      .post('/auth/simular-perfil')
      .loginAs(vendedor)
      .withCsrfToken()
      .header('Accept', 'application/json')
      .json({ perfil: 'diretoria' })

    response.assertStatus(403)
    assert.include(response.body().message, 'Apenas a Diretoria')
  })

  test('permite à Diretoria simular perfil Vendedor, aplica restrições reais e permite restaurar visão original', async ({
    client,
    assert,
  }) => {
    const diretoria = await garantirUsuario(
      'diretoria.teste.sim@lidermoveis.com.br',
      'Diretor Teste Simulação',
      PerfilUsuario.DIRETORIA,
      true
    )

    // 1. Ativa simulação para 'vendedor' via JSON
    const resSimular = await client
      .post('/auth/simular-perfil')
      .loginAs(diretoria)
      .withCsrfToken()
      .header('Accept', 'application/json')
      .json({ perfil: 'vendedor' })

    resSimular.assertStatus(200)
    assert.isTrue(resSimular.body().success)
    assert.isTrue(resSimular.body().isImpersonating)
    assert.equal(resSimular.body().perfil, 'vendedor')

    // 2. Verifica que com a sessão simulando 'vendedor', /configuracoes bloqueia com 403
    const resConfigBloqueado = await client
      .get('/configuracoes')
      .loginAs(diretoria)
      .withSession({
        impersonate_perfil: 'vendedor',
        impersonate_perfil_label: 'Vendedor',
      })

    resConfigBloqueado.assertStatus(403)

    // 3. Verifica que no CRM (/crm) a sessão simulada reflete perfil 'vendedor' e preserva canImpersonate
    const resCrmSimulado = await client
      .get('/crm')
      .loginAs(diretoria)
      .withSession({
        impersonate_perfil: 'vendedor',
        impersonate_perfil_label: 'Vendedor',
      })
      .header('X-Inertia', 'true')
      .header('X-Inertia-Version', '1')

    // Inertia pode retornar 200 ou 409 se version mismatch; vamos inspecionar via model/request normal
    const resCrmHtml = await client
      .get('/crm')
      .loginAs(diretoria)
      .withSession({
        impersonate_perfil: 'vendedor',
        impersonate_perfil_label: 'Vendedor',
      })

    resCrmHtml.assertStatus(200)
    const html = resCrmHtml.text()
    assert.include(html, '"isImpersonating":true')
    assert.include(html, '"canImpersonate":true')
    assert.include(html, '"perfilOriginal":"diretoria"')
    assert.include(html, '"isVendedor":true')

    // 4. Mesmo enquanto simula 'vendedor', o diretor consegue restaurar sua visão original de Diretoria
    const resRestaurar = await client
      .post('/auth/simular-perfil')
      .loginAs(diretoria)
      .withCsrfToken()
      .withSession({
        impersonate_perfil: 'vendedor',
        impersonate_perfil_label: 'Vendedor',
      })
      .header('Accept', 'application/json')
      .json({ perfil: 'diretoria' })

    resRestaurar.assertStatus(200)
    assert.isFalse(resRestaurar.body().isImpersonating)
    assert.equal(resRestaurar.body().perfil, 'diretoria')
  })

  test('rejeita simulação de perfil inexistente com status 400', async ({ client, assert }) => {
    const diretoria = await garantirUsuario(
      'diretoria.teste.sim@lidermoveis.com.br',
      'Diretor Teste Simulação',
      PerfilUsuario.DIRETORIA,
      true
    )

    const response = await client
      .post('/auth/simular-perfil')
      .loginAs(diretoria)
      .withCsrfToken()
      .header('Accept', 'application/json')
      .json({ perfil: 'perfil_fantasma_inexistente_999' })

    response.assertStatus(400)
    assert.include(response.body().message, 'inválido')
  })
})
