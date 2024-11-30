import { EventData } from '@nativescript/core';
import { ShownModallyData } from '@nativescript/core';
import { UserActionModalResult } from './user-management-view-model';
import { Page } from '@nativescript/core';
import { View } from '@nativescript/core';
import { adminService } from '../../../services/admin.service';
import * as Toast from 'nativescript-toast';

export function onShownModally(args: ShownModallyData) {
    const context = args.context;
    const closeCallback = args.closeCallback;

    // Set up the view model for the modal
    const page = args.object as Page;
    page.bindingContext = {
        closeModal: (action: 'view' | 'edit' | 'ban' | 'delete') => {
            const result: UserActionModalResult = { action };
            if (typeof closeCallback === 'function') {
                closeCallback(result);
            }
        }
    };
}

export function onViewTap(args: EventData) {
    const page = (args.object as any).page as Page;
    const vm = page.bindingContext;
    if (vm && typeof vm.closeModal === 'function') {
        vm.closeModal('view');
    }
}

export function onEditTap(args: EventData) {
    const page = (args.object as any).page as Page;
    const vm = page.bindingContext;
    if (vm && typeof vm.closeModal === 'function') {
        vm.closeModal('edit');
    }
}

export async function onBanTap(args: EventData) {
    const page = (<View>args.object).page;
    const context = page.bindingContext;

    if (!context) {
        console.error('No binding context found');
        return;
    }

    const userId = context.userId;

    if (!userId) {
        console.error('No user ID provided');
        return;
    }

    try {
        await adminService.banUser(userId, 'Admin action', undefined);
        Toast.makeText('User banned successfully').show();
        // Add close modal logic here if needed
        if (typeof context.closeModal === 'function') {
            context.closeModal('ban');
        }
    } catch (error) {
        console.error('Failed to ban user:', error);
        Toast.makeText('Failed to ban user').show();
    }
}

export async function onDeleteTap(args: EventData) {
    const page = (<View>args.object).page;
    const context = page.bindingContext;

    if (!context) {
        console.error('No binding context found');
        return;
    }

    const userId = context.userId;

    if (!userId) {
        console.error('No user ID provided');
        return;
    }

    try {
        await adminService.deleteUser(userId);
        Toast.makeText('User deleted successfully').show();
        // Add close modal logic here if needed
        if (typeof context.closeModal === 'function') {
            context.closeModal('delete');
        }
    } catch (error) {
        console.error('Failed to delete user:', error);
        Toast.makeText('Failed to delete user').show();
    }
}
