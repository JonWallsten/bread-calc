import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';

@Component({
    selector: 'app-confirm-dialog',
    templateUrl: './confirm-dialog.html',
    styleUrl: './confirm-dialog.scss',
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ConfirmDialogComponent {
    readonly title = input('');
    readonly message = input('');
    readonly confirmLabel = input('OK');
    readonly cancelLabel = input('Cancel');
    readonly confirmed = output<void>();
    readonly cancelled = output<void>();

    onBackdropClick(event: MouseEvent): void {
        if ((event.target as HTMLElement).classList.contains('dialog-overlay')) {
            this.cancelled.emit();
        }
    }
}
