import { LRUCache } from '../utils/lru-cache';

describe('LRUCache', () => {
    it('should only allow an maximum number of entries into it', () => {
        const lru = new LRUCache(3);
        lru.set('key1', 1);
        lru.set('key2', 2);
        lru.set('key3', 3);
        lru.set('key4', 4);
        lru.set('key5', 5);
        lru.set('key6', 6);
        expect(lru.get('key1')).toBeUndefined();
        expect(lru.get('key2')).toBeUndefined();
        expect(lru.get('key3')).toBeUndefined();
        expect(lru.get('key4')).toEqual(4);
        expect(lru.get('key5')).toEqual(5);
        expect(lru.get('key6')).toEqual(6);
    });

    it('should evict the least recently used values when max size is reached, determined by get()', () => {
        const lru = new LRUCache(3);
        lru.set('key1', 1);
        lru.set('key2', 2);
        lru.set('key3', 3);
        lru.get('key1');
        lru.set('key4', 4);
        lru.set('key5', 5);
        expect(lru.get('key1')).toEqual(1);
        expect(lru.get('key2')).toBeUndefined();
        expect(lru.get('key3')).toBeUndefined();
        expect(lru.get('key4')).toEqual(4);
        expect(lru.get('key5')).toEqual(5);
    });

    it('should evict the least recently used values when max size is reached, determined by set()', () => {
        const lru = new LRUCache(3);
        lru.set('key1', 1);
        lru.set('key2', 2);
        lru.set('key3', 3);
        lru.set('key1', 'abc');
        lru.set('key4', 4);
        lru.set('key5', 5);
        expect(lru.get('key1')).toBe('abc');
        expect(lru.get('key2')).toBeUndefined();
    });
});
