import formidable from 'formidable';
import fs from 'fs';
import xlsx from 'xlsx';
import { neon } from '@neondatabase/serverless';
import { configuracoes } from '../configuracoes/configuracao_global.mjs';

const sql = neon(configuracoes.urlBancoDados);

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

async function processarArquivoEInserir(filePath, tableName, mapping = null) {
  const workbook = xlsx.readFile(filePath);
  const sheet = workbook.Sheets[workbook.SheetNames[0]];
  const data = xlsx.utils.sheet_to_json(sheet);

  console.log(`Limpando tabela ${tableName}...`);
  await sql.query(`TRUNCATE TABLE ${tableName} RESTART IDENTITY`);

  const chunkSize = 100;
  for (let i = 0; i < data.length; i += chunkSize) {
    const chunk = data.slice(i, i + chunkSize);

    // Determina as colunas com base na primeira linha do chunk
    const primeiraLinha = chunk[0];
    const columns = [];
    for (const key of Object.keys(primeiraLinha)) {
      if (mapping && mapping[key]) {
        columns.push({ original: key, colName: mapping[key] });
      } else if (!mapping) {
        columns.push({ original: key, colName: key.toLowerCase().replace(/ /g, '_').replace(/[^\w]/g, '') });
      }
    }

    if (columns.length === 0) continue;

    // Constrói um único INSERT multi-row para o chunk inteiro
    const allValues = [];
    const rowPlaceholders = chunk.map((row) => {
      const rowVals = columns.map(({ original }) => {
        const v = row[original];
        allValues.push(v === undefined ? null : String(v));
        return `$${allValues.length}`;
      });
      return `(${rowVals.join(', ')})`;
    });

    const colNames = columns.map(c => c.colName).join(', ');
    const query = `INSERT INTO ${tableName} (${colNames}) VALUES ${rowPlaceholders.join(', ')}`;
    await sql.query(query, allValues);
  }

  // Marca o timestamp de importação em todos os registros inseridos agora
  await sql.query(`UPDATE ${tableName} SET data_importacao = NOW() WHERE data_importacao IS NULL`);
}

export async function controladorUpload(req, res) {
  const form = formidable({ multiples: false });

  form.parse(req, async (err, fields, files) => {
    if (err) {
      console.error('[ERRO] Falha ao processar form:', err);
      res.writeHead(400, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ erro: 'Erro no processamento do arquivo enviado.' }));
      return;
    }

    const projetoArray = fields.projeto;
    const projeto = Array.isArray(projetoArray) ? projetoArray[0] : projetoArray;
    
    const arquivoArray = files.arquivo;
    const arquivo = Array.isArray(arquivoArray) ? arquivoArray[0] : arquivoArray;

    if (!projeto || !arquivo) {
      res.writeHead(400, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ erro: 'Projeto ou arquivo não fornecidos.' }));
      return;
    }

    try {
      if (projeto === 'EMIS') {
        await processarArquivoEInserir(arquivo.filepath, 'movimentacao_tecnico', null);
      } else if (projeto === 'ETER') {
        await processarArquivoEInserir(arquivo.filepath, 'relatorio_equipamento', mappingEquipamento);
      } else {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ erro: 'Projeto inválido.' }));
        return;
      }

      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ sucesso: true, mensagem: 'Dados importados com sucesso.' }));
    } catch (error) {
      console.error('[ERRO] Falha ao importar dados:', error);
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ erro: 'Erro ao inserir dados no banco de dados.' }));
    }
  });
}
