import { Observable, Frame, alert } from '@nativescript/core';
import { supabase } from '../../services/supabase';

export class LoginViewModel extends Observable {
    private _email: string = '';
    private _password: string = '';
    private _isLoading: boolean = false;
    private _emailError: string = '';
    private _passwordError: string = '';
    private _errorMessage: string = '';

    constructor() {
        super();
    }

    get email(): string {
        return this._email;
    }

    set email(value: string) {
        if (this._email !== value) {
            this._email = value;
            this.notify({ object: this, eventName: Observable.propertyChangeEvent, propertyName: 'email', value });
            this.validateEmail();
        }
    }

    get password(): string {
        return this._password;
    }

    set password(value: string) {
        if (this._password !== value) {
            this._password = value;
            this.notify({ object: this, eventName: Observable.propertyChangeEvent, propertyName: 'password', value });
            this.validatePassword();
        }
    }

    get isLoading(): boolean {
        return this._isLoading;
    }

    set isLoading(value: boolean) {
        if (this._isLoading !== value) {
            this._isLoading = value;
            this.notify({ object: this, eventName: Observable.propertyChangeEvent, propertyName: 'isLoading', value });
        }
    }

    get emailError(): string {
        return this._emailError;
    }

    set emailError(value: string) {
        if (this._emailError !== value) {
            this._emailError = value;
            this.notify({ object: this, eventName: Observable.propertyChangeEvent, propertyName: 'emailError', value });
        }
    }

    get passwordError(): string {
        return this._passwordError;
    }

    set passwordError(value: string) {
        if (this._passwordError !== value) {
            this._passwordError = value;
            this.notify({ object: this, eventName: Observable.propertyChangeEvent, propertyName: 'passwordError', value });
        }
    }

    get errorMessage(): string {
        return this._errorMessage;
    }

    set errorMessage(value: string) {
        if (this._errorMessage !== value) {
            this._errorMessage = value;
            this.notify({ object: this, eventName: Observable.propertyChangeEvent, propertyName: 'errorMessage', value });
        }
    }

    private validateEmail(): void {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!this._email) {
            this.emailError = 'Email is required';
        } else if (!emailRegex.test(this._email)) {
            this.emailError = 'Please enter a valid email address';
        } else {
            this.emailError = '';
        }
    }

    private validatePassword(): void {
        if (!this._password) {
            this.passwordError = 'Password is required';
        } else if (this._password.length < 6) {
            this.passwordError = 'Password must be at least 6 characters';
        } else {
            this.passwordError = '';
        }
    }

    async onLogin() {
        try {
            this.validateEmail();
            this.validatePassword();

            if (this.emailError || this.passwordError) {
                return;
            }

            this.isLoading = true;
            this.errorMessage = '';

            const { data, error } = await supabase.auth.signInWithPassword({
                email: this.email,
                password: this.password
            });

            if (error) throw error;

            if (data?.session) {
                // Navigate to main page
                const frame = Frame.topmost();
                frame.navigate({
                    moduleName: "pages/tournaments/tournaments-page",
                    clearHistory: true
                });
            }
        } catch (error) {
            console.error('Login error:', error);
            this.errorMessage = error.message || 'Failed to login. Please try again.';
        } finally {
            this.isLoading = false;
        }
    }

    onRegister() {
        const frame = Frame.topmost();
        frame.navigate("pages/auth/register-page");
    }
}