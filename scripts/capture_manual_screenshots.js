import puppeteer from 'puppeteer-core'
import fs from 'node:fs'
import path from 'node:path'

const baseUrl = 'http://localhost:3333'
const outputDirs = [
  path.resolve('public/manual_assets'),
  path.resolve('../docs/manual/images'),
]

// Garante que os diretórios de saída existam
for (const dir of outputDirs) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true })
  }
}

async function saveScreenshot(page, filename) {
  for (const dir of outputDirs) {
    const filePath = path.join(dir, filename)
    await page.screenshot({ path: filePath, fullPage: false })
  }
  console.log(`✓ Capturado: ${filename}`)
}

async function run() {
  console.log('--- INICIANDO CAPTURA AUTOMATIZADA DE SCREENSHOTS REAIS ---')

  const browser = await puppeteer.launch({
    executablePath: '/usr/bin/google-chrome-stable',
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-gpu', '--disable-dev-shm-usage'],
    defaultViewport: { width: 1440, height: 900, deviceScaleFactor: 1.5 },
  })

  try {
    const page = await browser.newPage()

    // 1. Tela de Login
    console.log('\n1. Capturando Tela de Login...')
    await page.goto(`${baseUrl}/login`, { waitUntil: 'networkidle2' })
    await page.waitForSelector('input[type="email"]')
    await saveScreenshot(page, '01_login.png')

    // Efetua Login como Diretoria / Gestor Geral
    console.log('\nRealizando login como admin@plannit.com.br...')
    await page.type('input[type="email"]', 'admin@plannit.com.br')
    await page.type('input[type="password"]', 'Admin@123456')
    await Promise.all([
      page.waitForNavigation({ waitUntil: 'networkidle2' }),
      page.click('button[type="submit"]'),
    ])

    // Aguarda o Inertia carregar o Dashboard
    await page.waitForSelector('h1')
    await new Promise((r) => setTimeout(r, 1000))

    // 2. Dashboard Gerencial Consolidado
    console.log('2. Capturando Dashboard Gerencial...')
    await page.goto(`${baseUrl}/dashboard`, { waitUntil: 'networkidle2' })
    await new Promise((r) => setTimeout(r, 1200))
    await saveScreenshot(page, '02_dashboard.png')

    // 3. CRM & Funil de Leads
    console.log('3. Capturando CRM & Funil Comercial...')
    await page.goto(`${baseUrl}/crm`, { waitUntil: 'networkidle2' })
    await new Promise((r) => setTimeout(r, 1200))
    await saveScreenshot(page, '03_crm.png')

    // 4. Briefings Inteligentes
    console.log('4. Capturando Briefings Inteligentes...')
    await page.goto(`${baseUrl}/briefings`, { waitUntil: 'networkidle2' })
    await new Promise((r) => setTimeout(r, 1200))
    await saveScreenshot(page, '04_briefing.png')

    // 5. Fila de Projetos & Monitor WIP
    console.log('5. Capturando Fila de Projetos & Monitor WIP...')
    await page.goto(`${baseUrl}/fila`, { waitUntil: 'networkidle2' })
    await new Promise((r) => setTimeout(r, 1200))
    await saveScreenshot(page, '05_fila_wip.png')

    // 6. Especificadores & Arquitetos
    console.log('6. Capturando Especificadores & Arquitetos (Score RFV)...')
    await page.goto(`${baseUrl}/especificadores`, { waitUntil: 'networkidle2' })
    await new Promise((r) => setTimeout(r, 1200))
    await saveScreenshot(page, '06_especificadores.png')

    // 7. Carteira de Clientes
    console.log('7. Capturando Carteira de Clientes...')
    await page.goto(`${baseUrl}/clientes`, { waitUntil: 'networkidle2' })
    await new Promise((r) => setTimeout(r, 1200))
    await saveScreenshot(page, '07_clientes.png')

    // 8. Carteira Geral de Projetos
    console.log('8. Capturando Carteira Geral de Projetos...')
    await page.goto(`${baseUrl}/projetos`, { waitUntil: 'networkidle2' })
    await new Promise((r) => setTimeout(r, 1200))
    await saveScreenshot(page, '08_projetos.png')

    // Descobrir um projeto existente para a Sala de Controle e Fechamento
    const projetoId = await page.evaluate(() => {
      const link = document.querySelector('a[href*="/projetos/"]')
      if (link) {
        const match = link.getAttribute('href').match(/\/projetos\/(\d+)/)
        return match ? match[1] : null
      }
      return null
    })

    const targetId = projetoId || '459'
    console.log(`Alvo para detalhe do projeto: ID ${targetId}`)

    // 9. Sala de Controle de Projetos & Render (show)
    console.log('9. Capturando Sala de Controle do Projeto (RN004/RN005)...')
    await page.goto(`${baseUrl}/projetos/${targetId}`, { waitUntil: 'networkidle2' })
    await new Promise((r) => setTimeout(r, 1200))
    await saveScreenshot(page, '09_projetos_show.png')

    // 10. Fechamento Comercial, Contratos & Handoff Técnico (RN006)
    console.log('10. Capturando Sala de Fechamento Comercial & Handoff Técnico (RN006)...')
    await page.goto(`${baseUrl}/projetos/${targetId}/fechamento`, { waitUntil: 'networkidle2' })
    await new Promise((r) => setTimeout(r, 1200))
    await saveScreenshot(page, '10_fechamento_financeiro.png')

    // 11. RH & Colaboradores
    console.log('11. Capturando Módulo de Colaboradores (RH)...')
    await page.goto(`${baseUrl}/colaboradores`, { waitUntil: 'networkidle2' })
    await new Promise((r) => setTimeout(r, 1200))
    await saveScreenshot(page, '11_colaboradores.png')

    console.log('\n=============================================================')
    console.log('✅ TODAS AS 11 CAPTURAS DE TELA FORAM GERADAS COM SUCESSO!')
    console.log('=============================================================')
  } catch (err) {
    console.error('❌ Erro na captura de tela:', err)
  } finally {
    await browser.close()
  }
}

run()
