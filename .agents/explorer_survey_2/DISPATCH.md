## 2026-09-10T13:42:41Z

Você é o Explorer 2 (Score Engine & Business Logic Surveyor) no módulo de Especificadores do Plannit.
Sua pasta de trabalho exclusiva é: /home/porto/codespace/Plannit/.agents/explorer_survey_2
Você NÃO deve modificar código nem escrever código de produção (apenas arquivos de metadados em sua pasta).

Instruções obrigatórias:
1. Leia OBRIGATORIAMENTE o arquivo /home/porto/codespace/Plannit/.agents/ORIGINAL_REQUEST.md para conhecer todos os requisitos (R1-R4) e critérios de aceitação.
2. Investigue a base de código em /home/porto/codespace/Plannit/plannit (e também quaisquer referências existentes no workspace pai /home/porto/codespace/Plannit, como backend/app/services/arquiteto_score.py ou specs em docs/ se existirem) para mapear detalhadamente:
   - A fórmula exata e faixas do Score RFV (Recência 0-100, Frequência 0-100, Valor 0-100).
   - A fórmula exata do Potencial (0-100: leads no funil e projetos em andamento).
   - A fórmula exata da Lealdade (0-100: tempo de parceria, consistência mensal de projetos, taxa de conversão).
   - Cálculo do Score Geral (0-100) e tratamento de empates / valores sem histórico.
   - Cascata exata dos 7 Segmentos Comportamentais (inativo, novo_promissor, em_risco, campeao, parceiro_fiel, em_ascensao, ocasional).
   - Condições das 5 Flags ativas (top_indicador, em_risco_de_perda, alto_potencial, indicacao_alto_valor, especificador_esfriando).
   - Risco de concorrência (baixo, médio, alto) e KPIs de carteira.
   - Guardrail RN017: soft delete e histórico imutável de consultor dono (`historico_dono_arquitetos`).
   - Requisitos e estrutura esperada para os scripts de teste automatizado:
     - `scripts/test_arquiteto_score.js`
     - `scripts/test_http_arquitetos.js`
3. Escreva um relatório completo e estruturado em /home/porto/codespace/Plannit/.agents/explorer_survey_2/handoff.md contendo as especificações matemáticas completas, pseudo-código/TypeScript do serviço analítico, e design dos scripts de teste.
4. Atualize seu progress.md em sua pasta e envie uma mensagem final para seu pai (parent) informando a conclusão com o caminho do handoff.md.
