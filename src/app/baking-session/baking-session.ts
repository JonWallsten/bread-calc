import {
  Component,
  inject,
  signal,
  computed,
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

@Component({
  selector: "app-baking-session",
  templateUrl: "./baking-session.html",
  styleUrl: "./baking-session.css",
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

  readonly fileInputRef = viewChild<ElementRef<HTMLInputElement>>("fileInput");

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
    this.showSaveForm.set(true);
  }

  closeSaveForm(): void {
    this.showSaveForm.set(false);
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
    this.saving.set(false);

    if (session) {
      this.showSaveForm.set(false);
      this.sessionSaved.emit();
      await this.sessionService.loadSessions();
    }
  }

  async viewSession(id: number): Promise<void> {
    const detail = await this.sessionService.getSession(id);
    this.selectedSession.set(detail);
  }

  closeDetail(): void {
    this.selectedSession.set(null);
  }

  async deleteSession(id: number): Promise<void> {
    const t = this.i18n.t();
    if (!confirm(t.confirmDeleteSession)) return;
    await this.sessionService.deleteSession(id);
    this.selectedSession.set(null);
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
    const t = this.i18n.t();
    if (!confirm(t.deletePhoto + "?")) return;
    const ok = await this.sessionService.deletePhoto(session.id, photoId);
    if (ok) {
      const refreshed = await this.sessionService.getSession(session.id);
      this.selectedSession.set(refreshed);
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
}
