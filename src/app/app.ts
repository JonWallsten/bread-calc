import { Component, inject, signal, OnInit, HostListener, effect } from '@angular/core';
import { Title } from '@angular/platform-browser';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { I18nService } from './i18n.service';
import { AuthService } from './auth.service';
import { RecipeService } from './recipe.service';
import { FlourBlendService } from './flour-blend.service';
import { SplashComponent } from './splash/splash';
import { ConfirmDialogComponent } from './confirm-dialog/confirm-dialog';
import { nextScrollState, INITIAL_SCROLL_STATE, type ScrollState } from './scroll-state';

@Component({
    selector: 'app-root',
    imports: [RouterOutlet, RouterLink, RouterLinkActive, SplashComponent, ConfirmDialogComponent],
    templateUrl: './app.html',
    styleUrl: './app.scss',
})
export class App implements OnInit {
    readonly recipes = inject(RecipeService);
    readonly auth = inject(AuthService);
    private readonly blend = inject(FlourBlendService);
    private readonly titleService = inject(Title);
    readonly i18n = inject(I18nService);

    // eslint-disable-next-line @typescript-eslint/no-unsafe-function-type
    private gsiApi: { initialize: Function; renderButton: Function } | null = null;
    private gsiClientId: string | null = null;

    // UI state
    readonly showProfileMenu = signal(false);
    readonly showScrollTop = signal(false);
    readonly showSplash = signal(SplashComponent.shouldShow());
    readonly showUploadPrompt = signal(false);
    readonly topbarHidden = signal(false);
    readonly theme = signal<'light' | 'dark' | 'system'>(this.initTheme());
    private scrollState: ScrollState = { ...INITIAL_SCROLL_STATE };

    private initTheme(): 'light' | 'dark' | 'system' {
        const stored = localStorage.getItem('breadCalcTheme');
        if (stored === 'dark' || stored === 'light') {
            document.documentElement.dataset['theme'] = stored;
            return stored;
        }
        delete document.documentElement.dataset['theme'];
        return 'system';
    }

    toggleTheme(): void {
        const cycle: Record<'light' | 'dark' | 'system', 'light' | 'dark' | 'system'> = {
            system: 'light',
            light: 'dark',
            dark: 'system',
        };
        const next = cycle[this.theme()];
        this.theme.set(next);
        if (next === 'system') {
            delete document.documentElement.dataset['theme'];
            localStorage.removeItem('breadCalcTheme');
        } else {
            document.documentElement.dataset['theme'] = next;
            localStorage.setItem('breadCalcTheme', next);
        }
    }

    constructor() {
        effect(() => {
            this.titleService.setTitle(this.i18n.t().appTitle);
        });
        effect(() => {
            if (!this.auth.isLoggedIn()) {
                this.renderGsiButton();
            }
        });
        effect(() => {
            if (this.auth.isLoggedIn()) {
                this.triggerSync();
            }
        });
    }

    private async triggerSync(): Promise<void> {
        if (this.recipes.hasUploadableRecipes()) {
            await this.recipes.syncToCloud(false);
            await this.blend.syncToCloud(false);
            this.showUploadPrompt.set(true);
        } else {
            await this.recipes.syncToCloud();
            await this.blend.syncToCloud();
        }
    }

    ngOnInit(): void {
        this.initGoogleSignIn();
    }

    // ── Google Sign-In ──────────────────────────────────

    private async initGoogleSignIn(): Promise<void> {
        const base =
            typeof window !== 'undefined' && window.location.hostname === 'localhost'
                ? '/api'
                : '/bread-calc/api';
        let clientId: string;
        try {
            const res = await fetch(`${base}/auth/config`);
            if (!res.ok) return;
            const data = await res.json();
            clientId = data.google_client_id;
            if (!clientId) return;
        } catch {
            return;
        }

        this.gsiClientId = clientId;

        const tryInit = () => {
            const google = (window as unknown as Record<string, unknown>)['google'] as
                | {
                      accounts?: {
                          // eslint-disable-next-line @typescript-eslint/no-unsafe-function-type
                          id?: { initialize: Function; renderButton: Function };
                      };
                  }
                | undefined;
            if (!google?.accounts?.id) {
                setTimeout(tryInit, 200);
                return;
            }
            this.gsiApi = google.accounts.id;
            this.gsiApi.initialize({
                client_id: clientId,
                callback: (response: { credential: string }) => {
                    this.handleGoogleResponse(response.credential);
                },
            });
            this.renderGsiButton();
        };
        tryInit();
    }

    private renderGsiButton(): void {
        if (!this.gsiApi) return;
        setTimeout(() => {
            const btnEl = document.getElementById('google-signin-btn');
            if (btnEl) {
                this.gsiApi?.renderButton(btnEl, {
                    type: 'icon',
                    size: 'medium',
                    shape: 'circle',
                });
            }
        });
    }

    private async handleGoogleResponse(credential: string): Promise<void> {
        await this.auth.loginWithGoogle(credential);
    }

    doLogout(): void {
        this.recipes.clearCloudRecipes();
        this.recipes.clearPendingDeletes();
        this.blend.clearCloudPresets();
        this.blend.clearPendingDeletes();
        this.auth.logout();
        this.showProfileMenu.set(false);
    }

    toggleProfileMenu(): void {
        this.showProfileMenu.update((v) => !v);
    }

    @HostListener('window:scroll')
    onScroll(): void {
        const y = window.scrollY;
        this.showScrollTop.set(y > 300);
        this.scrollState = nextScrollState(this.scrollState, y);
        this.topbarHidden.set(this.scrollState.hidden);
    }

    scrollToTop(): void {
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }

    // Upload prompt handlers
    async confirmUploadLocal(): Promise<void> {
        this.showUploadPrompt.set(false);
        await this.recipes.syncToCloud(true);
        await this.blend.syncToCloud(true);
    }

    declineUploadLocal(): void {
        this.showUploadPrompt.set(false);
        this.recipes.skipUploadForLocalRecipes();
        this.blend.skipUploadForLocalPresets();
    }
}
