import { Injectable, inject } from '@angular/core';
import { AuthService } from './auth.service';

@Injectable({ providedIn: 'root' })
export class ApiService {
    private readonly auth = inject(AuthService);

    private apiUrl(path: string): string {
        const base =
            typeof window !== 'undefined' && window.location.hostname === 'localhost'
                ? '/api'
                : '/bread-calc/api';
        return `${base}${path}`;
    }

    async get<T>(path: string): Promise<T> {
        const res = await fetch(this.apiUrl(path), {
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
        });
        if (res.status === 401) {
            this.auth.logout();
            throw new Error('Unauthorized');
        }
        if (!res.ok) throw new Error(`API error: ${res.status}`);
        return res.json();
    }

    async post<T>(path: string, body: unknown): Promise<T> {
        const res = await fetch(this.apiUrl(path), {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify(body),
        });
        if (res.status === 401) {
            this.auth.logout();
            throw new Error('Unauthorized');
        }
        if (!res.ok) throw new Error(`API error: ${res.status}`);
        return res.json();
    }

    async put<T>(path: string, body: unknown): Promise<T> {
        const res = await fetch(this.apiUrl(path), {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify(body),
        });
        if (res.status === 401) {
            this.auth.logout();
            throw new Error('Unauthorized');
        }
        if (!res.ok) throw new Error(`API error: ${res.status}`);
        return res.json();
    }

    async delete(path: string): Promise<void> {
        const res = await fetch(this.apiUrl(path), {
            method: 'DELETE',
            credentials: 'include',
        });
        if (res.status === 401) {
            this.auth.logout();
            throw new Error('Unauthorized');
        }
        if (!res.ok) throw new Error(`API error: ${res.status}`);
    }

    async upload(path: string, formData: FormData): Promise<unknown> {
        const res = await fetch(this.apiUrl(path), {
            method: 'POST',
            credentials: 'include',
            body: formData,
        });
        if (res.status === 401) {
            this.auth.logout();
            throw new Error('Unauthorized');
        }
        if (!res.ok) throw new Error(`API error: ${res.status}`);
        return res.json();
    }
}
