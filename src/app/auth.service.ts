import { Injectable, signal, computed } from '@angular/core';

const TOKEN_KEY = 'breadCalcAuthToken';

export interface AuthUser {
    id: number;
    email: string;
    name: string;
    picture_url: string | null;
}

@Injectable({ providedIn: 'root' })
export class AuthService {
    private readonly token = signal<string | null>(this.loadToken());
    private readonly userSignal = signal<AuthUser | null>(null);
    private initialCheckDone = false;

    readonly isLoggedIn = computed(() => !!this.token() && !!this.userSignal());
    readonly user = this.userSignal.asReadonly();
    readonly authToken = this.token.asReadonly();

    constructor() {
        if (this.token()) {
            this.fetchMe();
        }
    }

    async loginWithGoogle(idToken: string): Promise<boolean> {
        try {
            const res = await fetch(this.apiUrl('/auth/google'), {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ token: idToken }),
            });
            if (!res.ok) return false;
            const data = await res.json();
            this.token.set(data.token);
            this.userSignal.set(data.user);
            this.persistToken();
            return true;
        } catch {
            return false;
        }
    }

    logout(): void {
        this.token.set(null);
        this.userSignal.set(null);
        this.persistToken();
    }

    private async fetchMe(): Promise<void> {
        try {
            const res = await fetch(this.apiUrl('/auth/me'), {
                headers: { Authorization: `Bearer ${this.token()}` },
            });
            if (!res.ok) {
                this.logout();
                return;
            }
            const data = await res.json();
            this.userSignal.set(data.user);
        } catch {
            this.logout();
        } finally {
            this.initialCheckDone = true;
        }
    }

    private apiUrl(path: string): string {
        const base =
            typeof window !== 'undefined' && window.location.hostname === 'localhost'
                ? '/api'
                : '/bread-calc/api';
        return `${base}${path}`;
    }

    private loadToken(): string | null {
        try {
            return localStorage.getItem(TOKEN_KEY);
        } catch {
            return null;
        }
    }

    private persistToken(): void {
        try {
            const t = this.token();
            if (t) {
                localStorage.setItem(TOKEN_KEY, t);
            } else {
                localStorage.removeItem(TOKEN_KEY);
            }
        } catch {
            /* noop */
        }
    }
}
