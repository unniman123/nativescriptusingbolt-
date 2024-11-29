import { testSupabaseConnection, verifyDatabaseTables, testBasicUserFlow } from './supabase-test';

export async function runAllTests() {
    console.log('🔄 Starting tests...\n');

    // Test 1: Supabase Connection
    console.log('1️⃣ Testing Supabase Connection:');
    const connectionResult = await testSupabaseConnection();
    console.log('------------------------\n');

    // Test 2: Database Tables
    console.log('2️⃣ Verifying Database Tables:');
    const tablesResult = await verifyDatabaseTables();
    console.log('------------------------\n');

    // Test 3: Basic User Flow
    console.log('3️⃣ Testing Basic User Flow:');
    const userFlowResult = await testBasicUserFlow();
    console.log('------------------------\n');

    // Summary
    console.log('📊 Test Summary:');
    console.log(`Supabase Connection: ${connectionResult ? '✅' : '❌'}`);
    console.log('Database Tables:');
    Object.entries(tablesResult).forEach(([table, success]) => {
        console.log(`  ${table}: ${success ? '✅' : '❌'}`);
    });
    console.log(`Basic User Flow: ${userFlowResult ? '✅' : '❌'}`);
}

// Run the tests
runAllTests().catch(console.error);
