import { neon } from '@neondatabase/serverless';
import dotenv from 'dotenv';
dotenv.config();

const sql = neon(process.env.DATABASE_URL);

async function check() {
  const result = await sql`SELECT DISTINCT aceite_destinatario FROM movimentacao_tecnico`;
  console.log('Unique status values:', result);
}

check();
