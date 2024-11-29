import { supabase } from '../services/supabase';

export async function testSupabaseConnection() {
    try {
        // Test the connection by making a simple query
        const { data, error } = await supabase
            .from('profiles')
            .select('count')
            .limit(1);

        if (error) {
            console.error('❌ Supabase connection test failed:', error.message);
            return false;
        }

        console.log('✅ Supabase connection test successful!');
        return true;
    } catch (error) {
        console.error('❌ Supabase connection test failed:', error);
        return false;
    }
}

export async function verifyDatabaseTables() {
    const tables = ['profiles', 'tournaments', 'matches', 'transactions'];
    const results = {};

    for (const table of tables) {
        try {
            const { data, error } = await supabase
                .from(table)
                .select('count')
                .limit(1);

            if (error) {
                console.error(`❌ Table '${table}' verification failed:`, error.message);
                results[table] = false;
            } else {
                console.log(`✅ Table '${table}' exists and is accessible`);
                results[table] = true;
            }
        } catch (error) {
            console.error(`❌ Error checking table '${table}':`, error);
            results[table] = false;
        }
    }

    return results;
}

export async function testBasicUserFlow() {
    try {
        // 1. Test user registration
        const testEmail = `test_${Date.now()}@example.com`;
        const testPassword = 'testPassword123!';
        
        const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
            email: testEmail,
            password: testPassword
        });

        if (signUpError) {
            console.error('❌ User registration failed:', signUpError.message);
            return false;
        }
        console.log('✅ User registration successful');

        // 2. Test user login
        const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
            email: testEmail,
            password: testPassword
        });

        if (signInError) {
            console.error('❌ User login failed:', signInError.message);
            return false;
        }
        console.log('✅ User login successful');

        if (!signUpData.user) {
            console.error('❌ No user data returned from sign-up');
            return false;
        }

        // 3. Test profile creation
        const { error: profileError } = await supabase
            .from('profiles')
            .insert([
                {
                    id: signUpData.user.id,
                    username: `testuser_${Date.now()}`,
                    wallet_balance: 0
                }
            ]);

        if (profileError) {
            console.error('❌ Profile creation failed:', profileError.message);
            return false;
        }
        console.log('✅ Profile creation successful');

        return true;
    } catch (error) {
        console.error('❌ Basic user flow test failed:', error);
        return false;
    }
}
