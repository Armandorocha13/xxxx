import { describe, it, expect, beforeAll } from 'vitest';
import { neon } from '@neondatabase/serverless';
import dotenv from 'dotenv';

dotenv.config();

const sql = neon(process.env.DATABASE_URL);

describe('Database Schema Validation', () => {
  it('should have the movimentacao_tecnico table with correct columns', async () => {
    const result = await sql`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'movimentacao_tecnico'
    `;
    
    const columns = result.map(r => r.column_name);
    const expectedHeaders = [
      'dt_solicitacao', 'base', 'enviado_por', 'miscelanea', 'sap', 
      'quantidade', 'recebido_por', 'dt_resposta', 'aceite_destinatario', 'valor'
    ];

    expectedHeaders.forEach(header => {
      expect(columns).toContain(header.toLowerCase());
    });
  });

  it('should have the relatorio_equipamento table with correct columns', async () => {
    const result = await sql`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'relatorio_equipamento'
    `;
    
    const columns = result.map(r => r.column_name);
    const expectedColumns = [
      'novo', 'alterado_por', 'codigo', 'sap', 'valor_eqp', 'modelo', 
      'serial', 'mac', 'descricao', 'status', 'observacao', 
      'observacao_tecnico', 'tecnico', 'atualizado_por', 'login', 're', 
      'wo', 'contrato', 'servico', 'data_contrato', 'os', 'cidade', 
      'base', 'dmt_lote', 'data_alteracao', 'hora_alteracao'
    ];

    expectedColumns.forEach(col => {
      expect(columns).toContain(col);
    });
  });
});
