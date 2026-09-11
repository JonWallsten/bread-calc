import { TestBed } from '@angular/core/testing';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { CalcInputs, CalcResult, CalcService } from '../calc.service';
import { DEFAULT_INPUTS } from '../config';
import { ResultsComponent } from './results';

describe('ResultsComponent recipe details', () => {
    beforeEach(() => {
        localStorage.clear();
        TestBed.configureTestingModule({ imports: [ResultsComponent] });
    });

    afterEach(() => localStorage.clear());

    function render(overrides: Partial<CalcInputs>) {
        const result = new CalcService().calculate({ ...DEFAULT_INPUTS, ...overrides });
        if ('error' in result) throw new Error(result.error);

        const fixture = TestBed.createComponent(ResultsComponent);
        fixture.componentInstance.i18n.setLang('sv');
        fixture.componentRef.setInput('data', result as CalcResult);
        fixture.detectChanges();
        return fixture;
    }

    it('shows scald and main-dough allocations without changing total hydration', () => {
        const fixture = render({ scaldEnabled: true });
        const text = fixture.nativeElement.textContent as string;

        expect(text).toContain('Skållat mjöl');
        expect(text).toContain('Till skållningen');
        expect(text).toContain('Till huvuddegen');
        expect(text).toContain('total hydrering är oförändrad');
        fixture.destroy();
    });

    it('hides the scald summary for recipes without a scald', () => {
        const fixture = render({ scaldEnabled: false });
        const text = fixture.nativeElement.textContent as string;

        expect(text).not.toContain('Till skållningen');
        expect(text).not.toContain('Till huvuddegen');
        fixture.destroy();
    });

    it('shows buckwheat flour when it is included', () => {
        const fixture = render({ buckwheatFlourPct: 15 });
        expect(fixture.nativeElement.textContent).toContain('Bovetemjöl');
        fixture.destroy();
    });

    it('hides buckwheat flour when its percentage is zero', () => {
        const fixture = render({ buckwheatFlourPct: 0 });
        expect(fixture.nativeElement.textContent).not.toContain('Bovetemjöl');
        fixture.destroy();
    });

    it('shows a non-standard fermentation adjustment', () => {
        const fixture = render({ yeastAdjustmentPct: -20 });
        const text = fixture.nativeElement.textContent as string;

        expect(text).toContain('Jäsningsjustering');
        expect(text).toContain('−20%');
        fixture.destroy();
    });

    it('hides the fermentation adjustment when standard is selected', () => {
        const fixture = render({ yeastAdjustmentPct: 0 });
        expect(fixture.nativeElement.textContent).not.toContain('Jäsningsjustering');
        fixture.destroy();
    });
});
