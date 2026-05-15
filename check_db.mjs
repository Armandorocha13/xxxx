import { neon } from '@neondatabase/serverless';
import dotenv from 'dotenv';
dotenv.config();
const sql = neon(process.env.DATABASE_URL);
const result = await sql`SELECT aceite_destinatario, COUNT(*) FROM movimentacao_tecnico GROUP BY aceite_destinatario`;
console.log(result);
