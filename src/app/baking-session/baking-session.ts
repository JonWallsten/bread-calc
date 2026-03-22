import {
    Component,
    inject,
    signal,
    computed,
    OnInit,
    ChangeDetectionStrategy,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { I18nService } from '../i18n.service';
import { AuthService } from '../auth.service';
import {
    BakingSessionService,
    BakingSessionSummary,
    BakingSessionDetail,
} from '../baking-session.service';
import { ConfirmDialogComponent } from '../confirm-dialog/confirm-dialog';
import { ResultsComponent } from '../results/results';
import { LightboxComponent, LightboxPhoto } from '../lightbox/lightbox';
import { ExpansionComponent } from '../expansion/expansion';

@Component({
    selector: 'app-baking-session',
    templateUrl: './baking-session.html',
    styleUrl: './baking-session.scss',
    imports: [
        ConfirmDialogComponent,
        FormsModule,
        ResultsComponent,
        LightboxComponent,
        ExpansionComponent,
    ],
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BakingSessionComponent implements OnInit {
    readonly i18n = inject(I18nService);
    readonly auth = inject(AuthService);
    readonly sessionService = inject(BakingSessionService);

    readonly selectedSession = signal<BakingSessionDetail | null>(null);
    readonly uploadingPhoto = signal(false);
    readonly deleteConfirmId = signal<number | null>(null);

    // Edit mode state
    readonly editing = signal(false);
    readonly editRating = signal(0);
    readonly editNotes = signal('');
    readonly editTitle = signal('');

    // Share state
    readonly linkCopied = signal(false);
    readonly showRecipe = signal(false);
    private copyTimeout: ReturnType<typeof setTimeout> | null = null;
    // Lightbox state
    readonly lightboxOpen = signal(false);
    readonly lightboxIndex = signal(0);

    // Computed lightbox photos from selected session
    readonly lightboxPhotos = computed<LightboxPhoto[]>(() => {
        const session = this.selectedSession();
        if (!session) return [];
        return session.photos.map((p) => ({
            url: this.photoUrl(p.filename),
            alt: p.original_name,
        }));
    });

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
        this.editing.set(false);
    }

    closeDetail(): void {
        this.selectedSession.set(null);
        this.editing.set(false);
        this.showRecipe.set(false);
        this.closeLightbox();
    }

    startEditing(): void {
        const s = this.selectedSession();
        if (!s) return;
        this.editRating.set(s.rating ?? 0);
        this.editNotes.set(s.notes ?? '');
        this.editTitle.set(s.title ?? '');
        this.editing.set(true);
    }

    cancelEditing(): void {
        this.editing.set(false);
    }

    async saveEditing(): Promise<void> {
        const s = this.selectedSession();
        if (!s) return;
        const ok = await this.sessionService.updateSession(s.id, {
            title: this.editTitle(),
            rating: this.editRating(),
            notes: this.editNotes(),
        });
        if (ok) {
            const refreshed = await this.sessionService.getSession(s.id);
            this.selectedSession.set(refreshed);
            this.sessionService.loadSessions(this.currentPage());
        }
        this.editing.set(false);
    }

    requestDeleteSession(id: number, event: Event): void {
        event.stopPropagation();
        this.deleteConfirmId.set(id);
    }

    async toggleShare(sessionId: number): Promise<void> {
        const result = await this.sessionService.toggleShare(sessionId);
        if (result) {
            const refreshed = await this.sessionService.getSession(sessionId);
            this.selectedSession.set(refreshed);
        }
    }

    shareUrl(hash: string): string {
        return this.sessionService.shareUrl(hash);
    }

    copyShareLink(hash: string): void {
        navigator.clipboard.writeText(this.sessionService.shareUrl(hash));
        this.linkCopied.set(true);
        if (this.copyTimeout) clearTimeout(this.copyTimeout);
        this.copyTimeout = setTimeout(() => this.linkCopied.set(false), 2000);
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
