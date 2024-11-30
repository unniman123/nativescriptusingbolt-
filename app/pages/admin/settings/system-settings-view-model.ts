import { Frame, Observable } from '@nativescript/core';
import { adminService } from '../../../services/admin.service';
import { toast } from '../../../services/toast.service';

export class SystemSettingsViewModel extends Observable {
    private _settings: any;
    private _originalSettings: any;

    constructor() {
        super();
        this.loadSettings();
    }

    get settings(): any {
        return this._settings;
    }

    set settings(value: any) {
        this._settings = value;
        this.notifyPropertyChange('settings', value);
    }

    async loadSettings() {
        try {
            const settings = await adminService.getSystemSettings();
            this._originalSettings = { ...settings };
            this.settings = settings;
        } catch (error) {
            toast.error('Failed to load settings');
            console.error('Error loading settings:', error);
        }
    }

    async saveSettings() {
        try {
            // Validate settings before saving
            if (!this.validateSettings()) {
                return;
            }

            // Only update changed settings
            const changedSettings = this.getChangedSettings();
            if (Object.keys(changedSettings).length === 0) {
                toast.info('No changes to save');
                return;
            }

            await adminService.updateSystemSettings(changedSettings);
            this._originalSettings = { ...this._settings };
            toast.success('Settings saved successfully');
        } catch (error) {
            toast.error('Failed to save settings');
            console.error('Error saving settings:', error);
        }
    }

    private validateSettings(): boolean {
        // Validate minimum and maximum entry fees
        if (this._settings.minimumEntryFee < 0) {
            toast.error('Minimum entry fee cannot be negative');
            return false;
        }

        if (this._settings.maximumEntryFee < this._settings.minimumEntryFee) {
            toast.error('Maximum entry fee cannot be less than minimum entry fee');
            return false;
        }

        // Validate session timeout
        if (this._settings.sessionTimeout < 1) {
            toast.error('Session timeout must be at least 1 minute');
            return false;
        }

        return true;
    }

    private getChangedSettings(): any {
        const changedSettings: any = {};

        for (const key in this._settings) {
            if (this._settings[key] !== this._originalSettings[key]) {
                changedSettings[key] = this._settings[key];
            }
        }

        return changedSettings;
    }

    async onMaintenanceModeChange(args: any) {
        if (args.value) {
            // Show confirmation dialog before enabling maintenance mode
            const modalView = await Frame.topmost().showModal({
                view: 'pages/dialogs/confirm-dialog',
                context: {
                    title: 'Enable Maintenance Mode',
                    message: 'Enabling maintenance mode will prevent users from accessing the app. Are you sure?',
                    okButtonText: 'Enable',
                    cancelButtonText: 'Cancel'
                },
                fullscreen: false,
                closeCallback: (result: boolean) => {
                    if (!result) {
                        // Revert the switch if user cancels
                        this._settings.maintenanceMode = false;
                        this.notifyPropertyChange('settings', this._settings);
                    }
                }
            } as any);
        }
    }

    onRequireTwoFactorChange(args: any) {
        if (args.value) {
            // Show information dialog about 2FA requirement
            Frame.topmost().showModal({
                moduleName: "shared/info-dialog",
                context: {
                    title: '2FA Requirement',
                    message: 'All admin accounts will be required to set up 2FA on their next login.',
                    okButtonText: 'OK'
                },
                fullscreen: false
            });
        }
    }
}
