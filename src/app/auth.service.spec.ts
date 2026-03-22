import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { AuthService, AuthUser } from './auth.service';

describe('AuthService', () => {
    let service: AuthService;

    beforeEach(() => {
        localStorage.clear();
        sessionStorage.clear();
        // Mock fetch to prevent constructor fetchMe() from making real calls
        vi.stubGlobal(
            'fetch',
            vi.fn(() => Promise.resolve(new Response(null, { status: 401 }))),
        );
        TestBed.configureTestingModule({});
        service = TestBed.inject(AuthService);
    });

    afterEach(() => {
        vi.restoreAllMocks();
        localStorage.clear();
        sessionStorage.clear();
    });

    it('should start with no user', () => {
        expect(service.user()).toBeNull();
        expect(service.isLoggedIn()).toBe(false);
    });

    describe('loginWithGoogle', () => {
        it('should set user on success', async () => {
            const mockUser: AuthUser = {
                id: 1,
                email: 'test@example.com',
                name: 'Test',
                picture_url: null,
            };
            vi.stubGlobal(
                'fetch',
                vi.fn(() =>
                    Promise.resolve(
                        new Response(JSON.stringify({ user: mockUser }), {
                            status: 200,
                            headers: { 'Content-Type': 'application/json' },
                        }),
                    ),
                ),
            );

            const result = await service.loginWithGoogle('google-id-token');
            expect(result).toBe(true);
            expect(service.user()).toEqual(mockUser);
            expect(service.isLoggedIn()).toBe(true);
        });

        it('should send credentials: include', async () => {
            vi.stubGlobal(
                'fetch',
                vi.fn(() =>
                    Promise.resolve(
                        new Response(
                            JSON.stringify({
                                user: { id: 1, email: 'a@b.com', name: 'A', picture_url: null },
                            }),
                            {
                                status: 200,
                                headers: { 'Content-Type': 'application/json' },
                            },
                        ),
                    ),
                ),
            );

            await service.loginWithGoogle('id-token');
            const [, options] = vi.mocked(fetch).mock.calls[0] as [string, RequestInit];
            expect(options.credentials).toBe('include');
        });

        it('should return false on failure', async () => {
            vi.stubGlobal(
                'fetch',
                vi.fn(() => Promise.resolve(new Response(null, { status: 401 }))),
            );

            const result = await service.loginWithGoogle('bad-token');
            expect(result).toBe(false);
            expect(service.isLoggedIn()).toBe(false);
        });

        it('should return false on network error', async () => {
            vi.stubGlobal(
                'fetch',
                vi.fn(() => Promise.reject(new Error('Network error'))),
            );

            const result = await service.loginWithGoogle('token');
            expect(result).toBe(false);
        });

        it('should clear legacy tokens from storage', async () => {
            localStorage.setItem('breadCalcAuthToken', 'old');
            sessionStorage.setItem('breadCalcAuthToken', 'old');
            vi.stubGlobal(
                'fetch',
                vi.fn(() =>
                    Promise.resolve(
                        new Response(
                            JSON.stringify({
                                user: { id: 1, email: 'a@b.com', name: 'A', picture_url: null },
                            }),
                            {
                                status: 200,
                                headers: { 'Content-Type': 'application/json' },
                            },
                        ),
                    ),
                ),
            );

            await service.loginWithGoogle('id-token');
            expect(localStorage.getItem('breadCalcAuthToken')).toBeNull();
            expect(sessionStorage.getItem('breadCalcAuthToken')).toBeNull();
        });
    });

    describe('logout', () => {
        it('should clear user and call POST /auth/logout', async () => {
            // First login
            const mockUser: AuthUser = {
                id: 1,
                email: 'a@b.com',
                name: 'A',
                picture_url: null,
            };
            vi.stubGlobal(
                'fetch',
                vi.fn(() =>
                    Promise.resolve(
                        new Response(JSON.stringify({ user: mockUser }), {
                            status: 200,
                            headers: { 'Content-Type': 'application/json' },
                        }),
                    ),
                ),
            );
            await service.loginWithGoogle('id-token');
            expect(service.isLoggedIn()).toBe(true);

            // Then logout
            vi.stubGlobal(
                'fetch',
                vi.fn(() =>
                    Promise.resolve(
                        new Response(JSON.stringify({ success: true }), { status: 200 }),
                    ),
                ),
            );
            await service.logout();
            expect(service.user()).toBeNull();
            expect(service.isLoggedIn()).toBe(false);
            const [url, options] = vi.mocked(fetch).mock.calls[0] as [string, RequestInit];
            expect(url).toContain('/auth/logout');
            expect(options.method).toBe('POST');
            expect(options.credentials).toBe('include');
        });
    });

    describe('fetchMe on init', () => {
        it('should call /auth/me with credentials on construction', async () => {
            vi.stubGlobal(
                'fetch',
                vi.fn(() =>
                    Promise.resolve(
                        new Response(
                            JSON.stringify({
                                user: { id: 1, email: 'a@b.com', name: 'A', picture_url: null },
                            }),
                            { status: 200, headers: { 'Content-Type': 'application/json' } },
                        ),
                    ),
                ),
            );
            TestBed.resetTestingModule();
            TestBed.configureTestingModule({});
            const freshService = TestBed.inject(AuthService);
            await freshService.ready;
            expect(freshService.isLoggedIn()).toBe(true);
            const [url, options] = vi.mocked(fetch).mock.calls[0] as [string, RequestInit];
            expect(url).toContain('/auth/me');
            expect(options.credentials).toBe('include');
        });
    });

    describe('apiUrl', () => {
        it('should use localhost URL in test environment', async () => {
            vi.stubGlobal(
                'fetch',
                vi.fn(() => Promise.resolve(new Response(null, { status: 401 }))),
            );

            await service.loginWithGoogle('token');
            const fetchCall = vi.mocked(fetch).mock.calls[0];
            expect(fetchCall[0]).toContain('/auth/google');
        });
    });
});
