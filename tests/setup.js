import { vi } from 'vitest';

// Silence warnings about missing DOM elements during UI tests
const originalWarn = console.warn;
console.warn = (...args) => {
    if (args[0]?.includes('UIManager: Element not found') || 
        args[0]?.includes('ScreenManager: Screen ID not found')) {
        return;
    }
    originalWarn(...args);
};
