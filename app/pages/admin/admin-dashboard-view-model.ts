import { Observable } from '@nativescript/core';
import { Frame } from '@nativescript/core';
import { adminService } from '../../services/admin.service';
import { authService } from '../../services/auth.service';
import { toast } from '../../services/toast.service';

export class AdminDashboardViewModel extends Observable {
    private _activeTournaments: number = 0;
    private _totalUsers: number = 0;
    private _totalRevenue: number = 0;
    private _isLoading: boolean = false;
    private _refreshInterval: any;

    constructor() {
        super();
        this.loadDashboardData();
        this.startAutoRefresh();
    }

    get activeTournaments(): number {
        return this._activeTournaments;
    }

    get totalUsers(): number {
        return this._totalUsers;
    }

    get totalRevenue(): number {
        return this._totalRevenue;
    }

    get isLoading(): boolean {
        return this._isLoading;
    }

    async loadDashboardData() {
        try {
            this._isLoading = true;
            this.notifyPropertyChange('isLoading', true);

            const stats = await adminService.getDashboardStats();
            this._activeTournaments = stats.activeTournaments;
            this._totalUsers = stats.totalUsers;
            this._totalRevenue = stats.totalRevenue;

            this.notifyPropertyChange('activeTournaments', this._activeTournaments);
            this.notifyPropertyChange('totalUsers', this._totalUsers);
            this.notifyPropertyChange('totalRevenue', this._totalRevenue);
        } catch (error) {
            console.error('Dashboard loading error:', error);
            toast.error('Failed to load dashboard data');
        } finally {
            this._isLoading = false;
            this.notifyPropertyChange('isLoading', false);
        }
    }

    private startAutoRefresh() {
        this._refreshInterval = setInterval(() => {
            this.loadDashboardData();
        }, 30000); // Refresh every 30 seconds
    }

    onUnloaded() {
        if (this._refreshInterval) {
            clearInterval(this._refreshInterval);
        }
    }

    navigateToTournaments() {
        Frame.topmost().navigate({
            moduleName: "pages/admin/tournaments/tournament-management",
            animated: true
        });
    }

    navigateToUsers() {
        Frame.topmost().navigate({
            moduleName: "pages/admin/users/user-management",
            animated: true
        });
    }

    navigateToReports() {
        Frame.topmost().navigate({
            moduleName: "pages/admin/reports/reports-dashboard",
            animated: true
        });
    }

    navigateToSettings() {
        Frame.topmost().navigate({
            moduleName: "pages/admin/settings/system-settings",
            animated: true
        });
    }

    navigateToModeration() {
        Frame.topmost().navigate({
            moduleName: "pages/admin/moderation/content-moderation",
            animated: true
        });
    }

    navigateToPayments() {
        Frame.topmost().navigate({
            moduleName: "pages/admin/payments/payment-management",
            animated: true
        });
    }

    showTournaments() {
        // Show tournaments detail modal or navigate to detailed view
        Frame.topmost().navigate({
            moduleName: "pages/admin/tournaments/tournament-stats",
            animated: true
        });
    }

    showUsers() {
        // Show users detail modal or navigate to detailed view
        Frame.topmost().navigate({
            moduleName: "pages/admin/users/user-stats",
            animated: true
        });
    }

    showRevenue() {
        // Show revenue detail modal or navigate to detailed view
        Frame.topmost().navigate({
            moduleName: "pages/admin/reports/revenue-stats",
            animated: true
        });
    }

    async logout() {
        try {
            await authService.logout();
            Frame.topmost().navigate({
                moduleName: "pages/auth/login/login-page",
                clearHistory: true,
                animated: true
            });
        } catch (error) {
            toast.error('Logout failed');
            console.error('Logout error:', error);
        }
    }
}
