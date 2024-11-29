import { Observable, Frame, Connectivity } from '@nativescript/core';
import { supabase, getSupabase } from '../../services/supabase';

export class RegisterViewModel extends Observable {
    private _username: string = '';
    private _email: string = '';
    private _password: string = '';
    private _gameId: string = '';
    private _isLoading: boolean = false;
    private _isOffline: boolean = false;
    private _usernameError: string = '';
    private _emailError: string = '';
    private _passwordError: string = '';
    private _gameIdError: string = '';
    private _errorMessage: string = '';

    constructor() {
        super();
        this.setupConnectivityMonitoring();
    }

    private setupConnectivityMonitoring() {
        // Initial connection check
        this.isOffline = Connectivity.getConnectionType() === Connectivity.connectionType.none;
        
        // Monitor connection changes
        Connectivity.startMonitoring((connectionType) => {
            this.isOffline = connectionType === Connectivity.connectionType.none;
            if (!this.isOffline && this.errorMessage === 'No internet connection') {
                this.errorMessage = '';
            }
        });
    }

    // Property getters and setters with validation
    get username(): string {
        return this._username;
    }

    set username(value: string) {
        if (this._username !== value) {
            this._username = value;
            this.notify({ object: this, eventName: Observable.propertyChangeEvent, propertyName: 'username', value });
            this.validateUsername();
        }
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

    get gameId(): string {
        return this._gameId;
    }

    set gameId(value: string) {
        if (this._gameId !== value) {
            this._gameId = value;
            this.notify({ object: this, eventName: Observable.propertyChangeEvent, propertyName: 'gameId', value });
            this.validateGameId();
        }
    }

    // Error message getters and setters
    get usernameError(): string { return this._usernameError; }
    set usernameError(value: string) {
        if (this._usernameError !== value) {
            this._usernameError = value;
            this.notify({ object: this, eventName: Observable.propertyChangeEvent, propertyName: 'usernameError', value });
        }
    }

    get emailError(): string { return this._emailError; }
    set emailError(value: string) {
        if (this._emailError !== value) {
            this._emailError = value;
            this.notify({ object: this, eventName: Observable.propertyChangeEvent, propertyName: 'emailError', value });
        }
    }

    get passwordError(): string { return this._passwordError; }
    set passwordError(value: string) {
        if (this._passwordError !== value) {
            this._passwordError = value;
            this.notify({ object: this, eventName: Observable.propertyChangeEvent, propertyName: 'passwordError', value });
        }
    }

    get gameIdError(): string { return this._gameIdError; }
    set gameIdError(value: string) {
        if (this._gameIdError !== value) {
            this._gameIdError = value;
            this.notify({ object: this, eventName: Observable.propertyChangeEvent, propertyName: 'gameIdError', value });
        }
    }

    get errorMessage(): string { return this._errorMessage; }
    set errorMessage(value: string) {
        if (this._errorMessage !== value) {
            this._errorMessage = value;
            this.notify({ object: this, eventName: Observable.propertyChangeEvent, propertyName: 'errorMessage', value });
        }
    }

    get isLoading(): boolean { return this._isLoading; }
    set isLoading(value: boolean) {
        if (this._isLoading !== value) {
            this._isLoading = value;
            this.notify({ object: this, eventName: Observable.propertyChangeEvent, propertyName: 'isLoading', value });
        }
    }

    get isOffline(): boolean { return this._isOffline; }
    set isOffline(value: boolean) {
        if (this._isOffline !== value) {
            this._isOffline = value;
            this.notify({ object: this, eventName: Observable.propertyChangeEvent, propertyName: 'isOffline', value });
        }
    }

    // Computed property for button enable state
    get canRegister(): boolean {
        return this.username.length > 0 && 
               this.email.length > 0 && 
               this.password.length > 0 && 
               !this.usernameError && 
               !this.emailError && 
               !this.passwordError;
    }

    // Validation methods
    private validateUsername(): void {
        if (!this._username) {
            this.usernameError = 'Username is required';
        } else if (this._username.length < 3) {
            this.usernameError = 'Username must be at least 3 characters';
        } else if (!/^[a-zA-Z0-9_]+$/.test(this._username)) {
            this.usernameError = 'Username can only contain letters, numbers, and underscores';
        } else {
            this.usernameError = '';
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
        } else if (this._password.length < 8) {
            this.passwordError = 'Password must be at least 8 characters';
        } else if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(this._password)) {
            this.passwordError = 'Password must contain at least one uppercase letter, one lowercase letter, and one number';
        } else {
            this.passwordError = '';
        }
    }

    private validateGameId(): void {
        if (this._gameId && !/^[A-Za-z0-9_-]+$/.test(this._gameId)) {
            this.gameIdError = 'Game ID can only contain letters, numbers, hyphens, and underscores';
        } else {
            this.gameIdError = '';
        }
    }

    async onRegister() {
        try {
            this.validateUsername();
            this.validateEmail();
            this.validatePassword();
            this.validateGameId();

            if (this.usernameError || this.emailError || this.passwordError || this.gameIdError) {
                return;
            }

            if (this.isOffline) {
                this.errorMessage = 'No internet connection';
                return;
            }

            this.isLoading = true;
            this.errorMessage = '';

            try {
                // Use getSupabase to ensure Supabase is initialized
                const supabase = getSupabase();

                // Register user with Supabase
                const { data: authData, error: authError } = await supabase.auth.signUp({
                    email: this.email,
                    password: this.password,
                    options: {
                        data: {
                            username: this.username,
                            game_id: this.gameId || null
                        }
                    }
                });

                if (authError) {
                    this.errorMessage = authError.message;
                    this.isLoading = false;
                    return;
                }

                // Handle successful registration
                if (authData?.user) {
                    // Navigate or perform post-registration actions
                    Frame.topmost().navigate('pages/login/login-page');
                }
            } catch (error) {
                console.error('Registration error:', error);
                // Type guard to check if error is an Error object
                this.errorMessage = error instanceof Error ? error.message : 'Failed to register. Please try again.';
            } finally {
                this.isLoading = false;
            }
        } catch (error) {
            console.error('Registration error:', error);
            // Type guard to check if error is an Error object
            this.errorMessage = error instanceof Error ? error.message : 'Failed to register. Please try again.';
        } finally {
            this.isLoading = false;
        }
    }

    onBackToLogin() {
        const frame = Frame.topmost();
        frame.navigate({
            moduleName: "pages/auth/login-page",
            clearHistory: true
        });
    }

    // Clean up when page is destroyed
    onUnloaded() {
        Connectivity.stopMonitoring();
    }
}