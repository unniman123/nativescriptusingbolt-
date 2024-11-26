# Gaming Platform MVP Guide
> NativeScript + Expo + Supabase Implementation

## Tech Stack (Simplified)
```typescript
const techStack = {
  mobile: {
    framework: 'NativeScript + Expo',
    language: 'TypeScript',
    ui: 'NativeBase',
  },
  backend: {
    database: 'Supabase',
    auth: 'Supabase Auth',
    storage: 'Supabase Storage',
    realtime: 'Supabase Realtime'
  },
  payments: {
    gateway: 'Razorpay',
    methods: ['UPI', 'Cards']
  }
}
```

## Project Structure
```
src/
├── app/                    # App screens
│   ├── auth/              # Auth screens
│   ├── tournaments/       # Tournament screens
│   ├── matches/          # Match screens
│   └── wallet/           # Wallet screens
├── components/           # Reusable components
│   ├── ui/              # UI components
│   ├── tournament/      # Tournament components
│   └── match/           # Match components
├── services/            # API services
│   ├── supabase.ts     # Supabase client
│   ├── auth.ts         # Auth services
│   └── tournament.ts   # Tournament services
└── types/              # TypeScript definitions
```

## Database Schema

### Core Tables
```sql
-- Users
create table users (
  id uuid references auth.users primary key,
  username text unique,
  email text unique,
  wallet_balance decimal default 0,
  game_id text,
  created_at timestamp with time zone default now()
);

-- Tournaments
create table tournaments (
  id uuid primary key default uuid_generate_v4(),
  title text not null,
  game_type text not null,
  entry_fee decimal not null,
  prize_pool decimal not null,
  max_players integer not null,
  current_players integer default 0,
  start_time timestamp with time zone not null,
  status text default 'upcoming',
  created_at timestamp with time zone default now()
);

-- Matches
create table matches (
  id uuid primary key default uuid_generate_v4(),
  tournament_id uuid references tournaments(id),
  player1_id uuid references users(id),
  player2_id uuid references users(id),
  winner_id uuid references users(id),
  status text default 'pending',
  created_at timestamp with time zone default now()
);

-- Transactions
create table transactions (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references users(id),
  amount decimal not null,
  type text,
  status text default 'pending',
  reference_id text,
  created_at timestamp with time zone default now()
);
```

## Implementation Steps

### 1. Project Setup
1. Create NativeScript + Expo project
2. Configure Supabase
3. Setup TypeScript
4. Install NativeBase
5. Configure navigation

### 2. Authentication Flow
1. Login Screen
   - Email/password login
   - Email verification
2. Registration Screen
   - Basic info collection
   - Game ID verification
3. Profile Screen
   - View/edit profile
   - Game ID management

### 3. Tournament System
1. Tournament List Screen
   - View active tournaments
   - Filter by game
   - Entry fee display
2. Tournament Detail Screen
   - Join tournament
   - View participants
   - Tournament rules
3. Tournament Creation (Admin)
   - Set entry fee
   - Set max players
   - Set start time

### 4. Match System
1. Match Screen
   - View opponent
   - Match timer
   - Submit result
2. Result Submission
   - Score entry
   - Winner declaration
3. Match History
   - Past matches
   - Results

### 5. Wallet System
1. Wallet Screen
   - Balance display
   - Transaction history
2. Payment Integration
   - Add money
   - Withdraw funds
3. Transaction Management
   - Entry fee handling
   - Prize distribution

## Core Features Breakdown

### Authentication
```typescript
interface AuthFeatures {
  registration: {
    fields: ['email', 'password', 'username', 'gameId'],
    validation: ['Email format', 'Password strength']
  },
  login: {
    methods: ['Email/Password'],
    security: ['Session management', 'Secure storage']
  }
}
```

### Tournaments
```typescript
interface TournamentFeatures {
  creation: {
    fields: ['title', 'gameType', 'entryFee', 'maxPlayers', 'startTime']
  },
  joining: {
    checks: ['Balance check', 'Game ID verification']
  },
  management: {
    features: ['Player list', 'Match generation', 'Prize distribution']
  }
}
```

### Matches
```typescript
interface MatchFeatures {
  flow: ['SCHEDULED', 'IN_PROGRESS', 'COMPLETED'],
  actions: {
    resultSubmission: true,
    winnerDeclaration: true
  }
}
```

### Wallet
```typescript
interface WalletFeatures {
  balance: 'Real-time updates',
  transactions: ['Deposit', 'Withdrawal', 'Entry Fee', 'Prize'],
  limits: {
    minDeposit: 100,
    maxWithdrawal: 10000
  }
}
```

## Screen Flow
1. Splash Screen → Login/Register
2. Home Screen
   - Tournament list
   - Quick actions
3. Tournament Screens
   - List view
   - Detail view
   - Join flow
4. Match Screens
   - Active match
   - Result submission
5. Wallet Screens
   - Balance view
   - Add/withdraw money
6. Profile Screens
   - User details
   - Game IDs
   - History

## Error Handling
1. Network errors
2. Payment failures
3. Match disputes
4. Tournament cancellations
5. Session expiry

## Testing Priorities
1. Authentication flow
2. Tournament joining
3. Match result submission
4. Payment processing
5. Real-time updates
