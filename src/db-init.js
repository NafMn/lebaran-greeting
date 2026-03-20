// src/db-init.js
// Jalankan sekali: node src/db-init.js

require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

async function init() {
  const client = await pool.connect();
  try {
    await client.query(`
      CREATE TABLE IF NOT EXISTS komentar (
        id          SERIAL PRIMARY KEY,
        nama        VARCHAR(60)  NOT NULL,
        pesan       TEXT         NOT NULL,
        avatar      VARCHAR(10)  DEFAULT '😊',
        whatsapp    VARCHAR(20),          -- untuk kirim Dana Kaget (private)
        rewarded    BOOLEAN      DEFAULT FALSE,
        likes       INTEGER      DEFAULT 0,
        created_at  TIMESTAMPTZ  DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS ucapan_cache (
        cache_key   TEXT PRIMARY KEY,
        ucapan      TEXT NOT NULL,
        created_at  TIMESTAMPTZ DEFAULT NOW()
      );
    `);
    console.log('✅ Tabel berhasil dibuat!');
  } catch (err) {
    console.error('❌ Error:', err.message);
  } finally {
    client.release();
    pool.end();
  }
}

init();
