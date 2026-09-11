# Relatório de Handoff — Challenger 1 (Score Engine Adversarial Verifier)

**Data**: 2026-09-10T14:25:00Z  
**Autor**: Challenger 1 (Empirical Challenger)  
**Destinatário**: Parent Agent (`5b1044fb-e626-4f06-8410-4c1942f783ce`)  
**Veredito**: **REQUEST_CHANGES**  

---

## 1. Observation

Durante a execução da verificação adversarial empírica sobre o motor analítico de pontuação de Especificadores (`plannit/app/services/arquiteto_score_service.ts`), foram observados os seguintes fatos:

### Observação 1.1 — Cômputo indevido de projetos cancelados no RFV
No arquivo `plannit/app/services/arquiteto_score_service.ts`, linhas 268-298:
```typescript
  // 1. Projetos não arquivados vinculados
  const projetos = await Projeto.query()
    .where('arquiteto_id', arquiteto.id)
    .where('arquivado', false)
    .orderBy('created_at', 'desc')
...
  // Datas de projetos e recência
  const datasProjetos = projetos.map((p) => p.createdAt).filter(Boolean) as DateTime[]
  const ultimoProjetoEm = datasProjetos.length > 0 ? DateTime.max(...datasProjetos) : null
  const diasDesdeUltimoProjeto = ultimoProjetoEm
    ? Math.max(0, Math.floor(agora.diff(ultimoProjetoEm, 'days').days))
    : null

  // Projetos dos últimos 12 meses
  const projetos12m = projetos.filter((p) => p.createdAt && p.createdAt >= limite12Meses)
  const somaValor = projetos12m.reduce((acc, p) => acc + (p.valorContrato ? Number(p.valorContrato) : 0), 0)
```
Enquanto projetos arquivados (`arquivado = true`) são excluídos da query (`.where('arquivado', false)`), projetos cancelados (`status = StatusProjeto.CANCELADO`, ou seja `'cancelado'`) **NÃO** são excluídos do cálculo do RFV.

Ao executar o harness adversarial `node --import=@poppinss/ts-exec scripts/test_arquiteto_score_adversarial.ts` com um arquiteto possuindo apenas 1 projeto cancelado de R$ 500.000 criado há 10 dias, o motor retornou:
```
  [Diagnóstico Empírico de Projeto Cancelado]
  Projetos12m: 1
  SomaValor12m: 500000
  Recência pts: 100
  RFV: 73.3
  Projetos Ativos (Potencial): 0
  ❌ [FAIL 1] Projetos cancelados (status="cancelado") devem ser ignorados no RFV -> Frequência: 1, Valor: 500000, Recência: 100
```
O requisito estipula expressamente: *"projetos cancelados/arquivados (devem ser ignorados no RFV)"*.

### Observação 1.2 — Acoplamento de estado e poluição de banco entre suítes de teste
Ao executar `node scripts/test_arquiteto_score.js` isoladamente após a execução de `scripts/test_http_arquitetos.js`, o teste falhou na asserção da linha 475:
```
❌ ERRO NA SUITE DE TESTES DO SCORE: Error: [FALHA] Meta do vendedor = 15 visitas/mês -> Esperado: 15, Obtido: 18
    at assertEqual (file:///home/porto/codespace/Plannit/plannit/scripts/test_arquiteto_score.js:145:13)
    at runArquitetoScoreTests (file:///home/porto/codespace/Plannit/plannit/scripts/test_arquiteto_score.js:475:3)
```
Isso ocorre porque `scripts/test_http_arquitetos.js` (linhas 443-446) executa um `PUT /especificadores/metas-visitas` alterando a meta de `vendedor@lidermoveis.com.br` para 18 e não restaura o valor original após o teste.

### Observação 1.3 — Comportamentos robustos e aprovados
No mesmo harness adversarial `test_arquiteto_score_adversarial.ts`, 73 asserções foram aprovadas com sucesso:
- **Limites de Recência**: 0, 30, 31, 90, 91, 180, 181, 365, 366 dias pontuando rigorosamente 100, 70, 40, 20 e 5. Datas futuras (`dias < 0`) sofrem clamp correto via `Math.max(0, ...)` e pontuam 100 (mesmo dia).
- **Limites de Frequência**: 0, 1, 2, 3, 4, 5, 6, 7 e valores superiores pontuando rigorosamente 0, 30, 60, 85 e 100.
- **Limites de Valor**: R$ 49.999 / R$ 50.000 / R$ 149.999 / R$ 150.000 / R$ 349.999 / R$ 350.000 / R$ 699.999 / R$ 700.000 e nulos/negativos pontuando 0, 30, 55, 75, 90 e 100.
- **Divisão por Zero**: Especificador sem histórico de leads (0 fechados, 0 perdidos, 0 desqualificados) retorna pontuação neutra 50.0 sem erros de divisão por zero.
- **Anos Bissextos**: Cálculo com Luxon entre 29/02/2024 e 28/02/2025 resulta em 11 meses; até 01/03/2025 resulta em 12 meses; `contarMesesDistintos` agrupa corretamente datas bissextas no mesmo ano-mês.
- **Cascata dos 7 Segmentos**: A ordem de precedência (`inativo` -> `novo_promissor` -> `em_risco` -> `campeao` -> `parceiro_fiel` -> `em_ascensao` -> `ocasional`) é inviolável em todas as permutações de colisão testadas.
- **5 Flags Simultâneas**: Comprovada a possibilidade de ativação simultânea das 5 flags (`top_indicador`, `em_risco_de_perda`, `alto_potencial`, `indicacao_alto_valor`, `especificador_esfriando`).
- **Isolamento de Concorrência**: O indicador de risco de concorrência é 100% desacoplado e não interfere em nenhum pilar objetivo de pontuação.

---

## 2. Logic Chain

1. **A partir da Observação 1.1**: O motor de pontuação `calcularScoreArquiteto` busca projetos filtrando apenas por `arquivado = false`. Em seguida, utiliza todos esses projetos em `datasProjetos` e `projetos12m` para derivar recência, frequência e valor de contratos.
2. Como contratos cancelados (`status = StatusProjeto.CANCELADO`) continuam com `arquivado = false` no banco operacional (conforme a RN017 onde projetos cancelados não são automaticamente arquivados ou deletados fisicamente), esses contratos são somados indevidamente no RFV.
3. Isso causa uma distorção grave: um especificador que teve apenas vendas canceladas/frustradas pontua com score RFV alto (73.3 no teste empírico) e pode receber flags indevidas de alto valor ou atividade recente, violando a regra de negócio que exige que projetos cancelados sejam desconsiderados no RFV.
4. **A partir da Observação 1.2**: A execução concorrente ou sequencial dos testes automatizados em ambientes de CI/CD quebra a suíte oficial `scripts/test_arquiteto_score.js` se `test_http_arquitetos.js` tiver sido executado anteriormente sem um re-seeding do banco.
5. Logo, conclui-se que o motor analítico requer ajuste na filtragem de status de projetos no cálculo de RFV, e os testes necessitam de isolamento de estado.

---

## 3. Caveats

- A base legada em Python (`backend/app/services/arquiteto_score.py`) continha a mesma omissão (filtrava apenas `Projeto.arquivado == False`), o que explica o motivo de o desenvolvedor ter replicado o comportamento em TypeScript. No entanto, o SRS v3.0 e a especificação da tarefa determinaram expressamente que projetos cancelados devem ser ignorados no RFV.
- Não foram encontrados outros desvios nos pilares matemáticos, nas faixas de fronteira ou na cascata lógica dos 7 segmentos.

---

## 4. Conclusion

**Veredito: REQUEST_CHANGES**

Para aprovação final, o time de desenvolvimento deve aplicar as seguintes correções:
1. **Ignorar Projetos Cancelados no RFV**:
   Em `plannit/app/services/arquiteto_score_service.ts`, filtrar projetos com `p.status !== StatusProjeto.CANCELADO` antes de calcular `datasProjetos`, `ultimoProjetoEm`, `projetos12m`, `somaValor` e `mesesComProjeto`.
2. **Isolamento da Meta no Teste HTTP**:
   Em `plannit/scripts/test_http_arquitetos.js`, restaurar `metaVisitasMes: 15` para `vendedor@lidermoveis.com.br` ao final do teste para evitar poluição de estado que quebra `scripts/test_arquiteto_score.js`.

---

## 5. Verification Method

Para verificar as falhas e posteriormente validar as correções:

1. **Reprodução Empírica da Falha de Projeto Cancelado no RFV**:
   ```bash
   cd /home/porto/codespace/Plannit/plannit
   node --import=@poppinss/ts-exec scripts/test_arquiteto_score_adversarial.ts
   ```
   *Condição de invalidação/aprovação*: A asserção `[FAIL 1]` deve passar, reportando 74 passes e 0 falhas.

2. **Reprodução do Acoplamento de Testes**:
   ```bash
   cd /home/porto/codespace/Plannit/plannit
   node scripts/test_http_arquitetos.js
   node scripts/test_arquiteto_score.js
   ```
   *Condição de invalidação/aprovação*: `test_arquiteto_score.js` deve passar com exit code 0 mesmo após a execução de `test_http_arquitetos.js`.
