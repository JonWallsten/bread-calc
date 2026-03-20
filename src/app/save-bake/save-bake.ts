import {
    ChangeDetectionStrategy,
    Component,
    inject,
    input,
    signal,
    viewChild,
    ElementRef,
} from '@angular/core';
import { RouterLink } from '@angular/router';
import { I18nService } from '../i18n.service';
import { BakingSessionService } from '../baking-session.service';
import { CalcInputs, CalcResult } from '../calc.service';

@Component({
    selector: 'app-save-bake',
    templateUrl: './save-bake.html',
    styleUrl: './save-bake.scss',
    imports: [RouterLink],
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SaveBakeComponent {
    readonly i18n = inject(I18nService);
    private readonly sessionService = inject(BakingSessionService);

    readonly currentInputs = input.required<CalcInputs>();
    readonly currentResults = input.required<CalcResult>();
    readonly activeRecipeCloudId = input<number | null>(null);

    readonly showSaveForm = signal(false);
    readonly saveTitle = signal('');
    readonly saveNotes = signal('');
    readonly saveRating = signal<number>(0);
    readonly saving = signal(false);
    readonly saved = signal(false);
    readonly pendingPhotos = signal<File[]>([]);
    readonly pendingPreviews = signal<string[]>([]);

    readonly saveFileInputRef = viewChild<ElementRef<HTMLInputElement>>('saveFileInput');

    readonly stars = [1, 2, 3, 4, 5];

    openSaveForm(): void {
        this.saveTitle.set('');
        this.saveNotes.set('');
        this.saveRating.set(0);
        this.pendingPhotos.set([]);
        this.pendingPreviews.set([]);
        this.saved.set(false);
        this.showSaveForm.set(true);
    }

    closeSaveForm(): void {
        this.showSaveForm.set(false);
        this.clearPendingPreviews();
    }

    setRating(r: number): void {
        this.saveRating.set(r);
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

        input.value = '';
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
            title: this.saveTitle() || undefined,
            notes: this.saveNotes() || undefined,
            rating: this.saveRating() || undefined,
        });

        if (session) {
            for (const file of this.pendingPhotos()) {
                await this.sessionService.uploadPhoto(session.id, file);
            }
            this.clearPendingPreviews();
            this.showSaveForm.set(false);
            this.saved.set(true);
        }
        this.saving.set(false);
    }
}
