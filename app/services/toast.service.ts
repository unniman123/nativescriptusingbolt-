import { Application } from '@nativescript/core';
import { Toasty } from 'nativescript-toasty';

export class ToastService {
    private static instance: ToastService;

    private constructor() {}

    public static getInstance(): ToastService {
        if (!ToastService.instance) {
            ToastService.instance = new ToastService();
        }
        return ToastService.instance;
    }

    public success(message: string, duration: number = 2000): void {
        const toast = new Toasty({ 
            text: message, 
            duration: duration 
        });
        toast.show();
    }

    public error(message: string, duration: number = 3000): void {
        const toast = new Toasty({ 
            text: message, 
            duration: duration,
            backgroundColor: 'red'
        });
        toast.show();
    }

    public info(message: string, duration: number = 2000): void {
        const toast = new Toasty({ 
            text: message, 
            duration: duration
        });
        toast.show();
    }

    public warning(message: string, duration: number = 2500): void {
        const toast = new Toasty({ 
            text: message, 
            duration: duration,
            backgroundColor: 'yellow'
        });
        toast.show();
    }
}

export const toast = ToastService.getInstance();
