import { Application } from '@nativescript/core';
import { Toasty, ToastDuration } from 'nativescript-toasty';

export class ToastService {
    private static instance: ToastService;

    private constructor() {}

    public static getInstance(): ToastService {
        if (!ToastService.instance) {
            ToastService.instance = new ToastService();
        }
        return ToastService.instance;
    }

    private convertDurationToToastDuration(duration: string): ToastDuration {
        switch (duration.toLowerCase()) {
            case 'short':
                return ToastDuration.SHORT;
            case 'long':
                return ToastDuration.LONG;
            default:
                return ToastDuration.SHORT;
        }
    }

    public success(message: string, duration: string = 'short'): void {
        const toastDuration = this.convertDurationToToastDuration(duration);
        const toast = new Toasty({ 
            text: message, 
            duration: toastDuration
        });
        toast.show();
    }

    public error(message: string, duration: string = 'long'): void {
        const toastDuration = this.convertDurationToToastDuration(duration);
        const toast = new Toasty({ 
            text: message, 
            duration: toastDuration,
            backgroundColor: 'red'
        });
        toast.show();
    }

    public info(message: string, duration: string = 'short'): void {
        const toastDuration = this.convertDurationToToastDuration(duration);
        const toast = new Toasty({ 
            text: message, 
            duration: toastDuration
        });
        toast.show();
    }

    public warning(message: string, duration: string = 'long'): void {
        const toastDuration = this.convertDurationToToastDuration(duration);
        const toast = new Toasty({ 
            text: message, 
            duration: toastDuration,
            backgroundColor: 'yellow'
        });
        toast.show();
    }
}

export const toast = ToastService.getInstance();
