import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { SaveBakeComponent } from './save-bake';
import { CalcResult } from '../calc.service';
import { DEFAULT_INPUTS } from '../config';

function mockResult(overrides: Partial<CalcResult> = {}): CalcResult {
    return {
        breadCount: 6,
        targetBallWeight: 90,
        targetDoughWeight: 540,
        yeastType: 'fresh',
        yeastTypeLabel: 'Fresh yeast',
        hydrationPct: 66,
        effectiveHydrationPct: 66,
        flourBlendAdjustment: 0,
        customHydrationAdjustment: 0,
        saltPct: 2,
        sugarPct: 2,
        oilPct: 2,
        milkPctOfWater: 0,
        starterWeight: 0,
        starterHydrationPct: 100,
        starterFlour: 0,
        starterWater: 0,
        totalHours: 8,
        roomTemp: 22,
        flourToAdd: 325.3,
        totalFlour: 325.3,
        totalWater: 214.7,
        waterToAdd: 214.7,
        milkToAdd: 0,
        saltToAdd: 6.5,
        sugarToAdd: 6.5,
        oilToAdd: 6.5,
        yeastToAdd: 2.1,
        chosenYeastPct: 0.65,
        finalDoughWeight: 559.5,
        actualPerBall: 93.3,
        prefermentedFlourPct: 0,
        mixMinutes: 35,
        bulkMinutes: 180,
        divideAndShapeMinutes: 10,
        benchRestMinutes: 15,
        finalProofMinutes: 50,
        preheatMinutes: 45,
        bakeMinutes: 15,
        fold1: 60,
        fold2: 120,
        freshPctFinal: 0.65,
        mixingMethod: 'manual',
        initialMixMinutes: 5,
        autolyseMinutes: 20,
        incorporationMinutes: 0,
        developmentMinutes: 10,
        mixerSpeedLow: '1',
        mixerSpeedLowMedium: '2–3',
        mixerSpeedMedium: '3–4',
        ...overrides,
    };
}

describe('SaveBakeComponent', () => {
    let component: SaveBakeComponent;

    beforeEach(() => {
        localStorage.clear();
        vi.stubGlobal(
            'fetch',
            vi.fn(() => Promise.resolve(new Response(null, { status: 401 }))),
        );

        TestBed.configureTestingModule({
            imports: [SaveBakeComponent],
        });

        const fixture = TestBed.createComponent(SaveBakeComponent);
        component = fixture.componentInstance;

        // Set required inputs
        fixture.componentRef.setInput('currentInputs', DEFAULT_INPUTS);
        fixture.componentRef.setInput('currentResults', mockResult());
    });

    afterEach(() => {
        vi.restoreAllMocks();
        localStorage.clear();
    });

    it('should create the component', () => {
        expect(component).toBeTruthy();
    });

    describe('todayDate', () => {
        it('should return date in YYYY-MM-DD format', () => {
            const date = (component as any).todayDate();
            expect(date).toMatch(/^\d{4}-\d{2}-\d{2}$/);
        });

        it('should return today', () => {
            const date = (component as any).todayDate();
            const now = new Date();
            const expected = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
            expect(date).toBe(expected);
        });
    });

    describe('openSaveForm', () => {
        it('should initialize signals with defaults', () => {
            component.openSaveForm();
            expect(component.showSaveForm()).toBe(true);
            expect(component.saveTitle()).toBe('');
            expect(component.saveNotes()).toBe('');
            expect(component.saveRating()).toBe(0);
            expect(component.saving()).toBe(false);
            expect(component.saved()).toBe(false);
            expect(component.adjustOpen()).toBe(false);
        });

        it('should set saveDate to today', () => {
            component.openSaveForm();
            expect(component.saveDate()).toMatch(/^\d{4}-\d{2}-\d{2}$/);
        });

        it('should clone current results into editedResults', () => {
            component.openSaveForm();
            const edited = component.editedResults()!;
            expect(edited).not.toBeNull();
            expect(edited.flourToAdd).toBe(325.3);
            expect(edited.waterToAdd).toBe(214.7);
        });

        it('should not share object reference with currentResults', () => {
            component.openSaveForm();
            const edited = component.editedResults()!;
            expect(edited).not.toBe(component.currentResults());
        });

        it('should initialize empty blend weights when no blend', () => {
            component.openSaveForm();
            expect(component.editedBlendWeights()).toEqual({});
        });

        it('should calculate blend weights when blend rows exist', () => {
            const fixture = TestBed.createComponent(SaveBakeComponent);
            const comp = fixture.componentInstance;
            fixture.componentRef.setInput('currentInputs', DEFAULT_INPUTS);
            fixture.componentRef.setInput(
                'currentResults',
                mockResult({
                    flourToAdd: 636,
                    flourBlendRows: [
                        { flourId: 'caputo-nuvola', percent: 55 },
                        { flourId: 'manitoba-cream', percent: 30 },
                        { flourId: 'rustique', percent: 15 },
                    ],
                }),
            );

            comp.openSaveForm();
            const weights = comp.editedBlendWeights();
            expect(weights['caputo-nuvola']).toBe(350); // Math.round(636 * 55 / 100)
            expect(weights['manitoba-cream']).toBe(191); // Math.round(636 * 30 / 100)
            expect(weights['rustique']).toBe(95); // Math.round(636 * 15 / 100)
        });
    });

    describe('updateEditedField', () => {
        beforeEach(() => {
            component.openSaveForm();
        });

        it('should update a numeric field', () => {
            component.updateEditedField('waterToAdd', '200');
            expect(component.editedResults()!.waterToAdd).toBe(200);
        });

        it('should reject NaN input', () => {
            const before = component.editedResults()!.waterToAdd;
            component.updateEditedField('waterToAdd', 'abc');
            expect(component.editedResults()!.waterToAdd).toBe(before);
        });

        it('should reject negative input', () => {
            const before = component.editedResults()!.saltToAdd;
            component.updateEditedField('saltToAdd', '-5');
            expect(component.editedResults()!.saltToAdd).toBe(before);
        });

        it('should accept zero', () => {
            component.updateEditedField('sugarToAdd', '0');
            expect(component.editedResults()!.sugarToAdd).toBe(0);
        });

        it('should accept decimal values', () => {
            component.updateEditedField('yeastToAdd', '1.8');
            expect(component.editedResults()!.yeastToAdd).toBe(1.8);
        });

        it('should do nothing if editedResults is null', () => {
            component.editedResults.set(null);
            expect(() => component.updateEditedField('waterToAdd', '100')).not.toThrow();
        });
    });

    describe('updateBlendWeight', () => {
        let comp: SaveBakeComponent;

        beforeEach(() => {
            const fixture = TestBed.createComponent(SaveBakeComponent);
            comp = fixture.componentInstance;
            fixture.componentRef.setInput('currentInputs', DEFAULT_INPUTS);
            fixture.componentRef.setInput(
                'currentResults',
                mockResult({
                    flourToAdd: 636,
                    flourBlendRows: [
                        { flourId: 'caputo-nuvola', percent: 55 },
                        { flourId: 'manitoba-cream', percent: 30 },
                        { flourId: 'rustique', percent: 15 },
                    ],
                }),
            );
            comp.openSaveForm();
        });

        it('should update individual flour weight', () => {
            comp.updateBlendWeight('caputo-nuvola', '400');
            expect(comp.editedBlendWeights()['caputo-nuvola']).toBe(400);
        });

        it('should recalculate flourToAdd as sum of all blend weights', () => {
            // Initial: 350 + 191 + 95 = 636
            comp.updateBlendWeight('caputo-nuvola', '400');
            // Now: 400 + 191 + 95 = 686
            expect(comp.editedResults()!.flourToAdd).toBe(686);
        });

        it('should reject NaN', () => {
            const before = comp.editedBlendWeights()['caputo-nuvola'];
            comp.updateBlendWeight('caputo-nuvola', 'abc');
            expect(comp.editedBlendWeights()['caputo-nuvola']).toBe(before);
        });

        it('should reject negative values', () => {
            const before = comp.editedBlendWeights()['caputo-nuvola'];
            comp.updateBlendWeight('caputo-nuvola', '-10');
            expect(comp.editedBlendWeights()['caputo-nuvola']).toBe(before);
        });

        it('should accept zero', () => {
            comp.updateBlendWeight('rustique', '0');
            expect(comp.editedBlendWeights()['rustique']).toBe(0);
            // 350 + 191 + 0 = 541
            expect(comp.editedResults()!.flourToAdd).toBe(541);
        });

        it('should handle multiple sequential updates', () => {
            comp.updateBlendWeight('caputo-nuvola', '300');
            comp.updateBlendWeight('manitoba-cream', '200');
            comp.updateBlendWeight('rustique', '100');
            expect(comp.editedResults()!.flourToAdd).toBe(600);
        });
    });

    describe('getFlourName', () => {
        it('should return English name by default', () => {
            const name = component.getFlourName('bread-wheat');
            expect(name).toBeTruthy();
            expect(typeof name).toBe('string');
        });

        it('should return flourId for unknown flour', () => {
            const name = component.getFlourName('unknown-flour-xyz');
            expect(name).toBe('unknown-flour-xyz');
        });
    });

    describe('closeSaveForm', () => {
        it('should hide the form', () => {
            component.openSaveForm();
            component.closeSaveForm();
            expect(component.showSaveForm()).toBe(false);
        });

        it('should clear pending photos', () => {
            component.openSaveForm();
            component.pendingPhotos.set([new File([''], 'test.jpg')]);
            component.closeSaveForm();
            expect(component.pendingPhotos()).toEqual([]);
            expect(component.pendingPreviews()).toEqual([]);
        });
    });

    describe('setRating', () => {
        it('should update the rating', () => {
            component.setRating(4);
            expect(component.saveRating()).toBe(4);
        });
    });

    describe('confirmSave', () => {
        it('should use editedResults when saving', async () => {
            component.openSaveForm();
            component.updateEditedField('waterToAdd', '999');

            const createSpy = vi.spyOn((component as any).sessionService, 'createSession');
            createSpy.mockResolvedValue(null);

            await component.confirmSave();

            const passedResults = createSpy.mock.calls[0][1] as CalcResult;
            expect(passedResults.waterToAdd).toBe(999);
        });

        it('should pass bakedAt from saveDate', async () => {
            component.openSaveForm();
            component.saveDate.set('2026-03-15');

            const createSpy = vi.spyOn((component as any).sessionService, 'createSession');
            createSpy.mockResolvedValue(null);

            await component.confirmSave();

            const passedOptions = createSpy.mock.calls[0][2] as { bakedAt?: string };
            expect(passedOptions.bakedAt).toBe('2026-03-15');
        });

        it('should set saving flag during save', async () => {
            component.openSaveForm();

            const createSpy = vi.spyOn((component as any).sessionService, 'createSession');
            createSpy.mockResolvedValue(null);

            const promise = component.confirmSave();
            expect(component.saving()).toBe(true);

            await promise;
            expect(component.saving()).toBe(false);
        });
    });
});
