import { ChangeDetectionStrategy, Component, input, model } from '@angular/core';

@Component({
    selector: 'app-expansion',
    templateUrl: './expansion.html',
    styleUrl: './expansion.scss',
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ExpansionComponent {
    readonly label = input.required<string>();
    readonly open = model(false);

    toggle(): void {
        this.open.update((v) => !v);
    }
}
