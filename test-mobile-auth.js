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

async function testMobileAuth() {
    try {
        console.log('🔄 Testing Mobile Authentication Flow...\n');

        // 1. Sign Up
        const testEmail = `test_${Date.now()}@example.com`;
        const testPassword = 'Test123!@#';
        
        console.log('1️⃣ Testing Sign Up with Mobile Redirect:');
        const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
            email: testEmail,
            password: testPassword,
            options: {
                emailRedirectTo: 'nativescriptapp://auth/callback'
            }
        });

        if (signUpError) throw signUpError;
        console.log('✅ Sign up successful');
        console.log('📧 Verification email has been sent to:', testEmail);
        console.log('⚠️ Please check your email and verify your account');
        console.log('📱 The verification link will open in your mobile app');

        // Instructions
        console.log('\n📝 Next Steps:');
        console.log('1. Check your email for the verification link');
        console.log('2. Open the link on your mobile device with the app installed');
        console.log('3. The app will handle the verification automatically');
        console.log('4. You can then sign in using the app');

    } catch (error) {
        console.error('❌ Authentication test failed:', error.message);
    }
}

testMobileAuth();
