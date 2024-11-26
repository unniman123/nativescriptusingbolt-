# AI Development Instructions
> Guidelines for bolt.new and windsurf IDE

## Project Context
This is a gaming tournament platform MVP built with NativeScript + Expo and Supabase. The platform enables users to join tournaments, play matches, and manage their wallet.

## Development Focus Areas

### 1. Core Functionality Priority
1. Authentication system
2. Tournament management
3. Match handling
4. Wallet operations

### 2. Critical Components
- User authentication flow
- Tournament creation and joining
- Match result submission
- Payment processing
- Real-time updates

## Instructions for AI Tools

### For bolt.new

1. **Code Generation Priorities**
   - Focus on TypeScript with strict type checking
   - Implement proper error handling
   - Generate complete component files
   - Include proper validation
   - Add comments for complex logic

2. **Component Requirements**
   - Make components reusable
   - Include proper prop typing
   - Add loading states
   - Handle error scenarios
   - Implement proper validation

3. **Database Integration**
   - Generate proper Supabase queries
   - Include error handling
   - Add proper types for database operations
   - Implement real-time subscriptions

4. **Authentication Focus**
   - Secure session handling
   - Proper token management
   - User state persistence
   - Error recovery

### For windsurf IDE

1. **Project Structure**
   - Maintain clear separation of concerns
   - Keep related files together
   - Follow the defined project structure
   - Generate appropriate index files

2. **Code Quality**
   - Implement proper TypeScript types
   - Add error boundaries
   - Include loading states
   - Follow best practices for mobile development
   - Optimize for performance

3. **Integration Points**
   - Handle Supabase connections properly
   - Manage authentication state
   - Implement proper navigation
   - Handle deep linking

4. **Testing Considerations**
   - Generate test cases for critical paths
   - Include error scenario testing
   - Add input validation tests
   - Test real-time functionality

## Important Notes for AI Tools

1. **Security First**
   - Implement proper input validation
   - Add authentication checks
   - Secure data transmission
   - Handle sensitive data properly

2. **Performance**
   - Optimize database queries
   - Implement proper caching
   - Handle large lists efficiently
   - Optimize image loading

3. **User Experience**
   - Add proper loading states
   - Handle offline scenarios
   - Implement proper error messages
   - Add input validation feedback

4. **Mobile Specific**
   - Handle different screen sizes
   - Implement proper keyboard handling
   - Add pull-to-refresh where needed
   - Handle background/foreground transitions

## Function Implementation Guidelines

### Authentication
```typescript
// Implement these core functions
interface AuthFunctions {
  register: (email: string, password: string, gameId: string) => Promise<void>;
  login: (email: string, password: string) => Promise<void>;
  verifyEmail: (token: string) => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
}
```

### Tournaments
```typescript
// Implement these tournament functions
interface TournamentFunctions {
  createTournament: (data: TournamentData) => Promise<void>;
  joinTournament: (tournamentId: string) => Promise<void>;
  getTournaments: () => Promise<Tournament[]>;
  getTournamentDetails: (id: string) => Promise<TournamentDetail>;
}
```

### Matches
```typescript
// Implement these match functions
interface MatchFunctions {
  submitResult: (matchId: string, result: MatchResult) => Promise<void>;
  getMatchDetails: (matchId: string) => Promise<MatchDetail>;
  getCurrentMatch: () => Promise<Match | null>;
  updateMatchStatus: (matchId: string, status: MatchStatus) => Promise<void>;
}
```

### Wallet
```typescript
// Implement these wallet functions
interface WalletFunctions {
  addMoney: (amount: number) => Promise<void>;
  withdrawMoney: (amount: number) => Promise<void>;
  getBalance: () => Promise<number>;
  getTransactions: () => Promise<Transaction[]>;
}
```

Remember:
- Each function is critical for platform functionality
- Implement proper error handling
- Add appropriate TypeScript types
- Include validation
- Handle edge cases
- Add proper documentation
- Include loading states
- Implement proper error messages
