-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- Create profiles table
create table if not exists profiles (
    id uuid references auth.users on delete cascade primary key,
    username text unique not null,
    game_id text,
    avatar_url text,
    wallet_balance decimal default 0,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null,
    constraint username_length check (char_length(username) >= 3)
);

-- Create tournaments table
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

-- Create matches table
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

-- Create transactions table
create table if not exists transactions (
    id uuid default uuid_generate_v4() primary key,
    user_id uuid references profiles(id),
    amount decimal not null,
    type text check (type in ('deposit', 'withdrawal', 'entry_fee', 'prize')) not null,
    status text check (status in ('pending', 'completed', 'failed')) default 'pending',
    reference_id uuid,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Create indexes for better performance
create index if not exists idx_tournaments_status on tournaments(status);
create index if not exists idx_matches_tournament on matches(tournament_id);
create index if not exists idx_matches_status on matches(status);
create index if not exists idx_transactions_user on transactions(user_id);
create index if not exists idx_transactions_type on transactions(type);

-- Create RLS (Row Level Security) policies
alter table profiles enable row level security;
alter table tournaments enable row level security;
alter table matches enable row level security;
alter table transactions enable row level security;

-- Profiles policies
create policy "Public profiles are viewable by everyone"
    on profiles for select
    using ( true );

create policy "Users can insert their own profile"
    on profiles for insert
    with check ( auth.uid() = id );

create policy "Users can update own profile"
    on profiles for update
    using ( auth.uid() = id );

-- Tournaments policies
create policy "Tournaments are viewable by everyone"
    on tournaments for select
    using ( true );

create policy "Authenticated users can create tournaments"
    on tournaments for insert
    to authenticated
    with check ( true );

-- Matches policies
create policy "Matches are viewable by everyone"
    on matches for select
    using ( true );

create policy "Players can update their own matches"
    on matches for update
    using ( 
        auth.uid() = player1_id or 
        auth.uid() = player2_id
    );

-- Transactions policies
create policy "Users can view own transactions"
    on transactions for select
    using ( auth.uid() = user_id );

create policy "System can insert transactions"
    on transactions for insert
    to authenticated
    with check ( auth.uid() = user_id );
