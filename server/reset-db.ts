
import { Client } from 'pg';
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';
dotenv.config();

async function resetDb() {
    const client = new Client({
        connectionString: process.env.DATABASE_URL,
    });

    try {
        await client.connect();
        console.log('Connected to PostgreSQL');

        console.log('Dropping existing tables and types...');
        const dropQueries = [
            'DROP TRIGGER IF EXISTS on_user_created ON public.users',
            'DROP FUNCTION IF EXISTS public.handle_new_user()',
            'DROP TABLE IF EXISTS public.snapshots CASCADE',
            'DROP TABLE IF EXISTS public.collaborators CASCADE',
            'DROP TABLE IF EXISTS public.documents CASCADE',
            'DROP TABLE IF EXISTS public.profiles CASCADE',
            'DROP TABLE IF EXISTS public.user_settings CASCADE',
            'DROP TABLE IF EXISTS public.refresh_tokens CASCADE',
            'DROP TABLE IF EXISTS public.users CASCADE',
            'DROP TYPE IF EXISTS public.collaboration_role CASCADE'
        ];

        for (const query of dropQueries) {
            try {
                await client.query(query);
            } catch (err) {
                console.log(`Note: ${query} skipped`);
            }
        }

        const sqlPath = path.join(__dirname, 'schema.sql');
        const sql = fs.readFileSync(sqlPath, 'utf8');

        console.log('Executing updated schema.sql...');
        await client.query(sql);

        console.log('✅ Database reset successfully!');

    } catch (err) {
        console.error('Error resetting database:', err);
    } finally {
        await client.end();
    }
}

resetDb();
