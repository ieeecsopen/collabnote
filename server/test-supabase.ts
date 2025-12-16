
import { supabase } from './src/config/database';
import dotenv from 'dotenv';
dotenv.config();

async function testConnection() {
    console.log('Testing Supabase Connection...');
    console.log('URL:', process.env.SUPABASE_URL);

    // reliable way to check connection without needing specific tables:
    // check if we can get the auth settings or just make a simple call.
    // We'll try to get the 'health' of the service indirectly or just a simple query.

    try {
        // Even if this returns an empty array or error about table missing, 
        // the network request succeeding proves the API is working.
        const { data, error, status } = await supabase.from('random_table_check').select('*').limit(1);

        console.log('Status Code:', status);

        if (status === 0 || status === 500) {
            // 0 usually means network error/fetch failed
            console.error('Network Error / Connection Failed');
        } else {
            console.log('✅ Connection to Supabase API successful!');
            if (error) {
                console.log('(Note: Query failed as expected since table likely doesn\'t exist, but API is reachable)');
                console.log('Supabase Message:', error.message);
            }
        }


    } catch (err) {
        console.error('Unexpected error:', err);
    }
}

async function testAuth() {
    console.log('\nTesting Supabase Auth...');
    const email = `test_${Date.now()}@example.com`;
    // Use a complex password to meet potential security policies
    const password = 'Password123!';

    console.log(`Attempting to sign up user: ${email}`);

    // 1. Sign Up
    const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
    });

    if (signUpError) {
        console.error('❌ Sign Up Error:', signUpError.message);
        return;
    }

    console.log('✅ Sign Up Successful. User ID:', signUpData.user?.id);

    // 2. Sign In / Check Session
    let accessToken = signUpData.session?.access_token;

    if (accessToken) {
        console.log('Session metadata retrieved immediately (Auto-confirm enabled or not required).');
    } else {
        console.log('No session from Sign Up. Attempting Sign In...');

        const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
            email,
            password,
        });

        if (signInError) {
            console.error('❌ Sign In Error:', signInError.message);
            if (signInError.message.includes('Email not confirmed')) {
                console.log('NOTE: Email confirmation is required. Please check your email or disable email confirmation in Supabase dashboard for testing.');
            }
            return;
        }

        console.log('✅ Sign In Successful');
        accessToken = signInData.session?.access_token;
    }

    if (accessToken) {
        // 3. Verify Token
        const { data: { user }, error } = await supabase.auth.getUser(accessToken);

        if (error) {
            console.error('❌ Token Verification Failed:', error.message);
        } else {
            console.log('✅ Token Verified Successfully! User ID:', user?.id);
        }
    } else {
        console.error('❌ Could not get access token to verify.');
    }
}

async function runTests() {
    await testConnection();
    await testAuth();
}

runTests();
