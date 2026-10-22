out. 9, 2026

## **Reunião em 8 de out. de 2026 às 21:00 GMT-03:00**

Registros da reunião [Transcrição](https://docs.google.com/document/d/1fYgKjvZK-Ay4v-ZuslRn9wAuoiv-37HYmruAvkN9BHA/edit?usp=drive_web&tab=t.crlm0d5y2dxr) 

### **Resumo**

Atualizações de sistema com avaliações de funcionalidades e definições de layout e duração.

**Ajustes de Ambiente e Agenda**  
Exclusão de ambiente e histórico de mudança foram apresentados. Duração de compromissos substituiu o horário de término.

**Configurações e Perfis**  
Filtros e layout da agenda foram discutidos. Perfis de acesso e inativação foram detalhados.

### **Decisões**

## **Precisa de mais conversa**

* **Implementação de visualização de perfil no cabeçalho** A proposta de incluir um seletor de perfil no cabeçalho para simular visões de cargos foi debatida, mas a implementação ficou pendente de validação de fluxo.  
* **Fluxo de prontuário e observações do cliente** A criação de um campo de texto livre para anotações e histórico detalhado do cliente foi discutida, aguardando definição de fluxo por Rafael.

## **Alinhada**

* **Substituição da linha do tempo por modal** A visualização da linha do tempo foi removida da barra lateral e substituída por um modal de detalhes.  
* **Configuração de duração nos compromissos da agenda** Os campos de data e término de compromissos na agenda foram alterados para utilizar data e hora de início combinadas com a duração.  
* **Padrão de exibição limpo na agenda da equipe** O design da agenda da equipe optou por um formato mais limpo em vez de replicar o modelo do Google Agendas.  
* **Manutenção de acesso em perfis inativados** Ficou definido que, ao inativar um perfil, os usuários associados a ele mantêm seus acessos atuais a princípio.  
* **Associação de múltiplos projetos por lead** Foi acordado permitir a associação de mais de um projeto para o mesmo lead, garantindo que cada projeto tenha seu próprio card no Kanban.

### **Próximas etapas**

- [ ] \[Rafael Porto\] Criar Modal: Desenvolver modal para exibir detalhes da linha do tempo.  
- [ ] \[Rafael Porto\] Ajustar Agenda: Transformar campos de data e hora de término em duração nos compromissos da agenda.  
- [ ] \[Rafael Porto\] Adicionar Observações: Criar campo de texto livre para observações sobre o cliente nas interações e definir fluxo para inclusão na ficha.  
- [ ] \[Rafael Porto\] Criar Atalho: Implementar atalho no card do CRM para acessar a ficha completa do cliente.  
- [ ] \[Rafael Porto\] Gerenciar Projetos: Permitir associação de múltiplos projetos ao mesmo lead com cards independentes no kanban.  
- [ ] \[Rafael Porto\] Realizar Deploy: Efetuar a implantação do sistema durante o próximo feriado prolongado.  
- [ ] \[Rafael Porto\] Transcrever Guias: Realizar a transcrição dos guias e fichas de briefing para o sistema.  
- [ ] \[Rafael Porto\] Ajustar Perfis: Revisar a lógica de inativação de perfis e usuários para garantir o controle correto de acesso.  
- [ ] \[Rafael Porto\] Implementar Visualização: Adicionar funcionalidade no header para diretores visualizarem o sistema como outros usuários.

### **Detalhes**

**Exclusão de Ambiente**: Rafael Porto explicou que a exclusão de um ambiente em uso não causa problemas operacionais, pois o valor é salvo como string e tagueado para evitar erros de digitação, embora seja recomendável a desativação em vez da exclusão para itens temporariamente suspensos ([00:00:00](#00:00:00)).

---

**Histórico de Mudança e Tempo por Etapa do Funil**: Rafael Porto apresentou a funcionalidade de histórico de mudança e o relatório de tempo por etapa do funil exibido em modal, detalhando o tempo total e a porcentagem de permanência em cada card, o que recebeu aprovação de Thiago Aguiar ([00:01:30](#00:01:30)).

---

**Visualização da Linha do Tempo e Detalhes de Compromissos**: Rafael Porto sugeriu remover a linha do tempo da barra lateral por falta de espaço e adotar o padrão de modal para exibição de detalhes, proposta aceita por Thiago Aguiar. Em seguida, Rafael Porto demonstrou a nova aba de agenda e um compromisso de teste ([00:03:19](#00:03:19)).

---

**Alternância de Perfil no Cabeçalho**: Thiago Aguiar sugeriu adicionar um recurso no canto superior direito do cabeçalho para permitir que a diretoria visualize o sistema sob a perspectiva de outros perfis (como vendedor) sem a necessidade de sair e entrar novamente, e Rafael Porto concordou em avaliar a viabilidade dessa implementação ([00:04:25](#00:04:25)).

---

**Configuração de Compromissos**: Rafael Porto demonstrou o formulário de novos compromissos, destacando que o campo de título obrigatório foi removido em favor de tags, e indicou que a seleção de cores por código hexadecimal será substituída por uma paleta circular para maior personalização ([00:05:28](#00:05:28)).

---

**Planejamento de Deploy e Duração de Compromissos**: Leandro Mantovani questionou sobre o andamento do deploy, e Rafael Porto respondeu que pretende trabalhar nisso durante o feriado prolongado. Em seguida, Rafael Porto e Thiago Aguiar discutiram os campos de horário, decidindo substituir o horário de término por um campo de duração inspirado no padrão do Google Agenda ([00:06:45](#00:06:45)).

---

**Filtros e Layout da Agenda**: Rafael Porto apresentou as opções de visualização da agenda, que permitem alternar entre a agenda pessoal e a de toda a equipe, com filtros por colaborador, status e tipo de compromisso, além de visualização em grade ou lista. Thiago Aguiar e Leandro Mantovani concordaram que uma interface excessivamente densa semelhante à do Google Agenda para toda a equipe geraria confusão, preferindo um layout mais limpo ([00:08:52](#00:08:52)).

---

**Vínculo de Leads e Registro de Interações**: Rafael Porto demonstrou o vínculo automático de leads ao criar um compromisso a partir de uma ficha. Thiago Aguiar propôs a criação de um campo de texto livre nas interações (como ligações ou WhatsApp) para registrar observações detalhadas sobre os clientes, visando o uso em engajamentos futuros ([00:09:58](#00:09:58)).

---

**Fluxo de Observações e Prontuário do Cliente**: Rafael Porto comprometeu-se a estruturar um fluxo adequado para que as observações das interações possam ser incorporadas à ficha do cliente de forma prática, funcionando de maneira similar a um prontuário médico, além de criar um atalho no painel para acesso direto à ficha do CRM ([00:14:41](#00:14:41)).

---

**Correção de Bug no Briefing Técnico**: Rafael Porto confirmou a resolução do bug no briefing técnico, demonstrando o funcionamento correto da ativação e desativação de catálogos de ambientes, e mencionou que a tabela de pontos será revisada posteriormente ([00:15:54](#00:15:54)).

---

**Gerenciamento e Personalização de Perfis de Acesso**: Rafael Porto apresentou a tela de configurações de perfis, explicando que o perfil de diretoria é fixo e possui acesso irrestrito, enquanto outros perfis (como gerente comercial) permitem ativar ou desativar permissões específicas, além de editar nomes e descrições de perfis ([00:17:39](#00:17:39)).

---

**Regras de Inativação e Exclusão de Perfis**: Rafael Porto demonstrou os filtros de usuários por perfil e explicou que a exclusão de um perfil só é permitida caso não haja usuários associados, restando a inativação como alternativa. Thiago Aguiar avaliou que a inativação de um perfil deve manter o acesso dos usuários existentes a princípio, enquanto a inativação individual de um cadastro de funcionário deve revogar imediatamente os acessos ([00:18:56](#00:18:56)).

---

**Pendências para a Próxima Semana**: Rafael Porto listou os entregáveis para a semana seguinte, que incluem a infraestrutura para acesso, a transcrição e inclusão das fichas de guias do briefing pendentes, e os ajustes solicitados durante a reunião ([00:21:09](#00:21:09)).

---

**Associação de Múltiplos Projetos por Lead**: Thiago Aguiar levantou a demanda de clientes que iniciam novos projetos após a conclusão de um pedido anterior, solicitando que o sistema permita associar mais de um projeto ao mesmo lead/cliente, com cada projeto exibindo seu próprio card no Kanban. Rafael Porto registrou o item para avaliação e ajuste ([00:23:03](#00:23:03)).

*Revise as anotações do Gemini para checar se estão corretas. [Confira dicas e saiba como o Gemini faz anotações](https://support.google.com/meet/answer/14754931)*

*Como está a qualidade de **destas observações?** [Responda a uma breve pesquisa](https://google.qualtrics.com/jfe/form/SV_5bXzKQfylMIhSXc?confid=J1e-_kZm3vFDlWAMgcfiDxIUOBEQAjIGCIoCIAAYBQg&detailLevel=standard&hasImages=False&entryPoint=footerMain&isGoogler=False&lang=pt-BR) para nos dar seu feedback, incluindo o quanto as observações foram úteis para o que você precisa.*

out. 9, 2026

## **Reunião em 8 de out. de 2026 às 21:00 GMT-03:00 \- Transcrição**

### **00:00:00** {#00:00:00}

**Thiago Aguiar:** Hum.

**Rafael Porto:** Chegou a tela aí?

**Thiago Aguiar:** Chegou. Achei que você ia compartilhar o jogo.

**Rafael Porto:** Ah, o jogo tá no celular, só pega com VPN. Ah, porque é piratão, né?

**Thiago Aguiar:** Uhum.

**Rafael Porto:** VPN e essa porcaria desse Linux aqui. Minha VPN parou de funcionar. Vocês formatar, mas não tem coragem que é tanta coisa tem que configurar depois.

**Leandro Mantovani:** Ai, ai, ai. Formatar o computador nunca é uma tarefa fácil.

**Rafael Porto:** E aí, Leandro?

**Thiago Aguiar:** Ainda mais quando se é o Leandro.

**Leandro Mantovani:** Quê?

**Thiago Aguiar:** Oi,

**Leandro Mantovani:** Que que você falou?

**Rafael Porto:** Ainda mais quando você Leandro.

**Leandro Mantovani:** Eu não preciso formatar o computador, eu uso Mac.

**Rafael Porto:** É isso aí.

**Thiago Aguiar:** M.

**Rafael Porto:** é uma coisa, não posso nem contestar, não posso nem zoar, cara. Assim, ó, do que a gente falou do da semana passada, eh, testar o que acontece na exclusão de um ambiente que está em uso, lembra?

**Thiago Aguiar:** Ага.

**Rafael Porto:** Eh, não dá problema nenhum não, porque que acontece ali fica tagueado para as pessoas não ficar digitando errado, não ficar dando diferenças de letra maior, minúsculo, essas coisas, mas na hora que salva na tabela, salva como se fosse um uma string, um nome.

### **00:01:30** {#00:01:30}

**Rafael Porto:** Então, se você apagar, não vai não vai perder nada do que foi feito.

**Thiago Aguiar:** Não vai apagar, tá?

**Rafael Porto:** Isso. O legal é não apagar, né, desativar, a não ser que seja algo realmente que esteja errado, né?

**Thiago Aguiar:** Sim.

**Rafael Porto:** Mas você alguma coisa falar, vamos parar de atender isso aqui por enquanto. Aí desativa depois ativa de novo, né, para não ficar com nomes diferentes e mas beleza. Eh, alerta para terminar o cadastro do especificador. Isso aqui eu não fiz porque eu só ia fazer isso aqui quando tivesse essas fases novas. Você me passou, lembra?

**Thiago Aguiar:** Lebra

**Rafael Porto:** Então, acabei não fazendo esse aqui porque já faz tudo junto. É o histórico de mudança na linha do tempo. Detalhes para quando o quanto tempo fica em cada card, tempo total, aquelas coisas. Lembra disso?

**Thiago Aguiar:** lembro

**Rafael Porto:** Tá aqui, ó. Eh, tempo por etapa do funil. Tá vendo?

**Thiago Aguiar:** Uhum.

**Rafael Porto:** Olha o que aconteceu.

**Thiago Aguiar:** Seis dias ao total no funil.

### **00:02:28**

**Rafael Porto:** 6 dias, 23 horas.

**Thiago Aguiar:** Esse esse aqui.

**Rafael Porto:** Aí, se você quiser ver detalhes, ele vai tá aqui, ó.

**Thiago Aguiar:** Hum.

**Rafael Porto:** Então, novo lead,

**Thiago Aguiar:** Show de bola.

**Rafael Porto:** 3 minutos, 5 segundos. É porque tá atualizando algumas coisas no código. Fica atualizando aqui.

**Thiago Aguiar:** Tá. Não tá.

**Rafael Porto:** Eh, aí, ó, tal dia foi mudado, tal hora ficou 2 minutos, depois foi para qualificando, retornou. Tá vendo?

**Thiago Aguiar:** Legal.

**Rafael Porto:** Tá vendo essa porcentagem aqui? É porque assim, considera o tempo total, ó. 99% desse card aqui, ele ficou em brief. menos de 1% ele ficou nos outros.

**Thiago Aguiar:** Entendi.

**Rafael Porto:** No no dia a dia, pode ser que isso aqui fique mais equilibrado, né?

**Thiago Aguiar:** Aham. Legal.

**Rafael Porto:** Aí eu escolhi por ser um modal fica melhor para ver do que aqui no na lateral que ia ficar muita informação em pouco local.

**Thiago Aguiar:** Sim. Legal. Gostei.

**Rafael Porto:** Tá bom assim, né?

**Thiago Aguiar:** Uhum.

**Rafael Porto:** Era isso mesmo.

### **00:03:19** {#00:03:19}

**Rafael Porto:** Aí tá aqui,

**Thiago Aguiar:** Isso mesmo.

**Rafael Porto:** ó. Retorno às etapas. Sim, teve retorno às etapas. Eh, ponto de maior retenção. Então, ele dá esse relatóiozinho assim, esses resuminhos para você. E o lead aqui é o Thiago que foi aquele que a gente criou, né?

**Thiago Aguiar:** Sim. Bacana.

**Rafael Porto:** Eh, compromissos agendados. A linha do tempo já tinha, né? Tranquilo. Eu tô pensando em tirar essa linha do tempo aqui porque você tô começando a achar que fica muito pequeno, né?

**Thiago Aguiar:** É,

**Rafael Porto:** Que que você acha?

**Thiago Aguiar:** pode de É,

**Rafael Porto:** Tô pensando em usar esse mesmo padrão que detalhes. Aí você vê dentro do tempo.

**Thiago Aguiar:** eu acho que pode ser.

**Rafael Porto:** Pode ser.

**Thiago Aguiar:** Pode, senão vai ficar muito grande. Угуm.

**Rafael Porto:** Uhum. começou a ficar coisa demais nessa nessa série de basinha aqui. Então, linha do tempo, criar modal para exibir detalhes. Beleza? Eh, compromisso aqui a mesma coisa, detalhes não tem nada.

### **00:04:25** {#00:04:25}

**Rafael Porto:** Aqui foi um teste que eu fiz, tá vendo? Concluído.

**Thiago Aguiar:** Sim.

**Rafael Porto:** Então tá aqui desfecho. É porque esse aqui foi só um teste que eu tava fazendo. Em aberto não tem nada concluído tem um. Você pode ver na agenda, vai ter uma aba nova pra agenda. Tá vendo? Tá aqui em cima, ó.

**Thiago Aguiar:** Sì.

**Rafael Porto:** Então vem na agenda. Eu tô com perfil de de gerente, tá? Se eu sair aqui o direito, não, diretoria que pode fazer tudo. Vamos sair ele.

**Thiago Aguiar:** Hum.

**Rafael Porto:** Pode falar

**Thiago Aguiar:** Nesse negócio eu acho que seria legal, por exemplo, ali em diretoria, lá em cima, ao lado direito,

**Rafael Porto:** lado direito, tá?

**Thiago Aguiar:** às vezes clicar aí sem precisar sair e logar de novo, entendeu? Ele ter um ver como, por exemplo, aí ver como vendedor.

**Rafael Porto:** Hum. Tá.

**Thiago Aguiar:** Não sei se você acha que dá para fazer,

**Rafael Porto:** Vou, eu entendi o que você tá pedindo, mas eu vou pensar nisso, tá?

### **00:05:28** {#00:05:28}

**Thiago Aguiar:** tá? Não tem problema.

**Rafael Porto:** Não vou te garantir.

**Thiago Aguiar:** Aham. Não, não tem problema.

**Rafael Porto:** Então no header onde exibe perfil poder colocar como e aí os perfis, né? Mas quem vai poder isso é só o diretor, né? Diretoria,

**Thiago Aguiar:** Isso.

**Rafael Porto:** né?

**Thiago Aguiar:** Só a diretoria.

**Rafael Porto:** Apenas para diretor. Isso inicialmente, tá? Que eu vou lhe mostrar outra coisa aqui. Já já deixa eu voltar aqui pro que a gente tava. Então, eu tava falando do histórico de mudança, ah, da agenda, né? Então aqui, ó, novo compromisso. Eu do da imagem que eu te mandei, eu fiz uma mudança porque ele tinha como título, como obrigatório. Eu tirei título porque não precisa de título. O que precisa, na verdade, essa tag aqui, né?

**Thiago Aguiar:** Sim.

**Rafael Porto:** E outro, mesma coisa configurável,

**Thiago Aguiar:** E aí tem o configurador,

**Rafael Porto:** tá?

**Thiago Aguiar:** tá?

**Rafael Porto:** Exatamente. Eu tô só isso aqui, eu vou mudar. Não gostei disso aqui, mas eu não tive tempo de mudar.

### **00:06:45** {#00:06:45}

**Thiago Aguiar:** Uhum.

**Rafael Porto:** É porque ficou um código hexadecimal para você escolher a cor. Tipo,

**Thiago Aguiar:** Tá.

**Rafael Porto:** se colocar aqui ele, mas eu vou mudar, vou botar tipo uma rodinha de cor.

**Thiago Aguiar:** Ah,

**Rafael Porto:** Então assim,

**Thiago Aguiar:** beleza.

**Rafael Porto:** tô fazendo o sistema mais personalizável possível, cara, porque aí ele é escalável, né? Se você quiser depois vender para alguém,

**Thiago Aguiar:** Sim.

**Rafael Porto:** não fica travado no seu processo, né?

**Thiago Aguiar:** Sim, muito legal.

**Rafael Porto:** Então, estamos aqui.

**Thiago Aguiar:** A ideia é justamente essa, na verdade.

**Rafael Porto:** Uhum.

**Leandro Mantovani:** E o deploy como é que ficou?

**Rafael Porto:** Não tive tempo, cara, de mexer nisso, de verdade. Eu quero mexer agora nesse feriadão prolongado. Ó, tipo de compromisso. Então você escolhe qual que vai. p\*\*\*\*, outro pênalti. t\*\*\*\*\*\*\*\*\*\*. Empatou.

**Leandro Mantovani:** Ai, tá vendo o jogo,

**Rafael Porto:** É,

**Leandro Mantovani:** f\*\*\*\*\*\*\*\*\*\*\*\*.

**Rafael Porto:** ó. Dá te hora de início, da te hora de término, talvez não precise. Que que você acha? Mas fica pelo menos assim.

### **00:07:51**

**Rafael Porto:** Vai ser um compromisso de uma hora.

**Thiago Aguiar:** Uhum.

**Rafael Porto:** Você acha que mantém assim? Como é que você prefere?

**Thiago Aguiar:** Ah, acho que pode deixar. Pode deixar, eu acho.

**Rafael Porto:** Pode deixar ou a gente pode botar duração,

**Thiago Aguiar:** Pode.

**Rafael Porto:** né?

**Thiago Aguiar:** É.

**Rafael Porto:** Acho que é melhor trocar para data e hora de início e deixa a duração, né?

**Leandro Mantovani:** Uhum. Duração.

**Thiago Aguiar:** É, pode ser. Como que é na agenda do Google?

**Leandro Mantovani:** Duração.

**Thiago Aguiar:** Não lembro duração.

**Rafael Porto:** a duração.

**Leandro Mantovani:** Você consegue botar o limite para cada uma, entendeu? Mas eu acho que o Google mostra os dois. Eu acho que tô falando besteira, mas eu acho que ele mostra os dois.

**Thiago Aguiar:** Aí ele ele dá a opção de clicar dia inteiro e a hora que ele abre o horário de início, ele já abre o horário de final também.

**Rafael Porto:** E ele deixa sobrepor compromissos.

**Thiago Aguiar:** É.

**Rafael Porto:** Aqui a gente vai deixar sobrep. Nossa, que agenda é essa?

### **00:08:52** {#00:08:52}

**Rafael Porto:** A gente vai deixar sobre pouco compromisso aqui.

**Thiago Aguiar:** Hum, boa pergunta. Acho que a agenda vai ter dono,

**Rafael Porto:** Tem. Eu vou lhe mostrar aqui já já.

**Thiago Aguiar:** porque a gente tem que pensar isso.

**Rafael Porto:** Deixa eu mostrar isso aqui antes, ó. A gente tá no perfil de diretoria, o o maior, certo? Aqui você tem minha agenda. Então aqui é a sua agenda, tá?

**Thiago Aguiar:** Uhum.

**Rafael Porto:** E aqui você tem a agenda de toda a equipe. Você pode filtrar por colaborador. Eu quero ver a agenda de determinado cara. Você vai ver ou você pode ver a agenda de todos. Você pode ver por status

**Thiago Aguiar:** Bacana.

**Rafael Porto:** e por tipo de compromisso.

**Thiago Aguiar:** Uhum.

**Rafael Porto:** Tá em grade ou em lista, né? Aí hoje,

**Thiago Aguiar:** Tá.

**Rafael Porto:** essa semana, esse mês ou pode tentar copiar o design do Google Agendas, qual que você prefere? Só que pode ficar confuso, né? Porque vai ter muito, por você colocar toda a equipe, pode virar uma lambança, né?

### **00:09:58** {#00:09:58}

**Thiago Aguiar:** É, é. Eu acho que vai dar uma confundida assim.

**Rafael Porto:** Por isso que eu acabei não adotando do Google Agendas.

**Leandro Mantovani:** Acho que a agenda tem que ser um negócio mais limpo, cara.

**Rafael Porto:** Hã?

**Leandro Mantovani:** Agenda tem que ser um negócio mais limpo.

**Rafael Porto:** Então aqui, ó, como é que tá aqui, ó? Tá vendo, ó?

**Leandro Mantovani:** Uhum. Não, desse jeito. Tá bom.

**Rafael Porto:** Briefing contigo que ele coloca aqui o filtro de hoje, vai ver tudo que tem de hoje e de toda a equipe e ele vai ver a agenda dele aqui.

**Thiago Aguiar:** Sim. É, eu acho que dá. A gente vai testando, depois ficar ruim a gente toca.

**Rafael Porto:** Aqui, né, novo compromisso. Você tá vendo aqui, ó, vincular um lead, né? Como você tá fora do lead,

**Thiago Aguiar:** Aham.

**Rafael Porto:** você pode ou não vincular um lead. Se você tiver no lead, tá aqui, ó, detalhes, novo compromisso, já fica automaticamente ele. Eu não consigo nem trocar, tá vendo?

**Thiago Aguiar:** Tá.

**Rafael Porto:** Deixa só anotar essa parte aqui.

### **00:11:04**

**Rafael Porto:** Data e hora de término agenda, data e hora de término transformar em duração. Beleza?

**Thiago Aguiar:** Sabe, desce aí essa,

**Rafael Porto:** pode falar,

**Thiago Aguiar:** desce. Essa aba da essa que você tinha aberto lá, clica no Thiago,desce lá. Que mais que tem aí? Mais nada.

**Rafael Porto:** mas nada. Tem aqui o o que você teve de contato, né?

**Thiago Aguiar:** Aham.

**Rafael Porto:** Tipo, é conversão

**Thiago Aguiar:** Isso daí seria legal que tivesse Bem.

**Rafael Porto:** fica aqui, tá vendo?

**Thiago Aguiar:** Aham.

**Rafael Porto:** Cadê? Onde é? Aqui, ó, no WhatsApp. do tempo.

**Thiago Aguiar:** Vertir sobre briefing. Quais são as opções aí que tem do WhatsApp?

**Rafael Porto:** WhatsApp, ligação, e-mail, visita e reunião.

**Thiago Aguiar:** Eu queria fazer alguma coisa aqui, vamos supor eu falei com o Thiago por ligação lá e tal. Na ligação, ele me falou que a avó dele ia participar de um campeonato de karatê.

**Rafael Porto:** Hm.

**Thiago Aguiar:** Aí eu queria colocar tipo no histórico do Thiago, por exemplo, que a avó dele faz karatê, porque em algum momento eu posso usar isso com o Thiago, entendeu?

### **00:12:48**

**Rafael Porto:** Entendi. Então, mas isso entraria com que características do do lead seria o quê?

**Thiago Aguiar:** É algo nesse sentido. Quando você clica aí no Thiago,ele a ele só abre essa,

**Rafael Porto:** É aqui nada. Abre aqui não,

**Thiago Aguiar:** só abre aí. Ele não vira uma página também do cliente,

**Rafael Porto:** ele tem aqui, ó.

**Thiago Aguiar:** né?

**Rafael Porto:** Vê a ficha. Tá vendo?

**Thiago Aguiar:** Eh, a gente não consegue clicar, botar lá para aquele negócio ver a ficha.

**Rafael Porto:** Consegue, consegue. Hum. Isso. Quando você criou o lead Thiago,ele virou uma ficha aqui.

**Thiago Aguiar:** Não sei,

**Rafael Porto:** Ele virou um cliente.

**Thiago Aguiar:** mas lá do dashboard a gente consegue criar um atalho para abrir a ficha.

**Rafael Porto:** Ah, consegue, consegue. Só faltou mesmo.

**Thiago Aguiar:** É porque aí a gente poderia criar esse atalho para ele ver a ficha. E aí,

**Rafael Porto:** Uhum.

**Thiago Aguiar:** nesse em algum lugar aí desse dessa ficha do Thiagoe as observações, sei lá, observações sobre o contato.

**Rafael Porto:** Tá.

### **00:13:43**

**Rafael Porto:** Então

**Thiago Aguiar:** E aí eu posso ir colocando coisas, tipo, ah, o nome do filho, eu pesquei que o nome do filho dele é Rodrigo, eh, que o cachorro chama Totó, eh, que ele gosta de praticar tênis.

**Rafael Porto:** tem que ser tem que ser um campo de texto mesmo livre, né?

**Thiago Aguiar:** Isso. Tipo assim, ah, que o Thiago gosta de jogar tênis, entendeu? E aí algum momento, vamos supor que no final lá da jornada dele, eu vou pensar num num presente pro Thiago consigo entrar nessas características e ver,

**Rafael Porto:** Uhum.

**Thiago Aguiar:** pô, o Thiago gosta de tênis e ele tem um cachorro.

**Rafael Porto:** Tá.

**Thiago Aguiar:** Vou mandar um potinho personalizado com o nome do cachorro, entendeu?

**Rafael Porto:** É quase como se fosse um prontuário médico. Você vai lá na consulta, o cara faz um monte de anotação sua,

**Thiago Aguiar:** Isso,

**Rafael Porto:** depo depois revisa.

**Thiago Aguiar:** isso. Exatamente.

**Rafael Porto:** Beleza? Mas aí como é que vai ser esse fluxo? Porque beleza, você veio aqui no dashboard aqui, eu só aqui eu anotei igual um CRM o que que eu fiz,

### **00:14:41** {#00:14:41}

**Thiago Aguiar:** Uhum.

**Rafael Porto:** mas isso não vai lá, não vai para o a ficha.

**Thiago Aguiar:** É, não vai para ficha.

**Rafael Porto:** Você quer que vai pra ficha automaticamente?

**Thiago Aguiar:** OK.

**Rafael Porto:** Como é que faz?

**Thiago Aguiar:** Não, esse daí, essas interações no telefone eu acho que não precisa.

**Rafael Porto:** Uhum.

**Thiago Aguiar:** a gente consegue criar mais de, vamos supor esse Thiago.

**Rafael Porto:** Talvez a gente possa botar aqui um tiquezinho assim, é acrescentar na ficha como um lembrete pro cara lembrar de botar o algo dessa interação na ficha.

**Thiago Aguiar:** Pode ser,

**Rafael Porto:** Então,

**Thiago Aguiar:** pode ser,

**Rafael Porto:** na interação com cliente

**Thiago Aguiar:** porque aí ali em nova interação ali embaixo,

**Rafael Porto:** campo para

**Thiago Aguiar:** a gente só abre um campo de igual tem o WhatsApp ali, a gente observações sobre o cliente, sei lá, entendeu?

**Rafael Porto:** Aham.

**Thiago Aguiar:** E aí faz essa, descreve aonde descreve o que foi conversado com o cliente, já põe direto essas características e depois adiciona na ficha. Ou a gente coloca aqui obrigatoriamente quando coloca observações sobre o cliente, vai direto pra ficha,

### **00:15:54** {#00:15:54}

**Rafael Porto:** Uhum. Beleza. Vou pensar nisso.

**Thiago Aguiar:** tá?

**Rafael Porto:** Pensar no fluxo que fique bom. É porque eu não trabalhei muito ainda nessa aba de cliente, tá?

**Thiago Aguiar:** Tá, tá. Não, só

**Rafael Porto:** Mas e criar o atalho também, né?

**Thiago Aguiar:** sim.

**Rafael Porto:** Criar a atalho do RM.

**Thiago Aguiar:** Sim.

**Rafael Porto:** Tá? Eh, histórico, mudança, OK. Criar configurações. A, a gente já conversou do histórico, né? Eh, bug do brief técnico, lembra? Aqui,

**Thiago Aguiar:** Lembro.

**Rafael Porto:** ó, já foi arrumado.

**Thiago Aguiar:** Tá.

**Rafael Porto:** Então, se aqui brief técnico,

**Thiago Aguiar:** Ok,

**Rafael Porto:** como é que era? Catálogo de ambientes living. Desativar aqui. O living sumiu. Ativar. Ele voltou.

**Thiago Aguiar:** ok,

**Rafael Porto:** Tranquilo, né?

**Thiago Aguiar:** tranquilo.

**Rafael Porto:** A gente também remover o estilo eh o estilo preferido.

**Thiago Aguiar:** É os estilos. Aham.

**Rafael Porto:** Tá aqui referência visual só e observações.

**Thiago Aguiar:** M is

**Rafael Porto:** Essa tabela de pontos depois a gente vai parar para ver com mais calma depois, tá?

### **00:17:39** {#00:17:39}

**Rafael Porto:** Porque como tá mexendo,

**Thiago Aguiar:** tá.

**Rafael Porto:** tá mexendo os valores, tá?

**Thiago Aguiar:** Beleza.

**Rafael Porto:** as referências visuais, tá? OK, 10 pontos. Beleza. É, e aqui é a parte também que deixou bem customizável os perfis,

**Thiago Aguiar:** Ah, tá legal.

**Rafael Porto:** lembra?

**Thiago Aguiar:** Aham.

**Rafael Porto:** Então, ó, diretoria não mexe, ele é padrão, você não tem como fazer nada com ele, ele vai ter acesso a tudo.

**Thiago Aguiar:** Tá.

**Rafael Porto:** CRM, os acessos, clientes aqui são todas as permissões que existem hoje, tá?

**Thiago Aguiar:** OK.

**Rafael Porto:** Aí se eu pegar um de gerente comercial, você pode ir ativando e desativando.

**Thiago Aguiar:** Tá.

**Rafael Porto:** Pode ativando, desativando. E o perfil ele é editável. Então eu tô aqui, eu posso editar o nome do com a descrição e o nome do perfil.

**Thiago Aguiar:** Uhum.

**Rafael Porto:** Eu não vou conseguir editar o identificador porque isso aqui fica salvo no banco, tá?

**Thiago Aguiar:** Tá.

**Rafael Porto:** A não ser que você esteja criando um novo, aí sim você.

**Thiago Aguiar:** OK. E aí já põe o nome que você quiser.

### **00:18:56** {#00:18:56}

**Rafael Porto:** Uhum. Isso por enquanto você consegue ver assim, por exemplo, eu quero ver quem são os usuários. Eu quero ver aqui eh teste CFJ. Ué, não tá indo. Ah, tá, tá. filtrando aqui embaixo. Tá vendo teste. Aí eu consigo ver que ele tá no perfil de diretoria,

**Thiago Aguiar:** Aha.

**Rafael Porto:** então eu consigo ver cada usuário em que perfil que ele tá.

**Thiago Aguiar:** Tá.

**Rafael Porto:** O legal é eu poder trocar aqui o perfil dele, né?

**Thiago Aguiar:** Como assim?

**Rafael Porto:** Tipo, ah, eu quero que esse cara deixa de ser vendedor e vire gerente.

**Thiago Aguiar:** Ah, tá. Uhum.

**Rafael Porto:** Você vem aqui e troca o perfil.

**Thiago Aguiar:** Tá.

**Rafael Porto:** Você pode filtrar por perfil para ver quem é diretoria, para ver quem que é recepção. Os filtrozinhos básicos, né? ativos.

**Thiago Aguiar:** Uhum.

**Rafael Porto:** Inativos, porque você pode inativar um perfil, tá?

**Thiago Aguiar:** Tá.

**Rafael Porto:** Então eu tenho um perfil aqui que inativo mesmo. Ué, cadê a parte de não ativar o perfil?

### **00:20:17**

**Rafael Porto:** Tá, vou rever isso aqui. Mas o certo é poder inativar e apagar o perfil.

**Thiago Aguiar:** Tá.

**Rafael Porto:** E assim na apagar, você só pode apagar. Foi as que eu defini. Só não sei porque que não tá aparecendo aqui. Alguma coisa mudou. Você só pode apagar um perfil se não tiver nenhum nenhum usuário associado a ele.

**Thiago Aguiar:** Ah, tá.

**Rafael Porto:** Se tiver usuário associado, você pode inativar.

**Thiago Aguiar:** Uhum.

**Rafael Porto:** Inativando aquele usuário que tá associado aquele perfil hoje ele continua com os acessos. Aí que que você quer definir? Se eu inativar ele perde todo o acesso. Eu tenho que dar aí se eu quiser eu dou outro acesso a ele ou se eu inativar ele continua com os acessos que ele tinha.

**Thiago Aguiar:** Isso quando você desativa o perfil, você tá falando,

**Rafael Porto:** O perfil.

**Thiago Aguiar:** né?

**Rafael Porto:** Isso. Ah, não quero que tenha mais o perfil de projetista, um exemplo. Aí eu desativo,

**Thiago Aguiar:** Aham.

**Rafael Porto:** só que eu tenho vários usuários são projetistas.

### **00:21:09** {#00:21:09}

**Rafael Porto:** Esses caras vão perder o acesso ao que eles tinham. Por que que eu falo inativar? Inativ é assim, eu não vou deixar mais criar ninguém com perfil projetista, mas quem já tinha, qual vai ser o comportamento?

**Thiago Aguiar:** Aham.

**Rafael Porto:** Perde o acesso ou mantém o acesso?

**Thiago Aguiar:** Eu acho que tem que manter o acesso a princípio.

**Rafael Porto:** É, é isso. Eu deixei desse jeito mesmo.

**Thiago Aguiar:** Agora o que a gente o que obviamente já deve já deva até certinho é se tiver um cadastro de alguém, eu inativo ele, ele tem que perder o acesso,

**Rafael Porto:** Ah, isso sim.

**Thiago Aguiar:** né? Tipo, demiti alguém,

**Rafael Porto:** Ah,

**Thiago Aguiar:** vou lá inativo ele,

**Rafael Porto:** isso aí inativa. Perdeu o acesso.

**Thiago Aguiar:** ele perde acessos.

**Rafael Porto:** Sim. Não, isso aí é tranquilo,

**Thiago Aguiar:** Tá,

**Rafael Porto:** cara. Aí do que a gente conversou na semana passada, ficou faltando eu colocar aqui aquelas fichas que seriam os guias, lembra do do briefing?

**Thiago Aguiar:** lembro.

**Rafael Porto:** Não consegui colocar ela aqui ainda,

### **00:22:09**

**Thiago Aguiar:** Tá.

**Rafael Porto:** que eu vou ter que transcrever ela,

**Thiago Aguiar:** Uhum.

**Rafael Porto:** fazer um jeito de Não deu tempo, foi muita coisa.

**Thiago Aguiar:** Uhum.

**Rafael Porto:** e o que você me mandou hoje.

**Thiago Aguiar:** Tá.

**Rafael Porto:** Então assim, que que eu tenho que fazer paraa semana que vem? Eu tenho essa parte da infra que é disponibilizar essa aqui para você ter acesso.

**Thiago Aguiar:** Uhum.

**Rafael Porto:** Tem essas coisas que a gente conversou hoje. São 1 2 3 4 5 6 itens e mais esses dois que ficou,

**Thiago Aguiar:** Tá para trás.

**Rafael Porto:** um que você mandou hoje e o outro que ficou pendente.

**Thiago Aguiar:** OK.

**Rafael Porto:** Eu acho que pra semana tá bom.

**Thiago Aguiar:** Uhum. Não, fechou. que se ainda tem que subir tudo ainda,

**Rafael Porto:** Uhum.

**Thiago Aguiar:** combinado?

**Rafael Porto:** Mas eu essas coisinhas de um pouquinho mais de trabalho para fazer,

**Thiago Aguiar:** Tá bom.

**Rafael Porto:** mas ficou, eu gostei, eu achei que ficou bem,

**Thiago Aguiar:** É, não tô gostando. A gente tá num caminho bacana.

**Rafael Porto:** a intenção é deixar o mais personalizável possível,

### **00:23:03** {#00:23:03}

**Thiago Aguiar:** É uma pergunta,

**Rafael Porto:** né?

**Thiago Aguiar:** por exemplo, Thiago,aí ele tá, sei lá, em projeto ou senão sei lá,

**Rafael Porto:** Sim.

**Thiago Aguiar:** o Thiago fechou. Vamos falar que o Thiago tá lá fechado. Aí agora o Thiago chega e ele quer fazer um outro projeto que ele esqueceu o quarto do filho.

**Rafael Porto:** Entendi.

**Thiago Aguiar:** A gente consegue botar dois Thiagoaí no camban.

**Rafael Porto:** Você vai acabar criando uma ficha nova e vai acabar aparecendo que é um cliente novo. Então é mel, eu vou ajustar isso.

**Thiago Aguiar:** É, entendeu? Porque aí também já coloca isso aí de dever de casa,

**Rafael Porto:** Uhum.

**Thiago Aguiar:** se der tempo você faz para nós.

**Rafael Porto:** Tá.

**Thiago Aguiar:** Porque vamos supor, eu tive uma cliente aqui agora recente que fechou um monte de coisa e ela tinha deixado do razinho da casa

**Rafael Porto:** Угу.

**Thiago Aguiar:** do elevador para trás. E aí, antes da gente terminar a entrega dela, ela já tava comprando de novo. E aí é interessante que esse registro fique na ficha dela também, só que ela tá em fluxos diferentes, né, em tempos diferentes.

### **00:24:19**

**Thiago Aguiar:** Cada cada pedido dela tá num num período. Mas eu acho que é isso.

**Rafael Porto:** Tô anotando aqui, eu te falo se entendi, cara. Ó, poderia associar mais de um projeto para o mesmo lead cliente e que cada projeto tenha seu próprio card no camban/crm.

**Thiago Aguiar:** Isso. Isso mesmo.

**Rafael Porto:** Beleza? Então, ó, só voltando aqui, então, ó, linha do tempo, criar o modal para sair de lá, ficar mais visível no header, exibir o perfil, poder ver como aquele lá que eu fiquei de ver como é que eu vou fazer isso, tá?

**Thiago Aguiar:** Tá.

**Rafael Porto:** Eh, agenda date e hora do término transformar em duração,

**Thiago Aguiar:** OK.

**Rafael Porto:** previsão de duração, né?

**Thiago Aguiar:** É, eu acho que você podia dar uma olhadinha no Google,

**Rafael Porto:** Hum.

**Thiago Aguiar:** só para ver mais ou menos a referência. Não sei se você concorda, porque, tipo assim, geralmente as pessoas já estão habituadas com Google.

**Rafael Porto:** Sim.

**Thiago Aguiar:** a gente seguir mais ou menos. Não precisa fazer igualzinho,

**Rafael Porto:** Aham.

**Thiago Aguiar:** mas é,

### **00:25:35**

**Rafael Porto:** o padrão, só a exibição que eu falei para você que eu acho que ficaria confuso se a gente fizesse aquele aquele tipo de exibição.

**Thiago Aguiar:** é, não, eu também acho. No caso da exibição, eu também acho.

**Rafael Porto:** Então, beleza, já coloquei aqui, veio o padrão do Google. Eu uso a agenda do Google todo dia também. Eh, em clientes, observações sobre o contato, campo de texto livre na interação com o cliente, campo para lembrete de adicionar na ficha de observação ou talvez ir automaticamente,

**Thiago Aguiar:** Isso,

**Rafael Porto:** né?

**Thiago Aguiar:** isso.

**Rafael Porto:** Vou ver pensar como fazer isso.

**Thiago Aguiar:** OK. Se você quiser colocar aí para você lembrar,

**Rafael Porto:** Criar Uhum.

**Thiago Aguiar:** coloca prontuário aí, tipo isso.

**Rafael Porto:** Prontuário. Eh, que mais? Ah, criar o atalho do do card lancer aqui pro pra ficha do cliente. Aí, essa ficha a gente vai trabalhar ainda, tá bom?

**Thiago Aguiar:** Tá. Угуm.

**Rafael Porto:** Até porque vai ter mais de um projeto e e aqui tá tá incompatível com isso. Poder associar mais de um projeto para o mesmo lead e que cada projeto tenha seu próprio card no camban. Então foi esses pontos. O que foi feito, tá beleza, então né? Okay.

**Leandro Mantovani:** M.

**Thiago Aguiar:** Так. aqui. Perfeito.

**Rafael Porto:** Pô, saindo.

**Thiago Aguiar:** Nossa.

**Rafael Porto:** Vê se na terça eu entrego pro Leandro subir. Isso. Pode ser Leandro.

**Leandro Mantovani:** Aham.

**Thiago Aguiar:** Aham. Ele nem sabe o que você tá falando. Tá. Tô brincando.

**Leandro Mantovani:** Seu c\*.

**Rafael Porto:** Nem sabia sobre. Vou parar de gravar aqui agora. Parar de fazer anotação.

### **A transcrição foi encerrada após 00:27:29**

*Esta transcrição editável foi gerada por computador e pode conter erros. As pessoas também podem alterar o texto depois que ele for criado.*