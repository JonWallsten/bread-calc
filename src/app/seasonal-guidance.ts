/** October through April, using JavaScript's zero-based month number. */
export function isColdSeasonMonth(month: number): boolean {
    return month >= 0 && month <= 11 && (month >= 9 || month <= 3);
}
