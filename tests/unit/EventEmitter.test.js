import { describe, it, expect, vi } from 'vitest';
import { EventEmitter } from '../../src/js/utils/EventEmitter.js';

describe('EventEmitter', () => {
    it('should register and emit events', () => {
        const emitter = new EventEmitter();
        const callback = vi.fn();
        
        emitter.on('test-event', callback);
        emitter.emit('test-event', { data: 123 });
        
        expect(callback).toHaveBeenCalledWith({ data: 123 });
    });

    it('should support multiple listeners for the same event', () => {
        const emitter = new EventEmitter();
        const cb1 = vi.fn();
        const cb2 = vi.fn();
        
        emitter.on('event', cb1);
        emitter.on('event', cb2);
        emitter.emit('event', 'foo');
        
        expect(cb1).toHaveBeenCalledWith('foo');
        expect(cb2).toHaveBeenCalledWith('foo');
    });

    it('should remove listeners with off()', () => {
        const emitter = new EventEmitter();
        const callback = vi.fn();
        
        emitter.on('event', callback);
        emitter.off('event', callback);
        emitter.emit('event', 'foo');
        
        expect(callback).not.toHaveBeenCalled();
    });

    it('should not fail when emitting events with no listeners', () => {
        const emitter = new EventEmitter();
        expect(() => emitter.emit('non-existent', 'data')).not.toThrow();
    });
});
