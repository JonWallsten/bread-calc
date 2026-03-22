import { Injectable, signal, computed } from '@angular/core';

export interface AuthUser {
    id: number;
    email: string;
    name: string;
    picture_url: string | null;
}

@Injectable({ providedIn: 'root' })
export class AuthService {
    private readonly userSignal = signal<AuthUser | null>(null);
    private readyResolve!: () => void;
    readonly ready = new Promise<void>((r) => (this.readyResolve = r));

    readonly isLoggedIn = computed(() => !!this.userSignal());
    readonly user = this.userSignal.asReadonly();

    constructor() {
        this.fetchMe();
    }

    async loginWithGoogle(idToken: string): Promise<boolean> {
        try {
            const res = await fetch(this.apiUrl('/auth/google'), {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({ token: idToken }),
            });
            if (!res.ok) return false;
            const data = await res.json();
            this.userSignal.set(data.user);
            this.clearLegacyTokens();
            return true;
        } catch {
            return false;
        }
    }

    async logout(): Promise<void> {
        try {
            await fetch(this.apiUrl('/auth/logout'), {
                method: 'POST',
                credentials: 'include',
            });
        } catch {
            /* best-effort */
        }
        this.userSignal.set(null);
    }

    private async fetchMe(): Promise<void> {
        try {
            const res = await fetch(this.apiUrl('/auth/me'), {
                credentials: 'include',
            });
            if (!res.ok) {
                this.userSignal.set(null);
                return;
            }
            const data = await res.json();
            this.userSignal.set(data.user);
        } catch {
            this.userSignal.set(null);
        } finally {
            this.readyResolve();
        }
    }

    private apiUrl(path: string): string {
        const base =
            typeof window !== 'undefined' && window.location.hostname === 'localhost'
                ? '/api'
                : '/bread-calc/api';
        return `${base}${path}`;
    }

    private clearLegacyTokens(): void {
        try {
            localStorage.removeItem('breadCalcAuthToken');
            sessionStorage.removeItem('breadCalcAuthToken');
        } catch {
            /* noop */
        }
    }
}
