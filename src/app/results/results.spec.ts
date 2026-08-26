import { TestBed } from '@angular/core/testing';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { CalcResult, CalcService } from '../calc.service';
import { DEFAULT_INPUTS } from '../config';
import { ResultsComponent } from './results';

describe('ResultsComponent flour scald', () => {
    beforeEach(() => {
        localStorage.clear();
        TestBed.configureTestingModule({ imports: [ResultsComponent] });
    });

    afterEach(() => localStorage.clear());

    function render(scaldEnabled: boolean) {
        const result = new CalcService().calculate({ ...DEFAULT_INPUTS, scaldEnabled });
        if ('error' in result) throw new Error(result.error);

        const fixture = TestBed.createComponent(ResultsComponent);
        fixture.componentInstance.i18n.setLang('sv');
        fixture.componentRef.setInput('data', result as CalcResult);
        fixture.detectChanges();
        return fixture;
    }

    it('shows scald and main-dough allocations without changing total hydration', () => {
        const fixture = render(true);
        const text = fixture.nativeElement.textContent as string;

        expect(text).toContain('Skållat mjöl');
        expect(text).toContain('Till skållningen');
        expect(text).toContain('Till huvuddegen');
        expect(text).toContain('total hydrering är oförändrad');
        fixture.destroy();
    });

    it('hides the scald summary for recipes without a scald', () => {
        const fixture = render(false);
        const text = fixture.nativeElement.textContent as string;

        expect(text).not.toContain('Till skållningen');
        expect(text).not.toContain('Till huvuddegen');
        fixture.destroy();
    });
});
