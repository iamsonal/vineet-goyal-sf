import getRecordId18 from '../coerce';

describe('getRecordId18', () => {
    it('returns undefined for non-15/18 char input', () => {
        expect(getRecordId18('')).toBeUndefined();
        expect(getRecordId18('12345678901234')).toBeUndefined();
        expect(getRecordId18('1234567890123456789')).toBeUndefined();
    });
    it('returns unmodified value for 18 char input', () => {
        const recordId = '123456789012345678';
        expect(getRecordId18(recordId)).toBe(recordId);
    });
    it('returns 18 char id for 15 char input', () => {
        const numbers = '123456789012345';
        expect(getRecordId18(numbers)).toBe(numbers + 'AAA');
        const lower = 'abcdefghijklmno';
        expect(getRecordId18(lower)).toBe(lower + 'AAA');
        const upper = 'ABCDEFGHIJKLMNO';
        expect(getRecordId18(upper)).toBe(upper + '555');
    });
    it('returns undefined for non-strings', () => {
        expect(getRecordId18(323)).toBeUndefined();
        expect(getRecordId18({})).toBeUndefined();
        expect(getRecordId18(true)).toBeUndefined();
    });
});
