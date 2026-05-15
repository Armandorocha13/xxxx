import { neon } from '@neondatabase/serverless';
import dotenv from 'dotenv';

dotenv.config();

const sql = neon(process.env.DATABASE_URL);

async function setup() {
  console.log('Creating tables...');

  try {
    // Table: movimentacao_tecnico
    await sql`
      CREATE TABLE IF NOT EXISTS movimentacao_tecnico (
        id SERIAL PRIMARY KEY,
        dt_solicitacao TEXT,
        base TEXT,
        enviado_por TEXT,
        miscelanea TEXT,
        sap TEXT,
        quantidade TEXT,
        recebido_por TEXT,
        dt_resposta TEXT,
        aceite_destinatario TEXT,
        valor TEXT
      )
    `;
    console.log('Table movimentacao_tecnico created or already exists.');

    // Table: relatorio_equipamento
    await sql`
      CREATE TABLE IF NOT EXISTS relatorio_equipamento (
        id SERIAL PRIMARY KEY,
        novo TEXT,
        alterado_por TEXT,
        codigo TEXT,
        sap TEXT,
        valor_eqp TEXT,
        modelo TEXT,
        serial TEXT,
        mac TEXT,
        descricao TEXT,
        status TEXT,
        observacao TEXT,
        observacao_tecnico TEXT,
        tecnico TEXT,
        atualizado_por TEXT,
        login TEXT,
        re TEXT,
        wo TEXT,
        contrato TEXT,
        servico TEXT,
        data_contrato TEXT,
        os TEXT,
        cidade TEXT,
        base TEXT,
        dmt_lote TEXT,
        data_alteracao TEXT,
        hora_alteracao TEXT
      )
    `;
    console.log('Table relatorio_equipamento created or already exists.');

  } catch (error) {
    console.error('Error during setup:', error);
  }
}

setup();
