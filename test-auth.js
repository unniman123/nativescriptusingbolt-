const { createClient } = require('@supabase/supabase-js');
const fetch = require('cross-fetch');

const supabaseUrl = 'https://juouxhxiyxmwyhkupvca.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp1b3V4aHhpeXhtd3loa3VwdmNhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzI2MjkwMzcsImV4cCI6MjA0ODIwNTAzN30.q26TZuw-kbIWFt5WsR7f8ZqE0fXT-ZAss98GuRI_-bM';

const supabase = createClient(supabaseUrl, supabaseKey, {
    auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: false
    },
    global: {
        fetch: fetch
    }
});

async function testAuthFlow() {
    try {
        console.log('🔄 Testing Authentication Flow...\n');

        // 1. Sign Up
        const testEmail = `test_${Date.now()}@example.com`;
        const testPassword = 'Test123!@#';
        
        console.log('1️⃣ Testing Sign Up:');
        const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
            email: testEmail,
            password: testPassword,
            options: {
                emailRedirectTo: 'http://localhost:3000/auth/callback'
            }
        });

        if (signUpError) throw signUpError;
        console.log('✅ Sign up successful');
        console.log('📧 Verification email has been sent to:', testEmail);
        console.log('⚠️ Please check your email and verify your account');

        // 2. Check Email Verification Status
        console.log('\n2️⃣ Checking Email Verification Status:');
        const { data: { user }, error: userError } = await supabase.auth.getUser();
        
        if (userError) throw userError;
        
        const isVerified = user?.email_confirmed_at !== null;
        console.log(isVerified ? '✅ Email verified' : '⏳ Email not yet verified');

        // 3. Sign In (will work after email verification)
        console.log('\n3️⃣ Testing Sign In:');
        const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
            email: testEmail,
            password: testPassword
        });

        if (signInError) {
            console.log('⚠️ Sign in failed - Please verify your email first');
        } else {
            console.log('✅ Sign in successful');
        }

        // Instructions
        console.log('\n📝 Next Steps:');
        console.log('1. Check your email for the verification link');
        console.log('2. Click the verification link');
        console.log('3. Run this test again to verify successful sign-in');

    } catch (error) {
        console.error('❌ Authentication test failed:', error.message);
    }
}

testAuthFlow();
