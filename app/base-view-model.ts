import { Observable } from '@nativescript/core';

export class BaseViewModel extends Observable {
    constructor() {
        super();
    }

    // Add any common methods or properties that all view models might share
    protected notifyPropertyChange(propertyName: string, value: any) {
        super.notify({
            object: this,
            eventName: Observable.propertyChangeEvent,
            propertyName: propertyName,
            value: value
        });
    }
}
