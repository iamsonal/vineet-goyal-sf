import { createChildResourceParams } from '../createChildResourceParams';
import { GetRecordsConfig } from '../GetRecordsConfig';

describe('createChildResourceParams', () => {
    const MOCK_ENTITY_FIELD1 = 'MockEntity.field1';
    const MOCK_ENTITY_FIELD2 = 'MockEntity.field2';
    const MOCK_ENTITY_OPTIONAL_FIELD1 = 'MockEntity.OptionalField1';
    const MOCK_ENTITY_OPTIONAL_FIELD2 = 'MockEntity.OptionalField2';
    const fields = [MOCK_ENTITY_FIELD1, MOCK_ENTITY_FIELD2];
    const optionalFields = [MOCK_ENTITY_OPTIONAL_FIELD1, MOCK_ENTITY_OPTIONAL_FIELD2];

    it('when input config contains only fields', () => {
        const basicResourceRequestConfig: GetRecordsConfig = {
            records: [
                {
                    recordIds: ['recordId1', 'recordId2'],
                    fields,
                },
            ],
        };
        expect(createChildResourceParams(basicResourceRequestConfig)).toStrictEqual([
            {
                queryParams: {
                    fields,
                },
                urlParams: {
                    recordId: 'recordId1',
                },
            },
            {
                queryParams: {
                    fields,
                },
                urlParams: {
                    recordId: 'recordId2',
                },
            },
        ]);
    });

    it('when input config contains only optionalFields', () => {
        const basicResourceRequestConfig: GetRecordsConfig = {
            records: [
                {
                    recordIds: ['recordId1', 'recordId2'],
                    optionalFields,
                },
            ],
        };
        expect(createChildResourceParams(basicResourceRequestConfig)).toStrictEqual([
            {
                queryParams: {
                    optionalFields,
                },
                urlParams: {
                    recordId: 'recordId1',
                },
            },
            {
                queryParams: {
                    optionalFields,
                },
                urlParams: {
                    recordId: 'recordId2',
                },
            },
        ]);
    });

    it('when input config contains both fields and optionalFields', () => {
        const basicResourceRequestConfig: GetRecordsConfig = {
            records: [
                {
                    recordIds: ['recordId1', 'recordId2'],
                    fields,
                    optionalFields,
                },
            ],
        };
        expect(createChildResourceParams(basicResourceRequestConfig)).toStrictEqual([
            {
                queryParams: {
                    fields,
                    optionalFields,
                },
                urlParams: {
                    recordId: 'recordId1',
                },
            },
            {
                queryParams: {
                    fields,
                    optionalFields,
                },
                urlParams: {
                    recordId: 'recordId2',
                },
            },
        ]);
    });
});
