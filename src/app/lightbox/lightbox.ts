import {
    ChangeDetectionStrategy,
    Component,
    ElementRef,
    HostListener,
    input,
    model,
    output,
    viewChild,
} from '@angular/core';

export interface LightboxPhoto {
    url: string;
    alt: string;
}

@Component({
    selector: 'app-lightbox',
    templateUrl: './lightbox.html',
    styleUrl: './lightbox.scss',
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LightboxComponent {
    readonly photos = input.required<LightboxPhoto[]>();
    readonly index = model(0);
    readonly closed = output<void>();

    private readonly lightboxEl = viewChild<ElementRef<HTMLDivElement>>('lightboxEl');
    private touchStartX = 0;
    private touchStartY = 0;

    focus(): void {
        setTimeout(() => this.lightboxEl()?.nativeElement.focus());
    }

    close(): void {
        this.closed.emit();
    }

    prev(): void {
        const len = this.photos().length;
        this.index.update((i) => (i > 0 ? i - 1 : len - 1));
    }

    next(): void {
        const len = this.photos().length;
        this.index.update((i) => (i < len - 1 ? i + 1 : 0));
    }

    @HostListener('document:keydown', ['$event'])
    onKeydown(event: KeyboardEvent): void {
        if (event.key === 'ArrowLeft') this.prev();
        else if (event.key === 'ArrowRight') this.next();
        else if (event.key === 'Escape') this.close();
    }

    onTouchStart(event: TouchEvent): void {
        this.touchStartX = event.touches[0].clientX;
        this.touchStartY = event.touches[0].clientY;
    }

    onTouchEnd(event: TouchEvent): void {
        const dx = event.changedTouches[0].clientX - this.touchStartX;
        const dy = event.changedTouches[0].clientY - this.touchStartY;
        if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy)) {
            dx < 0 ? this.next() : this.prev();
        }
    }
}
