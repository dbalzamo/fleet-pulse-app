import { Component, input } from '@angular/core';
import { FeaturePlaceholderComponent } from '../placeholder/feature-placeholder';

@Component({
    selector: 'app-customer-details-page',
    imports: [FeaturePlaceholderComponent],
    template: `<app-feature-placeholder title="Customer card" [description]="description" />`,
})
export class CustomerDetailsPage {
    readonly id = input.required<string>();

    get description(): string {
        return `Anagrafica di ${this.id()}: storico corse, metodi di pagamento salvati e dispute saranno disponibili a breve.`;
    }
}