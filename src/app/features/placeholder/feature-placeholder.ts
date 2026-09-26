import { Component, input } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';

@Component({
    selector: 'app-feature-placeholder',
    imports: [MatIconModule],
    templateUrl: './feature-placeholder.html',
    styleUrl: './feature-placeholder.scss',
})
export class FeaturePlaceholderComponent {
    readonly title = input.required<string>();
    readonly description = input('Questa sezione sarà disponibile a breve.');
}