import { supabase } from '../services/supabase';
import { authService } from '../services/auth-service';
import { profileService } from '../services/profile-service';
import { tournamentService } from '../services/tournament-service';
import { matchService } from '../services/match-service';
import { walletService } from '../services/wallet-service';
import { matchmakingService } from '../services/matchmaking-service';

async function runIntegrationTests() {
    console.log('🔄 Starting Integration Tests...\n');
    let testUser: any = null;
    let testProfile: any = null;
    let testTournament: any = null;
    let testMatch: any = null;

    try {
        // 1. Authentication Tests
        console.log('1️⃣ Testing Authentication:');
        
        // Sign Up
        const testEmail = `test_${Date.now()}@example.com`;
        const testPassword = 'Test123!@#';
        const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
            email: testEmail,
            password: testPassword
        });
        
        if (signUpError) throw signUpError;
        console.log('✅ Sign up successful');
        testUser = signUpData.user;

        // Sign In
        const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
            email: testEmail,
            password: testPassword
        });
        
        if (signInError) throw signInError;
        console.log('✅ Sign in successful');

        // 2. Profile Tests
        console.log('\n2️⃣ Testing Profile Management:');
        
        // Create Profile
        const username = `testuser_${Date.now()}`;
        const { data: profile, error: profileError } = await supabase
            .from('profiles')
            .insert([{
                id: testUser.id,
                username: username,
                wallet_balance: 0
            }])
            .select()
            .single();
            
        if (profileError) throw profileError;
        console.log('✅ Profile created successfully');
        testProfile = profile;

        // Update Profile
        const { error: updateError } = await supabase
            .from('profiles')
            .update({ game_id: 'GAME#123' })
            .eq('id', testUser.id);
            
        if (updateError) throw updateError;
        console.log('✅ Profile updated successfully');

        // 3. Tournament Tests
        console.log('\n3️⃣ Testing Tournament System:');
        
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
        console.log('✅ Tournament created successfully');
        testTournament = tournament;

        // Join Tournament
        const { error: joinError } = await supabase
            .from('matches')
            .insert([{
                tournament_id: testTournament.id,
                player1_id: testUser.id,
                status: 'scheduled'
            }]);
            
        if (joinError) throw joinError;
        console.log('✅ Tournament joined successfully');

        // 4. Match Tests
        console.log('\n4️⃣ Testing Match System:');
        
        // Create Match
        const { data: match, error: matchError } = await supabase
            .from('matches')
            .insert([{
                tournament_id: testTournament.id,
                player1_id: testUser.id,
                status: 'scheduled',
                scheduled_time: new Date().toISOString()
            }])
            .select()
            .single();
            
        if (matchError) throw matchError;
        console.log('✅ Match created successfully');
        testMatch = match;

        // Update Match Status
        const { error: updateMatchError } = await supabase
            .from('matches')
            .update({ status: 'in_progress' })
            .eq('id', testMatch.id);
            
        if (updateMatchError) throw updateMatchError;
        console.log('✅ Match status updated successfully');

        // 5. Wallet Tests
        console.log('\n5️⃣ Testing Wallet System:');
        
        // Add Transaction
        const { error: transactionError } = await supabase
            .from('transactions')
            .insert([{
                user_id: testUser.id,
                amount: 50,
                type: 'deposit',
                status: 'completed'
            }]);
            
        if (transactionError) throw transactionError;
        console.log('✅ Transaction created successfully');

        // Update Wallet Balance
        const { error: balanceError } = await supabase
            .from('profiles')
            .update({ wallet_balance: 50 })
            .eq('id', testUser.id);
            
        if (balanceError) throw balanceError;
        console.log('✅ Wallet balance updated successfully');

        console.log('\n✅ All integration tests passed successfully!');

    } catch (error) {
        console.error('\n❌ Test failed:', error.message);
        
        // Cleanup on failure
        if (testMatch) {
            await supabase.from('matches').delete().eq('id', testMatch.id);
        }
        if (testTournament) {
            await supabase.from('tournaments').delete().eq('id', testTournament.id);
        }
        if (testProfile) {
            await supabase.from('profiles').delete().eq('id', testProfile.id);
        }
        if (testUser) {
            await supabase.auth.admin.deleteUser(testUser.id);
        }
    }
}

runIntegrationTests();
