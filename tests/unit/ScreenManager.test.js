import { describe, it, expect, beforeEach } from 'vitest';
import { ScreenManager } from '../../src/js/ui/ScreenManager.js';

describe('ScreenManager', () => {
    beforeEach(() => {
        // Setup DOM for ScreenManager
        document.body.innerHTML = `
            <div id="login-overlay" class="hidden"></div>
            <div id="mode-selection-overlay" class="hidden"></div>
            <div id="lobby-overlay" class="hidden"></div>
            <div id="ai-overlay" class="hidden"></div>
            <div id="game-over-modal" class="hidden"></div>
            <div id="game-wrapper" class="hidden"></div>
            <div id="top-nav" class="hidden"></div>
            <div id="leave-btn" class="hidden"></div>
            <div id="floating-links" class="hidden"></div>
        `;
    });

    it('should show the requested screen and hide others', () => {
        ScreenManager.showScreen('lobby-overlay');
        
        expect(document.getElementById('lobby-overlay').classList.contains('hidden')).toBe(false);
        expect(document.getElementById('login-overlay').classList.contains('hidden')).toBe(true);
    });

    it('should keep game-wrapper visible when showing game-over-modal', () => {
        ScreenManager.showScreen('game-wrapper');
        ScreenManager.showScreen('game-over-modal');
        
        expect(document.getElementById('game-over-modal').classList.contains('hidden')).toBe(false);
        expect(document.getElementById('game-wrapper').classList.contains('hidden')).toBe(false);
    });

    it('should handle special visibility for floating-links', () => {
        ScreenManager.showScreen('lobby-overlay');
        expect(document.getElementById('floating-links').classList.contains('hidden')).toBe(false);
        
        ScreenManager.showScreen('game-wrapper');
        expect(document.getElementById('floating-links').classList.contains('hidden')).toBe(true);
    });

    it('should hide all modals', () => {
        const lobby = document.getElementById('lobby-overlay');
        lobby.classList.remove('hidden');
        
        ScreenManager.hideAllModals();
        expect(lobby.classList.contains('hidden')).toBe(true);
    });
});
