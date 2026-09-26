import { Component } from '@angular/core';
import { FeaturePlaceholderComponent } from '../placeholder/feature-placeholder';

@Component({
    selector: 'app-customers-page',
    imports: [FeaturePlaceholderComponent],
    template: `<app-feature-placeholder title="Customers" description="Qui potrai gestire i clienti associati alla tua flotta." />`,
})
export class CustomersPage {}