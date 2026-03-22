import { ChangeDetectionStrategy, Component, model } from '@angular/core';

@Component({
    selector: 'app-select',
    template: `
        <div class="select-wrap">
            <select [value]="value()" (change)="onChange($event)">
                <ng-content />
            </select>
            <span class="select-chevron" aria-hidden="true">&#9662;</span>
        </div>
    `,
    styleUrl: './select.scss',
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SelectComponent {
    readonly value = model<string>('');

    onChange(event: Event): void {
        this.value.set((event.target as HTMLSelectElement).value);
    }
}
