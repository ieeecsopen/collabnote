
import { supabase } from './src/config/database';
import dotenv from 'dotenv';
dotenv.config();

async function testConnection() {
    console.log('Testing Supabase Connection...');
    const { data, error } = await supabase.from('test').select('*');
    if (error) {
        console.error('Connection Error:', error.message);
    } else {
        console.log('Connection Successful!', data);
    }
}

testConnection();
