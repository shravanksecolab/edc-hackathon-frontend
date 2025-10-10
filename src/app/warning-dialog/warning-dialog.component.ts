import { Component, Inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';

export interface WarningDialogData {
    title: string;
    message: string;
    riskScore: number;
}

@Component({
    selector: 'app-warning-dialog',
    template: `
    <h2 mat-dialog-title>
      <mat-icon color="warn" style="vertical-align: middle; margin-right: 8px;">warning</mat-icon>
      {{ data.title }}
    </h2>
    <mat-dialog-content>
      <p>{{ data.message }}</p>
      <div class="risk-score-display">
        <strong>Risk Score: <span class="high-risk">{{ data.riskScore }}</span></strong>
      </div>
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button color="primary" (click)="onClose()">OK</button>
      <button mat-raised-button color="warn" (click)="onTakeAction()">Take Action</button>
    </mat-dialog-actions>
  `,
    styles: [`
    .risk-score-display {
      margin-top: 16px;
      padding: 12px;
      background-color: #fff3e0;
      border-left: 4px solid #ff9800;
      border-radius: 4px;
    }
    .high-risk {
      color: #d32f2f;
      font-weight: bold;
    }
    mat-dialog-content {
      min-width: 300px;
    }
  `]
})
export class WarningDialogComponent {
    constructor(
        public dialogRef: MatDialogRef<WarningDialogComponent>,
        @Inject(MAT_DIALOG_DATA) public data: WarningDialogData
    ) { }

    onClose(): void {
        this.dialogRef.close();
    }

    onTakeAction(): void {
        this.dialogRef.close('take-action');
    }
}