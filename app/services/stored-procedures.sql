-- Stored procedures for Supabase

-- Join Tournament procedure
create or replace function join_tournament(p_tournament_id uuid, p_user_id uuid)
returns void as $$
declare
    v_entry_fee decimal;
    v_max_participants integer;
    v_current_participants integer;
begin
    -- Get tournament details
    select entry_fee, max_participants, current_participants
    into v_entry_fee, v_max_participants, v_current_participants
    from tournaments
    where id = p_tournament_id;

    -- Check if tournament is full
    if v_current_participants >= v_max_participants then
        raise exception 'Tournament is full';
    end if;

    -- Check if user has sufficient balance
    if not exists (
        select 1 from profiles
        where id = p_user_id and wallet_balance >= v_entry_fee
    ) then
        raise exception 'Insufficient balance';
    end if;

    -- Process entry fee
    update profiles
    set wallet_balance = wallet_balance - v_entry_fee
    where id = p_user_id;

    -- Update tournament participants
    update tournaments
    set current_participants = current_participants + 1
    where id = p_tournament_id;

    -- Create transaction record
    insert into transactions (user_id, amount, type, status, reference_id)
    values (p_user_id, v_entry_fee, 'entry_fee', 'completed', p_tournament_id::text);
end;
$$ language plpgsql;

-- Process Entry Fee procedure
create or replace function process_entry_fee(p_user_id uuid, p_tournament_id uuid, p_amount decimal)
returns void as $$
begin
    -- Deduct from user's wallet
    update profiles
    set wallet_balance = wallet_balance - p_amount
    where id = p_user_id;

    -- Create transaction record
    insert into transactions (user_id, amount, type, status, reference_id)
    values (p_user_id, p_amount, 'entry_fee', 'completed', p_tournament_id::text);
end;
$$ language plpgsql;

-- Process Prize Distribution procedure
create or replace function process_prize_distribution(p_tournament_id uuid, p_winner_id uuid, p_amount decimal)
returns void as $$
begin
    -- Add to winner's wallet
    update profiles
    set wallet_balance = wallet_balance + p_amount
    where id = p_winner_id;

    -- Create transaction record
    insert into transactions (user_id, amount, type, status, reference_id)
    values (p_winner_id, p_amount, 'prize', 'completed', p_tournament_id::text);

    -- Update tournament status
    update tournaments
    set status = 'completed'
    where id = p_tournament_id;
end;
$$ language plpgsql;

-- Generate Tournament Matches procedure
create or replace function generate_tournament_matches(p_tournament_id uuid)
returns void as $$
declare
    v_participants uuid[];
    v_participant_count integer;
    i integer;
    j integer;
begin
    -- Get all participants for the tournament
    select array_agg(user_id)
    into v_participants
    from tournament_participants
    where tournament_id = p_tournament_id;

    v_participant_count := array_length(v_participants, 1);

    -- Check if we have enough participants
    if v_participant_count < 2 then
        raise exception 'Not enough participants to generate matches';
    end if;

    -- Generate matches in round-robin format
    for i in 1..v_participant_count-1 loop
        for j in i+1..v_participant_count loop
            insert into matches (
                tournament_id,
                player1_id,
                player2_id,
                status,
                scheduled_time
            )
            values (
                p_tournament_id,
                v_participants[i],
                v_participants[j],
                'scheduled',
                now() + (interval '30 minutes' * ((i-1) * v_participant_count + j))
            );
        end loop;
    end loop;

    -- Update tournament status
    update tournaments
    set status = 'in_progress'
    where id = p_tournament_id;
end;
$$ language plpgsql;