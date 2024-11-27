import { Observable, Frame } from '@nativescript/core';
import { authService } from '../../services/auth-service';
import { supabase } from '../../services/supabase';

export class ProfileViewModel extends Observable {
    private _username: string = '';
    private _gameId: string = '';
    private _email: string = '';
    private _isEmailVerified: boolean = false;
    private _isLoading: boolean = false;
    private _errorMessage: string = '';

    constructor() {
        super();
        this.loadProfile();
    }

    get username(): string {
        return this._username;
    }

    set username(value: string) {
        if (this._username !== value) {
            this._username = value;
            this.notifyPropertyChange('username', value);
        }
    }

    get gameId(): string {
        return this._gameId;
    }

    set gameId(value: string) {
        if (this._gameId !== value) {
            this._gameId = value;
            this.notifyPropertyChange('gameId', value);
        }
    }

    get email(): string {
        return this._email;
    }

    set email(value: string) {
        if (this._email !== value) {
            this._email = value;
            this.notifyPropertyChange('email', value);
        }
    }

    get isEmailVerified(): boolean {
        return this._isEmailVerified;
    }

    set isEmailVerified(value: boolean) {
        if (this._isEmailVerified !== value) {
            this._isEmailVerified = value;
            this.notifyPropertyChange('isEmailVerified', value);
        }
    }

    get isLoading(): boolean {
        return this._isLoading;
    }

    set isLoading(value: boolean) {
        if (this._isLoading !== value) {
            this._isLoading = value;
            this.notifyPropertyChange('isLoading', value);
        }
    }

    get errorMessage(): string {
        return this._errorMessage;
    }

    set errorMessage(value: string) {
        if (this._errorMessage !== value) {
            this._errorMessage = value;
            this.notifyPropertyChange('errorMessage', value);
        }
    }

    async loadProfile() {
        try {
            this.isLoading = true;
            this.errorMessage = '';

            const { data: { user }, error: userError } = await supabase.auth.getUser();
            if (userError) throw userError;

            if (user) {
                this.email = user.email || '';
                this.isEmailVerified = !!user.email_confirmed_at;

                const { data: profile, error: profileError } = await supabase
                    .from('users')
                    .select('username, game_id')
                    .eq('id', user.id)
                    .single();

                if (profileError) throw profileError;

                if (profile) {
                    this.username = profile.username || '';
                    this.gameId = profile.game_id || '';
                }
            }
        } catch (error) {
            console.error('Failed to load profile:', error);
            this.errorMessage = error.message;
        } finally {
            this.isLoading = false;
        }
    }

    async updateProfile() {
        try {
            this.isLoading = true;
            this.errorMessage = '';

            const { data: { user }, error: userError } = await supabase.auth.getUser();
            if (userError) throw userError;

            if (!user) {
                throw new Error('No user found');
            }

            const { error: updateError } = await supabase
                .from('users')
                .update({
                    username: this._username,
                    game_id: this._gameId
                })
                .eq('id', user.id);

            if (updateError) throw updateError;

        } catch (error) {
            console.error('Failed to update profile:', error);
            this.errorMessage = error.message;
        } finally {
            this.isLoading = false;
        }
    }

    async signOut() {
        try {
            await authService.signOut();
            Frame.topmost().navigate({
                moduleName: 'app/pages/auth/login-page',
                clearHistory: true
            });
        } catch (error) {
            console.error('Sign out error:', error);
            this.errorMessage = error.message;
        }
    }
}