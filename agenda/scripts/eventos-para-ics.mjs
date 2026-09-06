/**
 * Converte a resposta do Google Calendar (JSON da API) no ICS que a aplicação
 * consome.
 *
 * Existe porque o ambiente onde a rotina diária roda não alcança
 * calendar.google.com pela rede, mas alcança a API do Google pelo conector.
 * A agenda vem como JSON e precisa virar ICS para atravessar o mesmo caminho
 * de sempre — parsing, classificação e render —, sem abrir uma segunda via
 * que poderia divergir do que a tela mostra.
 *
 * Uso:
 *   node scripts/eventos-para-ics.mjs --entrada eventos.json --saida agenda.ics
 *
 * A entrada é o objeto devolvido por list_events (com a chave "events") ou
 * diretamente o array de eventos.
 */

import { readFileSync, writeFileSync } from "node:fs";

function arg(nome) {
  const i = process.argv.indexOf(`--${nome}`);
  if (i === -1 || !process.argv[i + 1]) throw new Error(`Argumento ausente: --${nome}`);
  return process.argv[i + 1];
}

// RFC 5545 §3.3.11: barra invertida, ponto-e-vírgula, vírgula e quebra de linha
// são os caracteres que precisam de escape em valores de texto.
function escapar(texto) {
  return String(texto || "")
    .replace(/\\/g, "\\\\")
    .replace(/;/g, "\;")
    .replace(/,/g, "\\,")
    .replace(/\r?\n/g, "\\n");
}

// Carimbo UTC no formato básico, usado em DTSTAMP e em horários absolutos.
function carimboUtc(iso) {
  return new Date(iso).toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
}

function linhasDoEvento(ev) {
  const linhas = ["BEGIN:VEVENT"];
  linhas.push(`UID:${ev.id || Math.random().toString(36).slice(2)}@google.com`);
  linhas.push(`DTSTAMP:${carimboUtc(new Date().toISOString())}`);

  // Evento de dia inteiro chega como {date}; com horário, como {dateTime}.
  if (ev.start?.date) {
    linhas.push(`DTSTART;VALUE=DATE:${ev.start.date.replace(/-/g, "")}`);
    if (ev.end?.date) linhas.push(`DTEND;VALUE=DATE:${ev.end.date.replace(/-/g, "")}`);
  } else if (ev.start?.dateTime) {
    linhas.push(`DTSTART:${carimboUtc(ev.start.dateTime)}`);
    if (ev.end?.dateTime) linhas.push(`DTEND:${carimboUtc(ev.end.dateTime)}`);
  } else {
    return null; // sem início não há o que exibir
  }

  linhas.push(`SUMMARY:${escapar(ev.summary || "(Sem título)")}`);
  if (ev.location) linhas.push(`LOCATION:${escapar(ev.location)}`);

  // O link do Meet vem em campo próprio na API; a aplicação o procura na
  // descrição, como o Google faz no ICS. Reproduzimos esse formato.
  const descricao = [ev.description, ev.conferenceUrl ? `Join with Google Meet: ${ev.conferenceUrl}` : null]
    .filter(Boolean)
    .join("\n\n");
  if (descricao) linhas.push(`DESCRIPTION:${escapar(descricao)}`);
  if (ev.conferenceUrl) linhas.push(`X-GOOGLE-CONFERENCE:${ev.conferenceUrl}`);

  const organizador = ev.organizer?.email;
  if (organizador) {
    linhas.push(`ORGANIZER;CN=${escapar(organizador)}:mailto:${organizador}`);
  }
  (ev.attendees || []).forEach((a) => {
    if (!a.email || a.organizer) return;
    linhas.push(`ATTENDEE;CN=${escapar(a.displayName || a.email)}:mailto:${a.email}`);
  });

  linhas.push(`STATUS:${(ev.status || "confirmed").toUpperCase()}`);
  linhas.push("END:VEVENT");
  return linhas;
}

const bruto = JSON.parse(readFileSync(arg("entrada"), "utf8"));
const eventos = Array.isArray(bruto) ? bruto : bruto.events || [];

const saida = [
  "BEGIN:VCALENDAR",
  "PRODID:-//SAA//Rotina diária//PT",
  "VERSION:2.0",
  "CALSCALE:GREGORIAN",
  "METHOD:PUBLISH",
  "X-WR-TIMEZONE:America/Bahia",
  ...eventos.flatMap((ev) => linhasDoEvento(ev) || []),
  "END:VCALENDAR",
].join("\r\n");

writeFileSync(arg("saida"), saida + "\r\n");
console.log(`${eventos.length} evento(s) convertido(s) para ${arg("saida")}`);
