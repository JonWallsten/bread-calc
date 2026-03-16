import {
  Component,
  inject,
  signal,
  input,
  output,
  OnInit,
  ElementRef,
  viewChild,
  ChangeDetectionStrategy,
} from "@angular/core";
import { I18nService } from "../i18n.service";
import { AuthService } from "../auth.service";
import {
  BakingSessionService,
  BakingSessionSummary,
  BakingSessionDetail,
} from "../baking-session.service";
import { CalcInputs, CalcResult } from "../calc.service";
import { ConfirmDialogComponent } from "../confirm-dialog/confirm-dialog";

@Component({
  selector: "app-baking-session",
  templateUrl: "./baking-session.html",
  styleUrl: "./baking-session.scss",
  imports: [ConfirmDialogComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BakingSessionComponent implements OnInit {
  readonly i18n = inject(I18nService);
  readonly auth = inject(AuthService);
  readonly sessionService = inject(BakingSessionService);

  readonly currentInputs = input<CalcInputs | null>(null);
  readonly currentResults = input<CalcResult | null>(null);
  readonly activeRecipeCloudId = input<number | null>(null);

  readonly sessionSaved = output<void>();

  readonly showSaveForm = signal(false);
  readonly saveNotes = signal("");
  readonly saveRating = signal<number>(0);
  readonly saving = signal(false);
  readonly selectedSession = signal<BakingSessionDetail | null>(null);
  readonly uploadingPhoto = signal(false);
  readonly pendingPhotos = signal<File[]>([]);
  readonly pendingPreviews = signal<string[]>([]);
  readonly deleteConfirmId = signal<number | null>(null);

  // Lightbox state
  readonly lightboxOpen = signal(false);
  readonly lightboxIndex = signal(0);

  // Swipe tracking for lightbox
  private touchStartX = 0;
  private touchStartY = 0;

  readonly fileInputRef = viewChild<ElementRef<HTMLInputElement>>("fileInput");
  readonly saveFileInputRef =
    viewChild<ElementRef<HTMLInputElement>>("saveFileInput");

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

  openSaveForm(): void {
    this.saveNotes.set("");
    this.saveRating.set(0);
    this.pendingPhotos.set([]);
    this.pendingPreviews.set([]);
    this.showSaveForm.set(true);
  }

  closeSaveForm(): void {
    this.showSaveForm.set(false);
    this.clearPendingPreviews();
  }

  onSavePhotoSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const files = input.files;
    if (!files) return;

    const current = this.pendingPhotos();
    const currentPreviews = this.pendingPreviews();
    const remaining = 3 - current.length;
    const newFiles = Array.from(files).slice(0, remaining);

    this.pendingPhotos.set([...current, ...newFiles]);

    for (const file of newFiles) {
      const url = URL.createObjectURL(file);
      currentPreviews.push(url);
    }
    this.pendingPreviews.set([...currentPreviews]);

    input.value = "";
  }

  removePendingPhoto(index: number): void {
    const photos = [...this.pendingPhotos()];
    const previews = [...this.pendingPreviews()];
    URL.revokeObjectURL(previews[index]);
    photos.splice(index, 1);
    previews.splice(index, 1);
    this.pendingPhotos.set(photos);
    this.pendingPreviews.set(previews);
  }

  private clearPendingPreviews(): void {
    for (const url of this.pendingPreviews()) {
      URL.revokeObjectURL(url);
    }
    this.pendingPhotos.set([]);
    this.pendingPreviews.set([]);
  }

  async confirmSave(): Promise<void> {
    const inputs = this.currentInputs();
    const results = this.currentResults();
    if (!inputs || !results) return;

    this.saving.set(true);
    const session = await this.sessionService.createSession(inputs, results, {
      recipeId: this.activeRecipeCloudId() ?? undefined,
      notes: this.saveNotes() || undefined,
      rating: this.saveRating() || undefined,
    });

    if (session) {
      // Upload pending photos
      for (const file of this.pendingPhotos()) {
        await this.sessionService.uploadPhoto(session.id, file);
      }
      this.clearPendingPreviews();
      this.showSaveForm.set(false);
      this.sessionSaved.emit();
      await this.sessionService.loadSessions();
    }
    this.saving.set(false);
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
    input.value = "";
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
    if (event.key === "ArrowLeft") {
      this.lightboxPrev();
    } else if (event.key === "ArrowRight") {
      this.lightboxNext();
    } else if (event.key === "Escape") {
      this.closeLightbox();
    }
  }

  photoUrl(filename: string): string {
    return this.sessionService.photoUrl(filename);
  }

  setRating(r: number): void {
    this.saveRating.set(r);
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
    if (!notes) return "";
    return notes.length > 60 ? notes.substring(0, 60) + "…" : notes;
  }
}
