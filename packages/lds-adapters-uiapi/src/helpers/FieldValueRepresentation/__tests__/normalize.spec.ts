import { Luvio, IngestPath, Store, StoreLink, Environment } from '@luvio/engine';
import {
    FieldValueRepresentation,
    FieldValueRepresentationNormalized,
} from '../../../generated/types/FieldValueRepresentation';
import normalize from '../normalize';
import { BLANK_RECORD_FIELDS_TRIE, convertFieldsToTrie } from '../../../util/records';

import * as recordIngest from '../../../util/record-ingest';
import { ingest as RecordRepresentation_ingest } from '../../../raml-artifacts/types/RecordRepresentation/ingest';

jest.mock('../../../raml-artifacts/types/RecordRepresentation/ingest');

function clone<T>(value: T): T {
    return JSON.parse(JSON.stringify(value));
}

describe('normalize', () => {
    const store = new Store();
    const luvio = new Luvio(new Environment(store, jest.fn()));

    const path: IngestPath = {
        fullPath: 'some_path',
        parent: null,
        propertyName: '',
    };

    const dynamicIngestValue: StoreLink = {
        __ref: 'dynamic',
    };

    const staticIngestValue: StoreLink = {
        __ref: 'static',
    };

    const existing: FieldValueRepresentationNormalized = {
        displayValue: 'a',
        value: { __ref: 'ref' },
    };

    const mockDynamicIngest = jest.fn().mockReturnValue(dynamicIngestValue);
    const mockCreateIngest = jest.spyOn(recordIngest, 'createRecordIngest');
    mockCreateIngest.mockReturnValue(mockDynamicIngest);
    const mockStaticIngest = RecordRepresentation_ingest.mockReturnValueOnce(staticIngestValue);

    afterEach(() => {
        mockDynamicIngest.mockClear();
        mockCreateIngest.mockClear();
        mockStaticIngest.mockClear();
    });

    describe('value is object', () => {
        const inputValue = {
            apiName: 'Account',
            childRelationships: {},
            eTag: '123',
            fields: {
                number: {
                    displayValue: '900',
                    value: 900,
                },
            },
            id: 'account_id',
            lastModifiedById: null,
            lastModifiedDate: null,
            recordTypeId: null,
            recordTypeInfo: null,
            systemModstamp: null,
            weakEtag: 321,
        };

        const originalInput = {
            displayValue: 'a',
            value: inputValue,
        };

        let input;

        beforeEach(() => {
            input = clone(originalInput);
        });

        it("creates and invokes the created record representation's ingestion if value fields are supplied", () => {
            const fieldsTrie = convertFieldsToTrie(['ENTITY.FIELD', 'ENTITY.SUB.FIELD'], false);
            const optionalFieldsTrie = convertFieldsToTrie(
                ['ENTITY.SUB.SUB.FIELD', 'ENTITY.SUB.SUB.SUB.FIELD'],
                true
            );
            const recordConflictMap = {};

            const output = normalize(
                input,
                existing,
                path,
                luvio,
                store,
                123,
                fieldsTrie,
                optionalFieldsTrie,
                recordConflictMap
            );
            expect(output).toBe(input);
            expect(output.value).toBe(dynamicIngestValue);
            expect(mockCreateIngest).toHaveBeenLastCalledWith(
                fieldsTrie,
                optionalFieldsTrie,
                recordConflictMap
            );
            expect(mockDynamicIngest).toHaveBeenLastCalledWith(
                inputValue,
                {
                    fullPath: 'some_path__value',
                    parent: {
                        data: input /* originalInput would have been better, but
                                       jest does not clone function arguments
                                       so mock arguments at this stage are referring
                                       to the new value set in normalize(). */,
                        key: 'some_path',
                        existing,
                    },
                    propertyName: 'value',
                },
                luvio,
                store,
                123
            );
            expect(mockStaticIngest).toHaveBeenCalledTimes(0);
        });

        it("invokes generated record representation's ingestion if fields are not supplied", () => {
            const output = normalize(
                input,
                existing,
                path,
                luvio,
                store,
                123,
                BLANK_RECORD_FIELDS_TRIE,
                BLANK_RECORD_FIELDS_TRIE,
                {}
            );
            expect(output).toBe(input);
            expect(output.value).toBe(dynamicIngestValue);
            expect(mockCreateIngest).toHaveBeenCalledTimes(1);
            expect(mockDynamicIngest).toHaveBeenCalledTimes(1);
            expect(mockDynamicIngest).toHaveBeenLastCalledWith(
                inputValue,
                {
                    fullPath: 'some_path__value',
                    parent: {
                        data: input,
                        key: 'some_path',
                        existing,
                    },
                    propertyName: 'value',
                },
                luvio,
                store,
                123
            );
        });
    });

    describe('value is not object or null', () => {
        const existing: FieldValueRepresentationNormalized = {
            displayValue: 'a',
            value: 'a',
        };

        it("does not invoke record representation's ingestion if value is not object and not null", () => {
            const input: FieldValueRepresentation = {
                displayValue: 'a',
                value: 'a',
            };
            const output = normalize(
                input,
                existing,
                path,
                luvio,
                store,
                123,
                BLANK_RECORD_FIELDS_TRIE,
                BLANK_RECORD_FIELDS_TRIE,
                {}
            );
            expect(output).toBe(input);
            expect(output.value).toBe('a');
            expect(mockCreateIngest).toHaveBeenCalledTimes(0);
            expect(mockDynamicIngest).toHaveBeenCalledTimes(0);
            expect(mockStaticIngest).toHaveBeenCalledTimes(0);
        });

        it("does not invoke record representation's ingestion if value is null", () => {
            const input: FieldValueRepresentation = {
                displayValue: null,
                value: null,
            };
            const output = normalize(
                input,
                existing,
                path,
                luvio,
                store,
                123,
                BLANK_RECORD_FIELDS_TRIE,
                BLANK_RECORD_FIELDS_TRIE,
                {}
            );
            expect(output).toBe(input);
            expect(output.value).toBe(null);
            expect(mockCreateIngest).toHaveBeenCalledTimes(0);
            expect(mockDynamicIngest).toHaveBeenCalledTimes(0);
            expect(mockStaticIngest).toHaveBeenCalledTimes(0);
        });
    });
});
