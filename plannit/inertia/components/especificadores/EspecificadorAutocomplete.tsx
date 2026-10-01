import React, { useEffect, useId, useMemo, useRef, useState } from 'react'
import { Search, X, Plus } from 'lucide-react'
import clsx from 'clsx'

export type EspecificadorOpcao = {
  id: number
  nome: string
  escritorio: string | null
}

interface EspecificadorAutocompleteProps {
  especificadores: EspecificadorOpcao[]
  /** Id do especificador selecionado como string ('' = nenhum), no formato usado pelo useForm */
  value: string
  onChange: (id: string) => void
  /** Chamado com o texto digitado quando o especificador não existe e o usuário quer cadastrá-lo */
  onCadastrarNovo: (nomeDigitado: string) => void
  placeholder?: string
  maxSugestoes?: number
}

// Busca sem diferenciar maiúsculas nem acentos ("Jose" encontra "José")
const normalizar = (texto: string) =>
  texto.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().trim()

const rotulo = (e: EspecificadorOpcao) => (e.escritorio ? `${e.nome} (${e.escritorio})` : e.nome)

export default function EspecificadorAutocomplete({
  especificadores,
  value,
  onChange,
  onCadastrarNovo,
  placeholder = 'Digite o nome ou o escritório...',
  maxSugestoes = 8,
}: EspecificadorAutocompleteProps) {
  const listaId = useId()
  const containerRef = useRef<HTMLDivElement>(null)
  const [busca, setBusca] = useState('')
  const [aberto, setAberto] = useState(false)
  const [destaque, setDestaque] = useState(0)

  const selecionado = especificadores.find((e) => String(e.id) === value) || null

  const encontrados = useMemo(() => {
    const termo = normalizar(busca)
    if (!termo) return especificadores
    return especificadores
      .filter(
        (e) => normalizar(e.nome).includes(termo) || normalizar(e.escritorio || '').includes(termo)
      )
      .sort(
        (a, b) =>
          Number(normalizar(b.nome).startsWith(termo)) -
          Number(normalizar(a.nome).startsWith(termo))
      )
  }, [busca, especificadores])

  const sugestoes = encontrados.slice(0, maxSugestoes)
  // A última posição da lista é sempre a ação de cadastrar
  const totalItens = sugestoes.length + 1

  useEffect(() => {
    if (!aberto) return
    const fecharAoClicarFora = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setAberto(false)
        setBusca('')
      }
    }
    document.addEventListener('mousedown', fecharAoClicarFora)
    return () => document.removeEventListener('mousedown', fecharAoClicarFora)
  }, [aberto])

  const abrir = () => {
    setAberto(true)
    setDestaque(0)
  }

  const selecionar = (e: EspecificadorOpcao) => {
    onChange(String(e.id))
    setAberto(false)
    setBusca('')
  }

  const cadastrarNovo = () => {
    onCadastrarNovo(busca.trim())
    setAberto(false)
    setBusca('')
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      if (!aberto) return abrir()
      setDestaque((d) => (d + 1) % totalItens)
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setDestaque((d) => (d - 1 + totalItens) % totalItens)
    } else if (e.key === 'Enter' && aberto) {
      // Impede que o Enter envie o formulário do lead
      e.preventDefault()
      if (destaque < sugestoes.length) selecionar(sugestoes[destaque])
      else cadastrarNovo()
    } else if (e.key === 'Escape' && aberto) {
      e.preventDefault()
      setAberto(false)
      setBusca('')
    }
  }

  return (
    <div ref={containerRef}>
      <div className="relative">
        <Search
          size={13}
          className="absolute left-2.5 top-1/2 -translate-y-1/2 text-stone-400 pointer-events-none"
        />
        <input
          type="text"
          role="combobox"
          aria-expanded={aberto}
          aria-controls={listaId}
          aria-autocomplete="list"
          aria-activedescendant={aberto ? `${listaId}-${destaque}` : undefined}
          value={aberto ? busca : selecionado ? rotulo(selecionado) : ''}
          onFocus={abrir}
          onClick={() => !aberto && abrir()}
          onChange={(e) => {
            setBusca(e.target.value)
            setDestaque(0)
            if (!aberto) setAberto(true)
          }}
          onKeyDown={handleKeyDown}
          placeholder={selecionado && aberto ? rotulo(selecionado) : placeholder}
          className="input text-xs pl-8 pr-8"
        />
        {selecionado && !aberto && (
          <button
            type="button"
            onClick={() => onChange('')}
            className="absolute right-2 top-1/2 -translate-y-1/2 p-0.5 text-stone-400 hover:text-stone-700"
            title="Remover especificador"
          >
            <X size={13} />
          </button>
        )}
      </div>

      {aberto && (
        <ul
          id={listaId}
          role="listbox"
          className="mt-1 max-h-52 overflow-y-auto rounded-lg border border-stone-200 bg-white shadow-sm divide-y divide-stone-100 animate-fade-in"
        >
          {sugestoes.map((e, i) => (
            <li
              key={e.id}
              id={`${listaId}-${i}`}
              role="option"
              aria-selected={String(e.id) === value}
              onMouseDown={(ev) => ev.preventDefault()}
              onMouseEnter={() => setDestaque(i)}
              onClick={() => selecionar(e)}
              className={clsx(
                'px-3 py-2 text-xs cursor-pointer',
                destaque === i ? 'bg-primary-50' : 'bg-white'
              )}
            >
              <p
                className={clsx(
                  'font-medium',
                  String(e.id) === value ? 'text-primary-800' : 'text-stone-800'
                )}
              >
                {e.nome}
              </p>
              {e.escritorio && (
                <p className="text-[11px] text-stone-500 truncate">{e.escritorio}</p>
              )}
            </li>
          ))}

          {sugestoes.length === 0 && (
            <li className="px-3 py-2 text-[11px] text-stone-500">
              {busca.trim()
                ? `Nenhum especificador encontrado para "${busca.trim()}".`
                : 'Nenhum especificador cadastrado ainda.'}
            </li>
          )}

          {encontrados.length > sugestoes.length && (
            <li className="px-3 py-1.5 text-[10px] text-stone-400">
              Mostrando {sugestoes.length} de {encontrados.length} — continue digitando para
              refinar.
            </li>
          )}

          <li
            id={`${listaId}-${sugestoes.length}`}
            role="option"
            aria-selected={false}
            onMouseDown={(ev) => ev.preventDefault()}
            onMouseEnter={() => setDestaque(sugestoes.length)}
            onClick={cadastrarNovo}
            className={clsx(
              'px-3 py-2 text-xs font-semibold text-primary-700 cursor-pointer flex items-center gap-1.5',
              destaque === sugestoes.length ? 'bg-primary-50' : 'bg-white'
            )}
          >
            <Plus size={12} />
            <span>
              {busca.trim()
                ? `Cadastrar "${busca.trim()}" como novo especificador`
                : 'Cadastrar novo especificador'}
            </span>
          </li>
        </ul>
      )}
    </div>
  )
}
