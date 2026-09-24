import { Component, inject, input } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { Router } from '@angular/router';

@Component({
    selector: 'app-fleet-details',
    imports: [MatButtonModule],
    templateUrl: './fleet-details.html',
    styleUrl: './fleet-details.scss',
})
export class FleetDetails {
    private readonly router = inject(Router);
    readonly vehicleId = input.required<string>();

    goBack(): void {
        this.router.navigate(['fleet']);
    }
}