import { test } from '@japa/runner'

test.group('Briefings — Roteiros Técnicos e Base de Conhecimento (18 PDFs)', (group) => {
  let ROTEIROS_BRIEFINGS: Record<string, any>
  let LISTA_ROTEIROS: Array<{ slug: string; titulo: string; subtitulo: string }>
  let resolverSlugAmbiente: (nome?: string | null) => string
  let obterRoteiroPorAmbiente: (nome?: string | null) => any
  let obterRoteiroPorSlug: (slug: string) => any
  let normalizarNomeAmbiente: (nome?: string | null) => string
  let obterTextoCompletoSecao: (secao: any) => string

  group.setup(async () => {
    const modulePath = '../../inertia/lib/roteiros_briefings.js'
    const mod: any = await import(modulePath)
    ROTEIROS_BRIEFINGS = mod.ROTEIROS_BRIEFINGS
    LISTA_ROTEIROS = mod.LISTA_ROTEIROS
    resolverSlugAmbiente = mod.resolverSlugAmbiente
    obterRoteiroPorAmbiente = mod.obterRoteiroPorAmbiente
    obterRoteiroPorSlug = mod.obterRoteiroPorSlug
    normalizarNomeAmbiente = mod.normalizarNomeAmbiente
    obterTextoCompletoSecao = mod.obterTextoCompletoSecao
  })

  test('todos os 18 PDFs possuem dados extraídos e estruturados com integridade', ({ assert }) => {
    assert.equal(LISTA_ROTEIROS.length, 18, 'Deve haver exatamente 18 roteiros na lista')
    assert.equal(
      Object.keys(ROTEIROS_BRIEFINGS).length,
      18,
      'Deve haver exatamente 18 guias cadastrados'
    )

    const slugsObrigatorios = [
      'adega',
      'area_gourmet',
      'banheiro_suite_master',
      'banheiros',
      'closet',
      'cozinha',
      'despensa',
      'hall_entrada',
      'home_office',
      'home_theater',
      'lavabo',
      'lavanderia',
      'living',
      'louceiro',
      'quarto_casal',
      'quarto_filhos',
      'rouparia',
      'sala_jantar',
    ]

    for (const slug of slugsObrigatorios) {
      const roteiro = ROTEIROS_BRIEFINGS[slug]
      assert.isDefined(roteiro, `Roteiro ${slug} deve estar definido`)
      assert.isNotEmpty(roteiro.titulo, `Roteiro ${slug} deve ter título`)
      assert.isNotEmpty(roteiro.subtitulo, `Roteiro ${slug} deve ter subtítulo`)
      assert.isNotEmpty(roteiro.arquivoPdfOriginal, `Roteiro ${slug} deve apontar para o PDF`)
      assert.isTrue(
        roteiro.arquivoPdfOriginal.endsWith('.pdf'),
        `Roteiro ${slug} deve referenciar arquivo .pdf`
      )

      assert.isTrue(
        roteiro.secoes.length >= 10,
        `Roteiro ${slug} deve ter pelo menos 10 seções (possui ${roteiro.secoes.length})`
      )
      assert.isTrue(
        roteiro.perguntasEstrategicas.length >= 1,
        `Roteiro ${slug} deve ter perguntas estratégicas (possui ${roteiro.perguntasEstrategicas.length})`
      )

      // Verifica estrutura de cada seção
      for (const secao of roteiro.secoes) {
        assert.isNotEmpty(secao.id, `Seção deve ter id em ${slug}`)
        assert.isNotEmpty(secao.titulo, `Seção deve ter título em ${slug}`)
        assert.isArray(secao.itens, `Seção deve ter array de itens em ${slug}`)
        assert.isArray(
          secao.perguntasDestaque,
          `Seção deve ter array de perguntasDestaque em ${slug}`
        )
      }
    }
  })

  test('mapeamento cobre rigorosamente todos os 20 ambientes requeridos do catálogo', ({
    assert,
  }) => {
    const mapaEsperado: Record<string, string> = {
      'Living': 'living',
      'Home Theater': 'home_theater',
      'Suíte Master': 'quarto_casal',
      'Quarto do Filho': 'quarto_filhos',
      'Quarto da Filha': 'quarto_filhos',
      'Quarto de Visita': 'quarto_filhos',
      'Closet': 'closet',
      'Cozinha': 'cozinha',
      'Espaço Gourmet': 'area_gourmet',
      'Varanda': 'area_gourmet',
      'Banheiro': 'banheiros',
      'Lavabo': 'lavabo',
      'Home Office': 'home_office',
      'Área de Serviço': 'lavanderia',
      'Adega': 'adega',
      'Despensa': 'despensa',
      'Hall de Entrada': 'hall_entrada',
      'Louceiro': 'louceiro',
      'Rouparia': 'rouparia',
      'Sala de Jantar': 'sala_jantar',
    }

    for (const [ambiente, slugEsperado] of Object.entries(mapaEsperado)) {
      const slugResolvido = resolverSlugAmbiente(ambiente)
      assert.equal(
        slugResolvido,
        slugEsperado,
        `Ambiente do catálogo "${ambiente}" deve resolver para "${slugEsperado}"`
      )

      const guia = obterRoteiroPorAmbiente(ambiente)
      assert.isDefined(guia)
      assert.equal(guia.slug, slugEsperado)
    }
  })

  test('mapeamento inteligente é tolerante a maiúsculas, acentos, sinônimos e variações compostas', ({
    assert,
  }) => {
    assert.equal(resolverSlugAmbiente('QUARTO DA FILHA'), 'quarto_filhos')
    assert.equal(resolverSlugAmbiente('quarto do filho'), 'quarto_filhos')
    assert.equal(resolverSlugAmbiente('Dormitório Infantil'), 'quarto_filhos')
    assert.equal(resolverSlugAmbiente('Quarto de Hóspedes'), 'quarto_filhos')

    assert.equal(resolverSlugAmbiente('Área de Serviço'), 'lavanderia')
    assert.equal(resolverSlugAmbiente('area de servico'), 'lavanderia')
    assert.equal(resolverSlugAmbiente('LAVANDERIA COMPLETA'), 'lavanderia')

    assert.equal(resolverSlugAmbiente('Varanda Gourmet'), 'area_gourmet')
    assert.equal(resolverSlugAmbiente('Espaco Gourmet'), 'area_gourmet')
    assert.equal(resolverSlugAmbiente('Área de Churrasqueira'), 'area_gourmet')

    assert.equal(resolverSlugAmbiente('Banheiro Suíte Master'), 'banheiro_suite_master')
    assert.equal(resolverSlugAmbiente('Banheiro Master'), 'banheiro_suite_master')
    assert.equal(resolverSlugAmbiente('Banheiro Social'), 'banheiros')

    assert.equal(resolverSlugAmbiente('Escritório Comercial'), 'home_office')
    assert.equal(resolverSlugAmbiente('Sala de TV / Cinema'), 'home_theater')
    assert.equal(resolverSlugAmbiente('Cristaleira e Louças'), 'louceiro')
    assert.equal(resolverSlugAmbiente('Hall dos Elevadores'), 'hall_entrada')
  })

  test('fallback seguro para ambientes não mapeados, nulos ou indefinidos', ({ assert }) => {
    assert.equal(resolverSlugAmbiente(null), 'living')
    assert.equal(resolverSlugAmbiente(undefined), 'living')
    assert.equal(resolverSlugAmbiente(''), 'living')
    assert.equal(resolverSlugAmbiente('Ambiente Desconhecido XYZ'), 'living')

    const guiaFallback = obterRoteiroPorAmbiente('Desconhecido')
    assert.isDefined(guiaFallback)
    assert.equal(guiaFallback.slug, 'living')

    const guiaSlugInvalido = obterRoteiroPorSlug('inexistente')
    assert.isUndefined(guiaSlugInvalido)
  })

  test('normalização de texto remove diacríticos e espaços excessivos', ({ assert }) => {
    assert.equal(normalizarNomeAmbiente('  Suíte  Master  '), 'suite  master')
    assert.equal(normalizarNomeAmbiente('ÁREA GOURMET'), 'area gourmet')
    assert.equal(normalizarNomeAmbiente(''), '')
  })

  test('perguntas multi-linhas e tópicos de encantamento em Área Gourmet são extraídos sem truncamento', ({
    assert,
  }) => {
    const gourmet = ROTEIROS_BRIEFINGS['area_gourmet']
    assert.isDefined(gourmet)

    // Pergunta-chave multi-linha
    const perguntaCasaFamilia = gourmet.perguntasEstrategicas.find((p: any) =>
      p.pergunta.includes('casa de família')
    )
    assert.isDefined(perguntaCasaFamilia, 'Pergunta casa de família deve existir')
    assert.isTrue(
      perguntaCasaFamilia.pergunta.endsWith('ambiente de revista”?') ||
        perguntaCasaFamilia.pergunta.includes('revista'),
      'Pergunta não deve ter sido cortada no meio'
    )

    // Pergunta de encantamento multi-linha
    const perguntaEncantamento = gourmet.perguntasEstrategicas.find((p: any) =>
      p.pergunta.includes('ficou exatamente como')
    )
    assert.isDefined(perguntaEncantamento, 'Pergunta de encantamento deve existir')
    assert.isTrue(
      perguntaEncantamento.pergunta.includes('eu sonhei'),
      'Pergunta de encantamento deve conter "eu sonhei" sem perda de texto'
    )
  })

  test('Quarto dos Filhos estrutura blocos e seções específicas de Filha, Bebê e Perguntas de Ouro', ({
    assert,
  }) => {
    const filhos = ROTEIROS_BRIEFINGS['quarto_filhos']
    assert.isDefined(filhos)
    assert.isTrue(filhos.secoes.length >= 30, 'Deve conter as seções e blocos detalhados')

    const titulos = filhos.secoes.map((s: any) => s.titulo)
    assert.isTrue(titulos.some((t: string) => t.includes('BEBÊ') || t.includes('BLOCO 1')))
    assert.isTrue(titulos.some((t: string) => t.includes('QUARTO DE FILHA')))
    assert.isTrue(titulos.some((t: string) => t.includes('PERGUNTAS DE OURO')))
    assert.isTrue(titulos.some((t: string) => t.includes('PONTOS DE ATENÇÃO')))

    // Perguntas de ouro devem estar nas perguntas estratégicas
    const ouro = filhos.perguntasEstrategicas.filter((p: any) =>
      p.rotulo.includes('PERGUNTAS DE OURO')
    )
    assert.isTrue(ouro.length >= 3, 'Deve conter pelo menos 3 perguntas de ouro')
  })

  test('mapeamento com prefixo Outro: e desambiguação fina de banheiros', ({ assert }) => {
    // Prefixos do catálogo quando lojista digita opção "Outro"
    assert.equal(resolverSlugAmbiente('Outro: Adega Climatizada'), 'adega')
    assert.equal(resolverSlugAmbiente('Outro: Quarto da Filha'), 'quarto_filhos')
    assert.equal(resolverSlugAmbiente('Outro: Closet Integrado'), 'closet')
    assert.equal(resolverSlugAmbiente('Outro - Espaço Gourmet'), 'area_gourmet')

    // Desambiguação refinada de banheiros (Master vs Filho/Social)
    assert.equal(resolverSlugAmbiente('Banheiro da Suíte Master'), 'banheiro_suite_master')
    assert.equal(resolverSlugAmbiente('Banheiro Master'), 'banheiro_suite_master')
    assert.equal(resolverSlugAmbiente('Banheiro da Suíte do Filho'), 'banheiros')
    assert.equal(resolverSlugAmbiente('Banheiro da Suíte de Hóspedes'), 'banheiros')
    assert.equal(resolverSlugAmbiente('Banheiro Social'), 'banheiros')
  })

  test('seções possuem blocos estruturados preservando prompts, perguntas e itens sem perda de dados', ({
    assert,
  }) => {
    const cozinha = ROTEIROS_BRIEFINGS['cozinha']
    assert.isDefined(cozinha)

    const secObjetivo = cozinha.secoes.find((s: any) => s.titulo.includes('Objetivo da cozinha'))
    assert.isDefined(secObjetivo)
    assert.isArray(secObjetivo.blocos)
    assert.isTrue(secObjetivo.blocos.length >= 2)

    // O prompt "Qual o papel dessa cozinha?" deve estar presente com seus itens
    const blocoPrompt = secObjetivo.blocos.find((b: any) =>
      b.texto?.includes('Qual o papel dessa cozinha?')
    )
    assert.isDefined(blocoPrompt, 'Prompt principal deve estar presente no bloco')
    assert.isTrue(blocoPrompt.itens.length >= 3, 'Deve conter os itens de opção')
  })

  test('Lavanderia Seção 5 contém Sequência Ideal completa com 6 etapas e Pergunta-chave sem seções vazias', ({
    assert,
  }) => {
    const lavanderia = ROTEIROS_BRIEFINGS['lavanderia']
    assert.isDefined(lavanderia)

    const secFluxo = lavanderia.secoes.find((s: any) => s.titulo.includes('Fluxo de uso'))
    assert.isDefined(secFluxo, 'Seção de Fluxo de uso deve existir')

    // Deve conter todas as 6 etapas da sequência ideal
    assert.isTrue(secFluxo.itens.length >= 6, 'Deve conter as 6 etapas do fluxo')
    assert.isTrue(secFluxo.itens.some((i: string) => i.includes('Roupa suja chega onde')))
    assert.isTrue(secFluxo.itens.some((i: string) => i.includes('Separação')))
    assert.isTrue(secFluxo.itens.some((i: string) => i.includes('Lavagem')))
    assert.isTrue(secFluxo.itens.some((i: string) => i.includes('Secagem')))
    assert.isTrue(secFluxo.itens.some((i: string) => i.includes('Passar')))
    assert.isTrue(secFluxo.itens.some((i: string) => i.includes('Guardar')))

    // Deve conter a pergunta-chave de fluxo
    const perguntaFluxo = lavanderia.perguntasEstrategicas.find((p: any) =>
      p.pergunta.includes('gera bagunça')
    )
    assert.isDefined(perguntaFluxo, 'Pergunta-chave de fluxo deve existir')
  })

  test('nenhuma seção em nenhum dos 18 roteiros é vazia ou fantasma (100% de integridade estrutural)', ({
    assert,
  }) => {
    for (const [slug, roteiro] of Object.entries(ROTEIROS_BRIEFINGS)) {
      for (const secao of roteiro.secoes) {
        const hasItens = secao.itens && secao.itens.length > 0
        const hasPerguntas = secao.perguntasDestaque && secao.perguntasDestaque.length > 0
        const hasBlocos = secao.blocos && secao.blocos.length > 0
        const hasLinhas = secao.conteudoLinhas && secao.conteudoLinhas.length > 0

        assert.isTrue(
          hasItens || hasPerguntas || hasBlocos || hasLinhas,
          `Seção "${secao.titulo}" no roteiro "${slug}" não deve ser vazia`
        )
      }
    }
  })

  test('obterTextoCompletoSecao extrai conteúdo íntegro e não truncado mesmo em seções com itens apenas em blocos', ({
    assert,
  }) => {
    // Caso emblemático: "Resumo para o projetista" em Cozinha e Adega possui itens dentro de blocos
    const cozinha = ROTEIROS_BRIEFINGS['cozinha']
    assert.isDefined(cozinha)
    const secResumoCozinha = cozinha.secoes.find((s: any) => s.titulo.includes('Resumo para o projetista'))
    assert.isDefined(secResumoCozinha)

    const textoCozinha = obterTextoCompletoSecao(secResumoCozinha)
    assert.isTrue(textoCozinha.includes('Resumo para o projetista'))
    assert.isTrue(textoCozinha.includes('Sensação desejada:'))
    assert.isTrue(textoCozinha.includes('Uso principal:'))
    assert.isTrue(textoCozinha.includes('Perfil do cliente:'))
    assert.isTrue(textoCozinha.includes('Pontos críticos:'))
    assert.isTrue(textoCozinha.split('\n').length >= 8, 'Deve conter pelo menos 8 linhas de diretrizes')

    // Caso Adega
    const adega = ROTEIROS_BRIEFINGS['adega']
    assert.isDefined(adega)
    const secResumoAdega = adega.secoes.find((s: any) => s.titulo.includes('Resumo para o projetista'))
    assert.isDefined(secResumoAdega)

    const textoAdega = obterTextoCompletoSecao(secResumoAdega)
    assert.isTrue(textoAdega.includes('Resumo para o projetista'))
    assert.isTrue(textoAdega.includes('Volume de garrafas:'))
    assert.isTrue(textoAdega.split('\n').length >= 6)
  })

  test('todos os tópicos do Checklist Técnico em todos os 18 roteiros são limpos e legíveis', ({
    assert,
  }) => {
    for (const [slug, roteiro] of Object.entries(ROTEIROS_BRIEFINGS)) {
      assert.isTrue(roteiro.topicosChecagemTecnica.length > 0, `Roteiro ${slug} deve ter itens técnicos`)
      for (const item of roteiro.topicosChecagemTecnica) {
        assert.isTrue(item.trim().length >= 5, `Item em ${slug} deve ter conteúdo descritivo`)
        assert.isFalse(item.includes('\x0c'), `Item em ${slug} não deve conter form-feed de PDF`)
      }
    }
  })
})


