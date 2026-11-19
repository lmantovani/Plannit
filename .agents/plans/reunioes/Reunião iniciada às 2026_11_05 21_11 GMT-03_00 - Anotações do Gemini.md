nov. 6, 2026

## **Reunião em 5 de nov. de 2026 às 21:11 GMT-03:00**

Registros da reunião [Transcrição](https://docs.google.com/document/d/13C7InJfvbRj2C_RLE3jRj6-1HHE_U_cl231jOZr80KM/edit?usp=drive_web&tab=t.qmq33chw1a4) 

### **Resumo**

Revisão de projetos e melhorias via alinhamentos estratégicos com definição de regras de atendimento e comissões.

**Refatoração e Histórico de Clientes**  
Revisão de arquivos na nuvem e correção na aba de clientes para exibir histórico.

**Fila e Fluxo de Atendimento**  
Criação de fila de atendimento matinal para coibir recusas e atalho para leads.

**Projeção e Regras de Vendas**  
Definição de parâmetros configuráveis para termômetro de orçamentos e registro de descontos.

### **Decisões**

## **Alinhada**

* **Histórico de interações no cadastro do cliente** A equipe alinhou a inclusão de um histórico unificado de interações diretamente no perfil do cliente, especificando o projeto correspondente.  
* **Fila de atendimento presencial com disponibilidade** Ficou acordado o uso de uma fila de atendimento presencial baseada em ordem de chegada com status de disponibilidade e registro de justificativa para saltos.  
* **Classificação configurável de temperatura de orçamentos** A equipe adotou a classificação de orçamentos por temperatura (quente, morno e frio) com parâmetros configuráveis.  
* **Quadro Kanban dedicado a móveis soltos** Os participantes alinharam a criação de um quadro Kanban específico para gerenciar o fluxo de móveis soltos.  
* **Atalho para encerramento de leads sem evolução** Foi aprovada a inclusão de um atalho no cadastro de leads para registrar o encerramento de atendimentos sem prosseguimento junto ao respectivo motivo.  
* **Regra de rateio de comissão de vendas** A equipe definiu o padrão de divisão de comissão de 60% para quem digita o pedido e 40% para quem efetua o fechamento.  
* **Conferência gerencial de preços de tabela** Ficou estabelecido que os vendedores declararão os preços de tabela dos pedidos para que a gestora realize a conferência e validação final.

### **Próximas etapas**

- [ ] \[Rafael Porto\] Ensinar uso da nuvem: Orientar Thiago sobre como transferir arquivos para o ambiente de nuvem.  
- [ ] \[Rafael Porto\] Analisar planilhas: Estudar os documentos enviados para compreender a dinâmica atual de registros de vendas.  
- [ ] \[Rafael Porto\] Criar tela de gestao: Desenvolver uma interface para controle de filas de atendimento e disponibilidade dos vendedores.  
- [ ] \[Rafael Porto\] Desenvolver quadro de moveis: Criar um quadro específico para o fluxo de vendas de móveis soltos no sistema.  
- [ ] \[Thiago Aguiar\] Alinhar ideias do projeto: Comparar e conciliar as diretrizes de projeto registradas na nuvem para garantir consistência.  
- [ ] \[Thiago Aguiar\] Finalizar Tarefas: Concluir as pendências de desenvolvimento discutidas.  
- [ ] \[Thiago Aguiar\] Gravar Vídeo: Produzir um material audiovisual explicando a planilha caso o acesso falhe.  
- [ ] \[Thiago Aguiar\] Enviar Anotações: Revisar as notas pessoais e encaminhar informações relevantes para Rafael.  
- [ ] \[Thiago Aguiar\] Desenvolver Especificadores: Trabalhar na implementação da funcionalidade dedicada aos especificadores.

### **Detalhes**

**Refatoração do Arquivo de Projeto e Nuvem**: Thiago Aguiar relatou que refez o arquivo na nuvem com o auxílio de um desenvolvedor, o qual formulou 26 perguntas para estruturar os requisitos. Rafael Porto apontou que há itens já implementados e algumas incongruências leves, e ambos discutiram a necessidade de alinhar e unificar as ideias e versões dos arquivos ([00:00:10](#00:00:10)) ([00:02:45](#00:02:45)).

---

**Ausência do Histórico de Interações na Aba de Clientes**: Thiago Aguiar identificou uma falha no sistema atual em que a aba de cadastro de clientes não exibe o histórico de interações, o último contato ou orçamentos em aberto, exigindo a navegação manual pelo quadro Kanban ([00:04:16](#00:04:16)). Rafael Porto e Thiago Aguiar alinharam que essas interações devem constar diretamente no perfil do cliente, identificando o projeto correspondente a cada registro, como um atendimento via WhatsApp ([00:05:46](#00:05:46)) ([00:44:53](#00:44:53)).

---

**Status de Desenvolvimento e Módulos do Sistema**: Rafael Porto listou os componentes já desenvolvidos no sistema, que incluem o prontuário e histórico de clientes, integração com CRM, múltiplos projetos por membro ou cliente, módulo de especificadores, Kanban de múltiplos quadros, travas obrigatórias de avanço no funil, agenda de compromissos e histórico imutável ([00:07:47](#00:07:47)).

---

**Fila de Atendimento na Recepção**: Thiago Aguiar apresentou a proposta de criar uma fila de atendimento matinal baseada na ordem de chegada dos vendedores à loja para coibir recusas públicas de atendimento aos clientes ([00:07:47](#00:07:47)). Rafael Porto, Thiago Aguiar e Leandro Mantovani debateram o funcionamento do recurso, no qual cada vendedor registrará o atendimento para retornar ao fim da fila e poderá sinalizar indisponibilidade quando ocupado ([00:10:52](#00:10:52)). O grupo entrou em consenso sobre manter flexibilidade para que vendedores atendam clientes diretos ou indicados por arquitetos independentemente da posição na fila, com o registro de justificativas para inibir favorecimentos da recepção ou descompromisso da equipe ([00:13:09](#00:13:09)).

---

**Cadastro Inicial de Leads e Atendimento de Showroom**: Diante da dificuldade histórica da recepcionista em capturar dados iniciais dos clientes, discutiu-se o fluxo para visitantes de showroom que não evoluem para um orçamento, como pessoas que buscam produtos não comercializados (a exemplo de berços) ou desistem devido aos preços ([00:17:19](#00:17:19)) ([00:24:33](#00:24:33)). Rafael Porto propôs criar um atalho na tela de cadastro de novos leads com a opção de encerramento por falta de evolução e um campo obrigatório para o motivo, evitando a criação de fluxos paralelos e burocráticos ([00:25:39](#00:25:39)) ([00:29:38](#00:29:38)).

---

**Termômetro de Orçamentos e Projeção de Vendas**: Thiago Aguiar descreveu a metodologia de classificação subjetiva de orçamentos utilizada pelos vendedores, dividida entre quentes (alta probabilidade de fechamento no mês, com conversão estimada em 70% a 80%), mornos (propensos a fechar no mês seguinte, com conversão de 30% a 35%) e frios (interesse sem urgência, com conversão de 5% a 10%) ([00:18:18](#00:18:18)). Rafael Porto e Thiago Aguiar decidiram tornar esses parâmetros configuráveis e exibir as projeções financeiras no painel dos vendedores ([00:19:57](#00:19:57)).

---

**Separação de Quadros para Móveis Planejados e Móveis Soltos**: Thiago Aguiar destacou que o fluxo de móveis soltos é mais simples e distinto da jornada complexa de móveis planejados, que envolve briefings, filas, projetos e renderizações. Rafael Porto sugeriu a criação de um quadro específico para móveis soltos para acomodar adequadamente essa modalidade de venda ([00:23:00](#00:23:00)) ([00:37:04](#00:37:04)).

---

**Gestão de Vendas, Descontos e Preços de Tabela**: Thiago Aguiar explicou uma prática comercial onde os vendedores elevam o preço de tabela de produtos (por exemplo, adicionando 30%) para clientes específicos ou conhecidos, viabilizando a aplicação de descontos maiores (como 40%) sem penalizar as comissões ([00:38:25](#00:38:25)). Rafael Porto e Thiago Aguiar acordaram que o sistema registrará o valor de tabela declarado pelo vendedor e o valor conferido ou aprovado pela gestora, garantindo a auditoria correta do desconto efetivo concedido ao cliente ([00:41:52](#00:41:52)).

---

**Rateio de Comissões e Restrição de Acesso a Carteiras**: Foi abordada a regra de rateio de comissões em casos de transferência de atendimento por férias ou desligamento de funcionários, adotando critérios definidos como 60% para quem digita o pedido e 40% para quem efetue o fechamento, além de ajustes customizados conforme o caso ([00:34:28](#00:34:28)). Adicionalmente, estabeleceu-se que o acesso às carteiras de clientes será restrito por perfil para impedir que vendedores visualizem vendas de colegas, mantendo a visibilidade total apenas para gestores e administradores ([00:35:42](#00:35:42)).

---

**Próximos Passos e Alinhamentos Finais**: Rafael Porto confirmou que resolverá o problema de download das planilhas e focará no desenvolvimento inicial das melhorias de interações, fila de atendimento, termômetro e atalhos de não evolução ([00:44:09](#00:44:09)). Thiago Aguiar revisará as anotações físicas na loja no dia seguinte, enviará novos direcionamentos e iniciará o trabalho no módulo de especificadores ([00:46:08](#00:46:08)).

*Revise as anotações do Gemini para checar se estão corretas. [Confira dicas e saiba como o Gemini faz anotações](https://support.google.com/meet/answer/14754931)*

*Como está a qualidade de **destas observações?** [Responda a uma breve pesquisa](https://google.qualtrics.com/jfe/form/SV_5bXzKQfylMIhSXc?confid=4iZDygFm-h7QwAPaKCMdDxIROBEQAjIGCIoCIAAYBQg&detailLevel=standard&hasImages=False&entryPoint=footerMain&isGoogler=False&lang=pt-BR) para nos dar seu feedback, incluindo o quanto as observações foram úteis para o que você precisa.*

nov. 6, 2026

## **Reunião em 5 de nov. de 2026 às 21:11 GMT-03:00 \- Transcrição**

### **00:00:10** {#00:00:10}

**Rafael Porto:** Aquele arquivo que você passou o ponto MD e PDF, ele é um antigo, né? Ele já existia.

**Thiago Aguiar:** Não, eu peguei o mesmo cl, o mesmo cloud que eu tinha feito antigamente e comecei a refazer ele.

**Rafael Porto:** Ah, tá.

**Thiago Aguiar:** para falando pro para ele que eu ia te enviar para você, entendeu? Que a gente falei lá no no Cloud que a gente contratou um desenvolvedor e tal, que ele que eu precisava explicar para ele o que que a gente queria fazer.

**Rafael Porto:** Uhum.

**Thiago Aguiar:** Aí ele foi refazendo, ele fez 20 e tantas perguntas, 26 perguntas eu acho que foi.

**Rafael Porto:** Entendi. É porque várias coisas já estão feitas.

**Thiago Aguiar:** É.

**Rafael Porto:** E aí tem algumas incongruências também, mas coisa tranquila.

**Thiago Aguiar:** É, então o que eu até tinha falado depois para tentar pegar o arquivo e jogar no meu cloud era justamente isso, porque tem coisa que eu sei que às vezes você fez e também tem coisa que lá atrás eu tive uma ideia e agora eu já tive outra, eu nem lembro da ideia que eu tinha tido.

### **00:01:16**

**Rafael Porto:** Hum.

**Thiago Aguiar:** Aí eu nem sei qual que é melhor também.

**Rafael Porto:** Não, tranquilo.

**Thiago Aguiar:** Aí precisava bater depois disso.

**Rafael Porto:** permiti o Leandro entrar e

**Thiago Aguiar:** Nossa,

**Rafael Porto:** olha aí,

**Thiago Aguiar:** que cara bonito, velho.

**Rafael Porto:** rapaz. O bicho tava dormindo, ó, cara.

**Leandro Mantovani:** Dormi nada.

**Thiago Aguiar:** Rapaz,

**Leandro Mantovani:** Acabei de sair de banho. Aqui o cabelinho molhado.

**Thiago Aguiar:** não parece que parece que pegaram ele na pancada, velho. Aí, ó.

**Leandro Mantovani:** Sabe onde que pegar? Já mandei o Porto pegar no meu pau hoje.

**Thiago Aguiar:** Olha,

**Leandro Mantovani:** Vou mandar você também.

**Rafael Porto:** tá estressado hoje.

**Leandro Mantovani:** Não,

**Rafael Porto:** T F.

**Leandro Mantovani:** eu sou sempre estressado.

**Thiago Aguiar:** não parece que bateram nele e estragaram velório. Olha lá.

**Leandro Mantovani:** Já se olhou no espelho ultimamente, Thiago?

**Rafael Porto:** M.

**Leandro Mantovani:** Acho que você tem espelho na sua casa, né? Bom, só para saber.

**Thiago Aguiar:** Tô brincando. Você tá lindo. Olha lá.

**Leandro Mantovani:** Eu tô cansado, tá f\*\*\*. E aí, gente?

### **00:02:45** {#00:02:45}

**Thiago Aguiar:** E aí, eu tava falando pro pro Porto, depois ele vai me ensinar a pegar o arquivo para eu jogar no cloud lá, para eu ir fazendo as coisas, porque igual eu falei, às vezes muda de ideia ou se não tem uma ideia melhor ou se Não tenho uma ideia pior do que a que tinha tido e não lembra da anterior. Então eu preciso pegar e bater as coisas certinho.

**Rafael Porto:** Qual que é o link? O link mesmo do projeto na nu. Esqueci.

**Thiago Aguiar:** Eh,

**Leandro Mantovani:** Deixa eu pegar aqui.

**Thiago Aguiar:** planite, como é que eu mando aqui?

**Rafael Porto:** Manda aqui para mim.

**Thiago Aguiar:** Mais opções, mensagens na chamada.

**Leandro Mantovani:** Hum. Hum. Pega no meu pau. Cadê o RL?

**Thiago Aguiar:** Deixa, deixa a aberta, pra gente ver você.

**Leandro Mantovani:** Não, vocês continuar s de mim. Vocês estão muito mal educadinho. M.

**Rafael Porto:** Sim. E aí, você ficou de mexer e me dá um feedback do de como tá, do que precisa melhorar, do que já foi desenvolvido?

**Thiago Aguiar:** Cara, eu dei uma mexida, só que tô com bo que é as coisas que eu anotei não estão comigo,

### **00:04:16** {#00:04:16}

**Rafael Porto:** Угу.

**Thiago Aguiar:** porque hoje eu vim direto do eu saí na hora do almoço e meu computador ficou lá. lá na empresa. Deixa eu ver se eu tenho alguma coisa anotado aqui. Não, mas assim, no geral, ô Porto, tá tá ficando muito bom. Eu eu tinha visto, cadê uma? Eu lembro que lembrando aqui agora, fuçando, eu lembro que na aba de cliente, deixa eu ver aqui, é, era isso. Quando eu abro a aba cliente aqui,

**Rafael Porto:** Sim.

**Thiago Aguiar:** ele não me dá, ele não tá aparecendo para mim as interações que eu tive com ele. Lembra que a gente tinha falado de colocar uma um campo aqui?

**Rafael Porto:** Ah, tá.

**Thiago Aguiar:** Porque pode ser que eu não vou vir nesse cliente lá pela aba, lá pelo Camban,

**Rafael Porto:** Uhum.

**Thiago Aguiar:** pode ser que eu procure direto ele aqui no cadastro, né? E aí entre, abra o cadastro dele e aí eu queira ver os as interações que a gente teve com ele aqui no aqui.

**Rafael Porto:** Sim.

**Thiago Aguiar:** Qual foi a última vez que fez contato, quais são os orçamentos que estão em aberto, que tá aqui embaixo, né?

### **00:05:46** {#00:05:46}

**Thiago Aguiar:** Mas faltou essa parte da aba do

**Rafael Porto:** Aqui você aqui você tem um projeto, você consegue ver o projeto, né? Mas você não sabe quais foram as interações que você teve no projeto.

**Thiago Aguiar:** Isso.

**Rafael Porto:** Como ele pode ter mais de um projeto, essas interações acho que tem que ficar dentro do projeto, né?

**Thiago Aguiar:** Não, não precisaria exatamente, mas poderia tá, por exemplo, dentro da aba cliente. E aí cada interação, por exemplo, assim, ah, interação na data tal referente ao projeto tal, entendeu?

**Rafael Porto:** Mhm.

**Thiago Aguiar:** Então, tipo assim, WhatsApp do projeto 2026,

**Rafael Porto:** Entendi.

**Thiago Aguiar:** entendeu?

**Leandro Mantovani:** M.

**Rafael Porto:** Especificando projeto.

**Leandro Mantovani:** Humum. Especificando especificador.

**Rafael Porto:** Beleza, você lembra? É isso agora, né?

**Thiago Aguiar:** É, calma que eu tô dando uma mexida aqui para eu ver se eu lembro. Aqui já tem o negócio de configurar campanhas. OK. Auto atribuir ao criador list. Eh, no geral, você tem alguma dúvida do que a gente

**Rafael Porto:** É, então agora eu preciso saber qual caminho que eu vou seguir, que aí você passou esse arquivo aqui, mas você falou também que vai dar uma uma geral nele ainda, né?

### **00:07:47** {#00:07:47}

**Rafael Porto:** Eu joguei ele aqui,

**Thiago Aguiar:** Ah, não, esse daí já tá certo. Certo? Esse aí você pode,

**Rafael Porto:** esse arquivo.

**Thiago Aguiar:** é, esse aí você já pode considerar porque eu já peguei ele,

**Rafael Porto:** Beleza.

**Thiago Aguiar:** eu já peguei ele em cima das coisas que eu tinha feito e refiz ele todo de novo.

**Rafael Porto:** Hum. Eu, o que que eu fiz?

**Thiago Aguiar:** Eu agora

**Rafael Porto:** Eu pedi para analisar aqui tudo que já foi desenvolvido.

**Thiago Aguiar:** Aham.

**Rafael Porto:** Então, ó, prontuário do cliente histórico, integração com CRM, eh, múltiplos projetos por membro cliente, módulo de especificadores, o camban de multiquadros, travas obrigatórias de avanço no funil, agenda de encontro compromissos e auditoria e imutabilidade, que é a parte do histórico.

**Thiago Aguiar:** Entendi.

**Rafael Porto:** O que não foi essa recepção em fila em vez de L? Como que é isso aqui?

**Leandro Mantovani:** He.

**Thiago Aguiar:** Deixa eu ver. É porque é o seguinte, qual que é a minha ideia? Todo dia de manhã e os vendedores eles entram como se fosse numa fila para atender os clientes que vão entrar pela porta.

### **00:08:57**

**Rafael Porto:** Tá.

**Thiago Aguiar:** Tá? Então essa fila ela é por ordem de chegada na loja.

**Rafael Porto:** de chegada de quem?

**Thiago Aguiar:** Tem um vendedor que de chegar do vendedor.

**Rafael Porto:** Do vendedor.

**Thiago Aguiar:** Então o primeiro vendedor a chegar na loja, ele é o primeiro a atender o cliente que ele a o primeiro a atender o primeiro cliente que entrar na loja, entendeu?

**Rafael Porto:** Uhum.

**Leandro Mantovani:** Mas como é que você regula isso, cara?

**Thiago Aguiar:** Oi?

**Leandro Mantovani:** Os cara obedece isso aí.

**Thiago Aguiar:** É, eles mesmos se gerenciam lá, eles sabem quem chegou e tipo assim, ah, você chegou depois de mim, então você é depois de mim. Só que quando eu mandei minha recepcionista embora. Eu vou contratar só em janeiro, que ela era petista. Tô brincando. Foi só por isso não.

**Leandro Mantovani:** Ah, eu fiquei tão feliz por um momento.

**Rafael Porto:** Faltou você, Leandro, no dia seguinte, velho. Ser de férias.

**Leandro Mantovani:** Por que que aconteceu?

**Rafael Porto:** Ah, para ver, né? O C velho, sensação ruim. Parece que morreu alguém da família,

### **00:09:55**

**Leandro Mantovani:** O CO tava transtornado junto comigo. M.

**Rafael Porto:** cara. Eu tava triste, viu?

**Thiago Aguiar:** E a e aí eh a minha ideia era que essa recepcionista ela administrasse essa fila também, entendeu? Então, que na tela da recepcionista ela pudesse elencar quem que é o próximo da vez ou não e na tela do vendedor tivesse uma tela que falasse, tipo assim, ó, você é o próximo da vez, você tá disponível para atendimento ou não?

**Rafael Porto:** Entendi.

**Thiago Aguiar:** Porque às vezes ele pode ele pode estar ocupado fazendo um orçamento e não quer atender.

**Leandro Mantovani:** Mhm.

**Rafael Porto:** Uhum.

**Thiago Aguiar:** Então ele coloca lá que ele não tá disponível e aí automaticamente a recepcionista saberia que não precisa chamar aquela pessoa, ela vai chamar outra. Porque qual que era um problema que eu tinha na loja? O cliente entra aí é a recepcionista atende,

**Leandro Mantovani:** Sai andando. Não.

**Thiago Aguiar:** aí a recepcionista vai lá na mesa do vendedor e fala assim: "Ô fulano, vem atender aí" ela fala: "Ah, não, não vou atender não, é o outro".

### **00:10:52** {#00:10:52}

**Thiago Aguiar:** Aí vai lá no outro, o outro fala: "Ah, não, também não vou não." E aí o cliente olhando, tipo assim, todo mundo recusar o atendimento, sabe?

**Rafael Porto:** Nossa, c\*\*\*\*\*\*.

**Thiago Aguiar:** É desse jeito

**Leandro Mantovani:** É funcionário. É um trem complicado, bicho.

**Rafael Porto:** Então, na verdade vai ser uma um uma tela gerenciada pelo recepcionista,

**Thiago Aguiar:** isso

**Rafael Porto:** mas quando o vendedor acabar o atendimento, ele que vai colocar que ele tá disponível ou não? Ou ou é recepcionista?

**Thiago Aguiar:** pode ser recepcionista, na verdade assim. Aí beleza, pode ser o próprio vendedor por o vendedor.

**Leandro Mantovani:** Cara, mas não faz sentido ser recepcionista,

**Thiago Aguiar:** É,

**Leandro Mantovani:** porque ele tem quear,

**Rafael Porto:** Eh,

**Thiago Aguiar:** então é é o vendedor.

**Rafael Porto:** Угу.

**Leandro Mantovani:** às vezes ele tá lá e tá, ele terminou de atender o cara e já ficou de mandar alguma coisa pro cara, aí já tá lá fazendo alguma coisa,

**Thiago Aguiar:** É, não.

**Leandro Mantovani:** entendeu?

**Thiago Aguiar:** E o vendedor ele tem que registrar o atendimento, entendeu?

**Rafael Porto:** Угу.

**Thiago Aguiar:** Então tem que ser realmente o vendedor, porque aí ele registra o atendimento, fala que que o cliente veio buscar, se fez orçamento ou não, se já perdeu ou não, entendeu?

### **00:11:49**

**Thiago Aguiar:** Qual que é a próxima ação para entrar ali na carteira dele de orçamento?

**Rafael Porto:** Tá disponí. nível vendedor marca disponibilidade

**Thiago Aguiar:** E aí, automaticamente, quando o vendedor registra o atendimento,

**Rafael Porto:** e Uhum.

**Thiago Aguiar:** ele vai pro final da fila.

**Rafael Porto:** Mas a recepcionista que vai marcar que o vendedor tá ocupado, né? Ela pode marcar

**Thiago Aguiar:** Ela pode marcar ou o próprio vendedor pode marcar também.

**Rafael Porto:** isso.

**Thiago Aguiar:** A questão é que, tipo assim, tem que tomar cuidado para recepcionista não beneficiar algum vendedor, entendeu?

**Rafael Porto:** Mhm.

**Thiago Aguiar:** Sei lá, marcar que o cara tá ocupado, ele não tá.

**Leandro Mantovani:** Mas será que faz sentido a gente deixar deixar o lugarzinho do Bom, acho que aí não, aí não dá, né?

**Thiago Aguiar:** Não sei, você não falou.

**Leandro Mantovani:** Não, eu tava pensando deixar um lugarzinho assim onde que ela pudesse colocar a gestão da fila lá de ordem chegada, entendeu?

**Thiago Aguiar:** Hum. Eu tinha pensado tipo uma lista de arrastar mesmo, sabe? nome dos vendedores.

**Rafael Porto:** É, o problema é travar isso,

**Thiago Aguiar:** Ela

### **00:13:09** {#00:13:09}

**Rafael Porto:** porque por algum motivo o cara não pode atender na hora ele tá como disponível, mas ele não pode atender. Aí você não tem como travar, você tem que deixar passar na frente, né? Tem tem que ter essa flexibilidade.

**Thiago Aguiar:** sim. E assim como pode chegar um vendedor, por exemplo, vamos supor que eu sou o último vendedor da fila,

**Rafael Porto:** Uhum.

**Thiago Aguiar:** só que aí chega um cliente que já é meu também.

**Rafael Porto:** Isso.

**Thiago Aguiar:** ou que é de um arquiteto que eu atendo, então eu pulo à frente de todo mundo, entendeu?

**Leandro Mantovani:** É porque cara,

**Rafael Porto:** Uhum.

**Leandro Mantovani:** o cara já vai chegar lá te procurando também,

**Thiago Aguiar:** E aí depois é e exato.

**Leandro Mantovani:** né?

**Thiago Aguiar:** Às vezes foi uma indicação. Ah, eu tô atrás do vendedor Thago.

**Rafael Porto:** É o o que dá para fazer, sabe o que que é? Vai ter a fila. Beleza. Eh, se o se o cara da é um cliente novo, não é um que já foi atendido alguma vez, é um cliente novo e aí ela pula o cara que seria o próximo da fila, gera um registro e vai gerando esses registros.

### **00:14:10**

**Thiago Aguiar:** Sim.

**Rafael Porto:** E aí você pode depois e aí pode ter uma um campo para justificativa do por

**Thiago Aguiar:** É exato.

**Rafael Porto:** pulou.

**Thiago Aguiar:** Porque aí o que que vai acontecer?

**Rafael Porto:** Угуm.

**Thiago Aguiar:** A minha ideia é que eu tenha registrado, tipo assim, quantas vezes no mês o vendedor tal atendeu e geralmente é mais ou menos igual, entendeu? O que acontece às vezes de um vendedor ter mais atendimento que o outro, é porque, vamos supor, se todo dia eu sou o primeiro a chegar, eu vou, pelo menos, se entrar um cliente por dia só, eu vou ter pelo menos 20 clientes atendidos no mês.

**Rafael Porto:** Угу.

**Thiago Aguiar:** Agora, se eu sou sempre o último a chegar e tem cinco vendedor, nem todo dia eu vou atender. Cliente de porta, no caso, né?

**Rafael Porto:** Sim.

**Thiago Aguiar:** Nem todo dia eu vou atender, então eu tenho menos oportunidade. Então acontece que o vendedor que chega primeiro vai ter 20 atendimento no mês e o que chega por último vai ter uns 12, entendeu?

**Rafael Porto:** Entendi.

**Thiago Aguiar:** Então isso e é

### **00:15:10**

**Rafael Porto:** Não dá para fazer isso. A gente coloca porque aí você vai

**Leandro Mantovani:** Mas a gente tem que tomar, ó, calma aí. Vamos só tomar cuidado.

**Rafael Porto:** tá falhando.

**Thiago Aguiar:** tá falhando, tá falhando.

**Leandro Mantovani:** Vai ser simples. Alô,

**Rafael Porto:** Falhou tudo o que você falou,

**Leandro Mantovani:** alô,

**Rafael Porto:** Leandro.

**Thiago Aguiar:** É, não entendi nada.

**Leandro Mantovani:** alô, alô, alô. Tão escutando agora?

**Rafael Porto:** Fala. Sim.

**Leandro Mantovani:** Alô. Pera aí, pera aí, pera aí que eu tô num ponto do quarto que o Wi-Fi não pega muito bem.

**Rafael Porto:** Não,

**Leandro Mantovani:** Deixa eu vir mais na frente aqui.

**Rafael Porto:** mas agora a gente tá te escutando. Você

**Leandro Mantovani:** Falei assim, vamos só tomar cuidado que às vezes a gente pode estar problematizando demais um negócio que é simples, entendeu?

**Thiago Aguiar:** Sim.

**Rafael Porto:** vai falar mais alguma coisa?

**Leandro Mantovani:** Não, só falei isso.

**Thiago Aguiar:** É, só falou só, só falou m\*\*\*\*. Tô brincando, tô brincando.

**Rafael Porto:** Não, não. Então deixar flexível mesmo.

### **00:16:17**

**Rafael Porto:** Vai ter lá uma filhinha, tá? O com o tá verdinho disponível o vendedor, ele é o próximo e tem a lista do dos que estão logo a seguir. Ah, ele não,

**Thiago Aguiar:** Sim.

**Rafael Porto:** ele tá verdinho, mas não vai atender. Aí ela só vai só coloca uma justificativa do porquê que aí você inibe tanto o que o falou da recepcionista tá dando preferência para alguém quanto algum vendedor que tá fazendo corpo mole.

**Thiago Aguiar:** Tem exato.

**Rafael Porto:** Só isso não. E não é obrigado a gerar justificativa, né?

**Thiago Aguiar:** É aí sobre a questão da fila é essa. Por quê? Eu preciso registrar quantos atendimentos o cara fez no mês.

**Rafael Porto:** Uhum.

**Thiago Aguiar:** Eu preciso saber eh porque às vezes eu uso isso, tipo assim, olha aqui, ó. Você não tá vendendo, mas você atendeu 10 clientes no mês, o seu coleguinha atendeu 20, entendeu? E aí vai,

**Rafael Porto:** Agora uma dúvida. Vai chegar essa pessoa recepcionista? Você já vai pegar os dados iniciais dessa pessoa e cadastrá-lo como leader ou o vendedor que vai fazer isso?

### **00:17:19** {#00:17:19}

**Thiago Aguiar:** cara, é muito difícil a recepcionista conseguir esses dados hoje do jeito que está.

**Rafael Porto:** Tá.

**Thiago Aguiar:** E foi até um dos motivos também que a gente mandou a menina embora, porque ela não conseguia pegar dado, ela não fazia acompanhamento depois do lead,

**Rafael Porto:** Uhum.

**Thiago Aguiar:** sabe?

**Rafael Porto:** Mas eu falo inicial mesmo,

**Thiago Aguiar:** Então eu não sei.

**Rafael Porto:** seria tipo assim nome e telefone da pessoa,

**Thiago Aguiar:** É,

**Rafael Porto:** depois Oi,

**Thiago Aguiar:** então é aí é aí eu penso que é o cliente quer de não sei de pensar porque assim como o vendedor tem que registrar atendimento, ele pode pegar o registro que a própria recepcionista fez e melhorar ele. Ne. né? Ou ele mesmo lança quando for atendimento de porta.

**Rafael Porto:** Uhum.

**Thiago Aguiar:** Agora, quando é atendimento de WhatsApp, aí a recepcionista tem que lançar,

**Rafael Porto:** Tá.

**Thiago Aguiar:** que aí ela faz o registro, encaminha para alguém.

**Rafael Porto:** Uhum. Não, então, mas nesse caso de porta, qualquer um dos dois pode lançar,

**Thiago Aguiar:** É,

**Rafael Porto:** né?

**Thiago Aguiar:** eu acho que qualquer um pode lançar.

### **00:18:18** {#00:18:18}

**Rafael Porto:** Tá. Tá beleza.

**Thiago Aguiar:** É sobre esse termômetro aí é que é o seguinte, o vendedor hoje ele classifica meio que por feeling mesmo, eh, se é um orçamento quente, morno, frio.

**Rafael Porto:** Mhm.

**Thiago Aguiar:** Basic aí, por exemplo, eu coloco, eu considero assim, quente é o que tem grande chance de fechar dentro do mês. Morno, tipo assim, o cliente vai fechar, mas não vai ficar, tá bem propenso a fechar, mas vai virar o mês, por exemplo. E frio é o cara que tá tem interesse, mas tá sem pressa. E aí eu faço uma conta meio meio de padaria, tipo assim, tudo que é quente tem 70% de chance de fechar. Tudo que é morno tem 20% de fechar ou 30,

**Rafael Porto:** Угу.

**Thiago Aguiar:** por exemplo. E tudo que é frio tem 5% de chance de fechar. Então, se o cara tem 1 milhão total em aberto, sendo que uma parte é quente, outra é morno e outra é frio, a perspectiva de fechamento dele pro mês é tanto,

**Rafael Porto:** Tá.

**Thiago Aguiar:** entendeu? E aí faz uma probabilidade de uma projeção de vendas.

### **00:19:57** {#00:19:57}

**Rafael Porto:** Mas se calculando, você fala 5%, aí você vai pegar 5% do valor ou não?

**Thiago Aguiar:** É, então, por exemplo, assim, ó,

**Rafael Porto:** Não é

**Thiago Aguiar:** vamos supor que tem três orçamento, 3 milhões em orçamento, 1 milhão quente, 1 milhão morno e 1 milhão frio.

**Rafael Porto:** sim.

**Thiago Aguiar:** Do o que é frio, vamos supor que eu considere 10 para facilitar a conta. 10% eu vou considerar uma conversão dos frios. Então, de 1 milhão de frio, 100.000, do morno 30%, 300.000.

**Rafael Porto:** É,

**Thiago Aguiar:** E do quente 70%.

**Rafael Porto:** beleza. Uhum.

**Thiago Aguiar:** Então vai ficar 1 milhão de 3 milhões de orçamento,

**Rafael Porto:** Isso mesmo.

**Thiago Aguiar:** entendeu?

**Rafael Porto:** Uhum. Entendi. Mas hoje é 5%. Quanto?

**Thiago Aguiar:** Isso hoje eu considero assim 80

**Rafael Porto:** 80 35\.

**Thiago Aguiar:** 30 e 5\. Isso.

**Rafael Porto:** Beleza, só para anotar aqui a gente coloca Aham.

**Thiago Aguiar:** Mas deixa isso configurável.

**Rafael Porto:** E o próprio vendedor classifica como como quente morno.

**Thiago Aguiar:** Isso. Isso,

**Rafael Porto:** o frio.

**Thiago Aguiar:** isso.

### **00:20:59**

**Thiago Aguiar:** Próprio vendedor classifica aí. O risco aí é tipo assim, o cara não ter uma percepção bacana, entendeu?

**Rafael Porto:** Uhum. E aí, isso a gente veria onde? Qual que seria o lugar legal para ver isso? Hum,

**Thiago Aguiar:** seria tipo no dashboard do vendedor na parte de

**Rafael Porto:** tá.

**Thiago Aguiar:** eh é tipo assim,

**Rafael Porto:** a parte do vendedor, você ia ver um dashboard da

**Thiago Aguiar:** a perspectiva de sei lá, orçamentos quentes, orçamentos frios, orçamentos mornos,

**Rafael Porto:** Uhum.

**Thiago Aguiar:** perspectiva de fechamento,

**Rafael Porto:** Porque a gente tem,

**Thiago Aguiar:** orçamento,

**Rafael Porto:** a gente tem esse dashboard principal aqui,

**Thiago Aguiar:** valor total,

**Rafael Porto:** né,

**Thiago Aguiar:** É,

**Rafael Porto:** que aí dava para mostrar o geral e aí você pode filtrar pro vendedor aqui mesmo.

**Thiago Aguiar:** isso pode ser. É, eu até tinha pensado dessa, de tudo isso que a gente tá falando, ele tá dentro de uma nova nova fictory aí.

**Rafael Porto:** A nova feature.

**Thiago Aguiar:** É fictory fala, né?

**Rafael Porto:** É, mas na verdade tudo que a gente desenvolve feature,

### **00:22:02**

**Thiago Aguiar:** É isso.

**Rafael Porto:** né? Mas você fala de uma nova aba aqui, né? De um de um novo

**Thiago Aguiar:** Numa nova aba, tipo chamada, eu não lembro como que eu tinha colocado, acompanhamento de carteira, alguma coisa assim.

**Rafael Porto:** essa parte de termômetro,

**Thiago Aguiar:** Não, não. Tudo desde atendimento.

**Rafael Porto:** a fila também.

**Thiago Aguiar:** É porque assim, tudo isso que eu tô te falando,

**Rafael Porto:** Uhum.

**Thiago Aguiar:** ele acontece antes de virar venda, entendeu?

**Rafael Porto:** Tá.

**Thiago Aguiar:** aquelas aquele cambia, aquelas coisas que a gente fez, maioria depois que v que vira venda, entendeu? Então,

**Rafael Porto:** Uhum.

**Thiago Aguiar:** qual que era a minha ideia?

**Rafael Porto:** Mais ou menos,

**Thiago Aguiar:** Fazer essa gestão.

**Rafael Porto:** né? Porque essa parte aqui do lead antes de virar venda, né?

**Thiago Aguiar:** É isso. Só que aí por aqui, ó, a partir do fila de Não, fila de projeto, sem projeto. É tudo que tá aí. É, não, toda essa parte até lá na frente, finalização renderizada aí ainda não virou venda, não

### **00:23:00** {#00:23:00}

**Rafael Porto:** Isso.

**Thiago Aguiar:** é?

**Rafael Porto:** Porque como ele entra como lead, não é venda, né?

**Thiago Aguiar:** É, não tô pensando aqui. É porque isso aqui é só para é para planejado, entendeu? No móvel solto,

**Rafael Porto:** Ah, tá.

**Thiago Aguiar:** ele meio que entra novo lead, ele não tem briefing, não tem fila, não tem projeto, não tem renderização, é só, ele só vira um orçamento, às vezes faz o projeto, às vezes não. O fluxo do móvel solto é bem diferente.

**Rafael Porto:** Uhum.

**Thiago Aguiar:** Ele é mais básico assim, sabe? O cara vai e orça.

**Rafael Porto:** Então, seria legal criar um outro quadro,

**Thiago Aguiar:** É.

**Rafael Porto:** porque a gente você cria o quadro de móveis soltos.

**Thiago Aguiar:** Uhum. M.

**Leandro Mantovani:** M.

**Thiago Aguiar:** Entendi.

**Rafael Porto:** Não, uma ideia, não sei se você concorda.

**Thiago Aguiar:** Aham. É, não,

**Rafael Porto:** Да.

**Thiago Aguiar:** acho que vai ser legal ter o quadro de móvel solto, mas eu não sei porque assim, esse esse pré que eu tô falando, por exemplo, aí foram todos os clientes que entraram e concordaram em fazer um projeto ou em fazer um orçamento.

### **00:24:33** {#00:24:33}

**Thiago Aguiar:** Mas tem clientes que às vezes entra na loja que o cara entra, por exemplo, ah, vim aqui procurar um berço.

**Rafael Porto:** M.

**Thiago Aguiar:** Aí a gente não vende berço. Então a a recepcionista ou o vendedor registra isso, entendeu? até com uma possibilidade de virar um produto lá na frente. Se eu tiver 10 pessoas por mês entrando, procurando berço, eu vou dar um jeito de pôr um berço,

**Rafael Porto:** Entendi.

**Thiago Aguiar:** entendeu? Então, só que aí fica registrado esses atendimentos. Então, ah, o cliente entrou na loja, eh, fez a visita na loja, passou por tudo, a hora que passou o orçamento, ele não quis seguir, entendeu? Então nem virou orçamento, por exemplo. Às vezes ele perguntou o preço ali, viu o sofá lá na lá na o preço do sofá lá na hora, falou: "Ah, não, isso aqui não é para mim não.

**Rafael Porto:** Uhum. Não, mas ele virou um lead,

**Thiago Aguiar:** Eu

**Rafael Porto:** né? ou não chega nem ser lead.

**Thiago Aguiar:** é, é, aí vai ter que cadastrar ele como lead.

### **00:25:39** {#00:25:39}

**Rafael Porto:** Uhum.

**Thiago Aguiar:** Ah, não sei.

**Rafael Porto:** Talvez a gente tenha que fazer um quadro de lead e

**Thiago Aguiar:** Uhum. Eu falo porque assim,

**Rafael Porto:** aí

**Thiago Aguiar:** será que o vendedor vai entrar, cadastrar ele como um novo lead e depois já cancelar ele falando que perdeu? Será que não é? Entendeu?

**Rafael Porto:** então a gente pode fazer alguma coisa assim, cadastrar venda não é vendad perdida, algum algum atalho.

**Thiago Aguiar:** Uhum.

**Rafael Porto:** na hora de cadastrar o líder,

**Thiago Aguiar:** Tá.

**Rafael Porto:** a gente já coloca lá o negócio, é, eh, venda não, venda não, atendimento não evoluiu, não sei. Pensa numa frase.

**Thiago Aguiar:** É, depois eh,

**Rafael Porto:** Aí coloca o motivo, né?

**Thiago Aguiar:** sim. Você chegou a abrir as duas planilhas que eu mandei lá,

**Rafael Porto:** Cara, não consegui. Eu coloquei para baixar aqui,

**Thiago Aguiar:** não?

**Rafael Porto:** não consegui. Meu WhatsApp deu problema. Ia até te falar isso.

**Thiago Aguiar:** Tá.

**Leandro Mantovani:** M.

**Thiago Aguiar:** Depois você dá uma olhada para você entender qual que é a dinâmica que elas seguem hoje, entendeu?

### **00:26:49**

**Rafael Porto:** Uhum.

**Thiago Aguiar:** Aqui deixa eu manda, vou mandar aqui para você. Não sei se vai conseguir. Tem uma uma nova e uma antiga. A teste é a nova e a outra é antiga,

**Rafael Porto:** Tá.

**Thiago Aguiar:** porque aqui vai ter mais ou menos o que elas o que elas vão registrando para mim hoje.

**Rafael Porto:** Onde

**Thiago Aguiar:** Só que a minha dificuldade hoje é compilar esses dados, entendeu?

**Rafael Porto:** é que tá baixando esse negócio?

**Thiago Aguiar:** Mas não precisa ser agora não. Depois você olha para Uhum.

**Rafael Porto:** Não sei, mano. Tenho que ver onde é que tá baixando. Eu colo para baixar aqui no computador e some. Eu consegui baixar o MD, mas não consegui baixar planha. Entendi. Não tá, vou ter que olhar depois porque eu não tô conseguindo.

**Thiago Aguiar:** Tá, mas é isso assim, é pensar na melhor forma para registrar esses atendimentos.

**Rafael Porto:** Uhum.

**Thiago Aguiar:** Se ele se num caso desse, por exemplo, só de um registro de atendimento básico,

**Rafael Porto:** Угуm.

**Thiago Aguiar:** se vale a pena lançar ele como lead, depois cancelar ele, se não é mais burocrático do que só lançar um registro de atendimento, por exemplo.

### **00:28:22**

**Thiago Aguiar:** É, por hoje também a vendedora, ela meio que registra esses atendimentos como se fosse uma agenda. Então, tipo assim, o dia que ela não vai, vamos supor que amanhã a vendedora resolveu folgar. Ela registra na planilha dela, tipo assim, dia 6, folga de meta, por exemplo. Então,

**Rafael Porto:** Tá.

**Thiago Aguiar:** eu consigo entrar nesse registro de atendimento do vendedor e ver tudo que ele fez, sabe? No dia 6 ele atendeu alguém, ele tava de férias, ele tava de folga, ele que aconteceu no dia 6, né?

**Rafael Porto:** Uhum.

**Thiago Aguiar:** Aí, por exemplo, assim, é retorno de cliente ou é um cliente novo,

**Rafael Porto:** Угу.

**Thiago Aguiar:** eles colocam tudo para mim nessa planilha. É, tipo assim, ó, dia 6, retorno da cliente tal. Inclusive até se eu conseguir lançar esses retornos também, sabe? Saber quantas vezes o cliente retornou na loja antes de fechar, né? Importante quantos novos clientes a pessoa atendeu, porque às vezes ela atendeu 20 clientes no mês, mas 10 desses clientes são retornos, não são novos clientes.

**Rafael Porto:** Uhum.

### **00:29:38** {#00:29:38}

**Thiago Aguiar:** Isso é é um dado que eles preenchem para mim, mas às vezes fica um pouco falho.

**Rafael Porto:** Essa parte aí vai, essa parte tem bastante coisa para fazer. Bem complexa isso aí.

**Thiago Aguiar:** É,

**Rafael Porto:** Esse eu vou gastar um tempinho para fazer esse.

**Thiago Aguiar:** é.

**Rafael Porto:** Esse vale a nova tela.

**Thiago Aguiar:** Ah.

**Rafael Porto:** Ja. Mas eu já entendi o que eu pensei para agilizar, para não criar um novo um novo campo, que o cara tem que pensar, isso aqui é o cadastro aqui, isso aqui é o cadastro não sei aonde.

**Thiago Aguiar:** Uhum.

**Rafael Porto:** Ó,

**Thiago Aguiar:** É basicamente assim.

**Rafael Porto:** novo lead, ele vai colocar aqui, né, o nome, telefone,

**Thiago Aguiar:** Sim.

**Rafael Porto:** suas dados normais e a gente coloca aqui algum botão já, tipo assim, não, sem prosseguimento que já já vai para cancelado.

**Thiago Aguiar:** Aha.

**Rafael Porto:** e o motivo.

**Thiago Aguiar:** Sim, pode ser também.

**Leandro Mantovani:** é mais simples.

**Thiago Aguiar:** É tipo assim, ah,

**Rafael Porto:** Uhum.

**Thiago Aguiar:** eh, atendimento prosseguiu ou sei lá.

**Rafael Porto:** É. E tá até faltando aqui, né?

### **00:30:42**

**Rafael Porto:** Porque aqui seria como você falou de porta, né?

**Thiago Aguiar:** É showroom,

**Rafael Porto:** Ou é show?

**Thiago Aguiar:** eu acho que tá aí como showroom, ó.

**Rafael Porto:** Ah, tá. Isso. Na hora que botar showroom, ele vai colocar showroom e vai dizer que não evoluiu. Ah, não evoluiu porque o cliente queria um berço, não evoluiu porque ele achou muito caro.

**Thiago Aguiar:** Sim.

**Rafael Porto:** Você vai tendo nesses esse esse campo de descrição do por que não evoluiu,

**Thiago Aguiar:** Uhum.

**Rafael Porto:** já foi descartado

**Thiago Aguiar:** É, basicamente você vai ver lá, eu preciso de uma tela que substitua o uso daquelas duas planilhas, que na verdade é a mesma mudada,

**Rafael Porto:** isso.

**Thiago Aguiar:** entendeu?

**Rafael Porto:** Na verdade são só coisas, eu não vi a planilha ainda, mas aqui é só para facilitar essa questão de,

**Thiago Aguiar:** Aham.

**Rafael Porto:** tipo, ele não deixa de ser um lead,

**Thiago Aguiar:** Aham.

**Rafael Porto:** ele já entra como lead e já ele não vai precisar cadastrar e depois cancelar. Na mesma tela, ele já cancela.

**Thiago Aguiar:** Sim. Não,

**Rafael Porto:** E aí?

### **00:31:33**

**Thiago Aguiar:** show de bola.

**Rafael Porto:** Aí sim, a planilha do que você falou, sim, vai ser uma tela nova,

**Thiago Aguiar:** Aham.

**Rafael Porto:** vai ser uma tela de gestão dos vendedores.

**Thiago Aguiar:** Tá

**Rafael Porto:** Eu entendi que você faz uma gestão do que cada vendedor fez ao longo do mês.

**Thiago Aguiar:** isso.

**Rafael Porto:** Beleza. termos, gestão, inversão, orçamento.

**Thiago Aguiar:** Que que é? Gestão de vendas e orçamento. É a mesma. É exatamente isso que eu tava te explicando.

**Rafael Porto:** Histórico, mutável dos orçamentos com número de versão, valorçado, valor da tabela declarado e motivo obrigatório. Hum. Entre o primeiro, tá compartível. Entre o primeiro orçamento e a versão final.

**Thiago Aguiar:** Isso. Isso é porque às vezes o,

**Rafael Porto:** Угуm.

**Thiago Aguiar:** vamos supor, um arquiteto manda um pedido lá de R\$ 100.000 para orçar, aí de repente o cara fecha. R\$ 3.000. Então eu tenho que saber o que que aconteceu que o que arquiteto tirou um monte de coisa, ele achou caro, o que que foi, né? E nessa planilha, quando o cliente vende, o vendedor coloca, tipo assim, ah, o orçamento 100.000, valor eh fechado 70.000 a venda concluída.

### **00:33:08**

**Thiago Aguiar:** E aí eu sei a o desconto que saiu cada venda, né? É lógico que isso, hora que realmente a gente for entrar na parte de pedido, aí vai virar uma nova tela, né? Porque hoje eu faço isso meio que duas vezes. Eu faço isso na minha planilha, mas eu faço porque na planilha eu puxo dado como taxa de conversão, como número de atendimento, essas coisas todas, mas no meu sistema é onde eu vou avaliar realmente o valor total que ele fechou e essas coisas.

**Rafael Porto:** Ah, não entendi. Vend em dois estágios.

**Thiago Aguiar:** É, é isso aí,

**Rafael Porto:** Declarada

**Thiago Aguiar:** é isso aí é que exatamente o que eu tô falando. Tipo assim, o vendedor ele fala que vendeu, tipo, fechou, mas não necessariamente o processo administrativo já foi feito, entendeu?

**Rafael Porto:** Uhum.

**Thiago Aguiar:** Então assim, não confirmou pagamento, não, não fez nada. Às vezes o o às vezes o cliente até pagou já,

**Rafael Porto:** Sim.

**Thiago Aguiar:** mas é só para deixar, entre aspas, formalizada essa outra planilha.

**Rafael Porto:** Uhum. divisão de vendas entre vendedores.

### **00:34:28** {#00:34:28}

**Rafael Porto:** Entra na parte de de gestão que a gente tá conversando.

**Thiago Aguiar:** Isso. Por exemplo, as igual já aconteceu, eh, vendedora saiu de férias, aí o cliente que era de um vai paraa outra ou uma vendedora que tava na empresa e aí não tá mais. Às vezes o registro de atendimento tava no nome da da outra e agora é outro que atende. Ou senão, por exemplo,

**Rafael Porto:** Aí tem o rateio da comissão quando isso acontece.

**Thiago Aguiar:** sim, se os dois vendedores tiverem na empresa, sim.

**Rafael Porto:** Uhum. Esse rateio já é definido ou ou é mutável? Você vai, cada casa é um casa.

**Thiago Aguiar:** Não, geralmente já é definido já. É 60% para quem digita. o pedido e 40% para quem fecha, tipo isso.

**Rafael Porto:** Ah, beleza. Métricas de recepção, indicadores. Indicador de V. Isso. Foi o que a gente conversou, né?

**Thiago Aguiar:** Sim.

**Rafael Porto:** Tempo disponível, saldo. Foi o que a gente conversou sobre que faz parte lá daquela parte primeira aqui de recepção.

### **00:35:42** {#00:35:42}

**Thiago Aguiar:** Isso. Isso mesmo. Eh,

**Rafael Porto:** Controle estrito de carteira fechada. octação de dados cadastrais, históricos e valores para clientes perten Sì.

**Thiago Aguiar:** isso é assim, ó. Na verdade isso já entra.

**Leandro Mantovani:** Yeah.

**Thiago Aguiar:** Ah, tá. Pera aí. Isso aí é de clientes, não de profissionais. Exibindo apenas o cliente. É, é paraa vendedora não ver o que a outra vendeu. É tipo assim, senão a vendedora fica com acesso a todos os clientes.

**Rafael Porto:** Ah, tá. Mas isso aí já é, cada perfil vai ter o seu acesso.

**Thiago Aguiar:** É sim,

**Rafael Porto:** Você o os perfil de gestão e de administração que vai ter acesso a tudo.

**Thiago Aguiar:** tá?

**Rafael Porto:** Aqui é tranquilo. Isso aqui foi só porque assim, nesse documento sem passou ele tava ainda falando do padrão antigo de

**Thiago Aguiar:** Ah, tá.

**Rafael Porto:** de Python FP.

**Thiago Aguiar:** Tá,

**Rafael Porto:** São incongruências foi encontrado.

**Thiago Aguiar:** tá. É oportunidade versus lead, conceito da palavra fila.

**Rafael Porto:** É isso aqui bestagem.

### **00:37:04** {#00:37:04}

**Rafael Porto:** Isso aqui no no que a gente já conversou, já entendi.

**Thiago Aguiar:** Tá.

**Rafael Porto:** Oportunidade versus vídeo,

**Thiago Aguiar:** Modelo Aham.

**Rafael Porto:** que a gente tava conversando, que eu acho que devia ser tudo cadastrou como lead, não fechou, não fechou, né?

**Thiago Aguiar:** Sim.

**Rafael Porto:** Mas já você já tem o cadastro paraquela pessoa lá para qualquer

**Thiago Aguiar:** Sim,

**Rafael Porto:** móveis.

**Thiago Aguiar:** essa parte é essa parte aí que é um pouco complicada,

**Rafael Porto:** Pode falar.

**Thiago Aguiar:** né, de um modelo de negócio, que são praticamente duas duas dois negócios diferentes dentro da

**Rafael Porto:** Uhum.

**Thiago Aguiar:** mesma empresa. Então, por exemplo, o o a jornada do cliente de planejado é muito mais longa. Eh, aí, por exemplo, eu uso uma métrica lá que é eh itens por venda, né? Quantas quantos, vamos supor, o cara comprou uma casa inteira, quant qual que é a média de produtos que a gente vende para cada cliente, né? Aí no no móveis soltos é por produto, no planejado é meio que por ambiente,

**Rafael Porto:** M.

**Thiago Aguiar:** né? E isso muda muita coisa.

### **00:38:25** {#00:38:25}

**Thiago Aguiar:** Muda porque o valor é agregado

**Rafael Porto:** E e o fluxo que Uhum. E o fluxo que a gente tem feito até agora foi praticamente de móveis ou de

**Thiago Aguiar:** de planejado.

**Rafael Porto:** planejados.

**Thiago Aguiar:** É exato. É porque o planejado é muito mais complexo,

**Rafael Porto:** Uhum. Tá. Eu vou dar uma analisada melhor aqui para para ter mais ideias de como fazer.

**Thiago Aguiar:** tá?

**Rafael Porto:** Pode ser.

**Thiago Aguiar:** Pode exist eh esse

**Rafael Porto:** Existência de valor de tabela.

**Thiago Aguiar:** negócio do valor da tabela é o seguinte, vamos supor, Mantovani é meu amigo,

**Leandro Mantovani:** M.

**Thiago Aguiar:** aí ele quer aí ele quer comprar um sofá lá Yeah. na loja. Aí ele não me procura, procura direto um vendedor. Aí o vendedor sabe que o Mantovani é meu amigo, vai jogar 30% a mais no preço

**Rafael Porto:** Hum. Para dar.

**Thiago Aguiar:** para para eu dar 40% de desconto pro Mantovani,

**Rafael Porto:** Entendi. Olha.

**Thiago Aguiar:** entendeu? Por quê?

**Rafael Porto:** Угуm.

**Thiago Aguiar:** Porque se eles derem, se eu der um desconto mais agressivo, eles perdem na comissão deles.

### **00:39:28**

**Thiago Aguiar:** Então, a hora que a gente vai registrar um um pedido, esse pedido saiu lá no pedido do Mantovani, que ele teve 40% de desconto, só que na verdade ele só teve 10\.

**Rafael Porto:** Entendi.

**Thiago Aguiar:** Então, a gente considera esse valor de tabela sempre para calcular o desconto real que foi dado que o

**Rafael Porto:** Uhum. O valor declarado é o valor com é o valor com 40%,

**Thiago Aguiar:** cliente recebeu.

**Rafael Porto:** é o valor a mais.

**Thiago Aguiar:** Isso,

**Rafael Porto:** Não, por exemplo, é R\$ 10\.

**Thiago Aguiar:** isso,

**Rafael Porto:** Você vai passar pro Leandro 14 e dar um desconto de 40%.

**Thiago Aguiar:** isso.

**Rafael Porto:** Pera aí. Você aumenta 30 e dá o desconto de 40, né?

**Thiago Aguiar:** Isso

**Rafael Porto:** Mais 30% \- 40% 7,8. Seria isso?

**Thiago Aguiar:** é mais ou menos.

**Rafael Porto:** É porque se for 10% na verdade não.

**Thiago Aguiar:** É, na verdade você tem que pegar os 10 dividir por ponto 7\.

**Rafael Porto:** Hum.

**Thiago Aguiar:** O o certo mesmo 10 dividido por ponto 7 vai dar 14\.

**Rafael Porto:** É o

### **00:40:48**

**Thiago Aguiar:** Aí agora dá 40%. Menos 40%. Dá 8,5.

**Rafael Porto:** mas mesmo assim tá mais de 10%.

**Thiago Aguiar:** É, tá mais de 2%. É. É,

**Rafael Porto:** Mas você quer que seja 10%, né?

**Thiago Aguiar:** mas é,

**Rafael Porto:** Tem tem como fazer matematicamente isso?

**Thiago Aguiar:** não é,

**Rafael Porto:** Só não Aham.

**Thiago Aguiar:** é só, é, na verdade foi só um exemplo assim, eh, às vezes eles, é lógico que eles não às vezes joga 2% a mais, às vezes joga cinco,

**Rafael Porto:** Entendi.

**Thiago Aguiar:** não costuma ser valores, mas eles eles fazem esse jogo. Às vezes, por exemplo, o cara gostou muito de um sofá e é certeza que vai fechar aquele sofá. Então, às vezes joga um pouquinho mais no sofá e tira um pouquinho menos no outro, entendeu?

**Rafael Porto:** Mhm.

**Thiago Aguiar:** Eu tem vendedor que vai jogando um pouquinho, só que a hora que a gestora recebe o pedido, ela tem que levantar, ela tem que bater o preço de tabela.

**Leandro Mantovani:** Ja.

**Thiago Aguiar:** Então, qual que era a ideia que eu que eu tinha tido?

### **00:41:52** {#00:41:52}

**Thiago Aguiar:** Hora que esse esse pedido virar realmente um pedido, ele passa paraa gestora conferir os preços de tabela, o vendedor lança qual que é o preço de tabela e a e a gestora dá um OK se tá certo ou não, para saber qual que é o valor correto do pedido.

**Rafael Porto:** Então assim, o preço de tabela é o tem uma cadeira que custa R\$ 10\. O preço de tabela é R\$ 10\.

**Thiago Aguiar:** Isso. Preço de tabela R\$ 10\.

**Rafael Porto:** O valor declarado é o valor com desconto ou não?

**Thiago Aguiar:** Não, o valor declarado que ele colocou aí declarado, não sei porquê.

**Rafael Porto:** Falou tabela declarada.

**Thiago Aguiar:** Valor, valor de tabela conferido. Ah, não, isso aí é o seguinte, é exatamente isso. O valor de tabela declarado é o vendedor que lança. O valor de tabela conferido.

**Rafael Porto:** É o que é o que ele dá, é o que ele deu a mais,

**Thiago Aguiar:** É,

**Rafael Porto:** né?

**Thiago Aguiar:** não, não é o valor de de tabela tabela mesmo. Então, assim,

**Rafael Porto:** Tá.

### **00:42:47**

**Thiago Aguiar:** vamos supor, eu fui lá e fechei o pedido do Mantovani, eu fechei por 8,5, o valor de tabela é 10\. Eu que sou vendedor, eu vou lançar lá fechado, eh, valor de tabela 10 fechado por 8,5. E aí isso vai paraa gestora.

**Rafael Porto:** Uhum.

**Thiago Aguiar:** A gestora tem que conferir se o vendedor tá falando a verdade.

**Rafael Porto:** Ah, tá. Ela, esse valor conferido é pela a gestora que lança.

**Thiago Aguiar:** Isso é a gestora que lança. Ela só dá um OK. Tipo assim, ela vai entrar lá na tabela, vê se tá certo e dá um OK em cima do do desconto do

**Rafael Porto:** Uhum.

**Thiago Aguiar:** desconto declarado para ela não ter que sair digitando também com e pegando, fazendo todo o trabalho de novo, entendeu?

**Rafael Porto:** Uhum. Entendi.

**Thiago Aguiar:** Porque às vezes aí que que pode que poderia acontecer? O vendedor declarar um valor mais baixo para dar menos desconto, entendeu? Então essa gestória tem que conferir.

**Rafael Porto:** Uhum. É, essa parte aqui já tá mais avançada, né?

**Thiago Aguiar:** É contrato de pagamento, destravando a venda.

### **00:44:09** {#00:44:09}

**Thiago Aguiar:** Tá, isso aí já entra na hora que vira pedido mesmo.

**Rafael Porto:** Uhum.

**Thiago Aguiar:** Até essa parte que a gente acabou de falar do declarado versus conferido também já é uma parte mais que vira

**Rafael Porto:** Já é pedido.

**Thiago Aguiar:** realmente pedido.

**Rafael Porto:** Uhum. Beleza. Já tem bastante coisa aqui que dá para fazer.

**Thiago Aguiar:** Tá,

**Rafael Porto:** Não, provavelmente não vai ficar tudo pronto até a próxima reunião,

**Thiago Aguiar:** tá. Não, não, não tem problema.

**Rafael Porto:** mas Uhum.

**Thiago Aguiar:** Eu vou fazer no restante e aí depois eu pego e faço um vídeo também. você não conseguir acessar a planilha,

**Leandro Mantovani:** Ah,

**Thiago Aguiar:** eu faço um vídeo te mostrando.

**Leandro Mantovani:** tem problema sim.

**Rafael Porto:** Não vou vou.

**Leandro Mantovani:** Tem problema sim.

**Rafael Porto:** O problema foi só na hora de baixar aqui, mas eu vou dar um jeito como problema do meu sistema.

**Leandro Mantovani:** Tô brincando, pô.

**Thiago Aguiar:** H

**Rafael Porto:** Não, tô falando com o Thiago aqui. Eu tô baixando a planilha e não sei para que passa tá indo.

### **00:44:53** {#00:44:53}

**Rafael Porto:** Ten que procurar.

**Leandro Mantovani:** Nem parece que você sabe usar computador. ador,

**Thiago Aguiar:** R\$

**Leandro Mantovani:** né?

**Rafael Porto:** Ah, você sabe usar Linux?

**Leandro Mantovani:** Ah, eu uso unix desde sempre,

**Rafael Porto:** Pois é, cada dia aparece um problema misterioso.

**Thiago Aguiar:** 2 é um problema misterioso.

**Rafael Porto:** É,

**Leandro Mantovani:** mas isso é verdade. Sempre aparece uma coisa do além.

**Rafael Porto:** às vezes você reinicia e volta a funcionar. meu computador uma vez por mês. Então aqui, ó, tem a parte da correção lá do que ficou faltando, né, do abrir a aba do cliente e ver as interações,

**Thiago Aguiar:** Sim.

**Rafael Porto:** a fila do vendedor, que foi o que a gente conversou, o termômetro e

**Thiago Aguiar:** Uhum. Eu não sei se você lembra, até a gente até criou um atalho para essa interação a gente poder salvar também no prontuário, não sei se lembra disso.

**Rafael Porto:** hum M.

**Thiago Aguiar:** Então, a hora que a gente tá ali naquela tela do cambre aquela tela lateral, a interação eu posso salvar ela. Tem uma abinha aqui que tá lá, ó, salvar também no prontuário do cliente.

### **00:46:08** {#00:46:08}

**Thiago Aguiar:** Mas eu acho que independente disso é é interessante.

**Rafael Porto:** Uhum. Você quer tipo essa Não, eu já entendi como é que é. Eu já entendi.

**Thiago Aguiar:** É isso.

**Rafael Porto:** Você tem que ter lá um histórico das interações. Independente do projeto, vai ter falando qual o projeto, mas tem que ter um histórico das interações com aquele cliente.

**Thiago Aguiar:** Isso. Porque senão eu tenho que sair abrindo coisa,

**Rafael Porto:** Abrindo projeto,

**Thiago Aguiar:** caçando.

**Rafael Porto:** você vai ter que abrir card por card para caçar e você quer ver.

**Thiago Aguiar:** É.

**Rafael Porto:** Eu entendi.

**Thiago Aguiar:** Fechou. Então é isso. E essa outra.

**Rafael Porto:** É isso. Uhum.

**Thiago Aguiar:** E aí amanhã eu chego na loja, aí eu já pego as anotações que eu fiz. Se tiver mais alguma coisa pertinente, eu já te mando também.

**Rafael Porto:** Tá bom.

**Thiago Aguiar:** E aí eu já vou fazendo a outra dos especificadores

**Rafael Porto:** Beleza. É essa,

**Thiago Aguiar:** que aí essa essa trapinha é é não

**Rafael Porto:** essa é bom a gente conversar. Essa aí vai ter que dar uma boa conversada para entender melhor.

**Thiago Aguiar:** fechou.

**Rafael Porto:** Fechou?

**Thiago Aguiar:** Fechado. Valeu.

**Rafael Porto:** Vamos.

**Thiago Aguiar:** Boa noite. Qualquer dúvida você vai me mandando mensagem.

**Rafael Porto:** Boa noite. Pode deixar.

**Leandro Mantovani:** Noes.

**Thiago Aguiar:** É nós isso. Valeu.

### **A transcrição foi encerrada após 00:47:22**

*Esta transcrição editável foi gerada por computador e pode conter erros. As pessoas também podem alterar o texto depois que ele for criado.*