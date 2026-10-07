// Estrutura da DTI: a que existe hoje e a minuta de proposta.
//
// Vem com o sistema, como a lista de ramais — é material de consulta e de
// discussão, igual para todo mundo, sem nada a gravar por navegador. Desenho
// de estrutura se decide em ato do Tribunal, não no localStorage de quem
// abriu a tela.
//
// A ESTRUTURA ATUAL é o organograma da Superintendência de Tecnologia da
// Informação (arquivo Organograma_TCM, outubro de 2026): a STI, vinculada ao
// Gabinete da Presidência, com duas Diretorias abaixo — Tecnologia da
// Informação e Projetos e Planejamento —, as Coordenações de cada uma e as
// equipes das Coordenações.
//
// Os nomes estão grafados como no documento, que em geral traz só o primeiro
// nome. O nome completo entra em `nomeNaRelacao` — que serve à busca e não
// aparece em tela — só onde a pessoa é identificável sem ambiguidade na
// relação de lotação ou na relação Netra, na mesma unidade. "Ana" (PO),
// "Diego" (Automações), "Daniel", "Barbosa" e os três nomes do Squad de Elite
// ficam sem ele: cruzar pelo primeiro nome poria o nome errado ao lado da
// pessoa certa. Cargo e vínculo também só entram onde o documento os declara
// — "(DAS 3)", "(Terc.)", "(Efetiva)".
//
// O que o documento desenha sem nome não é preenchido: "Tec 1", "Dev 2" e o
// "SM" vazio entram em `postos`, que contam no balão de cargos mas não no
// total de pessoas; a liderança marcada com "?" e a "Novo (Terc.)" entram em
// `titularPendente`, com as palavras da pendência. As Coordenações e equipes
// não têm sigla no documento e por isso trazem `exibirSigla: false`: a sigla
// fica como chave interna do painel, e a tela mostra só o nome.
//
// O Gabinete da Presidência (Chefia de Gabinete, Assessoria e Secretária
// Executiva) está no documento acima da STI e fica fora do desenho, que é o
// da área de TI: entra só como subordinação do topo e nas notas.
//
// Ramal não entra aqui de propósito. Quem procura número usa o módulo Ramais.
//
// A ESTRUTURA SUGERIDA é minuta de trabalho, e a tela diz isso em todo lugar
// onde ela aparece. Ela desenha ESTRUTURA, e não pessoas: nenhuma unidade dela
// declara quadro nominal, cada caixa informa o nível e o cargo que o ocupa
// (DAS-4, DAS-3, equipe contratada ou quadro efetivo) e o único nome do
// desenho é o do titular de hoje na Superintendência. Quem quiser ver quem
// está onde usa a estrutura atual, que é onde esse dado existe.
//
// Nenhuma unidade de hoje é extinta e nenhuma perde quadro: a
// camada de operação muda de denominação — Divisão passa a Coordenação, a Seção
// de Atendimento sobe a Coordenação de Suporte Técnico e o Banco de Dados passa
// a Núcleo sob a Coordenação de Sistemas —, uma camada de direção é criada
// acima dela e as responsabilidades que hoje existem sem unidade própria ganham
// uma. As unidades novas (a Diretoria de Projetos de TIC, suas duas
// Coordenações e o Núcleo de UX/UI) nascem sem titular e sem quadro na minuta,
// porque provimento, remanejamento e criação de cargo comissionado são atos do
// Tribunal, e as siglas propostas ficam declaradas como propostas.
//
// A ESTRUTURA NETRA é a relação que a própria Netra Tecnologia encaminhou ao
// Tribunal no âmbito do Contrato nº 65/2022 (CON-RQ-30, ofício
// NETRA-CON-26213, de 02/10/2026, assinado eletronicamente): 41 profissionais
// em 7 áreas, cada uma com o gestor do Tribunal a quem respondem, e, na DDES,
// o líder de cada profissional. Os nomes, cargos, gestores e líderes estão
// grafados como no documento — "Sandrinha" e "Sandra" inclusive, que a
// relação não diz se são a mesma pessoa. As áreas fora da DTI (DDP e SCE)
// entram só pela sigla, porque o ofício não as nomeia.
//
// O ofício também traz o salário de cada profissional. Ele não entra aqui de
// propósito: o site é público, e remuneração nominal de empregado de empresa
// contratada é dado pessoal que não se publica em organograma.
//
// O QUE A TELA USA HOJE. O módulo ficou com o fluxograma e a lista da equipe,
// e só lê:
//
//   · da visão: `rotulo`, `minuta`, `organograma` (linha de apoio em pessoas
//     nomeadas e postos sem nome), `estrutural` (desenha só a estrutura: sem
//     contagem de pessoas, sem lista de equipe e sem caixa clicável) e
//     `totalDeCargos` (o balão ao lado do topo);
//   · da unidade: `sigla`, `exibirSigla`, `nome`, `natureza`, `cargo` (o par
//     nível-cargo no selo, que também tira o nome de responsável da caixa),
//     `ramal`,
//     `portaDeEntrada`, `estado`, `titularADesignar`, `titularPendente` e
//     `semTitular` (o que a caixa diz quando não há titular), `frentes`
//     (caixas de frente abaixo da unidade, sem pessoa), `escopo` (linhas na
//     própria caixa), `postos` (cargos sem nome), `pessoas`, `subunidades`,
//     `funcoes`/`funcoesAcumuladas` (que alimentam a métrica do portal) e
//     `lotacao`/`observacao` (no painel de uma unidade sem equipe própria e na
//     lista de cargos da folha);
//   · da pessoa: `nome`, `cargo`, `matricula`, `vinculo`, `papel`, `nivel`,
//     `funcao` e `lider`.
//
// A visão Netra acrescenta, na visão, `contratada` (o resumo conta
// profissionais por cargo, e não por vínculo) e `fonte` (o rodapé do papel);
// na unidade, `gestor` e `funcaoDoGestor` (quem responde pela área, quando ele
// não está no quadro listado) e, no topo, `legenda` e `referencia`.
//
// Os demais campos — `chamada`, `resumo`, `procedencia`, `atribuicoes`,
// `justificativa`, `origem`, `subordinacao`, `notas`, `notasTitulo` e
// `mudancas` — não aparecem em tela nenhuma: ficam como registro do
// levantamento e da minuta, e voltam a ser exibidos no dia em que a Diretoria
// pedir o detalhamento de volta. Quem editar a estrutura pode ignorá-los sem
// quebrar nada.

(function () {
  // Pessoa do organograma da STI: nome como grafado no documento e, só onde
  // ele declara, cargo e vínculo. O que o documento não diz fica vazio, em vez
  // de ser completado por conta própria.
  const pessoa = (nome, campos) => ({ nome, papel: "organograma", ...(campos || {}) });

  // Na minuta o titular de hoje passa a Superintendente. O quadro é separado
  // do da estrutura atual de propósito: compartilhá-lo faria o cargo proposto
  // aparecer também na estrutura vigente. Traz só o cargo do topo — a minuta
  // desenha estrutura, e este é o único nome que ela nomeia.
  const QUADRO_SUPERINTENDENCIA = [
    {
      nome: "Diego Daltro",
      nomeNaRelacao: "Diego Cavalcante Teixeira",
      matricula: "217796",
      vinculo: "Efetivo",
      cargo: "Superintendente de Tecnologia da Informação",
      papel: "chefia",
    },
  ];

  // Profissional da Netra: cargo do plano de cargos da empresa e, onde a
  // relação informa, o líder a quem responde no dia a dia.
  const netra = (nome, nivel, lider) => ({ nome, nivel, lider: lider || "", papel: "contratada" });

  const NETRA_DINT = [
    netra("Adson Alexandre Borges de Jesus", "Sênior III"),
    netra("Diego Viana Santos", "Pleno II"),
    netra("Edvaldo Souza dos Santos", "Pleno III"),
  ];

  const NETRA_SEATU = [
    netra("Aislã dos Santos da Anunciação", "Técnico"),
    netra("Caique Nascimento da Anunciação", "Técnico"),
    netra("Eduardo Nascimento da Silva", "Pleno I"),
    netra("Ian de Aguiar Fagundes", "Técnico"),
    netra("Ivan de Jesus Junior", "Técnico"),
    netra("Lucas Silva Gonçalves", "Júnior I"),
    netra("Valmirete Paula Santos da Silva", "Técnico"),
    netra("Vinicius Matias dos Santos Santana", "Pleno I"),
  ];

  const NETRA_DDES = [
    netra("Aldair Silva de Araújo", "Júnior II", "Sandrinha"),
    netra("Ana Paula Ferreira Lordelo", "Pleno II", "Ayala"),
    netra("Caio Gabriel Cruz Amorim", "Júnior I", "Lourival"),
    netra("Carlos Henrique Morais Cardoso", "Pleno I", "Ayala"),
    netra("Claudia Carvalho dos Santos", "Sênior II", "Lucas"),
    netra("Diego de Almeida Menezes", "Sênior III", "Fabrício"),
    netra("Elaine da Anunciação Passos", "Sênior I", "Ayala"),
    netra("Evânia Fernandes dos Santos", "Sênior I", "Fabrício"),
    netra("Gabriel Silva de Matos", "Júnior II", "Lucas"),
    netra("Guilherme da Silva Boaventura", "Júnior III", "Melly"),
    netra("Jaime Valverde Silva", "Sênior II", "Lucas"),
    netra("Jefferson Azevedo Lins", "Master II", "Ayala"),
    netra("José Carlos Teixeira Júnior", "Sênior I", "Mauro Portugal"),
    netra("José Daniel Machado Soares", "Sênior II", "Ayala"),
    netra("Leonardo Oliveira da Silva Santos", "Júnior III", "Sandra"),
    netra("Luan Santana Santos", "Pleno II", "Lourival"),
    netra("Lucca Barbosa Nygaard", "Júnior II", "Fabrício"),
    netra("Lucio de Castro Sacramento", "Sênior II", "Lourival"),
    netra("Marcos Alberto Morais Assis", "Sênior IV", "Fabrício"),
    netra("Marlon Nascimento Lopes", "Sênior III", "Ayala"),
    netra("Maurício Machado de Oliveira Matos", "Sênior IV", "Fabrício"),
    netra("Pablo Freire Barreto", "Sênior II", "Fabrício"),
    netra("Pedro Martins Caires", "Júnior I", "Ayala"),
  ];

  const NETRA_DTI = [netra("Fabiana Dumiense Costa", "Sênior II")];

  const NETRA_DBAD = [
    netra("Jorge Luis Cruz Duarte", "Sênior II"),
    netra("Cristiano Araújo Silva", "Sênior V"),
    netra("Larissa de Oliveira Pinheiro", "Sênior III"),
    netra("Mirella Lima Saraiva Araújo", "Sênior I"),
  ];

  const NETRA_DDP = [netra("Pollianna Cecília Fontes Castelhano", "Sênior III")];

  const NETRA_SCE = [netra("Elisângela Melquiades Nascimento", "Júnior II")];

  // Data do levantamento em que a estrutura se baseia. Não há semente a
  // aplicar por navegador — a estrutura é lida do arquivo a cada carga —, mas
  // a marca serve de registro de qual versão do levantamento está em tela.
  window.SAA_ESTRUTURA_VERSAO = "2026-10-07";

  window.SAA_ESTRUTURA = {
    // Funções de TI usadas na comparação entre as duas visões. A pergunta que
    // elas respondem é "esta responsabilidade tem unidade própria ou é
    // exercida por acúmulo?", que é onde as duas estruturas divergem.
    funcoes: [
      { id: "atendimento", rotulo: "Atendimento ao usuário" },
      { id: "infraestrutura", rotulo: "Infraestrutura e operações" },
      { id: "sistemas", rotulo: "Desenvolvimento de sistemas" },
      { id: "dados", rotulo: "Banco de dados" },
      { id: "governanca", rotulo: "Governança, contratos e projetos" },
      { id: "seguranca", rotulo: "Segurança da informação" },
      { id: "informacao", rotulo: "Informação gerencial e painéis" },
    ],

    // Organograma da Superintendência de Tecnologia da Informação (arquivo
    // Organograma_TCM, outubro de 2026). A árvore segue o documento nó a nó:
    // STI → duas Diretorias → Coordenações → equipes. O que o documento
    // pendura abaixo de uma equipe sem ser pessoa — sistemas sustentados,
    // entregas de uma coordenação — vai em `escopo`, e os postos sem nome
    // ("Tec 1", "Dev 2") vão em `postos`.
    atual: {
      rotulo: "Estrutura atual",
      chamada: "Organograma da Superintendência de Tecnologia da Informação",
      organograma: true,
      // O balão ao lado do topo conta o que está em tela — pessoas nomeadas e
      // postos sem nome —, em vez de trazer um número gravado.
      cargosDoQuadro: true,
      fonte:
        "Organograma da Superintendência de Tecnologia da Informação do TCM-BA (Organograma_TCM, outubro de 2026). Nomes grafados como no documento; postos sem nome e lideranças marcadas com “?” constam como pendências.",
      resumo:
        "A Superintendência de Tecnologia da Informação, vinculada ao Gabinete da Presidência, dirige duas Diretorias. A de Tecnologia da Informação reúne três Coordenações — Infraestrutura, Suporte Técnico e Sistemas e Automações — e a de Projetos e Planejamento, duas — Projetos e Planejamento Estratégico.",
      procedencia:
        "Montada a partir do organograma da STI. Os nomes seguem a grafia do documento, que traz em geral só o primeiro nome; o nome completo entra em `nomeNaRelacao` apenas onde a pessoa é identificável sem ambiguidade na relação de lotação ou na relação Netra, na mesma unidade.",
      notasTitulo: "Leitura da estrutura atual",
      notas: [
        "A Diretoria de Tecnologia da Informação deixa de ser o topo: acima dela fica a Superintendência (DAS-5), e ao lado dela nasce a Diretoria de Projetos e Planejamento (DAS-4).",
        "A Seção de Atendimento ao Usuário dá lugar à Coordenação de Suporte Técnico, no mesmo nível das Coordenações de Infraestrutura e de Sistemas e Automações.",
        "O Banco de Dados passa a equipe da Coordenação de Infraestrutura, com o mesmo líder e a mesma equipe, acrescida de uma terceirizada.",
        "A Coordenação de Sistemas e Automações concentra a maior parte da estrutura: análise de requisitos, painéis de BI e portais, automações e sistemas e plataformas, esta com as frentes de desenvolvimento, sustentação interna e sustentação do legado.",
        "Governança passa a ter unidade própria na Diretoria de Projetos e Planejamento: processos e contratos, plano estratégico, normativas, planejamento de equipamentos e serviços e fiscalizações.",
        "Segurança da informação segue sem unidade própria: aparece no organograma como normativa do Plano Estratégico de TI, sob a Coordenação de Planejamento Estratégico.",
        "Postos sem nome no organograma — técnicos de infraestrutura e de suporte, desenvolvedores das fábricas e de automações, o Scrum Master — entram como postos, e não como pessoas.",
        "O documento traz “Processos e Contatos” sob a Coordenação de Projetos; como os itens são ordens de serviço e termos de referência, a tela grafa “Processos e Contratos”.",
        "O Gabinete da Presidência, acima da STI, aparece no documento com a Chefia de Gabinete (Aristides), a Assessoria (sem titular declarado) e a Secretária Executiva (Carmem). Fica fora do desenho, que é da área de TI.",
      ],
      topo: {
        sigla: "STI",
        nome: "Superintendência de Tecnologia da Informação",
        natureza: "Superintendência",
        subordinacao: "Gabinete da Presidência",
        referencia: "Vinculada ao Gabinete da Presidência",
        atribuicoes: [
          "Direção superior da área de tecnologia, com as duas Diretorias subordinadas",
          "Planejamento, portfólio e prioridades de TI do Tribunal",
        ],
        observacao:
          "A relação de lotação registra, para a matrícula 217796, o nome Diego Cavalcante Teixeira. O organograma segue a designação informada pela Diretoria.",
        pessoas: [
          {
            nome: "Diego Daltro",
            nomeNaRelacao: "Diego Cavalcante Teixeira",
            matricula: "217796",
            vinculo: "Efetivo",
            cargo: "Superintendente de Tecnologia da Informação, DAS-5",
            papel: "chefia",
          },
        ],
      },
      unidades: [
        {
          sigla: "DTI",
          nome: "Diretoria de Tecnologia da Informação",
          natureza: "Diretoria",
          subordinacao: "Superintendência de Tecnologia da Informação",
          funcoes: [],
          atribuicoes: [
            "Direção das Coordenações de Infraestrutura, de Suporte Técnico e de Sistemas e Automações",
            "Entrega e sustentação dos serviços de TI do Tribunal",
          ],
          pessoas: [
            pessoa("Felipe Alabi", { cargo: "Diretor de Tecnologia da Informação, DAS-4", papel: "chefia" }),
          ],
          subunidades: [
            {
              sigla: "CINFRA",
              exibirSigla: false,
              nome: "Coordenação de Infraestrutura",
              natureza: "Coordenação",
              funcoes: ["infraestrutura"],
              pessoas: [
                pessoa("Rafael Levita", {
                  nomeNaRelacao: "Rafael José Levita de Almeida",
                  cargo: "Coordenador de Infraestrutura, DAS-3",
                  papel: "chefia",
                }),
              ],
              subunidades: [
                {
                  sigla: "INFRA-TI",
                  exibirSigla: false,
                  nome: "Infraestrutura de TI",
                  natureza: "Equipe",
                  titularPendente: "líder a definir",
                  observacao: "O organograma desenha a liderança da equipe com “?”: ainda sem nome.",
                  postos: [{ cargo: "técnico", quantidade: 4 }],
                },
                {
                  sigla: "BD",
                  exibirSigla: false,
                  nome: "Banco de Dados",
                  natureza: "Equipe",
                  funcoes: ["dados"],
                  pessoas: [
                    pessoa("Servulo", { nomeNaRelacao: "Sérvulo Dourado Cruz Lino", papel: "lider" }),
                    pessoa("Cristiano", { nomeNaRelacao: "Cristiano Araujo Silva" }),
                    pessoa("Bia", { nomeNaRelacao: "Ana Beatriz Sarno de Santana" }),
                    pessoa("Jorge", { nomeNaRelacao: "Jorge Luis Cruz Duarte" }),
                    pessoa("Mirella", { nomeNaRelacao: "Mirella Lima Saraiva Araújo", vinculo: "Terceirizado" }),
                  ],
                },
              ],
            },
            {
              sigla: "CSUPORTE",
              exibirSigla: false,
              nome: "Coordenação de Suporte Técnico",
              natureza: "Coordenação",
              funcoes: ["atendimento"],
              escopo: ["Suporte técnico: sistemas, hardware, SEI e TCM Digital"],
              pessoas: [
                pessoa("Raul", {
                  nomeNaRelacao: "Raul César Monferdini Dourado Lima",
                  cargo: "Coordenador de Suporte Técnico, DAS-3",
                  papel: "chefia",
                }),
              ],
              postos: [{ cargo: "técnico", quantidade: 3 }],
            },
            {
              sigla: "CSISTEMAS",
              exibirSigla: false,
              nome: "Coordenação de Sistemas e Automações",
              natureza: "Coordenação",
              funcoes: ["sistemas"],
              pessoas: [
                pessoa("Lucas", {
                  nomeNaRelacao: "Lucas Juan Nogueira Novaes",
                  cargo: "Coordenador de Sistemas e Automações, DAS-3",
                  papel: "chefia",
                }),
              ],
              subunidades: [
                {
                  sigla: "REQUISITOS",
                  exibirSigla: false,
                  nome: "Análise de Requisitos",
                  natureza: "Equipe",
                  pessoas: [
                    pessoa("Melly", { nomeNaRelacao: "Melly Pedra Lordello", vinculo: "Efetivo", papel: "lider" }),
                    pessoa("Ana", { funcao: "Product Owner (PO)" }),
                  ],
                  postos: [{ cargo: "Scrum Master (SM)", quantidade: 1 }],
                },
                {
                  sigla: "BI-PORTAIS",
                  exibirSigla: false,
                  nome: "Painéis de BI e Portais",
                  natureza: "Equipe",
                  funcoes: ["informacao"],
                  pessoas: [
                    pessoa("Lourival", { nomeNaRelacao: "Lourival Magalhães Nascimento Neto", papel: "lider" }),
                    pessoa("Luan", {
                      nomeNaRelacao: "Luan Santana Santos",
                      vinculo: "Terceirizado",
                      funcao: "BI · anotado “Nov” no organograma",
                    }),
                  ],
                  postos: [
                    { cargo: "desenvolvedor de BI", quantidade: 1 },
                    { cargo: "desenvolvedor do Portal", quantidade: 1 },
                  ],
                },
                {
                  sigla: "AUTOMACOES",
                  exibirSigla: false,
                  nome: "Automações",
                  natureza: "Equipe",
                  pessoas: [pessoa("Diego", { vinculo: "Terceirizado", papel: "lider" })],
                  postos: [{ cargo: "desenvolvedor", quantidade: 3 }],
                },
                {
                  sigla: "PLATAFORMAS",
                  exibirSigla: false,
                  nome: "Sistemas e Plataformas",
                  natureza: "Equipe",
                  pessoas: [
                    pessoa("Marcos", {
                      nomeNaRelacao: "Marcos Alberto Morais Assis",
                      vinculo: "Terceirizado",
                      papel: "lider",
                    }),
                  ],
                  subunidades: [
                    {
                      sigla: "DESENVOLVIMENTO",
                      exibirSigla: false,
                      nome: "Desenvolvimento",
                      natureza: "Frente",
                      semTitular: true,
                      escopo: ["Squad de Elite (novo contrato) e Fábrica DEV"],
                      pessoas: [
                        pessoa("Yves", { funcao: "Squad de Elite · novo contrato" }),
                        pessoa("João", { funcao: "Squad de Elite · novo contrato" }),
                        pessoa("Letícia", { funcao: "Squad de Elite · novo contrato" }),
                      ],
                      postos: [{ cargo: "desenvolvedor da Fábrica DEV", quantidade: 3 }],
                    },
                    {
                      sigla: "SUST-INTERNA",
                      exibirSigla: false,
                      nome: "Sustentação Interna",
                      natureza: "Frente",
                      titularPendente: "líder a contratar (terceirizado)",
                      observacao:
                        "O organograma desenha a liderança como “Novo (Terc.)”: terceirizado ainda sem nome. As três frentes são atendidas pela Fábrica DEV.",
                      escopo: ["SEI · TCM Digital · Projetos, pela Fábrica DEV"],
                    },
                    {
                      sigla: "SUST-LEGADO",
                      exibirSigla: false,
                      nome: "Sustentação Legado",
                      natureza: "Frente",
                      escopo: ["eTCM Legado · SIGAA (Analisador e Captura)", "SiCCO (FoxPro e novo) · Farol"],
                      pessoas: [
                        pessoa("Fabricio", {
                          nomeNaRelacao: "Fabrício André de Souza Muniz",
                          cargo: "DAS-3",
                          papel: "lider",
                        }),
                        pessoa("Barbosa", { funcao: "Consulta · sistemas legados" }),
                      ],
                    },
                  ],
                },
              ],
            },
          ],
        },
        {
          sigla: "DPP",
          nome: "Diretoria de Projetos e Planejamento",
          natureza: "Diretoria",
          subordinacao: "Superintendência de Tecnologia da Informação",
          funcoes: ["governanca"],
          atribuicoes: [
            "Direção das Coordenações de Projetos e de Planejamento Estratégico",
            "Portfólio de projetos, contratos e planejamento de TI",
          ],
          pessoas: [
            pessoa("Rafael Freitas", { cargo: "Diretor de Projetos e Planejamento, DAS-4", papel: "chefia" }),
          ],
          subunidades: [
            {
              sigla: "CPROJETOS",
              exibirSigla: false,
              nome: "Coordenação de Projetos",
              natureza: "Coordenação",
              escopo: [
                "Projetos estruturantes: Administração do SEI, TCM Digital, IHM e Inovações",
                "Processos e contratos: ordens de serviço e termos de referência",
              ],
              pessoas: [
                pessoa("Daniel", {
                  cargo: "Coordenador de Projetos",
                  vinculo: "Terceirizado",
                  funcao: "anotado “Nov” no organograma",
                  papel: "chefia",
                }),
              ],
            },
            {
              sigla: "CPLANEJAMENTO",
              exibirSigla: false,
              nome: "Coordenação de Planejamento Estratégico",
              natureza: "Coordenação",
              funcoesAcumuladas: ["seguranca"],
              escopo: [
                "Assessoramento de TI",
                "Plano Estratégico de TI: normativas de IA e de segurança e Regimento da STI",
                "Planejamento de equipamentos e serviços",
                "Fiscalizações",
              ],
              pessoas: [
                pessoa("Mauro", {
                  nomeNaRelacao: "Mauro de Castro Portugal",
                  cargo: "Coordenador de Planejamento Estratégico, DAS-4",
                  papel: "chefia",
                }),
              ],
            },
          ],
        },
      ],
    },

    sugerida: {
      rotulo: "Estrutura sugerida",
      chamada: "Minuta de proposta — Superintendência, duas Diretorias e Coordenações",
      minuta: true,
      // A minuta desenha a estrutura, e não quem a ocupa: nenhuma unidade dela
      // declara pessoas, e a tela não conta nem lista quadro. O que cada caixa
      // informa é o nível e o cargo que o ocupa — cargo comissionado, quadro
      // efetivo ou equipe contratada.
      estrutural: true,
      // Total de cargos da proposta, informado pela Diretoria. Não é derivado
      // das relações — a de lotação traz 16 pessoas e a alocação 27 —, porque
      // dimensionar a proposta é decisão de quem a assina.
      totalDeCargos: 45,
      resumo:
        "A Diretoria de Tecnologia da Informação passa a Superintendência, e abaixo dela ficam duas Diretorias. A de Tecnologia da Informação recebe a operação de hoje convertida em Coordenações — Sistemas, Infraestrutura e Suporte Técnico, as três no mesmo nível —, e a Coordenação de Sistemas passa a dirigir três Núcleos: Desenvolvimento de Sistemas, com as três gerências de hoje e a frente de cada uma declarada, Banco de Dados e UX/UI. A de Projetos de TIC é nova, com as Coordenações de Processos de TIC e de Governança Digital e Segurança da Informação. Nenhuma unidade existente é extinta nem perde quadro: o que muda é a denominação da camada de operação, o nível do Atendimento e a criação da segunda Diretoria.",
      procedencia:
        "Minuta de trabalho, sem valor de ato administrativo. Criação de superintendência, de diretoria, de coordenação e de núcleo, assim como denominação e designação de chefia, dependem de ato próprio do Tribunal; o que esta tela propõe é o desenho.",
      notasTitulo: "Premissas da minuta",
      notas: [
        "Nenhuma unidade existente é extinta ou perde quadro: DDES, DINT, SEATU e DBAD continuam com a mesma chefia e o mesmo pessoal, sob nova denominação.",
        "A camada de operação passa a se chamar Coordenação: Sistemas (ex-DDES), Infraestrutura (ex-DINT) e Suporte Técnico (ex-SEATU). O Atendimento sobe de Seção subordinada à Infraestrutura para Coordenação no mesmo nível das outras duas.",
        "O Banco de Dados passa de Divisão a Núcleo sob a Coordenação de Sistemas, junto com os Núcleos de Desenvolvimento de Sistemas e de UX/UI. O quadro de hoje do Banco de Dados vai inteiro com ele.",
        "As três gerências (DAS-3) de hoje passam ao Núcleo de Desenvolvimento de Sistemas, cada uma com a frente que conduz declarada: Desenvolvimento, Sustentação e Modernização de Sistema. Hoje as três têm o mesmo cargo e nenhum escopo declarado na relação de lotação — a divisão de frentes é proposta da minuta, a confirmar pela Diretoria.",
        "O Núcleo de UX/UI nasce sem quadro declarado: a alocação atual não traz profissional de experiência do usuário, e compor o núcleo exige remanejamento ou provimento.",
        "A minuta desenha estrutura, não pessoas: nenhuma unidade dela traz quadro nominal, e cada caixa informa o nível e o cargo que o ocupa — Diretoria (DAS-4), Coordenação (DAS-3) e Núcleo (equipe contratada, salvo o de Banco de Dados, que fica com quadro efetivo). O único nome do desenho é o do titular de hoje na Superintendência. Enquanto a criação de unidade e a designação de chefia dependem de ato, lotar nomes na proposta daria por decidido o que não está — quem quiser ver quem está onde hoje tem a estrutura atual, que é onde esse dado existe.",
        "O total de 45 cargos no balão ao lado da Superintendência é o dimensionamento informado pela Diretoria, e não uma conta do sistema: a relação de lotação traz 16 pessoas e a alocação da equipe técnica 27.",
        "Os Núcleos são operados por equipe contratada, com uma exceção decidida pela Diretoria: o Núcleo de Banco de Dados mantém os dois analistas efetivos de hoje. A administração das bases corporativas continua em quadro próprio.",
        "O Núcleo de Desenvolvimento de Sistemas é operado por equipe contratada e conduzido por três gerências DAS-3, uma por frente — é o que explica um Núcleo terceirizado com três comissionados no quadro.",
        "O titular de hoje passa a Superintendente. A chefia das duas Diretorias, das Coordenações novas e dos Núcleos fica a designar pela Diretoria — o cargo comissionado correspondente a Coordenação e a Núcleo também é decisão do ato de criação.",
        "As duas unidades sob a Diretoria de Projetos de TIC vêm como Coordenação por coerência com a camada: se a Diretoria preferir mantê-las como Divisão, basta a denominação mudar, o desenho é o mesmo.",
        "A Coordenação de Governança Digital e Segurança da Informação reúne o que hoje é acúmulo: governança de TI, exercida pela Diretoria, e segurança da informação, exercida pela Infraestrutura.",
        "Informação gerencial e painéis seguem sem unidade responsável nesta minuta: a definir se ficam com Processos de TIC, com o Núcleo de Banco de Dados ou com a Governança Digital.",
        "As siglas COSIS, COINFRA, COSTEC, NDS, NBD, NUX, DPTIC, COPRO e COGOV são propostas: a denominação oficial vem no ato de criação.",
      ],
      topo: {
        sigla: "STI",
        nome: "Superintendência de Tecnologia da Informação",
        natureza: "Superintendência",
        atribuicoes: [
          "Direção superior da área de tecnologia, com as duas Diretorias subordinadas",
          "Planejamento, portfólio e prioridades de TI do Tribunal",
          "Interlocução com a Presidência, com as demais unidades e com os órgãos de controle",
        ],
        observacao:
          "A relação de lotação registra, para a matrícula 217796, o nome Diego Cavalcante Teixeira, sem cargo declarado. O organograma segue a designação informada pela Diretoria — a confirmar se é a mesma pessoa.",
        pessoas: QUADRO_SUPERINTENDENCIA,
      },
      unidades: [
        {
          sigla: "DTI",
          nome: "Diretoria de Tecnologia da Informação",
          natureza: "Diretoria",
          cargo: "DAS-4",
          estado: "mantida",
          subordinacao: "Superintendência de Tecnologia da Informação",
          atribuicoes: [
            "Direção das três Coordenações de operação: sistemas, infraestrutura e suporte técnico",
            "Entrega e sustentação dos serviços de TI do Tribunal",
          ],
          lotacao:
            "Recebe a operação de hoje inteira, com a mesma chefia e o mesmo quadro. Chefia da Diretoria a designar.",
          justificativa:
            "A estrutura que hoje responde direto ao Diretor passa a responder a uma Diretoria própria, e a Superintendência deixa de acumular direção superior com direção de operação.",
          subunidades: [
            {
              sigla: "COSIS",
              nome: "Coordenação de Sistemas",
              natureza: "Coordenação",
              cargo: "DAS-3",
              estado: "renomeada",
              origem: "Divisão de Desenvolvimento de Sistemas (DDES)",
              funcoes: ["sistemas"],
              atribuicoes: [
                "Ciclo de vida dos sistemas do Tribunal: requisitos, desenvolvimento, homologação e sustentação",
                "Direção dos Núcleos de Desenvolvimento de Sistemas, de Banco de Dados e de UX/UI",
                "Gestão técnica da equipe alocada pelo contrato de serviços especializados",
              ],
              lotacao:
                "Mantém a chefia e o quadro de hoje. As três gerências (DAS-3) passam ao Núcleo de Desenvolvimento de Sistemas; a equipe técnica segue ligada à Coordenação enquanto a Diretoria não declarar a qual frente cada técnico responde.",
              subunidades: [
                {
                  sigla: "NDS",
                  nome: "Núcleo de Desenvolvimento de Sistemas",
                  natureza: "Núcleo",
                  cargo: "Terceirizados",
                  estado: "nova",
                  titularADesignar: true,
                  frentes: [
                    "Desenvolvimento de Sistema",
                    "Sustentação de Sistema",
                    "Modernização de Sistema",
                  ],
                  atribuicoes: [
                    "Condução das três frentes: desenvolvimento, sustentação e modernização de sistema",
                    "Padrões de arquitetura, de código e de homologação dos sistemas",
                    "Distribuição do trabalho da equipe técnica entre as frentes",
                  ],
                  lotacao:
                    "Três frentes declaradas, uma por gerência (DAS-3): desenvolvimento, sustentação e modernização de sistema. A chefia do Núcleo fica a designar, e a distribuição da equipe contratada entre as frentes depende da Diretoria — nem a relação de lotação nem a alocação de hoje dizem a qual frente cada técnico responde.",
                  justificativa:
                    "Hoje as três gerências estão lotadas na Divisão sem seção nem escopo declarado, e por isso nada distingue uma da outra no organograma. Nomear a frente de cada uma — desenvolvimento, sustentação e modernização de sistema — diz quem responde pelo quê antes de qualquer criação de cargo.",
                },
                {
                  sigla: "NBD",
                  nome: "Núcleo de Banco de Dados",
                  natureza: "Núcleo",
                  cargo: "Efetivos",
                  estado: "renomeada",
                  origem: "Divisão de Banco de Dados (DBAD)",
                  funcoes: ["dados"],
                  atribuicoes: [
                    "Administração dos bancos de dados corporativos",
                    "Desempenho, integridade e recuperação das bases",
                    "Modelagem e padrões de dados dos sistemas do Tribunal",
                  ],
                  lotacao:
                    "Mantém a chefia e os dois analistas de hoje. É a exceção declarada à regra dos Núcleos: continua com quadro efetivo, e não com equipe contratada.",
                  justificativa:
                    "O trabalho de banco de dados sustenta os sistemas e se decide com eles. Como Núcleo sob a Coordenação de Sistemas, a mesma equipe passa a ter a prioridade definida onde o sistema é construído, em vez de negociada entre duas unidades de mesmo nível.",
                },
                {
                  sigla: "NUX",
                  nome: "Núcleo de UX/UI",
                  natureza: "Núcleo",
                  cargo: "Terceirizados",
                  estado: "nova",
                  atribuicoes: [
                    "Pesquisa com o usuário e desenho da experiência dos sistemas do Tribunal",
                    "Padrão de interface, biblioteca de componentes e guia visual",
                    "Avaliação de usabilidade e de acessibilidade antes da entrega",
                  ],
                  lotacao:
                    "Composição a definir. A alocação atual não traz profissional de experiência do usuário, e hoje o desenho de interface é absorvido pela equipe de desenvolvimento.",
                  justificativa:
                    "Interface desenhada por quem também programa fica em último lugar na fila. Um núcleo próprio, junto de quem constrói o sistema, dá ao usuário do Tribunal um responsável pela tela que ele usa.",
                },
              ],
            },
            {
              sigla: "COINFRA",
              nome: "Coordenação de Infraestrutura",
              natureza: "Coordenação",
              cargo: "DAS-3",
              estado: "renomeada",
              origem: "Divisão de Infraestrutura Tecnológica (DINT)",
              funcoes: ["infraestrutura"],
              atribuicoes: [
                "Datacenter, rede, servidores, nuvem e estações de trabalho",
                "Backup, monitoramento, capacidade e continuidade dos serviços",
                "Segundo nível de solução para o que o Suporte Técnico encaminhar",
              ],
              lotacao:
                "Mantém a chefia. Quadro técnico a dimensionar: a alocação atual não contempla a unidade.",
              justificativa:
                "A unidade deixa de acumular segurança da informação, que passa à Coordenação de Governança Digital e Segurança da Informação, e responde pelo que é próprio da infraestrutura.",
            },
            {
              sigla: "COSTEC",
              nome: "Coordenação de Suporte Técnico",
              natureza: "Coordenação",
              cargo: "DAS-3",
              estado: "renomeada",
              origem: "Seção de Atendimento ao Usuário (SEATU)",
              ramal: "4631",
              portaDeEntrada: true,
              funcoes: ["atendimento"],
              atribuicoes: [
                "Porta de entrada única da operação pelo ramal 4631, com catálogo de serviços e prazo declarado",
                "Triagem, registro e acompanhamento de todo chamado até o encerramento",
                "Primeiro nível de solução; o que exceder vai à Infraestrutura ou aos Sistemas com registro",
              ],
              lotacao:
                "Mantém a gerência de hoje. Quadro de atendimento a dimensionar, e cargo de chefia da Coordenação a definir no ato de criação.",
              justificativa:
                "O atendimento é a porta de entrada de toda a área e responde a quem usa o Tribunal inteiro, não só à infraestrutura. No mesmo nível das outras duas Coordenações, encaminha chamado para Sistemas e para Infraestrutura em igualdade, sem depender da fila de uma delas.",
            },
          ],
        },
        {
          sigla: "DPTIC",
          nome: "Diretoria de Projetos de TIC",
          natureza: "Diretoria",
          cargo: "DAS-4",
          estado: "nova",
          subordinacao: "Superintendência de Tecnologia da Informação",
          atribuicoes: [
            "Direção das Coordenações de processos e de governança digital",
            "Portfólio de projetos de TIC, do planejamento à entrega",
          ],
          lotacao: "Diretoria nova: chefia e quadro a definir pela Diretoria.",
          justificativa:
            "Projeto, processo e governança hoje disputam a capacidade da operação, e perdem: quem responde por entrega de serviço não tem folga para conduzir projeto. Uma Diretoria própria separa as duas agendas.",
          subunidades: [
            {
              sigla: "COPRO",
              nome: "Coordenação de Processos de TIC",
              natureza: "Coordenação",
              cargo: "DAS-3",
              estado: "nova",
              atribuicoes: [
                "Mapeamento, desenho e melhoria dos processos de TIC",
                "Gestão do portfólio de projetos, com método, prazo e indicadores",
                "Escritório de projetos: apoio às unidades na condução das iniciativas",
              ],
              lotacao: "Composição a definir. Hoje estas atribuições não têm unidade responsável.",
            },
            {
              sigla: "COGOV",
              nome: "Coordenação de Governança Digital e Segurança da Informação",
              natureza: "Coordenação",
              cargo: "DAS-3",
              estado: "nova",
              funcoes: ["governanca", "seguranca"],
              atribuicoes: [
                "Plano diretor de TI, indicadores e conformidade com as normas aplicáveis",
                "Gestão e fiscalização dos contratos de tecnologia e dos fornecedores",
                "Política de segurança da informação, gestão de acessos e de vulnerabilidades",
                "Resposta a incidente de segurança e plano de continuidade",
                "Conformidade com a LGPD, no que couber à TI",
              ],
              lotacao:
                "Composição a definir. Hoje a governança é exercida pela Diretoria por acúmulo e a segurança pela Infraestrutura.",
              justificativa:
                "Segurança acumulada por quem opera o ambiente é avaliada pelo próprio executor, e um contrato de mais de R$ 9 milhões por ano não tem unidade que responda por ele. As duas lacunas cabem na mesma unidade.",
            },
          ],
        },
      ],
      mudancas: [
        {
          tipo: "nova",
          titulo: "A Diretoria passa a Superintendência, com duas Diretorias abaixo",
          detalhe:
            "A direção superior da área deixa de acumular a direção da operação: a Superintendência responde pelo conjunto, e as duas Diretorias — Tecnologia da Informação e Projetos de TIC — pelas suas frentes.",
        },
        {
          tipo: "renomeada",
          titulo: "A operação de hoje passa a Coordenação, sem perder nada",
          detalhe:
            "Desenvolvimento de Sistemas passa a Coordenação de Sistemas e Infraestrutura Tecnológica a Coordenação de Infraestrutura, com a mesma chefia, o mesmo quadro e as mesmas atribuições, agora sob a Diretoria de Tecnologia da Informação. Nenhuma unidade é extinta.",
        },
        {
          tipo: "renomeada",
          titulo: "O Atendimento sobe de Seção a Coordenação de Suporte Técnico",
          detalhe:
            "A porta de entrada da área sai de dentro da Infraestrutura e passa ao mesmo nível das outras duas Coordenações, com o ramal 4631 e a gerência de hoje. Chamado de sistema e chamado de infraestrutura passam a ser encaminhados em igualdade.",
        },
        {
          tipo: "nova",
          titulo: "Núcleo de Desenvolvimento de Sistemas, com a frente de cada gerência nomeada",
          detalhe:
            "As três gerências (DAS-3) saem da lotação genérica na Divisão e passam a um Núcleo próprio, cada uma conduzindo uma frente declarada: Desenvolvimento, Sustentação e Modernização de Sistema. Hoje as três têm o mesmo cargo e nenhum escopo na relação, e nada no organograma diz quem responde pelo quê.",
        },
        {
          tipo: "renomeada",
          titulo: "O Banco de Dados passa a Núcleo sob a Coordenação de Sistemas",
          detalhe:
            "A mesma equipe, com a mesma chefia, deixa de ser Divisão de mesmo nível e passa a Núcleo junto de quem constrói os sistemas que ela sustenta, onde a prioridade do dado se decide com a do sistema.",
        },
        {
          tipo: "nova",
          titulo: "Núcleo de UX/UI, novo, ao lado do Banco de Dados",
          detalhe:
            "Pesquisa com o usuário, padrão de interface e avaliação de usabilidade passam a ter unidade responsável. Hoje o desenho de tela é absorvido pela equipe de desenvolvimento e fica no fim da fila.",
        },
        {
          tipo: "nova",
          titulo: "Diretoria de Projetos de TIC, com duas Coordenações novas",
          detalhe:
            "Coordenação de Processos de TIC, para processo e portfólio de projetos, e Coordenação de Governança Digital e Segurança da Informação, para plano diretor, contratos, política de segurança e resposta a incidente.",
        },
        {
          tipo: "processo",
          titulo: "Governança e segurança deixam de ser acúmulo",
          detalhe:
            "Hoje a governança é exercida pela Diretoria junto com a direção da área, e a segurança pela Infraestrutura, que opera o ambiente que deveria avaliar. As duas passam à Coordenação de Governança Digital e Segurança da Informação.",
        },
        {
          tipo: "processo",
          titulo: "Projeto deixa de disputar a capacidade da operação",
          detalhe:
            "Com Diretoria própria, o portfólio de projetos passa a ter quem o conduza. Enquanto projeto e serviço dividirem a mesma chefia, a fila do dia decide o que anda.",
        },
        {
          tipo: "governanca",
          titulo: "Chefias e quadros novos ficam declarados como decisão a tomar",
          detalhe:
            "As duas Diretorias, as duas Coordenações da Diretoria de Projetos e o Núcleo de UX/UI nascem sem titular e sem quadro na minuta. Provimento, remanejamento e criação de cargo comissionado são atos do Tribunal, e a proposta não os pressupõe.",
        },
      ],
    },

    // Relação da Netra Tecnologia (NETRA-CON-26213, 02/10/2026). As áreas
    // seguem a ordem e o recorte do documento. A SEATU, que o ofício lista
    // como área com gestor próprio, é desenhada abaixo da DINT, como na
    // estrutura atual, e a DINT mostra as duas equipes — 3 profissionais dela
    // e 8 da Seção.
    netra: {
      rotulo: "Estrutura Netra",
      chamada: "Profissionais da Netra Tecnologia alocados no TCM-BA, por área, cargo e gestor",
      contratada: true,
      cargosDoQuadro: true,
      fonte:
        "Relação de profissionais, cargos e gestores responsáveis encaminhada pela Netra Tecnologia (CON-RQ-30, ofício NETRA-CON-26213, de 02/10/2026), no âmbito do Contrato nº 65/2022. Remuneração individual omitida.",
      topo: {
        sigla: "NETRA",
        nome: "Netra Tecnologia",
        natureza: "Empresa contratada",
        legenda: "Contrato nº 65/2022",
        referencia: "Ofício NETRA-CON-26213 · 02/10/2026",
        pessoas: [],
      },
      unidades: [
        {
          sigla: "DINT",
          nome: "Divisão de Infraestrutura Tecnológica",
          natureza: "Área",
          gestor: "Rafael Levita",
          // A caixa e o painel da DINT contam também a equipe da Seção, que é
          // dela: são os postos de apoio aos sistemas e de transmissão e
          // eventos que a resposta da própria Divisão lota na DINT.
          incluiSubunidades: true,
          pessoas: NETRA_DINT,
          subunidades: [
            {
              sigla: "SEATU",
              nome: "Seção de Atendimento ao Usuário",
              natureza: "Área",
              gestor: "Raul Lima",
              pessoas: NETRA_SEATU,
            },
          ],
        },
        {
          sigla: "DDES",
          nome: "Divisão de Desenvolvimento de Sistemas",
          natureza: "Área",
          gestor: "Mauro Portugal",
          observacao:
            "Única área em que a relação informa o líder de cada profissional. Os líderes estão grafados como no documento: \u201cSandrinha\u201d (Aldair) e \u201cSandra\u201d (Leonardo) aparecem separados, a confirmar se são a mesma pessoa.",
          pessoas: NETRA_DDES,
        },
        {
          sigla: "DTI",
          nome: "Diretoria de Tecnologia da Informação",
          natureza: "Área",
          gestor: "José Roberto Era",
          pessoas: NETRA_DTI,
        },
        {
          sigla: "DBAD",
          nome: "Divisão de Banco de Dados",
          natureza: "Área",
          gestor: "Servulo Lino",
          pessoas: NETRA_DBAD,
        },
        {
          sigla: "DDP",
          nome: "",
          natureza: "Área",
          gestor: "Cristiane Costa",
          funcaoDoGestor: "Chefe de Divisão de Desenvolvimento Organizacional",
          pessoas: NETRA_DDP,
        },
        {
          sigla: "SCE",
          nome: "",
          natureza: "Área",
          gestor: "Ana Mendonça",
          pessoas: NETRA_SCE,
        },
      ],
    },
  };
})();
