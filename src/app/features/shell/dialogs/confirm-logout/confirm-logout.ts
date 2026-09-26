import { Component, inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatDialogModule, MatDialogRef } from '@angular/material/dialog';

@Component({
    selector: 'app-confirm-logout',
    imports: [MatButtonModule, MatDialogModule],
    templateUrl: './confirm-logout.html',
    styleUrl: './confirm-logout.scss',
})
export class ConfirmLogoutComponent {
    private readonly dialogRef = inject(MatDialogRef<ConfirmLogoutComponent>);

    confirm(): void {
        this.dialogRef.close(true);
    }

    cancel(): void {
        this.dialogRef.close(false);
    }
}