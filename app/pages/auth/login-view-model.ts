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
    private _tfaCode: string = '';
    private _showTfaInput: boolean = false;

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

    get tfaCode(): string {
        return this._tfaCode;
    }

    set tfaCode(value: string) {
        if (this._tfaCode !== value) {
            this._tfaCode = value;
            this.notify({ object: this, eventName: Observable.propertyChangeEvent, propertyName: 'tfaCode', value });
        }
    }

    get showTfaInput(): boolean {
        return this._showTfaInput;
    }

    set showTfaInput(value: boolean) {
        if (this._showTfaInput !== value) {
            this._showTfaInput = value;
            this.notify({ object: this, eventName: Observable.propertyChangeEvent, propertyName: 'showTfaInput', value });
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

            if (user && authService.isTwoFactorEnabled) {
                this.showTfaInput = true;
                return;
            }

            Frame.topmost().navigate({
                moduleName: 'app/pages/tournaments/tournaments-page'
            });

        } catch (error) {
            console.error('Login error:', error);
            this.errorMessage = error.message;
        } finally {
            this.isLoading = false;
        }
    }

    async verifyTfaCode() {
        try {
            this.isLoading = true;
            this.errorMessage = '';

            if (!this._tfaCode) {
                this.errorMessage = 'Please enter the 2FA code';
                return;
            }

            const isValid = await authService.verifyTwoFactorToken(this._tfaCode);
            
            if (!isValid) {
                this.errorMessage = 'Invalid 2FA code';
                return;
            }

            Frame.topmost().navigate({
                moduleName: 'app/pages/tournaments/tournaments-page'
            });

        } catch (error) {
            console.error('2FA verification error:', error);
            this.errorMessage = error.message;
        } finally {
            this.isLoading = false;
        }
    }

    async loginWithGoogle() {
        try {
            this.isLoading = true;
            this.errorMessage = '';
            
            await authService.signInWithProvider('google');
            
        } catch (error) {
            console.error('Google login error:', error);
            this.errorMessage = error.message;
        } finally {
            this.isLoading = false;
        }
    }

    private validateForm(): boolean {
        this.validateEmail();
        this.validatePassword();
        return !this._emailError && !this._passwordError;
    }
}