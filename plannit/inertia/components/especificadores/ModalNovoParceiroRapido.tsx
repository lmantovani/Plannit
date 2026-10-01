import React, { useState } from 'react'
import { UserCheck, AlertCircle, X, Loader2, Save } from 'lucide-react'
import { toast } from 'sonner'
import { getXsrfToken } from '../../lib/http'

export interface EspecificadorItem {
  id: number
  nome: string
  tipo: string
  email?: string | null
  telefone?: string | null
  escritorio?: string | null
  cauOuCrea?: string | null
  cidade?: string | null
  uf?: string | null
  nivelParceria?: string | null
}

export interface ConsultorItem {
  id: number
  nome: string
  email?: string | null
}

interface ModalNovoParceiroRapidoProps {
  open: boolean
  onClose: () => void
  onSuccess: (novoArquiteto: EspecificadorItem) => void
  consultores?: ConsultorItem[]
  subtitulo?: string
  /** Nome que já vem preenchido ao abrir (ex.: o texto digitado na busca de especificador) */
  nomeInicial?: string
}

const ModalNovoParceiroRapido: React.FC<ModalNovoParceiroRapidoProps> = ({
  open,
  onClose,
  onSuccess,
  consultores = [],
  subtitulo = 'Adicione o arquiteto/designer sem recarregar e sem perder o rascunho do briefing.',
  nomeInicial = '',
}) => {
  const [nome, setNome] = useState('')

  // Ao abrir, preenche o nome com o texto que veio da busca (ajuste de estado na mudança de prop, sem effect)
  const [estavaAberto, setEstavaAberto] = useState(open)
  if (open !== estavaAberto) {
    setEstavaAberto(open)
    if (open) setNome(nomeInicial)
  }

  const [tipo, setTipo] = useState('arquiteto')
  const [escritorio, setEscritorio] = useState('')
  const [email, setEmail] = useState('')
  const [telefone, setTelefone] = useState('')
  const [cauOuCrea, setCauOuCrea] = useState('')
  const [consultorId, setConsultorId] = useState<number | ''>('')
  const [salvando, setSalvando] = useState(false)
  const [erroMsg, setErroMsg] = useState<string | null>(null)

  if (!open) return null

  const resetForm = () => {
    setNome('')
    setTipo('arquiteto')
    setEscritorio('')
    setEmail('')
    setTelefone('')
    setCauOuCrea('')
    setConsultorId('')
    setErroMsg(null)
  }

  const handleClose = () => {
    resetForm()
    onClose()
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    e.stopPropagation()

    if (!nome.trim() || nome.trim().length < 2) {
      setErroMsg('O nome do parceiro é obrigatório (mínimo 2 caracteres).')
      return
    }

    setSalvando(true)
    setErroMsg(null)

    try {
      const payload: Record<string, any> = {
        nome: nome.trim(),
        tipo,
        statusCarteira: 'ativo',
      }

      if (escritorio.trim()) payload.escritorio = escritorio.trim()
      if (telefone.trim()) payload.telefone = telefone.trim()
      if (email.trim()) payload.email = email.trim()
      if (cauOuCrea.trim()) payload.especialidade = `Registro: ${cauOuCrea.trim()}`
      if (consultorId) payload.consultorId = Number(consultorId)

      const response = await fetch('/especificadores?format=json', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'X-XSRF-TOKEN': getXsrfToken(),
        },
        body: JSON.stringify(payload),
      })

      if (!response.ok) {
        let erroTexto = 'Erro ao cadastrar parceiro.'
        try {
          const errData = await response.json()
          if (errData.errors && Array.isArray(errData.errors) && errData.errors[0]?.message) {
            erroTexto = errData.errors[0].message
          } else if (errData.message) {
            erroTexto = errData.message
          }
        } catch (_) {}
        setErroMsg(erroTexto)
        setSalvando(false)
        return
      }

      const data = await response.json()
      const novoArquiteto: EspecificadorItem = {
        id: data.id,
        nome: data.nome,
        tipo: data.tipo || tipo,
        escritorio: data.escritorio || escritorio.trim() || null,
        email: data.email || email.trim() || null,
        telefone: data.telefone || telefone.trim() || null,
        cauOuCrea: cauOuCrea.trim() || null,
      }

      toast.success(`Parceiro "${novoArquiteto.nome}" cadastrado e vinculado com sucesso!`)
      onSuccess(novoArquiteto)
      resetForm()
      onClose()
    } catch (err: any) {
      setErroMsg(err?.message || 'Falha na comunicação com o servidor.')
    } finally {
      setSalvando(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/60 backdrop-blur-sm animate-fade-in">
      <div
        className="bg-white rounded-2xl shadow-2xl border border-stone-200 w-full max-w-lg overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-stone-100 bg-stone-50/50">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-primary-100 text-primary-700 flex items-center justify-center">
              <UserCheck className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-semibold text-stone-900 text-sm">Cadastro Rápido de Parceiro</h3>
              <p className="text-[11px] text-stone-500">{subtitulo}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleClose}
            className="text-stone-400 hover:text-stone-600 p-1 rounded-lg hover:bg-stone-100 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {erroMsg && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl flex items-start gap-2 text-xs text-rose-700">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{erroMsg}</span>
            </div>
          )}

          <div className="space-y-3">
            <div>
              <label className="block text-xs font-medium text-stone-700 mb-1">
                Nome Completo <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                placeholder="Ex: Arq. Mariana Albuquerque"
                value={nome}
                onChange={(e) => setNome(e.target.value)}
                className="w-full text-xs border border-stone-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary-500"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-stone-700 mb-1">
                  Tipo de Parceiro
                </label>
                <select
                  value={tipo}
                  onChange={(e) => setTipo(e.target.value)}
                  className="w-full text-xs border border-stone-300 rounded-lg px-3 py-2 bg-white focus:ring-2 focus:ring-primary-500"
                >
                  <option value="arquiteto">Arquiteto(a)</option>
                  <option value="designer_interiores">Designer de Interiores</option>
                  <option value="decorador">Decorador(a)</option>
                  <option value="engenheiro">Engenheiro(a)</option>
                  <option value="corretor">Corretor(a)</option>
                  <option value="outro">Outro</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-stone-700 mb-1">
                  Escritório / Studio
                </label>
                <input
                  type="text"
                  placeholder="Ex: Albuquerque & Associados"
                  value={escritorio}
                  onChange={(e) => setEscritorio(e.target.value)}
                  className="w-full text-xs border border-stone-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-stone-700 mb-1">E-mail</label>
                <input
                  type="email"
                  placeholder="mariana@studio.com.br"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full text-xs border border-stone-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-stone-700 mb-1">
                  Telefone / WhatsApp
                </label>
                <input
                  type="text"
                  placeholder="(11) 98765-4321"
                  value={telefone}
                  onChange={(e) => setTelefone(e.target.value)}
                  className="w-full text-xs border border-stone-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-stone-700 mb-1">
                CAU / CREA / Registro Profissional
              </label>
              <input
                type="text"
                placeholder="Ex: CAU A12345-6"
                value={cauOuCrea}
                onChange={(e) => setCauOuCrea(e.target.value)}
                className="w-full text-xs border border-stone-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary-500"
              />
            </div>

            {consultores && consultores.length > 0 && (
              <div>
                <label className="block text-xs font-medium text-stone-700 mb-1">
                  Consultor Responsável
                </label>
                <select
                  value={consultorId}
                  onChange={(e) => setConsultorId(e.target.value ? Number(e.target.value) : '')}
                  className="w-full text-xs border border-stone-300 rounded-lg px-3 py-2 bg-white focus:ring-2 focus:ring-primary-500"
                >
                  <option value="">Automático (atribuir ao meu usuário)</option>
                  {consultores.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.nome}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-stone-100">
            <button
              type="button"
              onClick={handleClose}
              disabled={salvando}
              className="px-3.5 py-2 text-xs font-semibold text-stone-600 hover:text-stone-800 hover:bg-stone-100 rounded-xl transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={salvando}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-primary-600 hover:bg-primary-700 rounded-xl transition-colors shadow-sm disabled:opacity-50"
            >
              {salvando ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  Salvando...
                </>
              ) : (
                <>
                  <Save className="w-3.5 h-3.5" />
                  Cadastrar e Vincular
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default ModalNovoParceiroRapido
