import { describe, it, expect, beforeEach } from 'vitest';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ConfirmDialogComponent } from './confirm-dialog';

describe('ConfirmDialogComponent', () => {
    let fixture: ComponentFixture<ConfirmDialogComponent>;
    let component: ConfirmDialogComponent;

    beforeEach(() => {
        TestBed.configureTestingModule({});
        fixture = TestBed.createComponent(ConfirmDialogComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });

    it('should display custom title and message', () => {
        fixture.componentRef.setInput('title', 'Confirm?');
        fixture.componentRef.setInput('message', 'Are you sure?');
        fixture.detectChanges();

        const el: HTMLElement = fixture.nativeElement;
        expect(el.querySelector('.dialog-title')?.textContent).toContain('Confirm?');
        expect(el.querySelector('.dialog-message')?.textContent).toContain('Are you sure?');
    });

    it('should display custom button labels', () => {
        fixture.componentRef.setInput('confirmLabel', 'Yes');
        fixture.componentRef.setInput('cancelLabel', 'No');
        fixture.detectChanges();

        const el: HTMLElement = fixture.nativeElement;
        const buttons = el.querySelectorAll('button');
        expect(buttons[0].textContent?.trim()).toBe('No');
        expect(buttons[1].textContent?.trim()).toBe('Yes');
    });

    it('should emit confirmed on confirm click', () => {
        let emitted = false;
        component.confirmed.subscribe(() => (emitted = true));

        const el: HTMLElement = fixture.nativeElement;
        el.querySelector<HTMLButtonElement>('.dialog-btn--primary')!.click();

        expect(emitted).toBe(true);
    });

    it('should emit cancelled on cancel click', () => {
        let emitted = false;
        component.cancelled.subscribe(() => (emitted = true));

        const el: HTMLElement = fixture.nativeElement;
        el.querySelector<HTMLButtonElement>('.dialog-btn--secondary')!.click();

        expect(emitted).toBe(true);
    });

    it('should emit cancelled on backdrop click', () => {
        let emitted = false;
        component.cancelled.subscribe(() => (emitted = true));

        const overlay = fixture.nativeElement.querySelector('.dialog-overlay') as HTMLElement;
        overlay.click();

        expect(emitted).toBe(true);
    });

    it('should not emit cancelled when clicking inside the card', () => {
        let emitted = false;
        component.cancelled.subscribe(() => (emitted = true));

        const card = fixture.nativeElement.querySelector('.dialog-card') as HTMLElement;
        card.click();

        expect(emitted).toBe(false);
    });
});
