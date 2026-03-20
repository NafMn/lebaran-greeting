// src/db.js
require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  // Jika pakai SSL (Supabase, Railway, Render, dll):
  // ssl: { rejectUnauthorized: false }
});

module.exports = pool;
