# Testing Guidelines

## Overview
This document outlines testing strategies and guidelines for the NativeScript Gaming Platform, covering unit tests, integration tests, and end-to-end testing.

## Unit Testing

### Test Structure
```typescript
// tournament.service.spec.ts
describe('TournamentService', () => {
    let service: TournamentService;
    let mockDb: MockDatabase;

    beforeEach(() => {
        mockDb = new MockDatabase();
        service = new TournamentService(mockDb);
    });

    describe('createTournament', () => {
        it('should create a tournament with valid data', async () => {
            const data = {
                title: 'Test Tournament',
                maxPlayers: 8,
                entryFee: 100
            };

            const result = await service.createTournament(data);
            expect(result).toBeDefined();
            expect(result.title).toBe(data.title);
        });

        it('should throw error for invalid data', async () => {
            const data = {
                title: '', // Invalid title
                maxPlayers: 8
            };

            await expect(service.createTournament(data))
                .rejects.toThrow('Invalid tournament data');
        });
    });
});
```

### Mocking
```typescript
// mock-database.ts
export class MockDatabase {
    private data: Map<string, any> = new Map();

    async insert(table: string, data: any): Promise<any> {
        const id = uuid();
        this.data.set(id, { ...data, id });
        return { id, ...data };
    }

    async findOne(table: string, id: string): Promise<any> {
        return this.data.get(id);
    }
}

// mock-realtime.ts
export class MockRealtimeService {
    private subscribers: Map<string, Function> = new Map();

    subscribe(event: string, callback: Function): string {
        const id = uuid();
        this.subscribers.set(id, callback);
        return id;
    }

    emit(event: string, data: any): void {
        this.subscribers.forEach(callback => callback(data));
    }
}
```

### Testing Services
```typescript
// auth.service.spec.ts
describe('AuthService', () => {
    let service: AuthService;
    let mockStorage: MockStorage;

    beforeEach(() => {
        mockStorage = new MockStorage();
        service = new AuthService(mockStorage);
    });

    describe('login', () => {
        it('should store token after successful login', async () => {
            const credentials = {
                email: 'test@example.com',
                password: 'password123'
            };

            await service.login(credentials);
            const token = await mockStorage.getItem('auth_token');
            expect(token).toBeDefined();
        });

        it('should handle invalid credentials', async () => {
            const credentials = {
                email: 'test@example.com',
                password: 'wrong'
            };

            await expect(service.login(credentials))
                .rejects.toThrow('Invalid credentials');
        });
    });
});
```

## Integration Testing

### API Tests
```typescript
// tournament-api.spec.ts
describe('Tournament API', () => {
    let app: TestServer;
    let authToken: string;

    beforeAll(async () => {
        app = await createTestServer();
        authToken = await getTestUserToken();
    });

    describe('POST /tournaments', () => {
        it('should create tournament for authenticated user', async () => {
            const response = await request(app)
                .post('/tournaments')
                .set('Authorization', `Bearer ${authToken}`)
                .send({
                    title: 'Test Tournament',
                    maxPlayers: 8
                });

            expect(response.status).toBe(201);
            expect(response.body.title).toBe('Test Tournament');
        });

        it('should reject unauthenticated requests', async () => {
            const response = await request(app)
                .post('/tournaments')
                .send({
                    title: 'Test Tournament'
                });

            expect(response.status).toBe(401);
        });
    });
});
```

### WebSocket Tests
```typescript
// realtime.spec.ts
describe('Realtime System', () => {
    let wsClient: WebSocket;
    let authToken: string;

    beforeEach(async () => {
        authToken = await getTestUserToken();
        wsClient = new WebSocket(`ws://localhost:3000?token=${authToken}`);
    });

    afterEach(() => {
        wsClient.close();
    });

    it('should receive tournament updates', (done) => {
        wsClient.on('message', (data) => {
            const message = JSON.parse(data.toString());
            expect(message.type).toBe('tournament_update');
            done();
        });

        // Trigger tournament update
        updateTournament({ id: 'test', status: 'started' });
    });
});
```

## End-to-End Testing

### UI Tests
```typescript
// tournament-page.e2e.ts
describe('Tournament Page', () => {
    beforeEach(async () => {
        await device.reloadReactNative();
        await loginTestUser();
    });

    it('should display tournament list', async () => {
        await expect(element(by.id('tournament-list')))
            .toBeVisible();
    });

    it('should navigate to tournament details', async () => {
        await element(by.text('Test Tournament')).tap();
        await expect(element(by.id('tournament-details')))
            .toBeVisible();
    });

    it('should join tournament', async () => {
        await element(by.text('Test Tournament')).tap();
        await element(by.id('join-button')).tap();
        await expect(element(by.text('Joined')))
            .toBeVisible();
    });
});
```

### Performance Tests
```typescript
// performance.spec.ts
describe('Performance Tests', () => {
    it('should load tournament list within 2 seconds', async () => {
        const startTime = Date.now();
        await navigateToTournaments();
        const endTime = Date.now();

        expect(endTime - startTime).toBeLessThan(2000);
    });

    it('should handle rapid chat messages', async () => {
        const chatRoom = await joinChatRoom();
        const messages = Array(100).fill('Test message');
        
        const startTime = Date.now();
        await Promise.all(messages.map(msg => chatRoom.sendMessage(msg)));
        const endTime = Date.now();

        expect(endTime - startTime).toBeLessThan(5000);
    });
});
```

## Test Coverage

### Coverage Requirements
```typescript
// jest.config.js
module.exports = {
    coverageThreshold: {
        global: {
            statements: 80,
            branches: 70,
            functions: 80,
            lines: 80
        }
    }
};
```

### Critical Paths
1. Authentication flow
2. Tournament creation and joining
3. Real-time updates
4. Payment processing
5. Chat functionality

## Test Data

### Test Fixtures
```typescript
// fixtures/tournaments.ts
export const testTournaments = [
    {
        id: 'test-1',
        title: 'Test Tournament 1',
        maxPlayers: 8,
        status: 'open'
    },
    {
        id: 'test-2',
        title: 'Test Tournament 2',
        maxPlayers: 16,
        status: 'in_progress'
    }
];

// fixtures/users.ts
export const testUsers = [
    {
        id: 'user-1',
        email: 'test1@example.com',
        username: 'testuser1'
    },
    {
        id: 'user-2',
        email: 'test2@example.com',
        username: 'testuser2'
    }
];
```

## CI/CD Integration

### GitHub Actions
```yaml
# .github/workflows/test.yml
name: Tests
on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - uses: actions/setup-node@v2
        with:
          node-version: '14'
      
      - name: Install dependencies
        run: npm install

      - name: Run tests
        run: npm test

      - name: Upload coverage
        uses: codecov/codecov-action@v2
```

## Testing Best Practices

1. **Test Organization**
   - Group related tests
   - Use descriptive test names
   - Follow AAA pattern (Arrange, Act, Assert)

2. **Mocking Guidelines**
   - Mock external dependencies
   - Use realistic test data
   - Clean up mocks after tests

3. **Performance Testing**
   - Set realistic thresholds
   - Test under load
   - Monitor memory usage

4. **Security Testing**
   - Test authentication
   - Validate input handling
   - Check authorization

5. **Code Quality**
   - Maintain test code quality
   - Review test coverage
   - Update tests with code changes
