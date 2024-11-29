const { createClient } = require('@supabase/supabase-js');
const fetch = require('cross-fetch');

const supabaseUrl = 'https://juouxhxiyxmwyhkupvca.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp1b3V4aHhpeXhtd3loa3VwdmNhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzI2MjkwMzcsImV4cCI6MjA0ODIwNTAzN30.q26TZuw-kbIWFt5WsR7f8ZqE0fXT-ZAss98GuRI_-bM';

const options = {
    auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: false
    },
    global: {
        fetch: fetch
    }
};

const supabase = createClient(supabaseUrl, supabaseKey, options);

async function runTests() {
    console.log('🔄 Starting Supabase Connection Tests...\n');

    // Test 1: Connection Test
    try {
        console.log('1️⃣ Testing Supabase Connection:');
        const { data, error } = await supabase.from('profiles').select('count');
        
        if (error) throw error;
        console.log('✅ Supabase connection successful!\n');
    } catch (error) {
        console.error('❌ Supabase connection failed:', error.message, '\n');
    }

    // Test 2: Table Verification
    const tables = ['profiles', 'tournaments', 'matches', 'transactions'];
    console.log('2️⃣ Verifying Database Tables:');
    
    for (const table of tables) {
        try {
            const { data, error } = await supabase.from(table).select('count');
            
            if (error) {
                console.error(`❌ Table '${table}' verification failed:`, error.message);
            } else {
                console.log(`✅ Table '${table}' exists and is accessible`);
            }
        } catch (error) {
            console.error(`❌ Error checking table '${table}':`, error.message);
        }
    }
    console.log('\n');

    // Test 3: Basic Auth Test
    try {
        console.log('3️⃣ Testing Authentication:');
        const testEmail = `test_${Date.now()}@example.com`;
        const testPassword = 'Test123!@#';

        const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
            email: testEmail,
            password: testPassword
        });

        if (signUpError) throw signUpError;
        console.log('✅ User registration successful');

        const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
            email: testEmail,
            password: testPassword
        });

        if (signInError) throw signInError;
        console.log('✅ User login successful');

    } catch (error) {
        console.error('❌ Authentication test failed:', error.message);
    }
}

runTests();
