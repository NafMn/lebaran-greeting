// src/migrate-avatar.js
// Jalankan untuk menambahkan kolom avatar dan likes ke tabel komentar yang sudah ada
// Usage: node src/migrate-avatar.js

require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

async function migrate() {
  const client = await pool.connect();
  try {
    console.log('🔄 Memulai migration...');
    
    // Cek dan tambahkan kolom avatar jika belum ada
    const avatarCheck = await client.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'komentar' AND column_name = 'avatar'
    `);
    
    if (avatarCheck.rows.length === 0) {
      await client.query(`ALTER TABLE komentar ADD COLUMN avatar VARCHAR(10) DEFAULT '😊'`);
      console.log('✅ Kolom avatar berhasil ditambahkan');
    } else {
      console.log('ℹ️  Kolom avatar sudah ada');
    }
    
    // Cek dan tambahkan kolom likes jika belum ada
    const likesCheck = await client.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'komentar' AND column_name = 'likes'
    `);
    
    if (likesCheck.rows.length === 0) {
      await client.query(`ALTER TABLE komentar ADD COLUMN likes INTEGER DEFAULT 0`);
      console.log('✅ Kolom likes berhasil ditambahkan');
    } else {
      console.log('ℹ️  Kolom likes sudah ada');
    }
    
    console.log('🎉 Migration selesai!');
  } catch (err) {
    console.error('❌ Error:', err.message);
  } finally {
    client.release();
    pool.end();
  }
}

migrate();