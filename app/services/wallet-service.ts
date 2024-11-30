import { Observable } from 'rxjs';
import { BehaviorSubject } from 'rxjs';

export interface Transaction {
    id: string;
    userId: string;
    amount: number;
    type: 'CREDIT' | 'DEBIT';
    description: string;
    timestamp: Date;
    status: 'PENDING' | 'COMPLETED' | 'FAILED';
    relatedMatchId?: string;
}

export class WalletService {
    static addFunds(arg0: number) {
        throw new Error('Method not implemented.');
    }
    private static instance: WalletService;
    private _balance = new BehaviorSubject<number>(0);
    private _transactions = new BehaviorSubject<Transaction[]>([]);

    static getInstance(): WalletService {
        if (!WalletService.instance) {
            WalletService.instance = new WalletService();
        }
        return WalletService.instance;
    }

    get balance$(): Observable<number> {
        return this._balance.asObservable();
    }

    get transactions$(): Observable<Transaction[]> {
        return this._transactions.asObservable();
    }

    async fetchBalance(userId: string): Promise<void> {
        // TODO: Implement API call to fetch balance
        // For now using mock data
        this._balance.next(1000);
    }

    async fetchTransactions(userId: string): Promise<void> {
        // TODO: Implement API call to fetch transactions
        // For now using mock data
        const mockTransactions: Transaction[] = [
            {
                id: '1',
                userId,
                amount: 100,
                type: 'CREDIT',
                description: 'Tournament win',
                timestamp: new Date(),
                status: 'COMPLETED'
            }
        ];
        this._transactions.next(mockTransactions);
    }

    async deductEntryFee(userId: string, matchId: string, amount: number): Promise<boolean> {
        // TODO: Implement API call to deduct entry fee
        const currentBalance = this._balance.getValue();
        if (currentBalance >= amount) {
            this._balance.next(currentBalance - amount);
            const transaction: Transaction = {
                id: Date.now().toString(),
                userId,
                amount,
                type: 'DEBIT',
                description: `Entry fee for match ${matchId}`,
                timestamp: new Date(),
                status: 'COMPLETED',
                relatedMatchId: matchId
            };
            const currentTransactions = this._transactions.getValue();
            this._transactions.next([transaction, ...currentTransactions]);
            return true;
        }
        return false;
    }

    async distributePrize(userId: string, matchId: string, amount: number): Promise<void> {
        // TODO: Implement API call to add prize money
        const currentBalance = this._balance.getValue();
        this._balance.next(currentBalance + amount);
        const transaction: Transaction = {
            id: Date.now().toString(),
            userId,
            amount,
            type: 'CREDIT',
            description: `Prize money for match ${matchId}`,
            timestamp: new Date(),
            status: 'COMPLETED',
            relatedMatchId: matchId
        };
        const currentTransactions = this._transactions.getValue();
        this._transactions.next([transaction, ...currentTransactions]);
    }
}