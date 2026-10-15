import { test } from '@japa/runner'
import User, { PerfilUsuario } from '#models/user'
import Lead from '#models/lead'
import HistoricoStatusLead from '#models/historico_status_lead'

async function garantirVendedor() {
  const email = 'vendedor.teste.tempo@lidermoveis.com.br'
  const existente = await User.findBy('email', email)
  if (existente) return existente
  return User.create({
    nome: 'Vendedor Teste Tempo Colunas',
    email,
    password: 'Password123!',
    perfil: PerfilUsuario.VENDEDOR,
    isActive: true,
    isSuperuser: false,
  })
}

test.group('CRM — Linha do Tempo e Soma Acumulada de Tempo por Coluna', (group) => {
  const telefonesCriados: string[] = []

  group.each.teardown(async () => {
    if (telefonesCriados.length) {
      const leads = await Lead.query().whereIn('telefone', telefonesCriados)
      const leadIds = leads.map((l) => l.id)
      if (leadIds.length) {
        await HistoricoStatusLead.query().whereIn('leadId', leadIds).delete()
        await Lead.query().whereIn('id', leadIds).delete()
      }
    }
    telefonesCriados.length = 0
  })

  const novoTelefone = () => {
    const telefone = `(11) 95${Date.now().toString().slice(-7)}`
    telefonesCriados.push(telefone)
    return telefone
  }

  test('transições de status registram tempo_permanencia_segundos e histórico completo de retorno', async ({ client, assert }) => {
    const vendedor = await garantirVendedor()
    const telefone = novoTelefone()

    // 1. Criar lead
    await client.post('/crm/leads').loginAs(vendedor).withCsrfToken().form({
      nome: 'Lead Teste Transições',
      telefone,
      origem: 'showroom',
    })

    const lead = await Lead.findByOrFail('telefone', telefone)
    assert.equal(lead.statusFunil, 'novo_lead')

    // 2. Mover para qualificando
    await client.patch(`/crm/leads/${lead.id}/status`).loginAs(vendedor).withCsrfToken().form({
      statusFunil: 'qualificando',
    })

    await lead.refresh()
    assert.equal(lead.statusFunil, 'qualificando')

    // 3. Retornar para novo_lead
    await client.patch(`/crm/leads/${lead.id}/status`).loginAs(vendedor).withCsrfToken().form({
      statusFunil: 'novo_lead',
    })

    await lead.refresh()
    assert.equal(lead.statusFunil, 'novo_lead')

    // 4. Verificar histórico de status registrado no banco
    const historicos = await HistoricoStatusLead.query()
      .where('leadId', lead.id)
      .orderBy('id', 'asc')

    // Deve ter 3 registros:
    // 1: null -> novo_lead (criação)
    // 2: novo_lead -> qualificando (saída de novo_lead)
    // 3: qualificando -> novo_lead (retorno para novo_lead)
    assert.lengthOf(historicos, 3)

    assert.isNull(historicos[0].statusDe)
    assert.equal(historicos[0].statusPara, 'novo_lead')

    assert.equal(historicos[1].statusDe, 'novo_lead')
    assert.equal(historicos[1].statusPara, 'qualificando')
    assert.isNotNull(historicos[1].tempoPermanenciaSegundos)

    assert.equal(historicos[2].statusDe, 'qualificando')
    assert.equal(historicos[2].statusPara, 'novo_lead')
    assert.isNotNull(historicos[2].tempoPermanenciaSegundos)
  })

  test('endpoint /crm expõe statusAlteradoEm na serialização para permitir o cálculo em tempo real', async ({ client, assert }) => {
    const vendedor = await garantirVendedor()
    const telefone = novoTelefone()

    await client.post('/crm/leads').loginAs(vendedor).withCsrfToken().form({
      nome: 'Lead Teste Tempo Serializacao',
      telefone,
      origem: 'showroom',
    })

    const response = await client
      .get('/crm?format=json')
      .loginAs(vendedor)
      .header('accept', 'application/json')

    response.assertStatus(200)
    const leads = response.body().leads
    const leadEncontrado = leads.find((l: any) => l.telefone === telefone)

    assert.isDefined(leadEncontrado)
    assert.property(leadEncontrado, 'statusAlteradoEm', 'statusAlteradoEm deve estar presente no payload do lead')
    assert.property(leadEncontrado, 'historicoStatus', 'historicoStatus deve estar presente no payload do lead')
  })
})

