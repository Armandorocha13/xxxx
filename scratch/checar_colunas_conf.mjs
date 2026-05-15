import { neon } from '@neondatabase/serverless';
const sql = neon('postgresql://neondb_owner:npg_oTSf0lv2UIgK@ep-icy-fire-apzjhfup-pooler.c-7.us-east-1.aws.neon.tech/neondb?sslmode=require');

async function check() {
    try {
        const res = await sql.query(`SELECT column_name FROM information_schema.columns WHERE table_name = 'relatorio_equipamento' AND column_name LIKE '%conf%'`);
        console.log(res.rows);
    } catch (e) {
        console.error(e);
    }
}
check();
