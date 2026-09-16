// Catálogo do quadro de tarefas: as colunas do quadro e as categorias que uma
// tarefa pode receber.
//
// O que vem daqui é o vocabulário — as quatro colunas do fluxo e as categorias
// da DTI — e a carteira inicial de tarefas informada pela Diretoria.
//
// As tarefas novas são digitadas na tela e ficam no armazenamento do
// navegador, como os projetos do Plano 100 dias. A semente abaixo é aplicada
// UMA vez por navegador e mesclada por id: editar, mover de coluna ou apagar
// uma tarefa semeada não é desfeito no carregamento seguinte. Ao acrescentar
// tarefas nesta lista, suba SAA_TAREFAS_VERSAO para que elas alcancem quem já
// abriu o sistema.
//
// O TÍTULO é a ação, e a DESCRIÇÃO guarda o texto como a Diretoria o
// escreveu: reescrever a demanda sem deixar o original em algum lugar
// transformaria a interpretação de quem lançou em registro.
//
// COLUNAS. A ordem do arquivo é a ordem do quadro, e o `id` é o que fica
// gravado em cada tarefa — renomear o rótulo não mexe no que está salvo,
// trocar o id sim. A última coluna é a de encerramento: o quadro a usa para
// saber o que não conta mais como pendência.
//
// CATEGORIAS. Cada uma declara a família de cor que a etiqueta usa em tela.
// As famílias vêm dos tokens que o resto do sistema já usa (navy institucional,
// azul de reunião, verde, âmbar, roxo, vermelho e neutra), de modo que a
// etiqueta acompanha o tema claro e o escuro sem cor nova em lugar nenhum.
// Acrescentar categoria é acrescentar uma linha aqui.
//
// Script clássico e não módulo de propósito: se este arquivo falhar ao
// carregar, o sistema continua de pé com o vocabulário mínimo embutido na
// tela, em vez de quebrar.

window.SAA_TAREFAS_VERSAO = "2026-09-16.2";

window.SAA_TAREFAS_COLUNAS = [
  { id: "a-fazer", rotulo: "A fazer", descricao: "Registrada, ainda não começou" },
  { id: "em-andamento", rotulo: "Em andamento", descricao: "Alguém está executando" },
  { id: "em-revisao", rotulo: "Em revisão", descricao: "Executada, aguarda conferência ou aprovação" },
  { id: "concluida", rotulo: "Concluída", descricao: "Encerrada", encerra: true },
];

// Carteira inicial, informada pela Diretoria em 14/09/2026. Entram na coluna
// que a Diretoria indicou — as sete primeiras como pendentes e a cotação de
// computadores em andamento. Prazo e prioridade não foram informados e por
// isso ficam em branco: preenchê-los por conta própria criaria cobrança que
// ninguém combinou.
window.SAA_TAREFAS = [
  {
    "id": "tarefa-cotacao-computadores",
    "titulo": "Cotar novos valores para 200 computadores, na mesma configuração da Simpress",
    "descricao": "Cotação de novos valores para computador (mesma configuração SIMPRESS) — 200 computadores.",
    "categoria": "contratos",
    "unidade": "DINT",
    "responsavel": "",
    "prazo": "",
    "prioridade": "media",
    "status": "em-andamento"
  },
  {
    "id": "tarefa-ia-licencas-desenvolvimento",
    "titulo": "Definir a quantidade de desenvolvedores com licença de IA para desenvolvimento",
    "descricao": "Quantidade de desenvolvedores, licença dev IA.",
    "categoria": "sistemas",
    "unidade": "DDES",
    "responsavel": "Mauro de Castro Portugal",
    "prazo": "",
    "prioridade": "media",
    "status": "a-fazer"
  },
  {
    "id": "tarefa-ia-auditores",
    "titulo": "Definir a quantidade de auditores que usarão IA",
    "descricao": "Quantidade de auditores que usarão IA.",
    "categoria": "sistemas",
    "unidade": "DDES",
    "responsavel": "Mauro de Castro Portugal",
    "prazo": "",
    "prioridade": "media",
    "status": "a-fazer"
  },
  {
    "id": "tarefa-ia-gabinete",
    "titulo": "Definir a quantidade de pessoas do Gabinete que usarão IA",
    "descricao": "Quantidade no Gabinete que usará IA.",
    "categoria": "sistemas",
    "unidade": "DDES",
    "responsavel": "Mauro de Castro Portugal",
    "prazo": "",
    "prioridade": "media",
    "status": "a-fazer"
  },
  {
    "id": "tarefa-prodeb-unificacao-contratos",
    "titulo": "Analisar a proposta da PRODEB de unificação de contratos, com licenças de banco de dados SQL Server Enterprise e Oracle",
    "descricao": "Proposta nova da PRODEB — unificando contratos — licença do banco de dados — SQL Server Enterprise e Oracle.",
    "categoria": "contratos",
    "unidade": "DINT",
    "responsavel": "Ciro e Rafael José Levita de Almeida",
    "prazo": "",
    "prioridade": "media",
    "status": "a-fazer"
  },
  {
    "id": "tarefa-arquitetura-google",
    "titulo": "Definir o cenário de desenvolvimento, auditoria e gabinetes na arquitetura Google",
    "descricao": "Definição do cenário de desenvolvimento + auditoria + gabinetes — arquitetura Google.",
    "categoria": "infraestrutura",
    "unidade": "",
    "responsavel": "Ivo",
    "prazo": "",
    "prioridade": "media",
    "status": "a-fazer"
  },
  {
    "id": "tarefa-orcamento-nuvem",
    "titulo": "Levantar o orçamento do futuro contrato de nuvem e o valor atual",
    "descricao": "Orçamento do futuro contrato e valor atual da nuvem.",
    "categoria": "contratos",
    "unidade": "DINT",
    "responsavel": "Rafael José Levita de Almeida e Diego Daltro",
    "prazo": "",
    "prioridade": "media",
    "status": "a-fazer"
  },
  {
    "id": "tarefa-apresentacao-transformacao-digital",
    "titulo": "Apresentar à Presidência, à Chefia de Gabinete e aos Conselheiros a Estratégia de Transformação Digital do TCM-BA",
    "descricao": "Apresentação para a Presidência, a Chefia de Gabinete e os Conselheiros.\n\nDIAGNÓSTICO REAL\nDiagnóstico inicial e diagnóstico real.\n\nPLANO DE 100 DIAS\nPacote de entregas imediatas até completar os 100 dias.\n\nESTRATÉGIA DE TRANSFORMAÇÃO DIGITAL\n\nCurto prazo: execução do plano de 100 dias, subir os sistemas novos e implementação de IA no desenvolvimento; reestruturação tecnológica dos sistemas; Programa de Regularização Processual (contratos vencidos, a vencer e futuros), no recorte de 100 dias; e, por fim, iniciar o projeto TCM Digital.\n\nMédio prazo: reestruturação física e regimental da DTI para atender à plena necessidade do TCM; contratualização das tecnologias e equipamentos necessários à modernização do TCM; desenvolvimento do TCM Digital com todas as plataformas unificadas e BIs para agilizar o trabalho dos gabinetes e auditores — até a finalização do 1º semestre de 2027.\n\nLongo prazo, 1 ano: implementação plena do ferramental do TCM Digital e implantação plena do SEI; transparência integrada ao SEI; IA contínua nos processos de uso dos servidores e no desenvolvimento, para entregas mais rápidas; qualificação tecnológica de todos os profissionais do TCM, para aprimoramento contínuo e educação permanente e continuada em TI; e modelos de inovação e de predição para os gabinetes e auditores do TCM, de forma contínua.",
    "categoria": "governanca",
    "unidade": "",
    "responsavel": "Daniel",
    "prazo": "",
    "prioridade": "media",
    "status": "a-fazer"
  },
  {
    "id": "tarefa-estrutura-dados-nuvem",
    "titulo": "Verificar com a DINT como os dados estão estruturados na nuvem, juntos ou separados por máquina",
    "descricao": "Falar com Rafael da DINT para verificar como os dados estão estruturados na nuvem, se estão juntos ou separados em máquinas.",
    "categoria": "infraestrutura",
    "unidade": "DINT",
    "responsavel": "Diego Daltro",
    "prazo": "",
    "prioridade": "media",
    "status": "a-fazer"
  },
  {
    "id": "tarefa-defensoria-sistema-gol",
    "titulo": "Ligar para a Defensoria para saber os problemas do sistema GOL e o valor do suporte",
    "descricao": "",
    "categoria": "sistemas",
    "unidade": "",
    "responsavel": "",
    "prazo": "",
    "prioridade": "media",
    "status": "a-fazer"
  },
  {
    "id": "tarefa-pntp-2026-selo-diamante",
    "titulo": "Corrigir os itens do PNTP 2026 para manter o Selo Diamante",
    "descricao": "Avaliação Final do PNTP 2026 (ATRICON), recebida em 15/09/2026 da Equipe da Garantia PNTP. Prazo até 25/09/2026 para correção de itens e critérios essenciais e obrigatórios, necessários à manutenção do Selo Diamante no presente exercício.\n\nDimensão, critérios e itens a corrigir, conforme o arquivo \"Garantia TCM PNTP 2026\" anexo ao e-mail: Receita, Despesa e Contratos (ordem cronológica de pagamentos).\n\nOrigem: e-mail de Sergio Luiz Santana Lordelo, de 15/09/2026, no exercício da atribuição designada pela Portaria TCM nº 02, de 15 de maio de 2025.",
    "categoria": "governanca",
    "unidade": "DDES",
    "responsavel": "Lourival Magalhães Nascimento Neto",
    "prazo": "2026-09-25",
    "prioridade": "alta",
    "status": "a-fazer"
  },
  {
    "id": "tarefa-bi-gerencia-contratos",
    "titulo": "Criar BI com os dados da Gerência de Contratos",
    "descricao": "Criação de BI com os dados da Gerência de Contratos.",
    "categoria": "dados",
    "unidade": "",
    "responsavel": "Nelma",
    "prazo": "",
    "prioridade": "media",
    "status": "a-fazer"
  }
];

window.SAA_TAREFAS_CATEGORIAS = [
  { id: "sistemas", rotulo: "Sistemas", familia: "navy" },
  { id: "infraestrutura", rotulo: "Infraestrutura", familia: "azul" },
  { id: "dados", rotulo: "Banco de dados", familia: "verde" },
  { id: "atendimento", rotulo: "Atendimento", familia: "ambar" },
  { id: "contratos", rotulo: "Contratos e fornecedores", familia: "roxo" },
  { id: "governanca", rotulo: "Governança e segurança", familia: "vermelho" },
  { id: "gestao", rotulo: "Gestão e pessoal", familia: "neutra" },
];
