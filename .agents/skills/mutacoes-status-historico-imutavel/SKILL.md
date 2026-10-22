---
name: mutacoes-status-historico-imutavel
description: >-
  Use esta skill sempre que planejar, criar ou alterar fluxos de transição de status de projetos,
  leads ou colaboradores no Plannit. A skill garante o cumprimento rigoroso da RN017 (auditoria
  imutável), integridade transacional com db.transaction, cálculo de SLA/tempo de permanência e os
  guardrails de bloqueio operacional (RN001, RN002, RN005, RN006 e RN016).
---

# Mutações de Status e Histórico Imutável (RN017 e Guardrails)

Esta skill estabelece o padrão arquitetural obrigatório para qualquer operação que altere o status de uma entidade do ciclo de vida no Plannit (especialmente **Projetos**, **Leads** e **Colaboradores**).

---

## 🎯 As 3 Regras de Ouro

1. **Nunca altere status sem histórico imutável (RN017):** É expressamente proibido fazer `projeto.status = novoStatus; await projeto.save()` isolado. Toda mudança de status deve salvar um registro correspondente em `HistoricoStatusProjeto` ou `HistoricoStatusLead` dentro da mesma transação de banco.
2. **Nunca faça exclusão física na rotina (RN017 / RH-RN009):** Projetos e leads são arquivados (`arquivado = true`, `arquivado_motivo`), especificadores e colaboradores são desativados ou desligados (`is_active = false`). Exclusão definitiva (`DELETE`) só existe como purga administrativa restrita à Diretoria (RH-RN011).
3. **Valide os guardrails de negócio antes de persistir:** Bloqueios operacionais (RN001 a RN006) não podem ser contornados.

---

## 🛑 Guardrails Operacionais Obrigatórios

Antes de efetuar uma transição de status no controller, verifique os bloqueios aplicáveis:

| Regra | Aplicação | Bloqueio / Condição | Código de Erro / Ação |
|:---|:---|:---|:---|
| **RN001** | Lead ➔ Briefing/Cliente | Lead precisa ter `qualificado === true` (orçamento, prazo, imóvel e ambientes). | `session.flash('error', 'Lead não qualificado...')` |
| **RN002** | Briefing ➔ Fila | Score técnico do briefing deve ser >= `scoreMinimo` (padrão 70). | `session.flash('error', 'Score insuficiente...')` |
| **RN003** | Fila ➔ Alocação | WIP limit do projetista (máximo de 3 projetos ativos simultâneos). | Verificar via `wip_service.ts`. |
| **RN004** | Versão 3D ➔ Render | Render só pode ser enviado para aprovação após validação do vendedor. | Motivo obrigatório em devoluções. |
| **RN005** | Apresentação / Fechamento | O projeto **exige** versão 3D com status `aprovado` ou `finalizado`. | `RN005_RENDER_NAO_CONCLUIDO` |
| **RN006** | Etapas Técnicas (`contato_conf` até `em_montagem`) | O projeto **exige** Handoff completo com todos os 8 itens preenchidos de `ITENS_OBRIGATORIOS_HANDOFF`. | `RN006_HANDOFF_INCOMPLETO` |
| **RN016** | SLA / Estagnação | Projetos parados > 5 dias no mesmo status disparam alerta visual. | `diasParado > 5` |

---

## 💻 Padrão Canônico de Código no Backend

Toda mutação de status deve seguir este esqueleto atômico:

```typescript
import db from '@adonisjs/lucid/services/db'
import { DateTime } from 'luxon'
import Projeto, { StatusProjeto } from '#models/projeto'
import HistoricoStatusProjeto from '#models/historico_status_projeto'

// 1. Checagem de guardrail pré-transação (exemplo RN005)
if (statusPara === StatusProjeto.APRESENTACAO || statusPara === StatusProjeto.FECHAMENTO) {
  const temRenderAprovado = projeto.versoesComerciais?.some(
    (v) => v.status === 'aprovado' || v.status === 'finalizado'
  )
  if (!temRenderAprovado) {
    session.flash('error', 'Não é possível avançar sem maquete 3D aprovada (RN005).')
    return response.redirect().back()
  }
}

// 2. Transação atômica obrigatória
await db.transaction(async (trx) => {
  const agora = DateTime.now().toUTC()
  const statusAnterior = projeto.status

  // Cálculo de permanência na etapa anterior (para relatórios de funil/gargalo)
  const dataAnterior = projeto.statusAlteradoEm || projeto.updatedAt || projeto.createdAt
  const tempoPermanenciaSegundos = Math.max(
    0,
    Math.floor(agora.diff(dataAnterior, 'seconds').seconds)
  )

  // Atualização do Projeto
  projeto.useTransaction(trx)
  projeto.status = statusPara
  projeto.statusAlteradoEm = agora
  await projeto.save()

  // Gravação do Histórico Imutável (RN017)
  const historico = new HistoricoStatusProjeto()
  historico.useTransaction(trx)
  historico.projetoId = projeto.id
  historico.alteradoPorId = user.id
  historico.statusDe = statusAnterior
  historico.statusPara = statusPara
  historico.observacao = payload.observacao || null
  historico.tempoPermanenciaSegundos = tempoPermanenciaSegundos
  await historico.save()
})

session.flash('success', 'Status atualizado com sucesso!')
return response.redirect().back()
```

---

## 🔍 Checklist de Revisão para o Desenvolvedor / Agente

- [ ] A transição usa `db.transaction(async (trx) => ...)` envolvendo a entidade principal e o histórico?
- [ ] O histórico registra `alteradoPorId`, `statusDe`, `statusPara` e `observacao`?
- [ ] Os guardrails aplicáveis (RN001, RN002, RN005, RN006) são validados e devolvem feedback claro?
- [ ] O cálculo de `tempoPermanenciaSegundos` usa Luxon em UTC?
- [ ] Em caso de cancelamento ou arquivamento, o motivo é obrigatório?
