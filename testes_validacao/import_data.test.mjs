import { describe, it, expect } from 'vitest';
import { neon } from '@neondatabase/serverless';
import xlsx from 'xlsx';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

dotenv.config();

const sql = neon(process.env.DATABASE_URL);
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const dadosDir = path.resolve(__dirname, '..', 'dados');

describe('Data Import Validation', () => {
  it('should have the same number of rows in movimentacao_tecnico as the Excel file', async () => {
    const file = path.join(dadosDir, 'planilha_movimentacao_tecnico.xlsx');
    const workbook = xlsx.readFile(file);
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    const excelData = xlsx.utils.sheet_to_json(sheet);
    const excelRowCount = excelData.length;

    const dbResult = await sql`SELECT COUNT(*) as count FROM movimentacao_tecnico`;
    const dbRowCount = parseInt(dbResult[0].count);

    expect(dbRowCount).toBeGreaterThan(0);
    expect(dbRowCount).toBe(excelRowCount);
  });

  it('should have the same number of rows in relatorio_equipamento as the Excel file', async () => {
    const file = path.join(dadosDir, 'relatorio_equipamento.xlsx');
    const workbook = xlsx.readFile(file);
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    const excelData = xlsx.utils.sheet_to_json(sheet);
    const excelRowCount = excelData.length;

    const dbResult = await sql`SELECT COUNT(*) as count FROM relatorio_equipamento`;
    const dbRowCount = parseInt(dbResult[0].count);

    expect(dbRowCount).toBeGreaterThan(0);
    expect(dbRowCount).toBe(excelRowCount);
  });
});
