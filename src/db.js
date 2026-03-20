// src/db.js
require('dotenv').config();
const { Pool } = require('pg');

let poolInstance = null;

function getPool() {
  if (!poolInstance) {
    poolInstance = new Pool({
      connectionString: process.env.DATABASE_URL,
      // ssl: { rejectUnauthorized: false }
    });
  }
  return poolInstance;
}

module.exports = {
  query: (...args) => getPool().query(...args),
  connect: (...args) => getPool().connect(...args),
};
