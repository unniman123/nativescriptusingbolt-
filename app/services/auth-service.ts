import { Observable } from '@nativescript/core';
import { supabase } from './supabase';

class AuthService extends Observable {
    private static instance: AuthService;
    private _isAuthenticated: boolean = false;
    private _currentUser: any = null;

    private constructor() {
        super();
        this.setupAuthListener();
    }

    static getInstance(): AuthService {
        if (!AuthService.instance) {
            AuthService.instance = new AuthService();
        }
        return AuthService.instance;
    }

    get isAuthenticated(): boolean {
        return this._isAuthenticated;
    }

    get currentUser(): any {
        return this._currentUser;
    }

    private async setupAuthListener() {
        supabase.auth.onAuthStateChange((event, session) => {
            this._isAuthenticated = !!session;
            this._currentUser = session?.user || null;
            this.notifyPropertyChange('isAuthenticated', this._isAuthenticated);
            this.notifyPropertyChange('currentUser', this._currentUser);
        });

        // Check initial session
        const { data: { session } } = await supabase.auth.getSession();
        this._isAuthenticated = !!session;
        this._currentUser = session?.user || null;
    }

    async signOut() {
        const { error } = await supabase.auth.signOut();
        if (error) throw error;
    }

    async resetPassword(email: string) {
        const { error } = await supabase.auth.resetPasswordForEmail(email);
        if (error) throw error;
    }

    async updatePassword(newPassword: string) {
        const { error } = await supabase.auth.updateUser({
            password: newPassword
        });
        if (error) throw error;
    }
}

export const authService = AuthService.getInstance();