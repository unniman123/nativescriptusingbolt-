# Database Schema Documentation

## Overview
The database schema is designed to support real-time gaming features while maintaining data integrity and security. PostgreSQL is used as the primary database through Supabase.

## Core Tables

### Users
```sql
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email TEXT UNIQUE NOT NULL,
    username TEXT UNIQUE NOT NULL,
    avatar_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_login TIMESTAMP WITH TIME ZONE,
    status TEXT DEFAULT 'offline',
    CONSTRAINT valid_email CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$'),
    CONSTRAINT valid_username CHECK (username ~* '^[A-Za-z0-9_]{3,20}$')
);

-- RLS Policies
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view other users"
    ON users FOR SELECT
    USING (true);

CREATE POLICY "Users can update their own record"
    ON users FOR UPDATE
    USING (auth.uid() = id);
```

### Tournaments
```sql
CREATE TABLE tournaments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title TEXT NOT NULL,
    description TEXT,
    game_type TEXT NOT NULL,
    status TEXT DEFAULT 'draft',
    creator_id UUID REFERENCES users(id),
    max_players INTEGER NOT NULL,
    current_players INTEGER DEFAULT 0,
    entry_fee DECIMAL(10,2) DEFAULT 0,
    prize_pool DECIMAL(10,2) DEFAULT 0,
    start_time TIMESTAMP WITH TIME ZONE,
    end_time TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    CONSTRAINT valid_status CHECK (status IN ('draft', 'open', 'in_progress', 'completed', 'cancelled')),
    CONSTRAINT valid_players CHECK (current_players <= max_players)
);

-- Trigger for real-time updates
CREATE TRIGGER tournament_updated
    AFTER UPDATE ON tournaments
    FOR EACH ROW
    EXECUTE FUNCTION notify_tournament_update();
```

### Matches
```sql
CREATE TABLE matches (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tournament_id UUID REFERENCES tournaments(id),
    round INTEGER NOT NULL,
    player1_id UUID REFERENCES users(id),
    player2_id UUID REFERENCES users(id),
    winner_id UUID REFERENCES users(id),
    status TEXT DEFAULT 'pending',
    score JSON,
    started_at TIMESTAMP WITH TIME ZONE,
    ended_at TIMESTAMP WITH TIME ZONE,
    CONSTRAINT valid_match_status CHECK (status IN ('pending', 'in_progress', 'completed', 'cancelled'))
);
```

### Chat Rooms
```sql
CREATE TABLE chat_rooms (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    type TEXT NOT NULL,
    reference_id UUID, -- Tournament ID or Match ID
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    CONSTRAINT valid_room_type CHECK (type IN ('tournament', 'match', 'direct'))
);

CREATE TABLE chat_messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    room_id UUID REFERENCES chat_rooms(id),
    user_id UUID REFERENCES users(id),
    content TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    type TEXT DEFAULT 'text',
    CONSTRAINT valid_message_type CHECK (type IN ('text', 'system'))
);
```

### Leaderboard
```sql
CREATE TABLE leaderboard (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) UNIQUE,
    points INTEGER DEFAULT 0,
    wins INTEGER DEFAULT 0,
    losses INTEGER DEFAULT 0,
    tournaments_won INTEGER DEFAULT 0,
    rank INTEGER,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Function to update ranks
CREATE OR REPLACE FUNCTION update_leaderboard_ranks()
RETURNS TRIGGER AS $$
BEGIN
    -- Update ranks based on points
    WITH ranked AS (
        SELECT id, ROW_NUMBER() OVER (ORDER BY points DESC) as new_rank
        FROM leaderboard
    )
    UPDATE leaderboard l
    SET rank = r.new_rank
    FROM ranked r
    WHERE l.id = r.id;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Trigger for rank updates
CREATE TRIGGER update_ranks
    AFTER INSERT OR UPDATE OF points ON leaderboard
    FOR EACH STATEMENT
    EXECUTE FUNCTION update_leaderboard_ranks();
```

## Real-time Notifications

### Notification Functions
```sql
-- Tournament updates
CREATE OR REPLACE FUNCTION notify_tournament_update()
RETURNS TRIGGER AS $$
BEGIN
    PERFORM pg_notify(
        'tournament_updates',
        json_build_object(
            'type', 'tournament_update',
            'tournament_id', NEW.id,
            'status', NEW.status,
            'current_players', NEW.current_players,
            'prize_pool', NEW.prize_pool
        )::text
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Match updates
CREATE OR REPLACE FUNCTION notify_match_update()
RETURNS TRIGGER AS $$
BEGIN
    PERFORM pg_notify(
        'match_updates',
        json_build_object(
            'type', 'match_update',
            'match_id', NEW.id,
            'status', NEW.status,
            'score', NEW.score
        )::text
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;
```

## Indexes
```sql
-- Users
CREATE INDEX idx_users_username ON users(username);
CREATE INDEX idx_users_email ON users(email);

-- Tournaments
CREATE INDEX idx_tournaments_status ON tournaments(status);
CREATE INDEX idx_tournaments_start_time ON tournaments(start_time);

-- Matches
CREATE INDEX idx_matches_tournament ON matches(tournament_id);
CREATE INDEX idx_matches_players ON matches(player1_id, player2_id);

-- Chat
CREATE INDEX idx_chat_messages_room ON chat_messages(room_id);
CREATE INDEX idx_chat_messages_created ON chat_messages(created_at);

-- Leaderboard
CREATE INDEX idx_leaderboard_points ON leaderboard(points DESC);
CREATE INDEX idx_leaderboard_rank ON leaderboard(rank);
```

## Security Policies

### Row Level Security (RLS)
```sql
-- Tournament policies
CREATE POLICY "Anyone can view tournaments"
    ON tournaments FOR SELECT
    USING (true);

CREATE POLICY "Creator can update tournament"
    ON tournaments FOR UPDATE
    USING (auth.uid() = creator_id);

-- Match policies
CREATE POLICY "Players can view their matches"
    ON matches FOR SELECT
    USING (
        auth.uid() IN (player1_id, player2_id) OR
        EXISTS (
            SELECT 1 FROM tournaments t
            WHERE t.id = tournament_id AND t.creator_id = auth.uid()
        )
    );

-- Chat policies
CREATE POLICY "Room participants can view messages"
    ON chat_messages FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM chat_rooms cr
            WHERE cr.id = room_id AND (
                cr.type = 'tournament' OR
                cr.type = 'match' OR
                (cr.type = 'direct' AND auth.uid() IN (
                    SELECT user_id FROM chat_room_participants
                    WHERE room_id = cr.id
                ))
            )
        )
    );
```
