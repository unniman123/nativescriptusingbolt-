import { authService } from '../../app/services/auth.service';
import { supabase } from '../../app/services/supabase';

describe('AuthService', () => {
    beforeEach(() => {
        // Reset auth state
        authService['clearAuthState']();
    });

    describe('login', () => {
        it('should authenticate user with valid credentials', async () => {
            const mockUser = { id: '123', email: 'test@example.com' };
            jest.spyOn(supabase.auth, 'signInWithPassword').mockResolvedValue({
                data: { user: mockUser, session: null },
                error: null
            });

            const result = await authService.login('test@example.com', 'password');
            expect(result.user).toEqual(mockUser);
        });

        it('should handle login errors', async () => {
            jest.spyOn(supabase.auth, 'signInWithPassword').mockResolvedValue({
                data: { user: null, session: null },
                error: new Error('Invalid credentials')
            });

            await expect(authService.login('test@example.com', 'wrong')).rejects.toThrow();
        });
    });

    describe('role management', () => {
        it('should correctly identify admin role', async () => {
            const mockUser = { id: '123', email: 'admin@example.com' };
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
            const mockSession = { access_token: 'new_token' };
            jest.spyOn(supabase.auth, 'getSession').mockResolvedValue({
                data: { session: mockSession },
                error: null
            });

            const token = await authService.getToken();
            expect(token).toBe('new_token');
        });
    });
});
