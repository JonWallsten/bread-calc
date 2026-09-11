import { TestBed } from '@angular/core/testing';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { CalcInputs, CalcResult, CalcService } from '../calc.service';
import { DEFAULT_INPUTS } from '../config';
import { InstructionsComponent } from './instructions';

describe('InstructionsComponent recipe details', () => {
    beforeEach(() => {
        localStorage.clear();
        TestBed.configureTestingModule({ imports: [InstructionsComponent] });
    });

    afterEach(() => localStorage.clear());

    function render(overrides: Partial<CalcInputs>) {
        const result = new CalcService().calculate({ ...DEFAULT_INPUTS, ...overrides });
        if ('error' in result) throw new Error(result.error);

        const fixture = TestBed.createComponent(InstructionsComponent);
        fixture.componentInstance.i18n.setLang('sv');
        fixture.componentRef.setInput('data', result as CalcResult);
        fixture.detectChanges();
        return fixture;
    }

    it('adds a preparation step with exact flour and water amounts', () => {
        const fixture = render({ scaldEnabled: true });
        const firstStep = fixture.nativeElement.querySelector('.instruction-card') as HTMLElement;

        expect(firstStep.textContent).toContain('Förbered skållning');
        expect(firstStep.textContent).toContain('Koka upp');
        expect(firstStep.textContent).toContain('svalna helt till rumstemperatur');
        expect(firstStep.textContent).not.toContain('~0 min');
        fixture.destroy();
    });

    it('adds the cooled scald to the main-dough mixing instruction', () => {
        const fixture = render({ scaldEnabled: true });
        expect(fixture.nativeElement.textContent).toContain('avsvalnad skållning');
        fixture.destroy();
    });

    it('does not add a scald step when the option is disabled', () => {
        const fixture = render({ scaldEnabled: false });
        expect(fixture.nativeElement.textContent).not.toContain('Förbered skållning');
        fixture.destroy();
    });

    it('adds buckwheat flour to the flour-mixing instruction', () => {
        const fixture = render({ buckwheatFlourPct: 15 });
        expect(fixture.nativeElement.textContent).toContain('bovetemjöl');
        fixture.destroy();
    });
});
