import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { ActivatedRoute, Router } from '@angular/router';
import { BakingSessionComponent } from './baking-session';

describe('BakingSessionComponent', () => {
    beforeEach(() => {
        localStorage.clear();
        vi.stubGlobal(
            'fetch',
            vi.fn(() => Promise.resolve(new Response(null, { status: 401 }))),
        );

        TestBed.configureTestingModule({
            imports: [BakingSessionComponent],
            providers: [
                {
                    provide: Router,
                    useValue: { navigate: vi.fn() },
                },
                {
                    provide: ActivatedRoute,
                    useValue: { snapshot: { paramMap: new Map() } },
                },
            ],
        });
    });

    afterEach(() => {
        vi.restoreAllMocks();
        localStorage.clear();
    });

    it('should create the component', () => {
        const fixture = TestBed.createComponent(BakingSessionComponent);
        const component = fixture.componentInstance;
        expect(component).toBeTruthy();
    });

    it('should inject i18n service', () => {
        const fixture = TestBed.createComponent(BakingSessionComponent);
        const component = fixture.componentInstance;
        expect(component.i18n).toBeTruthy();
    });

    it('should inject auth service', () => {
        const fixture = TestBed.createComponent(BakingSessionComponent);
        const component = fixture.componentInstance;
        expect(component.auth).toBeTruthy();
    });

    it('should start with no delete confirmation', () => {
        const fixture = TestBed.createComponent(BakingSessionComponent);
        const component = fixture.componentInstance;
        expect(component.deleteConfirmId()).toBeNull();
    });

    it('should truncate long notes', () => {
        const fixture = TestBed.createComponent(BakingSessionComponent);
        const component = fixture.componentInstance;
        expect(component.truncateNotes(null)).toBe('');
        expect(component.truncateNotes('short')).toBe('short');
        const long = 'a'.repeat(80);
        expect(component.truncateNotes(long)).toBe('a'.repeat(60) + '…');
    });

    it('should set deleteConfirmId on requestDeleteSession', () => {
        const fixture = TestBed.createComponent(BakingSessionComponent);
        const component = fixture.componentInstance;
        const event = new MouseEvent('click');
        vi.spyOn(event, 'stopPropagation');
        component.requestDeleteSession(42, event);
        expect(component.deleteConfirmId()).toBe(42);
        expect(event.stopPropagation).toHaveBeenCalled();
    });

    it('should clear deleteConfirmId on cancel', () => {
        const fixture = TestBed.createComponent(BakingSessionComponent);
        const component = fixture.componentInstance;
        component.requestDeleteSession(42, new MouseEvent('click'));
        component.onDeleteCancelled();
        expect(component.deleteConfirmId()).toBeNull();
    });

    it('should start with lightbox closed', () => {
        const fixture = TestBed.createComponent(BakingSessionComponent);
        const component = fixture.componentInstance;
        expect(component.lightboxOpen()).toBe(false);
        expect(component.lightboxIndex()).toBe(0);
    });

    it('should open lightbox at given index', () => {
        const fixture = TestBed.createComponent(BakingSessionComponent);
        const component = fixture.componentInstance;
        component.openLightbox(2);
        expect(component.lightboxOpen()).toBe(true);
        expect(component.lightboxIndex()).toBe(2);
    });

    it('should close lightbox', () => {
        const fixture = TestBed.createComponent(BakingSessionComponent);
        const component = fixture.componentInstance;
        component.openLightbox(1);
        component.closeLightbox();
        expect(component.lightboxOpen()).toBe(false);
    });

    it('should close lightbox when closing detail', () => {
        const fixture = TestBed.createComponent(BakingSessionComponent);
        const component = fixture.componentInstance;
        component.openLightbox(1);
        component.closeDetail();
        expect(component.lightboxOpen()).toBe(false);
        expect(component.selectedSession()).toBeNull();
    });
});
