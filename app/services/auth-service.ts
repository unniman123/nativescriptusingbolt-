import { Observable, ApplicationSettings, alert } from '@nativescript/core';
import { supabase } from './supabase';
import type { Provider } from '@supabase/supabase-js';

class AuthService extends Observable {
    private static instance: AuthService;
    private _isAuthenticated: boolean = false;
    private _currentUser: any = null;
    private _isTwoFactorEnabled: boolean = false;
    private _isEmailVerified: boolean = false;
    private readonly SESSION_KEY = 'auth_session';
    private readonly TFA_KEY = 'tfa_enabled';

    private constructor() {
        super();
        this.loadPersistedSession();
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

    get isTwoFactorEnabled(): boolean {
        return this._isTwoFactorEnabled;
    }

    get isEmailVerified(): boolean {
        return this._isEmailVerified;
    }

    private async loadPersistedSession() {
        const sessionStr = ApplicationSettings.getString(this.SESSION_KEY);
        if (sessionStr) {
            try {
                const session = JSON.parse(sessionStr);
                await supabase.auth.setSession(session);
                this._isTwoFactorEnabled = ApplicationSettings.getBoolean(this.TFA_KEY, false);
                await this.checkEmailVerification();
            } catch (error) {
                console.error('Failed to restore session:', error);
                ApplicationSettings.remove(this.SESSION_KEY);
            }
        }
    }

    private async setupAuthListener() {
        supabase.auth.onAuthStateChange(async (event, session) => {
            console.log('Auth state changed:', event);
            this._isAuthenticated = !!session;
            this._currentUser = session?.user || null;
            
            if (session) {
                ApplicationSettings.setString(this.SESSION_KEY, JSON.stringify(session));
                await this.loadTwoFactorStatus();
                await this.checkEmailVerification();
            } else {
                ApplicationSettings.remove(this.SESSION_KEY);
                this._isEmailVerified = false;
            }

            this.notifyPropertyChange('isAuthenticated', this._isAuthenticated);
            this.notifyPropertyChange('currentUser', this._currentUser);
            this.notifyPropertyChange('isEmailVerified', this._isEmailVerified);
        });

        // Check initial session
        const { data: { session } } = await supabase.auth.getSession();
        this._isAuthenticated = !!session;
        this._currentUser = session?.user || null;
        if (session) {
            await this.loadTwoFactorStatus();
            await this.checkEmailVerification();
        }
    }

    private async checkEmailVerification(): Promise<boolean> {
        if (!this._currentUser) {
            console.log('[Auth] No current user found for email verification check');
            return false;
        }

        try {
            console.log('[Auth] Checking email verification status for:', this._currentUser.email);
            const { data: { user }, error } = await supabase.auth.getUser();
            if (error) throw error;

            this._isEmailVerified = !!user?.email_confirmed_at;
            console.log('[Auth] Email verification status:', this._isEmailVerified);
            console.log('[Auth] Email confirmed at:', user?.email_confirmed_at);
            
            this.notifyPropertyChange('isEmailVerified', this._isEmailVerified);
            return this._isEmailVerified;
        } catch (error) {
            console.error('[Auth] Failed to check email verification:', error);
            return false;
        }
    }

    async sendVerificationEmail(): Promise<void> {
        if (!this._currentUser?.email) {
            console.log('[Auth] No user email found for verification');
            throw new Error('No user email found');
        }

        try {
            console.log('[Auth] Sending verification email to:', this._currentUser.email);
            const { error } = await supabase.auth.resend({
                type: 'signup',
                email: this._currentUser.email
            });

            if (error) throw error;
            console.log('[Auth] Verification email sent successfully');

            alert({
                title: "Verification Email Sent",
                message: "Please check your email to verify your account.",
                okButtonText: "OK"
            });
        } catch (error) {
            console.error('[Auth] Failed to send verification email:', error);
            throw error;
        }
    }

    private async loadTwoFactorStatus() {
        try {
            const { data, error } = await supabase
                .from('user_settings')
                .select('two_factor_enabled')
                .eq('user_id', this._currentUser.id)
                .single();
            
            if (data) {
                this._isTwoFactorEnabled = data.two_factor_enabled;
                ApplicationSettings.setBoolean(this.TFA_KEY, this._isTwoFactorEnabled);
                this.notifyPropertyChange('isTwoFactorEnabled', this._isTwoFactorEnabled);
            }
        } catch (error) {
            console.error('Failed to load 2FA status:', error);
        }
    }

    async signInWithProvider(provider: Provider) {
        const { data, error } = await supabase.auth.signInWithOAuth({
            provider,
            options: {
                redirectTo: 'nativescriptapp://auth/callback'
            }
        });
        if (error) throw error;
        return data;
    }

    async enableTwoFactor() {
        if (!this._currentUser) throw new Error('User must be authenticated');
        
        const { data, error } = await supabase.rpc('enable_two_factor', {
            user_id: this._currentUser.id
        });
        
        if (error) throw error;
        
        this._isTwoFactorEnabled = true;
        ApplicationSettings.setBoolean(this.TFA_KEY, true);
        this.notifyPropertyChange('isTwoFactorEnabled', true);
        
        return data.secret;
    }

    async verifyTwoFactorToken(token: string) {
        if (!this._currentUser) throw new Error('User must be authenticated');
        
        const { data, error } = await supabase.rpc('verify_two_factor_token', {
            user_id: this._currentUser.id,
            token
        });
        
        if (error) throw error;
        return data;
    }

    async signOut() {
        const { error } = await supabase.auth.signOut();
        if (error) throw error;
        ApplicationSettings.remove(this.SESSION_KEY);
        ApplicationSettings.remove(this.TFA_KEY);
        this._isTwoFactorEnabled = false;
        this._isEmailVerified = false;
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