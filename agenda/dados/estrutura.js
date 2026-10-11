// Estrutura da DTI: o organograma da Superintendência de Tecnologia da
// Informação, única visão do módulo.
//
// Vem com o sistema, como a lista de ramais — é material de consulta e de
// discussão, igual para todo mundo, sem nada a gravar por navegador. Desenho
// de estrutura se decide em ato do Tribunal, não no localStorage de quem
// abriu a tela.
//
// O módulo traz só este organograma: as visões de minuta de proposta e de
// equipe Netra foram retiradas a pedido da Diretoria. Ele é o organograma da Superintendência de Tecnologia da
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
// O QUE A TELA USA HOJE. O módulo ficou com o fluxograma e a lista da equipe,
// e só lê:
//
//   · da visão: `rotulo`, `organograma` (linha de apoio em pessoas nomeadas e
//     postos sem nome), `cargosDoQuadro` (o balão ao lado do topo conta o que
//     está em tela) e `fonte` (o rodapé do papel);
//   · da unidade: `sigla`, `exibirSigla`, `nome`, `natureza`, `cargo` (o par
//     nível-cargo no selo, que também tira o nome de responsável da caixa),
//     `ramal`, `portaDeEntrada`, `titularPendente` e
//     `semTitular` (o que a caixa diz quando não há titular), `frentes`
//     (caixas de frente abaixo da unidade, sem pessoa), `escopo` (linhas na
//     própria caixa), `postos` (cargos sem nome), `pessoas`, `subunidades`,
//     `funcoes`/`funcoesAcumuladas` e `observacao` (no painel de uma unidade
//     sem equipe própria);
//   · da pessoa: `nome`, `nomeNaRelacao` (só na busca), `cargo`,
//     `matricula`, `vinculo`, `papel` e `funcao`.
//
// O desenho ainda sabe ler os campos de minuta (`minuta`, `estrutural`,
// `estado`, `frentes`, `totalDeCargos`) e de quadro de contratada
// (`contratada`, `gestor`), caso uma dessas visões volte um dia.
//
// Os demais campos — `chamada`, `resumo`, `procedencia`, `atribuicoes`,
// `subordinacao`, `notas` e `notasTitulo` — não aparecem em tela: ficam como
// registro da leitura do organograma. Quem editar a estrutura pode ignorá-los
// sem quebrar nada.

(function () {
  // Pessoa do organograma da STI: nome como grafado no documento e, só onde
  // ele declara, cargo e vínculo. O que o documento não diz fica vazio, em vez
  // de ser completado por conta própria.
  const pessoa = (nome, campos) => ({ nome, papel: "organograma", ...(campos || {}) });

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
      rotulo: "Organograma – STI",
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
  };
})();
