import { Component, inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';

export interface DeleteConfirmData {
    title: string;
    message: string;
}

@Component({
    selector: 'app-delete-confirm',
    imports: [MatButtonModule, MatDialogModule],
    templateUrl: './delete-confirm.html',
    styleUrl: './delete-confirm.scss',
})
export class DeleteConfirmComponent {
    private readonly dialogRef = inject(MatDialogRef<DeleteConfirmComponent>);
    readonly data = inject<DeleteConfirmData>(MAT_DIALOG_DATA);

    confirm(): void {
        this.dialogRef.close(true);
    }

    cancel(): void {
        this.dialogRef.close(false);
    }
}