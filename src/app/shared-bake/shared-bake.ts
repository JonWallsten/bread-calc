import {
    Component,
    inject,
    signal,
    computed,
    OnInit,
    ChangeDetectionStrategy,
} from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { I18nService } from '../i18n.service';
import { BakingSessionService, SharedBake } from '../baking-session.service';
import { ResultsComponent } from '../results/results';
import { LightboxComponent, LightboxPhoto } from '../lightbox/lightbox';
import { ExpansionComponent } from '../expansion/expansion';

@Component({
    selector: 'app-shared-bake',
    templateUrl: './shared-bake.html',
    styleUrl: './shared-bake.scss',
    imports: [ResultsComponent, LightboxComponent, ExpansionComponent],
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SharedBakeComponent implements OnInit {
    readonly i18n = inject(I18nService);
    private readonly route = inject(ActivatedRoute);
    private readonly sessionService = inject(BakingSessionService);

    readonly bake = signal<SharedBake | null>(null);
    readonly notFound = signal(false);
    readonly stars = [1, 2, 3, 4, 5];
    readonly showRecipe = signal(false);

    // Lightbox
    readonly lightboxOpen = signal(false);
    readonly lightboxIndex = signal(0);
    readonly lightboxPhotos = computed<LightboxPhoto[]>(() => {
        const b = this.bake();
        if (!b) return [];
        return b.photos.map((p) => ({
            url: this.photoUrl(p.filename),
            alt: p.original_name,
        }));
    });

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
}
