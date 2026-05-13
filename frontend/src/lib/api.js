import axios from 'axios'

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api/v1'

export const api = axios.create({
  baseURL: BASE_URL,
  headers: { 'Content-Type': 'application/json' },
  timeout: 15000,
})

// Injeta token em todas as requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

// Redireciona para login se 401
api.interceptors.response.use(
  (res) => res,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token')
      localStorage.removeItem('user')
      window.location.href = '/login'
    }
    return Promise.reject(error)
  }
)

// Funções utilitárias por módulo
export const authApi = {
  login: (email, password) => api.post('/auth/login', { email, password }),
  me: () => api.get('/auth/me'),
  changePassword: (data) => api.post('/auth/change-password', data),
}

export const leadsApi = {
  list: (params) => api.get('/leads/', { params }),
  get: (id) => api.get(`/leads/${id}`),
  create: (data) => api.post('/leads/', data),
  update: (id, data) => api.patch(`/leads/${id}`, data),
  perder: (id, data) => api.post(`/leads/${id}/perder`, data),
  qualificar: (id) => api.post(`/leads/${id}/qualificar`),
  listarInteracoes: (id) => api.get(`/leads/${id}/interacoes`),
  registrarInteracao: (id, data) => api.post(`/leads/${id}/interacoes`, data),
}

export const briefingsApi = {
  calcularScore: (data) => api.post('/briefings/calcular-score', data),
  salvar: (data) => api.post('/briefings/', data),
  enviarParaFila: (id) => api.post(`/briefings/${id}/enviar-para-fila`),
  get: (id) => api.get(`/briefings/${id}`),
}

export const dashboardApi = {
  gestor: () => api.get('/dashboard/gestor'),
  comercial: () => api.get('/dashboard/comercial'),
  projetosAtivos: () => api.get('/dashboard/projetos-ativos'),
}

export const usersApi = {
  list: () => api.get('/users/'),
  create: (data) => api.post('/users/', data),
  update: (id, data) => api.patch(`/users/${id}`, data),
  disponibilidadeProjetistas: () => api.get('/users/projetistas/disponibilidade'),
}
