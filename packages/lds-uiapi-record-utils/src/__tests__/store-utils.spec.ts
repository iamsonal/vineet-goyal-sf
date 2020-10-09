import {
    isStoreKeyRecordField,
    isStoreKeyRecordId,
    isStoreKeyRecordOrRecordField,
} from '../store-utils';
const RECORD_ID = 'UiApi::RecordRepresentation:001T1000001nFt5IAE';
const RECORD_FIELD_ID = 'UiApi::RecordRepresentation:001T1000001nFt5IAE__fields__Name';
const RANDOM_STORE_ID = 'UiApi::Random:001T1000001nFt5IAE';
describe('store-utils', () => {
    describe('isStoreKeyRecordId', () => {
        it('returns true for a record id', () => {
            expect(isStoreKeyRecordId(RECORD_ID)).toEqual(true);
        });

        it('returns false for a record field key', () => {
            expect(isStoreKeyRecordId(RECORD_FIELD_ID)).toBe(false);
        });

        it('returns false for a random key', () => {
            expect(isStoreKeyRecordId(RANDOM_STORE_ID)).toBe(false);
        });
    });

    describe('isStoreKeyRecordField', () => {
        it('returns true for a record field key', () => {
            expect(isStoreKeyRecordField(RECORD_FIELD_ID)).toBe(true);
        });

        it('returns false for a record id', () => {
            expect(isStoreKeyRecordField(RECORD_ID)).toBe(false);
        });

        it('returns false for a random key', () => {
            expect(isStoreKeyRecordField(RANDOM_STORE_ID)).toBe(false);
        });
    });

    describe('isStoreKeyRecordOrRecordField', () => {
        it('returns true for a record key', () => {
            expect(isStoreKeyRecordOrRecordField(RECORD_ID)).toBe(true);
        });

        it('returns true for a record field key', () => {
            expect(isStoreKeyRecordOrRecordField(RECORD_FIELD_ID)).toBe(true);
        });

        it('returns false for a random key', () => {
            expect(isStoreKeyRecordOrRecordField(RANDOM_STORE_ID)).toBe(false);
        });

        it('undefined returns false', () => {
            expect(isStoreKeyRecordOrRecordField(undefined)).toBe(false);
        });
    });
});
