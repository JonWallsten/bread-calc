/**
 * Pure state machine for the auto-hide topbar scroll behaviour.
 *
 * Rules:
 *  - Scroll 100 px DOWN from the anchor → hide.
 *  - Scroll 100 px UP from the anchor → show.
 *  - Direction reversal resets the anchor to the current position.
 *  - Reaching y ≤ 0 always shows the bar and resets all state.
 */

export interface ScrollState {
    hidden: boolean;
    /** Y position where the last state change (or direction change) happened. */
    changeY: number;
    wasScrollingDown: boolean;
    lastY: number;
}

export const INITIAL_SCROLL_STATE: ScrollState = {
    hidden: false,
    changeY: 0,
    wasScrollingDown: false,
    lastY: 0,
};

export const HIDE_THRESHOLD = 100;
export const SHOW_THRESHOLD = 100;

export function nextScrollState(state: ScrollState, y: number): ScrollState {
    if (y <= 0) {
        return { ...INITIAL_SCROLL_STATE };
    }

    const scrollingDown = y > state.lastY;
    let { hidden, changeY } = state;

    // Reset anchor when the scroll direction reverses.
    if (scrollingDown !== state.wasScrollingDown) {
        changeY = y;
    }

    if (scrollingDown && !hidden && y - changeY >= HIDE_THRESHOLD) {
        hidden = true;
        changeY = y;
    } else if (!scrollingDown && hidden && changeY - y >= SHOW_THRESHOLD) {
        hidden = false;
        changeY = y;
    }

    return { hidden, changeY, wasScrollingDown: scrollingDown, lastY: y };
}
