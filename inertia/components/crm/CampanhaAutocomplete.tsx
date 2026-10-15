import { useMemo, useState } from 'react'
import { toast } from 'sonner'
import BuscaAutocomplete from '../ui/BuscaAutocomplete'
import { getXsrfToken } from '../../lib/http'

export type CampanhaOpcao = { id: number; nome: string }

interface CampanhaAutocompleteProps {
  /** Campanhas ativas do catálogo (Configurações → Campanhas) */
  campanhas: CampanhaOpcao[]
  /** Nome da campanha selecionada ('' = nenhuma); o lead grava o nome, não o id */
  value: string
  onChange: (nome: string) => void
  /** Diretoria e Gerência Comercial podem cadastrar campanha direto daqui */
  podeCadastrar: boolean
}

export default function CampanhaAutocomplete({
  campanhas,
  value,
  onChange,
  podeCadastrar,
}: CampanhaAutocompleteProps) {
  // Campanhas criadas aqui ficam na lista mesmo se o catálogo for recarregado antes de incluí-las
  const [criadas, setCriadas] = useState<CampanhaOpcao[]>([])
  const [salvando, setSalvando] = useState(false)

  const lista = useMemo(() => {
    const ids = new Set(campanhas.map((c) => c.id))
    return [...campanhas, ...criadas.filter((c) => !ids.has(c.id))].sort((a, b) =>
      a.nome.localeCompare(b.nome)
    )
  }, [campanhas, criadas])

  const cadastrar = async (nome: string) => {
    if (salvando) return
    if (nome.length < 2) {
      toast.error('O nome da campanha deve ter no mínimo 2 caracteres.')
      return
    }

    setSalvando(true)
    try {
      const response = await fetch('/configuracoes/campanhas', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'X-XSRF-TOKEN': getXsrfToken(),
        },
        body: JSON.stringify({ nome }),
      })

      if (!response.ok) {
        const erro = await response.json().catch(() => null)
        toast.error(erro?.errors?.[0]?.message || erro?.message || 'Erro ao cadastrar campanha.')
        return
      }

      const nova = await response.json()
      setCriadas((prev) => [...prev, { id: nova.id, nome: nova.nome }])
      onChange(nova.nome)
      // Avisa as outras abas abertas (mesmo sinal usado pela tela de Configurações)
      localStorage.setItem('plannit_catalogo_updated', String(Date.now()))
      toast.success(`Campanha "${nova.nome}" cadastrada e selecionada.`)
    } catch {
      toast.error('Falha na comunicação com o servidor.')
    } finally {
      setSalvando(false)
    }
  }

  return (
    <BuscaAutocomplete
      opcoes={lista.map((c) => ({ value: c.nome, label: c.nome }))}
      value={value}
      onChange={onChange}
      placeholder="Digite o nome da campanha..."
      tituloLimpar="Remover campanha"
      textoVazio={(busca) => {
        if (!busca) return 'Nenhuma campanha ativa cadastrada.'
        return podeCadastrar
          ? `Nenhuma campanha encontrada para "${busca}".`
          : `Nenhuma campanha encontrada para "${busca}". Peça a um gestor para cadastrá-la.`
      }}
      acaoCriar={
        podeCadastrar
          ? {
              rotulo: (busca) => `Cadastrar "${busca}" como nova campanha`,
              onCriar: cadastrar,
              exigeTexto: true,
            }
          : undefined
      }
    />
  )
}
