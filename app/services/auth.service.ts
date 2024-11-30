import { supabase } from './supabase';
import { Observable } from '@nativescript/core';
import { cacheService } from './cache.service';

interface AuthState {
    isAuthenticated: boolean;
    user: any;
    role: string;
}

class AuthService extends Observable {
    private _state: AuthState = {
        isAuthenticated: false,
        user: null,
        role: 'user'
    };

    constructor() {
        super();
        this.initializeAuth();
        this.setupAuthListener();
    }

    private async initializeAuth() {
        const session = await supabase.auth.getSession();
        if (session?.data?.session) {
            await this.setAuthState(session.data.session.user);
        }
    }

    private setupAuthListener() {
        supabase.auth.onAuthStateChange(async (event, session) => {
            if (event === 'SIGNED_IN') {
                await this.setAuthState(session?.user);
            } else if (event === 'SIGNED_OUT') {
                this.clearAuthState();
            } else if (event === 'TOKEN_REFRESHED') {
                await this.refreshUserRole();
            }
        });
    }

    private async setAuthState(user: any) {
        if (!user) return;

        const { data: roleData } = await supabase
            .from('user_roles')
            .select('role')
            .eq('user_id', user.id)
            .single();

        this._state = {
            isAuthenticated: true,
            user,
            role: roleData?.role || 'user'
        };

        this.notify({ eventName: 'authStateChanged', data: this._state });
        await cacheService.set('authState', this._state);
    }

    private clearAuthState() {
        this._state = {
            isAuthenticated: false,
            user: null,
            role: 'user'
        };
        this.notify({ eventName: 'authStateChanged', data: this._state });
        cacheService.remove('authState');
    }

    private async refreshUserRole() {
        if (!this._state.user) return;
        await this.setAuthState(this._state.user);
    }

    async login(email: string, password: string) {
        try {
            const { data, error } = await supabase.auth.signInWithPassword({
                email,
                password
            });

            if (error) throw error;
            await this.setAuthState(data.user);
            return data;
        } catch (error) {
            console.error('Login error:', error);
            throw error;
        }
    }

    async register(email: string, password: string) {
        try {
            const { data, error } = await supabase.auth.signUp({
                email,
                password
            });

            if (error) throw error;
            return data;
        } catch (error) {
            console.error('Registration error:', error);
            throw error;
        }
    }

    async logout() {
        try {
            const { error } = await supabase.auth.signOut();
            if (error) throw error;
            this.clearAuthState();
        } catch (error) {
            console.error('Logout error:', error);
            throw error;
        }
    }

    isAdmin(): boolean {
        return this._state.role === 'admin';
    }

    isModerator(): boolean {
        return this._state.role === 'moderator' || this._state.role === 'admin';
    }

    requireAuth() {
        if (!this._state.isAuthenticated) {
            throw new Error('Authentication required');
        }
    }

    requireRole(role: string | string[]) {
        this.requireAuth();
        const roles = Array.isArray(role) ? role : [role];
        if (!roles.includes(this._state.role)) {
            throw new Error('Insufficient permissions');
        }
    }

    getToken(): Promise<string | null> {
        return supabase.auth.getSession().then(({ data }) => {
            return data.session?.access_token || null;
        });
    }
}

export const authService = new AuthService();
