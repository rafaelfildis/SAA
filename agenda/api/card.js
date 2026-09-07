"use strict";

/**
 * GET /api/card?data=YYYY-MM-DD[&formato=mobile|a4][&proporcao=story|feed]
 *
 * Devolve o card do dia como JPEG. Sem "data", usa amanhã — que é o recorte do
 * envio diário. Serve para conferir na tela, no navegador, exatamente a imagem
 * que a rotina enviará por e-mail: mesma origem, mesmo caminho, mesmo arquivo.
 */

const { gerarCard, amanhaEmBahia, origemDaRequisicao } = require("./_card.js");

module.exports = async function handler(req, res) {
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
