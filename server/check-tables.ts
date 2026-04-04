
import { Client } from 'pg';
import dotenv from 'dotenv';
dotenv.config();

async function checkTables() {
    const client = new Client({
        connectionString: process.env.DATABASE_URL,
    });

    try {
        await client.connect();
        console.log('Connected to PostgreSQL');

        const res = await client.query(`
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_schema = 'public'
        `);

        console.log('Tables in public schema:');
        res.rows.forEach(row => console.log(`- ${row.table_name}`));

        if (res.rows.length === 0) {
            console.log('No tables found in public schema.');
        }

    } catch (err) {
        console.error('Error connecting to PostgreSQL:', err);
    } finally {
        await client.end();
    }
}

checkTables();
