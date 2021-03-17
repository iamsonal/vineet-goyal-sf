import { Luvio, Store, Environment } from '@luvio/engine';
import { makeIngest } from '../ingest';
import { RecordFieldTrie } from '../../../../util/records';
import {
    FieldValueRepresentation,
    FieldValueRepresentationNormalized,
} from '../../../../generated/types/FieldValueRepresentation';
import * as FieldValueRepNormalize from '../../../../helpers/FieldValueRepresentation/normalize';

import { default as merge } from '../../../../helpers/FieldValueRepresentation/merge';
import { RecordConflictMap } from '../../../../helpers/RecordRepresentation/resolveConflict';

jest.mock('../../../../helpers/FieldValueRepresentation/merge');

describe('ingest', () => {
    let store = new Store();
    let luvio = new Luvio(new Environment(store, jest.fn()));

    it('invokes normalize when ingesting', () => {
        const input: FieldValueRepresentation = {
            displayValue: 'a',
            value: 'a',
        };
        const normalized: FieldValueRepresentationNormalized = {
            displayValue: 'a',
            value: 'a',
        };
        const mockNormalize = jest.spyOn(FieldValueRepNormalize, 'default');
        mockNormalize.mockReturnValue(normalized);

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
        const output = makeIngest(fieldsTrie, optionalFieldsTrie, recordConflictMap)(
            input,
            {
                fullPath: 'abc',
                parent: null,
                propertyName: '',
            },
            luvio,
            store,
            123
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
                propertyName: '',
            },
            luvio,
            store,
            123,
            fieldsTrie,
            optionalFieldsTrie,
            recordConflictMap
        );
        expect(mockMerge).toHaveBeenCalledTimes(1);
    });
});
