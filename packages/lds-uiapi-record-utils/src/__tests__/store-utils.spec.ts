import {
    extractRecordIdFromStoreKey,
    isStoreKeyRecordField,
    isStoreKeyRecordId,
} from '../store-utils';

const RECORD_ID = '001T1000001nFt5IAE';
const RECORD_KEY = 'UiApi::RecordRepresentation:001T1000001nFt5IAE';
const RECORD_FIELD_KEY = 'UiApi::RecordRepresentation:001T1000001nFt5IAE__fields__Name';
const RANDOM_STORE_ID = 'UiApi::Random:001T1000001nFt5IAE';
describe('store-utils', () => {
    describe('isStoreKeyRecordId', () => {
        it('returns true for a record id', () => {
            expect(isStoreKeyRecordId(RECORD_KEY)).toEqual(true);
        });

        it('returns false for a record field key', () => {
            expect(isStoreKeyRecordId(RECORD_FIELD_KEY)).toBe(false);
        });

        it('returns false for a random key', () => {
            expect(isStoreKeyRecordId(RANDOM_STORE_ID)).toBe(false);
        });
    });

    describe('isStoreKeyRecordField', () => {
        it('returns true for a record field key', () => {
            expect(isStoreKeyRecordField(RECORD_FIELD_KEY)).toBe(true);
        });

        it('returns false for a record id', () => {
            expect(isStoreKeyRecordField(RECORD_KEY)).toBe(false);
        });

        it('returns false for a random key', () => {
            expect(isStoreKeyRecordField(RANDOM_STORE_ID)).toBe(false);
        });
    });

    describe('extractRecordIdFromStoreKey', () => {
        it('returns record id from record key', () => {
            expect(extractRecordIdFromStoreKey(RECORD_KEY)).toBe(RECORD_ID);
        });

        it('returns record id from record field key', () => {
            expect(extractRecordIdFromStoreKey(RECORD_FIELD_KEY)).toBe(RECORD_ID);
        });

        it('returns undefined for random key', () => {
            expect(extractRecordIdFromStoreKey(RANDOM_STORE_ID)).toBe(undefined);
        });

        it('returns undefined for undefined input', () => {
            expect(extractRecordIdFromStoreKey(undefined)).toBe(undefined);
        });
    });
});
