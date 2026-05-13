import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Eye, EyeOff, Loader2 } from 'lucide-react'
import { useAuthStore } from '../../store'
import { authApi } from '../../lib/api'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPass, setShowPass] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const { login } = useAuthStore()
  const navigate = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const { data } = await authApi.login(email, password)
      login(data.access_token, { id: data.user_id, nome: data.nome, perfil: data.perfil })
      navigate('/dashboard')
    } catch (err) {
      setError(err.response?.data?.detail || 'E-mail ou senha incorretos')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-stone-900 flex">
      {/* Painel esquerdo — branding */}
      <div className="hidden lg:flex flex-col justify-between w-96 bg-stone-800 p-12 border-r border-stone-700/50">
        <div>
          <div className="flex flex-col mb-12">
            <span className="font-display text-white font-semibold text-3xl">Líder</span>
            <span className="text-primary-400 text-sm font-medium tracking-[0.2em] uppercase mt-1">Móveis Planejados</span>
          </div>
          <p className="text-stone-400 text-sm leading-relaxed">
            Plataforma de gestão operacional completa.<br />
            Do lead ao pós-venda — com rastreabilidade total.
          </p>
        </div>

        <div className="space-y-4">
          {[
            { num: '32', label: 'Etapas do fluxo operacional' },
            { num: '14', label: 'Perfis de acesso configurados' },
            { num: '0',  label: 'Informações perdidas no WhatsApp' },
          ].map(({ num, label }) => (
            <div key={label} className="flex items-baseline gap-3">
              <span className="font-display text-2xl font-semibold text-primary-400">{num}</span>
              <span className="text-stone-500 text-sm">{label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Painel direito — formulário */}
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-sm animate-fade-in">
          <div className="mb-8">
            <h1 className="font-display text-white text-2xl font-semibold mb-1">Bem-vindo</h1>
            <p className="text-stone-400 text-sm">Acesse sua conta para continuar</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-stone-400 mb-1.5 uppercase tracking-wide">E-mail</label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
                autoFocus
                className="w-full px-4 py-3 rounded-xl bg-stone-800 border border-stone-700 text-white placeholder:text-stone-500 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors"
                placeholder="seu@email.com"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-stone-400 mb-1.5 uppercase tracking-wide">Senha</label>
              <div className="relative">
                <input
                  type={showPass ? 'text' : 'password'}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  required
                  className="w-full px-4 py-3 rounded-xl bg-stone-800 border border-stone-700 text-white placeholder:text-stone-500 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors pr-10"
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPass(!showPass)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-500 hover:text-stone-300"
                >
                  {showPass ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
            </div>

            {error && (
              <div className="px-4 py-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 px-4 bg-primary-600 hover:bg-primary-700 text-white font-medium text-sm rounded-xl transition-colors disabled:opacity-60 flex items-center justify-center gap-2 mt-2"
            >
              {loading ? <Loader2 size={16} className="animate-spin" /> : null}
              {loading ? 'Entrando...' : 'Entrar'}
            </button>
          </form>

          <p className="text-stone-600 text-xs text-center mt-8">
            Líder Móveis Planejados · Sistema Operacional v1.0
          </p>
        </div>
      </div>
    </div>
  )
}
