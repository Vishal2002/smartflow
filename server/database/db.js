import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const { Pool } = pg;


export const pool = new Pool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  ssl: {
    rejectUnauthorized: true,
    ca: process.env.DB_CA,
  },
  max: 10,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 5000,
});

export async function testConnection() {
  try {
    const { rows } = await pool.query('SELECT version()');
    console.log('✅ PostgreSQL connected');
    console.log(rows[0].version);
    return true;
  } catch (err) {
    console.error('❌ DB connection failed:', err.message);
    return false;
  }
}
