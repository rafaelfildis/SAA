// Estrutura da DTI: a que existe hoje e a minuta de proposta.
//
// Vem com o sistema, como a lista de ramais — é material de consulta e de
// discussão, igual para todo mundo, sem nada a gravar por navegador. Desenho
// de estrutura se decide em ato do Tribunal, não no localStorage de quem
// abriu a tela.
//
// A ESTRUTURA ATUAL reúne duas relações, e a tela não as mistura:
//
//   · a RELAÇÃO DE LOTAÇÃO — 16 pessoas com matrícula, vínculo e cargo, do
//     Diretor aos analistas e técnicos de nível médio;
//   · a EQUIPE TÉCNICA — 27 pessoas alocadas por unidade com perfil de
//     senioridade (Júnior, Pleno, Sênior, Master, Estagiário), sem matrícula
//     nem vínculo declarados.
//
// Somá-las em um número só apagaria a diferença entre quadro próprio e equipe
// alocada por perfil, que é justamente o que uma discussão de estrutura precisa
// ver. Por isso cada unidade mostra as duas contagens, e o rodapé do módulo
// registra que os perfis da equipe técnica são os de contrato de serviços — a
// confirmar junto à Diretoria.
//
// A hierarquia segue a regra da própria Diretoria — abaixo do Diretor vêm os
// chefes de divisão (DAS-4), depois os gerentes (DAS-3), depois a equipe —, e a
// Seção de Atendimento ao Usuário entra em `subunidades` da DINT, que é onde
// ela está: o organograma desenha o nível em que a unidade se encontra, em vez
// de exibir como par de uma divisão o que lhe é subordinado.
//
// O que as relações NÃO declaram fica marcado como "a confirmar", em vez de ser
// preenchido por conta própria: o escopo de cada uma das três gerências da
// DDES, o cargo do Diretor, o quadro de atendimento da SEATU e o quadro técnico
// da DINT. Cada gerência tem a sua caixa no fluxograma, com o nome de quem
// responde; o escopo aparece na linha de apoio só onde está declarado, que
// hoje é a minuta.
//
// Ramal não entra aqui de propósito. As relações não trazem ramal, e cruzar
// nome com a lista de ramais pelo primeiro nome produziria número errado ao
// lado de pessoa certa. Quem procura número usa o módulo Ramal DTI.
//
// A ESTRUTURA SUGERIDA é minuta de trabalho, e a tela diz isso em todo lugar
// onde ela aparece. Nenhuma unidade de hoje é extinta e nenhuma perde quadro: a
// camada de operação muda de denominação — Divisão passa a Coordenação, a Seção
// de Atendimento sobe a Coordenação de Suporte Técnico e o Banco de Dados passa
// a Núcleo sob a Coordenação de Sistemas —, uma camada de direção é criada
// acima dela e as responsabilidades que hoje existem sem unidade própria ganham
// uma. As unidades novas (a Diretoria de Projetos de TIC, suas duas
// Coordenações e o Núcleo de UX/UI) nascem sem titular e sem quadro na minuta,
// porque provimento, remanejamento e criação de cargo comissionado são atos do
// Tribunal, e as siglas propostas ficam declaradas como propostas.
//
// Os quadros ficam em constantes compartilhadas porque as duas visões usam as
// mesmas pessoas: repetir 37 nomes em cada uma criaria duas listas para
// divergirem na primeira atualização.
//
// O QUE A TELA USA HOJE. O módulo ficou com o fluxograma e a lista da equipe,
// e só lê: `sigla`, `nome`, `natureza`, `ramal`, `portaDeEntrada`, `estado`,
// `titularADesignar`, `pessoas`, `subunidades`, `funcoes`/`funcoesAcumuladas`
// (que alimentam a métrica do portal) e `lotacao`/`observacao` (exibidos no
// painel de uma unidade sem equipe própria). Em `pessoas`, o campo `funcao` de
// uma gerência é a frente que ela conduz: aparece na caixa dela no fluxo, na
// lista da unidade e no papel. Sem ele, a caixa fica só com o cargo e o nome.
//
// Os demais campos — `chamada`, `resumo`, `procedencia`, `atribuicoes`,
// `justificativa`, `origem`, `subordinacao`, `notas`, `notasTitulo` e
// `mudancas` — não aparecem em tela nenhuma: ficam como registro do
// levantamento e da minuta, e voltam a ser exibidos no dia em que a Diretoria
// pedir o detalhamento de volta. Quem editar a estrutura pode ignorá-los sem
// quebrar nada.

(function () {
  // Perfil de senioridade, sem matrícula nem vínculo: é como a alocação da
  // equipe técnica chega, e inventar os campos que faltam seria pior do que
  // deixá-los vazios.
  const tecnico = (nome, nivel, funcao) => ({ nome, nivel, funcao: funcao || "", papel: "tecnica" });

  const QUADRO_DIRETORIA = [
    {
      nome: "Diego Daltro",
      nomeNaRelacao: "Diego Cavalcante Teixeira",
      matricula: "217796",
      vinculo: "Efetivo",
      cargo: "Diretor de Tecnologia da Informação",
      papel: "chefia",
    },
    tecnico("Fabiana Dumiense Costa", "Sênior II"),
  ];

  // Na minuta o titular de hoje passa a Superintendente. O quadro é separado
  // do da estrutura atual de propósito: compartilhá-lo faria o cargo proposto
  // aparecer também na estrutura vigente.
  const QUADRO_SUPERINTENDENCIA = [
    {
      nome: "Diego Daltro",
      nomeNaRelacao: "Diego Cavalcante Teixeira",
      matricula: "217796",
      vinculo: "Efetivo",
      cargo: "Superintendente de Tecnologia da Informação",
      papel: "chefia",
    },
    tecnico("Fabiana Dumiense Costa", "Sênior II"),
  ];

  const QUADRO_DDES = [
    {
      nome: "Mauro de Castro Portugal",
      matricula: "217719",
      vinculo: "Comissionado",
      cargo: "Chefe da Divisão de Desenvolvimento de Sistemas, DAS-4",
      papel: "chefia",
    },
    {
      nome: "Ayala Bezerra Leal",
      matricula: "217832",
      vinculo: "Comissionado",
      cargo: "Gerente de Tecnologia da Informação, DAS-3",
      papel: "gerencia",
    },
    {
      nome: "Fabrício André de Souza Muniz",
      matricula: "217831",
      vinculo: "Comissionado",
      cargo: "Gerente de Tecnologia da Informação, DAS-3",
      papel: "gerencia",
    },
    {
      nome: "Lucas Juan Nogueira Novaes",
      matricula: "217833",
      vinculo: "Comissionado",
      cargo: "Gerente de Tecnologia da Informação, DAS-3",
      papel: "gerencia",
    },
    {
      nome: "Ana Amélia Dias Lima Gramacho",
      matricula: "217406",
      vinculo: "Efetivo",
      cargo: "Analista de Sistemas",
      papel: "equipe",
    },
    {
      nome: "Elizete Paula Sanson",
      matricula: "217409",
      vinculo: "Efetivo",
      cargo: "Analista de Sistemas",
      papel: "equipe",
    },
    {
      nome: "José Ribamar Santos Cartaxo",
      matricula: "940",
      vinculo: "Efetivo",
      cargo: "Analista de Sistema",
      papel: "equipe",
    },
    {
      nome: "Melly Pedra Lordello",
      matricula: "217402",
      vinculo: "Efetivo",
      cargo: "Analista de Sistemas",
      papel: "equipe",
    },
    {
      nome: "Sandra Araújo Vasconcelos Silva",
      matricula: "217525",
      vinculo: "Efetivo",
      cargo: "Analista de Sistemas",
      papel: "equipe",
    },
    {
      nome: "Ari Ramos de Andrade",
      matricula: "217675",
      vinculo: "Efetivo",
      cargo: "Técnico de Nível Médio",
      papel: "equipe",
    },
    {
      nome: "Lourival Magalhães Nascimento Neto",
      matricula: "217401",
      vinculo: "Efetivo",
      cargo: "Assistente Administrativo",
      papel: "equipe",
    },
    tecnico("Jefferson Azevedo Lins", "Master II"),
    tecnico("Marcos Alberto Morais Assis", "Sênior IV"),
    tecnico("Maurício Machado de Oliveira Matos", "Sênior IV"),
    tecnico("Diego de Almeida Menezes", "Sênior III"),
    tecnico("Marlon Nascimento Lopes", "Sênior III"),
    tecnico("Claudia Carvalho dos Santos", "Sênior II"),
    tecnico("Jaime Valverde Silva", "Sênior II"),
    tecnico("José Daniel Machado Soares", "Sênior II"),
    tecnico("Lúcio de Castro Sacramento", "Sênior II"),
    tecnico("Pablo Freire Barretto", "Sênior II"),
    tecnico("Elaine da Anunciação Passos", "Sênior I"),
    tecnico("Evania Fernandes dos Santos", "Sênior I"),
    tecnico("José Carlos Teixeira Junior", "Sênior I"),
    tecnico("Ana Paula Ferreira Lordelo", "Pleno II"),
    tecnico("Luan Santana Santos", "Pleno II"),
    tecnico("Carlos Henrique Morais Cardoso", "Pleno I"),
    tecnico("Guilherme da Silva Boaventura", "Júnior III"),
    tecnico("Leonardo Oliveira da Silva Santos", "Júnior III"),
    tecnico("Aldair Silva de Araújo", "Júnior II"),
    tecnico("Gabriel Silva de Matos", "Júnior II"),
    tecnico("Lucca Barbosa Nygaard", "Júnior II"),
    tecnico("Caio Gabriel Cruz Amorim", "Júnior I"),
    tecnico("Pedro Martins Caires", "Júnior I"),
    tecnico("Fabrício Maicon Félix Santos", "Estagiário"),
    tecnico("Rian Uchoa Assunção", "Estagiário"),
    tecnico("Yuri Figueiredo Ribeiro", "Estagiário", "QA e Analista de Requisitos"),
  ];

  // Na minuta as três gerências (DAS-3) passam ao Núcleo de Desenvolvimento de
  // Sistemas, cada uma com a frente que conduz — o que a relação de lotação
  // hoje não declara. Derivar do quadro de hoje, em vez de repetir os nomes,
  // mantém matrícula, vínculo e cargo vindo de uma fonte só.
  const FRENTES_DE_DESENVOLVIMENTO = [
    ["Ayala Bezerra Leal", "Líder Técnica de Desenvolvimento de Sistemas"],
    ["Lucas Juan Nogueira Novaes", "Sustentação de Sistemas"],
    ["Fabrício André de Souza Muniz", "Modernização de Sistemas"],
  ];
  const QUADRO_DESENVOLVIMENTO = FRENTES_DE_DESENVOLVIMENTO.map(([nome, funcao]) => ({
    ...QUADRO_DDES.find((p) => p.nome === nome),
    funcao,
  }));
  const QUADRO_COSIS = QUADRO_DDES.filter(
    (p) => !FRENTES_DE_DESENVOLVIMENTO.some(([nome]) => nome === p.nome)
  );

  const QUADRO_DINT = [
    {
      nome: "Rafael José Levita de Almeida",
      matricula: "217600",
      vinculo: "Comissionado",
      cargo: "Chefe da Divisão de Infraestrutura Tecnológica, DAS-4",
      papel: "chefia",
    },
  ];

  const QUADRO_SEATU = [
    {
      nome: "Raul César Monferdini Dourado Lima",
      matricula: "217771",
      vinculo: "Comissionado",
      cargo: "Gerente de Tecnologia da Informação, DAS-3",
      papel: "gerencia",
    },
  ];

  const QUADRO_DADOS = [
    {
      nome: "Sérvulo Dourado Cruz Lino",
      matricula: "217410",
      vinculo: "Efetivo",
      cargo: "Analista de Sistemas",
      papel: "chefia",
    },
    {
      nome: "Ana Beatriz Sarno de Santana",
      matricula: "217530",
      vinculo: "Efetivo",
      cargo: "Analista de Sistemas",
      papel: "equipe",
    },
  ];

  window.SAA_ESTRUTURA_VERSAO = "2026-09-13";

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

    atual: {
      rotulo: "Estrutura atual",
      chamada: "Como a DTI está lotada hoje",
      resumo:
        "Três divisões sob a Diretoria e uma seção subordinada à Infraestrutura, com 43 pessoas: 16 na relação de lotação e 27 na equipe técnica alocada por perfil. As quatro unidades cobrem desenvolvimento, infraestrutura, banco de dados e atendimento — quatro das sete funções de TI. Governança, segurança da informação e informação gerencial não têm unidade própria: são exercidas por acúmulo ou não têm dono declarado.",
      procedencia:
        "Montada a partir de duas relações da DTI: a de lotação (matrícula, vínculo e cargo) e a da equipe técnica alocada por unidade (perfil de senioridade, sem vínculo declarado). O que as relações não declaram aparece como “a confirmar”, não preenchido por conta própria. Ramais ficam no módulo Ramal DTI.",
      notasTitulo: "Leitura da estrutura atual",
      notas: [
        "O desenvolvimento concentra 37 das 43 pessoas do organograma, e 26 dos 27 técnicos alocados. A estrutura está desenhada para produzir sistema; as demais funções de TI se sustentam com o que sobra.",
        "Segurança da informação não tem unidade responsável: o papel recai sobre a Divisão de Infraestrutura Tecnológica, que opera o ambiente — quem opera acaba avaliando a própria operação.",
        "Governança de TI — plano diretor, portfólio, indicadores, gestão de contratos e de fornecedores — não tem unidade própria, embora um único contrato de serviços especializados passe de R$ 9 milhões por ano.",
        "Informação gerencial não tem dono declarado: painéis e indicadores nascem por demanda, sem unidade que responda pela fonte e pelo número.",
        "A alocação de técnicos não contempla a Infraestrutura nem o Banco de Dados. A DINT segue com a chefia da Divisão e a gerência da Seção, sem quadro técnico próprio, e os nomes que atendem infraestrutura na lista de ramais não constam de nenhuma das duas relações — a confirmar.",
        "A Seção de Atendimento ao Usuário é a porta de entrada da operação e registra apenas a gerência: não há quadro próprio de atendimento — a confirmar quem executa o primeiro nível.",
        "A chefia da Divisão de Banco de Dados é exercida por analista de sistemas efetivo, sem o cargo comissionado de DAS-4 que titulariza as outras duas divisões — a confirmar se há designação formal.",
        "As três gerências (DAS-3) da Divisão de Desenvolvimento de Sistemas estão lotadas na própria Divisão, sem seção nomeada: nem a relação de lotação nem a alocação dizem o escopo de cada gerência ou a qual delas cada técnico responde. No fluxograma, por isso, a equipe aparece ligada à Divisão, e não distribuída entre as três.",
        "A relação da equipe técnica não declara vínculo. Os perfis — Júnior, Pleno, Sênior, Master e Estagiário — são os de contrato de serviços especializados, a confirmar junto à Diretoria.",
      ],
      topo: {
        sigla: "DTI",
        nome: "Diretoria de Tecnologia da Informação",
        natureza: "Diretoria",
        funcoesAcumuladas: ["governanca"],
        atribuicoes: [
          "Direção, planejamento e representação institucional da área de tecnologia",
          "Decisão sobre portfólio, prioridades e alocação de recursos entre as unidades",
          "Gestão dos contratos de TI, entre eles o Contrato 65/2022 de serviços especializados",
        ],
        observacao:
          "A relação de lotação registra, para a matrícula 217796 lotada na Diretoria, o nome Diego Cavalcante Teixeira, sem cargo declarado. O organograma segue a designação informada pela Diretoria — a confirmar se é a mesma pessoa.",
        pessoas: QUADRO_DIRETORIA,
      },
      unidades: [
        {
          sigla: "DDES",
          nome: "Divisão de Desenvolvimento de Sistemas",
          natureza: "Divisão",
          subordinacao: "Diretoria de Tecnologia da Informação",
          funcoes: ["sistemas"],
          atribuicoes: [
            "Desenvolvimento, evolução e sustentação dos sistemas do Tribunal",
            "Três gerências de TI (DAS-3) lotadas na própria Divisão, sem seção nomeada na relação",
            "Maior quadro da Diretoria: 37 das 43 pessoas do organograma",
          ],
          pessoas: QUADRO_DDES,
        },
        {
          sigla: "DINT",
          nome: "Divisão de Infraestrutura Tecnológica",
          natureza: "Divisão",
          subordinacao: "Diretoria de Tecnologia da Informação",
          funcoes: ["infraestrutura"],
          funcoesAcumuladas: ["seguranca"],
          atribuicoes: [
            "Rede, servidores, estações de trabalho e ambiente de datacenter",
            "Backup, monitoramento e continuidade dos serviços",
            "Atendimento ao usuário pela Seção subordinada (SEATU), no ramal 4631",
            "Segurança da informação exercida por acúmulo, sem unidade própria",
          ],
          observacao:
            "A relação de lotação traz a chefia da Divisão e a gerência da Seção, e a alocação de técnicos não contempla esta unidade. Os nomes que atendem infraestrutura na lista de ramais não constam de nenhuma das duas relações — a confirmar se são do contrato de serviços especializados.",
          pessoas: QUADRO_DINT,
          subunidades: [
            {
              sigla: "SEATU",
              nome: "Seção de Atendimento ao Usuário",
              natureza: "Seção",
              ramal: "4631",
              portaDeEntrada: true,
              funcoes: ["atendimento"],
              atribuicoes: [
                "Porta de entrada da operação pelo ramal 4631: chamado, incidente e solicitação de rotina",
                "Atendimento ao usuário interno e apoio às sessões do Plenário",
              ],
              observacao:
                "A relação registra apenas a gerência: a seção não tem quadro próprio de atendimento — a confirmar quem executa o primeiro nível.",
              pessoas: QUADRO_SEATU,
            },
          ],
        },
        {
          sigla: "DBAD",
          nome: "Divisão de Banco de Dados",
          natureza: "Divisão",
          subordinacao: "Diretoria de Tecnologia da Informação",
          funcoes: ["dados"],
          atribuicoes: [
            "Administração dos bancos de dados corporativos",
            "Desempenho, integridade e recuperação das bases",
          ],
          observacao:
            "A chefia é exercida por analista de sistemas efetivo. A relação não registra, para esta Divisão, o cargo comissionado de DAS-4 que titulariza as outras duas — a confirmar se há designação formal. A alocação de técnicos não contempla a unidade.",
          pessoas: QUADRO_DADOS,
        },
      ],
    },

    sugerida: {
      rotulo: "Estrutura sugerida",
      chamada: "Minuta de proposta — Superintendência, duas Diretorias e Coordenações",
      minuta: true,
      resumo:
        "A Diretoria de Tecnologia da Informação passa a Superintendência, e abaixo dela ficam duas Diretorias. A de Tecnologia da Informação recebe a operação de hoje convertida em Coordenações — Sistemas, Infraestrutura e Suporte Técnico, as três no mesmo nível —, e a Coordenação de Sistemas passa a dirigir três Núcleos: Desenvolvimento de Sistemas, com as três gerências de hoje e a frente de cada uma declarada, Banco de Dados e UX/UI. A de Projetos de TIC é nova, com as Coordenações de Processos de TIC e de Governança Digital e Segurança da Informação. Nenhuma unidade existente é extinta nem perde quadro: o que muda é a denominação da camada de operação, o nível do Atendimento e a criação da segunda Diretoria.",
      procedencia:
        "Minuta de trabalho, sem valor de ato administrativo. Criação de superintendência, de diretoria, de coordenação e de núcleo, assim como denominação e designação de chefia, dependem de ato próprio do Tribunal; o que esta tela propõe é o desenho.",
      notasTitulo: "Premissas da minuta",
      notas: [
        "Nenhuma unidade existente é extinta ou perde quadro: DDES, DINT, SEATU e DBAD continuam com a mesma chefia e o mesmo pessoal, sob nova denominação.",
        "A camada de operação passa a se chamar Coordenação: Sistemas (ex-DDES), Infraestrutura (ex-DINT) e Suporte Técnico (ex-SEATU). O Atendimento sobe de Seção subordinada à Infraestrutura para Coordenação no mesmo nível das outras duas.",
        "O Banco de Dados passa de Divisão a Núcleo sob a Coordenação de Sistemas, junto com os Núcleos de Desenvolvimento de Sistemas e de UX/UI. O quadro de hoje do Banco de Dados vai inteiro com ele.",
        "As três gerências (DAS-3) passam ao Núcleo de Desenvolvimento de Sistemas com a frente de cada uma nomeada: liderança técnica (Ayala Bezerra Leal), sustentação (Lucas Juan Nogueira Novaes) e modernização (Fabrício André de Souza Muniz). Hoje as três têm o mesmo cargo e nenhum escopo declarado na relação de lotação — a divisão de frentes é proposta da minuta, a confirmar pela Diretoria.",
        "A chefia do Núcleo de Desenvolvimento de Sistemas fica a designar: a liderança técnica declarada pode acumulá-la, e isso é decisão da Diretoria. A equipe técnica segue ligada à Coordenação de Sistemas enquanto não se declarar a qual frente cada técnico responde.",
        "O Núcleo de UX/UI nasce sem quadro declarado: a alocação atual não traz profissional de experiência do usuário, e compor o núcleo exige remanejamento ou provimento.",
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
              pessoas: QUADRO_COSIS,
              subunidades: [
                {
                  sigla: "NDS",
                  nome: "Núcleo de Desenvolvimento de Sistemas",
                  natureza: "Núcleo",
                  estado: "nova",
                  titularADesignar: true,
                  atribuicoes: [
                    "Condução das três frentes de desenvolvimento: liderança técnica, sustentação e modernização",
                    "Padrões de arquitetura, de código e de homologação dos sistemas",
                    "Distribuição do trabalho da equipe técnica entre as frentes",
                  ],
                  lotacao:
                    "Reúne as três gerências (DAS-3) de hoje, cada uma com a frente que conduz. A chefia do Núcleo fica a designar — a liderança técnica declarada pode ser ela própria, decisão da Diretoria. A equipe técnica permanece na Coordenação: nem a relação de lotação nem a alocação dizem a qual frente cada técnico responde.",
                  justificativa:
                    "Hoje as três gerências estão lotadas na Divisão sem seção nem escopo declarado, e por isso nada distingue uma da outra no organograma. Nomear a frente de cada uma — liderança técnica, sustentação e modernização — diz quem responde pelo quê antes de qualquer criação de cargo.",
                  pessoas: QUADRO_DESENVOLVIMENTO,
                },
                {
                  sigla: "NBD",
                  nome: "Núcleo de Banco de Dados",
                  natureza: "Núcleo",
                  estado: "renomeada",
                  origem: "Divisão de Banco de Dados (DBAD)",
                  funcoes: ["dados"],
                  atribuicoes: [
                    "Administração dos bancos de dados corporativos",
                    "Desempenho, integridade e recuperação das bases",
                    "Modelagem e padrões de dados dos sistemas do Tribunal",
                  ],
                  lotacao: "Mantém a chefia e os dois analistas de hoje.",
                  justificativa:
                    "O trabalho de banco de dados sustenta os sistemas e se decide com eles. Como Núcleo sob a Coordenação de Sistemas, a mesma equipe passa a ter a prioridade definida onde o sistema é construído, em vez de negociada entre duas unidades de mesmo nível.",
                  pessoas: QUADRO_DADOS,
                },
                {
                  sigla: "NUX",
                  nome: "Núcleo de UX/UI",
                  natureza: "Núcleo",
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
              pessoas: QUADRO_DINT,
            },
            {
              sigla: "COSTEC",
              nome: "Coordenação de Suporte Técnico",
              natureza: "Coordenação",
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
              pessoas: QUADRO_SEATU,
            },
          ],
        },
        {
          sigla: "DPTIC",
          nome: "Diretoria de Projetos de TIC",
          natureza: "Diretoria",
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
            "As três gerências (DAS-3) saem da lotação genérica na Divisão e passam a um Núcleo próprio, cada uma conduzindo uma frente declarada: liderança técnica, sustentação e modernização. Hoje as três têm o mesmo cargo e nenhum escopo na relação, e nada no organograma diz quem responde pelo quê.",
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
  };
})();
