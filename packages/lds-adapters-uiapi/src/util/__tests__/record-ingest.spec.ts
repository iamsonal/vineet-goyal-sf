jest.mock('../../generated/types/type-utils');
jest.mock('../../helpers/RecordRepresentation/merge');
jest.mock('../../raml-artifacts/types/RecordRepresentation/keyBuilderFromType');

import { IngestPath } from '@luvio/engine';

import * as RecordRepresentation from '../../generated/types/RecordRepresentation';
import { keyBuilderFromType } from '../../raml-artifacts/types/RecordRepresentation/keyBuilderFromType';
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

        const mockLds: any = {
            storePublish: jest.fn(),
            publishStoreMetadata: jest.fn(),
        };

        const mockStore: any = {
            records: {
                [MOCK_KEY]: mockExistingRecord,
            },
        };

        const mockPath: IngestPath = {
            fullPath: 'full/patch',
            parent: null,
            propertyName: '',
        };

        keyBuilderFromType.mockReturnValueOnce(MOCK_KEY);
        createLink.mockReturnValueOnce(mockLink);
        merge.mockReturnValueOnce(mockMergedRecord);

        const mockEquals = jest.spyOn(RecordRepresentation, 'equals').mockReturnValueOnce(false);
        jest.spyOn(RecordRepresentation, 'validate').mockReturnValueOnce(null);
        const mockNormalize = jest.fn().mockReturnValueOnce(mockNormalizedRecord);
        jest.spyOn(RecordRepresentation, 'dynamicNormalize').mockReturnValue(mockNormalize);
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
            expect(mockNormalize).toHaveBeenCalledWith(
                mockData,
                mockExistingRecord,
                { fullPath: MOCK_KEY, parent: null, propertyName: '' },
                mockLds,
                mockStore,
                12345
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
            expect(mockEquals).toHaveBeenCalledWith(mockExistingRecord, mockMergedRecord);
        });

        it('calls storePublish with the merged record when it does not equal the existing record', () => {
            expect(mockLds.storePublish).toHaveBeenCalledWith(MOCK_KEY, mockMergedRecord);
        });

        it('calls storePublishMetadata with key and TTL (30000) plus the provided timeout', () => {
            expect(mockLds.publishStoreMetadata).toHaveBeenCalledWith(MOCK_KEY, {
                ttl: RecordRepresentation.TTL,
                namespace: 'UiApi::',
                representationName: RecordRepresentation.RepresentationType,
            });
        });

        it('calls createLink on the key', () => {
            expect(createLink).toHaveBeenCalledWith(MOCK_KEY);
        });

        it('returns a storeLink for the given key', () => {
            expect(returnValue).toBe(mockLink);
        });
    });
});
