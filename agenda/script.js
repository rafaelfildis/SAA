"use strict";

// ical.js v2 é distribuído como módulo ES (sem global `window.ICAL`),
// por isso este arquivo é carregado como <script type="module"> e importa
// a biblioteca diretamente do CDN.
import ICAL from "https://cdn.jsdelivr.net/npm/ical.js@2.1.0/dist/ical.min.js";

/* ==========================================================================
   CONFIGURAÇÃO CENTRAL
   ========================================================================== */

// Endereço do calendário ICS consumido diretamente pelo navegador.
// PERMANECE VAZIA por dois motivos independentes, e ambos continuam valendo
// mesmo com a agenda pública:
//   1. O feed iCal do Google não envia cabeçalhos CORS — um fetch direto do
//      navegador seria bloqueado de qualquer forma.
//   2. Se um dia a agenda voltar a ser privada, a implantação aponta para o
//      endereço secreto por variável de ambiente; deixar esta constante vazia
//      garante que esse endereço jamais chegue ao código servido ao navegador.
// O endereço em uso fica em CALENDAR_ICS_URL do servidor (/api/calendar).
const CALENDAR_ICS_URL = "";

// Link "humano" do calendário, usado apenas no botão "Abrir no Google Agenda"
// — nunca como fonte de dados. É a interface web do próprio Google, que exige
// a sessão autenticada do usuário e portanto não expõe nada.
const CALENDAR_HTML_URL = "https://calendar.google.com/calendar/r";

// Endpoint intermediário (server.js / função serverless) que busca o ICS no
// servidor. É o caminho normal de leitura: o Google não envia cabeçalhos CORS
// no feed iCal, então o fetch direto pelo navegador seria bloqueado.
const CALENDAR_API_URL = "/api/calendar";

// Dados fictícios de demonstração. Desligado: a agenda real é lida do Google
// Agenda via /api/calendar. Religar apenas para desenvolvimento sem rede.
const USE_DEMO_DATA = false;

const DISPLAY_TIMEZONE = "America/Bahia";
const REFRESH_INTERVAL_MS = 15 * 60 * 1000; // 15 minutos
const STORAGE_KEY = "saaTcm.cache.v1";

// Janela de expansão de eventos recorrentes (evita gerar ocorrências infinitas).
const JANELA_MESES_PASSADO = 1;
const JANELA_MESES_FUTURO = 6;
const MAX_OCORRENCIAS_POR_EVENTO = 300;

/* ==========================================================================
   ESTADO DA APLICAÇÃO
   ========================================================================== */

const state = {
  eventos: [],
  usandoCache: false,
  ultimaAtualizacao: null,
  carregando: false,
  filtros: {
    periodo: "dia", // todos | dia | semana | mes — sem filtro explícito, mostra a agenda de hoje
    categorias: new Set(),
    busca: "",
    mostrarConcluidos: true,
    dataInicio: null, // "YYYY-MM-DD" ou null
    dataFim: null, // "YYYY-MM-DD" ou null
  },
  exportacao: {
    formato: "mobile", // mobile (card JPEG) | a4 (extrato PDF)
    proporcao: "story", // story 9:16 | feed 4:5 — só no card mobile
    densidade: "completo", // completo | compromissos | resumo — só no extrato A4
  },
  ui: {
    vista: "timeline", // timeline | tabela
    tabelaOrdenarPor: "data",
    tabelaOrdemAsc: true,
    tabelaPagina: 1,
    tabelaPorPagina: 15,
    sidebarAberta: false, // drawer mobile
    sidebarRecolhida: false, // colapso desktop
  },
};

const SIDEBAR_RECOLHIDA_STORAGE_KEY = "saaTcm.sidebarRecolhida";

/* ==========================================================================
   DEMO (somente para desenvolvimento local, quando USE_DEMO_DATA = true)
   ========================================================================== */

// Conjunto de demonstração — dados FICTÍCIOS, sem qualquer relação com a
// agenda real de autoridade do Tribunal. O ICS é montado em torno da data de
// hoje para que a tela sempre abra com um dia cheio: cinco compromissos, um
// cancelado, uma sobreposição real (14:00–15:30 × 15:00–16:00) e três janelas
// livres. Gerar ICS de verdade — em vez de injetar objetos prontos — mantém o
// caminho de parsing, recorrência e classificação exercitado igual à produção.
//
// Fuso fixo America/Bahia (UTC−03:00, sem horário de verão): o horário local
// é convertido para UTC somando três horas.
function icsData(deslocamentoDias, hhmm) {
  const base = new Date();
  base.setHours(0, 0, 0, 0);
  base.setDate(base.getDate() + deslocamentoDias);
  const iso = `${base.getFullYear()}-${String(base.getMonth() + 1).padStart(2, "0")}-${String(
    base.getDate()
  ).padStart(2, "0")}T${hhmm}:00-03:00`;
  return new Date(iso)
    .toISOString()
    .replace(/[-:]/g, "")
    .replace(/\.\d{3}/, "");
}

function icsDataSimples(deslocamentoDias) {
  const base = new Date();
  base.setHours(12, 0, 0, 0);
  base.setDate(base.getDate() + deslocamentoDias);
  return `${base.getFullYear()}${String(base.getMonth() + 1).padStart(2, "0")}${String(base.getDate()).padStart(2, "0")}`;
}

function veventDemo(campos) {
  const linhas = ["BEGIN:VEVENT", `UID:${campos.uid}@saa-demo.tcm.ba.gov.br`, `DTSTAMP:${icsData(-30, "12:00")}`];
  if (campos.diaInteiro) {
    linhas.push(`DTSTART;VALUE=DATE:${icsDataSimples(campos.dia)}`);
    linhas.push(`DTEND;VALUE=DATE:${icsDataSimples(campos.diaFim)}`);
  } else {
    linhas.push(`DTSTART:${icsData(campos.dia, campos.ini)}`);
    linhas.push(`DTEND:${icsData(campos.dia, campos.fim)}`);
  }
  linhas.push(`SUMMARY:${campos.titulo}`);
  if (campos.descricao) linhas.push(`DESCRIPTION:${campos.descricao}`);
  if (campos.local) linhas.push(`LOCATION:${campos.local}`);
  if (campos.categoria) linhas.push(`CATEGORIES:${campos.categoria}`);
  if (campos.url) linhas.push(`URL:${campos.url}`);
  if (campos.cancelado) linhas.push("STATUS:CANCELLED");
  (campos.participantes || []).forEach((nome, i) => {
    // Acentos viram a letra base antes do slug, senão "Ministério" produz
    // "minist.rio" no endereço fictício.
    const conta = nome
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, ".")
      .replace(/^\.|\.$/g, "");
    linhas.push(`ATTENDEE;CN=${nome}:mailto:${conta || "convidado" + i}@exemplo.tcm.ba.gov.br`);
  });
  if (campos.rrule) linhas.push(`RRULE:${campos.rrule}`);
  linhas.push("END:VEVENT");
  return linhas.join("\n");
}

function construirIcsDemo() {
  const eventos = [
    // ----- Hoje: o dia desenhado, com conflito e janelas livres -----
    {
      uid: "demo-hoje-1", dia: 0, ini: "08:00", fim: "08:45", categoria: "Presencial",
      titulo: "Audiência com o Prefeito de Ilhéus",
      local: "Gabinete da Presidência", cancelado: true,
      descricao: "Reagendada a pedido do jurisdicionado.",
      participantes: ["Gabinete"],
    },
    {
      uid: "demo-hoje-2", dia: 0, ini: "09:00", fim: "12:30", categoria: "Presencial",
      titulo: "Sessão Ordinária do Tribunal Pleno",
      local: "Plenário do TCM-BA — Av. 4, nº 495, Centro Administrativo da Bahia, Salvador",
      descricao: "Pauta: contas de governo, consultas e uniformização de jurisprudência.",
      participantes: ["Tribunal Pleno", "Ministério Público de Contas", "Corpo Técnico"],
    },
    {
      uid: "demo-hoje-3", dia: 0, ini: "14:00", fim: "15:30", categoria: "Online",
      titulo: "Reunião com a Diretoria de Assistência aos Municípios",
      local: "Microsoft Teams",
      url: "https://teams.microsoft.com/l/meetup-join/demo-saa-tcm",
      descricao: "Balanço dos atendimentos da DAM e calendário de obrigações do próximo trimestre.",
      participantes: ["DAM", "Assessoria Técnica", "Diretoria de Controle Externo"],
    },
    {
      uid: "demo-hoje-4", dia: 0, ini: "15:00", fim: "16:00", categoria: "Presencial",
      titulo: "Entrevista à Assessoria de Comunicação",
      local: "Estúdio — Ascom",
      descricao: "Pauta sobre o balanço semestral de fiscalizações.",
      participantes: ["Ascom"],
    },
    {
      uid: "demo-hoje-5", dia: 0, ini: "16:30", fim: "17:30", categoria: "Presencial",
      titulo: "Despacho com a Assessoria Jurídica",
      local: "Gabinete da Presidência",
      descricao: "Análise de recursos de reconsideração protocolados na semana.",
      participantes: ["Assessoria Jurídica"],
    },
    // ----- Próximos dias: semana e mês não abrem vazios -----
    {
      uid: "demo-amanha-1", dia: 1, ini: "09:00", fim: "12:00", categoria: "Presencial",
      titulo: "Sessão Ordinária da 2ª Câmara",
      local: "Plenário do TCM-BA — Av. 4, nº 495, Salvador",
      descricao: "Julgamento de prestações de contas de gestão do exercício anterior.",
      participantes: ["2ª Câmara", "Ministério Público de Contas"],
    },
    {
      uid: "demo-amanha-2", dia: 1, ini: "14:30", fim: "16:00", categoria: "Presencial",
      titulo: "Abertura do curso de capacitação de jurisdicionados",
      local: "Escola de Contas Conselheiro Joaquim Bahia — Auditório",
      descricao: "Módulo de licitações e contratos administrativos.",
      participantes: ["Escola de Contas", "Controladores municipais"],
    },
    {
      uid: "demo-d2-1", dia: 2, ini: "10:00", fim: "11:30", categoria: "Online",
      titulo: "Videoconferência com a Rede de Controle da Gestão Pública",
      local: "Microsoft Teams",
      url: "https://teams.microsoft.com/l/meetup-join/demo-rede-controle",
      descricao: "Alinhamento de ações conjuntas de fiscalização.",
      participantes: ["TCE-BA", "CGU", "Ministério Público Federal"],
    },
    {
      uid: "demo-d3-1", dia: 3, ini: "08:30", fim: "10:00", categoria: "Presencial",
      titulo: "Reunião do Comitê de Governança e Gestão Estratégica",
      local: "Sala de reuniões da Presidência",
      descricao: "Acompanhamento das metas do planejamento estratégico institucional.",
      participantes: ["Presidência", "Diretoria Geral", "Assessoria de Planejamento"],
    },
    {
      uid: "demo-viagem", dia: 5, diaFim: 8, diaInteiro: true, categoria: "Viagem",
      titulo: "Encontro Nacional dos Tribunais de Contas — Brasília",
      local: "Brasília — Distrito Federal",
      descricao: "Representação institucional do TCM-BA no encontro do IRB.",
      participantes: ["Presidência", "Assessoria Institucional"],
    },
    {
      uid: "demo-semanal", dia: 7, ini: "09:00", fim: "12:30", categoria: "Presencial",
      titulo: "Sessão Ordinária do Tribunal Pleno",
      local: "Plenário do TCM-BA — Av. 4, nº 495, Salvador",
      descricao: "Sessão semanal do Pleno.",
      participantes: ["Tribunal Pleno"],
      rrule: "FREQ=WEEKLY;COUNT=6",
    },
    {
      uid: "demo-mes-1", dia: 14, ini: "15:00", fim: "17:00", categoria: "Presencial",
      titulo: "Seminário de Prestação de Contas Municipais",
      local: "Escola de Contas Conselheiro Joaquim Bahia — Auditório",
      descricao: "Orientações sobre o e-TCM e o envio de dados do exercício.",
      participantes: ["Escola de Contas", "Prefeituras jurisdicionadas"],
    },
    {
      uid: "demo-mes-2", dia: 21, ini: "10:00", fim: "11:00", categoria: "Online",
      titulo: "Reunião de acompanhamento do Plano Anual de Fiscalização",
      local: "Microsoft Teams",
      url: "https://teams.microsoft.com/l/meetup-join/demo-paf",
      descricao: "Revisão do cronograma de auditorias operacionais.",
      participantes: ["Diretoria de Controle Externo"],
    },
  ];

  return [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//TCM-BA//SAA Agenda Institucional//PT-BR",
    "CALSCALE:GREGORIAN",
    ...eventos.map(veventDemo),
    "END:VCALENDAR",
  ].join("\n");
}

/* ==========================================================================
   UTILITÁRIOS DE TEXTO E DATA
   ========================================================================== */

function normalizarTexto(txt) {
  return (txt || "")
    .toString()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "");
}

function extrairPrimeiraUrl(texto) {
  if (!texto) return "";
  const match = texto.match(/https?:\/\/[^\s"'<>]+/i);
  return match ? match[0] : "";
}

function formatarDataHora(date) {
  return new Intl.DateTimeFormat("pt-BR", {
    timeZone: DISPLAY_TIMEZONE,
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

function formatarHora(date) {
  return new Intl.DateTimeFormat("pt-BR", {
    timeZone: DISPLAY_TIMEZONE,
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

function formatarDataLonga(date) {
  const texto = new Intl.DateTimeFormat("pt-BR", {
    timeZone: DISPLAY_TIMEZONE,
    weekday: "long",
    day: "2-digit",
    month: "long",
    year: "numeric",
  }).format(date);
  return texto;
}

// Chave "YYYY-MM-DD" do evento no fuso de exibição — usada para agrupar por dia.
function chaveDia(date) {
  const partes = new Intl.DateTimeFormat("en-CA", {
    timeZone: DISPLAY_TIMEZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(date);
  const obj = {};
  partes.forEach((p) => (obj[p.type] = p.value));
  return `${obj.year}-${obj.month}-${obj.day}`;
}

function inicioDoDia(date) {
  const chave = chaveDia(date);
  return new Date(`${chave}T00:00:00${offsetBahia()}`);
}

function fimDoDia(date) {
  const chave = chaveDia(date);
  return new Date(`${chave}T23:59:59.999${offsetBahia()}`);
}

// America/Bahia não observa horário de verão desde 2019: offset fixo -03:00.
function offsetBahia() {
  return "-03:00";
}

function segundaDaSemana(date) {
  const chave = chaveDia(date);
  const d = new Date(`${chave}T12:00:00${offsetBahia()}`);
  const diaSemana = d.getUTCDay(); // 0 = domingo
  const distanciaSegunda = (diaSemana + 6) % 7;
  d.setUTCDate(d.getUTCDate() - distanciaSegunda);
  return inicioDoDia(d);
}

function domingoDaSemana(date) {
  const seg = segundaDaSemana(date);
  const dom = new Date(seg);
  dom.setUTCDate(dom.getUTCDate() + 6);
  return fimDoDia(dom);
}

function inicioDoMes(date) {
  const chave = chaveDia(date);
  const [ano, mes] = chave.split("-");
  return new Date(`${ano}-${mes}-01T00:00:00${offsetBahia()}`);
}

function fimDoMes(date) {
  const inicio = inicioDoMes(date);
  const proximo = new Date(inicio);
  proximo.setUTCMonth(proximo.getUTCMonth() + 1);
  proximo.setUTCMilliseconds(proximo.getUTCMilliseconds() - 1);
  return proximo;
}

// Último instante REALMENTE ocupado por um compromisso.
//
// Em eventos de dia inteiro, o DTEND do ICS é EXCLUSIVO (RFC 5545): um evento
// que ocupa 22, 23, 24 e 25 é publicado com DTEND = dia 26 ("até, sem
// incluir, o dia 26"). Usar esse `fim` cru faz o app contar um dia a mais
// (aparece no dia 26, badge "22–26"). Aqui recuamos para o fim do dia
// anterior ao DTEND, obtendo o último dia de fato ocupado (25).
//
// Para eventos com horário, o DTEND já é o instante real de término e é
// devolvido sem ajuste.
function dataFimInclusivo(evento) {
  const fim = new Date(evento.fim);
  if (!evento.diaInteiro) return fim;

  const inicio = new Date(evento.inicio);
  // Último milissegundo do dia anterior ao DTEND, no fuso de exibição.
  const candidato = new Date(inicioDoDia(fim).getTime() - 1);
  // Nunca antes do dia de início — protege eventos de dia inteiro sem DTEND
  // ou com DTEND == DTSTART (um único dia).
  return candidato.getTime() < inicio.getTime() ? inicio : candidato;
}

/* ==========================================================================
   CLASSIFICAÇÃO AUTOMÁTICA
   ========================================================================== */

const PALAVRAS_VIAGEM = [
  "viagem", "voo", "aeroporto", "hotel", "embarque", "desembarque",
  "deslocamento", "passagem aerea", "passagem",
];

// Cidades que caracterizam deslocamento. Salvador NÃO entra: é a sede do
// Tribunal, então um endereço em Salvador é compromisso local, não viagem —
// listá-la fazia toda reunião no próprio município ser marcada como viagem
// (ex.: "Apresentação SEI" na Secretaria de Saúde, no Centro Administrativo,
// vinha classificada como deslocamento).
const CIDADES_REFERENCIA = [
  "brasilia", "sao paulo", "rio de janeiro", "feira de santana",
  "vitoria da conquista", "ilheus", "porto seguro", "juazeiro",
  "barreiras", "itabuna", "camacari", "belo horizonte", "recife",
  "fortaleza", "curitiba", "porto alegre", "goiania", "manaus", "belem",
];

const PALAVRAS_ONLINE = [
  "online", "virtual", "teams", "microsoft teams", "google meet",
  "meet", "zoom", "videoconferencia", "webex",
];

const PALAVRAS_PRESENCIAL = [
  "presencial", "forum", "tribunal", "audiencia", "escritorio",
  "sala", "secretaria", "auditorio",
];

const REGEX_LINK_REUNIAO = /https?:\/\/(teams\.microsoft\.com|meet\.google\.com|zoom\.us|webex\.com)/i;

function escapeRegex(str) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

// Correspondência por palavra/frase inteira (com \b), não por substring solta.
// Evita falsos positivos como "aula" dentro de "Paula" ou "sala" dentro de
// outra palavra maior.
function contemPalavraChave(texto, palavra) {
  const regex = new RegExp("\\b" + escapeRegex(palavra) + "\\b", "i");
  return regex.test(texto);
}

function contemAlgumaPalavra(texto, lista) {
  return lista.some((p) => contemPalavraChave(texto, p));
}

// Rubrica declarada em CATEGORIES no próprio evento do calendário, mapeada
// para as categorias da tela. Aceita as variantes usadas na prática pelo
// gabinete ("Presencial", "Pauta presencial", "Reunião online"...).
const CATEGORIA_ICS_EXPLICITA = {
  presencial: "pauta-presencial",
  "pauta presencial": "pauta-presencial",
  "reuniao presencial": "pauta-presencial",
  online: "pauta-online",
  "pauta online": "pauta-online",
  "reuniao online": "pauta-online",
  remoto: "pauta-online",
  viagem: "viagem",
  deslocamento: "viagem",
};

function categoriaDeclarada(evento) {
  const declaradas = evento.categoriasIcs || [];
  for (const bruta of declaradas) {
    const chave = normalizarTexto(bruta).trim();
    if (CATEGORIA_ICS_EXPLICITA[chave]) return CATEGORIA_ICS_EXPLICITA[chave];
  }
  return null;
}

function classificarEvento(evento) {
  // Rubrica explícita do calendário vence a heurística: "Audiência com o
  // Prefeito de Ilhéus" marcada como Presencial é uma audiência no gabinete,
  // não uma viagem a Ilhéus.
  const declarada = categoriaDeclarada(evento);
  if (declarada) return declarada;

  const textoCompleto = normalizarTexto(
    [
      evento.titulo,
      evento.descricao,
      evento.local,
      evento.link,
      (evento.categoriasIcs || []).join(" "),
    ].join(" ")
  );

  // Nomes de cidade só são considerados em título/local: a descrição de
  // reuniões frequentemente carrega rodapés/assinaturas de e-mail que citam
  // cidades (ex.: endereço institucional do organizador) sem relação alguma
  // com deslocamento, o que geraria falsos positivos de "viagem".
  const textoCidade = normalizarTexto([evento.titulo, evento.local].join(" "));

  const temViagem =
    contemAlgumaPalavra(textoCompleto, PALAVRAS_VIAGEM) ||
    contemAlgumaPalavra(textoCidade, CIDADES_REFERENCIA);
  if (temViagem) return "viagem";

  const temLinkReuniao = REGEX_LINK_REUNIAO.test(evento.link || "");
  if (contemAlgumaPalavra(textoCompleto, PALAVRAS_ONLINE) || temLinkReuniao) {
    return "pauta-online";
  }

  if (contemAlgumaPalavra(textoCompleto, PALAVRAS_PRESENCIAL)) return "pauta-presencial";

  // Sem link de reunião e sem palavras-chave identificáveis: assume presencial.
  return "pauta-presencial";
}

/* ==========================================================================
   PARSING ICS (ical.js) — VEVENT, RRULE, EXDATE, RECURRENCE-ID, VTIMEZONE
   ========================================================================== */

function mapStatus(raw) {
  switch ((raw || "").toUpperCase()) {
    case "CANCELLED":
      return "cancelado";
    case "TENTATIVE":
      return "tentativo";
    case "CONFIRMED":
    default:
      return "confirmado";
  }
}

function lerCategoriasIcs(icalEvent) {
  try {
    const prop = icalEvent.component.getFirstProperty("categories");
    if (!prop) return [];
    const valor = icalEvent.component.getFirstPropertyValue("categories");
    return valor
      ? valor
          .toString()
          .split(",")
          .map((c) => c.trim())
          .filter(Boolean)
      : [];
  } catch (e) {
    return [];
  }
}

function lerUrl(icalEvent, descricao, local) {
  try {
    const valor = icalEvent.component.getFirstPropertyValue("url");
    if (valor) return String(valor);
  } catch (e) {
    /* ignora */
  }
  return extrairPrimeiraUrl(descricao) || extrairPrimeiraUrl(local) || "";
}

// Lê os participantes (ATTENDEE) e o organizador (ORGANIZER) do evento.
// Prioriza o nome amigável (parâmetro CN); na ausência, usa a parte local do
// e-mail (antes do @). O feed iCal do Google só traz ATTENDEE/ORGANIZER em
// compromissos que têm convidados — nos demais a lista volta vazia e a
// interface simplesmente não mostra a linha de participantes.
function lerParticipantes(icalEvent) {
  const nomes = [];
  const vistos = new Set();

  function nomeDe(prop) {
    if (!prop) return "";
    let cn = "";
    try {
      cn = prop.getParameter("cn") || "";
    } catch (e) {
      /* ignora */
    }
    if (cn) return String(cn).trim();
    // Sem CN: extrai a parte local de "mailto:fulano@dominio".
    let valor = "";
    try {
      valor = String(prop.getFirstValue() || "");
    } catch (e) {
      valor = "";
    }
    const semMailto = valor.replace(/^mailto:/i, "");
    const local = semMailto.split("@")[0];
    return local ? local.replace(/[._]+/g, " ").trim() : "";
  }

  function adicionar(nome) {
    const limpo = (nome || "").trim();
    if (!limpo) return;
    const chave = normalizarTexto(limpo);
    if (vistos.has(chave)) return;
    vistos.add(chave);
    nomes.push(limpo);
  }

  try {
    const organizador = icalEvent.component.getFirstProperty("organizer");
    adicionar(nomeDe(organizador));
  } catch (e) {
    /* ignora */
  }

  try {
    icalEvent.component.getAllProperties("attendee").forEach((prop) => adicionar(nomeDe(prop)));
  } catch (e) {
    /* ignora */
  }

  return nomes;
}

function construirOcorrencia(icalEvent, startTime, endTime, recorrente) {
  const diaInteiro = !!startTime.isDate;
  const inicioJS = startTime.toJSDate();
  const fimJS = endTime ? endTime.toJSDate() : inicioJS;

  const titulo = icalEvent.summary || "(Sem título)";
  const descricao = icalEvent.description || "";
  const local = icalEvent.location || "";
  const link = lerUrl(icalEvent, descricao, local);
  const participantes = lerParticipantes(icalEvent);

  let statusRaw = "";
  try {
    statusRaw = icalEvent.component.getFirstPropertyValue("status") || "";
  } catch (e) {
    /* ignora */
  }

  const categoriasIcs = lerCategoriasIcs(icalEvent);

  const idBase = icalEvent.uid || Math.random().toString(36).slice(2);
  const id = recorrente ? `${idBase}::${startTime.toString()}` : idBase;

  const evento = {
    id,
    titulo,
    descricao,
    inicio: inicioJS.toISOString(),
    fim: fimJS.toISOString(),
    diaInteiro,
    local,
    link,
    participantes,
    categoria: null,
    categoriasIcs,
    status: mapStatus(statusRaw),
    recorrente: !!recorrente,
  };

  evento.categoria = classificarEvento(evento);
  // Cancelamento real (STATUS:CANCELLED) ou "manual" — muitos organizadores
  // apenas prefixam o título ("Cancelado: ...", "Evento cancelado...") sem
  // atualizar o STATUS do ICS, então o título também é considerado.
  evento.cancelado =
    evento.status === "cancelado" ||
    contemAlgumaPalavra(normalizarTexto(titulo), ["cancelado", "cancelada"]);
  return evento;
}

function parseICSParaEventos(icsTexto) {
  const jcalData = ICAL.parse(icsTexto);
  const comp = new ICAL.Component(jcalData);

  // Registra os fusos horários (VTIMEZONE) definidos no calendário para que
  // ICAL.Time resolva corretamente horários locais antes de converter para UTC.
  comp.getAllSubcomponents("vtimezone").forEach((vt) => {
    try {
      ICAL.TimezoneService.register(vt);
    } catch (e) {
      console.warn("Falha ao registrar VTIMEZONE:", e);
    }
  });

  const veventComponents = comp.getAllSubcomponents("vevent");
  const todosEventos = veventComponents.map((vc) => new ICAL.Event(vc));

  // Separa eventos "mestre" de exceções (RECURRENCE-ID) e religa cada
  // exceção ao seu mestre via relateException — isso faz o iterator()
  // aplicar automaticamente os overrides (inclusive cancelamentos pontuais).
  const mestres = new Map();
  const excecoesOrfas = [];

  todosEventos.forEach((ev) => {
    if (ev.isRecurrenceException()) {
      return;
    }
    mestres.set(ev.uid, ev);
  });

  todosEventos.forEach((ev) => {
    if (!ev.isRecurrenceException()) return;
    const mestre = mestres.get(ev.uid);
    if (mestre) {
      try {
        mestre.relateException(ev.component);
      } catch (e) {
        console.warn("Falha ao relacionar exceção de recorrência:", e);
        excecoesOrfas.push(ev);
      }
    } else {
      excecoesOrfas.push(ev);
    }
  });

  const agora = new Date();
  const janelaInicio = new Date(agora);
  janelaInicio.setMonth(janelaInicio.getMonth() - JANELA_MESES_PASSADO);
  const janelaFim = new Date(agora);
  janelaFim.setMonth(janelaFim.getMonth() + JANELA_MESES_FUTURO);

  const ocorrencias = [];

  mestres.forEach((event) => {
    if (event.isRecurring()) {
      const iterator = event.iterator();
      let next;
      let contagem = 0;
      // eslint-disable-next-line no-cond-assign
      while ((next = iterator.next()) && contagem < MAX_OCORRENCIAS_POR_EVENTO) {
        contagem++;
        const dataOcorrencia = next.toJSDate();
        if (dataOcorrencia > janelaFim) break;
        if (dataOcorrencia < janelaInicio) continue;

        const detalhes = event.getOccurrenceDetails(next);
        ocorrencias.push(
          construirOcorrencia(detalhes.item, detalhes.startDate, detalhes.endDate, true)
        );
      }
    } else {
      const inicioJS = event.startDate.toJSDate();
      const fimJS = (event.endDate || event.startDate).toJSDate();
      if (fimJS >= janelaInicio && inicioJS <= janelaFim) {
        ocorrencias.push(construirOcorrencia(event, event.startDate, event.endDate, false));
      }
    }
  });

  excecoesOrfas.forEach((ev) => {
    const inicioJS = ev.startDate.toJSDate();
    const fimJS = (ev.endDate || ev.startDate).toJSDate();
    if (fimJS >= janelaInicio && inicioJS <= janelaFim) {
      ocorrencias.push(construirOcorrencia(ev, ev.startDate, ev.endDate, true));
    }
  });

  ocorrencias.sort((a, b) => new Date(a.inicio) - new Date(b.inicio));
  return ocorrencias;
}

/* ==========================================================================
   BUSCA DOS DADOS (fetch direto → fallback via proxy) + CACHE LOCAL
   ========================================================================== */

async function buscarIcsTexto() {
  if (USE_DEMO_DATA) {
    return construirIcsDemo();
  }

  // Só tenta o fetch direto quando há uma URL configurada no cliente; caso
  // contrário vai direto ao endpoint intermediário.
  if (CALENDAR_ICS_URL) {
    try {
      const resposta = await fetch(CALENDAR_ICS_URL, { mode: "cors", cache: "no-store" });
      if (!resposta.ok) throw new Error("HTTP " + resposta.status);
      return await resposta.text();
    } catch (erroDireto) {
      console.warn("Fetch direto ao calendário falhou (provável bloqueio de CORS):", erroDireto);
    }
  }

  const respostaProxy = await fetch(CALENDAR_API_URL, { cache: "no-store" });
  if (!respostaProxy.ok) {
    // O proxy responde erro como JSON {"erro": "..."} com uma mensagem que
    // diz exatamente o que falta (variável de ambiente ausente, calendário
    // fora do ar). Descartá-la e mostrar só "HTTP 500" transforma um
    // problema de configuração de dois minutos em uma investigação.
    throw new Error(await mensagemDeErroDoProxy(respostaProxy));
  }
  return await respostaProxy.text();
}

// Extrai a mensagem do corpo de erro do proxy, caindo para o código HTTP
// quando o corpo não é o JSON esperado (ex.: página de erro da hospedagem).
async function mensagemDeErroDoProxy(resposta) {
  const generico = "HTTP " + resposta.status + " ao buscar via " + CALENDAR_API_URL;
  try {
    const corpo = await resposta.text();
    if (!corpo) return generico;
    const dados = JSON.parse(corpo);
    return dados && dados.erro ? dados.erro : generico;
  } catch (e) {
    return generico;
  }
}

function salvarCache(eventos) {
  try {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ savedAt: new Date().toISOString(), events: eventos })
    );
  } catch (e) {
    console.warn("Não foi possível salvar o cache local:", e);
  }
}

function carregarCache() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!parsed || !Array.isArray(parsed.events)) return null;
    return parsed;
  } catch (e) {
    return null;
  }
}

/* ==========================================================================
   CONFLITOS, STATUS DE TEMPO (em andamento / concluído)
   ========================================================================== */

function marcarConflitos(eventos) {
  eventos.forEach((e) => (e.conflito = false));

  const comHorario = eventos.filter((e) => !e.diaInteiro);
  const porDia = new Map();
  comHorario.forEach((e) => {
    const chave = chaveDia(new Date(e.inicio));
    if (!porDia.has(chave)) porDia.set(chave, []);
    porDia.get(chave).push(e);
  });

  porDia.forEach((lista) => {
    lista.sort((a, b) => new Date(a.inicio) - new Date(b.inicio));
    for (let i = 0; i < lista.length; i++) {
      for (let j = i + 1; j < lista.length; j++) {
        const a = lista[i];
        const b = lista[j];
        const inicioA = new Date(a.inicio).getTime();
        const fimA = new Date(a.fim).getTime();
        const inicioB = new Date(b.inicio).getTime();
        if (inicioB >= fimA) break;
        if (inicioB < fimA && inicioA < new Date(b.fim).getTime()) {
          a.conflito = true;
          b.conflito = true;
        }
      }
    }
  });
}

function situacaoTemporal(evento) {
  const agora = Date.now();
  const inicio = new Date(evento.inicio).getTime();
  const fim = new Date(evento.fim).getTime();
  if (fim < agora) return "concluido";
  if (inicio <= agora && agora <= fim) return "andamento";
  return "futuro";
}

/* ==========================================================================
   FILTROS
   ========================================================================== */

// Intervalo [início, fim] correspondente ao período selecionado, ou null
// para "todos" (sem restrição). Centralizado aqui para ser reaproveitado
// tanto na decisão de inclusão do evento quanto no recorte dos dias
// exibidos de compromissos de vários dias (ver agruparPorDia).
function janelaDoPeriodo(periodo) {
  if (periodo === "todos") return null;

  const agora = new Date();
  if (periodo === "dia") return { inicio: inicioDoDia(agora), fim: fimDoDia(agora) };
  if (periodo === "semana") return { inicio: segundaDaSemana(agora), fim: domingoDaSemana(agora) };
  if (periodo === "mes") return { inicio: inicioDoMes(agora), fim: fimDoMes(agora) };
  return null;
}

function eventoNoPeriodo(evento, periodo) {
  const janela = janelaDoPeriodo(periodo);
  if (!janela) return true;

  const inicioEvento = new Date(evento.inicio).getTime();
  const fimEvento = dataFimInclusivo(evento).getTime();

  // Interseção de intervalos — cobre eventos que atravessam mais de um dia.
  return inicioEvento <= janela.fim.getTime() && fimEvento >= janela.inicio.getTime();
}

// Um intervalo de datas explícito vence o filtro de período. Os dois controles
// recortam a mesma coisa — uma janela de tempo — e aplicá-los em conjunto
// produzia lista vazia sempre que a data escolhida não caísse dentro do
// período marcado. O caso comum era escolher outro dia com "Hoje" ainda
// ativo: a interseção das duas janelas nunca existia, e a tela respondia
// "Nenhum compromisso encontrado" para um dia que tinha compromissos.
function filtroDeDataAtivo() {
  return Boolean(state.filtros.dataInicio || state.filtros.dataFim);
}

function eventoNoIntervaloDeData(evento, dataInicio, dataFim) {
  if (!dataInicio && !dataFim) return true;

  const inicioEvento = new Date(evento.inicio).getTime();
  const fimEvento = dataFimInclusivo(evento).getTime();

  const inicioFiltro = dataInicio
    ? new Date(`${dataInicio}T00:00:00${offsetBahia()}`).getTime()
    : -Infinity;
  const fimFiltro = dataFim
    ? new Date(`${dataFim}T23:59:59.999${offsetBahia()}`).getTime()
    : Infinity;

  return inicioEvento <= fimFiltro && fimEvento >= inicioFiltro;
}

// Verifica se o evento passa no termo de busca (título, descrição, local e
// participantes). Termo vazio passa sempre.
function passaBusca(evento) {
  const buscaNormalizada = normalizarTexto(state.filtros.busca);
  if (!buscaNormalizada) return true;
  const alvo = normalizarTexto(
    `${evento.titulo} ${evento.descricao} ${evento.local} ${(evento.participantes || []).join(" ")}`
  );
  return alvo.includes(buscaNormalizada);
}

function obterEventosFiltrados() {
  const { periodo, categorias, mostrarConcluidos, dataInicio, dataFim } = state.filtros;

  return state.eventos.filter((evento) => {
    // Nenhuma categoria marcada = nenhum filtro de categoria ativo (mostra tudo).
    if (categorias.size > 0 && !categorias.has(evento.categoria)) return false;
    if (!filtroDeDataAtivo() && !eventoNoPeriodo(evento, periodo)) return false;
    if (!eventoNoIntervaloDeData(evento, dataInicio, dataFim)) return false;
    if (!mostrarConcluidos && situacaoTemporal(evento) === "concluido") return false;
    if (!passaBusca(evento)) return false;
    return true;
  });
}

/* ==========================================================================
   RENDERIZAÇÃO
   ========================================================================== */

const CATEGORIA_LABEL = {
  viagem: "Viagem",
  "pauta-online": "Online",
  "pauta-presencial": "Presencial",
};

// Todas as chaves "YYYY-MM-DD" que um compromisso atravessa (do dia de
// início ao dia de fim, inclusive). Compromissos de um único dia retornam
// apenas uma chave — usado para que compromissos de vários dias (viagens,
// cursos de vários dias etc.) apareçam na agenda de cada dia que ocupam, não
// somente no dia em que começam.
const LIMITE_DIAS_ABRANGIDOS = 90; // proteção contra datas malformadas no ICS

function diasQueEventoAbrange(evento) {
  const inicioChave = chaveDia(new Date(evento.inicio));
  const fimChave = chaveDia(dataFimInclusivo(evento));
  if (inicioChave === fimChave) return [inicioChave];

  const dias = [];
  let cursor = inicioDoDia(new Date(evento.inicio));
  const fimCursor = inicioDoDia(dataFimInclusivo(evento)).getTime();
  let contador = 0;
  while (cursor.getTime() <= fimCursor && contador < LIMITE_DIAS_ABRANGIDOS) {
    dias.push(chaveDia(cursor));
    const proximo = new Date(cursor);
    proximo.setUTCDate(proximo.getUTCDate() + 1);
    cursor = proximo;
    contador++;
  }
  return dias;
}

function eventoEhContinuo(evento) {
  return chaveDia(new Date(evento.inicio)) !== chaveDia(dataFimInclusivo(evento));
}

// Janela de dias atualmente visível na tela (interseção do período
// selecionado com o filtro manual de datas "De"/"Até"), como chaves
// "YYYY-MM-DD". Retorna null nos limites em que não há restrição (ex.:
// período "Todos" sem filtro de data manual). Usada para recortar quais
// dias de um compromisso de vários dias devem ser exibidos — sem isso, um
// compromisso que só passa perto do período filtrado (ex.: começa antes do
// intervalo "De"/"Até" escolhido) reapareceria em dias fora do filtro.
function janelaDeExibicaoAtual() {
  const { periodo, dataInicio, dataFim } = state.filtros;
  const janelaPeriodo = filtroDeDataAtivo() ? null : janelaDoPeriodo(periodo);

  let inicioChave = janelaPeriodo ? chaveDia(janelaPeriodo.inicio) : null;
  let fimChave = janelaPeriodo ? chaveDia(janelaPeriodo.fim) : null;

  if (dataInicio && (!inicioChave || dataInicio > inicioChave)) inicioChave = dataInicio;
  if (dataFim && (!fimChave || dataFim < fimChave)) fimChave = dataFim;

  return { inicioChave, fimChave };
}

function agruparPorDia(eventos) {
  const { inicioChave, fimChave } = janelaDeExibicaoAtual();
  const grupos = new Map();
  eventos.forEach((evento) => {
    diasQueEventoAbrange(evento)
      .filter((chave) => (!inicioChave || chave >= inicioChave) && (!fimChave || chave <= fimChave))
      .forEach((chave) => {
        if (!grupos.has(chave)) grupos.set(chave, []);
        grupos.get(chave).push({ evento, diaChave: chave });
      });
  });

  return Array.from(grupos.entries())
    .sort((a, b) => (a[0] < b[0] ? -1 : 1))
    .map(([chave, lista]) => ({
      chave,
      rotulo: formatarDataLonga(new Date(`${chave}T12:00:00${offsetBahia()}`)),
      eventos: lista.sort((a, b) => new Date(a.evento.inicio) - new Date(b.evento.inicio)),
    }));
}

function duracaoLegivel(evento) {
  const ms = new Date(evento.fim) - new Date(evento.inicio);
  const minutos = Math.round(ms / 60000);
  if (evento.diaInteiro) {
    const dias = Math.max(1, Math.round(ms / (24 * 60 * 60 * 1000)));
    return dias > 1 ? `${dias} dias` : "dia inteiro";
  }
  if (minutos < 60) return `${minutos} min`;
  const horas = Math.floor(minutos / 60);
  const resto = minutos % 60;
  return resto ? `${horas}h${String(resto).padStart(2, "0")}` : `${horas}h`;
}

function formatarDataCurta(date) {
  return new Intl.DateTimeFormat("pt-BR", {
    timeZone: DISPLAY_TIMEZONE,
    day: "2-digit",
    month: "2-digit",
  }).format(date);
}

// Resumo curto da lista de participantes: até 2 nomes por extenso; a partir
// de 3, mostra os dois primeiros e "+N".
function participantesResumo(evento) {
  const p = evento.participantes || [];
  if (p.length === 0) return "";
  if (p.length <= 2) return p.join(", ");
  return `${p[0]}, ${p[1]} +${p.length - 2}`;
}

// Horário exibido no bloco de tempo do cartão (linha do tempo), ajustado ao
// dia específico dentro do intervalo — nos dias intermediários e no dia
// final de um compromisso de vários dias, o horário "bruto" de início/fim
// do evento não faz sentido isolado, então cada dia mostra a informação
// relevante para si.
function tempoCartaoPorDia(evento, diaChave) {
  if (evento.diaInteiro) {
    return { horaInicio: "Dia inteiro", horaFim: duracaoLegivel(evento) };
  }
  if (!eventoEhContinuo(evento)) {
    return {
      horaInicio: formatarHora(new Date(evento.inicio)),
      horaFim: `até ${formatarHora(new Date(evento.fim))}`,
    };
  }

  const diaInicioChave = chaveDia(new Date(evento.inicio));
  const diaFimChave = chaveDia(new Date(evento.fim));
  if (diaChave === diaInicioChave) {
    return { horaInicio: formatarHora(new Date(evento.inicio)), horaFim: "continua no(s) dia(s) seguinte(s)" };
  }
  if (diaChave === diaFimChave) {
    return { horaInicio: "Continuação", horaFim: `até ${formatarHora(new Date(evento.fim))}` };
  }
  return { horaInicio: "Dia inteiro", horaFim: "compromisso contínuo" };
}

// Equivalente resumido em uma linha só, usado nas exportações (PDF/JPEG/texto).
function horarioResumoPorDia(evento, diaChave) {
  if (evento.diaInteiro) return "Dia inteiro";
  if (!eventoEhContinuo(evento)) {
    return `${formatarHora(new Date(evento.inicio))} – ${formatarHora(new Date(evento.fim))}`;
  }

  const diaInicioChave = chaveDia(new Date(evento.inicio));
  const diaFimChave = chaveDia(new Date(evento.fim));
  if (diaChave === diaInicioChave) return `A partir das ${formatarHora(new Date(evento.inicio))}`;
  if (diaChave === diaFimChave) return `Até às ${formatarHora(new Date(evento.fim))}`;
  return "Dia inteiro (contínuo)";
}

function criarCardElemento(evento, diaChave) {
  const situacao = situacaoTemporal(evento);
  const card = document.createElement("article");
  card.className = `card card--${evento.categoria}`;
  card.dataset.eventoId = evento.id;
  if (situacao === "andamento") card.classList.add("card--em-andamento");
  if (situacao === "concluido") card.classList.add("card--concluido");
  if (evento.cancelado) card.classList.add("card--cancelado");
  if (evento.conflito && situacao !== "concluido") card.classList.add("card--conflito");

  const continuo = eventoEhContinuo(evento);
  const { horaInicio, horaFim } = tempoCartaoPorDia(evento, diaChave);

  const badges = [];
  if (situacao === "andamento") badges.push(`<span class="badge badge--agora">Em andamento</span>`);
  badges.push(`<span class="badge badge--${evento.categoria}">${CATEGORIA_LABEL[evento.categoria]}</span>`);
  if (continuo) {
    badges.push(
      `<span class="badge badge--continuo">${formatarDataCurta(new Date(evento.inicio))}–${formatarDataCurta(dataFimInclusivo(evento))}</span>`
    );
  }
  if (evento.recorrente) badges.push(`<span class="badge badge--recorrente">Recorrente</span>`);
  if (situacao === "concluido") badges.push(`<span class="badge badge--concluido">Concluído</span>`);
  if (evento.conflito && situacao !== "concluido") {
    badges.push(`<span class="badge badge--conflito">⚠ Sobreposição</span>`);
  }

  const resumoPart = participantesResumo(evento);

  card.innerHTML = `
    ${evento.cancelado ? `<div class="card__banner-cancelado">⚠ Compromisso cancelado</div>` : ""}
    <div class="card__linha">
      <div class="card__tempo">
        <span class="card__hora-inicio">${horaInicio}</span>
        <span class="card__hora-fim">${horaFim}</span>
        <span class="card__duracao">${duracaoLegivel(evento)}</span>
      </div>
      <div class="card__conteudo">
        <div class="card__titulo-linha">
          <h3 class="card__titulo">${escapeHtml(evento.titulo)}</h3>
          <span class="card__badges">${badges.join("")}</span>
        </div>
        <div class="card__meta">
          ${evento.local ? `<span>${ICONE_LOCAL}${escapeHtml(evento.local)}</span>` : ""}
          ${resumoPart ? `<span>${ICONE_PESSOAS}${escapeHtml(resumoPart)}</span>` : ""}
        </div>
        ${evento.descricao ? `<p class="card__descricao">${escapeHtml(evento.descricao)}</p>` : ""}
        <div class="card__rodape">
          ${evento.link ? `<a class="card__link" href="${escapeAttr(evento.link)}" target="_blank" rel="noopener">${ICONE_LINK}Entrar na reunião</a>` : ""}
          <button class="card__detalhes-btn" type="button" data-abrir-detalhes="${escapeAttr(evento.id)}">Ver detalhes</button>
        </div>
      </div>
    </div>
  `;

  return card;
}

function escapeHtml(str) {
  return (str || "")
    .toString()
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function escapeAttr(str) {
  return escapeHtml(str).replace(/"/g, "&quot;");
}

function preencherTimeline(filtrados) {
  const container = document.getElementById("timeline");
  const vazio = document.getElementById("timeline-vazio");

  container.innerHTML = "";

  if (filtrados.length === 0) {
    vazio.hidden = false;
    return;
  }
  vazio.hidden = true;

  const grupos = agruparPorDia(filtrados);
  grupos.forEach((grupo) => {
    const grupoEl = document.createElement("div");
    grupoEl.className = "timeline__grupo";

    const dataEl = document.createElement("div");
    dataEl.className = "timeline__data";
    dataEl.textContent = grupo.rotulo;
    grupoEl.appendChild(dataEl);

    const listaEl = document.createElement("div");
    listaEl.className = "timeline__lista";
    grupo.eventos.forEach(({ evento, diaChave }) => listaEl.appendChild(criarCardElemento(evento, diaChave)));
    grupoEl.appendChild(listaEl);

    container.appendChild(grupoEl);
  });
}

// Placeholders animados exibidos apenas na primeira carga (sem cache local
// disponível ainda) para reduzir a sensação de espera enquanto o ICS é buscado.
function mostrarEsqueletos(quantidade) {
  const container = document.getElementById("timeline");
  const vazio = document.getElementById("timeline-vazio");
  vazio.hidden = true;
  container.innerHTML = "";

  for (let i = 0; i < quantidade; i++) {
    const card = document.createElement("div");
    card.className = "skeleton-card";
    card.innerHTML = `
      <div class="skeleton-linha skeleton-card__tempo"></div>
      <div class="skeleton-card__conteudo">
        <div class="skeleton-linha skeleton-card__titulo"></div>
        <div class="skeleton-linha skeleton-card__meta"></div>
        <div class="skeleton-linha skeleton-card__descricao"></div>
      </div>
    `;
    container.appendChild(card);
  }
}

/* ==========================================================================
   AGENDA DO DIA — ANÁLISE DERIVADA (ocupação, janelas livres, sobreposições)

   Tudo o que a tela mostra em número — quantos compromissos ainda faltam,
   ocupação sobre a jornada útil, total livre, sobreposições — é derivado
   desta análise em tempo de render. Nenhum desses valores está escrito à mão
   em lugar nenhum, e a exportação em PDF e o card JPEG leem exatamente a
   mesma função que a tela.
   ========================================================================== */

// Jornada útil de referência para ocupação e janelas livres.
const JORNADA_INI = 8 * 60; // 08:00
const JORNADA_FIM = 18 * 60; // 18:00

// Faixa mínima desenhada na pista; estende-se conforme os compromissos do dia.
const PISTA_INI_PADRAO = 7 * 60 + 30; // 07:30
const PISTA_FIM_PADRAO = 18 * 60 + 30; // 18:30

// Escala real: 96px por hora. Um compromisso de 3h30 ocupa três vezes e meia
// a altura de um de 1h — é o que separa uma linha do tempo de uma lista.
const PISTA_PX_HORA = 96;

// Vão mínimo para que um intervalo vazio valha ser anunciado como janela.
const JANELA_MINIMA_MIN = 30;

function minutosDoDia(date) {
  const [h, m] = formatarHora(date).split(":").map(Number);
  return h * 60 + m;
}

function hhmmDeMinutos(min) {
  const m = ((min % 1440) + 1440) % 1440;
  return `${String(Math.floor(m / 60)).padStart(2, "0")}:${String(m % 60).padStart(2, "0")}`;
}

// "3h30", "45 min", "2h" — sempre em monoespaçada na tela.
function duracaoCurta(minutos) {
  const total = Math.max(0, Math.round(minutos));
  const h = Math.floor(total / 60);
  const r = total % 60;
  if (h && r) return `${h}h${String(r).padStart(2, "0")}`;
  if (h) return `${h}h`;
  return `${r} min`;
}

// Une intervalos [ini, fim] que se tocam ou se sobrepõem.
function unirIntervalos(intervalos) {
  const ordenados = intervalos.slice().sort((a, b) => a[0] - b[0]);
  const unidos = [];
  ordenados.forEach((iv) => {
    const ultimo = unidos[unidos.length - 1];
    if (ultimo && iv[0] <= ultimo[1]) ultimo[1] = Math.max(ultimo[1], iv[1]);
    else unidos.push(iv.slice());
  });
  return unidos;
}

// Chave "YYYY-MM-DD" quando a janela de exibição cobre um único dia; null
// caso contrário. Só nesse caso a pista em escala real e o resumo do dia
// fazem sentido — em uma semana inteira a régua de horas não tem significado.
function diaUnicoVisivel() {
  const { inicioChave, fimChave } = janelaDeExibicaoAtual();
  if (inicioChave && fimChave && inicioChave === fimChave) return inicioChave;
  return null;
}

// Recorte de um compromisso dentro de um dia específico, em minutos desde a
// meia-noite. Compromissos que atravessam a virada do dia são cortados nas
// bordas, para que a pista não tente desenhar um bloco de altura negativa.
function recorteNoDia(evento, diaChave) {
  const inicio = new Date(evento.inicio);
  const fim = new Date(evento.fim);
  const chaveInicio = chaveDia(inicio);
  const chaveFim = chaveDia(fim);
  const ini = chaveInicio === diaChave ? minutosDoDia(inicio) : 0;
  const fimMin = chaveFim === diaChave ? minutosDoDia(fim) : 1440;
  return { ini, fim: Math.max(fimMin, ini + 5) };
}

/**
 * Análise completa de um dia da agenda.
 *
 * @param {Array<{evento: Object, diaChave: string}>} itens compromissos já
 *        filtrados e recortados para o dia.
 * @param {string} diaChave dia analisado, "YYYY-MM-DD".
 */
function analisarDia(itens, diaChave) {
  const blocos = [];
  const contínuos = [];

  itens.forEach((item) => {
    const { evento } = item;
    if (evento.diaInteiro) {
      contínuos.push(item);
      return;
    }
    const { ini, fim } = recorteNoDia(evento, diaChave);
    blocos.push({ ...item, ini, fim, dur: fim - ini });
  });

  blocos.sort((a, b) => a.ini - b.ini || a.fim - b.fim);

  // --- Sobreposições: agrupa em clusters e divide a pista em colunas -------
  const ativos = blocos.filter((b) => !b.evento.cancelado);
  const colunaDe = new Map();
  let cluster = [];
  let limite = -1;
  const fecharCluster = () => {
    cluster.forEach((b, i) => colunaDe.set(b.evento.id, { col: i, total: cluster.length }));
    cluster = [];
  };
  ativos.forEach((b) => {
    if (cluster.length && b.ini >= limite) fecharCluster();
    cluster.push(b);
    limite = Math.max(limite, b.fim);
  });
  fecharCluster();

  const idsConflito = new Set();
  const paresConflito = [];
  for (let i = 0; i < ativos.length; i++) {
    for (let j = i + 1; j < ativos.length; j++) {
      if (ativos[j].ini < ativos[i].fim && ativos[i].ini < ativos[j].fim) {
        paresConflito.push([ativos[i], ativos[j]]);
        idsConflito.add(ativos[i].evento.id);
        idsConflito.add(ativos[j].evento.id);
      }
    }
  }

  // --- Ocupação sobre a jornada útil --------------------------------------
  const ocupadoMin = unirIntervalos(ativos.map((b) => [b.ini, b.fim])).reduce(
    (acc, iv) => acc + Math.max(0, Math.min(iv[1], JORNADA_FIM) - Math.max(iv[0], JORNADA_INI)),
    0
  );

  // --- Janelas livres: o que sobra depois de tudo que está em tela --------
  // (inclui os cancelados exibidos: com o cancelado à vista, o vão dele não
  // é uma janela livre nova — é o horário do compromisso que caiu.)
  const ocupacaoVisivel = unirIntervalos(blocos.map((b) => [b.ini, b.fim]));
  const janelas = [];
  let cursor = JORNADA_INI;
  ocupacaoVisivel.forEach((iv) => {
    if (iv[0] - cursor >= JANELA_MINIMA_MIN) janelas.push([cursor, iv[0]]);
    cursor = Math.max(cursor, iv[1]);
  });
  if (JORNADA_FIM - cursor >= JANELA_MINIMA_MIN) janelas.push([cursor, JORNADA_FIM]);
  const livreMin = janelas.reduce((acc, j) => acc + (j[1] - j[0]), 0);

  // --- Agora / a seguir ---------------------------------------------------
  const agora = new Date();
  const ehHoje = chaveDia(agora) === diaChave;
  const minutosAgora = ehHoje ? minutosDoDia(agora) : null;

  let emAndamento = null;
  let proximo = null;
  if (ehHoje) {
    emAndamento = ativos.find((b) => b.ini <= minutosAgora && minutosAgora < b.fim) || null;
    proximo = ativos.find((b) => b.ini > minutosAgora) || null;
  } else {
    proximo = ativos[0] || null;
  }
  const restam = ehHoje
    ? ativos.filter((b) => b.fim > minutosAgora).length
    : ativos.length;

  // --- Extremos desenhados na pista ---------------------------------------
  let t0 = PISTA_INI_PADRAO;
  let t1 = PISTA_FIM_PADRAO;
  blocos.forEach((b) => {
    t0 = Math.min(t0, Math.floor(b.ini / 60) * 60);
    t1 = Math.max(t1, Math.ceil(b.fim / 60) * 60);
  });
  if (ehHoje && minutosAgora !== null) {
    t0 = Math.min(t0, Math.floor(minutosAgora / 60) * 60);
    t1 = Math.max(t1, Math.ceil(minutosAgora / 60) * 60);
  }

  return {
    diaChave,
    ehHoje,
    minutosAgora,
    blocos,
    contínuos,
    colunaDe,
    idsConflito,
    paresConflito,
    ocupadoMin,
    janelas,
    livreMin,
    emAndamento,
    proximo,
    restam,
    t0,
    t1,
  };
}

// Análise do dia atualmente em tela, ou null quando a janela de exibição
// cobre mais de um dia (semana, mês, "todos" ou intervalo manual).
function analiseDoDiaVisivel(filtrados) {
  const diaChave = diaUnicoVisivel();
  if (!diaChave) return null;
  const grupo = agruparPorDia(filtrados).find((g) => g.chave === diaChave);
  return analisarDia(grupo ? grupo.eventos : [], diaChave);
}

// "Agora" e "a seguir" respondem sobre o instante presente, não sobre a janela
// escolhida: numa visão de semana ou mês eles continuam válidos, desde que o
// dia de hoje esteja dentro do que está filtrado.
function analiseDeHoje(filtrados) {
  const hoje = chaveDia(new Date());
  const grupo = agruparPorDia(filtrados).find((g) => g.chave === hoje);
  if (!grupo) return null;
  return analisarDia(grupo.eventos, hoje);
}

/* ==========================================================================
   AGORA / A SEGUIR + RESUMO DO DIA
   ========================================================================== */

const ICONE_LOCAL =
  '<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true" style="flex:0 0 auto;opacity:.75"><path d="M12 21s7-6.1 7-11a7 7 0 10-14 0c0 4.9 7 11 7 11z"></path><circle cx="12" cy="10" r="2.4"></circle></svg>';
const ICONE_RELOGIO =
  '<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true" style="flex:0 0 auto;opacity:.75"><circle cx="12" cy="12" r="8.5"></circle><path d="M12 7.5V12l3 1.8"></path></svg>';
const ICONE_PESSOAS =
  '<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true" style="flex:0 0 auto;opacity:.75"><circle cx="9" cy="8.5" r="3.2"></circle><path d="M3.5 19c.6-3.1 2.8-4.6 5.5-4.6S14 15.9 14.6 19"></path><path d="M16 6.2a3.2 3.2 0 010 5.6M18.4 14.6c1.6.7 2.6 2.1 3 4.4"></path></svg>';
const ICONE_LINK =
  '<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" aria-hidden="true"><path d="M10 13a3.5 3.5 0 005 0l3-3a3.5 3.5 0 10-5-5l-1 1"></path><path d="M14 11a3.5 3.5 0 00-5 0l-3 3a3.5 3.5 0 105 5l1-1"></path></svg>';

// Contagem legível até um horário do próprio dia ("em 1h20", "em 12 min").
function contagemAte(minutos) {
  if (minutos <= 0) return "agora";
  if (minutos < 60) return `em ${minutos} min`;
  return `em ${duracaoCurta(minutos)}`;
}

function renderizarBriefDoDia(analise) {
  const secao = document.getElementById("day-brief");
  const boxAgora = document.getElementById("brief-agora");
  const boxProximo = document.getElementById("brief-proximo");
  if (!secao) return;

  if (!analise || analise.blocos.length === 0) {
    secao.hidden = true;
    return;
  }
  secao.hidden = false;

  // --- Em andamento -------------------------------------------------------
  const atual = analise.emAndamento;
  boxAgora.classList.toggle("is-ativo", !!atual);
  if (atual) {
    const decorrido = analise.minutosAgora - atual.ini;
    const restante = atual.fim - analise.minutosAgora;
    const progresso = Math.round((decorrido / atual.dur) * 100);
    boxAgora.innerHTML = `
      <div class="brief-card__topo">
        <span class="brief-card__ponto"></span>
        <span class="brief-card__rotulo">Em andamento</span>
        <span class="brief-card__contagem">termina em ${duracaoCurta(restante)}</span>
      </div>
      <div class="brief-card__titulo">${escapeHtml(atual.evento.titulo)}</div>
      <div class="brief-card__meta">
        ${atual.evento.local ? `<span>${ICONE_LOCAL}${escapeHtml(atual.evento.local)}</span>` : ""}
        <span class="mono">${ICONE_RELOGIO}${hhmmDeMinutos(atual.ini)} – ${hhmmDeMinutos(atual.fim)}</span>
      </div>
      <div class="brief-card__progresso">
        <div class="brief-card__barra"><i style="width:${Math.min(100, Math.max(0, progresso))}%"></i></div>
        <div class="brief-card__nota">${progresso}% decorrido · ${duracaoCurta(atual.dur)} no total</div>
      </div>
    `;
  } else {
    const rotulo = analise.ehHoje ? "Nenhum compromisso em andamento" : "Dia sem compromisso em curso";
    boxAgora.innerHTML = `
      <div class="brief-card__topo">
        <span class="brief-card__ponto"></span>
        <span class="brief-card__rotulo">Agora</span>
        <span class="brief-card__contagem">${analise.ehHoje ? hhmmDeMinutos(analise.minutosAgora) : hhmmDeMinutos(JORNADA_INI)}</span>
      </div>
      <div class="brief-card__titulo">${rotulo}</div>
      <div class="brief-card__nota">Agenda livre neste instante.</div>
    `;
  }

  // --- A seguir -----------------------------------------------------------
  const prox = analise.proximo;
  if (prox) {
    const quando = analise.ehHoje ? contagemAte(prox.ini - analise.minutosAgora) : "no dia exibido";
    boxProximo.innerHTML = `
      <div class="brief-card__topo">
        <span class="brief-card__rotulo">A seguir</span>
        <span class="brief-card__contagem">${quando}</span>
      </div>
      <div class="brief-card__titulo">${escapeHtml(prox.evento.titulo)}</div>
      <div class="brief-card__meta">
        <span class="badge badge--${prox.evento.categoria}">${CATEGORIA_LABEL[prox.evento.categoria]}</span>
        <span class="mono">${hhmmDeMinutos(prox.ini)} – ${hhmmDeMinutos(prox.fim)}</span>
      </div>
      ${prox.evento.local ? `<div class="brief-card__meta"><span>${ICONE_LOCAL}${escapeHtml(prox.evento.local)}</span></div>` : ""}
    `;
  } else {
    boxProximo.innerHTML = `
      <div class="brief-card__topo"><span class="brief-card__rotulo">A seguir</span></div>
      <div class="brief-card__titulo">Sem mais compromissos no dia</div>
      <div class="brief-card__nota">A agenda do dia está encerrada.</div>
    `;
  }
}

// A faixa de quatro números troca de leitura conforme a janela: no dia é o
// resumo derivado do redesenho; em semana/mês/todos volta a ser a contagem
// de compromissos por situação, que é o que faz sentido ali.
function renderizarResumoDoDia(analise, filtrados) {
  const secao = document.getElementById("day-stats");
  if (!secao) return;
  secao.hidden = false;

  const cel = (id) => document.getElementById(id);
  const celConflito = document.getElementById("stat-cel-conflito");

  if (analise) {
    const restam = analise.restam;
    cel("stat-restam").textContent = restam;
    cel("stat-restam-rotulo").textContent = restam === 1 ? "compromisso" : "compromissos";
    secao.querySelectorAll(".day-stats__rotulo")[0].textContent = analise.ehHoje ? "Ainda hoje" : "No dia";

    cel("stat-ocupacao").textContent = duracaoCurta(analise.ocupadoMin);
    const pct = Math.min(100, Math.round((analise.ocupadoMin / (JORNADA_FIM - JORNADA_INI)) * 100));
    cel("stat-ocupacao-barra").style.width = `${pct}%`;
    secao.querySelectorAll(".day-stats__rotulo")[1].textContent = "Ocupação";
    secao.querySelectorAll(".day-stats__unidade")[1].textContent = "de 10h úteis";

    cel("stat-livre").textContent = duracaoCurta(analise.livreMin);
    const nj = analise.janelas.length;
    cel("stat-livre-rotulo").textContent = nj === 0 ? "nenhuma janela" : nj === 1 ? "em 1 janela" : `em ${nj} janelas`;
    secao.querySelectorAll(".day-stats__rotulo")[2].textContent = "Janelas livres";

    const nc = analise.paresConflito.length;
    cel("stat-conflitos").textContent = nc;
    cel("stat-conflitos-rotulo").textContent = nc === 0 ? "nenhuma" : nc === 1 ? "sobreposição" : "sobreposições";
    secao.querySelectorAll(".day-stats__rotulo")[3].textContent = "Sobreposições";
    celConflito.classList.toggle("is-ativo", nc > 0);
    return;
  }

  // Janela de vários dias: contagem por situação.
  let andamento = 0;
  let futuros = 0;
  let concluidos = 0;
  filtrados.forEach((evento) => {
    const situacao = situacaoTemporal(evento);
    if (situacao === "andamento") andamento++;
    else if (situacao === "futuro") futuros++;
    else concluidos++;
  });

  secao.querySelectorAll(".day-stats__rotulo")[0].textContent = "Compromissos";
  cel("stat-restam").textContent = filtrados.length;
  cel("stat-restam-rotulo").textContent = "no período";

  secao.querySelectorAll(".day-stats__rotulo")[1].textContent = "Em andamento";
  cel("stat-ocupacao").textContent = andamento;
  cel("stat-ocupacao-barra").style.width = filtrados.length ? `${Math.round((andamento / filtrados.length) * 100)}%` : "0%";
  secao.querySelectorAll(".day-stats__unidade")[1].textContent = "agora";

  secao.querySelectorAll(".day-stats__rotulo")[2].textContent = "Próximos";
  cel("stat-livre").textContent = futuros;
  cel("stat-livre-rotulo").textContent = "por vir";

  secao.querySelectorAll(".day-stats__rotulo")[3].textContent = "Concluídos";
  cel("stat-conflitos").textContent = concluidos;
  cel("stat-conflitos-rotulo").textContent = "encerrados";
  celConflito.classList.remove("is-ativo");
}

/* ==========================================================================
   ROTA DO DIA (sidebar) — "onde eu preciso estar"
   ========================================================================== */

function renderizarRotaDoDia(analise) {
  const grupo = document.getElementById("rota-grupo");
  const lista = document.getElementById("rota-lista");
  if (!grupo || !lista) return;

  if (!analise) {
    grupo.hidden = true;
    return;
  }

  // Sequência cronológica de locais, sem repetir o mesmo local duas vezes
  // seguidas — quem lê quer o deslocamento, não a lista de compromissos.
  const paradas = [];
  analise.blocos
    .filter((b) => !b.evento.cancelado && b.evento.local)
    .forEach((b) => {
      const ultimo = paradas[paradas.length - 1];
      if (ultimo && ultimo.local === b.evento.local) return;
      paradas.push({ hora: hhmmDeMinutos(b.ini), local: b.evento.local, categoria: b.evento.categoria });
    });

  grupo.hidden = false;
  if (paradas.length === 0) {
    lista.innerHTML = `<li class="rota-vazia">Nenhum local informado nos compromissos do dia.</li>`;
    return;
  }

  lista.innerHTML = paradas
    .map(
      (p) => `
      <li class="rota__item">
        <span class="rota__trilho">
          <span class="rota__ponto" style="color:${CATEGORIA_COR[p.categoria]};background:${CATEGORIA_COR[p.categoria]}"></span>
          <span class="rota__linha"></span>
        </span>
        <span class="rota__corpo">
          <span class="rota__cabeca">
            <span class="rota__hora">${p.hora}</span>
            <span class="badge badge--${p.categoria}">${CATEGORIA_LABEL[p.categoria]}</span>
          </span>
          <span class="rota__local">${escapeHtml(p.local)}</span>
        </span>
      </li>`
    )
    .join("");
}

/* ==========================================================================
   LINHA DO TEMPO EM ESCALA REAL DE HORAS
   ========================================================================== */

function rotuloStatusDoBloco(bloco) {
  if (bloco.evento.cancelado) return { texto: "Cancelado", classe: "cancelado" };
  const situacao = situacaoTemporal(bloco.evento);
  if (situacao === "concluido") return { texto: "Concluído", classe: "concluido" };
  if (situacao === "andamento") return { texto: "Em andamento", classe: "andamento" };
  return { texto: "Agendado", classe: "agendado" };
}

function preencherPista(analise) {
  const cartao = document.getElementById("pista-card");
  const pista = document.getElementById("pista");
  if (!cartao || !pista) return;

  if (!analise || analise.blocos.length === 0) {
    cartao.hidden = true;
    return;
  }
  cartao.hidden = false;

  const { t0, t1 } = analise;
  const y = (min) => ((min - t0) / 60) * PISTA_PX_HORA;
  const alturaPista = y(t1);

  const partes = [];
  partes.push('<div class="pista__regua"></div>');

  // Régua de horas: o rótulo some perto do "agora" para não colidir com a
  // etiqueta vermelha, que ocupa o mesmo trecho da régua.
  for (let m = Math.ceil(t0 / 60) * 60; m <= t1; m += 60) {
    const esconder = analise.ehHoje && Math.abs(m - analise.minutosAgora) <= 16;
    partes.push(`<div class="pista__hora-linha" style="top:${y(m)}px"></div>`);
    partes.push(
      `<div class="pista__hora-rotulo" style="top:${y(m) - 7}px${esconder ? ";visibility:hidden" : ""}">${hhmmDeMinutos(m)}</div>`
    );
  }

  const trilho = [];

  // Janelas livres: o vazio ganha lugar e tamanho reais.
  analise.janelas.forEach((j) => {
    const altura = ((j[1] - j[0]) / 60) * PISTA_PX_HORA - 4;
    if (altura < 18) return;
    trilho.push(
      `<div class="pista__janela" style="top:${y(j[0]) + 2}px;height:${altura}px">
         <span>${duracaoCurta(j[1] - j[0])} livre</span>
       </div>`
    );
  });

  analise.blocos.forEach((bloco) => {
    const { evento } = bloco;
    const coluna = analise.colunaDe.get(evento.id) || { col: 0, total: 1 };
    const estreito = coluna.total > 1;
    const largura = 100 / coluna.total;
    const alturaPx = Math.max((bloco.dur / 60) * PISTA_PX_HORA - 4, 50);

    // O nível de detalhe é decidido pela altura disponível em px, não pela
    // duração em minutos: 1h em coluna dividida cabe menos que 1h em coluna
    // cheia, porque tem menos espaço.
    const detalhado = !estreito && alturaPx >= 84;
    const longo = !estreito && alturaPx >= 132;
    const mostrarLink = !!evento.link && alturaPx >= (estreito ? 118 : 100);

    const status = rotuloStatusDoBloco(bloco);
    const temConflito = analise.idsConflito.has(evento.id);
    const classes = ["pista__evento"];
    if (estreito) classes.push("is-estreito");
    if (evento.cancelado) classes.push("is-cancelado");
    else if (status.classe === "andamento") classes.push("is-andamento");

    const estilo = [
      `top:${y(bloco.ini) + 2}px`,
      `height:${alturaPx}px`,
      `left:${coluna.col * largura}%`,
      coluna.total > 1 ? `width:calc(${largura}% - 6px)` : "width:100%",
    ].join(";");

    const selos = [
      `<span class="badge badge--${evento.categoria}">${CATEGORIA_LABEL[evento.categoria]}</span>`,
      `<span class="badge badge--${status.classe}">${status.texto}</span>`,
      temConflito ? `<span class="badge badge--conflito">⚠ Sobreposição</span>` : "",
    ].join("");

    const corpo = estreito
      ? `
        <div class="pista__evento-corpo">
          <div class="pista__titulo">${escapeHtml(evento.titulo)}</div>
          <div class="pista__linha">
            <span class="pista__hora">${hhmmDeMinutos(bloco.ini)}–${hhmmDeMinutos(bloco.fim)}</span>
            ${temConflito ? `<span class="badge badge--conflito">⚠ Conflito</span>` : ""}
            <span class="badge badge--${status.classe}">${status.texto}</span>
          </div>
          ${evento.local ? `<div class="pista__meta"><span class="elipse">${ICONE_LOCAL}${escapeHtml(evento.local)}</span></div>` : ""}
          ${mostrarLink ? `<div class="pista__link">${ICONE_LINK}Entrar na reunião</div>` : ""}
        </div>`
      : `
        <div class="pista__evento-corpo">
          <div class="pista__linha pista__linha--titulo">
            <span class="pista__hora">${hhmmDeMinutos(bloco.ini)} – ${hhmmDeMinutos(bloco.fim)}</span>
            <span class="pista__titulo">${escapeHtml(evento.titulo)}</span>
          </div>
          <div class="pista__linha">${selos}</div>
          ${
            detalhado
              ? `<div class="pista__meta">
                   ${evento.local ? `<span>${ICONE_LOCAL}${escapeHtml(evento.local)}</span>` : ""}
                   ${participantesResumo(evento) ? `<span>${ICONE_PESSOAS}${escapeHtml(participantesResumo(evento))}</span>` : ""}
                 </div>`
              : ""
          }
          ${mostrarLink ? `<div class="pista__link">${ICONE_LINK}Entrar na reunião</div>` : ""}
          ${longo && evento.descricao ? `<div class="pista__nota">${escapeHtml(evento.descricao)}</div>` : ""}
        </div>`;

    trilho.push(
      `<button type="button" class="${classes.join(" ")}" style="${estilo}" id="pista-${escapeAttr(evento.id)}"
               data-abrir-detalhes="${escapeAttr(evento.id)}"
               aria-label="${escapeAttr(`${hhmmDeMinutos(bloco.ini)} às ${hhmmDeMinutos(bloco.fim)} — ${evento.titulo} — ${status.texto}`)}">
         <span class="pista__faixa" style="background:${evento.cancelado ? "#D80425" : CATEGORIA_COR[evento.categoria]}"></span>
         ${corpo}
       </button>`
    );
  });

  partes.push(`<div class="pista__trilho" style="height:${alturaPista}px">${trilho.join("")}</div>`);

  // Linha vermelha do "agora" — só existe quando o dia em tela é hoje.
  if (analise.ehHoje && analise.minutosAgora >= t0 && analise.minutosAgora <= t1) {
    partes.push(
      `<div class="pista__agora" style="top:${y(analise.minutosAgora) + 14 - 8}px;left:16px;right:16px">
         <b>${hhmmDeMinutos(analise.minutosAgora)}</b><i></i>
       </div>`
    );
  }

  pista.style.height = `${alturaPista + 32}px`;
  pista.innerHTML = partes.join("");

  // Cabeçalho da pista: contagem e legenda das modalidades presentes.
  const visiveis = analise.blocos.length;
  document.getElementById("pista-contagem").textContent =
    `${visiveis} compromisso${visiveis === 1 ? "" : "s"} · ${duracaoCurta(analise.ocupadoMin)} ocupados`;

  const categoriasPresentes = Array.from(new Set(analise.blocos.map((b) => b.evento.categoria)));
  document.getElementById("pista-legenda").innerHTML = categoriasPresentes
    .map(
      (c) =>
        `<span class="pista-legenda__item"><span class="pista-legenda__ponto" style="background:${CATEGORIA_COR[c]}"></span>${CATEGORIA_LABEL[c]}</span>`
    )
    .join("");
}

/* ==========================================================================
   DASHBOARD (INDICADORES)
   ========================================================================== */

function renderizarDashboard(filtrados) {
  const analise = analiseDoDiaVisivel(filtrados);

  renderizarBriefDoDia(analise || analiseDeHoje(filtrados));
  renderizarResumoDoDia(analise, filtrados);
  renderizarRotaDoDia(analise);
  preencherPista(analise);

  const temPista = !document.getElementById("pista-card").hidden;
  document.getElementById("vista-timeline").classList.toggle("tem-pista", temPista);

  document.getElementById("page-title").textContent = tituloDaPagina();
  document.getElementById("page-subtitle").textContent = subtituloDaPagina();
  document.getElementById("page-eyebrow").textContent =
    ehAgendaDeUmDiaSo() ? "Agenda do dia" : "Agenda institucional";

  // Alerta de sobreposição: no dia, aponta o par exato e leva à posição na
  // linha do tempo; em janelas de vários dias, conta os compromissos
  // sobrepostos detectados em toda a agenda.
  const alerta = document.getElementById("conflict-alert");
  const detalhe = document.getElementById("conflict-alert-detalhe");
  const link = document.getElementById("conflict-alert-link");

  if (analise && analise.paresConflito.length > 0) {
    const [a, b] = analise.paresConflito[0];
    const sobreposicao = Math.min(a.fim, b.fim) - Math.max(a.ini, b.ini);
    detalhe.textContent =
      `${a.evento.titulo} (${hhmmDeMinutos(a.ini)}–${hhmmDeMinutos(a.fim)}) sobrepõe ` +
      `${b.evento.titulo} (${hhmmDeMinutos(b.ini)}–${hhmmDeMinutos(b.fim)}) em ${duracaoCurta(sobreposicao)}.`;
    link.href = `#pista-${a.evento.id}`;
    link.hidden = document.getElementById("pista-card").hidden;
    alerta.hidden = false;
    return;
  }

  const conflitosAtivos = filtrados.filter(
    (evento) => evento.conflito && situacaoTemporal(evento) !== "concluido"
  ).length;

  if (conflitosAtivos > 0) {
    detalhe.textContent = `${conflitosAtivos} compromisso${conflitosAtivos === 1 ? "" : "s"} sobreposto${
      conflitosAtivos === 1 ? "" : "s"
    } no período exibido.`;
    link.hidden = true;
    alerta.hidden = false;
  } else {
    alerta.hidden = true;
  }
}

/* ==========================================================================
   FILTROS ATIVOS REMOVÍVEIS
   ========================================================================== */

const PERIODO_LABEL = { todos: "Todos", dia: "Hoje", semana: "Esta semana", mes: "Este mês" };
const PERIODO_TITULO = { todos: "Agenda — todos os compromissos", dia: "Agenda de Hoje", semana: "Agenda da Semana", mes: "Agenda do Mês" };

// Pontos coloridos por categoria (mesmas cores dos badges), usados na lista
// de categorias da sidebar.
const CATEGORIA_COR = {
  viagem: "#A65A05",
  "pauta-online": "#2C63B0",
  "pauta-presencial": "#0B3163",
};

// Verdadeiro quando a tela mostra um único dia — seja por "Hoje", seja por um
// intervalo digitado que começa e termina no mesmo dia.
function ehAgendaDeUmDiaSo() {
  const { periodo, dataInicio, dataFim } = state.filtros;
  if (filtroDeDataAtivo()) return Boolean(dataInicio && dataFim && dataInicio === dataFim);
  return periodo === "dia";
}

// Com um intervalo digitado, o título passa a nomear a data escolhida. Dizer
// "todos os compromissos" ali seria enganoso: o período foi devolvido para
// "Todos" justamente porque quem manda agora é a data.
function tituloDaPagina() {
  const { dataInicio, dataFim } = state.filtros;

  if (filtroDeDataAtivo()) {
    if (dataInicio && dataFim && dataInicio === dataFim) {
      return `Agenda de ${formatarDataCurta(new Date(`${dataInicio}T12:00:00${offsetBahia()}`))}`;
    }
    return "Agenda do período escolhido";
  }

  return PERIODO_TITULO[state.filtros.periodo] || "Agenda";
}

function subtituloDaPagina() {
  const { periodo, dataInicio, dataFim } = state.filtros;
  if (dataInicio || dataFim) {
    const ini = dataInicio ? formatarDataLonga(new Date(`${dataInicio}T12:00:00${offsetBahia()}`)) : "início";
    const fim = dataFim ? formatarDataLonga(new Date(`${dataFim}T12:00:00${offsetBahia()}`)) : "hoje";
    return `De ${ini} até ${fim}`;
  }
  const agora = new Date();
  if (periodo === "dia") return capitalizar(formatarDataLonga(agora));
  if (periodo === "semana") {
    return `${formatarDataCurta(segundaDaSemana(agora))} a ${formatarDataCurta(domingoDaSemana(agora))} · semana atual`;
  }
  if (periodo === "mes") {
    return capitalizar(
      new Intl.DateTimeFormat("pt-BR", { timeZone: DISPLAY_TIMEZONE, month: "long", year: "numeric" }).format(agora)
    );
  }
  return "Todos os compromissos sincronizados do Google Agenda";
}

function capitalizar(txt) {
  return txt ? txt.charAt(0).toUpperCase() + txt.slice(1) : txt;
}

// Renderiza a lista de categorias na sidebar com um ponto colorido, o rótulo
// e a contagem de compromissos daquela categoria (respeitando os demais
// filtros ativos, exceto o próprio filtro de categoria — assim os números
// indicam quantos há disponíveis em cada uma).
function renderizarCategorias() {
  const container = document.getElementById("categoria-lista");
  if (!container) return;

  const baseContagem = state.eventos.filter(
    (evento) =>
      (filtroDeDataAtivo() || eventoNoPeriodo(evento, state.filtros.periodo)) &&
      eventoNoIntervaloDeData(evento, state.filtros.dataInicio, state.filtros.dataFim) &&
      (state.filtros.mostrarConcluidos || situacaoTemporal(evento) !== "concluido") &&
      passaBusca(evento)
  );

  const contar = (cat) => baseContagem.filter((e) => e.categoria === cat).length;

  container.innerHTML = "";
  Object.keys(CATEGORIA_LABEL).forEach((cat) => {
    const ativo = state.filtros.categorias.has(cat);
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "cat-list__item" + (ativo ? " is-active" : "");
    btn.dataset.categoria = cat;
    btn.setAttribute("aria-pressed", String(ativo));
    btn.innerHTML = `
      <span class="cat-list__dot" style="background:${CATEGORIA_COR[cat]};"></span>
      <span class="cat-list__label">${CATEGORIA_LABEL[cat]}</span>
      <span class="cat-list__count">${contar(cat)}</span>
    `;
    container.appendChild(btn);
  });
}

// Reflete no DOM o período em vigor. Necessário porque o período passou a
// mudar também por caminhos que não são o clique no próprio chip.
// No escopo do módulo porque o recorte vindo da URL também precisa dele, antes
// de inicializarInterface terminar de montar seus próprios manipuladores.
function atualizarVisibilidadeBtnLimparDatas() {
  const btn = document.getElementById("btn-limpar-datas");
  if (btn) btn.hidden = !state.filtros.dataInicio && !state.filtros.dataFim;
}

function sincronizarChipsPeriodo() {
  document.querySelectorAll("#periodo-group .chip").forEach((chip) => {
    chip.classList.toggle("is-active", chip.dataset.periodo === state.filtros.periodo);
  });
}

function limparFiltroDeData() {
  state.filtros.dataInicio = null;
  state.filtros.dataFim = null;
  document.getElementById("filtro-data-inicio").value = "";
  document.getElementById("filtro-data-fim").value = "";
  document.getElementById("btn-limpar-datas").hidden = true;
  esconderErroData();
}

function mostrarErroData(mensagem) {
  const erroEl = document.getElementById("erro-data");
  erroEl.textContent = mensagem;
  erroEl.hidden = false;
  document.getElementById("filtro-data-inicio").setAttribute("aria-invalid", "true");
  document.getElementById("filtro-data-fim").setAttribute("aria-invalid", "true");
}

function esconderErroData() {
  document.getElementById("erro-data").hidden = true;
  document.getElementById("filtro-data-inicio").removeAttribute("aria-invalid");
  document.getElementById("filtro-data-fim").removeAttribute("aria-invalid");
}

function limparTodosFiltros() {
  state.filtros.periodo = "dia";
  state.filtros.categorias = new Set();
  state.filtros.busca = "";
  state.filtros.mostrarConcluidos = true;
  document.getElementById("busca").value = "";
  document.getElementById("mostrar-concluidos").checked = true;
  limparFiltroDeData();
  sincronizarChipsPeriodo();
  renderizarConteudo();
}

function renderizarFiltrosAtivos() {
  const { periodo, categorias, busca, dataInicio, dataFim, mostrarConcluidos } = state.filtros;
  const container = document.getElementById("active-filters");
  const lista = document.getElementById("active-filters-lista");
  const tags = [];

  if (periodo !== "dia") {
    tags.push({
      label: `Período: ${PERIODO_LABEL[periodo]}`,
      remover: () => {
        state.filtros.periodo = "dia";
        sincronizarChipsPeriodo();
      },
    });
  }

  categorias.forEach((categoria) => {
    tags.push({
      label: CATEGORIA_LABEL[categoria],
      remover: () => {
        state.filtros.categorias.delete(categoria);
      },
    });
  });

  if (dataInicio || dataFim) {
    tags.push({
      label: `Data: ${dataInicio || "…"} a ${dataFim || "…"}`,
      remover: () => limparFiltroDeData(),
    });
  }

  if (busca) {
    tags.push({
      label: `Busca: "${busca}"`,
      remover: () => {
        state.filtros.busca = "";
        document.getElementById("busca").value = "";
      },
    });
  }

  if (!mostrarConcluidos) {
    tags.push({
      label: "Ocultando concluídos",
      remover: () => {
        state.filtros.mostrarConcluidos = true;
        document.getElementById("mostrar-concluidos").checked = true;
      },
    });
  }

  container.hidden = tags.length === 0;
  lista.innerHTML = "";
  tags.forEach((tag) => {
    const el = document.createElement("span");
    el.className = "filter-tag";
    el.innerHTML = `<span>${escapeHtml(tag.label)}</span> <button type="button" aria-label="Remover filtro: ${escapeAttr(tag.label)}">×</button>`;
    el.querySelector("button").addEventListener("click", () => {
      tag.remover();
      renderizarConteudo();
    });
    lista.appendChild(el);
  });
}

/* ==========================================================================
   VISÃO EM TABELA (ordenação e paginação)
   ========================================================================== */

function compararEventosTabela(a, b, campo) {
  switch (campo) {
    case "titulo":
      return a.titulo.localeCompare(b.titulo, "pt-BR");
    case "categoria":
      return CATEGORIA_LABEL[a.categoria].localeCompare(CATEGORIA_LABEL[b.categoria], "pt-BR");
    case "local":
      return (a.local || "").localeCompare(b.local || "", "pt-BR");
    case "status":
      return situacaoTemporal(a).localeCompare(situacaoTemporal(b), "pt-BR");
    case "horario":
    case "data":
    default:
      return new Date(a.inicio) - new Date(b.inicio);
  }
}

function rotuloStatus(evento) {
  if (evento.cancelado) return "Cancelado";
  const situacao = situacaoTemporal(evento);
  if (situacao === "andamento") return "Em andamento";
  if (situacao === "concluido") return "Concluído";
  return "Agendado";
}

function preencherTabela(filtrados) {
  const corpo = document.getElementById("tabela-corpo");
  const infoPagina = document.getElementById("pagina-info");
  const btnAnterior = document.getElementById("btn-pagina-anterior");
  const btnProxima = document.getElementById("btn-pagina-proxima");

  document.querySelectorAll(".th-sort").forEach((btn) => {
    const ativo = btn.dataset.sort === state.ui.tabelaOrdenarPor;
    btn.classList.toggle("is-ativo", ativo);
    const icone = btn.querySelector(".th-sort__icon");
    icone.textContent = ativo ? (state.ui.tabelaOrdemAsc ? "↑" : "↓") : "↕";
  });

  const ordenados = [...filtrados].sort((a, b) => {
    const resultado = compararEventosTabela(a, b, state.ui.tabelaOrdenarPor);
    return state.ui.tabelaOrdemAsc ? resultado : -resultado;
  });

  const porPagina = state.ui.tabelaPorPagina;
  const totalPaginas = Math.max(1, Math.ceil(ordenados.length / porPagina));
  if (state.ui.tabelaPagina > totalPaginas) state.ui.tabelaPagina = totalPaginas;
  if (state.ui.tabelaPagina < 1) state.ui.tabelaPagina = 1;

  const inicioIdx = (state.ui.tabelaPagina - 1) * porPagina;
  const pagina = ordenados.slice(inicioIdx, inicioIdx + porPagina);

  corpo.innerHTML = "";

  if (pagina.length === 0) {
    const tr = document.createElement("tr");
    tr.innerHTML = `<td colspan="8" style="text-align:center;color:var(--color-text-secondary);padding:24px;">Nenhum compromisso encontrado para os filtros selecionados.</td>`;
    corpo.appendChild(tr);
  }

  pagina.forEach((evento) => {
    const tr = document.createElement("tr");
    const horario = evento.diaInteiro
      ? "Dia inteiro"
      : `${formatarHora(new Date(evento.inicio))} – ${formatarHora(new Date(evento.fim))}`;
    const dataFormatada = new Intl.DateTimeFormat("pt-BR", {
      timeZone: DISPLAY_TIMEZONE,
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    }).format(new Date(evento.inicio));

    tr.innerHTML = `
      <td>${dataFormatada}</td>
      <td>${horario}</td>
      <td class="td-titulo">${escapeHtml(evento.titulo)}</td>
      <td><span class="badge badge--${evento.categoria}">${CATEGORIA_LABEL[evento.categoria]}</span></td>
      <td class="td-local">${escapeHtml(evento.local || "—")}</td>
      <td class="td-participantes">${escapeHtml(participantesResumo(evento) || "—")}</td>
      <td>${rotuloStatus(evento)}</td>
      <td><button class="btn btn--tiny-outline" type="button" data-abrir-detalhes="${escapeAttr(evento.id)}">Detalhes</button></td>
    `;
    corpo.appendChild(tr);
  });

  infoPagina.textContent = `Página ${state.ui.tabelaPagina} de ${totalPaginas} (${ordenados.length} compromisso${ordenados.length === 1 ? "" : "s"})`;
  btnAnterior.disabled = state.ui.tabelaPagina <= 1;
  btnProxima.disabled = state.ui.tabelaPagina >= totalPaginas;
}

function atualizarVisibilidadeVista() {
  const timelineEl = document.getElementById("vista-timeline");
  const tabelaEl = document.getElementById("vista-tabela");
  const btnTimeline = document.getElementById("btn-vista-timeline");
  const btnTabela = document.getElementById("btn-vista-tabela");
  const emTabela = state.ui.vista === "tabela";

  timelineEl.hidden = emTabela;
  tabelaEl.hidden = !emTabela;
  btnTimeline.classList.toggle("is-active", !emTabela);
  btnTabela.classList.toggle("is-active", emTabela);
}

/* ==========================================================================
   DISPARADOR CENTRAL DE RENDERIZAÇÃO
   ========================================================================== */

function renderizarConteudo() {
  const filtrados = obterEventosFiltrados();
  const resumo = `${filtrados.length} compromisso${filtrados.length === 1 ? "" : "s"}`;
  document.getElementById("filtros-resumo").textContent = resumo;
  const resumoExport = document.getElementById("export-resumo-contagem");
  if (resumoExport) resumoExport.textContent = resumo;

  preencherTimeline(filtrados);
  preencherTabela(filtrados);
  renderizarDashboard(filtrados);
  renderizarCategorias();
  renderizarFiltrosAtivos();
  atualizarVisibilidadeVista();

  // Mantém a pré-visualização de exportação sincronizada quando o overlay
  // estiver aberto (os filtros afetam o que será exportado).
  if (!document.getElementById("export-backdrop").hidden) {
    renderizarPreviewExport(filtrados);
  }
}

/* ==========================================================================
   PAINEL LATERAL DE DETALHES
   ========================================================================== */

let elementoComFocoAntesDoPainel = null;

function abrirPainelDetalhes(eventoId) {
  const evento = state.eventos.find((e) => e.id === eventoId);
  if (!evento) return;

  elementoComFocoAntesDoPainel = document.activeElement;

  const situacao = situacaoTemporal(evento);
  const continuo = eventoEhContinuo(evento);
  const horario = evento.diaInteiro
    ? "Dia inteiro"
    : `${formatarHora(new Date(evento.inicio))} – ${formatarHora(new Date(evento.fim))}`;
  let dataHorarioTexto;
  if (!continuo) {
    dataHorarioTexto = `${formatarDataLonga(new Date(evento.inicio))} — ${horario}`;
  } else if (evento.diaInteiro) {
    // Dia inteiro contínuo: só datas, sem "(00:00)" que não agrega nada.
    dataHorarioTexto = `${formatarDataLonga(new Date(evento.inicio))} até ${formatarDataLonga(dataFimInclusivo(evento))}`;
  } else {
    dataHorarioTexto = `${formatarDataLonga(new Date(evento.inicio))} (${formatarHora(new Date(evento.inicio))}) até ${formatarDataLonga(new Date(evento.fim))} (${formatarHora(new Date(evento.fim))})`;
  }

  const badges = [];
  if (situacao === "andamento") badges.push(`<span class="badge badge--agora">● Agora</span>`);
  badges.push(`<span class="badge badge--${evento.categoria}">${CATEGORIA_LABEL[evento.categoria]}</span>`);
  if (continuo) {
    badges.push(
      `<span class="badge badge--continuo">${formatarDataCurta(new Date(evento.inicio))}–${formatarDataCurta(dataFimInclusivo(evento))}</span>`
    );
  }
  if (evento.recorrente) badges.push(`<span class="badge badge--recorrente">Recorrente</span>`);
  if (evento.cancelado) badges.push(`<span class="badge badge--cancelado">Cancelado</span>`);
  if (situacao === "concluido") badges.push(`<span class="badge badge--concluido">Concluído</span>`);
  if (evento.conflito && situacao !== "concluido") {
    badges.push(`<span class="badge badge--conflito">⚠ Sobreposição</span>`);
  }

  document.getElementById("detail-panel-titulo").textContent = evento.titulo;
  document.getElementById("detail-panel-corpo").innerHTML = `
    <div class="detail-panel__badges">${badges.join("")}</div>
    <div class="detail-panel__linha">
      <span class="detail-panel__linha-rotulo">Data e horário</span>
      <span class="detail-panel__linha-valor">${dataHorarioTexto} (${duracaoLegivel(evento)})</span>
    </div>
    ${evento.local ? `<div class="detail-panel__linha"><span class="detail-panel__linha-rotulo">Local</span><span class="detail-panel__linha-valor">${escapeHtml(evento.local)}</span></div>` : ""}
    ${(evento.participantes || []).length ? `<div class="detail-panel__linha"><span class="detail-panel__linha-rotulo">Participantes</span><span class="detail-panel__linha-valor">${escapeHtml(evento.participantes.join(", "))}</span></div>` : ""}
    ${evento.descricao ? `<div class="detail-panel__linha"><span class="detail-panel__linha-rotulo">Descrição</span><span class="detail-panel__linha-valor">${escapeHtml(evento.descricao)}</span></div>` : ""}
    ${evento.link ? `<a class="detail-panel__link" href="${escapeAttr(evento.link)}" target="_blank" rel="noopener">${ICONE_LINK}Entrar na reunião</a>` : ""}
  `;

  const painel = document.getElementById("detail-panel");
  const backdrop = document.getElementById("panel-backdrop");
  painel.setAttribute("aria-hidden", "false");
  backdrop.hidden = false;
  setTimeout(() => painel.classList.add("is-aberto"), 0);
  document.getElementById("btn-fechar-painel").focus();
}

function fecharPainelDetalhes() {
  const painel = document.getElementById("detail-panel");
  const backdrop = document.getElementById("panel-backdrop");
  if (painel.getAttribute("aria-hidden") === "true") return;

  painel.classList.remove("is-aberto");
  backdrop.hidden = true;
  setTimeout(() => painel.setAttribute("aria-hidden", "true"), 200);

  if (elementoComFocoAntesDoPainel && document.contains(elementoComFocoAntesDoPainel)) {
    elementoComFocoAntesDoPainel.focus();
  }
}

/* ==========================================================================
   MODAL DE CONFIRMAÇÃO (ações críticas / exportações grandes)
   ========================================================================== */

function confirmarAcao(mensagem, titulo) {
  return new Promise((resolve) => {
    const modal = document.getElementById("confirm-modal");
    const backdrop = document.getElementById("confirm-backdrop");
    document.getElementById("confirm-titulo").textContent = titulo || "Confirmar ação";
    document.getElementById("confirm-mensagem").textContent = mensagem;

    const elementoAnterior = document.activeElement;
    modal.hidden = false;
    backdrop.hidden = false;

    const btnCancelar = document.getElementById("confirm-cancelar");
    const btnContinuar = document.getElementById("confirm-continuar");
    btnContinuar.focus();

    function limpar(resultado) {
      modal.hidden = true;
      backdrop.hidden = true;
      btnCancelar.removeEventListener("click", aoCancelar);
      btnContinuar.removeEventListener("click", aoContinuar);
      if (elementoAnterior && document.contains(elementoAnterior)) elementoAnterior.focus();
      resolve(resultado);
    }
    function aoCancelar() {
      limpar(false);
    }
    function aoContinuar() {
      limpar(true);
    }

    btnCancelar.addEventListener("click", aoCancelar);
    btnContinuar.addEventListener("click", aoContinuar);
  });
}

/* ==========================================================================
   TEMA CLARO/ESCURO
   ========================================================================== */

const TEMA_STORAGE_KEY = "saaTcm.tema";

function sistemaPrefereTemaEscuro() {
  return window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches;
}

// tema: "dark" | "light" | null (null = segue a preferência do sistema).
function aplicarTema(tema) {
  if (tema === "dark" || tema === "light") {
    document.documentElement.setAttribute("data-theme", tema);
  } else {
    document.documentElement.removeAttribute("data-theme");
  }

  const efetivoEscuro = tema ? tema === "dark" : sistemaPrefereTemaEscuro();

  const btn = document.getElementById("btn-tema");
  if (btn) btn.setAttribute("aria-pressed", String(efetivoEscuro));

  const metaTema = document.getElementById("meta-theme-color");
  if (metaTema) metaTema.setAttribute("content", efetivoEscuro ? "#0B2A4E" : "#0A3165");
}

function alternarTema() {
  const efetivoEscuro = document.documentElement.getAttribute("data-theme")
    ? document.documentElement.getAttribute("data-theme") === "dark"
    : sistemaPrefereTemaEscuro();
  const novoTema = efetivoEscuro ? "light" : "dark";

  aplicarTema(novoTema);
  try {
    localStorage.setItem(TEMA_STORAGE_KEY, novoTema);
  } catch (e) {
    /* ignora */
  }
}

function inicializarTema() {
  let salvo = null;
  try {
    salvo = localStorage.getItem(TEMA_STORAGE_KEY);
  } catch (e) {
    /* ignora */
  }
  aplicarTema(salvo);

  // Sem preferência salva, acompanha mudanças ao vivo na preferência do
  // sistema (ex.: o SO alterna para modo escuro ao anoitecer).
  if (!salvo && window.matchMedia) {
    window.matchMedia("(prefers-color-scheme: dark)").addEventListener("change", () => {
      let aindaSemPreferencia = true;
      try {
        aindaSemPreferencia = !localStorage.getItem(TEMA_STORAGE_KEY);
      } catch (e) {
        /* ignora */
      }
      if (aindaSemPreferencia) aplicarTema(null);
    });
  }
}

/* ==========================================================================
   SIDEBAR: DRAWER MOBILE E COLAPSO NO DESKTOP
   ========================================================================== */

function abrirSidebarMobile() {
  state.ui.sidebarAberta = true;
  document.getElementById("app-shell").classList.add("is-sidebar-aberta");
  document.getElementById("sidebar-backdrop").hidden = false;
  document.getElementById("btn-menu").setAttribute("aria-expanded", "true");
  document.body.style.overflow = "hidden";
}

function fecharSidebarMobile() {
  state.ui.sidebarAberta = false;
  document.getElementById("app-shell").classList.remove("is-sidebar-aberta");
  document.getElementById("sidebar-backdrop").hidden = true;
  document.getElementById("btn-menu").setAttribute("aria-expanded", "false");
  document.body.style.overflow = "";
}

function alternarSidebarDesktop() {
  state.ui.sidebarRecolhida = !state.ui.sidebarRecolhida;
  document.getElementById("app-shell").classList.toggle("is-sidebar-recolhida", state.ui.sidebarRecolhida);
  document.getElementById("btn-recolher-sidebar").setAttribute("aria-expanded", String(!state.ui.sidebarRecolhida));
  try {
    localStorage.setItem(SIDEBAR_RECOLHIDA_STORAGE_KEY, state.ui.sidebarRecolhida ? "1" : "0");
  } catch (e) {
    /* ignora */
  }
}

function renderizarUltimaAtualizacao() {
  const el = document.getElementById("ultima-atualizacao");
  el.textContent = state.ultimaAtualizacao ? formatarDataHora(state.ultimaAtualizacao) : "—";
}

function definirCarregando(valor) {
  state.carregando = valor;
  document.getElementById("status-loading").hidden = !valor;
  document.getElementById("btn-atualizar").disabled = valor;
}

function limparMensagens() {
  document.getElementById("status-success").hidden = true;
  document.getElementById("status-error").hidden = true;
  document.getElementById("status-cache").hidden = true;
}

function mostrarSucesso() {
  limparMensagens();
  document.getElementById("status-success").hidden = false;
  setTimeout(() => {
    document.getElementById("status-success").hidden = true;
  }, 4000);
}

function mostrarErro(erro) {
  limparMensagens();
  document.getElementById("status-error-msg").textContent =
    "Não foi possível atualizar a agenda: " + (erro && erro.message ? erro.message : "erro desconhecido");
  document.getElementById("status-error").hidden = false;
}

function mostrarAvisoCache() {
  document.getElementById("status-cache").hidden = false;
}

function renderizarTudo() {
  renderizarConteudo();
  renderizarUltimaAtualizacao();
}

/* ==========================================================================
   CICLO DE ATUALIZAÇÃO
   ========================================================================== */

async function atualizarAgenda() {
  definirCarregando(true);
  limparMensagens();
  // Só mostra o esqueleto na carga inicial (sem nada em tela ainda) — em
  // atualizações seguintes é melhor manter os dados já exibidos até a
  // resposta chegar, em vez de "piscar" a tela.
  if (state.eventos.length === 0) mostrarEsqueletos(3);

  try {
    const icsTexto = await buscarIcsTexto();
    const eventos = parseICSParaEventos(icsTexto);
    marcarConflitos(eventos);

    state.eventos = eventos;
    state.usandoCache = false;
    state.ultimaAtualizacao = new Date();

    salvarCache(eventos);
    renderizarTudo();
    mostrarSucesso();
  } catch (erro) {
    console.error("Erro ao atualizar agenda:", erro);
    mostrarErro(erro);

    const cache = carregarCache();
    if (cache) {
      marcarConflitos(cache.events);
      state.eventos = cache.events;
      state.usandoCache = true;
      state.ultimaAtualizacao = new Date(cache.savedAt);
      renderizarTudo();
      mostrarAvisoCache();
    } else {
      // Sem cache para exibir: substitui os esqueletos de carregamento pelo
      // estado vazio real, em vez de deixá-los "girando" indefinidamente.
      renderizarTudo();
    }
  } finally {
    definirCarregando(false);
  }
}

/* ==========================================================================
   DOCUMENTOS DE EXTRAÇÃO — EXTRATO A4 (PDF) E CARD MOBILE (JPEG)

   Os dois artefatos são construídos aqui em HTML institucional puro, sempre
   em tema claro (independentemente do modo escuro da interface), e depois
   rasterizados por html2canvas. Ambos leem `analisarDia` — a mesma função
   que alimenta a tela —, de modo que ocupação, janelas livres e
   sobreposições impressas são exatamente os números exibidos, e não uma
   segunda contagem que pode divergir.
   ========================================================================== */

// Paleta amostrada da logomarca, repetida aqui em literais porque o papel de
// exportação não herda as variáveis CSS da interface (e não pode herdar: o
// documento é sempre claro, mesmo com a tela em modo escuro).
const EXP = {
  navy: "#0B3163",
  navyMid: "#0A2A55",
  navyEscuro: "#071C38",
  vermelho: "#D80425",
  vermelhoForte: "#B00320",
  vermelhoTexto: "#7C0518",
  link: "#14448A",
  tinta: "#12203A",
  texto2: "#5F6E88",
  texto3: "#64718E",
  textoForte: "#3A4A66",
  borda: "#DCE3EE",
  bordaSuave: "#EDF1F7",
  painel: "#F4F7FB",
  verde: "#2E7A62",
  cancelTitulo: "#616A7E",
};

const EXP_CAT = {
  "pauta-presencial": { label: "Presencial", cor: "#0B3163", bg: "#EAF0F9", borda: "#CBDAEE" },
  "pauta-online": { label: "Online", cor: "#2C63B0", bg: "#EAF2FC", borda: "#C9DCF4" },
  viagem: { label: "Viagem", cor: "#A65A05", bg: "#FDF1E3", borda: "#F0DCBE" },
};

function expCat(categoria) {
  return EXP_CAT[categoria] || EXP_CAT["pauta-presencial"];
}

// Marcas institucionais em data URL: o html2canvas só rasteriza imagens que
// não dependem de uma nova requisição de rede durante a captura.
const marcasCache = {};
async function obterMarcaDataUrl(arquivo) {
  if (marcasCache[arquivo] !== undefined) return marcasCache[arquivo];
  try {
    const resposta = await fetch(`img/${arquivo}`);
    const blob = await resposta.blob();
    marcasCache[arquivo] = await new Promise((resolve, reject) => {
      const leitor = new FileReader();
      leitor.onload = () => resolve(leitor.result);
      leitor.onerror = reject;
      leitor.readAsDataURL(blob);
    });
  } catch (e) {
    console.warn(`Não foi possível carregar img/${arquivo} para a exportação:`, e);
    marcasCache[arquivo] = null;
  }
  return marcasCache[arquivo];
}

function precarregarMarcas() {
  return Promise.all([
    obterMarcaDataUrl("tcm-lockup.png"),
    obterMarcaDataUrl("tcm-55.png"),
    obterMarcaDataUrl("tcm-mark.png"),
  ]);
}

function marcaImg(arquivo, altura, alt) {
  const src = marcasCache[arquivo];
  if (!src) return "";
  return `<img src="${src}" alt="${escapeAttr(alt)}" style="height:${altura}px;width:auto;display:block" />`;
}

// Data por extenso e data curta, sempre no fuso de exibição.
function dataLongaDaChave(chave) {
  return capitalizar(formatarDataLonga(new Date(`${chave}T12:00:00${offsetBahia()}`)));
}

/* --------------------------------------------------------------------------
   EXTRATO DIÁRIO EM A4 (PDF)
   -------------------------------------------------------------------------- */

// Uma linha da tabela horário × compromisso.
function linhaExtratoA4(bloco, analise, densidade) {
  const { evento } = bloco;
  const cat = expCat(evento.categoria);
  const cancelado = !!evento.cancelado;
  const temConflito = analise ? analise.idsConflito.has(evento.id) : !!evento.conflito;
  const fundo = temConflito && !cancelado ? "background:#FDFAFB;" : "";

  const selos = [
    `<span style="font:600 9px/1 'IBM Plex Sans',sans-serif;letter-spacing:.06em;color:${cat.cor};border:1px solid ${cat.borda};background:${cat.bg};border-radius:4px;padding:3px 7px;text-transform:uppercase">${cat.label}</span>`,
  ];
  if (cancelado) {
    selos.push(
      `<span style="font:600 9px/1 'IBM Plex Sans',sans-serif;letter-spacing:.06em;color:${EXP.vermelhoForte};border:1px solid #F6C4CE;background:#FDECEF;border-radius:4px;padding:3px 7px">CANCELADO</span>`
    );
  } else if (temConflito) {
    selos.push(
      `<span style="font:600 9px/1 'IBM Plex Sans',sans-serif;letter-spacing:.06em;color:${EXP.vermelhoForte};border:1px solid #F6C4CE;background:#FDECEF;border-radius:4px;padding:3px 7px">SOBREPOSIÇÃO</span>`
    );
  }

  const linhaLocal = [evento.local, participantesResumo(evento)].filter(Boolean).join(" · ");
  const mostrarPauta = densidade === "completo" && evento.descricao;
  const mostrarApoio = densidade !== "resumo" && linhaLocal;

  const horaIni = evento.diaInteiro ? "Dia inteiro" : hhmmDeMinutos(bloco.ini);
  const horaFim = evento.diaInteiro ? duracaoLegivel(evento) : `até ${hhmmDeMinutos(bloco.fim)}`;
  const duracao = evento.diaInteiro ? "" : duracaoCurta(bloco.dur);

  return `
    <div style="display:grid;grid-template-columns:96px 1fr;gap:18px;padding:14px 0;border-bottom:1px solid ${EXP.bordaSuave};${fundo}break-inside:avoid">
      <div style="display:flex;flex-direction:column;gap:3px;border-left:3px solid ${cancelado ? EXP.vermelho : cat.cor};padding-left:11px">
        <span style="font:600 14px/1.2 'IBM Plex Mono',monospace;color:${cancelado ? EXP.vermelhoForte : EXP.navy}${cancelado ? ";text-decoration:line-through" : ""}">${horaIni}</span>
        <span style="font:400 11px/1.2 'IBM Plex Mono',monospace;color:${EXP.texto3}">${horaFim}</span>
        ${duracao ? `<span style="font:400 11px/1.2 'IBM Plex Mono',monospace;color:${EXP.texto3}">${duracao}</span>` : ""}
      </div>
      <div style="display:flex;flex-direction:column;gap:5px;min-width:0">
        <div style="display:flex;align-items:baseline;gap:9px;flex-wrap:wrap">
          <span style="font:600 15px/1.35 'IBM Plex Sans',sans-serif;color:${cancelado ? EXP.cancelTitulo : EXP.tinta}${cancelado ? ";text-decoration:line-through" : ""};text-wrap:pretty">${escapeHtml(evento.titulo)}</span>
          ${selos.join("")}
        </div>
        ${mostrarApoio ? `<div style="font:400 11.5px/1.5 'IBM Plex Sans',sans-serif;color:${EXP.texto2};text-wrap:pretty">${escapeHtml(linhaLocal)}</div>` : ""}
        ${mostrarPauta ? `<div style="font:400 11.5px/1.5 'IBM Plex Sans',sans-serif;color:${EXP.textoForte};text-wrap:pretty">${escapeHtml(evento.descricao)}</div>` : ""}
      </div>
    </div>`;
}

// Faixa de quatro indicadores do dia (ou do período, quando há vários dias).
function indicadoresExtrato(indicadores) {
  const celulas = indicadores
    .map(
      (ind, i) => `
      <div style="padding:12px 16px;${i < indicadores.length - 1 ? `border-right:1px solid ${EXP.bordaSuave};` : ""}display:flex;flex-direction:column;gap:4px;${ind.destaque ? "background:#FDF3F5;" : ""}">
        <span style="font:600 9px/1 'IBM Plex Sans',sans-serif;letter-spacing:.11em;color:${EXP.texto2}">${ind.rotulo}</span>
        <span style="font:600 19px/1 'IBM Plex Mono',monospace;color:${ind.cor || EXP.navy}">${ind.valor}</span>
      </div>`
    )
    .join("");
  return `<div style="display:grid;grid-template-columns:repeat(${indicadores.length},1fr);border:1px solid ${EXP.borda};border-radius:8px;overflow:hidden;margin-bottom:26px">${celulas}</div>`;
}

function blocoJanelasLivres(janelas) {
  if (!janelas.length) return "";
  const chips = janelas
    .map(
      (j) =>
        `<span style="font:500 11.5px/1 'IBM Plex Mono',monospace;color:${EXP.verde};border:1px dashed #C9DED6;background:#F4F8F6;border-radius:999px;padding:6px 12px">${hhmmDeMinutos(j[0])} – ${hhmmDeMinutos(j[1])} · ${duracaoCurta(j[1] - j[0])}</span>`
    )
    .join("");
  return `
    <div style="margin-top:16px;display:flex;flex-direction:column;gap:6px;break-inside:avoid">
      <span style="font:600 9px/1 'IBM Plex Sans',sans-serif;letter-spacing:.11em;color:${EXP.texto2}">JANELAS LIVRES</span>
      <div style="display:flex;gap:8px;flex-wrap:wrap">${chips}</div>
    </div>`;
}

function avisoSobreposicao(analise) {
  if (!analise || !analise.paresConflito.length) return "";
  const [a, b] = analise.paresConflito[0];
  const minutos = Math.min(a.fim, b.fim) - Math.max(a.ini, b.ini);
  const extras =
    analise.paresConflito.length > 1
      ? ` Há ainda ${analise.paresConflito.length - 1} outra${analise.paresConflito.length - 1 === 1 ? "" : "s"} sobreposição${analise.paresConflito.length - 1 === 1 ? "" : "ões"} no dia.`
      : "";
  return `
    <div style="display:flex;align-items:flex-start;gap:10px;margin-top:18px;padding:11px 14px;border-radius:7px;background:#FDECEF;border:1px solid #F6C4CE;break-inside:avoid">
      <span style="font:600 11.5px/1.45 'IBM Plex Sans',sans-serif;color:${EXP.vermelhoTexto};flex:0 0 auto">Atenção:</span>
      <span style="font:400 11.5px/1.45 'IBM Plex Sans',sans-serif;color:${EXP.vermelhoTexto};text-wrap:pretty">a ${escapeHtml(
        a.evento.titulo
      )} (${hhmmDeMinutos(a.ini)}–${hhmmDeMinutos(a.fim)}) sobrepõe a ${escapeHtml(b.evento.titulo)} (${hhmmDeMinutos(
    b.ini
  )}–${hhmmDeMinutos(b.fim)}) em ${duracaoCurta(minutos)}.${extras}</span>
    </div>`;
}

/**
 * Extrato diário em A4 retrato (794 × 1123 px a 96dpi), pronto para imprimir
 * ou salvar em PDF. Um único dia cabe em uma página; períodos maiores
 * repetem o bloco de dia com um subtítulo por data.
 */
function construirExtratoA4(grupos, totalFiltrados, opcoes) {
  const { densidade } = state.exportacao;
  const { incluirCancelados, incluirJanelas, linhaAssinatura } = opcoes;

  const gruposVisiveis = grupos
    .map((g) => ({
      ...g,
      eventos: incluirCancelados ? g.eventos : g.eventos.filter((it) => !it.evento.cancelado),
    }))
    .filter((g) => g.eventos.length > 0);

  const diaUnico = gruposVisiveis.length === 1;
  const analiseUnica = diaUnico ? analisarDia(gruposVisiveis[0].eventos, gruposVisiveis[0].chave) : null;

  // Indicadores: no dia, os quatro do redesenho; no período, totais.
  let indicadores;
  if (analiseUnica) {
    indicadores = [
      { rotulo: "COMPROMISSOS", valor: analiseUnica.blocos.length + analiseUnica.contínuos.length },
      { rotulo: "OCUPAÇÃO", valor: duracaoCurta(analiseUnica.ocupadoMin) },
      { rotulo: "JANELAS LIVRES", valor: duracaoCurta(analiseUnica.livreMin), cor: EXP.verde },
      {
        rotulo: "SOBREPOSIÇÕES",
        valor: analiseUnica.paresConflito.length,
        cor: analiseUnica.paresConflito.length ? EXP.vermelho : EXP.navy,
        destaque: analiseUnica.paresConflito.length > 0,
      },
    ];
  } else {
    const totalDias = gruposVisiveis.length;
    const totalItens = gruposVisiveis.reduce((a, g) => a + g.eventos.length, 0);
    const cancelados = gruposVisiveis.reduce(
      (a, g) => a + g.eventos.filter((it) => it.evento.cancelado).length,
      0
    );
    const sobrepostos = gruposVisiveis.reduce(
      (a, g) => a + analisarDia(g.eventos, g.chave).paresConflito.length,
      0
    );
    indicadores = [
      { rotulo: "COMPROMISSOS", valor: totalItens },
      { rotulo: "DIAS COM AGENDA", valor: totalDias },
      { rotulo: "CANCELADOS", valor: cancelados },
      {
        rotulo: "SOBREPOSIÇÕES",
        valor: sobrepostos,
        cor: sobrepostos ? EXP.vermelho : EXP.navy,
        destaque: sobrepostos > 0,
      },
    ];
  }

  const tituloDocumento = diaUnico
    ? dataLongaDaChave(gruposVisiveis[0].chave)
    : subtituloDaPagina();

  let corpo = "";
  if (gruposVisiveis.length === 0) {
    corpo = `<div style="padding:40px 0;text-align:center;font:400 12px/1.6 'IBM Plex Sans',sans-serif;color:${EXP.texto2}">Nenhum compromisso encontrado para os filtros selecionados.</div>`;
  } else {
    gruposVisiveis.forEach((grupo) => {
      const analise = analisarDia(grupo.eventos, grupo.chave);
      const linhas = analise.contínuos
        .map((it) => linhaExtratoA4({ ...it, ini: 0, fim: 1440, dur: 1440 }, analise, densidade))
        .concat(analise.blocos.map((bloco) => linhaExtratoA4(bloco, analise, densidade)))
        .join("");

      corpo += `
        <div style="break-inside:avoid">
          ${
            diaUnico
              ? ""
              : `<div style="display:flex;align-items:center;gap:10px;margin:20px 0 6px;break-after:avoid">
                   <span style="font:600 12px/1 'IBM Plex Sans',sans-serif;color:${EXP.navy}">${escapeHtml(dataLongaDaChave(grupo.chave))}</span>
                   <span style="flex:1;height:1px;background:${EXP.borda}"></span>
                   <span style="font:400 10px/1 'IBM Plex Mono',monospace;color:${EXP.texto3}">${grupo.eventos.length} compromisso${grupo.eventos.length === 1 ? "" : "s"}</span>
                 </div>`
          }
          <div style="display:grid;grid-template-columns:96px 1fr;gap:18px;padding:0 0 9px;border-bottom:1px solid ${EXP.borda}">
            <span style="font:600 9px/1 'IBM Plex Sans',sans-serif;letter-spacing:.11em;color:${EXP.texto2}">HORÁRIO</span>
            <span style="font:600 9px/1 'IBM Plex Sans',sans-serif;letter-spacing:.11em;color:${EXP.texto2}">COMPROMISSO</span>
          </div>
          ${linhas}
          ${diaUnico ? avisoSobreposicao(analise) : ""}
          ${diaUnico && incluirJanelas ? blocoJanelasLivres(analise.janelas) : ""}
        </div>`;
    });
  }

  const assinatura = linhaAssinatura
    ? `<div style="margin-top:38px;display:flex;justify-content:flex-end;break-inside:avoid">
         <div style="width:280px;display:flex;flex-direction:column;align-items:center;gap:7px">
           <span style="width:100%;height:1px;background:${EXP.tinta}"></span>
           <span style="font:500 11px/1.4 'IBM Plex Sans',sans-serif;color:${EXP.textoForte};text-align:center">Chefia de Gabinete</span>
         </div>
       </div>`
    : "";

  const paper = document.createElement("div");
  paper.className = "export-paper";
  paper.style.cssText =
    "width:794px;min-height:1123px;background:#fff;padding:52px 56px 44px;display:flex;flex-direction:column;" +
    "font-family:'IBM Plex Sans',system-ui,Arial,sans-serif;color:" + EXP.tinta + ";box-sizing:border-box;";

  paper.innerHTML = `
    <div style="display:flex;align-items:flex-start;justify-content:space-between;gap:24px">
      <div style="display:flex;align-items:center;gap:14px">
        ${marcaImg("tcm-lockup.png", 46, "Tribunal de Contas dos Municípios do Estado da Bahia")}
        ${marcaImg("tcm-55.png", 46, "55 anos de serviços prestados à sociedade")}
      </div>
      <div style="display:flex;flex-direction:column;align-items:flex-end;gap:4px;padding-top:2px;text-align:right">
        <span style="font:700 13px/1 'IBM Plex Sans',sans-serif;letter-spacing:.02em;color:${EXP.navy}">AGENDA INSTITUCIONAL</span>
        <span style="font:400 11.5px/1 'IBM Plex Sans',sans-serif;color:${EXP.texto2}">Gabinete da Presidência</span>
        <span style="font:400 11px/1 'IBM Plex Mono',monospace;color:${EXP.texto3}">SAA · Sistema de Agenda Automatizada</span>
      </div>
    </div>

    <div style="display:flex;margin:16px 0 26px">
      <span style="width:64px;height:3px;background:${EXP.vermelho}"></span>
      <span style="flex:1;height:3px;background:${EXP.navy}"></span>
    </div>

    <div style="display:flex;align-items:flex-end;justify-content:space-between;gap:28px;margin-bottom:22px">
      <div style="display:flex;flex-direction:column;gap:6px;min-width:0">
        <span style="font:600 10px/1 'IBM Plex Sans',sans-serif;letter-spacing:.13em;color:${EXP.texto2}">${diaUnico ? "EXTRATO DIÁRIO" : "EXTRATO DE PERÍODO"}</span>
        <h1 style="margin:0;font:700 27px/1.15 Bitter,Georgia,serif;color:${EXP.navy};letter-spacing:-.015em;text-wrap:pretty">${escapeHtml(tituloDocumento)}</h1>
      </div>
      <div style="flex:0 0 auto;text-align:right;font:400 10.5px/1.6 'IBM Plex Sans',sans-serif;color:${EXP.texto2}">
        Emitido em <span style="font-family:'IBM Plex Mono',monospace;color:${EXP.tinta}">${formatarDataHora(new Date())}</span><br>
        Fuso horário America/Bahia
      </div>
    </div>

    ${indicadoresExtrato(indicadores)}

    <div style="display:flex;flex-direction:column;flex:1">
      ${corpo}
      ${assinatura}
    </div>

    <div style="margin-top:auto;padding-top:16px;border-top:1px solid ${EXP.borda};display:flex;align-items:flex-end;justify-content:space-between;gap:20px">
      <div style="font:400 10px/1.6 'IBM Plex Sans',sans-serif;color:${EXP.texto3};max-width:460px;text-wrap:pretty">
        Documento gerado automaticamente pelo SAA a partir do Google Agenda. Alterações devem ser feitas no calendário de origem.${USE_DEMO_DATA ? " Dados fictícios de demonstração." : ""}
      </div>
      <div style="font:400 10px/1.6 'IBM Plex Mono',monospace;color:${EXP.texto3};text-align:right;flex:0 0 auto">
        TCM-BA · SAA<br>${totalFiltrados} compromisso${totalFiltrados === 1 ? "" : "s"}
      </div>
    </div>
  `;
  return paper;
}

/* --------------------------------------------------------------------------
   CARD DE COMPARTILHAMENTO EM JPEG (mobile)
   -------------------------------------------------------------------------- */

// Um compromisso no card: faixa de cor à esquerda, horário em coluna
// monoespaçada e título com o local abaixo.
function cartaoMobile(bloco, analise, escala) {
  const { evento } = bloco;
  const cat = expCat(evento.categoria);
  const cancelado = !!evento.cancelado;
  const emAndamento = analise.emAndamento && analise.emAndamento.evento.id === evento.id;
  const temConflito = analise.idsConflito.has(evento.id);
  const px = (v) => `${Math.round(v * escala)}px`;

  const fundo = cancelado ? "#FEF7F8" : emAndamento ? "#F2FAF7" : "#fff";
  const borda = cancelado ? "2px solid #F6C4CE" : emAndamento ? "2px solid #C4E3D9" : `1px solid ${EXP.borda}`;
  const corFaixa = cancelado ? EXP.vermelho : cat.cor;

  const marcadores = [];
  if (emAndamento) {
    marcadores.push(
      `<span style="font:600 ${px(15)}/1 'IBM Plex Sans',sans-serif;letter-spacing:.07em;color:#0F7B5F;background:#fff;border:1px solid #C4E3D9;border-radius:${px(7)};padding:${px(6)} ${px(10)}">AGORA</span>`
    );
  }
  if (temConflito && !cancelado) {
    marcadores.push(
      `<span style="font:600 ${px(15)}/1 'IBM Plex Sans',sans-serif;letter-spacing:.07em;color:${EXP.vermelhoForte};background:#FDECEF;border:1px solid #F6C4CE;border-radius:${px(7)};padding:${px(6)} ${px(10)}">CONFLITO</span>`
    );
  }

  const modalidade = `${evento.local ? escapeHtml(evento.local) + " · " : ""}${cat.label}`;

  return `
    <div style="position:relative;display:grid;grid-template-columns:${px(150)} 1fr;gap:${px(24)};padding:${px(24)} ${px(26)} ${px(24)} ${px(30)};background:${fundo};border:${borda};border-radius:${px(18)};flex:0 0 auto;box-shadow:0 ${px(2)} ${px(8)} rgba(11,49,99,.05)">
      <span style="position:absolute;left:0;top:0;bottom:0;width:${px(8)};background:${corFaixa};border-radius:${px(18)} 0 0 ${px(18)}"></span>
      <div style="display:flex;flex-direction:column;gap:${px(4)}">
        <span style="font:600 ${px(34)}/1.1 'IBM Plex Mono',monospace;color:${cancelado ? EXP.vermelhoForte : emAndamento ? "#0F7B5F" : EXP.navy}${cancelado ? ";text-decoration:line-through" : ""}">${evento.diaInteiro ? "Dia" : hhmmDeMinutos(bloco.ini)}</span>
        <span style="font:400 ${px(20)}/1.2 'IBM Plex Mono',monospace;color:${EXP.texto3}">${evento.diaInteiro ? "inteiro" : duracaoCurta(bloco.dur)}</span>
      </div>
      <div style="display:flex;flex-direction:column;gap:${px(9)};min-width:0">
        <div style="display:flex;align-items:center;gap:${px(10)};flex-wrap:wrap">
          <span style="font:700 ${px(30)}/1.3 'IBM Plex Sans',sans-serif;color:${cancelado ? EXP.cancelTitulo : EXP.tinta}${cancelado ? ";text-decoration:line-through" : ""};text-wrap:pretty">${escapeHtml(evento.titulo)}</span>
          ${marcadores.join("")}
        </div>
        ${
          cancelado
            ? `<span style="font:600 ${px(17)}/1 'IBM Plex Sans',sans-serif;letter-spacing:.08em;color:${EXP.vermelhoForte}">CANCELADO</span>`
            : `<span style="font:400 ${px(22)}/1.35 'IBM Plex Sans',sans-serif;color:${EXP.texto2};text-wrap:pretty">${modalidade}</span>`
        }
      </div>
    </div>`;
}

/**
 * Card de compartilhamento em JPEG, 1080 × 1920 (story 9:16) ou 1080 × 1350
 * (feed 4:5). No formato feed há 570px a menos de altura: o cabeçalho
 * comprime e os blocos opcionais saem, senão os compromissos do fim do dia
 * seriam cortados.
 */
function construirCardMobile(grupos, totalFiltrados, opcoes) {
  const { proporcao, incluirCancelados, incluirJanelas } = opcoes;
  const feed = proporcao === "feed";
  const largura = 1080;
  const alturaMinima = feed ? 1350 : 1920;
  const escala = 1;
  const px = (v) => `${Math.round(v * escala)}px`;

  const gruposVisiveis = grupos
    .map((g) => ({
      ...g,
      eventos: incluirCancelados && !feed ? g.eventos : g.eventos.filter((it) => !it.evento.cancelado),
    }))
    .filter((g) => g.eventos.length > 0);

  const diaUnico = gruposVisiveis.length === 1;
  const primeiro = gruposVisiveis[0];
  const analise = primeiro ? analisarDia(primeiro.eventos, primeiro.chave) : null;

  const dataRef = primeiro ? new Date(`${primeiro.chave}T12:00:00${offsetBahia()}`) : new Date();
  const diaSemana = new Intl.DateTimeFormat("pt-BR", { timeZone: DISPLAY_TIMEZONE, weekday: "long" })
    .format(dataRef)
    .toUpperCase();
  const diaMes = new Intl.DateTimeFormat("pt-BR", { timeZone: DISPLAY_TIMEZONE, day: "2-digit", month: "short" })
    .format(dataRef)
    .replace(".", "")
    .toUpperCase();

  const totalDoCard = gruposVisiveis.reduce((a, g) => a + g.eventos.length, 0);
  const ocupacao = analise ? duracaoCurta(analise.ocupadoMin) : "—";
  const conflitos = analise ? analise.paresConflito.length : 0;

  const indicador = (rotulo, valor, alerta) => `
    <div style="flex:1;padding:${px(20)} ${px(22)};border-radius:${px(16)};background:${alerta ? "rgba(216,4,37,.26)" : "rgba(255,255,255,.1)"};border:1px solid ${alerta ? "rgba(243,179,190,.4)" : "rgba(255,255,255,.18)"};display:flex;flex-direction:column;gap:${px(8)}">
      <span style="font:600 ${px(18)}/1 'IBM Plex Sans',sans-serif;letter-spacing:.1em;color:${alerta ? "#F3B3BE" : "#9FB6D8"}">${rotulo}</span>
      <span style="font:600 ${px(40)}/1 'IBM Plex Mono',monospace;color:#fff">${valor}</span>
    </div>`;

  let listaCards = "";
  if (!gruposVisiveis.length) {
    listaCards = `<div style="padding:${px(60)} 0;text-align:center;font:400 ${px(26)}/1.5 'IBM Plex Sans',sans-serif;color:${EXP.texto2}">Nenhum compromisso encontrado para os filtros selecionados.</div>`;
  } else {
    gruposVisiveis.forEach((grupo) => {
      const analiseGrupo = analisarDia(grupo.eventos, grupo.chave);
      if (!diaUnico) {
        listaCards += `<div style="font:600 ${px(20)}/1 'IBM Plex Sans',sans-serif;letter-spacing:.12em;color:${EXP.texto2};padding-top:${px(10)};flex:0 0 auto">${escapeHtml(dataLongaDaChave(grupo.chave).toUpperCase())}</div>`;
      }
      listaCards += analiseGrupo.contínuos
        .map((it) => cartaoMobile({ ...it, ini: 0, fim: 1440, dur: 1440 }, analiseGrupo, escala))
        .join("");
      listaCards += analiseGrupo.blocos.map((bloco) => cartaoMobile(bloco, analiseGrupo, escala)).join("");
    });
  }

  const blocoJanelas =
    !feed && incluirJanelas && analise && diaUnico && analise.janelas.length
      ? `<div style="display:flex;flex-direction:column;gap:${px(12)};padding-top:${px(6)};flex:0 0 auto">
           <span style="font:600 ${px(17)}/1 'IBM Plex Sans',sans-serif;letter-spacing:.12em;color:${EXP.texto2}">JANELAS LIVRES</span>
           <div style="display:flex;gap:${px(12)};flex-wrap:wrap">
             ${analise.janelas
               .map(
                 (j) =>
                   `<span style="font:500 ${px(21)}/1 'IBM Plex Mono',monospace;color:${EXP.verde};background:#F4F8F6;border:1px dashed #C9DED6;border-radius:999px;padding:${px(12)} ${px(20)}">${hhmmDeMinutos(j[0])} – ${hhmmDeMinutos(j[1])}</span>`
               )
               .join("")}
           </div>
         </div>`
      : "";

  const paper = document.createElement("div");
  paper.className = "export-paper";
  paper.style.cssText =
    `width:${largura}px;min-height:${alturaMinima}px;display:flex;flex-direction:column;background:${EXP.painel};` +
    "overflow:hidden;box-sizing:border-box;font-family:'IBM Plex Sans',system-ui,Arial,sans-serif;color:" + EXP.tinta + ";";

  paper.innerHTML = `
    <div style="background:linear-gradient(150deg,${EXP.navy} 0%,${EXP.navyMid} 55%,${EXP.navyEscuro} 100%);padding:${feed ? `${px(44)} ${px(60)} ${px(38)}` : `${px(64)} ${px(60)} ${px(52)}`};display:flex;flex-direction:column;gap:${feed ? px(26) : px(38)};flex:0 0 auto">
      <div style="display:flex;align-items:center;gap:${px(22)}">
        <div style="width:${px(96)};height:${px(96)};border-radius:${px(20)};background:#fff;display:flex;align-items:center;justify-content:center;overflow:hidden;flex:0 0 auto">
          ${marcaImg("tcm-mark.png", 78, "TCM-BA")}
        </div>
        <div style="display:flex;flex-direction:column;gap:${px(8)}">
          <span style="font:700 ${px(34)}/1 'IBM Plex Sans',sans-serif;color:#fff;letter-spacing:-.01em">Agenda Institucional</span>
          <span style="font:400 ${px(24)}/1.3 'IBM Plex Sans',sans-serif;color:#9FB6D8">Tribunal de Contas dos Municípios<br>do Estado da Bahia</span>
        </div>
      </div>

      <div style="display:flex;flex-direction:column;gap:${px(10)}">
        <span style="font:600 ${px(22)}/1 'IBM Plex Sans',sans-serif;letter-spacing:.16em;color:#7B95BF">${diaUnico ? escapeHtml(diaSemana) : escapeHtml(subtituloDaPagina().toUpperCase())}</span>
        <span style="font:700 ${feed ? px(68) : px(92)}/1 Bitter,Georgia,serif;color:#fff;letter-spacing:-.03em">${diaUnico ? escapeHtml(diaMes) : `${totalDoCard} COMPROMISSOS`}</span>
      </div>

      <div style="display:flex;gap:${px(14)}">
        ${indicador("COMPROMISSOS", totalDoCard, false)}
        ${indicador("OCUPAÇÃO", ocupacao, false)}
        ${indicador("CONFLITOS", conflitos, conflitos > 0)}
      </div>
    </div>

    <div style="flex:1;background:${EXP.painel};padding:${px(44)} ${px(60)} ${px(44)};display:flex;flex-direction:column;gap:${px(20)}">
      ${listaCards}
      ${blocoJanelas}
    </div>

    <div style="flex:0 0 auto;background:#fff;border-top:1px solid ${EXP.borda};padding:${px(30)} ${px(60)};display:flex;align-items:center;gap:${px(22)}">
      ${marcaImg("tcm-lockup.png", 62, "Tribunal de Contas dos Municípios do Estado da Bahia")}
      <div style="margin-left:auto;display:flex;flex-direction:column;gap:${px(5)};align-items:flex-end">
        <span style="font:600 ${px(19)}/1 'IBM Plex Sans',sans-serif;color:${EXP.navy}">SAA · Agenda Institucional</span>
        <span style="font:400 ${px(17)}/1 'IBM Plex Mono',monospace;color:${EXP.texto2}">atualizado às ${formatarHora(new Date())}</span>
      </div>
    </div>
  `;
  return paper;
}

// Opções de conteúdo escolhidas no painel de exportação.
function opcoesExportacao() {
  const ler = (id, padrao) => {
    const el = document.getElementById(id);
    return el ? el.checked : padrao;
  };
  return {
    proporcao: state.exportacao.proporcao,
    incluirCancelados: ler("export-incluir-cancelados", true),
    incluirJanelas: ler("export-incluir-janelas", true),
    linhaAssinatura: ler("export-linha-assinatura-check", false),
  };
}

// Ponto único de construção do artefato — a pré-visualização e o arquivo
// baixado passam pela mesma função, então o que se vê é o que sai.
function construirPaperExport(grupos, totalFiltrados) {
  const opcoes = opcoesExportacao();
  return state.exportacao.formato === "a4"
    ? construirExtratoA4(grupos, totalFiltrados, opcoes)
    : construirCardMobile(grupos, totalFiltrados, opcoes);
}

// Carrega a assinatura institucional do TCM-BA como data URL uma única vez,
// para uso nos cabeçalhos do PDF (jsPDF) e do JPEG (HTML/html2canvas). O SVG
// é convertido em data URL porque o html2canvas só rasteriza imagens que não
// dependem de uma nova requisição de rede durante a captura.
async function aguardarImagensCarregadas(container) {
  const imagens = Array.from(container.querySelectorAll("img"));
  await Promise.all(
    imagens.map((img) =>
      img.complete
        ? Promise.resolve()
        : new Promise((resolve) => {
            img.onload = resolve;
            img.onerror = resolve;
          })
    )
  );
}

async function renderizarCanvasElemento(el, escala) {
  document.getElementById("export-sandbox").appendChild(el);
  // setTimeout em vez de requestAnimationFrame: rAF não dispara em abas
  // em segundo plano/sem foco, o que travaria a exportação indefinidamente.
  await new Promise((r) => setTimeout(r, 0));
  await aguardarImagensCarregadas(el);
  const canvas = await html2canvas(el, { scale: escala, backgroundColor: "#ffffff", useCORS: true });
  el.remove();
  return canvas;
}

/* ==========================================================================
   OVERLAY DE EXPORTAÇÃO (formato, densidade, pré-visualização e download)
   ========================================================================== */

// Renderiza a pré-visualização do papel de exportação dentro do overlay.
function renderizarPreviewExport(filtrados) {
  const alvo = document.getElementById("export-preview");
  if (!alvo) return;
  const lista = filtrados || obterEventosFiltrados();
  const grupos = agruparPorDia(lista);
  const paper = construirPaperExport(grupos, lista.length);

  // O papel é construído no tamanho real do artefato (794px no A4, 1080px no
  // card) e apenas *exibido* reduzido. Reduzir com transform em vez de mudar
  // as medidas mantém a pré-visualização fiel ao arquivo que será baixado.
  alvo.innerHTML = "";
  const palco = document.createElement("div");
  palco.className = "export-preview__palco";
  palco.appendChild(paper);
  alvo.appendChild(palco);
  ajustarEscalaPreview();
}

// Ajusta a redução da pré-visualização ao espaço disponível no palco.
function ajustarEscalaPreview() {
  const alvo = document.getElementById("export-preview");
  const palco = alvo && alvo.querySelector(".export-preview__palco");
  const paper = palco && palco.querySelector(".export-paper");
  if (!paper) return;

  const disponivel = alvo.clientWidth || alvo.parentElement.clientWidth;
  const larguraPapel = paper.offsetWidth || 794;
  if (disponivel <= 0) return; // painel ainda oculto: nada a medir
  const escala = Math.max(0.1, Math.min(1, (disponivel - 8) / larguraPapel));
  palco.style.transform = `scale(${escala})`;
  palco.style.width = `${larguraPapel}px`;
  palco.style.height = `${paper.offsetHeight * escala}px`;
}

let elementoComFocoAntesDoExport = null;

function abrirOverlayExport() {
  elementoComFocoAntesDoExport = document.activeElement;
  const overlay = document.getElementById("export-backdrop");
  overlay.hidden = false;
  document.body.style.overflow = "hidden";
  renderizarPreviewExport();
  document.getElementById("btn-fechar-export").focus();
}

function fecharOverlayExport() {
  const overlay = document.getElementById("export-backdrop");
  if (overlay.hidden) return;
  overlay.hidden = true;
  document.body.style.overflow = "";
  if (elementoComFocoAntesDoExport && document.contains(elementoComFocoAntesDoExport)) {
    elementoComFocoAntesDoExport.focus();
  }
}

// Captura o papel visível na pré-visualização e gera JPEG ou PDF — a saída
// reflete exatamente o que está na tela (WYSIWYG). No formato A4 o conteúdo é
// fatiado por página; no mobile vira uma única página longa.
async function exportarPapel(tipo) {
  if (!window.html2canvas) throw new Error("Biblioteca de captura indisponível.");
  await precarregarMarcas();

  const { formato, proporcao } = state.exportacao;
  const lista = obterEventosFiltrados();
  const grupos = agruparPorDia(lista);

  // O artefato baixado é construído do zero, no tamanho real, e rasterizado
  // fora da tela — a pré-visualização aparece reduzida por transform, e
  // capturar o elemento reduzido produziria um arquivo de baixa resolução.
  const paper = construirPaperExport(grupos, lista.length);
  const escala = formato === "a4" ? 2.5 : 1.5;
  const canvas = await renderizarCanvasElemento(paper, escala);

  const carimbo = new Date().toISOString().slice(0, 10);
  const sufixo = formato === "a4" ? "extrato" : proporcao === "feed" ? "card-feed" : "card-story";
  const nomeBase = `agenda-tcm-ba-${carimbo}-${sufixo}`;

  if (tipo === "jpeg") {
    const link = document.createElement("a");
    link.download = `${nomeBase}.jpg`;
    link.href = canvas.toDataURL("image/jpeg", 0.95);
    link.click();
    return;
  }

  const { jsPDF } = window.jspdf;
  const img = canvas.toDataURL("image/jpeg", 0.95);

  if (formato === "a4") {
    // O extrato já é desenhado na proporção do A4 (794 × 1123 px a 96dpi),
    // então a imagem ocupa a página inteira, sem margens artificiais. Quando
    // o período exportado passa de uma página, a mesma imagem é reposicionada
    // página a página.
    const pdf = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
    const larguraMm = 210;
    const alturaPaginaMm = 297;
    const alturaTotalMm = (canvas.height * larguraMm) / canvas.width;
    let deslocamento = 0;
    let primeira = true;
    while (deslocamento < alturaTotalMm - 1) {
      if (!primeira) pdf.addPage();
      pdf.addImage(img, "JPEG", 0, -deslocamento, larguraMm, alturaTotalMm);
      deslocamento += alturaPaginaMm;
      primeira = false;
    }
    pdf.save(`${nomeBase}.pdf`);
    return;
  }

  // Card mobile em PDF: página sob medida, com a mesma proporção da imagem.
  const larguraMm = 120;
  const alturaMm = (canvas.height * larguraMm) / canvas.width;
  const pdf = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: [larguraMm, Math.min(alturaMm, 5000)],
  });
  pdf.addImage(img, "JPEG", 0, 0, larguraMm, alturaMm);
  pdf.save(`${nomeBase}.pdf`);
}

/* ==========================================================================
   EXPORTAÇÃO EM TEXTO (modal)
   ========================================================================== */

// Mesmo conteúdo minimalista das exportações em PDF/JPEG (horário, título,
// categoria, link só para pauta online, aviso de cancelamento), em texto
// simples — respeita os filtros ativos, igual às demais exportações.
function construirTextoAgenda() {
  const eventos = obterEventosFiltrados();
  const grupos = agruparPorDia(eventos);
  const linhas = [];

  linhas.push("SAA — Agenda Institucional do TCM-BA");
  linhas.push("Gerado em " + formatarDataHora(new Date()));
  linhas.push("");

  if (eventos.length === 0) {
    linhas.push("Nenhum compromisso encontrado para os filtros selecionados.");
    return linhas.join("\n");
  }

  grupos.forEach((grupo) => {
    linhas.push(grupo.rotulo.toUpperCase());
    grupo.eventos.forEach(({ evento, diaChave }) => {
      const horario = horarioResumoPorDia(evento, diaChave);
      const aviso = evento.cancelado ? "  [⚠ CANCELADO]" : "";
      const continuo = eventoEhContinuo(evento)
        ? `  [vários dias: ${formatarDataCurta(new Date(evento.inicio))} a ${formatarDataCurta(dataFimInclusivo(evento))}]`
        : "";
      linhas.push(`  ${horario} | ${CATEGORIA_LABEL[evento.categoria]} | ${evento.titulo}${aviso}${continuo}`);
      if (evento.categoria === "pauta-online" && evento.link) {
        linhas.push(`      Link: ${evento.link}`);
      }
    });
    linhas.push("");
  });

  return linhas.join("\n").trim();
}

function abrirModalTexto() {
  document.getElementById("text-export-conteudo").value = construirTextoAgenda();
  document.getElementById("text-export-copiado").hidden = true;
  document.getElementById("text-export-modal").hidden = false;
  document.getElementById("text-export-backdrop").hidden = false;
  document.getElementById("text-export-conteudo").focus();
}

function fecharModalTexto() {
  document.getElementById("text-export-modal").hidden = true;
  document.getElementById("text-export-backdrop").hidden = true;
}

/* ==========================================================================
   LIGAÇÃO DE EVENTOS DE INTERFACE
   ========================================================================== */

function configurarChipGroup(seletor, callback, multipla) {
  const grupo = document.querySelector(seletor);
  grupo.addEventListener("click", (ev) => {
    const btn = ev.target.closest(".chip");
    if (!btn) return;

    if (multipla) {
      btn.classList.toggle("is-active");
    } else {
      grupo.querySelectorAll(".chip").forEach((c) => c.classList.remove("is-active"));
      btn.classList.add("is-active");
    }
    callback(btn, grupo);
  });
}

function inicializarInterface() {
  inicializarTema();
  document.getElementById("btn-tema").addEventListener("click", alternarTema);

  // Sem URL configurada não há para onde apontar o botão.
  const btnCalendario = document.getElementById("btn-abrir-calendario");
  if (CALENDAR_HTML_URL) {
    btnCalendario.href = CALENDAR_HTML_URL;
  } else {
    btnCalendario.hidden = true;
  }

  document.getElementById("btn-atualizar").addEventListener("click", () => atualizarAgenda());
  document.getElementById("btn-tentar-novamente").addEventListener("click", () => atualizarAgenda());

  document.getElementById("busca").addEventListener("input", (ev) => {
    state.filtros.busca = ev.target.value;
    renderizarConteudo();
  });

  document.getElementById("mostrar-concluidos").addEventListener("change", (ev) => {
    state.filtros.mostrarConcluidos = ev.target.checked;
    renderizarConteudo();
  });

  const inputDataInicio = document.getElementById("filtro-data-inicio");
  const inputDataFim = document.getElementById("filtro-data-fim");
  const btnLimparDatas = document.getElementById("btn-limpar-datas");

  // Valida o intervalo (Até >= De) antes de aplicar ao filtro — em caso de
  // erro, mantém o filtro anterior válido e exibe uma mensagem clara.
  function aplicarFiltroDeData() {
    const inicio = inputDataInicio.value || null;
    const fim = inputDataFim.value || null;

    if (inicio && fim && fim < inicio) {
      mostrarErroData('A data "Até" precisa ser igual ou posterior à data "De".');
      return;
    }

    esconderErroData();
    state.filtros.dataInicio = inicio;
    state.filtros.dataFim = fim;

    // Escolher uma data manda no que é exibido. Sem devolver o período para
    // "Todos", a tela ficaria contraditória: chip "Hoje" aceso enquanto se
    // exibe outro dia.
    if (inicio || fim) {
      state.filtros.periodo = "todos";
      sincronizarChipsPeriodo();
    }

    atualizarVisibilidadeBtnLimparDatas();
    renderizarConteudo();
  }

  inputDataInicio.addEventListener("change", aplicarFiltroDeData);
  inputDataFim.addEventListener("change", aplicarFiltroDeData);

  btnLimparDatas.addEventListener("click", () => {
    limparFiltroDeData();
    renderizarConteudo();
  });

  configurarChipGroup(
    "#periodo-group",
    (btn) => {
      state.filtros.periodo = btn.dataset.periodo;
      // Caminho inverso do de cima: escolher um período descarta o intervalo
      // digitado, para que os dois controles nunca disputem a mesma janela.
      limparFiltroDeData();
      renderizarConteudo();
    },
    false
  );

  // Lista de categorias (sidebar): alterna a categoria clicada.
  document.getElementById("categoria-lista").addEventListener("click", (ev) => {
    const item = ev.target.closest(".cat-list__item");
    if (!item) return;
    const categoria = item.dataset.categoria;
    if (state.filtros.categorias.has(categoria)) state.filtros.categorias.delete(categoria);
    else state.filtros.categorias.add(categoria);
    renderizarConteudo();
    if (window.innerWidth <= 860) fecharSidebarMobile();
  });

  // ---------------------------------------------------------------------
  // Overlay de exportação
  // ---------------------------------------------------------------------

  document.getElementById("btn-abrir-export").addEventListener("click", abrirOverlayExport);

  // A pré-visualização é reduzida por transform: ao mudar a largura da
  // janela, a redução precisa ser recalculada, senão sobra ou falta espaço.
  window.addEventListener("resize", () => {
    if (!document.getElementById("export-backdrop").hidden) ajustarEscalaPreview();
  });
  document.getElementById("btn-fechar-export").addEventListener("click", fecharOverlayExport);
  document.getElementById("export-backdrop").addEventListener("click", (ev) => {
    // Fecha apenas ao clicar no fundo escurecido, fora do painel/preview.
    if (ev.target.id === "export-backdrop") fecharOverlayExport();
  });

  // Seleção de formato e densidade — atualiza a pré-visualização ao vivo.
  function ligarOpcoesExport(seletor, aoEscolher) {
    const grupo = document.querySelector(seletor);
    grupo.addEventListener("click", (ev) => {
      const btn = ev.target.closest(".opt-card");
      if (!btn) return;
      grupo.querySelectorAll(".opt-card").forEach((c) => c.classList.remove("is-active"));
      btn.classList.add("is-active");
      aoEscolher(btn);
      renderizarPreviewExport();
    });
  }
  ligarOpcoesExport("#export-formato-group", (btn) => {
    state.exportacao.formato = btn.dataset.formato;
    sincronizarOpcoesExport();
  });
  ligarOpcoesExport("#export-densidade-group", (btn) => {
    state.exportacao.densidade = btn.dataset.densidade;
  });
  ligarOpcoesExport("#export-proporcao-group", (btn) => {
    state.exportacao.proporcao = btn.dataset.proporcao;
  });

  // Alternadores de conteúdo (cancelados, janelas livres, assinatura).
  ["export-incluir-cancelados", "export-incluir-janelas", "export-linha-assinatura-check"].forEach((id) => {
    const campo = document.getElementById(id);
    if (campo) campo.addEventListener("change", () => renderizarPreviewExport());
  });

  sincronizarOpcoesExport();

  // Cada artefato tem controles próprios: o extrato A4 não tem proporção de
  // story, e o card mobile não tem linha de assinatura.
  function sincronizarOpcoesExport() {
    const ehA4 = state.exportacao.formato === "a4";
    const alternar = (id, visivel) => {
      const el = document.getElementById(id);
      if (el) el.hidden = !visivel;
    };
    alternar("export-bloco-a4", ehA4);
    alternar("export-bloco-mobile", !ehA4);
    alternar("export-linha-assinatura", ehA4);
    alternar("export-linha-janelas", true);

    const btnJpeg = document.getElementById("btn-exportar-jpeg");
    const btnPdf = document.getElementById("btn-exportar-pdf");
    if (btnJpeg) btnJpeg.textContent = ehA4 ? "Baixar imagem" : "Baixar JPEG";
    if (btnPdf) btnPdf.textContent = "Baixar PDF";
  }

  async function baixarExport(tipo, btn) {
    btn.disabled = true;
    const textoOriginal = btn.textContent;
    btn.textContent = tipo === "pdf" ? "Gerando PDF…" : "Gerando JPEG…";
    try {
      await exportarPapel(tipo);
    } catch (erro) {
      console.error("Erro ao exportar:", erro);
      alert("Não foi possível gerar o arquivo: " + erro.message);
    } finally {
      btn.disabled = false;
      btn.textContent = textoOriginal;
    }
  }
  document.getElementById("btn-exportar-pdf").addEventListener("click", (ev) => baixarExport("pdf", ev.currentTarget));
  document.getElementById("btn-exportar-jpeg").addEventListener("click", (ev) => baixarExport("jpeg", ev.currentTarget));

  // ---------------------------------------------------------------------
  // Sidebar: drawer mobile e colapso no desktop
  // ---------------------------------------------------------------------

  document.getElementById("btn-menu").addEventListener("click", () => {
    if (state.ui.sidebarAberta) fecharSidebarMobile();
    else abrirSidebarMobile();
  });
  document.getElementById("sidebar-backdrop").addEventListener("click", fecharSidebarMobile);
  document.getElementById("btn-recolher-sidebar").addEventListener("click", alternarSidebarDesktop);

  try {
    if (localStorage.getItem(SIDEBAR_RECOLHIDA_STORAGE_KEY) === "1") {
      alternarSidebarDesktop();
    }
  } catch (e) {
    /* ignora */
  }

  // Fecha o drawer mobile automaticamente ao escolher um filtro, já que a
  // sidebar cobre o conteúdo nesse modo.
  document.getElementById("sidebar").addEventListener("click", (ev) => {
    if (window.innerWidth > 860) return;
    if (ev.target.closest(".chip, .switch, #btn-limpar-datas")) {
      fecharSidebarMobile();
    }
  });

  // ---------------------------------------------------------------------
  // Filtros ativos: botão "limpar todos"
  // ---------------------------------------------------------------------

  document.getElementById("btn-limpar-filtros").addEventListener("click", limparTodosFiltros);

  // ---------------------------------------------------------------------
  // Alternância entre linha do tempo e tabela
  // ---------------------------------------------------------------------

  document.getElementById("btn-vista-timeline").addEventListener("click", () => {
    state.ui.vista = "timeline";
    atualizarVisibilidadeVista();
  });
  document.getElementById("btn-vista-tabela").addEventListener("click", () => {
    state.ui.vista = "tabela";
    atualizarVisibilidadeVista();
  });

  // ---------------------------------------------------------------------
  // Tabela: ordenação e paginação
  // ---------------------------------------------------------------------

  document.querySelectorAll(".th-sort").forEach((btn) => {
    btn.addEventListener("click", () => {
      const campo = btn.dataset.sort;
      if (state.ui.tabelaOrdenarPor === campo) {
        state.ui.tabelaOrdemAsc = !state.ui.tabelaOrdemAsc;
      } else {
        state.ui.tabelaOrdenarPor = campo;
        state.ui.tabelaOrdemAsc = true;
      }
      state.ui.tabelaPagina = 1;
      renderizarConteudo();
    });
  });

  document.getElementById("btn-pagina-anterior").addEventListener("click", () => {
    state.ui.tabelaPagina -= 1;
    renderizarConteudo();
  });
  document.getElementById("btn-pagina-proxima").addEventListener("click", () => {
    state.ui.tabelaPagina += 1;
    renderizarConteudo();
  });

  // ---------------------------------------------------------------------
  // Painel lateral de detalhes (delegação para cartões e linhas da tabela)
  // ---------------------------------------------------------------------

  document.addEventListener("click", (ev) => {
    const btnDetalhes = ev.target.closest("[data-abrir-detalhes]");
    if (btnDetalhes) {
      abrirPainelDetalhes(btnDetalhes.dataset.abrirDetalhes);
    }
  });

  document.getElementById("btn-fechar-painel").addEventListener("click", fecharPainelDetalhes);
  document.getElementById("panel-backdrop").addEventListener("click", fecharPainelDetalhes);

  // ---------------------------------------------------------------------
  // Exportação em texto (modal)
  // ---------------------------------------------------------------------

  document.getElementById("btn-exportar-texto").addEventListener("click", abrirModalTexto);
  document.getElementById("btn-fechar-texto").addEventListener("click", fecharModalTexto);
  document.getElementById("btn-fechar-texto-2").addEventListener("click", fecharModalTexto);
  document.getElementById("text-export-backdrop").addEventListener("click", fecharModalTexto);

  document.getElementById("btn-copiar-texto").addEventListener("click", async () => {
    const textarea = document.getElementById("text-export-conteudo");
    const aviso = document.getElementById("text-export-copiado");
    try {
      await navigator.clipboard.writeText(textarea.value);
    } catch (e) {
      // Sem permissão/API de clipboard: seleciona o texto para copiar manualmente.
      textarea.focus();
      textarea.select();
    }
    aviso.hidden = false;
    setTimeout(() => {
      aviso.hidden = true;
    }, 2500);
  });

  // ---------------------------------------------------------------------
  // Tecla Esc: fecha o overlay mais recente (confirmação > texto > painel > drawer)
  // ---------------------------------------------------------------------

  document.addEventListener("keydown", (ev) => {
    if (ev.key !== "Escape") return;

    const confirmModal = document.getElementById("confirm-modal");
    if (!confirmModal.hidden) {
      document.getElementById("confirm-cancelar").click();
      return;
    }
    if (!document.getElementById("text-export-modal").hidden) {
      fecharModalTexto();
      return;
    }
    if (!document.getElementById("export-backdrop").hidden) {
      fecharOverlayExport();
      return;
    }
    if (document.getElementById("detail-panel").getAttribute("aria-hidden") === "false") {
      fecharPainelDetalhes();
      return;
    }
    if (state.ui.sidebarAberta) {
      fecharSidebarMobile();
    }
  });
}

/* ==========================================================================
   INICIALIZAÇÃO
   ========================================================================== */

// Lê o recorte pedido na própria URL, para que um link abra a agenda já no
// dia certo. É o que permite a um e-mail, a um cron ou a um atalho no celular
// apontarem para um dia específico — e é também o que garante que a imagem
// gerada automaticamente venha desta mesma tela, com estes mesmos números, em
// vez de um segundo renderizador que divergiria com o tempo.
//
//   ?data=2026-09-08              um dia
//   ?de=2026-09-08&ate=2026-09-12 um intervalo
//   ?periodo=dia|semana|mes|todos quando não há data explícita
//
// Datas fora do formato YYYY-MM-DD são ignoradas em silêncio: um link torto
// deve abrir a agenda de hoje, não uma tela de erro.
function aplicarFiltrosDaURL() {
  const params = new URLSearchParams(window.location.search);
  const dataValida = (v) => (v && /^\d{4}-\d{2}-\d{2}$/.test(v) ? v : null);

  const dia = dataValida(params.get("data"));
  const de = dia || dataValida(params.get("de"));
  const ate = dia || dataValida(params.get("ate"));

  if (de || ate) {
    state.filtros.dataInicio = de;
    state.filtros.dataFim = ate;
    // Intervalo explícito manda no que é exibido; o período volta a "Todos"
    // para que os dois controles não disputem a mesma janela.
    state.filtros.periodo = "todos";
    const campoInicio = document.getElementById("filtro-data-inicio");
    const campoFim = document.getElementById("filtro-data-fim");
    if (campoInicio) campoInicio.value = de || "";
    if (campoFim) campoFim.value = ate || "";
    atualizarVisibilidadeBtnLimparDatas();
    sincronizarChipsPeriodo();
    return;
  }

  const periodo = params.get("periodo");
  if (["dia", "semana", "mes", "todos"].includes(periodo)) {
    state.filtros.periodo = periodo;
    sincronizarChipsPeriodo();
  }
}

// Ponto de automação. Expõe a geração do artefato para processos que abrem
// esta página em navegador headless — hoje, o envio diário por e-mail.
//
// Devolve o data URL do JPEG no tamanho real, produzido pelo MESMO caminho do
// botão "Baixar JPEG": mesma montagem do papel, mesma escala, mesma
// rasterização. É o que garante que o arquivo enviado automaticamente seja
// idêntico ao que a pessoa baixaria da tela, em vez de sair de um segundo
// renderizador que divergiria com o tempo.
//
// Respeita os filtros em vigor, inclusive os vindos da URL — de modo que
// abrir "?data=2026-09-08" e chamar esta função produz o card daquele dia.
window.saaGerarCard = async function ({ formato = "mobile", proporcao = "story", qualidade = 0.95 } = {}) {
  if (!window.html2canvas) throw new Error("Biblioteca de captura indisponível.");
  await precarregarMarcas();

  state.exportacao.formato = formato;
  state.exportacao.proporcao = proporcao;

  const lista = obterEventosFiltrados();
  const grupos = agruparPorDia(lista);
  const paper = construirPaperExport(grupos, lista.length);
  const canvas = await renderizarCanvasElemento(paper, formato === "a4" ? 2.5 : 1.5);

  return {
    dataUrl: canvas.toDataURL("image/jpeg", qualidade),
    largura: canvas.width,
    altura: canvas.height,
    compromissos: lista.length,
  };
};

function iniciar() {
  inicializarInterface();
  aplicarFiltrosDaURL();

  // Pré-carrega as marcas institucionais em data URL: o html2canvas só
  // rasteriza imagens que já estejam disponíveis no momento da captura.
  precarregarMarcas();

  // Pré-carrega o cache local para uma primeira renderização instantânea,
  // antes mesmo da resposta da rede chegar.
  const cache = carregarCache();
  if (cache) {
    marcarConflitos(cache.events);
    state.eventos = cache.events;
    state.usandoCache = true;
    state.ultimaAtualizacao = new Date(cache.savedAt);
    renderizarTudo();
    mostrarAvisoCache();
  }

  atualizarAgenda();
  setInterval(atualizarAgenda, REFRESH_INTERVAL_MS);
}

document.addEventListener("DOMContentLoaded", iniciar);
