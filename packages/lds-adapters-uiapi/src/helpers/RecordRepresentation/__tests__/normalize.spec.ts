import { LDS, IngestPath, Store, Environment } from '@ldsjs/engine';
import normalize from '../normalize';
import { ingest as FieldValueRepresentation_ingest } from '../../../raml-artifacts/types/FieldValueRepresentation/ingest';
import { convertFieldsToTrie } from '../../../util/records';

jest.mock('../../../raml-artifacts/types/FieldValueRepresentation/ingest');

function clone<T>(value: T): T {
    return JSON.parse(JSON.stringify(value));
}

describe('normalize', () => {
    const store = new Store();
    const lds = new LDS(new Environment(store, jest.fn()));

    const path: IngestPath = {
        fullPath: 'some_path',
        parent: null,
    };

    const existing = null;

    const mockFieldValueRepresentationIngest = FieldValueRepresentation_ingest.mockImplementation(
        input => ({
            value: input.value,
        })
    );

    const accountOwner = {
        apiName: 'User',
        childRelationships: {},
        eTag: '123',
        fields: {
            FirstName: {
                displayValue: 'John',
                value: 'John',
            },
            LastName: {
                displayValue: 'Smith',
                value: 'Smith',
            },
            Score: {
                displayValue: '27',
                value: 27,
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
        apiName: 'Account',
        childRelationships: {},
        eTag: '123',
        fields: {
            Value: {
                displayValue: '100',
                value: 100,
            },
            Code: {
                displayValue: '901',
                value: '901',
            },
            ParentAccount: {
                displayValue: null,
                value: null,
            },
            Owner: {
                displayValue: 'John Smith',
                value: accountOwner,
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

    let input;

    beforeEach(() => {
        input = clone(originalInput);
    });

    afterEach(() => {
        mockFieldValueRepresentationIngest.mockClear();
    });

    it("creates and invokes the created record representation's ingestion if value fields are supplied", () => {
        const fieldsTrie = convertFieldsToTrie(
            [
                'Account.Value',
                'Account.Owner.Score',
                'Account.ParentAccount.Name',
                'Account.ParentAccount.Number',
            ],
            false
        );
        const optionalFieldsTrie = convertFieldsToTrie(
            [
                'Account.Code',
                'Account.Score',
                'Account.Owner.LastName',
                'Account.Owner.FirstName',
                'Account.Owner.Address',
                'Account.ParentAccount.Owner.FirstName',
                'Account.ParentAccount.Owner.LastName',
            ],
            true
        );
        const recordConflictMap = {};

        const output = normalize(
            input,
            existing,
            path,
            lds,
            store,
            123,
            fieldsTrie,
            optionalFieldsTrie,
            recordConflictMap
        );
        expect(output).toBe(input);

        expect(output.fields.Value).toStrictEqual({ value: 100 });
        expect(mockFieldValueRepresentationIngest).toHaveBeenNthCalledWith(
            1,
            {
                displayValue: '100',
                value: 100,
            },
            {
                fullPath: 'some_path__fields__Value',
                parent: { data: input, key: 'some_path', existing },
            },
            lds,
            store,
            123,
            { name: 'Value', children: {}, optional: false, scalar: true },
            { name: '', children: {} },
            recordConflictMap
        );

        expect(output.fields.Code).toStrictEqual({ value: '901' });

        // If the field is null, adds data.fields to the field’s link.
        // Corresponds to markNulledOutRequiredFields() in getRecord adapter.
        expect(output.fields.ParentAccount).toStrictEqual({
            value: null,
            data: { fields: ['Name', 'Number', 'Owner.FirstName', 'Owner.LastName'] },
        });

        expect(output.fields.Owner).toStrictEqual({
            value: accountOwner,
        });
        expect(mockFieldValueRepresentationIngest).toHaveBeenNthCalledWith(
            4,
            {
                displayValue: 'John Smith',
                value: accountOwner,
            },
            {
                fullPath: 'some_path__fields__Owner',
                parent: { data: input, key: 'some_path', existing },
            },
            lds,
            store,
            123,
            {
                children: { Score: { children: {}, name: 'Score', optional: false, scalar: true } },
                name: 'Owner',
                optional: false,
                scalar: false,
            },
            {
                children: {
                    LastName: {
                        name: 'LastName',
                        optional: true,
                        scalar: true,
                        children: {},
                    },
                    FirstName: {
                        name: 'FirstName',
                        optional: true,
                        scalar: true,
                        children: {},
                    },
                    Address: {
                        name: 'Address',
                        optional: true,
                        scalar: true,
                        children: {},
                    },
                },
                name: 'Owner',
                optional: true,
                scalar: false,
            },
            recordConflictMap
        );
    });
});
