import xlsx from 'xlsx';
import fs from 'fs';

const files = ['planilha_movimentacao_tecnico.xlsx', 'relatorio_equipamento.xlsx'];

files.forEach(file => {
  if (fs.existsSync(file)) {
    const workbook = xlsx.readFile(file);
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];
    const data = xlsx.utils.sheet_to_json(sheet, { header: 1 });
    console.log(`Headers for ${file}:`, data[0]);
  } else {
    console.log(`File not found: ${file}`);
  }
});
