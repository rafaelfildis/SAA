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

window.SAA_TAREFAS_VERSAO = "2026-10-08.1";

// Marca de limpeza do quadro. Quando muda, cada navegador apaga UMA vez as
// tarefas que tem salvas e grava a marca; trocar o valor de novo repete a
// limpeza. Vazio desliga o mecanismo.
window.SAA_TAREFAS_ZERADO_EM = "2026-10-08";

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
// Quadro zerado a pedido da Diretoria em 08/10/2026: a carteira inicial foi
// retirada e cada navegador apaga, uma única vez, as tarefas que tinha salvas
// (ver SAA_TAREFAS_ZERADO_EM). Tarefas criadas depois disso ficam normalmente.
window.SAA_TAREFAS = [];

window.SAA_TAREFAS_CATEGORIAS = [
  { id: "sistemas", rotulo: "Sistemas", familia: "navy" },
  { id: "infraestrutura", rotulo: "Infraestrutura", familia: "azul" },
  { id: "dados", rotulo: "Banco de dados", familia: "verde" },
  { id: "atendimento", rotulo: "Atendimento", familia: "ambar" },
  { id: "contratos", rotulo: "Contratos e fornecedores", familia: "roxo" },
  { id: "governanca", rotulo: "Governança e segurança", familia: "vermelho" },
  { id: "gestao", rotulo: "Gestão e pessoal", familia: "neutra" },
];
