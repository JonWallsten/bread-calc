import { describe, expect, it } from 'vitest';
import { isColdSeasonMonth } from './seasonal-guidance';

describe('Cold-season guidance', () => {
    it.each([9, 10, 11, 0, 1, 2, 3])('is shown during month index %i', (month) => {
        expect(isColdSeasonMonth(month)).toBe(true);
    });

    it.each([4, 5, 6, 7, 8])('is hidden during month index %i', (month) => {
        expect(isColdSeasonMonth(month)).toBe(false);
    });

    it('rejects values outside the JavaScript month range', () => {
        expect(isColdSeasonMonth(-1)).toBe(false);
        expect(isColdSeasonMonth(12)).toBe(false);
    });
});
