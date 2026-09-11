import { useState } from 'react'
import { Head, useForm, usePage } from '@inertiajs/react'
import { Eye, EyeOff, Loader2, ShieldCheck, UserCheck, AlertCircle } from 'lucide-react'

const DEMO_USERS = [
  { role: 'Diretoria', email: 'admin@plannit.com.br', pass: 'Admin@123456', desc: 'Acesso total' },
  { role: 'Vendedor', email: 'vendedor@lidermoveis.com.br', pass: 'Teste@123', desc: 'Pipeline e CRM' },
  { role: 'Gerente', email: 'gerente@lidermoveis.com.br', pass: 'Teste@123', desc: 'Gestão e Metas' },
  { role: 'Projetista', email: 'projetista@lidermoveis.com.br', pass: 'Teste@123', desc: 'Fila e WIP' },
  { role: 'Conferente', email: 'conferente@lidermoveis.com.br', pass: 'Teste@123', desc: 'Técnico' },
]

export default function Login() {
  const { flash } = usePage<{ flash: { error?: string; success?: string } }>()
  const [showPass, setShowPass] = useState(false)

  const { data, setData, post, processing, errors } = useForm({
    email: '',
    password: '',
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    post('/login')
  }

  const fillDemo = (email: string, pass: string) => {
    setData({ email, password: pass })
  }

  return (
    <>
      <Head title="Login — Líder Móveis Planejados" />

      <div className="min-h-screen bg-stone-900 flex">
        {/* Painel esquerdo — branding Líder Móveis */}
        <div className="hidden lg:flex flex-col justify-between w-[420px] bg-stone-800/90 p-12 border-r border-stone-700/40 backdrop-blur">
          <div>
            <div className="flex flex-col mb-10">
              <span className="font-display text-white font-semibold text-3xl tracking-tight">Líder</span>
              <span className="text-primary-400 text-xs font-semibold tracking-[0.25em] uppercase mt-1">
                Móveis Planejados
              </span>
            </div>
            <p className="text-stone-300 text-sm leading-relaxed mb-8">
              Plataforma de gestão operacional de alto padrão.<br />
              Do primeiro contato à montagem final — com rastreabilidade total e conformidade operacional.
            </p>
            <div className="p-4 rounded-xl bg-stone-900/60 border border-stone-700/50 flex items-center gap-3">
              <ShieldCheck className="text-primary-400 shrink-0" size={24} />
              <div>
                <div className="text-xs font-semibold text-stone-200">Sessão Segura & Auditada</div>
                <div className="text-[11px] text-stone-400">Proteção CSRF nativa e cookies HTTP-Only</div>
              </div>
            </div>
          </div>

          <div className="space-y-4 pt-8 border-t border-stone-700/40">
            {[
              { num: '32', label: 'Etapas no fluxo operacional' },
              { num: '15', label: 'Perfis de acesso configurados' },
              { num: '100%', label: 'Imutabilidade de histórico' },
            ].map(({ num, label }) => (
              <div key={label} className="flex items-baseline gap-3">
                <span className="font-display text-2xl font-bold text-primary-400">{num}</span>
                <span className="text-stone-400 text-xs">{label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Painel direito — formulário de acesso */}
        <div className="flex-1 flex items-center justify-center p-6 sm:p-12">
          <div className="w-full max-w-md animate-fade-in">
            <div className="mb-8">
              <h1 className="font-display text-white text-3xl font-semibold mb-2">Acesso ao Sistema</h1>
              <p className="text-stone-400 text-sm">Insira suas credenciais para gerenciar a operação</p>
            </div>

            {flash?.error && (
              <div className="mb-6 p-4 rounded-xl bg-red-950/50 border border-red-800/60 text-red-300 text-sm flex items-center gap-3 animate-fade-in">
                <AlertCircle className="shrink-0 text-red-400" size={18} />
                <span>{flash.error}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="block text-xs font-medium text-stone-300 mb-1.5 uppercase tracking-wider">
                  E-mail Corporativo
                </label>
                <input
                  type="email"
                  name="email"
                  value={data.email}
                  onChange={(e) => setData('email', e.target.value)}
                  required
                  autoFocus
                  autoComplete="username"
                  placeholder="exemplo@lidermoveis.com.br"
                  className="w-full px-4 py-3 rounded-xl bg-stone-800/90 border border-stone-700 text-white placeholder:text-stone-500 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors"
                />
                {errors.email && (
                  <span className="text-red-400 text-xs mt-1 block">{errors.email}</span>
                )}
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-medium text-stone-300 uppercase tracking-wider">
                    Senha de Acesso
                  </label>
                </div>
                <div className="relative">
                  <input
                    type={showPass ? 'text' : 'password'}
                    name="password"
                    value={data.password}
                    onChange={(e) => setData('password', e.target.value)}
                    required
                    autoComplete="current-password"
                    placeholder="••••••••••••"
                    className="w-full px-4 py-3 rounded-xl bg-stone-800/90 border border-stone-700 text-white placeholder:text-stone-500 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors pr-11"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPass(!showPass)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-200 transition-colors"
                  >
                    {showPass ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
                {errors.password && (
                  <span className="text-red-400 text-xs mt-1 block">{errors.password}</span>
                )}
              </div>

              <button
                type="submit"
                disabled={processing}
                className="w-full py-3.5 px-4 rounded-xl font-medium text-sm text-white bg-primary-600 hover:bg-primary-500 active:scale-[0.99] transition-all duration-150 flex items-center justify-center gap-2 shadow-lg shadow-primary-950/40 disabled:opacity-60 cursor-pointer"
              >
                {processing ? (
                  <>
                    <Loader2 className="animate-spin" size={18} />
                    <span>Autenticando...</span>
                  </>
                ) : (
                  <span>Entrar na Plataforma</span>
                )}
              </button>
            </form>

            {/* Painel de Credenciais Demo Rápidas */}
            <div className="mt-8 pt-6 border-t border-stone-800">
              <div className="flex items-center gap-2 text-xs font-semibold text-stone-400 mb-3">
                <UserCheck size={14} className="text-primary-400" />
                <span>Credenciais de Teste (Clique para preencher):</span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {DEMO_USERS.map((u) => (
                  <button
                    key={u.role}
                    type="button"
                    onClick={() => fillDemo(u.email, u.pass)}
                    className="text-left p-2.5 rounded-lg bg-stone-800/50 hover:bg-stone-800 border border-stone-700/50 hover:border-primary-500/50 transition-all text-xs group cursor-pointer"
                  >
                    <div className="font-medium text-stone-200 group-hover:text-primary-300">
                      {u.role}
                    </div>
                    <div className="text-[10px] text-stone-400 truncate">{u.desc}</div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}

Login.layout = (page: React.ReactNode) => page
