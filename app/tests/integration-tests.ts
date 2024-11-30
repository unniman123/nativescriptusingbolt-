import { Supabase } from '../services/supabase';
import { AuthService } from '../services/auth-service';
import { ProfileService } from '../services/profile-service';
import { TournamentService } from '../services/tournament-service';
import { MatchService } from '../services/match-service';
import { WalletService } from '../services/wallet-service';
import { MatchmakingService } from '../services/matchmaking-service';

async function runIntegrationTests() {
    console.log('🔄 Starting Integration Tests...\n');
    let testUser: any = null;
    let testProfile: any = null;
    let testTournament: any = null;
    let testMatch: any = null;

    const supabase = new Supabase();
    const authService = new AuthService();
    const profileService = new ProfileService();
    const tournamentService = new TournamentService();
    const matchService = new MatchService();
    const walletService = new WalletService();
    const matchmakingService = new MatchmakingService();

    try {
        // 1. Authentication Tests
        console.log('1️⃣ Testing Authentication:');
        
        // Sign Up
        const testEmail = `test_${Date.now()}@example.com`;
        const testPassword = 'Test123!@#';
        const { data: signUpData, error: signUpError } = await authService.signUp({
            email: testEmail,
            password: testPassword
        });
        
        if (signUpError) throw signUpError;
        console.log('✅ Sign up successful');
        testUser = signUpData.user;

        // Sign In
        const { data: signInData, error: signInError } = await authService.signInWithPassword({
            email: testEmail,
            password: testPassword
        });
        
        if (signInError) throw signInError;
        console.log('✅ Sign in successful');

        // 2. Profile Tests
        console.log('\n2️⃣ Testing Profile Management:');
        
        // Create Profile
        const username = `testuser_${Date.now()}`;
        const { data: profile, error: profileError } = await profileService.createProfile({
            id: testUser.id,
            username: username,
            wallet_balance: 0
        });
            
        if (profileError) throw profileError;
        console.log('✅ Profile created successfully');
        testProfile = profile;

        // Update Profile
        const { error: updateError } = await profileService.updateProfile({
            game_id: 'GAME#123'
        }, testUser.id);
            
        if (updateError) throw updateError;
        console.log('✅ Profile updated successfully');

        // 3. Tournament Tests
        console.log('\n3️⃣ Testing Tournament System:');
        
        // Create Tournament
        const { data: tournament, error: tournamentError } = await tournamentService.createTournament({
            title: 'Test Tournament',
            game_type: 'Test Game',
            entry_fee: 10,
            prize_pool: 100,
            max_participants: 8,
            current_participants: 0,
            status: 'open'
        });
            
        if (tournamentError) throw tournamentError;
        console.log('✅ Tournament created successfully');
        testTournament = tournament;

        // Join Tournament
        const { error: joinError } = await tournamentService.joinTournament({
            tournament_id: testTournament.id,
            player1_id: testUser.id,
            status: 'scheduled'
        });
            
        if (joinError) throw joinError;
        console.log('✅ Tournament joined successfully');

        // 4. Match Tests
        console.log('\n4️⃣ Testing Match System:');
        
        // Create Match
        const { data: match, error: matchError } = await matchService.createMatch({
            tournament_id: testTournament.id,
            player1_id: testUser.id,
            status: 'scheduled',
            scheduled_time: new Date().toISOString()
        });
            
        if (matchError) throw matchError;
        console.log('✅ Match created successfully');
        testMatch = match;

        // Update Match Status
        const { error: updateMatchError } = await matchService.updateMatchStatus({
            status: 'in_progress'
        }, testMatch.id);
            
        if (updateMatchError) throw updateMatchError;
        console.log('✅ Match status updated successfully');

        // 5. Wallet Tests
        console.log('\n5️⃣ Testing Wallet System:');
        
        // Add Transaction
        const { error: transactionError } = await walletService.addTransaction({
            user_id: testUser.id,
            amount: 50,
            type: 'deposit',
            status: 'completed'
        });
            
        if (transactionError) throw transactionError;
        console.log('✅ Transaction created successfully');

        // Update Wallet Balance
        const { error: balanceError } = await walletService.updateWalletBalance({
            wallet_balance: 50
        }, testUser.id);
            
        if (balanceError) throw balanceError;
        console.log('✅ Wallet balance updated successfully');

        console.log('\n✅ All integration tests passed successfully!');

    } catch (error) {
        console.error('\n❌ Test failed:', error.message);
        
        // Cleanup on failure
        if (testMatch) {
            await matchService.deleteMatch(testMatch.id);
        }
        if (testTournament) {
            await tournamentService.deleteTournament(testTournament.id);
        }
        if (testProfile) {
            await profileService.deleteProfile(testProfile.id);
        }
        if (testUser) {
            await authService.deleteUser(testUser.id);
        }
    }
}

runIntegrationTests();
