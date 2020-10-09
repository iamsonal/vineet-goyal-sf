import { LDS, Store, Environment } from '@ldsjs/engine';
import { ingest } from '../FieldValueRepresentation';
import { RecordFieldTrie } from '../../../util/records';
import {
    FieldValueRepresentation,
    FieldValueRepresentationNormalized,
} from '../../../generated/types/FieldValueRepresentation';
import { default as normalize } from '../../../helpers/FieldValueRepresentation/normalize';
import { default as merge } from '../../../helpers/FieldValueRepresentation/merge';
import { RecordConflictMap } from '../../../helpers/RecordRepresentation/resolveConflict';

jest.mock('../../../helpers/FieldValueRepresentation/merge');
jest.mock('../../../helpers/FieldValueRepresentation/normalize');

describe('FieldValueRepresentation', () => {
    let store = new Store();
    let lds = new LDS(new Environment(store, jest.fn()));

    it('invokes normalize when ingesting', () => {
        const input: FieldValueRepresentation = {
            displayValue: 'a',
            value: 'a',
        };
        const normalized: FieldValueRepresentationNormalized = {
            displayValue: 'a',
            value: 'a',
        };
        const mockNormalize = normalize.mockReturnValueOnce(normalized);
        const mockMerge = merge.mockReturnValueOnce(normalized);
        const fieldsTrie: RecordFieldTrie = {
            name: 'Name',
            children: {},
        };
        const optionalFieldsTrie: RecordFieldTrie = {
            name: 'Description',
            children: {},
        };
        const recordConflictMap: RecordConflictMap = {};
        const output = ingest(
            input,
            {
                fullPath: 'abc',
                parent: null,
            },
            lds,
            store,
            123,
            fieldsTrie,
            optionalFieldsTrie,
            recordConflictMap
        );
        expect(output).toEqual({ __ref: 'abc' });
        expect(mockNormalize).toHaveBeenCalledTimes(1);
        expect(mockNormalize).toHaveBeenNthCalledWith(
            1,
            {
                displayValue: 'a',
                value: 'a',
            },
            undefined,
            {
                fullPath: 'abc',
                parent: null,
            },
            lds,
            store,
            123,
            fieldsTrie,
            optionalFieldsTrie,
            recordConflictMap
        );
        expect(mockMerge).toHaveBeenCalledTimes(1);
    });
});
