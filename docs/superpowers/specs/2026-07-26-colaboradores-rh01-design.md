# Módulo Colaboradores — RH01 Cadastro do Colaborador — Design

**Data:** 2026-07-26
**Branch:** a definir (sugestão: `feature/colaboradores-rh01`)
**Status:** aprovado, aguardando plano de implementação

## Contexto

O usuário trouxe um SRS próprio (`SRS_RH_v1.docx`, raiz do projeto) descrevendo uma expansão de RH e Departamento Pessoal com 11 submódulos (RH01–RH11): cadastro do colaborador, comissões e remuneração variável, férias e afastamentos, acordos e ajustes, avaliação de desempenho + PDI, plano de carreira, manual/normas/políticas, folha de pagamento assistida, benefícios, clima organizacional e portal do colaborador. É um documento do tamanho de um SRS inteiro por si só — maior, inclusive, do que o módulo Especificadores levou para reconciliar.

Este spec cobre **só o RH01 — Cadastro do Colaborador**, separado do restante porque é explicitamente a base de que todos os outros módulos dependem (`colaborador_id` é FK em praticamente toda entidade descrita no SRS, seção 18). Os demais 10 submódulos ficam no backlog (ver seção final) para specs futuros, um de cada vez.

## Decisões de escopo

- **Novo perfil `RH`** no enum `PerfilUsuario` (`app/models/user.py`). Só `RH` e `DIRETORIA` têm acesso ao módulo Colaboradores nesta entrega — os demais perfis (incluindo líderes/gestores) não veem nem editam nada aqui ainda. Isso simplifica a regra RH-RN010 (remuneração complementar visível só a RH/Diretoria): como só esses dois perfis acessam o módulo inteiro, a regra já vale por construção. Ela volta a ser relevante de verdade quando o Portal do Colaborador (RH11) for implementado e outros perfis ganharem acesso de leitura.
- **`Colaborador` linkado a `User` via `user_id` opcional.** Reaproveita nome/e-mail/telefone/perfil de quem já tem login; colaboradores PJ ou sem acesso ao sistema podem existir sem `User` vinculado. Só gestores (RH/Diretoria) cadastram — não há autoatendimento nesta entrega.
- **`Departamento` e `Cargo` viram entidades próprias** (tabelas simples, geridas por RH/Diretoria), não texto livre — evita inconsistência de digitação e prepara terreno para o RH06 (Plano de Carreira, que anexa política salarial e requisitos por cargo) sem precisar migrar dado depois.
- **Documentos do colaborador usam só campo de URL**, mesmo padrão já usado em `Fechamento` (`contrato_url`, `comprovante_url`) — colado manualmente, sem endpoint de upload real. O projeto não tem infraestrutura de upload de arquivo em lugar nenhum ainda; abrir essa frente fica fora desta entrega.
- **Dados bancários ficam como campo normal por enquanto**, sem criptografia de campo. Ambiente ainda é demo/dev (dados de teste, sem valor real, conforme CLAUDE.md) — criptografia entra na lista de itens a resolver quando o projeto migrar para produto real, junto da rotação de `SECRET_KEY` já prevista.
- **Campos de PJ (CNPJ, contrato de prestação, valor mensal, vigência) entram nesta entrega**, condicionais a `regime == PJ`.
- **Histórico salarial e histórico de cargo são imutáveis** — só `POST` de novo registro, nunca `PUT`/`DELETE`, mesmo padrão já usado em `HistoricoDonoArquiteto`/`HistoricoStatusProjeto`. O valor "atual" fica denormalizado em `Colaborador` (salário vigente, cargo atual) para leitura rápida; toda alteração passa por endpoint dedicado que grava o histórico **e** atualiza o valor atual — nunca edição direta desses campos via `PUT` genérico.
- **Colaborador nunca é deletado**, só desligado (`is_active=False` + bloco de desligamento preenchido), mesmo padrão RN017 do módulo Especificadores.
- **Documentos (`DocumentoColaborador`) viram tabela própria**, não colunas fixas — permite múltiplos documentos do mesmo tipo ao longo do tempo (ex.: vários exames periódicos) e já deixa `data_vencimento` pronto para o alerta futuro (RH-RF003), sem fixar uma lista rígida.
- **`gestor_id` aponta para `Colaborador.id`** (auto-relacionamento), não para `User.id` — segue a modelagem da seção 18 do SRS. O gestor também tem sua própria ficha de colaborador.
- **Melhorias além do SRS literal incluídas nesta entrega**: validação de CPF (dígito verificador + unicidade) e mini organograma na ficha (gestor direto + subordinados diretos). Avaliadas e descartadas para esta entrega: criar login direto da ficha, e painel de KPI de headcount na listagem — ambas ficam no backlog.

## 1. Novo perfil RH

`app/models/user.py`:

```python
class PerfilUsuario(str, enum.Enum):
    ...
    RH = "rh"
```

Adicionado a `PERFIS_INTERNOS`. Não entra em `PERFIS_GESTAO` (que representa "acesso total ao sistema", conceito diferente de "acesso ao módulo Colaboradores").

## 2. Entidades — `app/models/colaborador.py` (novo arquivo)

```python
class RegimeContratacao(str, enum.Enum):
    CLT = "clt"
    PJ = "pj"

class ModalidadeTrabalho(str, enum.Enum):
    PRESENCIAL = "presencial"
    HIBRIDO = "hibrido"
    REMOTO = "remoto"

class TipoDesligamento(str, enum.Enum):
    PEDIDO_DEMISSAO = "pedido_demissao"
    DISPENSA_SEM_JUSTA_CAUSA = "dispensa_sem_justa_causa"
    DISPENSA_COM_JUSTA_CAUSA = "dispensa_com_justa_causa"

class TipoDocumentoColaborador(str, enum.Enum):
    CTPS = "ctps"
    ASO_ADMISSIONAL = "aso_admissional"
    CONTRATO_ASSINADO = "contrato_assinado"
    EXAME_PERIODICO = "exame_periodico"
    CERTIDAO = "certidao"
    PIS_PASEP = "pis_pasep"
    OUTRO = "outro"


class Departamento(Base):
    __tablename__ = "departamentos"
    id = Column(Integer, primary_key=True, index=True)
    nome = Column(String(150), nullable=False)
    ativo = Column(Boolean, default=True)


class Cargo(Base):
    __tablename__ = "cargos"
    id = Column(Integer, primary_key=True, index=True)
    nome = Column(String(150), nullable=False)
    departamento_id = Column(Integer, ForeignKey("departamentos.id"), nullable=False)
    ativo = Column(Boolean, default=True)


class Colaborador(Base):
    __tablename__ = "colaboradores"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=True)

    # Identificação
    nome = Column(String(200), nullable=False)
    cpf = Column(String(14), nullable=False, unique=True, index=True)
    rg = Column(String(20), nullable=True)
    data_nascimento = Column(Date, nullable=True)
    sexo = Column(String(20), nullable=True)
    estado_civil = Column(String(30), nullable=True)
    foto_url = Column(String(500), nullable=True)

    # Contato
    telefone = Column(String(20), nullable=True)
    email_pessoal = Column(String(200), nullable=True)
    email_corporativo = Column(String(200), nullable=True)
    endereco_logradouro = Column(String(300), nullable=True)
    endereco_numero = Column(String(20), nullable=True)
    endereco_complemento = Column(String(100), nullable=True)
    endereco_bairro = Column(String(100), nullable=True)
    endereco_cidade = Column(String(100), nullable=True)
    endereco_estado = Column(String(2), nullable=True)
    endereco_cep = Column(String(10), nullable=True)

    # Contratação
    data_admissao = Column(Date, nullable=False)
    cargo_id = Column(Integer, ForeignKey("cargos.id"), nullable=False)
    departamento_id = Column(Integer, ForeignKey("departamentos.id"), nullable=False)
    regime = Column(SAEnum(RegimeContratacao), nullable=False)
    tipo_contrato = Column(String(100), nullable=True)

    # PJ (condicional a regime == PJ)
    pj_cnpj = Column(String(20), nullable=True)
    pj_contrato_url = Column(String(500), nullable=True)
    pj_valor_mensal = Column(Numeric(10, 2), nullable=True)
    pj_vigencia_inicio = Column(Date, nullable=True)
    pj_vigencia_fim = Column(Date, nullable=True)

    # Remuneração atual (denormalizado — trilha fica em HistoricoSalarialColaborador)
    salario_clt = Column(Numeric(10, 2), nullable=True)
    remuneracao_complementar = Column(Numeric(10, 2), nullable=True)
    data_vigencia_salario = Column(Date, nullable=True)

    # Regime de trabalho
    carga_horaria = Column(String(50), nullable=True)
    escala = Column(String(100), nullable=True)
    modalidade = Column(SAEnum(ModalidadeTrabalho), nullable=True)
    jornada_especial = Column(String(200), nullable=True)

    # Dados bancários
    banco = Column(String(100), nullable=True)
    agencia = Column(String(20), nullable=True)
    conta = Column(String(20), nullable=True)
    tipo_conta = Column(String(20), nullable=True)

    # Organograma
    gestor_id = Column(Integer, ForeignKey("colaboradores.id"), nullable=True)

    # Desligamento
    is_active = Column(Boolean, default=True)
    data_desligamento = Column(Date, nullable=True)
    tipo_desligamento = Column(SAEnum(TipoDesligamento), nullable=True)
    motivo_desligamento = Column(Text, nullable=True)
    entrevista_saida = Column(Text, nullable=True)

    criado_em = Column(DateTime(timezone=True), server_default=func.now())
    atualizado_em = Column(DateTime(timezone=True), onupdate=func.now())


class HistoricoSalarialColaborador(Base):
    __tablename__ = "historico_salarial_colaboradores"
    id = Column(Integer, primary_key=True, index=True)
    colaborador_id = Column(Integer, ForeignKey("colaboradores.id"), nullable=False)
    salario_clt = Column(Numeric(10, 2), nullable=False)
    remuneracao_complementar = Column(Numeric(10, 2), nullable=True)
    data_vigencia = Column(Date, nullable=False)
    motivo = Column(String(300), nullable=False)
    registrado_por_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    criado_em = Column(DateTime(timezone=True), server_default=func.now())


class HistoricoCargoColaborador(Base):
    __tablename__ = "historico_cargo_colaboradores"
    id = Column(Integer, primary_key=True, index=True)
    colaborador_id = Column(Integer, ForeignKey("colaboradores.id"), nullable=False)
    cargo_anterior_id = Column(Integer, ForeignKey("cargos.id"), nullable=True)
    cargo_novo_id = Column(Integer, ForeignKey("cargos.id"), nullable=False)
    data = Column(Date, nullable=False)
    aprovado_por_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    justificativa = Column(String(300), nullable=True)
    criado_em = Column(DateTime(timezone=True), server_default=func.now())


class DocumentoColaborador(Base):
    __tablename__ = "documentos_colaboradores"
    id = Column(Integer, primary_key=True, index=True)
    colaborador_id = Column(Integer, ForeignKey("colaboradores.id"), nullable=False)
    tipo = Column(SAEnum(TipoDocumentoColaborador), nullable=False)
    url = Column(String(500), nullable=False)
    data_vencimento = Column(Date, nullable=True)
    criado_em = Column(DateTime(timezone=True), server_default=func.now())
```

CPF: validado no schema Pydantic (`schemas/colaborador.py`) com checagem de dígito verificador (algoritmo padrão de CPF) além da constraint `unique` no banco.

## 3. Endpoints — `app/api/v1/endpoints/colaboradores.py` (novo router, prefixo `/colaboradores`)

Todas as rotas usam `require_roles(PerfilUsuario.RH, PerfilUsuario.DIRETORIA)`. Rotas fixas declaradas antes das dinâmicas (`/{id}`), conforme padrão do projeto.

```
GET    /colaboradores/departamentos              lista departamentos
POST   /colaboradores/departamentos              cria departamento
PUT    /colaboradores/departamentos/{id}          edita (nome/ativo)

GET    /colaboradores/cargos                      lista cargos (filtro opcional departamento_id)
POST   /colaboradores/cargos                       cria cargo
PUT    /colaboradores/cargos/{id}                  edita (nome/ativo)

GET    /colaboradores/                             lista + filtros: departamento_id, cargo_id, regime, is_active, busca (nome/cpf)
POST   /colaboradores/                             cria colaborador (inclui salario_clt/data_vigencia inicial -> grava também 1º registro em HistoricoSalarialColaborador e HistoricoCargoColaborador)
GET    /colaboradores/{id}                         detalhe + gestor (nome/cargo) + subordinados_diretos (lista id/nome/cargo)
PUT    /colaboradores/{id}                         edita dados cadastrais (NÃO inclui salario_clt/cargo_id atuais — bloqueados nesta rota)
POST   /colaboradores/{id}/desligar                registra desligamento (data, tipo, motivo, entrevista_saida) e seta is_active=False

POST   /colaboradores/{id}/historico-salarial      adiciona novo registro salarial + atualiza salario_clt/remuneracao_complementar/data_vigencia_salario no Colaborador
GET    /colaboradores/{id}/historico-salarial      lista histórico (somente leitura)

POST   /colaboradores/{id}/historico-cargo         adiciona promoção/mudança de cargo + atualiza cargo_id atual no Colaborador
GET    /colaboradores/{id}/historico-cargo         lista histórico (somente leitura)

POST   /colaboradores/{id}/documentos              adiciona documento
GET    /colaboradores/{id}/documentos              lista documentos
DELETE /colaboradores/{id}/documentos/{doc_id}     remove documento (não é trilha de auditoria — só um anexo)
```

`PUT /colaboradores/{id}` rejeita tentativa de alterar `salario_clt`, `remuneracao_complementar`, `data_vigencia_salario`, `cargo_id` diretamente (RH-RN001) — esses campos só mudam via os endpoints de histórico dedicados.

`POST /colaboradores/{id}/desligar` bloqueia (400) se `is_active` já for `False`.

## 4. Regras de negócio cobertas nesta entrega

| RN/RF | Descrição | Onde |
|---|---|---|
| RH-RF001 | Ficha completa + histórico imutável de salário/cargo | `Colaborador` + histórico endpoints |
| RH-RF002 | Histórico de promoções com cargo anterior/novo, data, aprovador, justificativa | `HistoricoCargoColaborador` |
| RH-RF003 | Upload de documentos com data de vencimento (sem o alerta automático ainda — backlog) | `DocumentoColaborador` |
| RH-RF004 / RH-RN009 | Nunca excluir colaborador, só inativar com data/motivo | `is_active` + bloco desligamento |
| RH-RF005 | Colaborador PJ com CNPJ, contrato, valor mensal, vigência | Campos `pj_*` |
| RH-RN001 | Histórico salarial/cargo imutável, sem alteração retroativa | Só `POST` nos endpoints de histórico; `PUT` do colaborador rejeita esses campos |
| RH-RN010 | Remuneração complementar visível só a RH/Diretoria | Satisfeita por construção (só esses perfis acessam o módulo) |

## 5. Frontend

- Sidebar: novo item "Colaboradores", visível só para perfis `RH`/`DIRETORIA` (mesmo padrão de itens condicionais por perfil já existente).
- `App.jsx`: rotas `/colaboradores` e `/colaboradores/:id`.
- `lib/api.js`: `colaboradoresApi`, `departamentosApi`, `cargosApi`.
- `lib/constants.js`: `REGIME_CONFIG`, `MODALIDADE_CONFIG`, `TIPO_DOCUMENTO_LABELS`, `TIPO_DESLIGAMENTO_LABELS`.
- `pages/colaboradores/ColaboradoresPage.jsx` — listagem + filtros (departamento, cargo, regime, status) + modal "Novo Colaborador".
- `pages/colaboradores/ColaboradorDrawer.jsx` + `ColaboradorTabs.jsx` — mesmo padrão do módulo Especificadores (`EspecificadorDrawer`/`EspecificadorTabs`), com abas:
  - **Perfil** — identificação, contato, endereço, gestor direto + subordinados diretos (mini organograma), botão "Desligar" (abre modal com data/tipo/motivo/entrevista).
  - **Contratação** — regime, cargo, departamento, campos PJ (só visíveis se `regime === 'pj'`), regime de trabalho, dados bancários.
  - **Remuneração** — valor atual + histórico (lista somente-leitura) + form de novo lançamento.
  - **Cargo & Progressão** — cargo atual + histórico de promoções (lista somente-leitura) + form de nova promoção.
  - **Documentos** — lista de documentos + form de novo documento (tipo, URL, data de vencimento).
- Formulário de cadastro valida CPF (dígito verificador) no client antes de enviar, espelhando a validação do backend (mesmo padrão do score de briefing, que já espelha `briefing_score.py` no frontend).

## Fora de escopo (fica para specs futuros)

- **RH02–RH11**: Comissões e Remuneração Variável, Férias e Afastamentos, Acordos e Ajustes, Avaliação de Desempenho + PDI, Plano de Carreira e Progressão, Manual/Normas/Políticas, Folha de Pagamento Assistida, Benefícios, Clima Organizacional, Portal do Colaborador — cada um vira spec próprio quando chegar a vez.
- Upload real de arquivo (infraestrutura de storage) — todo o projeto usa campo de URL hoje.
- Criptografia de dados bancários — item de dívida técnica para quando o projeto migrar de demo para produto real.
- Alertas automáticos (documento vencendo, aniversário de empresa etc.) — depende de motor de notificação, hoje só com tipos criados e execução pendente (mesmo estado do módulo Especificadores).
- Criar login direto da ficha do colaborador (considerado, descartado nesta entrega).
- Painel de KPI de headcount na listagem (considerado, descartado nesta entrega).

## Backlog (referência futura, não faz parte deste spec)

1. RH02 Comissões — motor de cálculo por cargo, faixas de meta, aprovação dupla, composição CLT/complementar
2. RH03 Férias e Afastamentos — fluxo completo com período aquisitivo, aprovação, homologação
3. RH04 Acordos e Ajustes — adiantamentos, banco de horas, bonificações, rescisão
4. RH05 Avaliação de Desempenho + PDI — ciclo semestral, autoavaliação, avaliação do líder, PDI conjunto
5. RH06 Plano de Carreira — trilha Júnior/Pleno/Sênior, elegibilidade de promoção, fluxo de aprovação
6. RH07 Manual, Normas e Políticas — upload de PDFs, descrição de cargos, política salarial por cargo
7. RH08 Folha de Pagamento Assistida — consolidação e exportação para contabilidade
8. RH09 Benefícios — elegibilidade, custo por colaborador/departamento, dependentes
9. RH10 Clima Organizacional — pesquisa periódica, eNPS, anonimato garantido
10. RH11 Portal do Colaborador — acesso self-service (holerite, férias, PDI, políticas, comunicados)
11. Criar login direto da ficha do colaborador
12. Painel de KPI de headcount/turnover na listagem de Colaboradores
13. Upload real de arquivo + criptografia de dados sensíveis
14. Alertas automáticos de documento vencendo / aniversário de empresa (quando o motor de notificação existir)

## Testes

Backend (SQLite in-memory + `TestClient`, conforme padrão do projeto): criação de colaborador com CPF inválido é rejeitada (400); CPF duplicado é rejeitado; `PUT /colaboradores/{id}` rejeita alteração direta de `salario_clt`/`cargo_id`; `POST /colaboradores/{id}/historico-salarial` grava histórico e atualiza valor atual; idem para histórico de cargo; `POST /colaboradores/{id}/desligar` seta `is_active=False` e bloqueia segundo desligamento; nenhum endpoint permite `DELETE` de colaborador; `GET /colaboradores/{id}` retorna `subordinados_diretos` corretamente calculado via `gestor_id`; endpoints do módulo retornam 403 para perfis fora de `RH`/`DIRETORIA`.

Frontend: verificação manual via skill `run` — cadastro completo (CLT e PJ), edição, lançamento de novo salário/cargo refletindo no histórico e no valor atual, desligamento, upload de documento (URL), mini organograma exibindo gestor e subordinados corretamente, item de sidebar visível só para RH/Diretoria.
