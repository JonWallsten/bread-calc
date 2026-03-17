import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { ApiService } from './api.service';
import { AuthService } from './auth.service';

describe('ApiService', () => {
    let service: ApiService;
    let authService: AuthService;

    beforeEach(() => {
        localStorage.clear();
        // Prevent AuthService constructor from making fetchMe() calls
        vi.stubGlobal(
            'fetch',
            vi.fn(() => Promise.resolve(new Response(null, { status: 401 }))),
        );

        TestBed.configureTestingModule({});
        authService = TestBed.inject(AuthService);
        service = TestBed.inject(ApiService);
    });

    afterEach(() => {
        vi.restoreAllMocks();
        localStorage.clear();
    });

    describe('get', () => {
        it('should call fetch with correct URL', async () => {
            vi.stubGlobal(
                'fetch',
                vi.fn(() =>
                    Promise.resolve(
                        new Response(JSON.stringify({ ok: true }), {
                            status: 200,
                            headers: { 'Content-Type': 'application/json' },
                        }),
                    ),
                ),
            );

            await service.get('/recipes');
            expect(fetch).toHaveBeenCalledOnce();
            const [url] = vi.mocked(fetch).mock.calls[0];
            expect(url).toContain('/recipes');
        });

        it('should include Content-Type header', async () => {
            vi.stubGlobal(
                'fetch',
                vi.fn(() => Promise.resolve(new Response(JSON.stringify({}), { status: 200 }))),
            );

            await service.get('/test');
            const [, options] = vi.mocked(fetch).mock.calls[0] as [string, RequestInit];
            const headers = options.headers as Record<string, string>;
            expect(headers['Content-Type']).toBe('application/json');
        });

        it('should include Authorization header when logged in', async () => {
            // Login first
            vi.stubGlobal(
                'fetch',
                vi.fn(() =>
                    Promise.resolve(
                        new Response(
                            JSON.stringify({
                                token: 'my-jwt',
                                user: {
                                    id: 1,
                                    email: 'a@b.com',
                                    name: 'A',
                                    picture_url: null,
                                },
                            }),
                            { status: 200, headers: { 'Content-Type': 'application/json' } },
                        ),
                    ),
                ),
            );
            await authService.loginWithGoogle('id-token');

            // Now make a GET request
            vi.stubGlobal(
                'fetch',
                vi.fn(() => Promise.resolve(new Response(JSON.stringify({}), { status: 200 }))),
            );
            await service.get('/recipes');
            const [, options] = vi.mocked(fetch).mock.calls[0] as [string, RequestInit];
            const headers = options.headers as Record<string, string>;
            expect(headers['Authorization']).toBe('Bearer my-jwt');
        });

        it('should throw on non-OK response', async () => {
            vi.stubGlobal(
                'fetch',
                vi.fn(() => Promise.resolve(new Response(null, { status: 500 }))),
            );

            await expect(service.get('/test')).rejects.toThrow('API error: 500');
        });

        it('should call logout on 401 response', async () => {
            // Login first
            vi.stubGlobal(
                'fetch',
                vi.fn(() =>
                    Promise.resolve(
                        new Response(
                            JSON.stringify({
                                token: 'jwt',
                                user: {
                                    id: 1,
                                    email: 'a@b.com',
                                    name: 'A',
                                    picture_url: null,
                                },
                            }),
                            { status: 200, headers: { 'Content-Type': 'application/json' } },
                        ),
                    ),
                ),
            );
            await authService.loginWithGoogle('id-token');
            expect(authService.authToken()).toBe('jwt');

            // 401 response triggers logout
            vi.stubGlobal(
                'fetch',
                vi.fn(() => Promise.resolve(new Response(null, { status: 401 }))),
            );
            await expect(service.get('/test')).rejects.toThrow('Unauthorized');
            expect(authService.authToken()).toBeNull();
        });
    });

    describe('post', () => {
        it('should send JSON body', async () => {
            vi.stubGlobal(
                'fetch',
                vi.fn(() => Promise.resolve(new Response(JSON.stringify({}), { status: 200 }))),
            );

            await service.post('/recipes', { name: 'Test', inputs: {} });
            const [, options] = vi.mocked(fetch).mock.calls[0] as [string, RequestInit];
            expect(options.method).toBe('POST');
            expect(JSON.parse(options.body as string)).toEqual({
                name: 'Test',
                inputs: {},
            });
        });
    });

    describe('put', () => {
        it('should use PUT method', async () => {
            vi.stubGlobal(
                'fetch',
                vi.fn(() => Promise.resolve(new Response(JSON.stringify({}), { status: 200 }))),
            );

            await service.put('/recipes/1', { name: 'Updated' });
            const [, options] = vi.mocked(fetch).mock.calls[0] as [string, RequestInit];
            expect(options.method).toBe('PUT');
        });
    });

    describe('delete', () => {
        it('should use DELETE method', async () => {
            vi.stubGlobal(
                'fetch',
                vi.fn(() => Promise.resolve(new Response(null, { status: 200 }))),
            );

            await service.delete('/recipes/1');
            const [, options] = vi.mocked(fetch).mock.calls[0] as [string, RequestInit];
            expect(options.method).toBe('DELETE');
        });
    });

    describe('upload', () => {
        it('should not set Content-Type for FormData', async () => {
            vi.stubGlobal(
                'fetch',
                vi.fn(() => Promise.resolve(new Response(JSON.stringify({}), { status: 200 }))),
            );

            const formData = new FormData();
            formData.append('file', new Blob(['data']), 'test.jpg');
            await service.upload('/sessions/1/photos', formData);

            const [, options] = vi.mocked(fetch).mock.calls[0] as [string, RequestInit];
            const headers = options.headers as Record<string, string>;
            expect(headers['Content-Type']).toBeUndefined();
            expect(options.body).toBe(formData);
        });
    });
});
