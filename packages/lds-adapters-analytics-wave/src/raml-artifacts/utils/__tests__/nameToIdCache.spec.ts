import { NameToIdCache } from '../nameToIdCache';

describe('nameToIdCache', () => {
    const name = 'TheName';
    const id = 'some-id';

    it('get() returns on undefined on missing', () => {
        const cache = new NameToIdCache();
        expect(cache.get('foo')).toBeUndefined();
    });

    it('is case-insensitive for name', () => {
        const cache = new NameToIdCache();
        cache.set(name, id);
        expect(cache.get(name)).toEqual(id);
        expect(cache.get(name.toUpperCase())).toEqual(id);
        expect(cache.get(name.toLowerCase())).toEqual(id);
    });

    it('remove() removes name', () => {
        const cache = new NameToIdCache();
        cache.set(name, id);
        cache.remove(name);
        expect(cache.get(name)).toBeUndefined();
    });

    it('remove() removes id', () => {
        const cache = new NameToIdCache();
        cache.set(name, id);
        cache.remove(id);
        expect(cache.get(name)).toBeUndefined();
    });

    it('clear() clears', () => {
        const cache = new NameToIdCache();
        cache.set(name, id);
        cache.clear();
        expect(cache.get(name)).toBeUndefined();
    });
});
