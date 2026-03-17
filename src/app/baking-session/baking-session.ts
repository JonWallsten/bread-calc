import {
    Component,
    inject,
    signal,
    OnInit,
    ElementRef,
    viewChild,
    ChangeDetectionStrategy,
} from '@angular/core';
import { I18nService } from '../i18n.service';
import { AuthService } from '../auth.service';
import {
    BakingSessionService,
    BakingSessionSummary,
    BakingSessionDetail,
} from '../baking-session.service';
import { ConfirmDialogComponent } from '../confirm-dialog/confirm-dialog';

@Component({
    selector: 'app-baking-session',
    templateUrl: './baking-session.html',
    styleUrl: './baking-session.scss',
    imports: [ConfirmDialogComponent],
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BakingSessionComponent implements OnInit {
    readonly i18n = inject(I18nService);
    readonly auth = inject(AuthService);
    readonly sessionService = inject(BakingSessionService);

    readonly selectedSession = signal<BakingSessionDetail | null>(null);
    readonly uploadingPhoto = signal(false);
    readonly deleteConfirmId = signal<number | null>(null);

    // Lightbox state
    readonly lightboxOpen = signal(false);
    readonly lightboxIndex = signal(0);

    // Swipe tracking for lightbox
    private touchStartX = 0;
    private touchStartY = 0;

    readonly fileInputRef = viewChild<ElementRef<HTMLInputElement>>('fileInput');

    readonly sessions = this.sessionService.sessions;
    readonly loading = this.sessionService.loading;
    readonly totalPages = this.sessionService.totalPages;
    readonly currentPage = this.sessionService.currentPage;

    readonly stars = [1, 2, 3, 4, 5];

    ngOnInit(): void {
        if (this.auth.isLoggedIn()) {
            this.sessionService.loadSessions();
        }
    }

    async viewSession(id: number): Promise<void> {
        const detail = await this.sessionService.getSession(id);
        this.selectedSession.set(detail);
    }

    closeDetail(): void {
        this.selectedSession.set(null);
        this.closeLightbox();
    }

    requestDeleteSession(id: number, event: Event): void {
        event.stopPropagation();
        this.deleteConfirmId.set(id);
    }

    async onDeleteConfirmed(): Promise<void> {
        const id = this.deleteConfirmId();
        if (id == null) return;
        this.deleteConfirmId.set(null);

        // Also close detail if it was open for this session
        const detail = this.selectedSession();
        if (detail && detail.id === id) {
            this.selectedSession.set(null);
        }

        await this.sessionService.deleteSession(id);
    }

    onDeleteCancelled(): void {
        this.deleteConfirmId.set(null);
    }

    async onPhotoSelected(event: Event): Promise<void> {
        const input = event.target as HTMLInputElement;
        const file = input.files?.[0];
        const session = this.selectedSession();
        if (!file || !session) return;

        this.uploadingPhoto.set(true);
        const ok = await this.sessionService.uploadPhoto(session.id, file);
        this.uploadingPhoto.set(false);

        if (ok) {
            const refreshed = await this.sessionService.getSession(session.id);
            this.selectedSession.set(refreshed);
        }
        input.value = '';
    }

    async removePhoto(photoId: number): Promise<void> {
        const session = this.selectedSession();
        if (!session) return;
        const ok = await this.sessionService.deletePhoto(session.id, photoId);
        if (ok) {
            const refreshed = await this.sessionService.getSession(session.id);
            this.selectedSession.set(refreshed);

            // Close lightbox if no photos remain
            if (refreshed && refreshed.photos.length === 0) {
                this.closeLightbox();
            } else if (refreshed && this.lightboxIndex() >= refreshed.photos.length) {
                this.lightboxIndex.set(refreshed.photos.length - 1);
            }
        }
    }

    // ── Lightbox ──────────────────────────────────────────
    openLightbox(index: number): void {
        this.lightboxIndex.set(index);
        this.lightboxOpen.set(true);
    }

    closeLightbox(): void {
        this.lightboxOpen.set(false);
    }

    lightboxPrev(): void {
        const photos = this.selectedSession()?.photos;
        if (!photos) return;
        this.lightboxIndex.update((i) => (i > 0 ? i - 1 : photos.length - 1));
    }

    lightboxNext(): void {
        const photos = this.selectedSession()?.photos;
        if (!photos) return;
        this.lightboxIndex.update((i) => (i < photos.length - 1 ? i + 1 : 0));
    }

    onLightboxTouchStart(event: TouchEvent): void {
        this.touchStartX = event.touches[0].clientX;
        this.touchStartY = event.touches[0].clientY;
    }

    onLightboxTouchEnd(event: TouchEvent): void {
        const dx = event.changedTouches[0].clientX - this.touchStartX;
        const dy = event.changedTouches[0].clientY - this.touchStartY;

        // Only handle horizontal swipe if it's more horizontal than vertical
        if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy)) {
            if (dx < 0) {
                this.lightboxNext();
            } else {
                this.lightboxPrev();
            }
        }
    }

    onLightboxKeydown(event: KeyboardEvent): void {
        if (event.key === 'ArrowLeft') {
            this.lightboxPrev();
        } else if (event.key === 'ArrowRight') {
            this.lightboxNext();
        } else if (event.key === 'Escape') {
            this.closeLightbox();
        }
    }

    photoUrl(filename: string): string {
        return this.sessionService.photoUrl(filename);
    }

    loadPage(page: number): void {
        this.sessionService.loadSessions(page);
    }

    formatDate(dateStr: string): string {
        try {
            return new Date(dateStr).toLocaleDateString();
        } catch {
            return dateStr;
        }
    }

    truncateNotes(notes: string | null): string {
        if (!notes) return '';
        return notes.length > 60 ? notes.substring(0, 60) + '…' : notes;
    }
}
