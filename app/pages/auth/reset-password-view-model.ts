import { Observable, Frame } from '@nativescript/core';
import { authService } from '../../services/auth-service';

export class ResetPasswordViewModel extends Observable {
    private _email: string = '';
    private _newPassword: string = '';
    private _confirmPassword: string = '';
    private _isLoading: boolean = false;
    private _emailError: string = '';
    private _newPasswordError: string = '';
    private _confirmPasswordError: string = '';
    private _errorMessage: string = '';
    private _showNewPasswordForm: boolean = false;

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

    get newPassword(): string {
        return this._newPassword;
    }

    set newPassword(value: string) {
        if (this._newPassword !== value) {
            this._newPassword = value;
            this.notify({ object: this, eventName: Observable.propertyChangeEvent, propertyName: 'newPassword', value });
            this.validateNewPassword();
        }
    }

    get confirmPassword(): string {
        return this._confirmPassword;
    }

    set confirmPassword(value: string) {
        if (this._confirmPassword !== value) {
            this._confirmPassword = value;
            this.notify({ object: this, eventName: Observable.propertyChangeEvent, propertyName: 'confirmPassword', value });
            this.validateConfirmPassword();
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

    get newPasswordError(): string {
        return this._newPasswordError;
    }

    set newPasswordError(value: string) {
        if (this._newPasswordError !== value) {
            this._newPasswordError = value;
            this.notify({ object: this, eventName: Observable.propertyChangeEvent, propertyName: 'newPasswordError', value });
        }
    }

    get confirmPasswordError(): string {
        return this._confirmPasswordError;
    }

    set confirmPasswordError(value: string) {
        if (this._confirmPasswordError !== value) {
            this._confirmPasswordError = value;
            this.notify({ object: this, eventName: Observable.propertyChangeEvent, propertyName: 'confirmPasswordError', value });
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

    get showNewPasswordForm(): boolean {
        return this._showNewPasswordForm;
    }

    set showNewPasswordForm(value: boolean) {
        if (this._showNewPasswordForm !== value) {
            this._showNewPasswordForm = value;
            this.notify({ object: this, eventName: Observable.propertyChangeEvent, propertyName: 'showNewPasswordForm', value });
        }
    }

    async sendResetLink() {
        try {
            this.isLoading = true;
            this.errorMessage = '';

            if (!this.validateEmail()) {
                return;
            }

            await authService.resetPassword(this._email);
            this.errorMessage = 'Password reset link has been sent to your email';

        } catch (error: unknown) {
            console.error('Reset password error:', error);
            const errorMessage = error instanceof Error 
                ? error.message 
                : 'An unexpected error occurred';
            this.errorMessage = errorMessage;
        } finally {
            this.isLoading = false;
        }
    }

    async updatePassword() {
        try {
            this.isLoading = true;
            this.errorMessage = '';

            if (!this.validatePasswordForm()) {
                return;
            }

            await authService.updatePassword(this._newPassword);
            Frame.topmost().navigate({
                moduleName: 'app/pages/auth/login-page',
                clearHistory: true
            });

        } catch (error) {
            console.error('Update password error:', error);
            if (error instanceof Error) {
                this.errorMessage = error.message;
            } else {
                this.errorMessage = 'An unknown error occurred';
            }
        } finally {
            this.isLoading = false;
        }
    }

    goBack() {
        Frame.topmost().goBack();
    }

    private validateEmail(): boolean {
        this.emailError = '';
        
        if (!this._email) {
            this.emailError = 'Email is required';
            return false;
        }

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(this._email)) {
            this.emailError = 'Invalid email format';
            return false;
        }

        return true;
    }

    private validateNewPassword(): boolean {
        this.newPasswordError = '';

        if (!this._newPassword) {
            this.newPasswordError = 'New password is required';
            return false;
        }

        if (this._newPassword.length < 8) {
            this.newPasswordError = 'Password must be at least 8 characters';
            return false;
        }

        return true;
    }

    private validateConfirmPassword(): boolean {
        this.confirmPasswordError = '';

        if (!this._confirmPassword) {
            this.confirmPasswordError = 'Please confirm your password';
            return false;
        }

        if (this._confirmPassword !== this._newPassword) {
            this.confirmPasswordError = 'Passwords do not match';
            return false;
        }

        return true;
    }

    private validatePasswordForm(): boolean {
        return (
            this.validateNewPassword() &&
            this.validateConfirmPassword()
        );
    }
}
