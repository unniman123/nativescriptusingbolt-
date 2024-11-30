import { authService } from '../../app/services/auth.service';
import { supabase } from '../../app/services/supabase';
import { AuthError } from '@supabase/supabase-js';
import { Session } from '../../types/session';

function createAuthError(message: string, code: string, status: number): AuthError {
    const error = new Error(message) as AuthError;
    error.name = 'AuthError';
    error.code = code;
    error.status = status;
    (error as any).__isAuthError = true;
    return error;
}

describe('AuthService', () => {
    beforeEach(() => {
        // Reset auth state
        authService['clearAuthState']();
    });

    describe('login', () => {
        it('should authenticate user with valid credentials', async () => {
            const mockUser = { 
                id: '123', 
                email: 'test@example.com',
                app_metadata: {},
                user_metadata: {},
                aud: 'authenticated',
                created_at: new Date().toISOString()
            };
            jest.spyOn(supabase.auth, 'signInWithPassword').mockResolvedValue({
                data: { 
                    user: mockUser, 
                    session: {
                        access_token: 'mock_access_token',
                        refresh_token: 'mock_refresh_token',
                        token_type: 'bearer',
                        expires_in: 3600,
                        user: mockUser
                    } 
                },
                error: null
            } as { data: { user: typeof mockUser, session: Session & { refresh_token: string } }, error: null });

            const result = await authService.login('test@example.com', 'password');
            expect(result.user).toEqual(mockUser);
        });

        it('should handle login errors', async () => {
            const mockAuthError = createAuthError('Invalid credentials', 'AUTH_ERROR', 400);

            jest.spyOn(supabase.auth, 'signInWithPassword').mockResolvedValue({
                data: { user: null, session: null },
                error: mockAuthError
            } as { data: { user: null, session: null }, error: AuthError });

            await expect(authService.login('test@example.com', 'wrong')).rejects.toThrow(mockAuthError);
        });
    });

    describe('role management', () => {
        it('should correctly identify admin role', async () => {
            const mockUser = { 
                id: '123', 
                email: 'admin@example.com',
                app_metadata: {},
                user_metadata: {},
                aud: 'authenticated',
                created_at: new Date().toISOString()
            };
            jest.spyOn(supabase, 'from').mockReturnValue({
                select: () => ({
                    eq: () => ({
                        single: () => Promise.resolve({ data: { role: 'admin' } })
                    })
                })
            } as any);

            await authService['setAuthState'](mockUser);
            expect(authService.isAdmin()).toBe(true);
        });

        it('should handle role checks for unauthorized users', () => {
            expect(authService.isAdmin()).toBe(false);
            expect(() => authService.requireRole('admin')).toThrow();
        });
    });

    describe('token management', () => {
        it('should refresh token when needed', async () => {
            const mockSession = { 
                access_token: 'new_token',
                refresh_token: 'mock_refresh_token',
                expires_in: 3600,
                token_type: 'bearer',
                user: {
                    id: 'mock_user_id',
                    email: 'test@example.com',
                    app_metadata: {},
                    user_metadata: {},
                    aud: 'authenticated',
                    created_at: new Date().toISOString()
                }
            };
            jest.spyOn(supabase.auth, 'getSession').mockResolvedValue({
                data: { session: mockSession },
                error: null
            });

            const token = await authService.getToken();
            expect(token).toBe('new_token');
        });
    });
});
