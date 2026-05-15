import { neon } from '@neondatabase/serverless';
const sql = neon('postgresql://neondb_owner:npg_oTSf0lv2UIgK@ep-icy-fire-apzjhfup-pooler.c-7.us-east-1.aws.neon.tech/neondb?sslmode=require');

async function list() {
    try {
        const res = await sql`SELECT table_name FROM information_schema.tables WHERE table_schema = 'public'`;
        console.log(res);
    } catch (e) {
        console.error(e);
    }
}
list();
