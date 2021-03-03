import { toArray, isArrayOfNonEmptyStrings, dedupe, difference } from '../utils';

describe('difference', () => {
    it('should return entries from source that do not appear in compare array', () => {
        const source = ['a', 'b', 'c', 'e'];
        const compare = ['b', 'c', 'd'];
        expect(difference(source, compare)).toEqual(['a', 'e']);
    });

    it('should return all entries from source when compare is empty', () => {
        const source = ['a', 'b', 'c', 'e'];
        const compare: string[] = [];
        expect(difference(source, compare)).toEqual(['a', 'b', 'c', 'e']);
    });

    it('should return empty array when source is empty', () => {
        const source: string[] = [];
        const compare: string[] = ['a', 'b', 'c', 'e'];
        expect(difference(source, compare)).toEqual([]);
    });
});

describe('toArray', () => {
    it('returns identity for array', () => {
        const identity: any[] = [];
        expect(toArray(identity)).toBe(identity);
    });
    it('returns array for non-null, non-undefined', () => {
        expect(toArray(true)).toEqual([true]);
        expect(toArray('abc')).toEqual(['abc']);
        expect(toArray(1)).toEqual([1]);
        expect(toArray({})).toEqual([{}]);
    });
    it('returns empty array for null and undefined', () => {
        expect(toArray(undefined)).toEqual([]);
        expect(toArray(null)).toEqual([]);
    });
});

describe('isArrayOfNonEmptyStrings', () => {
    it('returns false for empty array', () => {
        expect(isArrayOfNonEmptyStrings([])).toBe(false);
    });
    it('returns false for [true]', () => {
        expect(isArrayOfNonEmptyStrings([true])).toBe(false);
    });
    it("returns false for ['']", () => {
        expect(isArrayOfNonEmptyStrings([''])).toBe(false);
    });
    it('returns true for non-empty string array', () => {
        expect(isArrayOfNonEmptyStrings([' a '])).toBe(true);
    });
});

describe('dedupe', () => {
    it('retains unique entries', () => {
        const expected = ['a', 'b', 'c'];
        expect(dedupe(['a', 'b', 'c'])).toEqual(expected);
    });
    it('removes duplicate', () => {
        const expected = ['a', 'b', 'c'];
        expect(dedupe(['a', 'b', 'c', 'c', 'b', 'a'])).toEqual(expected);
    });
});
