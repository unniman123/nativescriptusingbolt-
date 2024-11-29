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

async function runAllTests() {
    console.log('🔄 Running All Tests\n');
    let testUser = null;
    
    try {
        // 1. Database Connection
        console.log('1️⃣ Testing Database Connection:');
        const { data, error } = await supabase.from('profiles').select('count');
        if (error) throw error;
        console.log('✅ Database connection successful\n');

        // 2. Authentication
        console.log('2️⃣ Testing Authentication:');
        const email = `test_${Date.now()}@example.com`;
        const password = 'Test123!@#';

        // Sign Up
        const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
            email,
            password
        });
        if (signUpError) throw signUpError;
        console.log('✅ Sign up successful');
        testUser = signUpData.user;

        // Sign In
        const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
            email,
            password
        });
        if (signInError) throw signInError;
        console.log('✅ Sign in successful\n');

        // 3. Database Operations
        console.log('3️⃣ Testing Database Operations:');

        // Create Profile
        const { error: profileError } = await supabase
            .from('profiles')
            .insert([{
                id: testUser.id,
                username: `test_${Date.now()}`,
                wallet_balance: 0
            }]);
        if (profileError) throw profileError;
        console.log('✅ Profile creation successful');

        // Create Tournament
        const { data: tournament, error: tournamentError } = await supabase
            .from('tournaments')
            .insert([{
                title: 'Test Tournament',
                game_type: 'Test Game',
                entry_fee: 10,
                prize_pool: 100,
                max_participants: 8,
                current_participants: 0,
                status: 'open'
            }])
            .select()
            .single();
        if (tournamentError) throw tournamentError;
        console.log('✅ Tournament creation successful');

        // Create Match
        const { error: matchError } = await supabase
            .from('matches')
            .insert([{
                tournament_id: tournament.id,
                player1_id: testUser.id,
                status: 'scheduled'
            }]);
        if (matchError) throw matchError;
        console.log('✅ Match creation successful');

        // Create Transaction
        const { error: transactionError } = await supabase
            .from('transactions')
            .insert([{
                user_id: testUser.id,
                amount: 50,
                type: 'deposit',
                status: 'completed'
            }]);
        if (transactionError) throw transactionError;
        console.log('✅ Transaction creation successful\n');

        // 4. Performance Tests
        console.log('4️⃣ Testing Performance:');
        
        // Test complex query
        const startTime = Date.now();
        const { data: matches, error: matchesError } = await supabase
            .from('matches')
            .select(`
                *,
                tournament:tournaments(*),
                player1:profiles!player1_id(*),
                player2:profiles!player2_id(*)
            `)
            .limit(50);
        const duration = Date.now() - startTime;
        
        if (matchesError) throw matchesError;
        console.log(`✅ Complex query completed in ${duration}ms`);

        if (duration > 1000) {
            console.log('⚠️ Warning: Query took longer than 1 second');
        }

        console.log('\n✅ All tests completed successfully!');

    } catch (error) {
        console.error('\n❌ Test failed:', error.message);
    } finally {
        // Cleanup
        if (testUser) {
            try {
                await supabase
                    .from('matches')
                    .delete()
                    .eq('player1_id', testUser.id);
                
                await supabase
                    .from('transactions')
                    .delete()
                    .eq('user_id', testUser.id);
                
                await supabase
                    .from('profiles')
                    .delete()
                    .eq('id', testUser.id);
                
                console.log('\n🧹 Cleanup completed');
            } catch (error) {
                console.error('Cleanup failed:', error.message);
            }
        }
    }
}

runAllTests();
