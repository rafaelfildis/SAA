/**
 * Monta o corpo do e-mail diário da agenda a partir da resposta da API do
 * Google Calendar.
 *
 * Existe para que a rotina diária não dependa de alguém recompor o HTML a cada
 * disparo: o layout fica versionado aqui, muda por commit e sai igual todo dia.
 *
 * Uso:
 *   node scripts/montar-email.mjs --entrada eventos.json --data YYYY-MM-DD \
 *     [--saida-html corpo.html] [--saida-texto corpo.txt] [--saida-assunto assunto.txt]
 *
 * Sem --saida-*, imprime um JSON com as três partes.
 */

import { readFileSync, writeFileSync } from "node:fs";

const FUSO = "America/Bahia";
const PAINEL = "https://saa-agenda-tcm-ba.vercel.app";

// Mesmos marcadores que o proxy usa para ocultar compromissos do painel. Um
// compromisso que não aparece na tela não pode aparecer no e-mail.
const MARCADORES_PRIVADOS = ["#privado", "#pessoal"];
const IDS_OCULTOS = ["6c1mcll4hmo99u7rgls5eq0fuq"];

// Jornada de referência usada para calcular janelas livres, igual à do painel.
const EXPEDIENTE_INICIO = 8 * 60;
const EXPEDIENTE_FIM = 18 * 60;

const COR = {
  navy: "#0B3163", navyEscuro: "#071C38", vermelho: "#D80425",
  online: "#2C63B0", presencial: "#0B3163", viagem: "#A65A05",
  verde: "#0F7B5F", tinta: "#12203A", texto2: "#5F6E88", texto3: "#64718E",
  borda: "#DCE3EE", painel: "#F4F7FB",
};

function arg(nome, padrao = null) {
  const i = process.argv.indexOf(`--${nome}`);
  if (i === -1 || !process.argv[i + 1]) {
    if (padrao !== null) return padrao;
    throw new Error(`Argumento obrigatório ausente: --${nome}`);
  }
  return process.argv[i + 1];
}

const esc = (t) =>
  String(t ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

const hhmm = (iso) =>
  new Intl.DateTimeFormat("pt-BR", { timeZone: FUSO, hour: "2-digit", minute: "2-digit" }).format(new Date(iso));

const minutosDoDia = (iso) => {
  const [h, m] = hhmm(iso).split(":").map(Number);
  return h * 60 + m;
};

const duracao = (min) => {
  const h = Math.floor(min / 60);
  const m = min % 60;
  return h && m ? `${h}h${String(m).padStart(2, "0")}` : h ? `${h}h` : `${m}min`;
};

// A classificação segue a mesma ordem do painel: viagem, online, presencial.
// Salvador não conta como deslocamento — é a sede.
const CIDADES = ["brasilia", "sao paulo", "rio de janeiro", "feira de santana", "vitoria da conquista",
  "ilheus", "porto seguro", "juazeiro", "barreiras", "itabuna", "camacari", "belo horizonte",
  "recife", "fortaleza", "curitiba", "porto alegre", "goiania", "manaus", "belem"];

const semAcento = (t) =>
  String(t ?? "").normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();

function classificar(ev) {
  const titulo = semAcento(ev.summary);
  const local = semAcento(ev.location);
  if (/\b(viagem|voo|aeroporto|hotel|embarque|desembarque|deslocamento)\b/.test(`${titulo} ${local}`)) return "viagem";
  if (CIDADES.some((c) => new RegExp(`\\b${c}\\b`).test(`${titulo} ${local}`))) return "viagem";
  if (ev.conferenceUrl || /\b(online|virtual|teams|meet|zoom|webex|videoconferencia)\b/.test(semAcento(ev.description))) return "online";
  return "presencial";
}

const ROTULO = { viagem: "VIAGEM", online: "ONLINE", presencial: "PRESENCIAL" };
const FUNDO = { viagem: "#FBF0E4", online: "#E8F0FB", presencial: "#EDF1F8" };
const BORDA_SELO = { viagem: "#EFD6B8", online: "#C9DCF4", presencial: "#D3DEEF" };

const bruto = JSON.parse(readFileSync(arg("entrada"), "utf8"));
const DATA = arg("data");

const eventos = (Array.isArray(bruto) ? bruto : bruto.events || [])
  .filter((ev) => ev.status !== "cancelled")
  .filter((ev) => !IDS_OCULTOS.includes(ev.id))
  .filter((ev) => !MARCADORES_PRIVADOS.some((m) => semAcento(ev.summary).includes(m)))
  .filter((ev) => ev.start?.dateTime || ev.start?.date)
  .sort((a, b) => new Date(a.start.dateTime || a.start.date) - new Date(b.start.dateTime || b.start.date));

const comHorario = eventos.filter((ev) => ev.start?.dateTime);
const ocupadoMin = comHorario.reduce(
  (s, ev) => s + (minutosDoDia(ev.end.dateTime) - minutosDoDia(ev.start.dateTime)), 0);

// Sobreposições: pares cujos intervalos se cruzam.
let conflitos = 0;
for (let i = 0; i < comHorario.length; i++)
  for (let j = i + 1; j < comHorario.length; j++)
    if (minutosDoDia(comHorario[i].start.dateTime) < minutosDoDia(comHorario[j].end.dateTime) &&
        minutosDoDia(comHorario[j].start.dateTime) < minutosDoDia(comHorario[i].end.dateTime)) conflitos++;

// Janelas livres dentro do expediente.
const livres = [];
let cursor = EXPEDIENTE_INICIO;
for (const ev of comHorario) {
  const ini = minutosDoDia(ev.start.dateTime);
  if (ini > cursor) livres.push([cursor, ini]);
  cursor = Math.max(cursor, minutosDoDia(ev.end.dateTime));
}
if (cursor < EXPEDIENTE_FIM) livres.push([cursor, EXPEDIENTE_FIM]);
const comoHora = (m) => `${String(Math.floor(m / 60)).padStart(2, "0")}:${String(m % 60).padStart(2, "0")}`;

const dataObj = new Date(`${DATA}T12:00:00-03:00`);
const diaSemana = new Intl.DateTimeFormat("pt-BR", { timeZone: FUSO, weekday: "long" }).format(dataObj);
const dataLonga = new Intl.DateTimeFormat("pt-BR", { timeZone: FUSO, day: "2-digit", month: "long", year: "numeric" }).format(dataObj);

const assunto = eventos.length
  ? `SAA · Agenda de ${diaSemana}, ${dataLonga} — ${eventos.length} compromisso${eventos.length === 1 ? "" : "s"}`
  : `SAA · Agenda de ${diaSemana}, ${dataLonga} — sem compromissos`;

function cartao(ev) {
  const cat = classificar(ev);
  const diaInteiro = !ev.start.dateTime;
  const ini = diaInteiro ? "Dia" : hhmm(ev.start.dateTime);
  const fim = diaInteiro ? "inteiro" : `até ${hhmm(ev.end.dateTime)}`;
  const dur = diaInteiro ? "" : duracao(minutosDoDia(ev.end.dateTime) - minutosDoDia(ev.start.dateTime));
  return `
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-left:4px solid ${COR[cat]};border-top:1px solid ${COR.borda};border-right:1px solid ${COR.borda};border-bottom:1px solid ${COR.borda};border-radius:0 8px 8px 0;margin-bottom:12px;">
<tr><td style="padding:14px 16px;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr>
<td valign="top" width="88">
<div style="font:600 19px/1.1 'Courier New',monospace;color:${COR.navy};">${esc(ini)}</div>
<div style="font:400 12px/1.4 'Courier New',monospace;color:${COR.texto3};margin-top:2px;">${esc(fim)}</div>
${dur ? `<div style="font:400 12px/1.4 'Courier New',monospace;color:${COR.texto3};">${esc(dur)}</div>` : ""}
</td>
<td valign="top">
<div style="font:600 16px/1.3 Arial,sans-serif;color:${COR.tinta};">${esc(ev.summary || "(Sem título)")}
<span style="display:inline-block;font:600 10px/1 Arial,sans-serif;color:${COR[cat]};background:${FUNDO[cat]};border:1px solid ${BORDA_SELO[cat]};border-radius:4px;padding:4px 7px;margin-left:6px;letter-spacing:.06em;vertical-align:middle;">${ROTULO[cat]}</span></div>
${ev.location ? `<div style="font:400 13px/1.55 Arial,sans-serif;color:${COR.texto2};margin-top:6px;">${esc(ev.location)}</div>` : ""}
${ev.conferenceUrl ? `<div style="margin-top:8px;"><a href="${esc(ev.conferenceUrl)}" style="font:600 13px/1.4 Arial,sans-serif;color:#14448A;text-decoration:none;">&#9654;&nbsp;Entrar na reunião</a></div>` : ""}
</td></tr></table>
</td></tr></table>`;
}

const indicador = (rotulo, valor, cor) => `
<td width="33%" style="border:1px solid ${COR.borda};border-radius:8px;padding:12px 14px;">
<div style="font:600 10px/1.4 Arial,sans-serif;color:${COR.texto2};letter-spacing:.1em;text-transform:uppercase;">${rotulo}</div>
<div style="font:600 22px/1.2 'Courier New',monospace;color:${cor};margin-top:3px;">${valor}</div></td>`;

const html = `<div style="margin:0;padding:0;background:${COR.painel};font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${COR.painel};padding:24px 12px;">
<tr><td align="center">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:600px;background:#FFFFFF;border:1px solid ${COR.borda};border-radius:10px;overflow:hidden;">
<tr><td style="background:${COR.navy};background-image:linear-gradient(135deg,${COR.navy},${COR.navyEscuro});padding:26px;">
<div style="font:600 13px/1.3 Georgia,serif;color:#FFFFFF;">SAA &middot; Agenda Institucional</div>
<div style="font:400 12px/1.5 Arial,sans-serif;color:#AFC2DE;margin-top:2px;">Tribunal de Contas dos Municípios do Estado da Bahia</div>
<div style="font:400 11px/1.4 'Courier New',monospace;color:#8FA8CC;letter-spacing:.14em;margin-top:18px;text-transform:uppercase;">${esc(diaSemana)}</div>
<div style="font:700 30px/1.15 Georgia,serif;color:#FFFFFF;margin-top:2px;">${esc(dataLonga)}</div>
</td></tr>
${eventos.length ? `
<tr><td style="padding:0 26px;"><table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:20px 0 4px 0;"><tr>
${indicador("Compromissos", eventos.length, COR.navy)}<td width="14">&nbsp;</td>
${indicador("Ocupação", duracao(ocupadoMin), COR.navy)}<td width="14">&nbsp;</td>
${indicador("Conflitos", conflitos, conflitos ? COR.vermelho : COR.verde)}
</tr></table></td></tr>
<tr><td style="padding:14px 26px 0 26px;">${eventos.map(cartao).join("")}</td></tr>
${livres.length ? `<tr><td style="padding:8px 26px 0 26px;">
<div style="font:600 10px/1.4 Arial,sans-serif;color:${COR.texto2};letter-spacing:.1em;text-transform:uppercase;">Janelas livres</div>
<div style="margin-top:8px;">${livres.map(([a, b]) => `<span style="display:inline-block;font:400 12px/1 'Courier New',monospace;color:${COR.verde};border:1px dashed #A9D3C5;border-radius:20px;padding:7px 12px;margin:0 6px 6px 0;">${comoHora(a)} &ndash; ${comoHora(b)}</span>`).join("")}</div>
</td></tr>` : ""}` : `
<tr><td style="padding:28px 26px 4px 26px;">
<div style="font:600 17px/1.4 Arial,sans-serif;color:${COR.tinta};">Nenhum compromisso agendado.</div>
<div style="font:400 14px/1.6 Arial,sans-serif;color:${COR.texto2};margin-top:6px;">O dia está inteiramente livre.</div>
</td></tr>`}
<tr><td style="padding:22px 26px 26px 26px;">
<a href="${PAINEL}" style="display:inline-block;background:${COR.vermelho};color:#FFFFFF;font:600 14px/1 Arial,sans-serif;text-decoration:none;padding:13px 20px;border-radius:7px;">Abrir a agenda e exportar em PDF ou JPEG</a>
</td></tr>
<tr><td style="border-top:1px solid ${COR.borda};background:#F8FAFD;padding:16px 26px;">
<div style="font:400 11px/1.6 Arial,sans-serif;color:${COR.texto3};">Gerado automaticamente pelo SAA a partir do Google Agenda. Alterações devem ser feitas no calendário de origem. Fuso horário ${FUSO}.</div>
</td></tr>
</table></td></tr></table></div>`;

const texto = [
  "SAA - Agenda Institucional",
  "",
  `${diaSemana.toUpperCase()}, ${dataLonga}`,
  eventos.length
    ? `${eventos.length} compromisso(s) | ${duracao(ocupadoMin)} de ocupacao | ${conflitos} conflito(s)`
    : "Nenhum compromisso agendado.",
  "",
  ...eventos.map((ev) => {
    const cat = classificar(ev);
    const quando = ev.start.dateTime ? `${hhmm(ev.start.dateTime)} - ${hhmm(ev.end.dateTime)}` : "Dia inteiro";
    return [
      `${quando} | ${ROTULO[cat]}`,
      ev.summary || "(Sem titulo)",
      ev.location ? `Local: ${ev.location}` : null,
      ev.conferenceUrl ? `Reuniao: ${ev.conferenceUrl}` : null,
      "",
    ].filter(Boolean).join("\n");
  }),
  livres.length ? `Janelas livres: ${livres.map(([a, b]) => `${comoHora(a)}-${comoHora(b)}`).join(", ")}` : "",
  "",
  `Agenda completa e exportacoes: ${PAINEL}`,
].join("\n");

const saidas = {
  "saida-html": html,
  "saida-texto": texto,
  "saida-assunto": assunto,
};
let escreveu = false;
for (const [opcao, conteudo] of Object.entries(saidas)) {
  const i = process.argv.indexOf(`--${opcao}`);
  if (i !== -1 && process.argv[i + 1]) {
    writeFileSync(process.argv[i + 1], conteudo);
    escreveu = true;
  }
}
if (!escreveu) console.log(JSON.stringify({ assunto, html, texto }, null, 2));
else console.log(JSON.stringify({ assunto, compromissos: eventos.length, ocupacao: duracao(ocupadoMin), conflitos, janelasLivres: livres.length }, null, 2));
