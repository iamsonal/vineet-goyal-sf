jest.mock('../../generated/types/RecordRepresentation');
jest.mock('../../generated/types/type-utils');
jest.mock('../../helpers/RecordRepresentation/merge');
jest.mock('../../helpers/RecordRepresentation/normalize');
jest.mock('../../raml-artifacts/types/RecordRepresentation/keyBuilderFromType');

import { validate, equals } from '../../generated/types/RecordRepresentation';
import { keyBuilderFromType } from '../../raml-artifacts/types/RecordRepresentation/keyBuilderFromType';
import normalize from '../../helpers/RecordRepresentation/normalize';
import merge from '../../helpers/RecordRepresentation/merge';
import { createLink } from '../../generated/types/type-utils';
import { convertFieldsToTrie } from '../records';
import { createRecordIngest } from '../record-ingest';

describe('Record Ingest Utils', () => {
    describe('createRecordIngest', () => {
        const MOCK_KEY = 'MOCK_KEY';
        const mockExistingRecord = 'EXISTING_RECORD';
        const mockNormalizedRecord = 'NORMALIZED_RECORD';
        const mockMergedRecord = 'MERGED_RECORD';
        const mockLink = 'MOCK_LINK';

        const mockData = {
            MOCK: 'RECORD',
        };

        const mockLds = {
            storePublish: jest.fn(),
            storeSetExpiration: jest.fn(),
        };

        const mockStore = {
            records: {
                [MOCK_KEY]: mockExistingRecord,
            },
        };

        const mockPath = {
            fullPath: 'full/patch',
            parent: null,
        };

        keyBuilderFromType.mockReturnValueOnce(MOCK_KEY);
        normalize.mockReturnValueOnce(mockNormalizedRecord);
        equals.mockReturnValueOnce(false);
        validate.mockReturnValueOnce(null);
        createLink.mockReturnValueOnce(mockLink);
        merge.mockReturnValueOnce(mockMergedRecord);

        const fields = convertFieldsToTrie(['ENTITY.FIELD', 'ENTITY.SUB.FIELD'], false);
        const optionalFields = convertFieldsToTrie(
            ['ENTITY.SUB.SUB.FIELD', 'ENTITY.SUB.SUB.SUB.FIELD'],
            true
        );
        const recordConflictMap = {};

        const testIngestFn = createRecordIngest(fields, optionalFields, recordConflictMap);
        const returnValue = testIngestFn(mockData, mockPath, mockLds, mockStore, 12345);

        it('calls keyBuilderFromType with data', () => {
            expect(keyBuilderFromType).toHaveBeenCalledWith(mockData);
        });

        it('calls normalize with new and existing records', () => {
            expect(normalize).toHaveBeenCalledWith(
                mockData,
                mockExistingRecord,
                { fullPath: MOCK_KEY, parent: null },
                mockLds,
                mockStore,
                12345,
                fields,
                optionalFields,
                recordConflictMap
            );
        });

        it('merges the normalized and existing records', () => {
            expect(merge).toHaveBeenCalledWith(
                mockExistingRecord,
                mockNormalizedRecord,
                mockLds,
                mockPath,
                recordConflictMap
            );
        });

        it('compares normalized and existing record via the equal method', () => {
            expect(equals).toHaveBeenCalledWith(mockExistingRecord, mockMergedRecord);
        });

        it('calls storePublish with the merged record when it does not equal the existing record', () => {
            expect(mockLds.storePublish).toHaveBeenCalledWith(MOCK_KEY, mockMergedRecord);
        });

        it('calls storeSetExpiration with key and TTL (30000) plus the provided timeout', () => {
            expect(mockLds.storeSetExpiration).toHaveBeenCalledWith(MOCK_KEY, 42345);
        });

        it('calls createLink on the key', () => {
            expect(createLink).toHaveBeenCalledWith(MOCK_KEY);
        });

        it('returns a storeLink for the given key', () => {
            expect(returnValue).toBe(mockLink);
        });
    });
});
