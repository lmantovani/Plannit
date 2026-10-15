import React, { useEffect, useId, useMemo, useRef, useState } from 'react'
import { Search, X, Plus } from 'lucide-react'
import clsx from 'clsx'

export type OpcaoBusca = {
  /** Valor gravado no formulário (string, no formato usado pelo useForm) */
  value: string
  label: string
  /** Linha secundária exibida abaixo do label (ex.: escritório do especificador) */
  descricao?: string | null
}

export type AcaoCriarBusca = {
  rotulo: (busca: string) => string
  onCriar: (busca: string) => void
  /** Só oferece a ação quando há texto digitado (ex.: cadastro direto que precisa de um nome) */
  exigeTexto?: boolean
}

interface BuscaAutocompleteProps {
  opcoes: OpcaoBusca[]
  value: string
  onChange: (value: string) => void
  placeholder?: string
  maxSugestoes?: number
  /** Mensagem quando nenhuma opção corresponde à busca */
  textoVazio: (busca: string) => string
  tituloLimpar?: string
  /** Ação de cadastrar algo que não está na lista; omitida quando o usuário não pode cadastrar */
  acaoCriar?: AcaoCriarBusca
}

// Busca sem diferenciar maiúsculas nem acentos ("Jose" encontra "José")
const normalizar = (texto: string) =>
  texto.normalize('NFD').replace(/\p{M}/gu, '').toLowerCase().trim()

const rotulo = (o: OpcaoBusca) => (o.descricao ? `${o.label} (${o.descricao})` : o.label)

export default function BuscaAutocomplete({
  opcoes,
  value,
  onChange,
  placeholder = 'Digite para buscar...',
  maxSugestoes = 8,
  textoVazio,
  tituloLimpar = 'Limpar seleção',
  acaoCriar,
}: BuscaAutocompleteProps) {
  const listaId = useId()
  const containerRef = useRef<HTMLDivElement>(null)
  const [busca, setBusca] = useState('')
  const [aberto, setAberto] = useState(false)
  const [destaque, setDestaque] = useState(0)

  const selecionado = opcoes.find((o) => o.value === value) || null
  const termo = normalizar(busca)

  const encontrados = useMemo(() => {
    if (!termo) return opcoes
    return opcoes
      .filter(
        (o) => normalizar(o.label).includes(termo) || normalizar(o.descricao || '').includes(termo)
      )
      .sort(
        (a, b) =>
          Number(normalizar(b.label).startsWith(termo)) -
          Number(normalizar(a.label).startsWith(termo))
      )
  }, [termo, opcoes])

  const sugestoes = encontrados.slice(0, maxSugestoes)
  // Não oferece cadastrar algo que já existe com o mesmo nome
  const existeIgual = Boolean(termo) && opcoes.some((o) => normalizar(o.label) === termo)
  const mostrarCriar =
    Boolean(acaoCriar) && !existeIgual && (Boolean(termo) || !acaoCriar?.exigeTexto)
  // A ação de cadastrar, quando existe, ocupa a última posição da navegação por teclado
  const totalItens = sugestoes.length + (mostrarCriar ? 1 : 0)

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

  const fechar = () => {
    setAberto(false)
    setBusca('')
  }

  const selecionar = (o: OpcaoBusca) => {
    onChange(o.value)
    fechar()
  }

  const criar = () => {
    acaoCriar?.onCriar(busca.trim())
    fechar()
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      if (!aberto) return abrir()
      if (totalItens > 0) setDestaque((d) => (d + 1) % totalItens)
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      if (totalItens > 0) setDestaque((d) => (d - 1 + totalItens) % totalItens)
    } else if (e.key === 'Enter' && aberto) {
      // Impede que o Enter envie o formulário em que o campo está
      e.preventDefault()
      if (destaque < sugestoes.length) selecionar(sugestoes[destaque])
      else if (mostrarCriar) criar()
    } else if (e.key === 'Escape' && aberto) {
      e.preventDefault()
      fechar()
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
          aria-activedescendant={aberto && totalItens > 0 ? `${listaId}-${destaque}` : undefined}
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
            title={tituloLimpar}
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
          {sugestoes.map((o, i) => (
            <li
              key={o.value}
              id={`${listaId}-${i}`}
              role="option"
              aria-selected={o.value === value}
              onMouseDown={(ev) => ev.preventDefault()}
              onMouseEnter={() => setDestaque(i)}
              onClick={() => selecionar(o)}
              className={clsx(
                'px-3 py-2 text-xs cursor-pointer',
                destaque === i ? 'bg-primary-50' : 'bg-white'
              )}
            >
              <p
                className={clsx(
                  'font-medium',
                  o.value === value ? 'text-primary-800' : 'text-stone-800'
                )}
              >
                {o.label}
              </p>
              {o.descricao && <p className="text-[11px] text-stone-500 truncate">{o.descricao}</p>}
            </li>
          ))}

          {sugestoes.length === 0 && (
            <li className="px-3 py-2 text-[11px] text-stone-500">{textoVazio(busca.trim())}</li>
          )}

          {encontrados.length > sugestoes.length && (
            <li className="px-3 py-1.5 text-[10px] text-stone-400">
              Mostrando {sugestoes.length} de {encontrados.length} — continue digitando para
              refinar.
            </li>
          )}

          {mostrarCriar && acaoCriar && (
            <li
              id={`${listaId}-${sugestoes.length}`}
              role="option"
              aria-selected={false}
              onMouseDown={(ev) => ev.preventDefault()}
              onMouseEnter={() => setDestaque(sugestoes.length)}
              onClick={criar}
              className={clsx(
                'px-3 py-2 text-xs font-semibold text-primary-700 cursor-pointer flex items-center gap-1.5',
                destaque === sugestoes.length ? 'bg-primary-50' : 'bg-white'
              )}
            >
              <Plus size={12} />
              <span>{acaoCriar.rotulo(busca.trim())}</span>
            </li>
          )}
        </ul>
      )}
    </div>
  )
}
