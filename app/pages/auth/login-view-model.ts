import { Observable, Frame, alert } from '@nativescript/core';
import { supabase } from '../../services/supabase';
import { authService } from '../../services/auth-service';

export class LoginViewModel extends Observable {
    private _email: string = '';
    private _password: string = '';
    private _isLoading: boolean = false;
    private _emailError: string = '';
    private _passwordError: string = '';
    private _errorMessage: string = '';
    private _showVerificationPrompt: boolean = false;

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

    get showVerificationPrompt(): boolean {
        return this._showVerificationPrompt;
    }

    set showVerificationPrompt(value: boolean) {
        if (this._showVerificationPrompt !== value) {
            this._showVerificationPrompt = value;
            this.notify({ object: this, eventName: Observable.propertyChangeEvent, propertyName: 'showVerificationPrompt', value });
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

    async login() {
        try {
            this.isLoading = true;
            this.errorMessage = '';

            if (!this.validateForm()) {
                return;
            }

            const { data: { user }, error } = await supabase.auth.signInWithPassword({
                email: this._email,
                password: this._password
            });

            if (error) throw error;

            if (user) {
                const isVerified = await authService.checkEmailVerificationStatus();
                if (!isVerified) {
                    this.showVerificationPrompt = true;
                    this.errorMessage = 'Please verify your email before logging in.';
                    return;
                }

                Frame.topmost().navigate({
                    moduleName: 'app/pages/tournaments/tournaments-page'
                });
            }

        } catch (error) {
            console.error('Login error:', error);
            this.errorMessage = error.message;
        } finally {
            this.isLoading = false;
        }
    }

    async resendVerificationEmail() {
        try {
            this.isLoading = true;
            await authService.sendVerificationEmail();
            alert({
                title: "Email Sent",
                message: "Verification email has been resent. Please check your inbox.",
                okButtonText: "OK"
            });
        } catch (error) {
            console.error('Failed to resend verification email:', error);
            this.errorMessage = error.message;
        } finally {
            this.isLoading = false;
        }
    }

    async onForgotPassword() {
        Frame.topmost().navigate({
            moduleName: 'app/pages/auth/reset-password-page'
        });
    }

    private validateForm(): boolean {
        this.validateEmail();
        this.validatePassword();
        return !this._emailError && !this._passwordError;
    }
}