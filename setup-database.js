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

async function setupDatabase() {
    try {
        console.log('🔄 Setting up database tables...\n');

        // Create profiles table
        const createProfilesTable = `
            create table if not exists profiles (
                id uuid references auth.users on delete cascade primary key,
                username text unique not null,
                game_id text,
                avatar_url text,
                wallet_balance decimal default 0,
                created_at timestamp with time zone default timezone('utc'::text, now()) not null,
                constraint username_length check (char_length(username) >= 3)
            );
        `;

        // Create tournaments table
        const createTournamentsTable = `
            create table if not exists tournaments (
                id uuid default uuid_generate_v4() primary key,
                title text not null,
                game_type text not null,
                entry_fee decimal not null,
                prize_pool decimal not null,
                max_participants integer not null,
                current_participants integer default 0,
                status text check (status in ('open', 'in_progress', 'completed')) default 'open',
                start_time timestamp with time zone,
                created_at timestamp with time zone default timezone('utc'::text, now()) not null,
                rules text
            );
        `;

        // Create matches table
        const createMatchesTable = `
            create table if not exists matches (
                id uuid default uuid_generate_v4() primary key,
                tournament_id uuid references tournaments on delete cascade,
                player1_id uuid references profiles(id),
                player2_id uuid references profiles(id),
                player1_score integer,
                player2_score integer,
                winner_id uuid references profiles(id),
                status text check (status in ('scheduled', 'in_progress', 'completed', 'disputed')) default 'scheduled',
                scheduled_time timestamp with time zone,
                created_at timestamp with time zone default timezone('utc'::text, now()) not null,
                round integer,
                match_number integer,
                duration integer
            );
        `;

        // Create transactions table
        const createTransactionsTable = `
            create table if not exists transactions (
                id uuid default uuid_generate_v4() primary key,
                user_id uuid references profiles(id),
                amount decimal not null,
                type text check (type in ('deposit', 'withdrawal', 'entry_fee', 'prize')) not null,
                status text check (status in ('pending', 'completed', 'failed')) default 'pending',
                reference_id uuid,
                created_at timestamp with time zone default timezone('utc'::text, now()) not null
            );
        `;

        // Execute table creation
        const tables = [
            { name: 'Profiles', sql: createProfilesTable },
            { name: 'Tournaments', sql: createTournamentsTable },
            { name: 'Matches', sql: createMatchesTable },
            { name: 'Transactions', sql: createTransactionsTable }
        ];

        for (const table of tables) {
            const { error } = await supabase.rpc('exec_sql', { sql: table.sql });
            if (error) {
                console.error(`❌ Failed to create ${table.name} table:`, error.message);
            } else {
                console.log(`✅ ${table.name} table created successfully`);
            }
        }

        console.log('\n✅ Database setup completed!');

    } catch (error) {
        console.error('❌ Database setup failed:', error.message);
    }
}

setupDatabase();
