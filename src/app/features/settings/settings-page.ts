import { Component } from '@angular/core';
import { FeaturePlaceholderComponent } from '../placeholder/feature-placeholder';

@Component({
    selector: 'app-settings-page',
    imports: [FeaturePlaceholderComponent],
    template: `<app-feature-placeholder title="Settings" description="Qui potrai configurare le impostazioni del tuo account e dell'applicazione." />`,
})
export class SettingsPage {}