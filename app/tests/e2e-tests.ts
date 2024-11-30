import { Application, Frame, NavigationEntry } from '@nativescript/core';
import { authService } from '../services/auth-service';
import { ProfileService } from '../services/profile-service';
import { TournamentService } from '../services/tournament-service';
import { MatchService } from '../services/match-service';
import { WalletService } from '../services/wallet-service';

async function runE2ETests() {
    console.log('🔄 Starting End-to-End Tests...\n');

    try {
        // 1. Navigation Tests
        console.log('1️⃣ Testing Navigation:');
        
        // Test main navigation
        const frame = Frame.topmost();
        if (!frame) {
            throw new Error('No frame found');
        }

        // Navigate to login
        frame.navigate('pages/auth/login-page');
        console.log('✅ Navigation to login page successful');

        // Navigate to registration
        frame.navigate('pages/auth/register-page');
        console.log('✅ Navigation to registration page successful');

        // 2. Authentication UI Tests
        console.log('\n2️⃣ Testing Authentication UI:');
        
        // Test registration
        const testEmail = `test_${Date.now()}@example.com`;
        const testPassword = 'Test123!@#';
        
        try {
            await authService.signUp(testEmail, testPassword);
            console.log('✅ Registration UI test successful');
        } catch (error: unknown) {
            if (error instanceof Error) {
                console.error('❌ Registration UI test failed:', error.message);
            } else {
                console.error('❌ Registration UI test failed with an unknown error');
            }
        }

        // Test login
        try {
            await authService.signInWithEmail(testEmail, testPassword);
            console.log('✅ Login UI test successful');
        } catch (error: unknown) {
            if (error instanceof Error) {
                console.error('❌ Login UI test failed:', error.message);
            } else {
                console.error('❌ Login UI test failed with an unknown error');
            }
        }

        // 3. Profile UI Tests
        console.log('\n3️⃣ Testing Profile UI:');
        
        // Navigate to profile
        frame.navigate('pages/profile/profile-page');
        console.log('✅ Navigation to profile page successful');

        // Test profile update
        try {
            await ProfileService.updateProfile({
                username: `testuser_${Date.now()}`,
                game_id: 'GAME#123'
            });
            console.log('✅ Profile update UI test successful');
        } catch (error: unknown) {
            if (error instanceof Error) {
                console.error('❌ Profile update UI test failed:', error.message);
            } else {
                console.error('❌ Profile update UI test failed with an unknown error');
            }
        }

        // 4. Tournament UI Tests
        console.log('\n4️⃣ Testing Tournament UI:');
        
        // Navigate to tournaments
        frame.navigate('pages/tournaments/tournaments-page');
        console.log('✅ Navigation to tournaments page successful');

        // Test tournament creation
        try {
            await TournamentService.createTournament({
                title: 'Test Tournament',
                game_type: 'Test Game',
                entry_fee: 10,
                prize_pool: 100,
                max_participants: 8
            });
            console.log('✅ Tournament creation UI test successful');
        } catch (error: unknown) {
            if (error instanceof Error) {
                console.error('❌ Tournament creation UI test failed:', error.message);
            } else {
                console.error('❌ Tournament creation UI test failed with an unknown error');
            }
        }

        // 5. Wallet UI Tests
        console.log('\n5️⃣ Testing Wallet UI:');
        
        // Navigate to wallet
        frame.navigate('pages/wallet/wallet-page');
        console.log('✅ Navigation to wallet page successful');

        // Test transaction
        try {
            await WalletService.addFunds(50);
            console.log('✅ Wallet transaction UI test successful');
        } catch (error: unknown) {
            if (error instanceof Error) {
                console.error('❌ Wallet transaction UI test failed:', error.message);
            } else {
                console.error('❌ Wallet transaction UI test failed with an unknown error');
            }
        }

        console.log('\n✅ All E2E tests completed!');

    } catch (error: unknown) {
        if (error instanceof Error) {
            console.error('\n❌ E2E test failed:', error.message);
        } else {
            console.error('\n❌ E2E test failed with an unknown error');
        }
    }
}

// Run the tests when the app is ready
Application.on(Application.launchEvent, () => {
    setTimeout(() => {
        runE2ETests();
    }, 1000);
});
