import { Observable } from '@nativescript/core';
import { ObservableArray } from '@nativescript/core';
import { Transaction, WalletService } from '../../services/wallet-service';
import { BaseViewModel } from '../../base-view-model';

export class WalletViewModel extends BaseViewModel {
    private walletService: WalletService;
    public transactions: ObservableArray<Transaction>;
    private _balance: number;
    public isLoading: boolean;

    constructor() {
        super();
        this.walletService = WalletService.getInstance();
        this.transactions = new ObservableArray<Transaction>();
        this._balance = 0;
        this.isLoading = false;
    }

    get balance(): number {
        return this._balance;
    }

    set balance(value: number) {
        if (this._balance !== value) {
            this._balance = value;
            this.notifyPropertyChange('balance', value);
        }
    }

    async loadWalletData(): Promise<void> {
        try {
            this.isLoading = true;
            // TODO: Get actual userId from auth service
            const userId = 'current-user-id';
            
            await this.walletService.fetchBalance(userId);
            await this.walletService.fetchTransactions(userId);

            this.walletService.balance$.subscribe(balance => {
                this.balance = balance;
            });

            this.walletService.transactions$.subscribe(transactions => {
                this.transactions.splice(0);
                this.transactions.push(...transactions);
            });
        } catch (error) {
            console.error('Error loading wallet data:', error);
            // TODO: Show error to user
        } finally {
            this.isLoading = false;
            this.notifyPropertyChange('isLoading', false);
        }
    }
    notifyPropertyChange(arg0: string, balance: any) {
        throw new Error('Method not implemented.');
    }

    getTransactionIcon(type: string): string {
        return type === 'CREDIT' ? '↓' : '↑';
    }

    formatAmount(amount: number, type: string): string {
        return `${type === 'CREDIT' ? '+' : '-'}${amount}`;
    }

    formatDate(date: Date): string {
        return date.toLocaleDateString();
    }
}