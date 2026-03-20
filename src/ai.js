// src/ai.js
// GLM-4-Flash via Z.ai (open.bigmodel.cn) dengan fallback ke Gemini API,
// lalu fallback ke Sumopod API jika Gemini juga gagal

const FALLBACK = [
  "Meong~! Minal Aidin Wal Faizin 🐱 Semoga Lebaran ini membawa kebahagiaan sebesar perut kucing kenyang. Mohon maaf lahir dan batin ya! 🙏",
  "Purrrr... Selamat Idul Fitri 1446 H! Seperti kucing yang selalu pulang ke rumah, semoga kita kembali ke fitrah yang suci. Maafkan segala khilaf! 😺",
  "Nyaow~! Taqabbalallahu minna wa minkum! Semoga amal ibadah kita diterima, sehappy kucing dapat ikan segar. Mohon maaf lahir batin! 🐾",
  "Mrrrow! Selamat Hari Raya! Semoga hidupmu se-cozy kucing tidur di sofa hangat seharian. Mohon maaf atas segala kesalahan! 😸",
  "Meow Meow~! Happy Eid Mubarak! Semoga rezekimu semelimpah mangkuk makan kucing yang selalu terisi penuh. Maaf lahir dan batin! 🐈",
];

function getFallback(nama) {
  const msg = FALLBACK[Math.floor(Math.random() * FALLBACK.length)];
  return nama ? `Untuk ${nama}, ` + msg : msg;
}

/**
 * Generate ucapan Lebaran via GLM-4-Flash, fallback ke Gemini API jika GLM gagal,
 * lalu fallback ke Sumopod jika Gemini juga gagal
 * @param {string} nama - nama penerima (opsional)
 * @param {string} gaya - 'lucu' | 'formal' | 'puisi'
 * @returns {{ ucapan: string, source: 'ai'|'gemini'|'sumopod'|'fallback' }}
 */
async function generateUcapan(nama = "", gaya = "lucu") {
  const apiKey = process.env.GLM_API_KEY;
  if (!apiKey) {
    // Jika tidak ada GLM key, langsung coba Gemini
    return await tryGemini(nama, gaya);
  }

  const gayaMap = {
    lucu: "gaya lucu menggemaskan, banyak analogi kucing, pakai 1-2 emoji kucing",
    formal:
      "gaya formal dan sopan, sisipkan 1 analogi kucing secara elegan, tanpa emoji",
    puisi:
      "bentuk puisi 4 baris berirama, bertema kucing dan Lebaran, bahasa puitis",
  };

  const systemPrompt =
    "Kamu asisten ucapan Lebaran bertema kucing. Selalu sisipkan unsur kucing. Jawaban singkat, max 3 kalimat (kecuali puisi). Jangan pakai tanda petik di awal/akhir.";
  const userPrompt = nama
    ? `Buat ucapan Idul Fitri 1446 H personal untuk "${nama}" dengan ${gayaMap[gaya] || gayaMap.lucu}.`
    : `Buat ucapan Idul Fitri 1446 H dengan ${gayaMap[gaya] || gayaMap.lucu}.`;

  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 20000);

    const res = await fetch("https://api.z.ai/api/paas/v4/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "glm-4.7-flashx",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        max_tokens: 220,
        temperature: 0.9,
      }),
      signal: controller.signal,
    });

    clearTimeout(timer);

    if (!res.ok) throw new Error(`GLM HTTP ${res.status}`);

    const data = await res.json();
    const ucapan = data?.choices?.[0]?.message?.content?.trim();
    if (!ucapan) throw new Error("Empty response");

    return { ucapan, source: "ai" };
  } catch (err) {
    console.error("[AI] GLM gagal, coba Gemini:", err.message);
    return await tryGemini(nama, gaya);
  }
}

async function tryGemini(nama, gaya) {
  const geminiKey = process.env.GEMINI_API_KEY;
  if (!geminiKey) {
    return { ucapan: getFallback(nama), source: "fallback" };
  }

  const gayaMap = {
    lucu: "gaya lucu menggemaskan, banyak analogi kucing, pakai 1-2 emoji kucing",
    formal:
      "gaya formal dan sopan, sisipkan 1 analogi kucing secara elegan, tanpa emoji",
    puisi:
      "bentuk puisi 4 baris berirama, bertema kucing dan Lebaran, bahasa puitis",
  };

  const systemPrompt =
    "Kamu asisten ucapan Lebaran bertema kucing. Selalu sisipkan unsur kucing. Jawaban singkat, max 3 kalimat (kecuali puisi). Jangan pakai tanda petik di awal/akhir.";
  const userPrompt = nama
    ? `Buat ucapan Idul Fitri 1446 H personal untuk "${nama}" dengan ${gayaMap[gaya] || gayaMap.lucu}.`
    : `Buat ucapan Idul Fitri 1446 H dengan ${gayaMap[gaya] || gayaMap.lucu}.`;

  try {
    const geminiRes = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${geminiKey}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          contents: [{ parts: [{ text: `${systemPrompt}\n\n${userPrompt}` }] }],
        }),
      },
    );

    if (!geminiRes.ok) throw new Error(`Gemini HTTP ${geminiRes.status}`);

    const geminiData = await geminiRes.json();
    const geminiUcapan =
      geminiData?.candidates?.[0]?.content?.parts?.[0]?.text?.trim();
    if (!geminiUcapan) throw new Error("Empty Gemini response");

    return { ucapan: geminiUcapan, source: "gemini" };
  } catch (geminiErr) {
    console.error("[AI] Gemini juga gagal, coba Sumopod:", geminiErr.message);
    return await trySumopod(nama, gaya);
  }
}

async function trySumopod(nama, gaya) {
  const sumopodKey = process.env.SUMOPOD_API_KEY;
  if (!sumopodKey) {
    return { ucapan: getFallback(nama), source: "fallback" };
  }

  const gayaMap = {
    lucu: "gaya lucu menggemaskan, banyak analogi kucing, pakai 1-2 emoji kucing",
    formal:
      "gaya formal dan sopan, sisipkan 1 analogi kucing secara elegan, tanpa emoji",
    puisi:
      "bentuk puisi 4 baris berirama, bertema kucing dan Lebaran, bahasa puitis",
  };

  const systemPrompt =
    "Kamu asisten ucapan Lebaran bertema kucing. Selalu sisipkan unsur kucing. Jawaban singkat, max 3 kalimat (kecuali puisi). Jangan pakai tanda petik di awal/akhir.";
  const userPrompt = nama
    ? `Buat ucapan Idul Fitri 1446 H personal untuk "${nama}" dengan ${gayaMap[gaya] || gayaMap.lucu}.`
    : `Buat ucapan Idul Fitri 1446 H dengan ${gayaMap[gaya] || gayaMap.lucu}.`;

  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 20000);

    const sumopodRes = await fetch(
      "https://ai.sumopod.com/v1/chat/completions",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${sumopodKey}`,
        },
        body: JSON.stringify({
          model: "seed-2-0-mini",
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: userPrompt },
          ],
          max_tokens: 220,
          temperature: 0.7,
        }),
        signal: controller.signal,
      },
    );

    clearTimeout(timer);

    if (!sumopodRes.ok) throw new Error(`Sumopod HTTP ${sumopodRes.status}`);

    const sumopodData = await sumopodRes.json();
    const sumopodUcapan = sumopodData?.choices?.[0]?.message?.content?.trim();
    if (!sumopodUcapan) throw new Error("Empty Sumopod response");

    return { ucapan: sumopodUcapan, source: "sumopod" };
  } catch (sumopodErr) {
    console.error("[AI] Sumopod juga gagal:", sumopodErr.message);
    return { ucapan: getFallback(nama), source: "fallback" };
  }
}

module.exports = { generateUcapan };
