import { describe, it, expect } from 'vitest';
import {
    nextScrollState,
    INITIAL_SCROLL_STATE,
    HIDE_THRESHOLD,
    SHOW_THRESHOLD,
    type ScrollState,
} from './scroll-state';

// Helper: run a sequence of Y positions through the state machine.
function scroll(positions: number[], initial = INITIAL_SCROLL_STATE): ScrollState {
    return positions.reduce((state, y) => nextScrollState(state, y), initial);
}

describe('nextScrollState – initial state', () => {
    it('starts visible', () => {
        expect(INITIAL_SCROLL_STATE.hidden).toBe(false);
    });

    it('scrolling to y=0 resets to initial', () => {
        const midState: ScrollState = {
            hidden: true,
            changeY: 200,
            wasScrollingDown: true,
            lastY: 200,
        };
        expect(nextScrollState(midState, 0)).toEqual(INITIAL_SCROLL_STATE);
    });

    it('negative y also resets to initial', () => {
        const midState: ScrollState = {
            hidden: true,
            changeY: 200,
            wasScrollingDown: true,
            lastY: 200,
        };
        expect(nextScrollState(midState, -5)).toEqual(INITIAL_SCROLL_STATE);
    });
});

describe('nextScrollState – hide on downward scroll', () => {
    it(`hides exactly at HIDE_THRESHOLD (${HIDE_THRESHOLD} px)`, () => {
        // Scroll in one shot from 0 to HIDE_THRESHOLD (direction change from false→true then flat)
        const s1 = nextScrollState(INITIAL_SCROLL_STATE, 1); // first scroll → sets anchor=1
        const s2 = nextScrollState(s1, 1 + HIDE_THRESHOLD); // 100 px later → should hide
        expect(s2.hidden).toBe(true);
    });

    it('does not hide at 99 px of downward scroll', () => {
        const s1 = nextScrollState(INITIAL_SCROLL_STATE, 1);
        const s2 = nextScrollState(s1, 99);
        expect(s2.hidden).toBe(false);
    });

    it('stays hidden while continuing to scroll down', () => {
        const after = scroll([1, 101, 200, 400, 800]);
        expect(after.hidden).toBe(true);
    });
});

describe('nextScrollState – show on upward scroll', () => {
    it(`shows after scrolling up ${SHOW_THRESHOLD} px from the peak`, () => {
        // Hide at y=101, then continue down to y=400, then scroll up 100 px.
        const s = scroll([1, 101]); // hidden at 101
        expect(s.hidden).toBe(true);
        const s2 = scroll([300, 400], s); // keep going down
        const s3 = nextScrollState(s2, 399); // start going up → anchor resets to 399
        const s4 = nextScrollState(s3, 299); // 100 px up from 399 → show
        expect(s4.hidden).toBe(false);
    });

    it('does not show at 99 px of upward scroll', () => {
        const s = scroll([1, 101, 400]);
        expect(s.hidden).toBe(true);
        const s2 = nextScrollState(s, 399); // direction flip → anchor resets to 399
        const s3 = nextScrollState(s2, 301); // only 98 px up
        expect(s3.hidden).toBe(true);
    });

    it('shows at exactly 100 px up regardless of absolute position', () => {
        // Hide, scroll way down to 2000, then scroll up exactly 100 px.
        const s = scroll([1, 101, 2000]);
        const s2 = nextScrollState(s, 1999); // flip → anchor=1999
        const s3 = nextScrollState(s2, 1899); // 100 px up → show
        expect(s3.hidden).toBe(false);
    });
});

describe('nextScrollState – direction reversal resets anchor', () => {
    it('requires a full HIDE_THRESHOLD after reversing back down', () => {
        // Scroll down 50 px (not enough to hide), reverse up, reverse down again.
        const s1 = nextScrollState(INITIAL_SCROLL_STATE, 1); // anchor=1
        const s2 = nextScrollState(s1, 50); // still down, 49 px
        const s3 = nextScrollState(s2, 30); // flip up → anchor=30
        const s4 = nextScrollState(s3, 31); // flip down → anchor=31
        const s5 = nextScrollState(s4, 130); // 99 px from 31 → still visible
        expect(s5.hidden).toBe(false);
        const s6 = nextScrollState(s5, 131); // 100 px from 31 → hide
        expect(s6.hidden).toBe(true);
    });

    it('requires a full SHOW_THRESHOLD after reversing back up', () => {
        const s = scroll([1, 101, 400]); // hidden
        const s2 = nextScrollState(s, 399); // flip up → anchor=399
        const s3 = nextScrollState(s2, 350); // 49 px up — still hidden
        const s4 = nextScrollState(s3, 360); // flip down → anchor=360
        const s5 = nextScrollState(s4, 359); // flip up → anchor=359
        const s6 = nextScrollState(s5, 260); // 99 px up — still hidden
        expect(s6.hidden).toBe(true);
        const s7 = nextScrollState(s6, 259); // 100 px up → show
        expect(s7.hidden).toBe(false);
    });
});

describe('nextScrollState – reset on reaching y=0', () => {
    it('shows header when user scrolls back to top while hidden', () => {
        const s = scroll([1, 101, 400]);
        expect(s.hidden).toBe(true);
        const s2 = nextScrollState(s, 0);
        expect(s2.hidden).toBe(false);
    });

    it('subsequent scrolling works normally after a to-top reset', () => {
        const hidden = scroll([1, 101]);
        const reset = nextScrollState(hidden, 0);
        const s2 = scroll([1, 101], reset);
        expect(s2.hidden).toBe(true);
    });
});
