-- Create notifications table
create table if not exists notifications (
    id uuid default uuid_generate_v4() primary key,
    user_id uuid references profiles(id) not null,
    message text not null,
    type text check (type in ('match_start', 'match_result', 'tournament_update', 'system')) not null,
    read boolean default false,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Create index for faster queries
create index if not exists idx_notifications_user on notifications(user_id);

-- Enable RLS
alter table notifications enable row level security;

-- Create RLS policies
create policy "Users can view their own notifications"
    on notifications for select
    using (auth.uid() = user_id);

create policy "System can insert notifications"
    on notifications for insert
    with check (true);

-- Function to create match start notification
create or replace function create_match_start_notification()
returns trigger as $$
begin
    -- Create notification for player 1
    insert into notifications (user_id, message, type)
    values (
        NEW.player1_id,
        format('Your match in tournament %s is starting!', (select title from tournaments where id = NEW.tournament_id)),
        'match_start'
    );
    
    -- Create notification for player 2
    insert into notifications (user_id, message, type)
    values (
        NEW.player2_id,
        format('Your match in tournament %s is starting!', (select title from tournaments where id = NEW.tournament_id)),
        'match_start'
    );
    
    return NEW;
end;
$$ language plpgsql security definer;

-- Trigger for match start notifications
create trigger on_match_start
    after update of status on matches
    for each row
    when (OLD.status = 'scheduled' and NEW.status = 'in_progress')
    execute function create_match_start_notification();
