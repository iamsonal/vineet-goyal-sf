import { getApexId, validateAdapterConfig } from '../index';

describe('getApexId', () => {
    it('returns correct cache key for regular param value', () => {
        const expectedKey = ':TestController:getString:false:{"foo":"bar","name":"LWC"}';
        expect(
            getApexId(null, 'TestController', 'getString', false, { name: 'LWC', foo: 'bar' })
        ).toBe(expectedKey);
    });

    it('returns correct cache key for regular param value containing null values', () => {
        const expectedKey = ':TestController:getString:false:{"foo":null,"name":"LWC"}';
        expect(
            getApexId(null, 'TestController', 'getString', false, { name: 'LWC', foo: null })
        ).toBe(expectedKey);
    });

    it('returns correct cache key for undefined param value', () => {
        const expectedKey = ':TestController:getString:false:';
        expect(getApexId(null, 'TestController', 'getString', false, undefined)).toBe(expectedKey);
    });

    it('returns correct cache key for empty object param value', () => {
        const expectedKey = ':TestController:getString:false:';
        expect(getApexId(null, 'TestController', 'getString', false, {})).toBe(expectedKey);
    });

    it('returns correct cache key for nested param value', () => {
        const expectedKey =
            ':TestController:getString:false:{"a":{"b":1,"c":{"d":2}},"foo":"bar","name":"LWC"}';
        expect(
            getApexId(null, 'TestController', 'getString', false, {
                name: 'LWC',
                foo: 'bar',
                a: { b: 1, c: { d: 2 } },
            })
        ).toBe(expectedKey);
    });

    it('returns the same correct cache key for nested params with different key ordering', () => {
        const expectedKey =
            ':TestController:getString:false:{"a":{"b":1,"c":{"d":2}},"foo":"bar","name":"LWC"}';
        expect(
            getApexId(null, 'TestController', 'getString', false, {
                foo: 'bar',
                a: { c: { d: 2 }, b: 1 },
                name: 'LWC',
            })
        ).toBe(expectedKey);
    });
});

describe('validateAdapterConfig', () => {
    it('returns true when no config provided', () => {
        expect(validateAdapterConfig()).toBe(true);
    });

    it('returns true when empty config provided', () => {
        expect(validateAdapterConfig({})).toBe(true);
    });

    it('returns true when config contains null value', () => {
        const target = { key: null };
        expect(validateAdapterConfig(target)).toBe(true);
    });

    it('returns false when config contains undefined value', () => {
        const target = { key: undefined };
        expect(validateAdapterConfig(target)).toBe(false);
    });
});
