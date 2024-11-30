import { Observable } from '@nativescript/core';
import { Frame } from '@nativescript/core';
import { adminService } from '../../../services/admin.service';
import { toast } from '../../../services/toast.service';

interface BanUserModalResult {
    banned: boolean;
    reason: string;
    duration: number;
}

export interface UserActionModalResult {
    action: 'view' | 'edit' | 'ban' | 'delete';
}

export class UserManagementViewModel extends Observable {
    private _users: any[] = [];
    private _isLoading: boolean = false;
    private _searchQuery: string = '';
    currentFilters: any;

    constructor() {
        super();
        this.loadUsers();
    }

    get users(): any[] {
        return this._users;
    }

    get isLoading(): boolean {
        return this._isLoading;
    }

    get searchQuery(): string {
        return this._searchQuery;
    }

    set searchQuery(value: string) {
        if (this._searchQuery !== value) {
            this._searchQuery = value;
            this.notifyPropertyChange('searchQuery', value);
        }
    }

    async loadUsers() {
        try {
            this._isLoading = true;
            this.notifyPropertyChange('isLoading', true);

            const { data: users } = await adminService.getUsers({
                search: this._searchQuery
            });

            this._users = users;
            this.notifyPropertyChange('users', users);
        } catch (error) {
            toast.error('Failed to load users');
            console.error('Error loading users:', error);
        } finally {
            this._isLoading = false;
            this.notifyPropertyChange('isLoading', false);
        }
    }

    async onSearch() {
        await this.loadUsers();
    }

    onClear() {
        this.searchQuery = '';
        this.loadUsers();
    }

    showFilters() {
        // Show filter modal
        Frame.topmost().showModal({
            moduleName: "pages/admin/users/user-filters",
            context: {
                filters: this.currentFilters,
                onApply: (filters) => {
                    this.applyFilters(filters);
                }
            },
            fullscreen: false
        });
    }

    async applyFilters(filters: any) {
        try {
            this._isLoading = true;
            this.notifyPropertyChange('isLoading', true);

            const { data: users } = await adminService.getUsers({
                ...filters,
                search: this._searchQuery
            });

            this._users = users;
            this.notifyPropertyChange('users', users);
        } catch (error) {
            toast.error('Failed to apply filters');
            console.error('Error applying filters:', error);
        } finally {
            this._isLoading = false;
            this.notifyPropertyChange('isLoading', false);
        }
    }

    async onUserAction(args: any) {
        const user = args.object.bindingContext;
        
        const modalResult = await Frame.topmost().showModal({
            moduleName: "pages/admin/users/user-actions",
            context: { user },
            fullscreen: false
        });

        // Type guard to ensure we have a valid result
        if (modalResult && typeof modalResult === 'object' && 'action' in modalResult) {
            const result = modalResult as UserActionModalResult;
            switch (result.action) {
                case 'view':
                    this.viewUserDetails(user);
                    break;
                case 'edit':
                    this.editUser(user);
                    break;
                case 'ban':
                    this.banUser(user);
                    break;
                case 'delete':
                    this.deleteUser(user);
                    break;
            }
        }
    }

    private viewUserDetails(user: any) {
        Frame.topmost().navigate({
            moduleName: "pages/admin/users/user-details",
            context: { user },
            animated: true
        });
    }

    private async editUser(user: any) {
        const result = await Frame.topmost().showModal({
            moduleName: "pages/admin/users/edit-user",
            context: { user },
            fullscreen: true
        });

        if (result && typeof result === 'object' && 'action' in result) {
            const typedResult = result as UserActionModalResult;
            if (typedResult.action === 'edit') {
                await this.loadUsers();
            }
        }
    }

    private async banUser(user: any) {
        const result = await Frame.topmost().showModal({
            moduleName: "pages/admin/users/ban-user",
            context: { user },
            fullscreen: false
        }) as unknown as BanUserModalResult;

        if (result && result.banned) {
            try {
                await adminService.banUser(user.id, result.reason, result.duration);
                toast.success('User banned successfully');
                await this.loadUsers();
            } catch (error) {
                toast.error('Failed to ban user');
                console.error('Error banning user:', error);
            }
        }
    }

    private async deleteUser(user: any) {
        const confirm = await Frame.topmost().showModal({
            moduleName: "shared/confirm-dialog",
            context: {
                title: 'Delete User',
                message: `Are you sure you want to delete ${user.username}? This action cannot be undone.`,
                okButtonText: 'Delete',
                cancelButtonText: 'Cancel'
            },
            fullscreen: false
        });

        if (confirm) {
            try {
                await adminService.deleteUser(user.id);
                toast.success('User deleted successfully');
                await this.loadUsers();
            } catch (error) {
                toast.error('Failed to delete user');
                console.error('Error deleting user:', error);
            }
        }
    }
}
