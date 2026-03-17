import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { BakingSessionService, SessionPage } from './baking-session.service';
import { ApiService } from './api.service';
import { AuthService } from './auth.service';

describe('BakingSessionService', () => {
    let service: BakingSessionService;
    let apiService: ApiService;

    beforeEach(() => {
        localStorage.clear();
        vi.stubGlobal(
            'fetch',
            vi.fn(() => Promise.resolve(new Response(null, { status: 401 }))),
        );

        TestBed.configureTestingModule({});
        apiService = TestBed.inject(ApiService);
        service = TestBed.inject(BakingSessionService);
    });

    afterEach(() => {
        vi.restoreAllMocks();
        localStorage.clear();
    });

    it('should start with empty sessions', () => {
        expect(service.sessions()).toEqual([]);
        expect(service.totalPages()).toBe(0);
        expect(service.currentPage()).toBe(1);
        expect(service.loading()).toBe(false);
    });

    describe('loadSessions', () => {
        it('should populate sessions signal from API', async () => {
            const mockPage: SessionPage = {
                sessions: [
                    {
                        id: 1,
                        recipe_name: 'Test',
                        notes: null,
                        rating: 4,
                        baked_at: '2026-01-01',
                        created_at: '2026-01-01',
                        thumbnail: null,
                    },
                ],
                total: 1,
                page: 1,
                pages: 1,
            };

            vi.spyOn(apiService, 'get').mockResolvedValue(mockPage);

            await service.loadSessions();
            expect(service.sessions()).toEqual(mockPage.sessions);
            expect(service.totalPages()).toBe(1);
            expect(service.currentPage()).toBe(1);
            expect(service.loading()).toBe(false);
        });

        it('should pass page parameter', async () => {
            vi.spyOn(apiService, 'get').mockResolvedValue({
                sessions: [],
                total: 0,
                page: 3,
                pages: 5,
            });

            await service.loadSessions(3);
            expect(apiService.get).toHaveBeenCalledWith('/sessions?page=3');
        });

        it('should set loading true during fetch', async () => {
            let resolveFn!: () => void;
            vi.spyOn(apiService, 'get').mockReturnValue(
                new Promise((resolve) => {
                    resolveFn = () => resolve({ sessions: [], total: 0, page: 1, pages: 0 });
                }),
            );

            const promise = service.loadSessions();
            expect(service.loading()).toBe(true);
            resolveFn();
            await promise;
            expect(service.loading()).toBe(false);
        });

        it('should reset sessions on error', async () => {
            vi.spyOn(apiService, 'get').mockRejectedValue(new Error('fail'));

            await service.loadSessions();
            expect(service.sessions()).toEqual([]);
            expect(service.loading()).toBe(false);
        });
    });

    describe('getSession', () => {
        it('should return session detail', async () => {
            const mockDetail = { id: 1, photos: [] };
            vi.spyOn(apiService, 'get').mockResolvedValue(mockDetail);

            const result = await service.getSession(1);
            expect(result).toEqual(mockDetail);
            expect(apiService.get).toHaveBeenCalledWith('/sessions/1');
        });

        it('should return null on error', async () => {
            vi.spyOn(apiService, 'get').mockRejectedValue(new Error('404'));

            const result = await service.getSession(999);
            expect(result).toBeNull();
        });
    });

    describe('deleteSession', () => {
        it('should remove session from list', async () => {
            service.sessions.set([
                {
                    id: 1,
                    recipe_name: 'A',
                    notes: null,
                    rating: null,
                    baked_at: '',
                    created_at: '',
                    thumbnail: null,
                },
                {
                    id: 2,
                    recipe_name: 'B',
                    notes: null,
                    rating: null,
                    baked_at: '',
                    created_at: '',
                    thumbnail: null,
                },
            ]);
            vi.spyOn(apiService, 'delete').mockResolvedValue(undefined);

            const result = await service.deleteSession(1);
            expect(result).toBe(true);
            expect(service.sessions().length).toBe(1);
            expect(service.sessions()[0].id).toBe(2);
        });

        it('should return false on error', async () => {
            vi.spyOn(apiService, 'delete').mockRejectedValue(new Error('fail'));

            const result = await service.deleteSession(1);
            expect(result).toBe(false);
        });
    });

    describe('updateSession', () => {
        it('should call API put with data', async () => {
            vi.spyOn(apiService, 'put').mockResolvedValue({});

            const result = await service.updateSession(1, { rating: 5 });
            expect(result).toBe(true);
            expect(apiService.put).toHaveBeenCalledWith('/sessions/1', { rating: 5 });
        });

        it('should return false on error', async () => {
            vi.spyOn(apiService, 'put').mockRejectedValue(new Error('fail'));

            const result = await service.updateSession(1, { notes: 'x' });
            expect(result).toBe(false);
        });
    });

    describe('deletePhoto', () => {
        it('should call correct API endpoint', async () => {
            vi.spyOn(apiService, 'delete').mockResolvedValue(undefined);

            const result = await service.deletePhoto(10, 5);
            expect(result).toBe(true);
            expect(apiService.delete).toHaveBeenCalledWith('/sessions/10/photos/5');
        });
    });

    describe('photoUrl', () => {
        it('should include /uploads/ in the URL', () => {
            const url = service.photoUrl('session_abc123.webp');
            expect(url).toContain('/uploads/session_abc123.webp');
        });

        it('should use /api base in dev env', () => {
            const url = service.photoUrl('test.jpg');
            // jsdom hostname is localhost → /api prefix
            expect(url).toBe('/api/uploads/test.jpg');
        });
    });
});
