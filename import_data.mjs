import { neon } from '@neondatabase/serverless';
import xlsx from 'xlsx';
import dotenv from 'dotenv';
import fs from 'fs';

dotenv.config();

const sql = neon(process.env.DATABASE_URL);

async function clearTables() {
  console.log('Clearing existing data...');
  await sql`TRUNCATE TABLE movimentacao_tecnico, relatorio_equipamento RESTART IDENTITY`;
}

async function importFile(fileName, tableName, mapping = null) {
  console.log(`Importing ${fileName} into ${tableName}...`);
  const workbook = xlsx.readFile(fileName);
  const sheet = workbook.Sheets[workbook.SheetNames[0]];
  const data = xlsx.utils.sheet_to_json(sheet);

  const chunkSize = 100;
  for (let i = 0; i < data.length; i += chunkSize) {
    const chunk = data.slice(i, i + chunkSize);
    console.log(`Inserting chunk ${i / chunkSize + 1} of ${Math.ceil(data.length / chunkSize)}...`);
    
    await Promise.all(chunk.map(async (row) => {
      const columns = [];
      const values = [];
      
      for (const [key, value] of Object.entries(row)) {
        let colName = key;
        if (mapping && mapping[key]) {
          colName = mapping[key];
        } else if (!mapping) {
          colName = key.toLowerCase().replace(/ /g, '_').replace(/[^\w]/g, '');
        } else {
          continue;
        }
        columns.push(colName);
        values.push(value === undefined ? null : String(value));
      }

      if (columns.length > 0) {
        const query = `INSERT INTO ${tableName} (${columns.join(', ')}) VALUES (${columns.map((_, i) => `$${i + 1}`).join(', ')})`;
        await sql.query(query, values);
      }
    }));
  }
  console.log(`Finished importing ${fileName}.`);
}

const mappingEquipamento = {
  'NOVO': 'novo',
  'ALTERADO POR': 'alterado_por',
  'CODIGO': 'codigo',
  'SAP': 'sap',
  'VALOR EQP': 'valor_eqp',
  'MODELO': 'modelo',
  'SERIAL': 'serial',
  'MAC': 'mac',
  'DESCRICAO': 'descricao',
  'STATUS': 'status',
  'OBSERVACAO': 'observacao',
  'OBSERVACAO TÉCNICO': 'observacao_tecnico',
  'TECNICO': 'tecnico',
  'ATUALIZADO POR': 'atualizado_por',
  'LOGIN': 'login',
  'RE': 're',
  'WO': 'wo',
  'CONTRATO': 'contrato',
  'SERVIÇO': 'servico',
  'DATA CONTRATO': 'data_contrato',
  'OS': 'os',
  'CIDADE': 'cidade',
  'BASE': 'base',
  'DMT/LOTE': 'dmt_lote',
  'DATA ALTERAÇÃO': 'data_alteracao',
  'HORA ALTERAÇÃO': 'hora_alteracao'
};

async function main() {
  try {
    await clearTables();
    await importFile('planilha_movimentacao_tecnico.xlsx', 'movimentacao_tecnico');
    await importFile('relatorio_equipamento.xlsx', 'relatorio_equipamento', mappingEquipamento);
    console.log('All imports completed successfully!');
  } catch (error) {
    console.error('Import failed:', error);
  }
}

main();
