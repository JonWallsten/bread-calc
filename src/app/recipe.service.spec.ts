import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { RecipeService } from './recipe.service';
import { ApiService } from './api.service';
import { AuthService } from './auth.service';
import { DEFAULT_INPUTS } from './config';

async function loginUser(authService: AuthService): Promise<void> {
    vi.stubGlobal(
        'fetch',
        vi.fn(() =>
            Promise.resolve(
                new Response(
                    JSON.stringify({
                        token: 'jwt',
                        user: { id: 1, email: 'a@b.com', name: 'A', picture_url: null },
                    }),
                    { status: 200, headers: { 'Content-Type': 'application/json' } },
                ),
            ),
        ),
    );
    await authService.loginWithGoogle('token');
}

describe('RecipeService', () => {
    let service: RecipeService;
    let authService: AuthService;
    let apiService: ApiService;

    function resetServices(): void {
        TestBed.resetTestingModule();
        TestBed.configureTestingModule({});
        authService = TestBed.inject(AuthService);
        apiService = TestBed.inject(ApiService);
        service = TestBed.inject(RecipeService);
    }

    beforeEach(() => {
        localStorage.clear();
        vi.stubGlobal(
            'fetch',
            vi.fn(() => Promise.resolve(new Response(null, { status: 401 }))),
        );

        TestBed.configureTestingModule({});
        authService = TestBed.inject(AuthService);
        apiService = TestBed.inject(ApiService);
        service = TestBed.inject(RecipeService);
    });

    afterEach(() => {
        vi.restoreAllMocks();
        localStorage.clear();
    });

    it('should include built-in recipes', () => {
        expect(service.allRecipes().length).toBeGreaterThan(0);
        expect(service.allRecipes().some((r) => r.builtIn)).toBe(true);
    });

    it('should start with no active recipe', () => {
        expect(service.activeId()).toBeNull();
        expect(service.activeRecipe()).toBeNull();
    });

    describe('saveRecipe', () => {
        it('should add a new user recipe', () => {
            const before = service.allRecipes().length;
            service.saveRecipe('My Recipe', { ...DEFAULT_INPUTS });
            expect(service.allRecipes().length).toBe(before + 1);
        });

        it('should set the new recipe as active', () => {
            const recipe = service.saveRecipe('Active Test', { ...DEFAULT_INPUTS });
            expect(service.activeId()).toBe(recipe.id);
            expect(service.activeRecipe()?.name).toBe('Active Test');
        });

        it('should persist to localStorage', () => {
            service.saveRecipe('Persist Test', { ...DEFAULT_INPUTS });
            const stored = localStorage.getItem('breadCalcUserRecipes');
            expect(stored).toBeTruthy();
            const parsed = JSON.parse(stored!);
            expect(parsed.some((r: { name: string }) => r.name === 'Persist Test')).toBe(true);
        });

        it('should give user recipe a user- prefixed id', () => {
            const recipe = service.saveRecipe('ID Test', { ...DEFAULT_INPUTS });
            expect(recipe.id).toMatch(/^user-/);
        });

        it('should set updatedAt on new recipe', () => {
            const recipe = service.saveRecipe('Test', { ...DEFAULT_INPUTS });
            const found = service.allRecipes().find((r) => r.id === recipe.id);
            expect(found?.updatedAt).toBeTruthy();
        });
    });

    describe('updateRecipe', () => {
        it('should update recipe inputs', () => {
            const recipe = service.saveRecipe('Update Test', { ...DEFAULT_INPUTS });
            const newInputs = { ...DEFAULT_INPUTS, hydrationPct: 70 };
            service.updateRecipe(recipe.id, newInputs);

            const updated = service.allRecipes().find((r) => r.id === recipe.id);
            expect(updated?.inputs.hydrationPct).toBe(70);
        });

        it('should update updatedAt timestamp', () => {
            const recipe = service.saveRecipe('TS Test', { ...DEFAULT_INPUTS });
            const before = service.allRecipes().find((r) => r.id === recipe.id)?.updatedAt;
            service.updateRecipe(recipe.id, {
                ...DEFAULT_INPUTS,
                hydrationPct: 75,
            });
            const after = service.allRecipes().find((r) => r.id === recipe.id)?.updatedAt;
            expect(after).toBeTruthy();
            expect(after! >= before!).toBe(true);
        });
    });

    describe('deleteRecipe', () => {
        it('should remove recipe from list', () => {
            const recipe = service.saveRecipe('Delete Test', { ...DEFAULT_INPUTS });
            const beforeCount = service.allRecipes().length;
            service.deleteRecipe(recipe.id);
            expect(service.allRecipes().length).toBe(beforeCount - 1);
        });

        it('should clear active if deleted recipe was active', () => {
            const recipe = service.saveRecipe('Active Del', { ...DEFAULT_INPUTS });
            expect(service.activeId()).toBe(recipe.id);
            service.deleteRecipe(recipe.id);
            expect(service.activeId()).toBeNull();
        });

        it('should queue pending delete for cloud recipe when offline', () => {
            // Manually set up a cloud recipe in localStorage
            localStorage.setItem(
                'breadCalcUserRecipes',
                JSON.stringify([
                    {
                        id: 'cloud-99',
                        name: 'Cloud R',
                        builtIn: false,
                        inputs: DEFAULT_INPUTS,
                    },
                ]),
            );
            // Re-create service to pick up stored data
            resetServices();

            service.deleteRecipe('cloud-99');

            const pending = JSON.parse(localStorage.getItem('breadCalcPendingDeletes') ?? '[]');
            expect(pending.some((d: { cloudId: number }) => d.cloudId === 99)).toBe(true);
        });
    });

    describe('renameRecipe', () => {
        it('should update recipe name', () => {
            const recipe = service.saveRecipe('Old Name', { ...DEFAULT_INPUTS });
            service.renameRecipe(recipe.id, 'New Name');
            const updated = service.allRecipes().find((r) => r.id === recipe.id);
            expect(updated?.name).toBe('New Name');
        });

        it('should update updatedAt on rename', () => {
            const recipe = service.saveRecipe('Rename TS', { ...DEFAULT_INPUTS });
            const before = service.allRecipes().find((r) => r.id === recipe.id)?.updatedAt;
            service.renameRecipe(recipe.id, 'Renamed');
            const after = service.allRecipes().find((r) => r.id === recipe.id)?.updatedAt;
            expect(after! >= before!).toBe(true);
        });
    });

    describe('setActive / clearActive', () => {
        it('should change active recipe', () => {
            const recipe = service.saveRecipe('Set Active', { ...DEFAULT_INPUTS });
            service.clearActive();
            expect(service.activeId()).toBeNull();
            service.setActive(recipe.id);
            expect(service.activeId()).toBe(recipe.id);
        });

        it('should persist active id', () => {
            const recipe = service.saveRecipe('Persist Active', {
                ...DEFAULT_INPUTS,
            });
            service.setActive(recipe.id);
            expect(localStorage.getItem('breadCalcActiveRecipe')).toBe(recipe.id);
        });
    });

    describe('clearCloudRecipes', () => {
        it('should remove cloud recipes and keep local ones', () => {
            service.saveRecipe('Local', { ...DEFAULT_INPUTS });
            // Simulate a cloud recipe being present
            localStorage.setItem(
                'breadCalcUserRecipes',
                JSON.stringify([
                    ...JSON.parse(localStorage.getItem('breadCalcUserRecipes') ?? '[]'),
                    {
                        id: 'cloud-55',
                        name: 'Cloud',
                        builtIn: false,
                        inputs: DEFAULT_INPUTS,
                    },
                ]),
            );
            // Re-create to pick up both
            resetServices();

            service.clearCloudRecipes();

            const userRecipes = service.allRecipes().filter((r) => !r.builtIn);
            expect(userRecipes.some((r) => r.name === 'Local')).toBe(true);
            expect(userRecipes.some((r) => r.id.startsWith('cloud-'))).toBe(false);
        });

        it('should clear active if it was a cloud recipe', () => {
            localStorage.setItem(
                'breadCalcUserRecipes',
                JSON.stringify([
                    {
                        id: 'cloud-55',
                        name: 'Cloud',
                        builtIn: false,
                        inputs: DEFAULT_INPUTS,
                    },
                ]),
            );
            localStorage.setItem('breadCalcActiveRecipe', 'cloud-55');
            resetServices();
            expect(service.activeId()).toBe('cloud-55');

            service.clearCloudRecipes();
            expect(service.activeId()).toBeNull();
        });
    });

    describe('skipUploadForLocalRecipes', () => {
        it('should flag local recipes with skipUpload', () => {
            service.saveRecipe('Skip Me', { ...DEFAULT_INPUTS });
            expect(service.hasUploadableRecipes()).toBe(true);

            service.skipUploadForLocalRecipes();
            expect(service.hasUploadableRecipes()).toBe(false);
        });
    });

    describe('syncToCloud', () => {
        it('should not sync when not logged in', async () => {
            const getSpy = vi.spyOn(apiService, 'get');
            await service.syncToCloud();
            expect(getSpy).not.toHaveBeenCalled();
        });

        it('should fetch cloud recipes and add cloud-only to local', async () => {
            await loginUser(authService);

            vi.spyOn(apiService, 'get').mockResolvedValue([
                {
                    id: 10,
                    name: 'Cloud Recipe',
                    inputs: DEFAULT_INPUTS,
                    is_default: 0,
                    updated_at: '2025-01-01T00:00:00.000Z',
                },
            ]);

            await service.syncToCloud();

            const userRecipes = service.allRecipes().filter((r) => !r.builtIn);
            expect(userRecipes.some((r) => r.name === 'Cloud Recipe')).toBe(true);
            expect(userRecipes.some((r) => r.id === 'cloud-10')).toBe(true);
        });

        it('should upload local recipes and convert IDs', async () => {
            service.saveRecipe('Local Only', { ...DEFAULT_INPUTS });
            await loginUser(authService);

            vi.spyOn(apiService, 'get').mockResolvedValue([]);
            vi.spyOn(apiService, 'post').mockResolvedValue({
                recipe: { id: 20, name: 'Local Only', inputs: DEFAULT_INPUTS },
            });

            await service.syncToCloud();

            const userRecipes = service.allRecipes().filter((r) => !r.builtIn);
            expect(userRecipes.some((r) => r.id === 'cloud-20')).toBe(true);
            expect(userRecipes.some((r) => r.id.startsWith('user-'))).toBe(false);
        });

        it('should keep local recipes if upload fails', async () => {
            service.saveRecipe('Offline Recipe', { ...DEFAULT_INPUTS });
            await loginUser(authService);

            vi.spyOn(apiService, 'get').mockResolvedValue([]);
            vi.spyOn(apiService, 'post').mockRejectedValue(new Error('Network'));

            await service.syncToCloud();

            const userRecipes = service.allRecipes().filter((r) => !r.builtIn);
            expect(userRecipes.some((r) => r.name === 'Offline Recipe')).toBe(true);
            expect(userRecipes.some((r) => r.id.startsWith('user-'))).toBe(true);
        });

        it('should not duplicate cloud recipes on repeated sync', async () => {
            await loginUser(authService);

            vi.spyOn(apiService, 'get').mockResolvedValue([
                {
                    id: 10,
                    name: 'Cloud Recipe',
                    inputs: DEFAULT_INPUTS,
                    is_default: 0,
                },
            ]);

            await service.syncToCloud();
            await service.syncToCloud();

            const userRecipes = service.allRecipes().filter((r) => !r.builtIn);
            const cloudOnes = userRecipes.filter((r) => r.name === 'Cloud Recipe');
            expect(cloudOnes.length).toBe(1);
        });

        it('should preserve active recipe selection after sync', async () => {
            const recipe = service.saveRecipe('My Recipe', { ...DEFAULT_INPUTS });
            expect(service.activeId()).toBe(recipe.id);
            expect(recipe.id).toMatch(/^user-/);

            await loginUser(authService);

            vi.spyOn(apiService, 'get').mockResolvedValue([]);
            vi.spyOn(apiService, 'post').mockResolvedValue({
                recipe: { id: 42, name: 'My Recipe', inputs: DEFAULT_INPUTS },
            });

            await service.syncToCloud();

            expect(service.activeId()).toBe('cloud-42');
            expect(service.activeRecipe()?.name).toBe('My Recipe');
        });

        it('should not upload recipes with skipUpload flag', async () => {
            service.saveRecipe('Skipped', { ...DEFAULT_INPUTS });
            service.skipUploadForLocalRecipes();

            await loginUser(authService);

            vi.spyOn(apiService, 'get').mockResolvedValue([]);
            const postSpy = vi.spyOn(apiService, 'post');

            await service.syncToCloud();

            expect(postSpy).not.toHaveBeenCalled();
            const userRecipes = service.allRecipes().filter((r) => !r.builtIn);
            expect(userRecipes.some((r) => r.name === 'Skipped')).toBe(true);
            expect(userRecipes[0].id).toMatch(/^user-/);
        });

        it('should not upload local recipes when uploadLocal is false', async () => {
            service.saveRecipe('Keep Local', { ...DEFAULT_INPUTS });
            await loginUser(authService);

            vi.spyOn(apiService, 'get').mockResolvedValue([]);
            const postSpy = vi.spyOn(apiService, 'post');

            await service.syncToCloud(false);

            expect(postSpy).not.toHaveBeenCalled();
            const userRecipes = service.allRecipes().filter((r) => !r.builtIn);
            expect(userRecipes[0].id).toMatch(/^user-/);
        });

        it('should use last-write-wins: local newer pushes to cloud', async () => {
            // Set up a cloud recipe locally with a newer updatedAt
            localStorage.setItem(
                'breadCalcUserRecipes',
                JSON.stringify([
                    {
                        id: 'cloud-10',
                        name: 'Local Version',
                        builtIn: false,
                        inputs: { ...DEFAULT_INPUTS, hydrationPct: 80 },
                        updatedAt: '2025-06-01T00:00:00.000Z',
                    },
                ]),
            );
            resetServices();
            await loginUser(authService);

            vi.spyOn(apiService, 'get').mockResolvedValue([
                {
                    id: 10,
                    name: 'Cloud Version',
                    inputs: { ...DEFAULT_INPUTS, hydrationPct: 65 },
                    is_default: 0,
                    updated_at: '2025-01-01T00:00:00.000Z',
                },
            ]);
            const putSpy = vi.spyOn(apiService, 'put').mockResolvedValue({});

            await service.syncToCloud();

            expect(putSpy).toHaveBeenCalledWith('/recipes/10', {
                name: 'Local Version',
                inputs: { ...DEFAULT_INPUTS, hydrationPct: 80 },
            });
            const recipe = service.allRecipes().find((r) => r.id === 'cloud-10');
            expect(recipe?.name).toBe('Local Version');
        });

        it('should use last-write-wins: cloud newer replaces local', async () => {
            localStorage.setItem(
                'breadCalcUserRecipes',
                JSON.stringify([
                    {
                        id: 'cloud-10',
                        name: 'Old Local',
                        builtIn: false,
                        inputs: { ...DEFAULT_INPUTS, hydrationPct: 60 },
                        updatedAt: '2025-01-01T00:00:00.000Z',
                    },
                ]),
            );
            resetServices();
            await loginUser(authService);

            vi.spyOn(apiService, 'get').mockResolvedValue([
                {
                    id: 10,
                    name: 'Newer Cloud',
                    inputs: { ...DEFAULT_INPUTS, hydrationPct: 75 },
                    is_default: 0,
                    updated_at: '2025-06-01T00:00:00.000Z',
                },
            ]);

            await service.syncToCloud();

            const recipe = service.allRecipes().find((r) => r.id === 'cloud-10');
            expect(recipe?.name).toBe('Newer Cloud');
            expect(recipe?.inputs.hydrationPct).toBe(75);
        });

        it('should remove locally if recipe deleted on server', async () => {
            localStorage.setItem(
                'breadCalcUserRecipes',
                JSON.stringify([
                    {
                        id: 'cloud-10',
                        name: 'Server Deleted',
                        builtIn: false,
                        inputs: DEFAULT_INPUTS,
                    },
                ]),
            );
            resetServices();
            await loginUser(authService);

            // Cloud returns empty — recipe was deleted on server
            vi.spyOn(apiService, 'get').mockResolvedValue([]);

            await service.syncToCloud();

            const userRecipes = service.allRecipes().filter((r) => !r.builtIn);
            expect(userRecipes.length).toBe(0);
        });

        it('should replay pending deletes at start of sync', async () => {
            localStorage.setItem(
                'breadCalcPendingDeletes',
                JSON.stringify([
                    { type: 'recipe', cloudId: 77, deletedAt: '2025-01-01T00:00:00Z' },
                ]),
            );
            await loginUser(authService);

            const deleteSpy = vi.spyOn(apiService, 'delete').mockResolvedValue(undefined);
            vi.spyOn(apiService, 'get').mockResolvedValue([]);

            await service.syncToCloud();

            expect(deleteSpy).toHaveBeenCalledWith('/recipes/77');
            const pending = JSON.parse(localStorage.getItem('breadCalcPendingDeletes') ?? '[]');
            expect(pending.some((d: { cloudId: number }) => d.cloudId === 77)).toBe(false);
        });

        it('should keep pending delete if replay fails', async () => {
            localStorage.setItem(
                'breadCalcPendingDeletes',
                JSON.stringify([
                    { type: 'recipe', cloudId: 88, deletedAt: '2025-01-01T00:00:00Z' },
                ]),
            );
            await loginUser(authService);

            vi.spyOn(apiService, 'delete').mockRejectedValue(new Error('Fail'));
            vi.spyOn(apiService, 'get').mockResolvedValue([]);

            await service.syncToCloud();

            const pending = JSON.parse(localStorage.getItem('breadCalcPendingDeletes') ?? '[]');
            expect(pending.some((d: { cloudId: number }) => d.cloudId === 88)).toBe(true);
        });

        it('should not re-enter sync while already syncing', async () => {
            await loginUser(authService);

            let getCallCount = 0;
            vi.spyOn(apiService, 'get').mockImplementation(async () => {
                getCallCount++;
                await new Promise((r) => setTimeout(r, 50));
                return [];
            });

            const p1 = service.syncToCloud();
            const p2 = service.syncToCloud();
            await Promise.all([p1, p2]);

            expect(getCallCount).toBe(1);
        });
    });

    describe('uploadRecipe', () => {
        it('should upload a local recipe to cloud', async () => {
            const recipe = service.saveRecipe('Upload Me', { ...DEFAULT_INPUTS });
            await loginUser(authService);

            vi.spyOn(apiService, 'post').mockResolvedValue({
                recipe: { id: 50, name: 'Upload Me', inputs: DEFAULT_INPUTS },
            });

            await service.uploadRecipe(recipe.id);

            const uploaded = service.allRecipes().find((r) => r.id === 'cloud-50');
            expect(uploaded?.name).toBe('Upload Me');
        });

        it('should preserve active selection after manual upload', async () => {
            const recipe = service.saveRecipe('Active Upload', { ...DEFAULT_INPUTS });
            expect(service.activeId()).toBe(recipe.id);

            await loginUser(authService);

            vi.spyOn(apiService, 'post').mockResolvedValue({
                recipe: { id: 60, name: 'Active Upload', inputs: DEFAULT_INPUTS },
            });

            await service.uploadRecipe(recipe.id);

            expect(service.activeId()).toBe('cloud-60');
        });

        it('should not upload if already a cloud recipe', async () => {
            await loginUser(authService);

            const postSpy = vi.spyOn(apiService, 'post');
            await service.uploadRecipe('cloud-10');
            expect(postSpy).not.toHaveBeenCalled();
        });
    });
});
