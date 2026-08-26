import { TestBed } from '@angular/core/testing';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { CalcResult, CalcService } from '../calc.service';
import { DEFAULT_INPUTS } from '../config';
import { InstructionsComponent } from './instructions';

describe('InstructionsComponent flour scald', () => {
    beforeEach(() => {
        localStorage.clear();
        TestBed.configureTestingModule({ imports: [InstructionsComponent] });
    });

    afterEach(() => localStorage.clear());

    function render(scaldEnabled: boolean) {
        const result = new CalcService().calculate({ ...DEFAULT_INPUTS, scaldEnabled });
        if ('error' in result) throw new Error(result.error);

        const fixture = TestBed.createComponent(InstructionsComponent);
        fixture.componentInstance.i18n.setLang('sv');
        fixture.componentRef.setInput('data', result as CalcResult);
        fixture.detectChanges();
        return fixture;
    }

    it('adds a preparation step with exact flour and water amounts', () => {
        const fixture = render(true);
        const firstStep = fixture.nativeElement.querySelector('.instruction-card') as HTMLElement;

        expect(firstStep.textContent).toContain('Förbered skållning');
        expect(firstStep.textContent).toContain('Koka upp');
        expect(firstStep.textContent).toContain('svalna helt till rumstemperatur');
        expect(firstStep.textContent).not.toContain('~0 min');
        fixture.destroy();
    });

    it('adds the cooled scald to the main-dough mixing instruction', () => {
        const fixture = render(true);
        expect(fixture.nativeElement.textContent).toContain('avsvalnad skållning');
        fixture.destroy();
    });

    it('does not add a scald step when the option is disabled', () => {
        const fixture = render(false);
        expect(fixture.nativeElement.textContent).not.toContain('Förbered skållning');
        fixture.destroy();
    });
});
