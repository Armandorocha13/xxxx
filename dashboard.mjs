import { neon } from '@neondatabase/serverless';
import dotenv from 'dotenv';

dotenv.config();
const sql = neon(process.env.DATABASE_URL);

export async function getDashboardData(filters = {}) {
  const { name, material, base } = filters;
  
  // Base query filter
  let filterSql = '';
  const params = [];
  if (name && name !== 'all') {
    params.push(name);
    filterSql += ` AND recebido_por = $${params.length}`;
  }
  if (material && material !== 'all') {
    params.push(material);
    filterSql += ` AND miscelanea = $${params.length}`;
  }
  if (base && base !== 'all') {
    params.push(base);
    filterSql += ` AND base = $${params.length}`;
  }

  // 1. KPIs
  const kpisResult = await sql.query(`
    SELECT 
      COUNT(*) FILTER (WHERE aceite_destinatario = 'Aceito') as accepted,
      COUNT(*) FILTER (WHERE aceite_destinatario = 'Sem resposta' OR aceite_destinatario IS NULL OR aceite_destinatario = '') as pending
    FROM movimentacao_tecnico
    WHERE 1=1 ${filterSql}
  `, params);

  // 2. Top 5 Pending
  const topPendingResult = await sql.query(`
    SELECT recebido_por as name, COUNT(*) as count
    FROM movimentacao_tecnico
    WHERE (aceite_destinatario = 'Sem resposta' OR aceite_destinatario IS NULL OR aceite_destinatario = '')
    ${filterSql}
    GROUP BY recebido_por
    ORDER BY count DESC
    LIMIT 5
  `, params);

  // 3. Base Distribution (Pending Only)
  const baseDistResult = await sql.query(`
    SELECT base, COUNT(*) as count
    FROM movimentacao_tecnico
    WHERE (aceite_destinatario = 'Sem resposta' OR aceite_destinatario IS NULL OR aceite_destinatario = '')
    ${filterSql}
    GROUP BY base
    ORDER BY count DESC
  `, params);

  // 4. Summary Table (Count of PENDING rows per Tech/Material)
  const summaryTableResult = await sql.query(`
    SELECT 
      recebido_por as name, 
      miscelanea as material, 
      COUNT(*) as count
    FROM movimentacao_tecnico
    WHERE (aceite_destinatario = 'Sem resposta' OR aceite_destinatario IS NULL OR aceite_destinatario = '')
    ${filterSql}
    GROUP BY recebido_por, miscelanea
    ORDER BY count DESC
    LIMIT 1000
  `, params);

  // 5. Filter values (Unique lists)
  const [techList, baseList, matList] = await Promise.all([
    sql.query(`SELECT DISTINCT recebido_por FROM movimentacao_tecnico WHERE recebido_por IS NOT NULL ORDER BY recebido_por`),
    sql.query(`SELECT DISTINCT base FROM movimentacao_tecnico WHERE base IS NOT NULL ORDER BY base`),
    sql.query(`SELECT DISTINCT miscelanea FROM movimentacao_tecnico WHERE miscelanea IS NOT NULL ORDER BY miscelanea`)
  ]);

  const rowsKpis = kpisResult.rows || kpisResult;
  const rowsTopPending = topPendingResult.rows || topPendingResult;
  const rowsBaseDist = baseDistResult.rows || baseDistResult;
  const rowsSummary = summaryTableResult.rows || summaryTableResult;

  return {
    kpis: {
      accepted: parseInt(rowsKpis[0]?.accepted || 0),
      pending: parseInt(rowsKpis[0]?.pending || 0)
    },
    topPending: rowsTopPending,
    baseDistribution: rowsBaseDist,
    summaryTable: rowsSummary,
    filters: {
      technicians: (techList.rows || techList).map(r => r.recebido_por),
      bases: (baseList.rows || baseList).map(r => r.base),
      materials: (matList.rows || matList).map(r => r.miscelanea)
    }
  };
}
