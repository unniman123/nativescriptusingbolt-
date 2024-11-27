import { Observable, EventData, alert } from '@nativescript/core';
import { TournamentService } from '../../services/tournament-service';

export class CreateTournamentViewModel extends Observable {
    private _title: string = '';
    private _gameTypes: string[] = ['BGMI', 'Free Fire', 'Call of Duty Mobile'];
    private _selectedGameTypeIndex: number = 0;
    private _entryFee: number = 0;
    private _maxPlayers: number = 0;
    private _startTime: Date = new Date();
    private _rules: string = '';
    private _isLoading: boolean = false;
    private _validationMessage: string = '';

    constructor() {
        super();
        // Set default start time to next hour
        this._startTime.setHours(this._startTime.getHours() + 1);
        this._startTime.setMinutes(0);
        this._startTime.setSeconds(0);
    }

    get title(): string {
        return this._title;
    }

    set title(value: string) {
        if (this._title !== value) {
            this._title = value;
            this.notify({ object: this, eventName: Observable.propertyChangeEvent, propertyName: 'title', value });
            this.validateForm();
        }
    }

    get gameTypes(): string[] {
        return this._gameTypes;
    }

    get selectedGameTypeIndex(): number {
        return this._selectedGameTypeIndex;
    }

    set selectedGameTypeIndex(value: number) {
        if (this._selectedGameTypeIndex !== value) {
            this._selectedGameTypeIndex = value;
            this.notify({ object: this, eventName: Observable.propertyChangeEvent, propertyName: 'selectedGameTypeIndex', value });
            this.validateForm();
        }
    }

    get entryFee(): number {
        return this._entryFee;
    }

    set entryFee(value: number) {
        if (this._entryFee !== value) {
            this._entryFee = value;
            this.notify({ object: this, eventName: Observable.propertyChangeEvent, propertyName: 'entryFee', value });
            this.validateForm();
        }
    }

    get maxPlayers(): number {
        return this._maxPlayers;
    }

    set maxPlayers(value: number) {
        if (this._maxPlayers !== value) {
            this._maxPlayers = value;
            this.notify({ object: this, eventName: Observable.propertyChangeEvent, propertyName: 'maxPlayers', value });
            this.validateForm();
        }
    }

    get startTime(): Date {
        return this._startTime;
    }

    set startTime(value: Date) {
        if (this._startTime !== value) {
            this._startTime = value;
            this.notify({ object: this, eventName: Observable.propertyChangeEvent, propertyName: 'startTime', value });
            this.validateForm();
        }
    }

    get rules(): string {
        return this._rules;
    }

    set rules(value: string) {
        if (this._rules !== value) {
            this._rules = value;
            this.notify({ object: this, eventName: Observable.propertyChangeEvent, propertyName: 'rules', value });
            this.validateForm();
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

    get validationMessage(): string {
        return this._validationMessage;
    }

    set validationMessage(value: string) {
        if (this._validationMessage !== value) {
            this._validationMessage = value;
            this.notify({ object: this, eventName: Observable.propertyChangeEvent, propertyName: 'validationMessage', value });
        }
    }

    get isValid(): boolean {
        return (
            this._title.length > 0 &&
            this._entryFee > 0 &&
            this._maxPlayers >= 2 &&
            this._startTime > new Date() &&
            this._rules.length > 0
        );
    }

    private validateForm(): void {
        let messages: string[] = [];

        if (!this._title) {
            messages.push('Title is required');
        }

        if (this._entryFee <= 0) {
            messages.push('Entry fee must be greater than 0');
        }

        if (this._maxPlayers < 2) {
            messages.push('Tournament must have at least 2 players');
        }

        if (this._startTime <= new Date()) {
            messages.push('Start time must be in the future');
        }

        if (!this._rules) {
            messages.push('Tournament rules are required');
        }

        this.validationMessage = messages.join('\n');
    }

    async createTournament() {
        if (!this.isValid || this.isLoading) return;

        try {
            this.isLoading = true;
            await TournamentService.createTournament({
                title: this._title,
                game_type: this._gameTypes[this._selectedGameTypeIndex],
                entry_fee: this._entryFee,
                max_players: this._maxPlayers,
                start_time: this._startTime.toISOString(),
                rules: this._rules,
                status: 'open'
            });

            alert({
                title: 'Success',
                message: 'Tournament created successfully!',
                okButtonText: 'OK'
            });

            // Navigate back
            const frame = Frame.topmost();
            frame.goBack();
        } catch (error) {
            console.error('Failed to create tournament:', error);
            alert({
                title: 'Error',
                message: error.message || 'Failed to create tournament',
                okButtonText: 'OK'
            });
        } finally {
            this.isLoading = false;
        }
    }
}
