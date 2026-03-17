import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { CompareComponent } from './compare';

describe('CompareComponent', () => {
    beforeEach(() => {
        localStorage.clear();
        vi.stubGlobal(
            'fetch',
            vi.fn(() => Promise.resolve(new Response(null, { status: 401 }))),
        );

        TestBed.configureTestingModule({
            imports: [CompareComponent],
        });
    });

    afterEach(() => {
        vi.restoreAllMocks();
        localStorage.clear();
    });

    it('should create the component', () => {
        const fixture = TestBed.createComponent(CompareComponent);
        const component = fixture.componentInstance;
        expect(component).toBeTruthy();
    });

    it('should start with no session selected', () => {
        const fixture = TestBed.createComponent(CompareComponent);
        const component = fixture.componentInstance;
        expect(component.sessionIdA()).toBe('');
        expect(component.sessionIdB()).toBe('');
    });

    it('should inject i18n service', () => {
        const fixture = TestBed.createComponent(CompareComponent);
        const component = fixture.componentInstance;
        expect(component.i18n).toBeTruthy();
    });

    it('should have empty sessions list initially', () => {
        const fixture = TestBed.createComponent(CompareComponent);
        const component = fixture.componentInstance;
        expect(component.allSessions().length).toBe(0);
    });

    it('should produce no rows when no sessions selected', () => {
        const fixture = TestBed.createComponent(CompareComponent);
        const component = fixture.componentInstance;
        expect(component.rows()).toEqual([]);
    });
});
