# API Reference

## Core Services

### Authentication Service
```typescript
interface AuthCredentials {
    email: string;
    password: string;
}

interface AuthResponse {
    user: User;
    token: string;
}

class AuthService {
    /**
     * Login with email and password
     * @param credentials User credentials
     * @returns Authentication response with user and token
     */
    async login(credentials: AuthCredentials): Promise<AuthResponse>;

    /**
     * Register new user
     * @param userData User registration data
     * @returns Created user data
     */
    async register(userData: UserRegistration): Promise<User>;

    /**
     * Logout current user
     */
    async logout(): Promise<void>;
}
```

### Tournament Service
```typescript
interface TournamentCreation {
    title: string;
    description?: string;
    maxPlayers: number;
    entryFee: number;
    startTime: Date;
    gameType: string;
}

class TournamentService {
    /**
     * Create new tournament
     * @param data Tournament creation data
     * @returns Created tournament
     */
    async createTournament(data: TournamentCreation): Promise<Tournament>;

    /**
     * Get tournament by ID
     * @param id Tournament ID
     * @returns Tournament data
     */
    async getTournament(id: string): Promise<Tournament>;

    /**
     * Join tournament
     * @param tournamentId Tournament ID
     * @returns Updated tournament data
     */
    async joinTournament(tournamentId: string): Promise<Tournament>;
}
```

### Real-time Service
```typescript
interface SubscriptionOptions {
    event: string;
    callback: (data: any) => void;
    errorHandler?: (error: any) => void;
}

class RealtimeService {
    /**
     * Subscribe to real-time updates
     * @param options Subscription options
     * @returns Subscription ID
     */
    subscribe(options: SubscriptionOptions): string;

    /**
     * Unsubscribe from updates
     * @param subscriptionId Subscription ID
     */
    unsubscribe(subscriptionId: string): void;
}
```

### Chat Service
```typescript
interface ChatMessage {
    content: string;
    type: 'text' | 'system';
    metadata?: any;
}

class ChatService {
    /**
     * Send message to chat room
     * @param roomId Chat room ID
     * @param message Message data
     * @returns Sent message
     */
    async sendMessage(roomId: string, message: ChatMessage): Promise<Message>;

    /**
     * Get chat history
     * @param roomId Chat room ID
     * @param limit Number of messages
     * @param before Timestamp for pagination
     * @returns Array of messages
     */
    async getHistory(roomId: string, limit?: number, before?: Date): Promise<Message[]>;
}
```

## Models

### User
```typescript
interface User {
    id: string;
    email: string;
    username: string;
    avatarUrl?: string;
    status: 'online' | 'offline' | 'in_game';
    createdAt: Date;
    lastLogin?: Date;
}
```

### Tournament
```typescript
interface Tournament {
    id: string;
    title: string;
    description?: string;
    gameType: string;
    status: 'draft' | 'open' | 'in_progress' | 'completed';
    creatorId: string;
    maxPlayers: number;
    currentPlayers: number;
    entryFee: number;
    prizePool: number;
    startTime: Date;
    endTime?: Date;
    participants: User[];
    matches?: Match[];
}
```

### Match
```typescript
interface Match {
    id: string;
    tournamentId: string;
    round: number;
    player1Id: string;
    player2Id: string;
    winnerId?: string;
    status: 'pending' | 'in_progress' | 'completed';
    score?: any;
    startedAt?: Date;
    endedAt?: Date;
}
```

## WebSocket Events

### Tournament Events
```typescript
interface TournamentUpdate {
    type: 'status_change' | 'player_count' | 'prize_update';
    tournamentId: string;
    data: any;
}

// Subscribe to tournament updates
realtime.subscribe({
    event: 'tournament_updates',
    callback: (update: TournamentUpdate) => {
        // Handle update
    }
});
```

### Match Events
```typescript
interface MatchUpdate {
    type: 'status_change' | 'score_update';
    matchId: string;
    data: any;
}

// Subscribe to match updates
realtime.subscribe({
    event: 'match_updates',
    callback: (update: MatchUpdate) => {
        // Handle update
    }
});
```

### Chat Events
```typescript
interface ChatUpdate {
    type: 'message' | 'typing' | 'read';
    roomId: string;
    data: any;
}

// Subscribe to chat updates
realtime.subscribe({
    event: 'chat_updates',
    callback: (update: ChatUpdate) => {
        // Handle update
    }
});
```

## Error Handling

### Error Codes
```typescript
enum ErrorCode {
    UNAUTHORIZED = 'unauthorized',
    INVALID_INPUT = 'invalid_input',
    NOT_FOUND = 'not_found',
    ALREADY_EXISTS = 'already_exists',
    TOURNAMENT_FULL = 'tournament_full',
    TOURNAMENT_STARTED = 'tournament_started',
    INSUFFICIENT_FUNDS = 'insufficient_funds'
}
```

### Error Response
```typescript
interface ErrorResponse {
    code: ErrorCode;
    message: string;
    details?: any;
}

// Example error handling
try {
    await tournamentService.joinTournament(id);
} catch (error) {
    switch (error.code) {
        case ErrorCode.TOURNAMENT_FULL:
            // Handle full tournament
            break;
        case ErrorCode.TOURNAMENT_STARTED:
            // Handle started tournament
            break;
        default:
            // Handle other errors
    }
}
```

## Rate Limits

### API Rate Limits
```typescript
const rateLimits = {
    'POST /tournaments': {
        window: '1h',
        max: 10
    },
    'POST /chat/messages': {
        window: '1m',
        max: 30
    }
};
```

## Pagination

### Request Parameters
```typescript
interface PaginationParams {
    limit?: number;    // Default: 20, Max: 100
    offset?: number;   // Default: 0
    before?: string;   // ISO date string
    after?: string;    // ISO date string
}
```

### Response Format
```typescript
interface PaginatedResponse<T> {
    items: T[];
    total: number;
    hasMore: boolean;
    nextCursor?: string;
}
```
