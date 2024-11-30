import { supabase } from './supabase';
import { Observable } from '@nativescript/core';

export interface DashboardStats {
    activeTournaments: number;
    totalUsers: number;
    totalRevenue: number;
    recentTournaments: any[];
    recentUsers: any[];
}

export interface AdminSettings {
    maintenanceMode: boolean;
    allowNewRegistrations: boolean;
    allowTournamentCreation: boolean;
    minimumEntryFee: number;
    maximumEntryFee: number;
}

class AdminService extends Observable {
    updateTournamentStatus(arg0: string, arg1: string) {
        throw new Error('Method not implemented.');
    }
    getUsers(arg0: { search: string; }): { data: any; } | PromiseLike<{ data: any; }> {
        throw new Error('Method not implemented.');
    }
    deleteUser(id: any) {
        throw new Error('Method not implemented.');
    }
    private settings: AdminSettings = {
        maintenanceMode: false,
        allowNewRegistrations: true,
        allowTournamentCreation: true,
        minimumEntryFee: 0,
        maximumEntryFee: 10000
    };

    private async retryOperation<T>(operation: () => Promise<T>, maxRetries: number = 3): Promise<T> {
        let lastError: Error = new Error('Operation failed after max retries');
        
        for (let attempt = 0; attempt < maxRetries; attempt++) {
            try {
                return await operation();
            } catch (error) {
                lastError = error instanceof Error ? error : new Error(String(error));
                await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempt) * 1000));
            }
        }
        
        throw lastError;
    }

    private debounce<T>(func: (...args: any[]) => Promise<T>, wait: number): (...args: any[]) => Promise<T> {
        let timeout: NodeJS.Timeout;
        
        return (...args: any[]): Promise<T> => {
            return new Promise((resolve, reject) => {
                const later = async () => {
                    try {
                        const result = await func.apply(this, args);
                        resolve(result);
                    } catch (error) {
                        reject(error);
                    }
                };
                
                clearTimeout(timeout);
                timeout = setTimeout(later, wait);
            });
        };
    }

    async getActiveTournamentsCount(): Promise<number> {
        try {
            const { count: activeTournaments } = await supabase
                .from('tournaments')
                .select('*', { count: 'exact' })
                .eq('status', 'active');
            return activeTournaments ?? 0;
        } catch (error) {
            console.error('Error getting active tournaments count:', error);
            throw error;
        }
    }

    async getTotalUsersCount(): Promise<number> {
        try {
            const { count: totalUsers = 0 } = await supabase
                .from('users')
                .select('*', { count: 'exact' });
            return totalUsers ?? 0;
        } catch (error) {
            console.error('Error getting total users count:', error);
            throw error;
        }
    }

    async getTotalRevenue(): Promise<number> {
        try {
            const { data: transactions } = await supabase
                .from('transactions')
                .select('amount');
            const totalRevenue = transactions?.reduce((sum, tx) => sum + (tx.amount || 0), 0) || 0;
            return totalRevenue;
        } catch (error) {
            console.error('Error getting total revenue:', error);
            throw error;
        }
    }

    async getRecentTournaments(): Promise<any[]> {
        try {
            const { data: recentTournaments } = await supabase
                .from('tournaments')
                .select('*')
                .order('created_at', { ascending: false })
                .limit(5);
            return recentTournaments ?? [];
        } catch (error) {
            console.error('Error getting recent tournaments:', error);
            throw error;
        }
    }

    async getRecentUsers(): Promise<any[]> {
        try {
            const { data: recentUsers } = await supabase
                .from('users')
                .select('*')
                .order('created_at', { ascending: false })
                .limit(5);
            return recentUsers ?? []; 
        } catch (error) {
            console.error('Error getting recent users:', error);
            return []; 
        }
    }

    async getDashboardStats(): Promise<DashboardStats> {
        try {
            const [
                activeTournaments,
                totalUsers,
                totalRevenue,
                recentTournaments,
                recentUsers
            ] = await Promise.all([
                this.getActiveTournamentsCount(),
                this.getTotalUsersCount(),
                this.getTotalRevenue(),
                this.getRecentTournaments(),
                this.getRecentUsers()
            ]);

            return {
                activeTournaments: activeTournaments ?? 0,
                totalUsers: totalUsers ?? 0,
                totalRevenue: totalRevenue ?? 0,
                recentTournaments: recentTournaments ?? [],
                recentUsers: recentUsers ?? []
            };
        } catch (error) {
            console.error('Error getting dashboard stats:', error);
            throw error;
        }
    }

    async getCurrentUser() {
        const { data: { user }, error } = await supabase.auth.getUser();
        if (error) throw error;
        return user;
    }

    async getAdminStatus() {
        const { data: { user }, error } = await supabase.auth.getUser();
        if (error) throw error;
        if (!user) return false;

        const { data: profile } = await supabase
            .from('profiles')
            .select('is_admin')
            .eq('id', user.id)
            .single();

        return profile?.is_admin ?? false;
    }

    async getSystemSettings(): Promise<AdminSettings> {
        return this.retryOperation(async () => {
            try {
                const { data } = await supabase
                    .from('system_settings')
                    .select('*')
                    .single();
                
                if (data) {
                    this.settings = data;
                }
                return this.settings;
            } catch (error) {
                console.error('Error fetching system settings:', error);
                return this.settings;
            }
        });
    }

    async updateSystemSettings(settings: Partial<AdminSettings>): Promise<void> {
        return this.retryOperation(async () => {
            try {
                const { error } = await supabase
                    .from('system_settings')
                    .upsert({
                        ...this.settings,
                        ...settings,
                        updated_at: new Date()
                    });

                if (error) throw error;
                
                this.settings = { ...this.settings, ...settings };
            } catch (error) {
                console.error('Error updating system settings:', error);
                throw error;
            }
        });
    }

    async getUserAnalytics(startDate: Date, endDate: Date) {
        return this.retryOperation(async () => {
            try {
                const { data } = await supabase.rpc('get_user_analytics', {
                    start_date: startDate,
                    end_date: endDate
                });
                return data;
            } catch (error) {
                console.error('Error fetching user analytics:', error);
                throw error;
            }
        });
    }

    async getTournamentAnalytics(startDate: Date, endDate: Date) {
        return this.retryOperation(async () => {
            try {
                const { data } = await supabase.rpc('get_tournament_analytics', {
                    start_date: startDate,
                    end_date: endDate
                });
                return data;
            } catch (error) {
                console.error('Error fetching tournament analytics:', error);
                throw error;
            }
        });
    }

    async getRevenueAnalytics(startDate: Date, endDate: Date) {
        return this.retryOperation(async () => {
            try {
                const { data } = await supabase.rpc('get_revenue_analytics', {
                    start_date: startDate,
                    end_date: endDate
                });
                return data;
            } catch (error) {
                console.error('Error fetching revenue analytics:', error);
                throw error;
            }
        });
    }

    async moderateContent(contentId: string, action: 'approve' | 'reject', reason?: string) {
        return this.retryOperation(async () => {
            try {
                const { error } = await supabase
                    .from('moderation_actions')
                    .insert({
                        content_id: contentId,
                        action,
                        reason,
                        moderator_id: (await this.getCurrentUser())?.id
                    });

                if (error) throw error;
            } catch (error) {
                console.error('Error moderating content:', error);
                throw error;
            }
        });
    }

    async banUser(userId: string, reason: string, duration?: number) {
        return this.retryOperation(async () => {
            try {
                const { error } = await supabase
                    .from('user_bans')
                    .insert({
                        user_id: userId,
                        reason,
                        duration,
                        banned_by: (await this.getCurrentUser())?.id
                    });

                if (error) throw error;
            } catch (error) {
                console.error('Error banning user:', error);
                throw error;
            }
        });
    }

    async generateReport(type: string, params: any) {
        return this.retryOperation(async () => {
            try {
                const { data } = await supabase.rpc('generate_admin_report', {
                    report_type: type,
                    report_params: params
                });
                return data;
            } catch (error) {
                console.error('Error generating report:', error);
                throw error;
            }
        });
    }

    searchUsers = this.debounce(async (query: string) => {
        const { data, error } = await supabase
            .from('users')
            .select('*')
            .ilike('username', `%${query}%`);
        
        if (error) throw error;
        return data;
    }, 300);
}

export const adminService = new AdminService();
