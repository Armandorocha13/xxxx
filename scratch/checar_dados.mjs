import { neon } from '@neondatabase/serverless';
const sql = neon('postgresql://neondb_owner:npg_oTSf0lv2UIgK@ep-icy-fire-apzjhfup-pooler.c-7.us-east-1.aws.neon.tech/neondb?sslmode=require');

async function check() {
    try {
        const res = await sql`SELECT tecnico, base, descricao, status, data_contrato FROM relatorio_equipamento LIMIT 5`;
        console.log(JSON.stringify(res, null, 2));
    } catch (e) {
        console.error(e);
    }
}
check();
