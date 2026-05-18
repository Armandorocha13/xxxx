import { neon } from '@neondatabase/serverless';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '..', '.env') });

const sql = neon(process.env.DATABASE_URL);

async function main() {
  try {
    console.log('Adicionando coluna data_importacao em movimentacao_tecnico...');
    await sql`ALTER TABLE movimentacao_tecnico ADD COLUMN IF NOT EXISTS data_importacao TIMESTAMP DEFAULT NOW()`;
    console.log('Sucesso!');

    console.log('Adicionando coluna data_importacao em relatorio_equipamento...');
    await sql`ALTER TABLE relatorio_equipamento ADD COLUMN IF NOT EXISTS data_importacao TIMESTAMP DEFAULT NOW()`;
    console.log('Sucesso!');
  } catch (err) {
    console.error('Erro:', err);
  }
}

main();
