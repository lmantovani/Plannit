import { create } from 'zustand'
import { persist } from 'zustand/middleware'

// === Auth Store ===
export const useAuthStore = create(
  persist(
    (set, get) => ({
      token: null,
      user: null,
      isAuthenticated: false,

      login: (token, user) => {
        localStorage.setItem('token', token)
        set({ token, user, isAuthenticated: true })
      },

      logout: () => {
        localStorage.removeItem('token')
        localStorage.removeItem('user')
        set({ token: null, user: null, isAuthenticated: false })
      },

      updateUser: (user) => set({ user }),
    }),
    {
      name: 'lider-auth',
      partialize: (state) => ({ token: state.token, user: state.user, isAuthenticated: state.isAuthenticated }),
    }
  )
)

// === UI Store ===
export const useUIStore = create((set) => ({
  sidebarOpen: true,
  toggleSidebar: () => set((s) => ({ sidebarOpen: !s.sidebarOpen })),

  notifications: [],
  addNotification: (n) => set((s) => ({
    notifications: [{ id: Date.now(), ...n }, ...s.notifications].slice(0, 50),
  })),
  markRead: (id) => set((s) => ({
    notifications: s.notifications.map((n) => n.id === id ? { ...n, lida: true } : n),
  })),
  clearAll: () => set({ notifications: [] }),
}))

// Helpers de perfil (SRS Seção 2)
export const PERFIL_LABELS = {
  diretoria: 'Diretoria',
  gerente_comercial: 'Gerente Comercial',
  vendedor: 'Vendedor',
  recepcao: 'Recepção',
  projetista: 'Projetista',
  conferente: 'Conferente Técnico',
  supervisor_montagem: 'Supervisor de Montagem',
  gestor_logistica: 'Logística',
  sac: 'SAC / Pós-Venda',
  financeiro: 'Financeiro',
  montador_proprio: 'Montador',
  montador_terceiro: 'Montador Terceiro',
  arquiteto: 'Arquiteto',
  cliente: 'Cliente',
}

export const podeVerTudo = (perfil) => ['diretoria', 'gerente_comercial'].includes(perfil)
export const ehVendedor = (perfil) => perfil === 'vendedor'
export const ehProjetista = (perfil) => perfil === 'projetista'
export const ehConferente = (perfil) => perfil === 'conferente'
