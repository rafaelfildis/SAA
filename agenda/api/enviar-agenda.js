"use strict";

/**
 * GET /api/enviar-agenda — chamado pelo cron da Vercel.
 *
 * Gera o card da agenda de amanhã e o envia por e-mail, com o JPEG anexado.
 * O anexo sai daqui, e não de um agente: o arquivo nunca precisa atravessar
 * uma conversa em base64, que é o motivo de este caminho existir.
 *
 * Variáveis de ambiente:
 *   RESEND_API_KEY   obrigatória — chave do provedor de e-mail (resend.com)
 *   EMAIL_DESTINO    obrigatória — para quem enviar
 *   EMAIL_REMETENTE  opcional  — padrão "SAA <onboarding@resend.dev>"
 *   CRON_SECRET      opcional  — se definida, exige o Bearer que a Vercel envia
 */

const { gerarCard, amanhaEmBahia, origemDaRequisicao, FUSO } = require("./_card.js");

const RESEND_API_KEY = process.env.RESEND_API_KEY || "";
const EMAIL_DESTINO = process.env.EMAIL_DESTINO || "";
const EMAIL_REMETENTE = process.env.EMAIL_REMETENTE || "SAA <onboarding@resend.dev>";
const CRON_SECRET = process.env.CRON_SECRET || "";

// A Vercel envia "Authorization: Bearer <CRON_SECRET>" nas chamadas de cron.
// Sem o segredo definido o endpoint fica aberto — o que é aceitável para
// disparar manualmente durante a configuração, mas não para deixar assim.
function autorizado(req) {
  if (!CRON_SECRET) return true;
  return req.headers.authorization === `Bearer ${CRON_SECRET}`;
}

function textoDoDia(data, compromissos) {
  const dataLonga = new Intl.DateTimeFormat("pt-BR", {
    timeZone: FUSO,
    weekday: "long",
    day: "2-digit",
    month: "long",
    year: "numeric",
  }).format(new Date(`${data}T12:00:00-03:00`));

  const quantos = compromissos === 0
    ? "Nenhum compromisso agendado."
    : `${compromissos} compromisso${compromissos === 1 ? "" : "s"} agendado${compromissos === 1 ? "" : "s"}.`;

  return { dataLonga, quantos };
}

async function enviarEmail({ data, card }) {
  const { dataLonga, quantos } = textoDoDia(data, card.compromissos);
  const assunto = `SAA · Agenda de ${dataLonga} — ${card.compromissos === 0 ? "sem compromissos" : `${card.compromissos} compromisso${card.compromissos === 1 ? "" : "s"}`}`;

  const resposta = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${RESEND_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: EMAIL_REMETENTE,
      to: [EMAIL_DESTINO],
      subject: assunto,
      text: [
        "SAA - Agenda Institucional",
        "",
        dataLonga.toUpperCase(),
        quantos,
        "",
        "O card do dia segue em anexo.",
        `Agenda completa: ${process.env.PAINEL_URL || "https://saa-agenda-tcm-ba.vercel.app"}/?data=${data}`,
      ].join("\n"),
      attachments: [
        {
          filename: `agenda-${data}.jpg`,
          content: card.base64,
        },
      ],
    }),
  });

  if (!resposta.ok) {
    throw new Error(`Provedor de e-mail respondeu ${resposta.status}: ${await resposta.text()}`);
  }

  return resposta.json();
}

module.exports = async function handler(req, res) {
  if (!autorizado(req)) {
    res.status(401).json({ erro: "Não autorizado." });
    return;
  }

  const data = req.query?.data || amanhaEmBahia();
  if (!/^\d{4}-\d{2}-\d{2}$/.test(data)) {
    res.status(400).json({ erro: 'Parâmetro "data" deve estar em YYYY-MM-DD.' });
    return;
  }

  const faltando = [
    !RESEND_API_KEY && "RESEND_API_KEY",
    !EMAIL_DESTINO && "EMAIL_DESTINO",
  ].filter(Boolean);

  try {
    const card = await gerarCard({ origem: origemDaRequisicao(req), data });

    // Sem as variáveis de e-mail o endpoint ainda é útil: devolve o que teria
    // enviado, o que permite validar a geração antes de contratar o provedor.
    if (faltando.length) {
      res.status(200).json({
        aviso: `E-mail não enviado: defina ${faltando.join(" e ")} nas variáveis de ambiente.`,
        data,
        compromissos: card.compromissos,
        dimensoes: `${card.largura}x${card.altura}`,
        kb: Math.round(card.buffer.length / 1024),
      });
      return;
    }

    const envio = await enviarEmail({ data, card });
    res.status(200).json({
      enviado: true,
      data,
      compromissos: card.compromissos,
      kb: Math.round(card.buffer.length / 1024),
      id: envio.id,
    });
  } catch (erro) {
    console.error("Falha no envio da agenda:", erro);
    res.status(500).json({ erro: erro.message });
  }
};
