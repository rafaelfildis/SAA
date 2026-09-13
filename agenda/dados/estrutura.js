// Estrutura da DTI: a que existe hoje e a minuta de proposta.
//
// Vem com o sistema, como a lista de ramais — é material de consulta e de
// discussão, igual para todo mundo, sem nada a gravar por navegador. Desenho
// de estrutura se decide em ato do Tribunal, não no localStorage de quem
// abriu a tela.
//
// A ESTRUTURA ATUAL foi montada a partir da lista oficial de ramais
// (dados/ramais.js): são as mesmas quatro frentes e as mesmas 22 pessoas. O
// que a lista de ramais não informa — quem titulariza cada frente e o nome
// formal de cada unidade — fica em branco de propósito, e a tela escreve "a
// confirmar" em vez de exibir um nome escolhido por conta própria. Preencher
// `responsavel` aqui é o suficiente para a tela passar a mostrá-lo.
//
// A ESTRUTURA SUGERIDA é minuta de trabalho, e a tela diz isso em todo lugar
// onde ela aparece. Não pressupõe criação de cargo nem contratação: redistribui
// atribuições sobre o efetivo hoje lotado na DTI e faz aparecer no organograma
// três responsabilidades que hoje existem sem unidade própria.

window.SAA_ESTRUTURA_VERSAO = "2026-09-13";

window.SAA_ESTRUTURA = {
  // Funções de TI usadas na comparação entre as duas visões. A pergunta que
  // elas respondem é "esta responsabilidade tem unidade própria ou é exercida
  // por acúmulo?", que é justamente onde as duas estruturas divergem.
  funcoes: [
    { id: "atendimento", rotulo: "Atendimento ao usuário" },
    { id: "infraestrutura", rotulo: "Infraestrutura e operações" },
    { id: "sistemas", rotulo: "Sistemas e e-TCM" },
    { id: "governanca", rotulo: "Governança, contratos e projetos" },
    { id: "seguranca", rotulo: "Segurança da informação" },
    { id: "dados", rotulo: "Dados e informação gerencial" },
  ],

  atual: {
    rotulo: "Estrutura atual",
    chamada: "Como a DTI está organizada hoje",
    resumo:
      "Um corpo de direção e quatro frentes de atendimento. A organização é por porta de atendimento — SEATU/SST, Infra e e-TCM —, não por função de TI: governança, segurança da informação e informação gerencial não têm unidade própria e são exercidas por acúmulo dentro das frentes.",
    procedencia:
      "Levantada a partir da lista oficial de ramais da DTI — 22 ramais em 4 equipes. Nome formal das unidades e titularidade de cada frente: a confirmar junto à Diretoria.",
    notasTitulo: "Leitura da estrutura atual",
    notas: [
      "Segurança da informação não tem unidade responsável: o papel é exercido por acúmulo dentro da frente de Infra, junto com a operação do dia.",
      "Governança de TI — plano diretor, indicadores, gestão de contratos e de fornecedores — não tem unidade própria, embora a carteira contratada passe de R$ 9 milhões por ano em um único contrato.",
      "Informação gerencial nasce por demanda: não há unidade que responda por painéis, indicadores e dados.",
      "Quem tria o chamado é quem o resolve. Sem separação entre atendimento e solução, a fila do dia disputa espaço com o projeto do mês, e o projeto perde.",
    ],
    topo: {
      sigla: "DTI",
      nome: "Diretoria de Tecnologia da Informação",
      natureza: "Diretoria",
      responsavel: "",
      ramal: "5651",
      funcoesAcumuladas: ["governanca"],
      atribuicoes: [
        "Direção, planejamento e representação institucional da área de tecnologia",
        "Gestão dos contratos de TI, entre eles o Contrato 65/2022 de serviços especializados",
        "Interlocução com as demais unidades do Tribunal e com os órgãos de controle",
      ],
      pessoas: [
        { nome: "Diego Daltro", ramal: "5651" },
        { nome: "Mauro", ramal: "5624" },
        { nome: "Sérvulo", ramal: "5656" },
        { nome: "Fabrício", ramal: "4550" },
        { nome: "Fabiana", ramal: "5609" },
      ],
    },
    unidades: [
      {
        sigla: "SEATU/SST",
        nome: "Atendimento SEATU/SST",
        natureza: "Frente de atendimento",
        responsavel: "",
        ramal: "4631",
        portaDeEntrada: true,
        funcoes: ["atendimento"],
        atribuicoes: [
          "Porta de entrada da operação: chamado, incidente e solicitação de rotina",
          "Atendimento ao usuário interno e apoio às sessões do Plenário (ramal 4665)",
          "Primeiro nível de suporte, sem separação formal entre triagem e solução",
        ],
        pessoas: [
          { nome: "Ramal geral", ramal: "4631", geral: true },
          { nome: "Raul", ramal: "5667" },
          { nome: "Vinicius Matias", ramal: "5607" },
          { nome: "Eduardo", ramal: "5604" },
          { nome: "Caique", ramal: "5684" },
          { nome: "Ian / Ivan", ramal: "5613" },
          { nome: "Estagiários", ramais: ["5661", "5665"] },
          { nome: "Plenário", ramal: "4665" },
        ],
      },
      {
        sigla: "INFRA",
        nome: "Atendimento Infra",
        natureza: "Frente de atendimento",
        responsavel: "",
        ramal: "",
        funcoes: ["infraestrutura"],
        funcoesAcumuladas: ["seguranca"],
        atribuicoes: [
          "Rede, servidores, estações de trabalho e ambiente de datacenter",
          "Backup, monitoramento e continuidade dos serviços",
          "Segurança da informação exercida por acúmulo, sem unidade própria",
        ],
        pessoas: [
          { nome: "Rafael", ramal: "4535" },
          { nome: "Diego", ramal: "4629" },
          { nome: "Edvaldo", ramal: "5615" },
          { nome: "Adson", ramal: "5617" },
        ],
      },
      {
        sigla: "e-TCM",
        nome: "Atendimento e-TCM",
        natureza: "Frente de atendimento",
        responsavel: "",
        ramal: "5670",
        funcoes: ["sistemas"],
        atribuicoes: [
          "Sustentação e evolução do sistema e-TCM",
          "Atendimento especializado aos usuários do e-TCM, internos e externos",
          "Interface com a fábrica de software contratada",
        ],
        pessoas: [
          { nome: "Ramal geral", ramal: "5670", geral: true },
          { nome: "Aislã", ramal: "5663" },
          { nome: "Paula", ramal: "5659" },
          { nome: "Lucas", ramal: "5666" },
        ],
      },
    ],
  },

  sugerida: {
    rotulo: "Estrutura sugerida",
    chamada: "Minuta de proposta — organização por função de TI",
    minuta: true,
    resumo:
      "Seis unidades sob a Diretoria, organizadas por função e não por porta de atendimento. A minuta não cria cargo nem pressupõe contratação: redistribui atribuições sobre o efetivo hoje lotado na DTI e faz aparecer no organograma três responsabilidades que hoje existem sem dono — governança, segurança da informação e dados.",
    procedencia:
      "Minuta de trabalho, sem valor de ato administrativo. Criação, extinção e denominação de unidade dependem de ato próprio do Tribunal; o que esta tela propõe é o desenho e a distribuição de atribuições.",
    notasTitulo: "Premissas da minuta",
    notas: [
      "Sem criação de cargo e sem contratação: as seis unidades são desenhadas sobre as 22 pessoas hoje lotadas na DTI.",
      "As três frentes de atendimento não são extintas — passam a coordenações com escopo declarado, mantendo equipe e ramais.",
      "As três unidades novas assumem responsabilidades que já são exercidas por acúmulo; o que muda é ter dono, não ter mais trabalho.",
      "Composição nominal das unidades novas fica a definir pela Diretoria: a minuta propõe o desenho, não a lotação das pessoas.",
      "O ramal 4631 permanece a porta de entrada única da operação, agora com catálogo de serviços e prazo de atendimento declarados.",
    ],
    topo: {
      sigla: "DTI",
      nome: "Diretoria de Tecnologia da Informação",
      natureza: "Diretoria",
      responsavel: "",
      ramal: "5651",
      atribuicoes: [
        "Direção, planejamento e representação institucional da área de tecnologia",
        "Decisão sobre portfólio, prioridades e alocação de recursos entre as unidades",
        "Interlocução com a Presidência, com as demais diretorias e com os órgãos de controle",
      ],
      pessoas: [
        { nome: "Diego Daltro", ramal: "5651" },
        { nome: "Mauro", ramal: "5624" },
        { nome: "Sérvulo", ramal: "5656" },
        { nome: "Fabrício", ramal: "4550" },
        { nome: "Fabiana", ramal: "5609" },
      ],
    },
    unidades: [
      {
        sigla: "AGTI",
        nome: "Assessoria de Governança e Gestão de TI",
        natureza: "Assessoria",
        estado: "nova",
        responsavel: "",
        ramal: "",
        funcoes: ["governanca"],
        atribuicoes: [
          "Plano diretor de TI, portfólio de projetos e indicadores de desempenho",
          "Gestão e fiscalização dos contratos de tecnologia, com acompanhamento de vigência e de saldo",
          "Planejamento das contratações, gestão de fornecedores e apoio aos órgãos de controle",
          "Conformidade com a LGPD e com as normas de TI aplicáveis ao Tribunal",
        ],
        lotacao:
          "Composição a definir por remanejamento interno. Hoje estas atribuições são exercidas pela Diretoria por acúmulo.",
        justificativa:
          "A carteira de contratos de TI passa de R$ 9 milhões anuais em um único contrato, e o plano de entregas do Tribunal já é acompanhado em painel próprio. O que falta não é o trabalho, é a unidade que responda por ele.",
      },
      {
        sigla: "CAU",
        nome: "Coordenação de Atendimento e Serviços ao Usuário",
        natureza: "Coordenação",
        estado: "renomeada",
        origem: "Atendimento SEATU/SST",
        responsavel: "",
        ramal: "4631",
        portaDeEntrada: true,
        funcoes: ["atendimento"],
        atribuicoes: [
          "Porta de entrada única da operação pelo ramal 4631, com catálogo de serviços e prazo declarado",
          "Triagem, registro e acompanhamento de todo chamado até o encerramento",
          "Primeiro nível de solução; o que exceder o primeiro nível é encaminhado a Infra ou a Sistemas",
          "Apoio às sessões do Plenário (ramal 4665)",
        ],
        lotacao: "Mantém a equipe e os ramais da atual frente SEATU/SST.",
        justificativa:
          "Separar quem tria de quem resolve é o que permite medir prazo de atendimento e impedir que a fila do dia consuma o projeto do mês.",
        pessoas: [
          { nome: "Ramal geral", ramal: "4631", geral: true },
          { nome: "Raul", ramal: "5667" },
          { nome: "Vinicius Matias", ramal: "5607" },
          { nome: "Eduardo", ramal: "5604" },
          { nome: "Caique", ramal: "5684" },
          { nome: "Ian / Ivan", ramal: "5613" },
          { nome: "Estagiários", ramais: ["5661", "5665"] },
          { nome: "Plenário", ramal: "4665" },
        ],
      },
      {
        sigla: "CIO",
        nome: "Coordenação de Infraestrutura e Operações",
        natureza: "Coordenação",
        estado: "renomeada",
        origem: "Atendimento Infra",
        responsavel: "",
        ramal: "",
        funcoes: ["infraestrutura"],
        atribuicoes: [
          "Datacenter, rede, servidores, nuvem e estações de trabalho",
          "Backup, monitoramento, capacidade e continuidade dos serviços",
          "Segundo nível de solução para o que a Coordenação de Atendimento encaminhar",
        ],
        lotacao: "Mantém a equipe e os ramais da atual frente de Infra.",
        justificativa:
          "A operação deixa de acumular segurança da informação e passa a responder pelo que é próprio da infraestrutura, com o Núcleo de Segurança como instância separada de política e de resposta a incidente.",
        pessoas: [
          { nome: "Rafael", ramal: "4535" },
          { nome: "Diego", ramal: "4629" },
          { nome: "Edvaldo", ramal: "5615" },
          { nome: "Adson", ramal: "5617" },
        ],
      },
      {
        sigla: "CSIS",
        nome: "Coordenação de Sistemas",
        natureza: "Coordenação",
        estado: "renomeada",
        origem: "Atendimento e-TCM",
        responsavel: "",
        ramal: "5670",
        funcoes: ["sistemas"],
        atribuicoes: [
          "Ciclo de vida dos sistemas do Tribunal, com o e-TCM à frente",
          "Sustentação, evolução, integrações e gestão técnica da fábrica de software",
          "Requisitos, homologação e implantação junto às unidades demandantes",
        ],
        lotacao: "Mantém a equipe e os ramais da atual frente e-TCM.",
        justificativa:
          "O nome atual amarra a unidade a um sistema. O Tribunal opera mais do que o e-TCM, e a coordenação precisa responder por todos eles sem depender de nova frente a cada sistema novo.",
        pessoas: [
          { nome: "Ramal geral", ramal: "5670", geral: true },
          { nome: "Aislã", ramal: "5663" },
          { nome: "Paula", ramal: "5659" },
          { nome: "Lucas", ramal: "5666" },
        ],
      },
      {
        sigla: "NSI",
        nome: "Núcleo de Segurança da Informação",
        natureza: "Núcleo",
        estado: "nova",
        responsavel: "",
        ramal: "",
        funcoes: ["seguranca"],
        atribuicoes: [
          "Política de segurança da informação, gestão de acessos e de identidades",
          "Gestão de vulnerabilidades, hardening e acompanhamento de conformidade",
          "Resposta a incidente de segurança, com registro e comunicação à Diretoria",
          "Plano de continuidade e teste periódico de recuperação",
        ],
        lotacao:
          "Composição a definir por remanejamento interno. Hoje o papel é exercido por acúmulo pela frente de Infra.",
        justificativa:
          "Segurança acumulada por quem opera o ambiente é avaliada pelo próprio executor. Separar a instância que define política e responde a incidente da que mantém a operação é o desenho que a norma de segurança pressupõe.",
      },
      {
        sigla: "NDI",
        nome: "Núcleo de Dados e Informação",
        natureza: "Núcleo",
        estado: "nova",
        responsavel: "",
        ramal: "",
        funcoes: ["dados"],
        atribuicoes: [
          "Painéis e indicadores institucionais, com fonte e periodicidade declaradas",
          "Integração e qualidade das bases, dicionário de dados e catálogo",
          "Atendimento às demandas de informação gerencial da Presidência e das diretorias",
          "Transparência ativa e abertura de dados, no que couber à TI",
        ],
        lotacao:
          "Composição a definir por remanejamento interno. Hoje as demandas são atendidas caso a caso, sem unidade responsável.",
        justificativa:
          "Painel feito por demanda não tem dono, nem fonte declarada, nem quem responda quando o número divergir. Com unidade própria, informação gerencial passa a ser serviço, não favor.",
      },
    ],
    mudancas: [
      {
        tipo: "nova",
        titulo: "Três unidades novas para responsabilidades que já existem",
        detalhe:
          "Governança e gestão de TI, segurança da informação e dados passam a ter unidade própria. Hoje as três são exercidas por acúmulo — a primeira pela Diretoria, a segunda pela Infra, a terceira por quem estiver disponível.",
      },
      {
        tipo: "renomeada",
        titulo: "As frentes de atendimento passam a coordenações com escopo declarado",
        detalhe:
          "SEATU/SST, Infra e e-TCM mantêm equipe e ramais e passam a Coordenação de Atendimento e Serviços ao Usuário, Coordenação de Infraestrutura e Operações e Coordenação de Sistemas. O nome deixa de descrever a porta e passa a descrever a função.",
      },
      {
        tipo: "processo",
        titulo: "Atendimento e solução deixam de ser o mesmo time",
        detalhe:
          "A Coordenação de Atendimento tria, registra e resolve o primeiro nível; o que excede vai a Infra ou a Sistemas com registro. Sem essa separação não há prazo de atendimento mensurável nem projeto protegido da fila do dia.",
      },
      {
        tipo: "processo",
        titulo: "Porta de entrada única formalizada no 4631",
        detalhe:
          "A regra que hoje é norma de conduta passa a atributo da estrutura: um ramal de entrada, um catálogo de serviços e um prazo declarado por tipo de chamado.",
      },
      {
        tipo: "processo",
        titulo: "Segurança deixa de ser avaliada por quem opera",
        detalhe:
          "Política, gestão de vulnerabilidades e resposta a incidente saem da Infra e passam ao Núcleo de Segurança da Informação, que responde diretamente à Diretoria.",
      },
      {
        tipo: "governanca",
        titulo: "Contrato e projeto ganham unidade fiscalizadora",
        detalhe:
          "A Assessoria de Governança assume vigência, saldo e desempenho dos contratos de TI, o portfólio de projetos e os indicadores — hoje acompanhados pela Diretoria em acúmulo com a direção da área.",
      },
    ],
  },
};
