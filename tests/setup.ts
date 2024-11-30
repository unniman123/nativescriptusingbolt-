import { supabase } from '../app/services/supabase';
import dotenv from 'dotenv';
import '@jest/globals';

dotenv.config();

global.beforeAll(async () => {
    // Set up test database connection
    if (!process.env.SUPABASE_URL || !process.env.SUPABASE_KEY) {
        throw new Error('Supabase credentials not found in environment');
    }
});

global.afterAll(async () => {
    // Clean up test data
    await supabase.auth.signOut();
});
