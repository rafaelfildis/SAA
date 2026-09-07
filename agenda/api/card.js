"use strict";

/**
 * GET /api/card?data=YYYY-MM-DD[&formato=mobile|a4][&proporcao=story|feed]
 *
 * Devolve o card do dia como JPEG. Sem "data", usa amanhã — que é o recorte do
 * envio diário. Serve para conferir na tela, no navegador, exatamente a imagem
 * que a rotina enviará por e-mail: mesma origem, mesmo caminho, mesmo arquivo.
 */

const { gerarCard, amanhaEmBahia, origemDaRequisicao } = require("./_card.js");

// Diagnóstico temporário: ?diagnostico=1 relata o que o @sparticuz/chromium
// realmente fez no ambiente da Vercel — onde extraiu, o que existe no bundle e
// se LD_LIBRARY_PATH foi definido. Sem isso, corrigir o "libnss3.so not found"
// vira adivinhação.
async function diagnosticar() {
  const fs = require("node:fs");
  const path = require("node:path");
  const chromium = require("@sparticuz/chromium");

  const ls = (dir) => {
    try {
      return fs.readdirSync(dir).slice(0, 40);
    } catch (e) {
      return `erro: ${e.message}`;
    }
  };

  const relatorio = {
    node: process.version,
    ldAntes: process.env.LD_LIBRARY_PATH || null,
    awsEnv: {
      AWS_EXECUTION_ENV: process.env.AWS_EXECUTION_ENV || null,
      AWS_LAMBDA_FUNCTION_NAME: process.env.AWS_LAMBDA_FUNCTION_NAME || null,
      AWS_LAMBDA_JS_RUNTIME: process.env.AWS_LAMBDA_JS_RUNTIME || null,
    },
    binNoBundle: null,
    executablePath: null,
    erroExecutablePath: null,
    ldDepois: null,
    tmp: null,
  };

  try {
    const raizPacote = path.dirname(require.resolve("@sparticuz/chromium/package.json"));
    relatorio.binNoBundle = ls(path.join(raizPacote, "bin"));
  } catch (e) {
    relatorio.binNoBundle = `erro: ${e.message}`;
  }

  try {
    relatorio.executablePath = await chromium.executablePath();
  } catch (e) {
    relatorio.erroExecutablePath = e.message;
  }

  relatorio.ldDepois = process.env.LD_LIBRARY_PATH || null;
  relatorio.tmp = ls("/tmp");
  return relatorio;
}

module.exports = async function handler(req, res) {
  if (req.query?.diagnostico) {
    res.status(200).json(await diagnosticar());
    return;
  }

  const data = req.query?.data || amanhaEmBahia();

  if (!/^\d{4}-\d{2}-\d{2}$/.test(data)) {
    res.status(400).json({ erro: 'Parâmetro "data" deve estar em YYYY-MM-DD.' });
    return;
  }

  const formato = req.query?.formato === "a4" ? "a4" : "mobile";
  const proporcao = req.query?.proporcao === "feed" ? "feed" : "story";

  try {
    const card = await gerarCard({ origem: origemDaRequisicao(req), data, formato, proporcao });

    res.setHeader("Content-Type", "image/jpeg");
    // Inline para abrir no navegador; o nome só aparece se o usuário salvar.
    res.setHeader("Content-Disposition", `inline; filename="agenda-${data}.jpg"`);
    res.setHeader("Cache-Control", "public, max-age=300");
    res.setHeader("X-Compromissos", String(card.compromissos));
    res.status(200).send(card.buffer);
  } catch (erro) {
    console.error("Falha ao gerar o card:", erro);
    res.status(500).json({ erro: "Não foi possível gerar o card: " + erro.message });
  }
};
