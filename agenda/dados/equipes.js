// Equipe e projetos: quem está alocado em quê, célula por célula. Vem com o
// sistema, como a carteira de contratos e a lista de ramais — é consulta, igual
// para todo mundo, sem nada a gravar por navegador.
//
// A fonte é a relação "Equipes DDES — Set/26, por célula", da própria Divisão.
// Nela a coluna PROJETOS PRINCIPAIS é preenchida uma vez por grupo, em célula
// mesclada, e as linhas seguintes pertencem ao mesmo grupo — foi essa mescla
// que definiu as caixas aqui, uma por célula.
//
// DUAS ORDENS SAEM DA PLANILHA, DE PROPÓSITO:
//
//   · o líder vem primeiro na caixa, não por último como na relação. Quem abre
//     a tela para saber com quem falar sobre um projeto procura o líder, e
//     achá-lo no fim de uma lista de nove nomes é trabalho à toa.
//   · as caixas são ordenadas pelo tamanho da equipe na renderização, não aqui.
//     A pergunta do gestor é onde está a gente, e a resposta fica no topo.
//
// `perfil` guarda o que a relação traz na coluna "CARGO/ PERFIL": o nível de
// senioridade para quem é terceirizado e o cargo para efetivo, comissionado e
// cedido. São coisas diferentes na mesma coluna porque é assim que a relação
// declara — separá-las aqui inventaria uma informação que a fonte não dá.
//
// A chefia da Divisão fica fora das células: ela responde pela DDES inteira, e
// transformá-la em mais uma caixa de projeto diria que existe um projeto
// chamado DDES.

window.SAA_EQUIPES = {
  unidade: {
    sigla: "DDES",
    nome: "Divisão de Desenvolvimento de Sistemas",
    diretoria: "Diretoria de Tecnologia da Informação",
  },
  referencia: "Setembro de 2026",
  fonte: "Equipes DDES — Set/26, por célula",

  chefia: {
    nome: "Mauro de Castro Portugal",
    vinculo: "Comissionado",
    perfil: "Chefe da Divisão de Desenvolvimento de Sistemas",
    funcao:
      "Gestão de sistemas e da equipe DDES · Acompanhamento trimestral do Planejamento Estratégico da DTI · Relatório trimestral da DTI · Acompanhamento e fiscalização de contratos",
  },

  celulas: [
    {
      nome: "Novo SICCO",
      sistemas: ["Novo SICCO", "SICCO Consulta"],
      pessoas: [
        { nome: "Ayala Bezerra Leal", vinculo: "Comissionado", perfil: "Gerente de TI", funcao: "Líder Projetos Novo SICCO / SID", lider: true },
        { nome: "Jefferson Azevedo Lins", vinculo: "Terceirizado", perfil: "Master II", funcao: "Tech Lead/Desenvolvedor" },
        { nome: "Marlon Nascimento Lopes", vinculo: "Terceirizado", perfil: "Sênior III", funcao: "Desenvolvedor" },
        { nome: "José Daniel Machado Soares", vinculo: "Terceirizado", perfil: "Sênior II", funcao: "Desenvolvedor" },
        { nome: "Carlos Henrique Morais Cardoso", vinculo: "Terceirizado", perfil: "Pleno I", funcao: "Desenvolvedor" },
        { nome: "Pedro Martins Caires", vinculo: "Terceirizado", perfil: "Júnior I", funcao: "Desenvolvedor" },
        { nome: "Elizete Paula Sanson", vinculo: "Efetivo", perfil: "Analista de Sistemas", funcao: "Requisitos" },
        { nome: "Ana Paula Ferreira Lordêlo", vinculo: "Terceirizado", perfil: "Pleno II", funcao: "Analista de negócios/QA/Testador" },
        { nome: "Elaine da Anunciação Passos", vinculo: "Terceirizado", perfil: "Sênior I", funcao: "Analista de negócios/QA/Testador" },
      ],
      estagiarios: [{ nome: "Rian Uchoa Assunção", vinculo: "Estagiário" }],
    },
    {
      nome: "FAROL",
      sistemas: ["FAROL"],
      pessoas: [
        { nome: "Fabrício André de Souza Muniz", vinculo: "Comissionado", perfil: "Gerente de TI", funcao: "Líder Projetos Farol / InSite", lider: true },
        { nome: "Marcos Alberto Morais Assis", vinculo: "Terceirizado", perfil: "Sênior IV", funcao: "Tech Lead/Desenvolvedor" },
        { nome: "Diego de Almeida Menezes", vinculo: "Terceirizado", perfil: "Sênior III", funcao: "Desenvolvedor" },
        { nome: "Pablo Freire Barretto", vinculo: "Terceirizado", perfil: "Sênior II", funcao: "Desenvolvedor" },
        { nome: "Lucca Barbosa Nygaard", vinculo: "Terceirizado", perfil: "Júnior II", funcao: "Desenvolvedor" },
        { nome: "Mauricio Machado de Oliveira Matos", vinculo: "Terceirizado", perfil: "Sênior IV", funcao: "Requisitos" },
        { nome: "Evânia Fernandes dos Santos", vinculo: "Terceirizado", perfil: "Sênior I", funcao: "QA/Testador" },
      ],
      estagiarios: [{ nome: "Yuri Figueiredo Ribeiro", vinculo: "Estagiário" }],
    },
    {
      nome: "e-TCM",
      sistemas: ["e-TCM"],
      pessoas: [
        { nome: "Lucas Juan Nogueira Novaes", vinculo: "Comissionado", perfil: "Gerente de TI", funcao: "Líder Projetos e-TCM, Prestcontas, Diárias e Certidam", lider: true },
        { nome: "Claudia Carvalho dos Santos", vinculo: "Terceirizado", perfil: "Sênior II", funcao: "Desenvolvedor" },
        { nome: "Jaime Valverde Silva", vinculo: "Terceirizado", perfil: "Sênior II", funcao: "Desenvolvedor" },
        { nome: "Gabriel Silva de Matos", vinculo: "Terceirizado", perfil: "Júnior II", funcao: "Desenvolvedor" },
      ],
      estagiarios: [],
    },
    {
      nome: "Portais",
      sistemas: ["Portais"],
      pessoas: [
        { nome: "Lourival Magalhães Nascimento Neto", vinculo: "Efetivo", perfil: "Assistente Administrativo", funcao: "Líder Projeto Portais", lider: true },
        { nome: "Lúcio de Castro Sacramento", vinculo: "Terceirizado", perfil: "Sênior II", funcao: "Desenvolvedor" },
        { nome: "Luan Santana Santos", vinculo: "Terceirizado", perfil: "Pleno II", funcao: "Desenvolvedor" },
        { nome: "Caio Gabriel Cruz Amorim", vinculo: "Terceirizado", perfil: "Júnior I", funcao: "Desenvolvedor" },
      ],
      estagiarios: [],
    },
    {
      nome: "SIGA Captura",
      sistemas: ["SIGA Captura", "Achados Automáticos", "SID", "ADS", "SGE"],
      pessoas: [
        { nome: "Sandra Araújo Vasconcelos Silva", vinculo: "Efetivo", perfil: "Analista de Sistemas", funcao: "Líder Projetos Siga Captura / Achados Automáticos / ADS", lider: true },
        { nome: "Leonardo Oliveira da Silva Santos", vinculo: "Terceirizado", perfil: "Júnior III", funcao: "Desenvolvedor" },
        { nome: "Aldair Silva de Araújo", vinculo: "Terceirizado", perfil: "Júnior II", funcao: "Desenvolvedor" },
        { nome: "Arí Ramos de Andrade", vinculo: "Cedido", orgao: "ALBA", perfil: "Técnico Legislativo", funcao: "Suporte 2º nível / Homologação" },
      ],
      estagiarios: [],
    },
    {
      nome: "IA",
      sistemas: ["IA", "BARBOSA", "COMPOSE", "PP", "SCR"],
      pessoas: [
        { nome: "Melly Pedra Lordello", vinculo: "Efetivo", perfil: "Analista de Sistemas", funcao: "Líder Projetos IA / BARBOSA / COMPOSE / PP / SCR", lider: true },
        { nome: "Guilherme da Silva Boaventura", vinculo: "Terceirizado", perfil: "Júnior III", funcao: "Desenvolvedor" },
      ],
      estagiarios: [],
    },
    {
      nome: "SIGA Analisador",
      sistemas: ["SIGA Analisador", "Novo SICCO"],
      pessoas: [
        { nome: "Ana Amélia Dias Lima Gramacho", vinculo: "Efetivo", perfil: "Analista de Sistemas", funcao: "Líder Projeto SIGA Analisador", lider: true },
        { nome: "José Carlos Teixeira Junior", vinculo: "Terceirizado", perfil: "Sênior I", funcao: "Desenvolvedor" },
      ],
      estagiarios: [],
    },
    {
      nome: "SICCO (legado)",
      sistemas: ["SICCO (legado)", "ISIPRO"],
      pessoas: [
        { nome: "Jose Ribamar Santos Cartaxo", vinculo: "Cedido", orgao: "PRODEB", perfil: "Analista de Sistemas", funcao: "Desenvolvedor / Líder SICCO legado", lider: true },
      ],
      estagiarios: [],
    },
  ],
};
