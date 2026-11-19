# Plannit — Especificação v1: Lançamento de Atendimentos, Fila da Vez e Validação de Vendas

Nov 3, 2026 · @Thiago RIbeiro

## 1. Contexto e escopo

Esta especificação define como o Plannit registra cada atendimento comercial, da porta da loja até a venda validada. É a versão 1: as regras abaixo foram decididas pelo Thiago (Diretor Comercial) e as pendências ficam na seção 10. O que for decidido depois entra como adendo numerado, sem reescrever o que já está aqui.

O problema que ela resolve: a planilha atual mistura três coisas numa linha só (o cliente, a passagem dele pela loja e o dia do vendedor). Isso infla atendimentos, distorce a taxa de conversão e esconde o desconto real. O Plannit separa os três registros.

| Aba                   | Quem usa                              | O que entrega                                                                                       |
| --------------------- | ------------------------------------- | --------------------------------------------------------------------------------------------------- |
| Atendimento/Orçamento | Vendedora e recepção                  | Lançamento de toda interação. Só uma oportunidade nova cria card de novo lead no Kanban             |
| Vendedores            | Gestor                                | Indicadores por vendedora e período, fila de validação, orçamentos em aberto por temperatura, metas |
| Clientes              | Vendedora (própria carteira) e gestor | Histórico de oportunidades, interações, compras e visitas, somado ao prontuário que já existe       |

Premissas para quem implementa: o Plannit já está em operação (FastAPI, PostgreSQL, React, multi-tenant). Kanban, cadastro de clientes e prontuário já existem e são estendidos, não recriados. As etapas do Kanban estão definidas no Plannit e ficam fora desta especificação. O Plannit começa limpo, sem migração de dados da planilha.

Como ler: seção 3 modelo de dados, 4 telas e fluxos, 5 regras (RN-L), 6 indicadores, 7 parâmetros, 8 permissões, 9 o que fica fora da v1, 10 pendências, 11 o que a planilha atual revelou. Itens marcados como (proposta) foram sugeridos e ainda não confirmados pelo Thiago.

## 2. Princípios de projeto

Sete princípios valem para todas as telas e regras deste documento.

1. **Três registros distintos.** Oportunidade (intenção de compra), interação (cada contato dentro dela) e registro do dia (o que a vendedora fez ou onde esteve). Só a oportunidade entra na conta de conversão, venda média e itens por venda.
2. **Anti-fricção.** Todo campo obrigatório precisa devolver um número útil a quem preencheu. Criação rápida (cliente e oportunidade com o mínimo), enriquecimento depois, e o esforço concentrado no fechamento.
3. **Append-only.** Nada que afete indicador é sobrescrito: temperatura, versões de orçamento, eventos da fila e ações da recepção ficam com autor e horário. Correção é novo registro.
4. **Parâmetro, não código.** Listas, prazos, alçadas e probabilidades ficam em tabelas editáveis pelo gestor, sem depender de deploy.
5. **Medir padrão, não evento.** Pulo de vez, desvio da recepção e desconto são lidos em período. Um episódio isolado não é alerta.
6. **Quem vende não confirma a própria venda.** A vendedora declara, o administrativo ou financeiro valida, o gestor aprova o que passa da alçada.
7. **Sem dado inventado.** Onde o sistema não tem base (probabilidade nos primeiros meses, tempo de resposta do WhatsApp na v1), mostra “estimativa inicial” ou deixa vazio, nunca um número com aparência de medido.

## 3. Modelo de dados

As entidades vêm em quatro grupos. Toda tabela segue o padrão existente do Plannit (tenant e loja). Nomes de campo são sugestão; Porto e Leandro ajustam à convenção do código.

### 3.1 Núcleo comercial

| Entidade | Campos principais | Observações |
| --- | --- | --- |
| Cliente (existente) | nome, telefone, vendedor\_responsavel\_id | Deduplicação por nome e telefone, fluxo sugere ou cria. Visão limitada a quem não é o responsável (RN-L30) |
| Oportunidade | cliente\_id, segmento, canal\_contato, origem\_captacao, especificador\_id, cliente\_indicador\_id, evento\_id, vendedor\_principal\_id, loja\_id, etapa, temperatura, previsao\_fechamento\_mes, proximo\_contato\_em, status | Unidade de conversão. A etapa usa a tabela etapas\_funil existente. status: aberta, vendida\_declarada, vendida\_confirmada, perdida. especificador\_id travado após a criação (RN-L20) |
| HistoricoTemperatura | oportunidade\_id, temperatura, em, autor\_id, origem | Append-only. Gravar desde o primeiro dia: é a base da probabilidade (RN-L29). origem: manual ou sugestao |
| Interacao | oportunidade\_id, vendedor\_id, data, turno, tipo, descricao, registrada\_em, proximo\_contato\_em, whatsapp\_primeiro\_contato\_em, whatsapp\_primeira\_resposta\_em | Nunca cria oportunidade. turno: manha, tarde, dia\_todo. tipo: loja, whatsapp, telefone, visita\_cliente, outro. Os dois campos de WhatsApp ficam nulos na v1 |
| VersaoOrcamento | oportunidade\_id, numero, valor, valor\_tabela\_declarado, motivo\_revisao, autor\_id, em | Append-only. motivo\_revisao (escopo ou comercial) vale a partir da versão 2. A última versão é o orçado vigente |
| Especificador (módulo existente) | tipo, cadastro\_pendente, criado\_por, completado\_por | Cadastro rápido com nome e tipo, pendente até o gestor completar |

### 3.2 Venda, desconto e perda

| Entidade | Campos principais | Observações |
| --- | --- | --- |
| Venda | oportunidade\_id, estado, valor\_vendido, quantidade, valor\_contratado, valor\_tabela\_conferido, declarada\_por, declarada\_em, validada\_por, validada\_em | estado: declarada, confirmada, revertida. Desconto real, over e desconto aparente são calculados, não digitados |
| ChecklistValidacao | venda\_id, item, atendido, anexo, conferido\_por | Itens: cadastro completo, contrato, forma de pagamento com todos os detalhes |
| AprovacaoDesconto | venda\_id, solicitado\_por, aprovado\_por, justificativa, em | Exigida quando o desconto passa da alçada |
| DivisaoVenda | venda\_id, vendedor\_id, percentual, aprovado\_por, em | Soma 100%. Meta e comissão seguem o percentual. Atendimento e conversão ficam com o vendedor principal |
| PerdaOportunidade | oportunidade\_id, motivo\_id, concorrente\_id, valor\_concorrente, valor\_pretendido, produto\_buscado | motivo\_id aponta para taxonomia de dois níveis. concorrente\_id obrigatório quando a categoria é concorrência |
| MotivoPerda e Concorrente | categoria, subcategoria, familia (com\_orcamento ou sem\_orcamento) e nome | Editáveis pelo gestor |

### 3.3 Recepção, fila e dia da vendedora

| Entidade | Campos principais | Observações |
| --- | --- | --- |
| EntradaLoja | loja\_id, entrou\_em, categoria\_produto\_id, produto\_texto, desfecho, vendedor\_id, cliente\_id, motivo\_saida\_id, espera\_ate | Uma linha por pessoa que entra. desfecho: encaminhada ou saiu\_sem\_atendimento. Motivo obrigatório para quem sai sem atendimento |
| ListaEsperaProduto | categoria\_produto\_id, nome, telefone, consentimento\_em, notificada\_em | Só com aceite da pessoa e consentimento registrado (ver pendências) |
| FilaDia | loja\_id, data, vendedor\_id, posicao, status, motivo\_indisponibilidade\_id | Posição inicial pela ordem do “cheguei” |
| EventoFila | tipo, vendedor\_id, autor\_id, autor\_papel, antes, depois, motivo\_id, cliente\_esperando, em | Append-only. tipo: cheguei, disponivel, indisponivel, acionada, atendeu, pulada, reordenada, editada\_pela\_recepcao, encaminhada |
| RegistroDia | vendedor\_id, data, chegada\_em, tipo\_ausencia\_id, lancado\_por | A presença nasce do “cheguei”. Ausência é lançada pelo gestor ou RH |
| TipoAusencia | nome, reduz\_meta | Lista única, reaproveitada depois pelo módulo de RH |

### 3.4 Gestão e auditoria

| Entidade | Campos principais | Observações |
| --- | --- | --- |
| Meta | vendedor\_id, loja\_id, ano\_mes, segmento, valor, lancada\_por | Lançada pelo gestor no início do mês |
| Parametro | chave, valor, escopo, atualizado\_por | Lista na seção 7 |
| LogAcao | autor\_id, papel, entidade, acao, antes, depois, em | Imutável. Cobre toda ação da recepção e todo ajuste manual |
| AcessoTemporario | cliente\_id, vendedor\_id, ate, concedido\_por, acessos | Cobertura de colega ausente (RN-L30) |

## 4. Telas e fluxos

Cada perfil tem uma tela principal. A regra de desenho é a mesma em todas: o caminho comum leva segundos, e o campo extra só aparece quando o caso exige.

### 4.1 Recepção

- **Fila do dia.** Lista em ordem com posição, vendedora, status (disponível, em atendimento, indisponível com motivo) e tempo naquele status. A recepção adiciona vendedora à fila, reordena e edita a disponibilidade.
- **Registrar entrada.** Um toque, horário automático, categoria do produto procurado (lista editável, com texto livre opcional). Toda pessoa que entra é registrada.
- **Desfecho.** Encaminhada para uma vendedora, ou saiu sem atendimento com motivo obrigatório. Se o motivo é não encontrou o produto, a recepção oferece “avisamos quando chegar” e registra nome e telefone só de quem aceita.
- **Encaminhar.** Busca ou cria o cliente (nome e telefone). O sistema sugere a vendedora da vez, ou a responsável quando o cliente tem carteira ou veio por especificador da carteira dela. Um seletor define o destino da vendedora depois do atendimento: mantém a posição (padrão) ou vai para o fim da fila. Motivos de desvio: cliente pediu a vendedora, vendedora indisponível, volta de ausência.
- A recepção vê só a fila e os dados mínimos do cliente. Não vê valores nem orçamentos.

### 4.2 Vendedora

- **Cheguei.** Marca a chegada no início do dia. O horário é automático e a recepção pode editar. Define a posição inicial na fila.
- **Disponível ou indisponível.** Indisponível exige motivo de uma lista curta. A tela mostra quem é a vez e a posição de cada uma.
- **Lançar atendimento**, em cinco passos:
  1. Buscar o cliente por nome ou telefone. Se não existe, criar com nome e telefone.
  2. Ver as oportunidades abertas dele. Com uma só aberta, ela vem pré-selecionada como Continuar. “Nova intenção de compra” é uma ação explícita. Com duas abertas (soltos e planejados), a vendedora escolhe.
  3. Continuar: registrar a interação (data com hoje como padrão, turno, tipo, o que aconteceu, próximo contato). Se algo mudou, atualizar temperatura, etapa e valor ali mesmo.
  4. Nova: informar canal de contato, origem de captação e segmento, mais especificador, cliente indicador ou evento conforme a origem. Cria o card Novo lead no Kanban.
  5. Venda: marcar Vendido na aba registra a venda como declarada, com valor vendido e quantidade. A confirmação acontece no Kanban (4.3).
- **Painel pessoal.** Meta do mês ajustada pelas ausências, realizado confirmado, vendas declaradas aguardando validação, percentual atingido, quanto falta, projeção, ritmo diário necessário e a fila do dia com follow-ups atrasados.
- **Agenda do dia.** Reune as interações de todos os clientes por turno, o que responde “quanto tempo a vendedora ficou em atendimento”. A visita ao escritório de um especificador é ação do módulo de Especificadores e também aparece na agenda (proposta).

### 4.3 Kanban e validação da venda

Marcar Vendido na aba de lançamento declara a venda. Só arrastar o card no Kanban a confirma, e o sistema só aceita quando o checklist está completo.

| Passagem | O sistema exige |
| --- | --- |
| Orçamento enviado | Valor orçado e valor de tabela declarado pela vendedora |
| Perdida | Motivo em dois níveis e produto buscado. Concorrente quando a categoria é concorrência |
| Vendida declarada (aba de lançamento) | Valor vendido e quantidade (peças em soltos, ambientes em planejados) |
| Vendida confirmada (arrastar no Kanban) | Checklist completo (cadastro, contrato, pagamento), validação pelo administrativo ou financeiro e aprovação do gestor se o desconto passar da alçada |

Os nomes das etapas são os que já existem no Plannit. A tabela descreve as passagens que precisam dos campos; o Porto confirma com o Thiago em qual etapa existente cada passagem cai.

&#91;embedded content: confirmação da venda · 2 decisões, 1 volta\]

A venda declarada só vira confirmada com o checklist completo e, se o desconto passar da alçada, depois da aprovação do gestor.

### 4.4 Gestor

- **Aba Vendedores.** Por vendedora e período: atendimentos, orçamentos, conversão, venda média, itens por venda, % de venda com especificador, orçamentos em aberto por temperatura, meta, % atingido, quanto falta, projeção. Mais os indicadores da fila (seção 6).
- **Fila de validação.** Vendas declaradas e não confirmadas, com dias parados, valor e o item que falta. Alerta automático quando passa do prazo.
- **Fila de aprovação de desconto** e **fila de cadastros pendentes** de especificadores.
- **Metas.** O gestor lança no início do mês, por vendedora e segmento.
- **Auditoria da recepção.** Log completo e relatório por recepcionista: desvios por turno, motivos mais usados, vendedoras mais beneficiadas e prejudicadas, edições manuais de disponibilidade.

### 4.5 Clientes

Ficha com histórico de orçamentos, oportunidades, interações, número de compras, vendedor responsável e visitas à loja, mais o prontuário e as interações que já existem. Cada oportunidade tem seu vendedor, e o cliente tem um vendedor responsável que pode ser outro. Um cliente pode ser também especificador.

## 5. Regras de negócio

Cada regra tem um código para o Porto referenciar em tarefas e testes.

| Código | Regra |
| --- | --- |
| RN-L01 | A oportunidade é a unidade de conversão. Interação nunca cria oportunidade. “Oportunidades novas” e “movimento da loja” (interações) são dois números separados |
| RN-L02 | O lançamento começa pela busca do cliente. O padrão é continuar a oportunidade aberta. Abrir nova exige ação explícita. Com mais de uma aberta, a vendedora escolhe |
| RN-L03 | Cliente que fechou e volta pedindo mais gera nova oportunidade e nova venda. O histórico do cliente consolida tudo |
| RN-L04 | Fechamentos parciais dentro da mesma oportunidade aberta somam numa única venda |
| RN-L05 | Toda interação registra o turno (manhã, tarde ou dia todo). O horário do registro é automático |
| RN-L06 | Enquanto a oportunidade está aberta, a data do próximo contato é obrigatória e sugerida pela temperatura. “Retorno a pedido do cliente” aceita data além do prazo, com motivo, e não conta como atraso |
| RN-L07 | A oportunidade entra em atraso no dia seguinte ao vencimento do próximo contato. Aparece em vermelho na fila da vendedora e no painel do gestor |
| RN-L08 | Temperatura: Quente = fechamento previsto dentro do mês, com muita probabilidade. Morno = demonstrou interesse, fecha em outro momento. Frio = existe interesse, mas pouco. O sistema pode sugerir esfriamento; a decisão é da vendedora. Toda mudança grava HistoricoTemperatura |
| RN-L09 | Previsão de fechamento obrigatória: Quente = mês corrente (automático), Morno = mês escolhido, Frio = sem previsão. Quente que passa do fim do mês sem fechar exige revisão: mantém com nova previsão ou esfria |
| RN-L10 | Etapa e temperatura são campos independentes. As etapas usam a tabela existente etapas\_funil e não são alteradas por esta especificação |
| RN-L11 | A venda tem dois estados. Declarada: a vendedora marca Vendido na aba de lançamento. Confirmada: o card é arrastado no Kanban e o checklist está completo |
| RN-L12 | Checklist de confirmação: cadastro completo, contrato e forma de pagamento com todos os detalhes. A validação é feita pelo administrativo ou financeiro, com perfil substituto. Parâmetro opcional (desligado) define um valor abaixo do qual a validação é dispensada |
| RN-L13 | Venda declarada não conta em meta, comissão nem conversão confirmada. Aparece como “aguardando validação”, com alerta após o prazo parametrizado |
| RN-L14 | Valor de tabela: declarado pela vendedora no orçamento e conferido pela gestora na validação. Os dois ficam guardados. A trava usa o conferido |
| RN-L15 | Versões de orçamento são imutáveis. A partir da segunda, a revisão exige motivo: mudança de escopo ou ajuste comercial |
| RN-L16 | O desconto “orçado contra vendido” é sempre medido contra a última versão. Um KPI separado mede o primeiro orçamento contra o último (erosão do orçamento) |
| RN-L17 | Na aba de lançamento, o desconto é livre. Na confirmação, se o desconto real (tabela conferida contra contratado) passa da alçada do segmento, o sistema bloqueia até haver AprovacaoDesconto. Sem tabela conferida, usa a concessão acumulada (primeiro orçamento contra contratado, sem mudanças de escopo). A vendedora pode pedir a aprovação antes, durante a negociação |
| RN-L18 | Divisão de venda: percentual por vendedora, aprovado pelo gestor antes da validação. Meta e comissão seguem o percentual; atendimento e conversão contam só para o principal |
| RN-L19 | Cliente herdado: o gestor transfere a oportunidade aberta. O histórico acompanha, com registro de quem atendeu antes |
| RN-L20 | Especificador: busca com sugestão enquanto digita, tolerando grafia aproximada. Se não existe, cadastro rápido (nome e tipo) com marca pendente e aviso de nomes parecidos. Vinculado na criação e travado; só o gestor altera, com motivo |
| RN-L21 | Canal de contato (porta, WhatsApp, Instagram, telefone, e-mail, site) e origem de captação são obrigatórios. A origem “especificador” exige especificador; “indicação de cliente” exige o cliente indicador; “campanha ou evento” exige o evento |
| RN-L22 | Perda: motivo obrigatório em dois níveis. Concorrência exige o concorrente (lista editável) e aceita valor do concorrente opcional. Perda por preço aceita valor pretendido pelo cliente. Existe uma família de motivos para quem não recebeu orçamento |
| RN-L23 | Unidade de contagem por segmento: soltos contam peças, planejados contam ambientes. Itens por venda e valor por item são calculados dentro do segmento, nunca somados entre eles. Venda mista gera duas oportunidades |
| RN-L24 | Fila: rodízio pela ordem do “cheguei”. Quem atende vai para o fim, salvo exceção escolhida pela recepção. Quem está indisponível é pulada, mantém a posição e é a próxima ao ficar disponível |
| RN-L25 | Cliente com vendedora responsável, ou vindo por especificador da carteira dela, vai direto a ela, fora do rodízio. Se ela está indisponível, o cliente escolhe entre esperar ou ser atendido pela da vez, e a responsável segue registrada |
| RN-L26 | Toda ação da recepção grava LogAcao. Encaminhar para quem não era da vez, ou reordenar, exige motivo. Pulo causado por ajuste da recepção não conta contra a vendedora |
| RN-L27 | Entrada: toda pessoa que entra é registrada. Quem sai sem atendimento tem motivo obrigatório e produto procurado. Contato é opcional, só de quem aceita ser avisado, e alimenta a ListaEsperaProduto |
| RN-L28 | Meta lançada pelo gestor no início do mês, por vendedora e segmento. Cada TipoAusencia tem o parâmetro reduz\_meta; a meta é reduzida proporcionalmente aos dias úteis das ausências que reduzem |
| RN-L29 | Probabilidade de fechamento: começa com estimativa inicial editável por temperatura, marcada como tal. Migra para a taxa histórica da empresa por segmento e temperatura conforme o volume cresce, com aviso de confiança. A taxa individual só aparece como comparação, com volume mínimo |
| RN-L30 | Cliente de outra carteira aparece apenas como “cliente já cadastrado, responsável: nome”, sem histórico, valores ou observações. O gestor pode liberar acesso temporário, com prazo e registro de quem acessou |
| RN-L31 | WhatsApp na v1: atalho de um toque “novo contato WhatsApp”. Tempo de resposta não é medido até a integração (fase 2) |

## 6. Indicadores e fórmulas

Todos os indicadores são lidos por período e por loja. Os de conversão de planejados são lidos por safra (mês de criação da oportunidade), porque o ciclo é longo. Itens marcados (proposta) não foram confirmados pelo Thiago.

### 6.1 Volume e conversão

| Indicador | Definição |
| --- | --- |
| Movimento da loja | Interações no dia ou período, somadas às oportunidades novas, mostradas como dois números |
| Oportunidades novas | Oportunidades criadas no período, por segmento |
| Clientes únicos no mês | Clientes distintos atendidos, separados em novos e recorrentes |
| Taxa de conversão | Oportunidades com venda confirmada dividido por oportunidades novas, por safra e segmento |
| Venda média | Valor vendido confirmado dividido pelo número de vendas, por segmento |
| Itens por venda | Quantidade vendida dividida pelo número de vendas, dentro do segmento (peças ou ambientes), nunca somado entre segmentos |
| % de venda com especificador | Valor confirmado com especificador vinculado dividido pelo valor confirmado total |
| Orçamentos em aberto | Quantidade e valor por temperatura, com dias sem retorno e follow-ups atrasados |
| Vendas aguardando validação | Valor, quantidade e dias parados das vendas declaradas e não confirmadas |

### 6.2 Meta e projeção

| Indicador | Definição |
| --- | --- |
| Meta ajustada | Meta lançada reduzida pelos dias de ausência dos tipos com reduz\_meta |
| % atingido e quanto falta | Realizado confirmado contra a meta ajustada |
| Ritmo diário necessário | O que falta dividido pelos dias úteis restantes |
| Projeção do mês | Realizado confirmado mais a soma dos orçamentos abertos ponderados pela probabilidade |
| Erosão do orçamento | Primeiro orçamento contra último, por vendedora, segmento e especificador |

```latex
\text{projeção} = \text{realizado confirmado} + \sum_{i \in \text{abertas}} \text{valor orçado}_i \times P(\text{temperatura}_i,\ \text{segmento}_i)
```

P vem da estimativa inicial editável e passa a vir da taxa histórica da empresa (RN-L29). Quentes cujo mês de previsão já passou saem da soma até a revisão obrigatória.

### 6.3 Desconto

| Indicador | Cálculo | Para que serve |
| --- | --- | --- |
| Desconto real | Tabela conferida até o valor contratado | Base da trava de alçada |
| Over | Tabela conferida até o primeiro orçamento | Mede quem infla o orçamento para parecer dar mais desconto |
| Desconto aparente | Primeiro orçamento até o valor contratado | O que o cliente percebeu |
| Confiabilidade da tabela | Frequência com que o valor declarado pela vendedora bate com o conferido, e em que sentido diverge | Detecta over recorrente já na fase de orçamento |
| Desconto médio | Por vendedora, segmento e especificador | Política de desconto e margem de contribuição |

### 6.4 Fila e recepção

| Indicador | Definição |
| --- | --- |
| Vezes puladas | Vezes puladas dividido pelas vezes na vez, por vendedora, comparado com a equipe. Conta só o que a vendedora sinalizou |
| Pulos com cliente esperando | Pulos em que havia cliente aguardando na recepção |
| Disponível sem assumir | Vezes em que estava disponível e a recepção teve de passar para a próxima |
| Tempo indisponível | Por motivo e por vendedora |
| Motivo sem lastro (proposta) | Motivo declarado sem evidência no período, por exemplo fazendo orçamento sem orçamento lançado |
| Saldo de vezes | Atendimentos devidos pela fila, descontada a indisponibilidade, contra os recebidos. Atendimentos de carteira ficam fora |
| Carteira contra fila | Proporção de atendimentos vindos da carteira e do rodízio, por vendedora |
| Taxa de captação | Pessoas atendidas dividido pelas pessoas que entraram, por vendedora, turno e origem |
| Tempo de espera | Do registro da entrada até o início do atendimento |
| Demanda não atendida | Ranking de produtos procurados e não encontrados, mais a lista de espera por produto |
| Perdas pela fila | Saídas por “esperou demais”, cruzadas com o status das vendedoras naquele momento |
| Relatório por recepcionista | Desvios por turno, motivos, vendedoras mais e menos beneficiadas, edições manuais |

### 6.5 Perda e captação

| Indicador | Definição |
| --- | --- |
| Perdas por motivo e concorrente | Quantidade e valor, por segmento. Inclui diferença de preço quando o valor do concorrente ou o pretendido foi informado |
| Retorno por canal, origem e evento | Conversão e valor por canal de contato, por origem de captação e por evento |
| Clientes indicadores | Ranking de clientes que mais trouxeram oportunidades e vendas |

## 7. Parâmetros editáveis

Todos ficam na tabela Parametro ou em listas próprias, editáveis pelo gestor. Os valores abaixo são iniciais; “a definir” aparece também na seção 10.

| Parâmetro | Valor inicial | Situação |
| --- | --- | --- |
| Prazo máximo entre contatos | Quente 3 dias, Morno 10, Frio 21, iguais para soltos e planejados | Proposta. Recalibrar após 60 dias de uso |
| Probabilidade inicial de fechamento | Quente 80%, Morno 30%, Frio 5% | Proposta de partida, marcada na tela como estimativa inicial |
| Volume mínimo para usar histórico real | A definir | Pendência |
| Alçada de desconto por segmento | A definir | Pendência |
| Valor abaixo do qual a validação é dispensada | Desligado | Proposta |
| Prazo de alerta de venda declarada sem validação | A definir | Pendência |
| Canais de contato | Porta, WhatsApp, Instagram, telefone, e-mail, site | Decidido |
| Origens de captação | Especificador, indicação de cliente, campanha ou evento, passou em frente, já é cliente | Decidido |
| Concorrentes | Robusti, Breton, Ornare, Florense | Citados nas conversas, o gestor completa |
| Motivos de perda | Preço, concorrente, prazo, influência do especificador, condição de pagamento, desistência ou sem retorno, outro, mais a família sem orçamento, em dois níveis | Lista final a definir |
| Motivos de saída sem atendimento | Só conhecendo a loja, não encontrou o produto (qual), esperou demais, sem tempo ou volta depois, sem o decisor, outro | Proposta |
| Categorias de produto procurado | Sofá, mesa de jantar, berço, cama e as demais que o gestor cadastrar | Lista editável |
| Motivos de indisponibilidade | Atendimento agendado, fazendo orçamento, digitando pedido, intervalo | Proposta |
| Motivos de desvio da fila | Cliente pediu a vendedora, vendedora indisponível, volta de ausência | Proposta |
| Tipos de ausência e reduz\_meta | Férias, atestado e licença reduzem. Folga de prêmio, banco de horas e aniversário não reduzem | A regra está decidida; a lista de tipos é proposta |

## 8. Permissões e auditoria

A vendedora enxerga só a própria carteira, a recepção só a fila, e dado financeiro fica com quem valida e quem gere.

| Perfil | Vê | Faz |
| --- | --- | --- |
| Vendedora | Própria carteira, próprios indicadores e fila do dia. De cliente de outra carteira, só nome e responsável | Lança atendimentos, declara vendas, informa valor de tabela, marca disponibilidade |
| Recepção | Fila, status das vendedoras, dados mínimos do cliente. Nunca valores ou orçamentos | Registra entradas, encaminha, ordena a fila, edita disponibilidade. Tudo vai para o log |
| Administrativo ou financeiro | Vendas declaradas, checklist, valores de contrato e pagamento | Valida o checklist, confere o valor de tabela, confirma a venda |
| Gestor ou supervisor | Tudo da loja | Lança metas, aprova desconto e divisão de venda, transfere oportunidade, libera acesso temporário, edita parâmetros e listas |
| Administrador | Tudo, inclusive o log completo | Configuração geral |

O LogAcao é imutável e só gestor e administrador leem. A recepção sabe que ele existe. Salários, comissionamento e dados de RH não fazem parte deste módulo e ficam em camada de permissão própria.

## 9. Fora da v1 e fase 2

O modelo de dados da v1 já reserva o espaço para o que vem depois, para que a entrada deles não exija reestruturar tabelas.

| Item | Situação na v1 | O que entra depois |
| --- | --- | --- |
| Integração com WhatsApp | Registro manual por atalho. Campos de primeiro contato e primeira resposta existem e ficam nulos | API oficial: interações automáticas e tempo de resposta. Depende da decisão entre linha central e números individuais |
| Tabela de preços integrada | Valor de tabela declarado pela vendedora e conferido pela gestora | Valor de tabela calculado a partir da lista de preços, primeiro nos soltos de catálogo |
| Integração com ponto e RH | Presença pelo “cheguei”. Ausência lançada pelo gestor | Chegada vinda do ponto e TipoAusencia compartilhado com o módulo de RH |
| Folgas de prêmio automáticas | Lançadas pelo gestor | Concessão automática ao atingir a meta, depende da regra definida na seção 10 |
| Pós-venda | Gancho preservado: a oportunidade confirmada passa para o acompanhamento operacional (medição, fabricação, entrega, montagem) | Etapa derivada dos módulos operacionais |
| Ranking comparativo entre vendedoras | Ligar ou desligar é decisão do gestor | A definir |
| Margem de contribuição | Os dados de desconto real e tabela já são capturados | Cálculo de MC na aba de vendas |

## 10. Pendências e decisões em aberto

Nenhuma bloqueia o início da modelagem. As quatro primeiras bloqueiam a configuração dos parâmetros antes de entrar em produção.

| # | Pendência | Quem decide | Impacto |
| --- | --- | --- | --- |
| 1 | Regra das folgas de prêmio: em qual meta (mensal ou trimestral) cada tipo de folga é conquistado | Thiago | TipoAusencia e, na fase 2, concessão automática |
| 2 | Alçadas de desconto iniciais, por segmento | Thiago | Trava de confirmação (RN-L17) |
| 3 | Lista final de motivos de perda, de indisponibilidade da fila e de desvio da recepção | Thiago | Listas editáveis, valores iniciais da seção 7 |
| 4 | Critérios exatos do checklist: campos de cadastro completo, formato do contrato e campos de pagamento | Thiago com administrativo e financeiro | RN-L12 |
| 5 | Quem recebe a fila de cadastros pendentes de especificadores (diretoria de relacionamento ou gestor) | Thiago | Fluxo do especificador |
| 6 | WhatsApp: linha central ou números individuais | Thiago | Fase 2 |
| 7 | Prazo de alerta de venda declarada sem validação e perfil substituto de quem valida | Thiago | RN-L13 |
| 8 | Volume mínimo de vendas para a probabilidade passar a usar o histórico | Thiago com Leandro | RN-L29 |
| 9 | LGPD da lista de espera por produto: texto e registro de consentimento, e prazo de guarda do contato | Thiago com Leandro | ListaEsperaProduto |
| 10 | Confirmar a leitura de conversão por safra de criação para os dois segmentos, ou só para planejados | Thiago | Indicadores 6.1 |
| 11 | Em qual etapa existente do Kanban cada passagem da tabela 4.3 acontece | Porto com Thiago | Gates de campo obrigatório |

## 11. Anexo: o que a planilha atual revelou

Análise do arquivo de teste de uma vendedora (109 linhas com conteúdo). Vale como indício forte do comportamento, não como amostra completa da equipe. Foi a base das regras de validação deste documento.

| Achado | Dado | Regra que responde |
| --- | --- | --- |
| Linhas sem cliente (folga, feriado, não atendi) | 23 de 109 | Registro do dia separado (seção 3.3) |
| Segmento vazio | 27 de 86 clientes (31%) | Segmento obrigatório na criação (RN-L21) |
| Status vazio | 15 de 86 clientes (17%) | Etapa sempre definida no card |
| Orçamentos sem valor | 16 de 42 (38%) | Valor exigido ao enviar orçamento (seção 4.3) |
| Perdidos sem motivo | 4 de 4 | Motivo obrigatório (RN-L22) |
| Em aberto com próxima data | 2 de 48; 36 sem data e sem histórico | Próximo contato obrigatório (RN-L06) |
| Valor vendido com status ainda aberto | 12 linhas | Fechamento parcial na mesma oportunidade (RN-L04) |
| Valor vendido sem segmento | R$ 482 mil de R$ 1,27 mi (38%) | Venda declarada exige segmento herdado da oportunidade |
| WhatsApp e Instagram como procedência | 0 registros | Canal separado da origem (RN-L21) |
| Mesmo cliente em várias linhas | Até quatro linhas por cliente, com grafias diferentes | Interação dentro da oportunidade (RN-L01) |
| Especificador digitado à mão | Grafias diferentes, escritório misturado com pessoa, 2 casos de canal Arquiteto sem nome | Busca com sugestão e cadastro rápido (RN-L20) |
| Data digitada como texto | 1 caso que gerou erro em colunas calculadas | Campo de data real |

O histórico em texto livre de 33 linhas é o conteúdo mais valioso do arquivo, por exemplo uma venda de R$ 197 mil fechada após seis retornos em sete semanas. No Plannit esse texto vira linha do tempo de interações, com data, autor e tipo.
