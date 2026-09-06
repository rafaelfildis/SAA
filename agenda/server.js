"use strict";

/**
 * Servidor Express do SAA — Agenda Institucional do TCM-BA.
 *
 * Responsabilidades:
 *  - Servir os arquivos estáticos da aplicação (index.html, styles.css, script.js).
 *  - Expor /api/calendar como camada intermediária que busca o ICS do Google
 *    Agenda no servidor (o feed iCal do Google não envia cabeçalhos CORS, o
 *    que inviabiliza o fetch direto pelo navegador), com cache curto em
 *    memória e CORS restrito à origem configurada.
 *
 * O endereço secreto do calendário fica exclusivamente na variável de
 * ambiente CALENDAR_ICS_URL — nunca no código servido ao navegador.
 *
 * Requer Node.js >= 18 (usa o fetch global).
 */

const express = require("express");
const path = require("path");

const app = express();

const PORT = process.env.PORT || 3000;
// Endereço público do calendário no formato iCal. Vive no código porque é
// público por definição — não é credencial e não expõe nada que a agenda já
// não exponha. Só responde enquanto a agenda estiver marcada como pública no
// Google ("Tornar disponível ao público", com "Ver todos os detalhes do
// evento"); do contrário o Google devolve 404 e o endpoint cai para o cache.
const CALENDAR_ICS_URL_PADRAO =
  "https://calendar.google.com/calendar/ical/rafaelfildis%40gmail.com/public/basic.ics";

// A variável de ambiente tem precedência sobre o padrão. É por ela que se
// aponta para o endereço SECRETO (.../private-TOKEN/basic.ics) sem tocar no
// código, caso a agenda volte a ser privada — o endereço secreto é credencial
// ao portador e nunca pode ser commitado, ainda mais em repositório público.
const CALENDAR_ICS_URL = process.env.CALENDAR_ICS_URL || CALENDAR_ICS_URL_PADRAO;
const ALLOWED_ORIGIN = process.env.ALLOWED_ORIGIN || "*";
const CACHE_TTL_MS = Number(process.env.CACHE_TTL_MS || 5 * 60 * 1000);

// Cache em memória simples (válido por processo/instância).
let cache = { body: null, fetchedAt: 0 };

// Mensagem de falha voltada a quem está olhando a tela. O 404 do Google tem
// uma causa quase certa e uma correção de um clique — dizer só "não foi
// possível" obriga a abrir os logs do servidor para descobrir isso.
function mensagemDeFalha(erro) {
  const detalhe = (erro && erro.message) || "causa desconhecida";
  if (/\b404\b/.test(detalhe)) {
    return (
      "O Google respondeu 404 ao endereço do calendário. O endereço público só " +
      "responde enquanto a agenda estiver marcada como pública no Google " +
      "(Configurações da agenda → Permissões de acesso a eventos → Tornar " +
      "disponível ao público, com Ver todos os detalhes do evento). Com a " +
      "agenda privada, defina CALENDAR_ICS_URL com o endereço secreto."
    );
  }
  return "Não foi possível obter o calendário no momento: " + detalhe + ".";
}


app.use((req, res, next) => {
  res.setHeader("Access-Control-Allow-Origin", ALLOWED_ORIGIN);
  res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
  if (req.method === "OPTIONS") {
    return res.sendStatus(204);
  }
  next();
});

app.get("/api/calendar", async (req, res) => {
  if (!CALENDAR_ICS_URL) {
    console.error("CALENDAR_ICS_URL não configurada.");
    return res.status(500).json({ erro: "Calendário não configurado: defina a variável de ambiente CALENDAR_ICS_URL." });
  }

  const agora = Date.now();

  if (cache.body && agora - cache.fetchedAt < CACHE_TTL_MS) {
    res.setHeader("Content-Type", "text/calendar; charset=utf-8");
    res.setHeader("Cache-Control", "public, max-age=" + Math.floor(CACHE_TTL_MS / 1000));
    return res.send(cache.body);
  }

  try {
    const upstream = await fetch(CALENDAR_ICS_URL);
    if (!upstream.ok) {
      throw new Error("Servidor do Google respondeu " + upstream.status);
    }
    const texto = await upstream.text();
    cache = { body: texto, fetchedAt: agora };

    res.setHeader("Content-Type", "text/calendar; charset=utf-8");
    res.setHeader("Cache-Control", "public, max-age=" + Math.floor(CACHE_TTL_MS / 1000));
    return res.send(texto);
  } catch (erro) {
    console.error("Erro ao buscar o calendário ICS:", erro.message);

    // Se houver algo em cache (mesmo expirado), serve como último recurso.
    if (cache.body) {
      res.setHeader("Content-Type", "text/calendar; charset=utf-8");
      res.setHeader("X-Cache-Stale", "true");
      return res.send(cache.body);
    }

    return res.status(502).json({ erro: mensagemDeFalha(erro) });
  }
});

app.use(express.static(path.join(__dirname)));

app.listen(PORT, () => {
  console.log(`SAA (Agenda TCM-BA) disponível em http://localhost:${PORT}`);
});
