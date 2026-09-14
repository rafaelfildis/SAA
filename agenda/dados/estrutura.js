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
// da DINT.
//
// Ramal não entra aqui de propósito. As relações não trazem ramal, e cruzar
// nome com a lista de ramais pelo primeiro nome produziria número errado ao
// lado de pessoa certa. Quem procura número usa o módulo Ramal DTI.
//
// A ESTRUTURA SUGERIDA é minuta de trabalho, e a tela diz isso em todo lugar
// onde ela aparece. Não pressupõe criação de cargo nem contratação: redistribui
// atribuições sobre as mesmas pessoas, preserva as divisões existentes e faz
// aparecer no organograma três responsabilidades que hoje existem sem unidade
// própria.
//
// Os quadros ficam em constantes compartilhadas porque as duas visões usam as
// mesmas pessoas: repetir 37 nomes em cada uma criaria duas listas para
// divergirem na primeira atualização.

(function () {
  // Perfil de senioridade, sem matrícula nem vínculo: é como a alocação da
  // equipe técnica chega, e inventar os campos que faltam seria pior do que
  // deixá-los vazios.
  const tecnico = (nome, nivel) => ({ nome, nivel, papel: "tecnica" });

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
    tecnico("Yuri Figueiredo Ribeiro", "Estagiário"),
  ];

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
      chamada: "Minuta de proposta — cada função com unidade responsável",
      minuta: true,
      resumo:
        "Seis unidades no organograma. Nenhuma divisão existente é extinta: DDES e DINT permanecem como são, com a Seção de Atendimento ao Usuário subordinada à Infraestrutura, e a Divisão de Banco de Dados tem o escopo ampliado e passa a Divisão de Dados e Informação, mantendo a chefia e os dois analistas. Duas unidades novas assumem o que hoje é acúmulo — governança e segurança da informação. Sem criação de cargo: o desenho é feito sobre as mesmas 43 pessoas.",
      procedencia:
        "Minuta de trabalho, sem valor de ato administrativo. Criação, extinção e denominação de unidade, assim como designação de chefia e remanejamento de equipe, dependem de ato próprio do Tribunal; o que esta tela propõe é o desenho e a distribuição de atribuições.",
      notasTitulo: "Premissas da minuta",
      notas: [
        "Sem criação de cargo e sem contratação: as seis unidades são desenhadas sobre as 43 pessoas do organograma — 16 da relação de lotação e 27 da equipe técnica.",
        "Nenhuma divisão é extinta. DDES e DINT permanecem com a mesma chefia e o mesmo quadro; a DBAD permanece com a mesma chefia e os mesmos analistas, com escopo ampliado e nova denominação.",
        "As duas unidades novas assumem responsabilidades que já são exercidas por acúmulo — o que muda é ter dono, não ter mais trabalho.",
        "A concentração de técnicos no desenvolvimento — 26 dos 27 — é dado de partida da minuta, não consequência dela. Redistribuir perfis entre as unidades é decisão da Diretoria.",
        "Composição nominal das unidades novas e o escopo de cada uma das três gerências da DDES ficam a definir pela Diretoria.",
        "A Seção de Atendimento ao Usuário permanece subordinada à Divisão de Infraestrutura Tecnológica, com quadro próprio a dimensionar.",
        "O ramal 4631 permanece a porta de entrada única da operação, agora com catálogo de serviços e prazo de atendimento declarados.",
      ],
      topo: {
        sigla: "DTI",
        nome: "Diretoria de Tecnologia da Informação",
        natureza: "Diretoria",
        atribuicoes: [
          "Direção, planejamento e representação institucional da área de tecnologia",
          "Decisão sobre portfólio, prioridades e alocação de recursos entre as unidades",
          "Interlocução com a Presidência, com as demais diretorias e com os órgãos de controle",
        ],
        pessoas: QUADRO_DIRETORIA,
      },
      unidades: [
        {
          sigla: "AGTI",
          nome: "Assessoria de Governança e Gestão de TI",
          natureza: "Assessoria",
          estado: "nova",
          subordinacao: "Diretoria de Tecnologia da Informação",
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
            "Um único contrato de serviços especializados passa de R$ 9 milhões por ano e sustenta 27 técnicos alocados, e o plano de entregas do Tribunal já é acompanhado em painel próprio. O que falta não é o trabalho, é a unidade que responda por ele.",
        },
        {
          sigla: "NSI",
          nome: "Núcleo de Segurança da Informação",
          natureza: "Núcleo",
          estado: "nova",
          subordinacao: "Diretoria de Tecnologia da Informação",
          funcoes: ["seguranca"],
          atribuicoes: [
            "Política de segurança da informação, gestão de acessos e de identidades",
            "Gestão de vulnerabilidades, hardening e acompanhamento de conformidade",
            "Resposta a incidente de segurança, com registro e comunicação à Diretoria",
            "Plano de continuidade e teste periódico de recuperação",
          ],
          lotacao:
            "Composição a definir por remanejamento interno. Hoje o papel é exercido por acúmulo pela Divisão de Infraestrutura Tecnológica.",
          justificativa:
            "Segurança acumulada por quem opera o ambiente é avaliada pelo próprio executor. Separar a instância que define política e responde a incidente da que mantém a operação é o desenho que a norma de segurança pressupõe.",
        },
        {
          sigla: "DDES",
          nome: "Divisão de Desenvolvimento de Sistemas",
          natureza: "Divisão",
          estado: "mantida",
          subordinacao: "Diretoria de Tecnologia da Informação",
          funcoes: ["sistemas"],
          atribuicoes: [
            "Ciclo de vida dos sistemas do Tribunal: requisitos, desenvolvimento, homologação e sustentação",
            "Três gerências (DAS-3) com seção e escopo declarados — a definir pela Diretoria",
            "Gestão técnica da equipe alocada pelo contrato de serviços especializados",
          ],
          lotacao: "Mantém a chefia e as 37 pessoas hoje na Divisão.",
          justificativa:
            "Três gerentes lotados na Divisão sem seção nomeada é chefia sem escopo, e o desenvolvimento reúne 26 dos 27 técnicos alocados: sem carteira definida, a prioridade do dia decide o que anda. Declarar as seções não cria cargo — os três titulares já existem.",
          pessoas: QUADRO_DDES,
        },
        {
          sigla: "DINT",
          nome: "Divisão de Infraestrutura Tecnológica",
          natureza: "Divisão",
          estado: "mantida",
          subordinacao: "Diretoria de Tecnologia da Informação",
          funcoes: ["infraestrutura"],
          atribuicoes: [
            "Datacenter, rede, servidores, nuvem e estações de trabalho",
            "Backup, monitoramento, capacidade e continuidade dos serviços",
            "Atendimento ao usuário pela Seção subordinada (SEATU), com catálogo e prazo declarados",
            "Segundo nível de solução para o que a Seção encaminhar",
          ],
          lotacao:
            "Mantém a chefia e a Seção subordinada. Quadro técnico a dimensionar: a alocação atual não contempla a unidade.",
          justificativa:
            "A Divisão deixa de acumular segurança da informação e passa a responder pelo que é próprio da infraestrutura, com o Núcleo de Segurança como instância separada de política e de resposta a incidente.",
          pessoas: QUADRO_DINT,
          subunidades: [
            {
              sigla: "SEATU",
              nome: "Seção de Atendimento ao Usuário",
              natureza: "Seção",
              estado: "mantida",
              ramal: "4631",
              portaDeEntrada: true,
              funcoes: ["atendimento"],
              atribuicoes: [
                "Porta de entrada única da operação pelo ramal 4631, com catálogo de serviços e prazo declarado",
                "Triagem, registro e acompanhamento de todo chamado até o encerramento",
                "Primeiro nível de solução; o que exceder vai à Infraestrutura ou ao Desenvolvimento com registro",
                "Apoio às sessões do Plenário",
              ],
              lotacao: "Mantém a gerência. Quadro de atendimento a dimensionar junto com a Divisão.",
              justificativa:
                "A seção já é a porta de entrada de fato, e continua onde está. O que a minuta acrescenta é a separação entre quem tria e quem resolve, sem a qual não há prazo de atendimento mensurável.",
              pessoas: QUADRO_SEATU,
            },
          ],
        },
        {
          sigla: "DDI",
          nome: "Divisão de Dados e Informação",
          natureza: "Divisão",
          estado: "renomeada",
          origem: "Divisão de Banco de Dados, DBAD",
          subordinacao: "Diretoria de Tecnologia da Informação",
          funcoes: ["dados", "informacao"],
          atribuicoes: [
            "Administração dos bancos de dados corporativos, desempenho e integridade das bases",
            "Painéis e indicadores institucionais, com fonte e periodicidade declaradas",
            "Dicionário de dados, catálogo e qualidade da informação",
            "Transparência ativa e abertura de dados, no que couber à TI",
          ],
          lotacao: "Mantém a chefia e os dois analistas hoje lotados na DBAD.",
          justificativa:
            "Ampliar o escopo de uma divisão que já administra os dados custa menos que criar unidade nova: o painel feito por demanda passa a ter dono sem que se mexa em comando nem em quadro.",
          pessoas: QUADRO_DADOS,
        },
      ],
      mudancas: [
        {
          tipo: "nova",
          titulo: "Duas unidades novas para responsabilidades que já existem",
          detalhe:
            "Governança e gestão de TI e segurança da informação passam a ter unidade própria, ligadas diretamente à Diretoria. Hoje a primeira é exercida pela Diretoria por acúmulo e a segunda pela Divisão de Infraestrutura Tecnológica.",
        },
        {
          tipo: "processo",
          titulo: "Segurança e governança deixam de depender do que sobra do desenvolvimento",
          detalhe:
            "Das 43 pessoas do organograma, 37 estão no desenvolvimento, e 26 dos 27 técnicos alocados também. Enquanto as duas funções não tiverem unidade, seguirão atendidas com a capacidade que sobrar da fila de sistemas.",
        },
        {
          tipo: "renomeada",
          titulo: "A Divisão de Banco de Dados passa a Divisão de Dados e Informação",
          detalhe:
            "Mesma chefia e mesmo quadro, escopo ampliado: além da administração das bases, passa a responder por painéis, indicadores, dicionário de dados e abertura de dados. Informação gerencial ganha dono sem criação de unidade nova.",
        },
        {
          tipo: "processo",
          titulo: "As três gerências da DDES ganham seção e escopo declarados",
          detalhe:
            "Os três gerentes (DAS-3) estão hoje lotados na própria Divisão, sem seção nomeada, com 26 técnicos alocados sob a mesma chefia. Declarar a carteira de cada um não cria cargo — os titulares já existem — e é o que permite cobrar entrega por escopo, não por disponibilidade.",
        },
        {
          tipo: "processo",
          titulo: "Atendimento e solução deixam de ser o mesmo time",
          detalhe:
            "A Seção de Atendimento ao Usuário tria, registra e resolve o primeiro nível; o que excede vai à Infraestrutura ou ao Desenvolvimento com registro. Sem essa separação não há prazo de atendimento mensurável nem projeto protegido da fila do dia.",
        },
        {
          tipo: "processo",
          titulo: "Porta de entrada única formalizada no 4631",
          detalhe:
            "A regra que hoje é norma de conduta passa a atributo da estrutura: um ramal de entrada, um catálogo de serviços e um prazo declarado por tipo de chamado, na Seção que já é a porta de fato.",
        },
        {
          tipo: "governanca",
          titulo: "Infraestrutura e dados com quadro técnico dimensionado",
          detalhe:
            "A alocação atual de técnicos não contempla a Infraestrutura nem o Banco de Dados, que respondem por datacenter, rede, backup e bases com chefia e analistas efetivos. A minuta registra o dimensionamento como decisão a tomar, em vez de tratá-lo como resolvido.",
        },
      ],
    },
  };
})();
