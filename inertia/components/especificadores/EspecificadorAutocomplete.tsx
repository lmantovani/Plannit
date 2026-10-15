import BuscaAutocomplete from '../ui/BuscaAutocomplete'

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

export default function EspecificadorAutocomplete({
  especificadores,
  value,
  onChange,
  onCadastrarNovo,
  placeholder = 'Digite o nome ou o escritório...',
  maxSugestoes,
}: EspecificadorAutocompleteProps) {
  return (
    <BuscaAutocomplete
      opcoes={especificadores.map((e) => ({
        value: String(e.id),
        label: e.nome,
        descricao: e.escritorio,
      }))}
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      maxSugestoes={maxSugestoes}
      tituloLimpar="Remover especificador"
      textoVazio={(busca) =>
        busca
          ? `Nenhum especificador encontrado para "${busca}".`
          : 'Nenhum especificador cadastrado ainda.'
      }
      acaoCriar={{
        rotulo: (busca) =>
          busca ? `Cadastrar "${busca}" como novo especificador` : 'Cadastrar novo especificador',
        onCriar: onCadastrarNovo,
      }}
    />
  )
}
