// src/server.js
require("dotenv").config();

const express = require("express");
const path = require("path");
const pool = require("./db");
const { generateUcapan } = require("./ai");

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
if (typeof __dirname !== "undefined") {
  app.use(express.static(path.join(__dirname, "..", "public")));
}

// ─── Helpers ───────────────────────────────────────────────────────────────

function ok(res, data) {
  res.json({ ok: true, ...data });
}
function fail(res, msg, code = 400) {
  res.status(code).json({ ok: false, error: msg });
}

// ─── GET /api/dana-kaget ───────────────────────────────────────────────────
// Dapatkan URL Dana Kaget dari environment variable
app.get("/api/dana-kaget", (req, res) => {
  const danaUrl = process.env.DANA_KAGET_URL;
  if (!danaUrl) {
    return fail(res, "URL Dana Kaget tidak dikonfigurasi", 404);
  }
  ok(res, { url: danaUrl });
});

// ─── GET /api/ucapan?nama=X&gaya=lucu ──────────────────────────────────────
// Generate ucapan AI dengan cache PostgreSQL
app.get("/api/ucapan", async (req, res) => {
  const nama = (req.query.nama || "").trim().substring(0, 50);
  const gaya = ["lucu", "formal", "puisi"].includes(req.query.gaya)
    ? req.query.gaya
    : "lucu";
  const cacheKey = `${nama.toLowerCase()}::${gaya}`;

  // Cek cache dulu
  try {
    const cached = await pool.query(
      "SELECT ucapan FROM ucapan_cache WHERE cache_key = $1",
      [cacheKey],
    );
    if (cached.rows.length) {
      return ok(res, { ucapan: cached.rows[0].ucapan, source: "cache" });
    }
  } catch (e) {
    console.error("[cache read]", e.message);
  }

  // Generate dari AI
  const result = await generateUcapan(nama, gaya);

  // Simpan ke cache (jika dari AI)
  if (result.source === "ai") {
    pool
      .query(
        "INSERT INTO ucapan_cache (cache_key, ucapan) VALUES ($1, $2) ON CONFLICT (cache_key) DO UPDATE SET ucapan = $2",
        [cacheKey, result.ucapan],
      )
      .catch((e) => console.error("[cache write]", e.message));
  }

  ok(res, result);
});

// ─── GET /api/komentar ──────────────────────────────────────────────────────
app.get("/api/komentar", async (req, res) => {
  try {
    const { rows } = await pool.query(
      `SELECT id, nama, pesan, avatar, likes, created_at
       FROM komentar
       ORDER BY created_at DESC
       LIMIT 60`,
    );
    ok(res, { komentar: rows });
  } catch (e) {
    console.error("[GET komentar]", e.message);
    fail(res, "Gagal memuat komentar", 500);
  }
});

// ─── POST /api/komentar ─────────────────────────────────────────────────────
app.post("/api/komentar", async (req, res) => {
  const { nama, pesan, avatar, whatsapp } = req.body || {};

  if (!nama || typeof nama !== "string" || nama.trim().length < 2)
    return fail(res, "Nama minimal 2 karakter");
  if (!pesan || typeof pesan !== "string" || pesan.trim().length < 5)
    return fail(res, "Ucapan minimal 5 karakter");
  if (pesan.trim().length > 400)
    return fail(res, "Ucapan maksimal 400 karakter");

  try {
    const { rows } = await pool.query(
      `INSERT INTO komentar (nama, pesan, avatar, whatsapp)
       VALUES ($1, $2, $3, $4)
       RETURNING id`,
      [
        nama.trim().substring(0, 60),
        pesan.trim(),
        avatar?.trim().substring(0, 10) || "😊",
        whatsapp?.trim().substring(0, 20) || null,
      ],
    );
    ok(res, {
      id: rows[0].id,
      message:
        "🎉 Ucapanmu berhasil terkirim! Kamu eligible dapat Dana Kaget dari kami 🐱💚",
    });
  } catch (e) {
    console.error("[POST komentar]", e.message);
    fail(res, "Gagal menyimpan komentar", 500);
  }
});

// ─── SPA fallback ──────────────────────────────────────────────────────────
app.get("*", (_, res) => {
  if (typeof __dirname !== "undefined") {
    res.sendFile(path.join(__dirname, "..", "public", "index.html"));
  } else {
    res.status(404).json({ ok: false, error: "Not Found" });
  }
});

// ─── Start ─────────────────────────────────────────────────────────────────
if (process.env.NODE_ENV !== "production") {
  app.listen(PORT, () =>
    console.log(`🐱 Meow Lebaran running → http://localhost:${PORT}`),
  );
}

const serverless = require("serverless-http");
const handler = serverless(app);

module.exports = {
  fetch: handler,
  handler: handler,
  app: app
};
