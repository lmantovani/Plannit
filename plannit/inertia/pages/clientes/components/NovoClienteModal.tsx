import React, { useState } from 'react'
import { router } from '@inertiajs/react'
import { X, UserPlus, Building, User, MapPin } from 'lucide-react'

interface NovoClienteModalProps {
  isOpen: boolean
  onClose: () => void
  arquitetos: Array<{ id: number; nome: string; escritorio: string | null }>
}

export default function NovoClienteModal({ isOpen, onClose, arquitetos }: NovoClienteModalProps) {
  const [tipo, setTipo] = useState<'pessoa_fisica' | 'pessoa_juridica'>('pessoa_fisica')
  const [nome, setNome] = useState('')
  const [cpfCnpj, setCpfCnpj] = useState('')
  const [telefone, setTelefone] = useState('')
  const [email, setEmail] = useState('')
  const [profissaoRamo, setProfissaoRamo] = useState('')
  const [arquitetoId, setArquitetoId] = useState('')

  // Endereço principal inicial
  const [incluirEndereco, setIncluirEndereco] = useState(true)
  const [tipoEndereco, setTipoEndereco] = useState('montagem')
  const [cep, setCep] = useState('')
  const [logradouro, setLogradouro] = useState('')
  const [numero, setNumero] = useState('')
  const [complemento, setComplemento] = useState('')
  const [bairro, setBairro] = useState('')
  const [cidade, setCidade] = useState('São Paulo')
  const [estado, setEstado] = useState('SP')


  const [loading, setLoading] = useState(false)

  if (!isOpen) return null

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    const payload: any = {
      tipo,
      nome,
      cpfCnpj: cpfCnpj || undefined,
      telefone,
      email: email || undefined,
      profissaoRamo: profissaoRamo || undefined,
      arquitetoId: arquitetoId ? Number(arquitetoId) : undefined,
    }

    if (incluirEndereco && logradouro && numero && cidade) {
      payload.endereco = {
        tipo: tipoEndereco,
        identificacao: 'Principal',
        cep: cep || undefined,
        logradouro,
        numero,
        complemento: complemento || undefined,
        bairro: bairro || undefined,
        cidade,
        estado,
      }
    }


    router.post('/clientes', payload, {
      onSuccess: () => {
        onClose()
      },
      onFinish: () => setLoading(false),
    })
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/60 backdrop-blur-sm animate-fade-in overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl border border-stone-200 overflow-hidden my-8">
        <div className="flex items-center justify-between px-6 py-4 border-b border-stone-100 bg-stone-50">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-primary-100 text-primary-800 flex items-center justify-center font-bold">
              <UserPlus className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-stone-900">Novo Cliente</h3>
              <p className="text-xs text-stone-500">Cadastre um cliente PF ou PJ e seu endereço principal</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-stone-400 hover:text-stone-600 p-1.5 rounded-lg hover:bg-stone-200/60 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {/* Seletor Tipo */}
          <div className="flex gap-4">
            <label
              className={`flex-1 flex items-center justify-center gap-2.5 p-3 rounded-xl border cursor-pointer transition-all ${
                tipo === 'pessoa_fisica'
                  ? 'border-primary-500 bg-primary-50/50 text-primary-900 font-medium ring-1 ring-primary-500'
                  : 'border-stone-200 hover:border-stone-300 text-stone-600'
              }`}
            >
              <input
                type="radio"
                name="tipo"
                value="pessoa_fisica"
                checked={tipo === 'pessoa_fisica'}
                onChange={() => setTipo('pessoa_fisica')}
                className="sr-only"
              />
              <User className="w-4 h-4" />
              <span>Pessoa Física (PF)</span>
            </label>

            <label
              className={`flex-1 flex items-center justify-center gap-2.5 p-3 rounded-xl border cursor-pointer transition-all ${
                tipo === 'pessoa_juridica'
                  ? 'border-primary-500 bg-primary-50/50 text-primary-900 font-medium ring-1 ring-primary-500'
                  : 'border-stone-200 hover:border-stone-300 text-stone-600'
              }`}
            >
              <input
                type="radio"
                name="tipo"
                value="pessoa_juridica"
                checked={tipo === 'pessoa_juridica'}
                onChange={() => setTipo('pessoa_juridica')}
                className="sr-only"
              />
              <Building className="w-4 h-4" />
              <span>Pessoa Jurídica (PJ)</span>
            </label>
          </div>

          {/* Dados Principais */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <label className="block text-xs font-semibold uppercase tracking-wider text-stone-700 mb-1">
                Nome Completo / Razão Social *
              </label>
              <input
                type="text"
                required
                value={nome}
                onChange={(e) => setNome(e.target.value)}
                placeholder={tipo === 'pessoa_fisica' ? 'Ex: Camila Siqueira' : 'Ex: Alfa Arquitetura Ltda'}
                className="w-full px-3.5 py-2.5 bg-stone-50 border border-stone-300 rounded-xl text-sm focus:ring-2 focus:ring-primary-500/20 focus:border-primary-600 outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-stone-700 mb-1">
                {tipo === 'pessoa_fisica' ? 'CPF' : 'CNPJ'}
              </label>
              <input
                type="text"
                value={cpfCnpj}
                onChange={(e) => setCpfCnpj(e.target.value)}
                placeholder={tipo === 'pessoa_fisica' ? '000.000.000-00' : '00.000.000/0000-00'}
                className="w-full px-3.5 py-2.5 bg-stone-50 border border-stone-300 rounded-xl text-sm focus:ring-2 focus:ring-primary-500/20 focus:border-primary-600 outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-stone-700 mb-1">
                Telefone / WhatsApp *
              </label>
              <input
                type="text"
                required
                value={telefone}
                onChange={(e) => setTelefone(e.target.value)}
                placeholder="(11) 98765-4321"
                className="w-full px-3.5 py-2.5 bg-stone-50 border border-stone-300 rounded-xl text-sm focus:ring-2 focus:ring-primary-500/20 focus:border-primary-600 outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-stone-700 mb-1">
                E-mail
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="cliente@exemplo.com.br"
                className="w-full px-3.5 py-2.5 bg-stone-50 border border-stone-300 rounded-xl text-sm focus:ring-2 focus:ring-primary-500/20 focus:border-primary-600 outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-stone-700 mb-1">
                {tipo === 'pessoa_fisica' ? 'Profissão' : 'Ramo de Atuação'}
              </label>
              <input
                type="text"
                value={profissaoRamo}
                onChange={(e) => setProfissaoRamo(e.target.value)}
                placeholder={tipo === 'pessoa_fisica' ? 'Ex: Médica, Advogado' : 'Ex: Advocacia, Tecnologia'}
                className="w-full px-3.5 py-2.5 bg-stone-50 border border-stone-300 rounded-xl text-sm focus:ring-2 focus:ring-primary-500/20 focus:border-primary-600 outline-none"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-xs font-semibold uppercase tracking-wider text-stone-700 mb-1">
                Especificador Parceiro (Opcional)
              </label>
              <select
                value={arquitetoId}
                onChange={(e) => setArquitetoId(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-stone-50 border border-stone-300 rounded-xl text-sm focus:ring-2 focus:ring-primary-500/20 focus:border-primary-600 outline-none"
              >
                <option value="">Nenhum especificador vinculado</option>
                {arquitetos.map((arq) => (
                  <option key={arq.id} value={arq.id}>
                    {arq.nome} {arq.escritorio ? `(${arq.escritorio})` : ''}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Endereço Principal Opcional */}
          <div className="pt-2 border-t border-stone-200">
            <div className="flex items-center justify-between mb-3">
              <span className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-stone-800">
                <MapPin className="w-4 h-4 text-primary-600" />
                Endereço Principal de Montagem / Obra
              </span>
              <label className="flex items-center gap-2 cursor-pointer text-xs text-stone-600">
                <input
                  type="checkbox"
                  checked={incluirEndereco}
                  onChange={(e) => setIncluirEndereco(e.target.checked)}
                  className="rounded border-stone-300 text-primary-600 focus:ring-primary-500"
                />
                Incluir endereço agora
              </label>
            </div>

            {incluirEndereco && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 p-4 bg-stone-50 rounded-xl border border-stone-200">
                <div>
                  <label className="block text-[11px] font-medium text-stone-600 mb-1">CEP</label>
                  <input
                    type="text"
                    value={cep}
                    onChange={(e) => setCep(e.target.value)}
                    placeholder="00000-000"
                    className="w-full px-3 py-2 bg-white border border-stone-300 rounded-lg text-xs outline-none focus:border-primary-500"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-[11px] font-medium text-stone-600 mb-1">Logradouro *</label>
                  <input
                    type="text"
                    value={logradouro}
                    onChange={(e) => setLogradouro(e.target.value)}
                    placeholder="Ex: Alameda Lorena"
                    className="w-full px-3 py-2 bg-white border border-stone-300 rounded-lg text-xs outline-none focus:border-primary-500"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-medium text-stone-600 mb-1">Número *</label>
                  <input
                    type="text"
                    value={numero}
                    onChange={(e) => setNumero(e.target.value)}
                    placeholder="Ex: 1250"
                    className="w-full px-3 py-2 bg-white border border-stone-300 rounded-lg text-xs outline-none focus:border-primary-500"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-medium text-stone-600 mb-1">Complemento</label>
                  <input
                    type="text"
                    value={complemento}
                    onChange={(e) => setComplemento(e.target.value)}
                    placeholder="Ex: Apto 142"
                    className="w-full px-3 py-2 bg-white border border-stone-300 rounded-lg text-xs outline-none focus:border-primary-500"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-medium text-stone-600 mb-1">Bairro</label>
                  <input
                    type="text"
                    value={bairro}
                    onChange={(e) => setBairro(e.target.value)}
                    placeholder="Ex: Jardins"
                    className="w-full px-3 py-2 bg-white border border-stone-300 rounded-lg text-xs outline-none focus:border-primary-500"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-medium text-stone-600 mb-1">Cidade *</label>
                  <input
                    type="text"
                    value={cidade}
                    onChange={(e) => setCidade(e.target.value)}
                    placeholder="Ex: São Paulo"
                    className="w-full px-3 py-2 bg-white border border-stone-300 rounded-lg text-xs outline-none focus:border-primary-500"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-medium text-stone-600 mb-1">Estado</label>
                  <input
                    type="text"
                    maxLength={2}
                    value={estado}
                    onChange={(e) => setEstado(e.target.value.toUpperCase())}
                    placeholder="SP"
                    className="w-full px-3 py-2 bg-white border border-stone-300 rounded-lg text-xs outline-none focus:border-primary-500"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-medium text-stone-600 mb-1">Finalidade</label>
                  <select
                    value={tipoEndereco}
                    onChange={(e) => setTipoEndereco(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-stone-300 rounded-lg text-xs outline-none focus:border-primary-500"
                  >
                    <option value="montagem">Montagem / Obra</option>
                    <option value="entrega">Entrega / Logística</option>
                    <option value="cobranca">Faturamento / Cobrança</option>
                    <option value="residencial">Residencial</option>
                    <option value="comercial">Comercial</option>
                  </select>
                </div>
              </div>
            )}
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-stone-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-stone-700 hover:bg-stone-100 rounded-xl transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-5 py-2 text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 rounded-xl transition-colors shadow-sm disabled:opacity-50"
            >
              {loading ? 'Cadastrando...' : 'Cadastrar Cliente'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
