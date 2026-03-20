import { Component, inject, signal, OnInit, ChangeDetectionStrategy } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { I18nService } from '../i18n.service';
import { BakingSessionService, SharedBake } from '../baking-session.service';

@Component({
    selector: 'app-shared-bake',
    templateUrl: './shared-bake.html',
    styleUrl: './shared-bake.scss',
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SharedBakeComponent implements OnInit {
    readonly i18n = inject(I18nService);
    private readonly route = inject(ActivatedRoute);
    private readonly sessionService = inject(BakingSessionService);

    readonly bake = signal<SharedBake | null>(null);
    readonly notFound = signal(false);
    readonly stars = [1, 2, 3, 4, 5];

    // Lightbox
    readonly lightboxOpen = signal(false);
    readonly lightboxIndex = signal(0);
    private touchStartX = 0;
    private touchStartY = 0;

    ngOnInit(): void {
        const hash = this.route.snapshot.paramMap.get('hash');
        if (hash) {
            this.loadBake(hash);
        } else {
            this.notFound.set(true);
        }
    }

    private async loadBake(hash: string): Promise<void> {
        const result = await this.sessionService.getSharedSession(hash);
        if (result) {
            this.bake.set(result);
        } else {
            this.notFound.set(true);
        }
    }

    photoUrl(filename: string): string {
        return this.sessionService.photoUrl(filename);
    }

    formatDate(dateStr: string): string {
        try {
            return new Date(dateStr).toLocaleDateString();
        } catch {
            return dateStr;
        }
    }

    openLightbox(index: number): void {
        this.lightboxIndex.set(index);
        this.lightboxOpen.set(true);
    }

    closeLightbox(): void {
        this.lightboxOpen.set(false);
    }

    lightboxPrev(): void {
        const photos = this.bake()?.photos;
        if (!photos) return;
        this.lightboxIndex.update((i) => (i > 0 ? i - 1 : photos.length - 1));
    }

    lightboxNext(): void {
        const photos = this.bake()?.photos;
        if (!photos) return;
        this.lightboxIndex.update((i) => (i < photos.length - 1 ? i + 1 : 0));
    }

    onLightboxKeydown(event: KeyboardEvent): void {
        if (event.key === 'ArrowLeft') this.lightboxPrev();
        else if (event.key === 'ArrowRight') this.lightboxNext();
        else if (event.key === 'Escape') this.closeLightbox();
    }

    onLightboxTouchStart(event: TouchEvent): void {
        this.touchStartX = event.touches[0].clientX;
        this.touchStartY = event.touches[0].clientY;
    }

    onLightboxTouchEnd(event: TouchEvent): void {
        const dx = event.changedTouches[0].clientX - this.touchStartX;
        const dy = event.changedTouches[0].clientY - this.touchStartY;
        if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy)) {
            dx < 0 ? this.lightboxNext() : this.lightboxPrev();
        }
    }
}
