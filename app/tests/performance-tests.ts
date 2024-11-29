import { supabase } from '../services/supabase';
import { tournamentService } from '../services/tournament-service';
import { matchService } from '../services/match-service';

async function runPerformanceTests() {
    console.log('🔄 Starting Performance Tests...\n');

    try {
        // 1. Database Query Performance
        console.log('1️⃣ Testing Database Query Performance:');
        
        // Test tournament listing performance
        const startTime1 = Date.now();
        const { data: tournaments, error: tournamentsError } = await supabase
            .from('tournaments')
            .select('*')
            .limit(50);
        const endTime1 = Date.now();
        
        if (tournamentsError) throw tournamentsError;
        console.log(`✅ Tournament listing query: ${endTime1 - startTime1}ms`);

        // Test match listing with joins performance
        const startTime2 = Date.now();
        const { data: matches, error: matchesError } = await supabase
            .from('matches')
            .select(`
                *,
                player1:profiles!player1_id(username),
                player2:profiles!player2_id(username),
                tournament:tournaments!tournament_id(title)
            `)
            .limit(50);
        const endTime2 = Date.now();
        
        if (matchesError) throw matchesError;
        console.log(`✅ Match listing with joins query: ${endTime2 - startTime2}ms`);

        // 2. Service Layer Performance
        console.log('\n2️⃣ Testing Service Layer Performance:');
        
        // Test tournament service performance
        const startTime3 = Date.now();
        await tournamentService.getOpenTournaments();
        const endTime3 = Date.now();
        console.log(`✅ Tournament service call: ${endTime3 - startTime3}ms`);

        // Test match service performance
        const startTime4 = Date.now();
        await matchService.getUserMatches();
        const endTime4 = Date.now();
        console.log(`✅ Match service call: ${endTime4 - startTime4}ms`);

        // 3. Concurrent Operations Performance
        console.log('\n3️⃣ Testing Concurrent Operations:');
        
        const startTime5 = Date.now();
        await Promise.all([
            tournamentService.getOpenTournaments(),
            matchService.getUserMatches(),
            supabase.from('profiles').select('*').limit(50)
        ]);
        const endTime5 = Date.now();
        console.log(`✅ Concurrent operations: ${endTime5 - startTime5}ms`);

        // 4. Performance Thresholds
        console.log('\n4️⃣ Performance Thresholds:');
        
        const thresholds = {
            singleQuery: 500,      // 500ms
            complexQuery: 1000,    // 1s
            serviceCall: 800,      // 800ms
            concurrent: 2000       // 2s
        };

        const results = {
            tournamentQuery: endTime1 - startTime1 < thresholds.singleQuery,
            matchQuery: endTime2 - startTime2 < thresholds.complexQuery,
            tournamentService: endTime3 - startTime3 < thresholds.serviceCall,
            matchService: endTime4 - startTime4 < thresholds.serviceCall,
            concurrent: endTime5 - startTime5 < thresholds.concurrent
        };

        console.log('Performance Results:');
        Object.entries(results).forEach(([test, passed]) => {
            console.log(`${test}: ${passed ? '✅ Within threshold' : '❌ Exceeded threshold'}`);
        });

        // 5. Memory Usage
        console.log('\n5️⃣ Memory Usage:');
        if (global.gc) {
            global.gc();
            const used = process.memoryUsage();
            console.log('Memory usage:');
            console.log(`- Heap Total: ${Math.round(used.heapTotal / 1024 / 1024 * 100) / 100} MB`);
            console.log(`- Heap Used: ${Math.round(used.heapUsed / 1024 / 1024 * 100) / 100} MB`);
        } else {
            console.log('⚠️ Run with --expose-gc to see memory usage');
        }

        console.log('\n✅ All performance tests completed!');

    } catch (error) {
        console.error('\n❌ Performance test failed:', error.message);
    }
}

runPerformanceTests();
