
import { Client } from 'pg';
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';
dotenv.config();

async function initializeDb() {
    const client = new Client({
        connectionString: process.env.DATABASE_URL,
    });

    try {
        await client.connect();
        console.log('Connected to PostgreSQL');

        const sqlPath = path.join(__dirname, 'schema.sql');
        const sql = fs.readFileSync(sqlPath, 'utf8');

        console.log('Executing schema.sql...');
        
        // Split by semicolons, but be careful with functions/triggers
        // Postgres can handle multiple statements if they are valid
        // But for clarity we'll just run the whole block if possible
        await client.query(sql);

        console.log('✅ Database initialized successfully!');

    } catch (err) {
        console.error('Error initializing database:', err);
    } finally {
        await client.end();
    }
}

initializeDb();
