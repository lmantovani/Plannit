// Mapeamento dos 32 status do fluxo operacional (SRS Seção 4)

export const STATUS_CONFIG = {
  novo_lead:             { label: 'Novo Lead',              color: 'blue',   fase: 'comercial' },
  qualificando:          { label: 'Qualificando',           color: 'blue',   fase: 'comercial' },
  em_visita:             { label: 'Em Visita',              color: 'blue',   fase: 'comercial' },
  em_briefing:           { label: 'Em Briefing',            color: 'purple', fase: 'comercial' },
  na_fila:               { label: 'Na Fila',                color: 'stone',  fase: 'projeto' },
  em_projeto:            { label: 'Em Projeto',             color: 'purple', fase: 'projeto' },
  aguard_validacao:      { label: 'Aguard. Validação',      color: 'amber',  fase: 'projeto' },
  em_render:             { label: 'Em Render',              color: 'purple', fase: 'projeto' },
  aguard_apresentacao:   { label: 'Aguard. Apresentação',   color: 'blue',   fase: 'projeto' },
  em_ajuste:             { label: 'Em Ajuste',              color: 'amber',  fase: 'projeto' },
  em_fechamento:         { label: 'Em Fechamento',          color: 'green',  fase: 'comercial' },
  aguard_assinatura:     { label: 'Aguard. Assinatura',     color: 'amber',  fase: 'comercial' },
  em_handoff:            { label: 'Em Handoff',             color: 'purple', fase: 'tecnico' },
  contato_conf:          { label: 'Contato Conferente',     color: 'blue',   fase: 'tecnico' },
  validando_obra:        { label: 'Validando Obra',         color: 'amber',  fase: 'tecnico' },
  em_medicao:            { label: 'Em Medição',             color: 'purple', fase: 'tecnico' },
  em_adequacao:          { label: 'Em Adequação',           color: 'amber',  fase: 'tecnico' },
  alinhando_cliente:     { label: 'Alinhando Cliente',      color: 'amber',  fase: 'tecnico' },
  em_auditoria:          { label: 'Em Auditoria',           color: 'purple', fase: 'tecnico' },
  aguard_assinatura_tec: { label: 'Aguard. Assinatura Téc.', color: 'amber', fase: 'tecnico' },
  em_producao:           { label: 'Em Produção',            color: 'blue',   fase: 'producao' },
  pre_montagem:          { label: 'Pré-Montagem',           color: 'amber',  fase: 'montagem' },
  aguard_mercadoria:     { label: 'Aguard. Mercadoria',     color: 'amber',  fase: 'producao' },
  entrega_agendada:      { label: 'Entrega Agendada',       color: 'green',  fase: 'montagem' },
  em_entrega:            { label: 'Em Entrega',             color: 'green',  fase: 'montagem' },
  em_montagem:           { label: 'Em Montagem',            color: 'purple', fase: 'montagem' },
  com_ocorrencia:        { label: 'Com Ocorrência',         color: 'red',    fase: 'montagem' },
  checklist_final:       { label: 'Checklist Final',        color: 'green',  fase: 'montagem' },
  pos_venda:             { label: 'Pós-Venda',              color: 'green',  fase: 'posvenda' },
  em_at:                 { label: 'Em AT',                  color: 'red',    fase: 'posvenda' },
  relacionamento:        { label: 'Relacionamento',         color: 'green',  fase: 'posvenda' },
  concluido:             { label: 'Concluído',              color: 'stone',  fase: 'posvenda' },
  cancelado:             { label: 'Cancelado',              color: 'red',    fase: 'posvenda' },
}

export const STATUS_COLOR_CLASSES = {
  blue:   'bg-blue-50 text-blue-700 border-blue-200',
  purple: 'bg-purple-50 text-purple-700 border-purple-200',
  green:  'bg-green-50 text-green-700 border-green-200',
  amber:  'bg-amber-50 text-amber-700 border-amber-200',
  red:    'bg-red-50 text-red-700 border-red-200',
  stone:  'bg-stone-100 text-stone-600 border-stone-200',
}

export const getStatusBadge = (status) => {
  const cfg = STATUS_CONFIG[status]
  if (!cfg) return { label: status, classes: STATUS_COLOR_CLASSES.stone }
  return { label: cfg.label, classes: STATUS_COLOR_CLASSES[cfg.color] }
}

// Funil do CRM (Módulo 01)
export const FUNIL_ETAPAS = [
  { key: 'novo_lead',    label: 'Novo Lead',    cor: '#3b82f6' },
  { key: 'qualificando', label: 'Qualificando', cor: '#8b5cf6' },
  { key: 'em_visita',    label: 'Em Visita',    cor: '#f59e0b' },
  { key: 'em_briefing',  label: 'Em Briefing',  cor: '#a66a12' },
  { key: 'em_projeto',   label: 'Em Projeto',   cor: '#8b5cf6' },
  { key: 'em_negociacao',label: 'Negociação',   cor: '#f59e0b' },
  { key: 'fechado',      label: 'Fechado',      cor: '#16a34a' },
  { key: 'perdido',      label: 'Perdido',      cor: '#dc2626' },
]

export const ORIGEM_LABELS = {
  instagram:   'Instagram',
  indicacao:   'Indicação',
  site_google: 'Site / Google',
  construtora: 'Construtora',
  showroom:    'Showroom',
  arquiteto:   'Arquiteto',
  outro:       'Outro',
}

export const formatCurrency = (value) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value || 0)

export const formatDate = (date) =>
  date ? new Date(date).toLocaleDateString('pt-BR') : '—'

export const formatDatetime = (date) =>
  date ? new Date(date).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' }) : '—'

export const timeAgo = (date) => {
  if (!date) return '—'
  const diff = Date.now() - new Date(date).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 60) return `${mins}min atrás`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h atrás`
  const days = Math.floor(hrs / 24)
  return `${days}d atrás`
}

export const TIPO_ARQUITETO_LABELS = {
  arquiteto:  'Arquiteto',
  engenheiro: 'Engenheiro',
  designer:   'Designer',
  corretor:   'Corretor',
  outro:      'Outro',
}

export const TIPO_ARQUITETO_COLORS = {
  arquiteto:  'blue',
  engenheiro: 'purple',
  designer:   'amber',
  corretor:   'green',
  outro:      'stone',
}

export const TIPO_INTERACAO_ARQUITETO_LABELS = {
  visita_escritorio: 'Visita ao escritório',
  ligacao:            'Ligação',
  visita_loja:        'Visita à loja',
  evento:              'Evento',
  viagem:              'Viagem',
  envio_brinde:        'Envio de brinde',
}
