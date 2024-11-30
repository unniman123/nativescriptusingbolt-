import { supabase } from './supabase';
import { Observable } from '@nativescript/core';

export interface Transaction {
    id: string;
    user_id: string;
    amount: number;
    type: 'tournament_entry' | 'withdrawal' | 'deposit';
    status: 'pending' | 'completed' | 'failed';
    created_at: string;
}

class TransactionService extends Observable {
    async createTransaction(data: Partial<Transaction>): Promise<Transaction> {
        try {
            const { data: transaction, error } = await supabase.rpc(
                'create_transaction',
                {
                    p_user_id: data.user_id,
                    p_amount: data.amount,
                    p_type: data.type
                }
            );

            if (error) throw error;
            return transaction;
        } catch (error) {
            console.error('Transaction creation error:', error);
            throw error;
        }
    }

    async processTransaction(transactionId: string): Promise<void> {
        try {
            const { error } = await supabase.rpc(
                'process_transaction',
                { p_transaction_id: transactionId }
            );

            if (error) throw error;
        } catch (error) {
            console.error('Transaction processing error:', error);
            throw error;
        }
    }

    async getUserTransactions(userId: string): Promise<Transaction[]> {
        try {
            const { data, error } = await supabase
                .from('transactions')
                .select('*')
                .eq('user_id', userId)
                .order('created_at', { ascending: false });

            if (error) throw error;
            return data;
        } catch (error) {
            console.error('Get transactions error:', error);
            throw error;
        }
    }

    async getTransactionById(id: string): Promise<Transaction> {
        try {
            const { data, error } = await supabase
                .from('transactions')
                .select('*')
                .eq('id', id)
                .single();

            if (error) throw error;
            return data;
        } catch (error) {
            console.error('Get transaction error:', error);
            throw error;
        }
    }

    watchTransactions(userId: string) {
        return supabase
            .channel(`user_transactions:${userId}`)
            .on('postgres_changes', {
                event: '*',
                schema: 'public',
                table: 'transactions',
                filter: `user_id=eq.${userId}`
            }, payload => {
                this.notify({
                    eventName: 'transactionUpdate',
                    transaction: payload.new
                });
            })
            .subscribe();
    }
}

export const transactionService = new TransactionService();
