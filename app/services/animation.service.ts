import { View } from '@nativescript/core';

export class AnimationService {
    public static fadeIn(view: View, duration: number = 200): Promise<void> {
        view.opacity = 0;
        return view.animate({
            opacity: 1,
            duration
        });
    }

    public static fadeOut(view: View, duration: number = 200): Promise<void> {
        return view.animate({
            opacity: 0,
            duration
        });
    }

    public static slideIn(view: View, duration: number = 300): Promise<void> {
        view.translateX = 500;
        return view.animate({
            translate: { x: 0, y: 0 },
            duration,
            curve: 'easeOut'
        });
    }

    public static slideOut(view: View, duration: number = 300): Promise<void> {
        return view.animate({
            translate: { x: -500, y: 0 },
            duration,
            curve: 'easeIn'
        });
    }

    public static bounce(view: View, scale: number = 1.2, duration: number = 100): Promise<void> {
        return view.animate({
            scale: { x: scale, y: scale },
            duration: duration / 2
        }).then(() => {
            return view.animate({
                scale: { x: 1, y: 1 },
                duration: duration / 2
            });
        });
    }

    public static shake(view: View, distance: number = 10, duration: number = 500): Promise<void> {
        return view.animate({
            translate: { x: distance, y: 0 },
            duration: duration / 4,
            curve: 'easeInOut'
        }).then(() => {
            return view.animate({
                translate: { x: -distance, y: 0 },
                duration: duration / 4,
                curve: 'easeInOut'
            });
        }).then(() => {
            return view.animate({
                translate: { x: distance / 2, y: 0 },
                duration: duration / 4,
                curve: 'easeInOut'
            });
        }).then(() => {
            return view.animate({
                translate: { x: 0, y: 0 },
                duration: duration / 4,
                curve: 'easeInOut'
            });
        });
    }
}
