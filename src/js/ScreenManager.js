/**
 * ScreenManager.js
 * Handles transitions between different overlays and the game area.
 */
export const ScreenManager = {
    // List of all overlay IDs
    screens: [
        'login-overlay',
        'mode-selection-overlay',
        'lobby-overlay',
        'ai-overlay',
        'game-over-modal',
        'game-wrapper'
    ],

    /**
     * Shows a specific screen and hides all others.
     * @param {string} screenKey - The ID of the screen to show.
     */
    showScreen(screenKey) {
        // Overlays are mutual exclusive, except for game-over-modal which is on top of game-wrapper
        const isGameActive = screenKey === 'game-wrapper' || screenKey === 'game-over-modal' || screenKey === 'loading';

        this.screens.forEach(id => {
            const el = document.getElementById(id);
            if (!el) return;

            if (id === screenKey) {
                el.classList.remove('hidden');
            } else {
                // If we are in the game or showing the game over modal, don't hide the game-wrapper
                if (id === 'game-wrapper' && screenKey === 'game-over-modal') {
                    el.classList.remove('hidden');
                } else {
                    el.classList.add('hidden');
                }
            }
        });

        // Special handling for elements that aren't fullscreen overlays
        const topNav = document.getElementById('top-nav');
        const leaveBtn = document.getElementById('leave-btn');

        if (screenKey === 'login-overlay') {
            if (topNav) topNav.classList.add('hidden');
            if (leaveBtn) leaveBtn.classList.add('hidden');
        } else {
            if (topNav) topNav.classList.remove('hidden');
            
            if (isGameActive && screenKey !== 'game-over-modal') {
                if (leaveBtn) leaveBtn.classList.remove('hidden');
            } else {
                if (leaveBtn) leaveBtn.classList.add('hidden');
            }
        }
    },

    /**
     * Hides all overlays (modals).
     */
    hideAllModals() {
        this.screens.forEach(id => {
            if (id.includes('overlay') || id.includes('modal')) {
                const el = document.getElementById(id);
                if (el) el.classList.add('hidden');
            }
        });
    }
};
