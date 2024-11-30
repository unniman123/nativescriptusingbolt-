-- Chat System Tables
create table if not exists chat_rooms (
    id uuid default uuid_generate_v4() primary key,
    type text check (type in ('direct', 'match', 'tournament')) not null,
    reference_id uuid, -- tournament_id or match_id for non-direct chats
    created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

create table if not exists chat_messages (
    id uuid default uuid_generate_v4() primary key,
    room_id uuid references chat_rooms(id) on delete cascade,
    sender_id uuid references profiles(id),
    message text not null,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

create table if not exists chat_participants (
    room_id uuid references chat_rooms(id) on delete cascade,
    user_id uuid references profiles(id),
    last_read_at timestamp with time zone default timezone('utc'::text, now()),
    primary key (room_id, user_id)
);

-- Leaderboard Tables
create table if not exists leaderboard_entries (
    id uuid default uuid_generate_v4() primary key,
    user_id uuid references profiles(id),
    points integer default 0,
    wins integer default 0,
    losses integer default 0,
    tournaments_won integer default 0,
    rank integer,
    updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Function to update leaderboard on match completion
create or replace function update_leaderboard_on_match_complete()
returns trigger as $$
begin
    -- Update winner stats
    insert into leaderboard_entries (user_id, points, wins)
    values (NEW.winner_id, 10, 1)
    on conflict (user_id) do update
    set points = leaderboard_entries.points + 10,
        wins = leaderboard_entries.wins + 1,
        updated_at = now();

    -- Update loser stats
    insert into leaderboard_entries (user_id, losses)
    values (
        case 
            when NEW.player1_id = NEW.winner_id then NEW.player2_id
            else NEW.player1_id
        end,
        1
    )
    on conflict (user_id) do update
    set losses = leaderboard_entries.losses + 1,
        updated_at = now();

    -- Update rankings
    with ranked_players as (
        select 
            id,
            row_number() over (order by points desc) as new_rank
        from leaderboard_entries
    )
    update leaderboard_entries le
    set rank = rp.new_rank
    from ranked_players rp
    where le.id = rp.id;

    return NEW;
end;
$$ language plpgsql security definer;

-- Trigger for leaderboard updates
create trigger on_match_complete
    after update of status on matches
    for each row
    when (OLD.status != 'completed' and NEW.status = 'completed')
    execute function update_leaderboard_on_match_complete();

-- Enable RLS
alter table chat_rooms enable row level security;
alter table chat_messages enable row level security;
alter table chat_participants enable row level security;
alter table leaderboard_entries enable row level security;

-- RLS Policies
create policy "Users can view their chat rooms"
    on chat_rooms for select
    using (
        exists (
            select 1 from chat_participants
            where room_id = id and user_id = auth.uid()
        )
        or
        type in ('tournament', 'match')
    );

create policy "Users can insert messages in their rooms"
    on chat_messages for insert
    with check (
        exists (
            select 1 from chat_participants
            where room_id = chat_messages.room_id and user_id = auth.uid()
        )
    );

create policy "Users can view messages in their rooms"
    on chat_messages for select
    using (
        exists (
            select 1 from chat_participants
            where room_id = chat_messages.room_id and user_id = auth.uid()
        )
        or
        exists (
            select 1 from chat_rooms
            where id = chat_messages.room_id and type in ('tournament', 'match')
        )
    );

create policy "Users can view leaderboard"
    on leaderboard_entries for select
    using (true);
