import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { t, setLanguage, getLanguage } from '../../src/js/utils/i18n.js';

describe('i18n Utility', () => {
    beforeEach(() => {
        // Reset to default language before each test
        setLanguage('en');
        document.body.innerHTML = '';
    });

    it('should return the correct translation for an existing key', () => {
        expect(t('victory')).toBe('Victory!');
    });

    it('should return the key itself if no translation is found', () => {
        expect(t('nonexistent_key')).toBe('nonexistent_key');
    });

    it('should switch languages correctly', () => {
        setLanguage('es');
        expect(getLanguage()).toBe('es');
        expect(t('victory')).toBe('¡Victoria!');
    });

    it('should update DOM elements with data-i18n attribute', () => {
        document.body.innerHTML = '<div data-i18n="score">Score</div>';
        setLanguage('es');
        
        const el = document.querySelector('[data-i18n="score"]');
        expect(el.innerHTML).toBe('Puntuación');
    });

    it('should update input placeholders with data-i18n-placeholder attribute', () => {
        document.body.innerHTML = '<input data-i18n-placeholder="roomPlaceholder" placeholder="Old">';
        setLanguage('es');
        
        const input = document.querySelector('[data-i18n-placeholder="roomPlaceholder"]');
        expect(input.getAttribute('placeholder')).toBe('Ej: sala-secreta...');
    });

    it('should dispatch languageChanged event on window', () => {
        const spy = vi.fn();
        window.addEventListener('languageChanged', spy);
        
        setLanguage('es');
        expect(spy).toHaveBeenCalled();
    });
});
