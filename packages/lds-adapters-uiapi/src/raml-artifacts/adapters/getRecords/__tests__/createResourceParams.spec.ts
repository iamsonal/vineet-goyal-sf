import { createResourceParams } from '../createResourceParams';
import { GetRecordsConfig } from '../GetRecordsConfig';

describe('createResourceParams', () => {
    /** Test Data Setup */
    const MOCK_ENTITY_1 = 'mockEntityName1';
    const MOCK_ENTITY_2 = 'mockEntityName2';
    const MOCK_FIELD_1 = 'field1';
    const MOCK_FIELD_2 = 'field2';
    const MOCK_FIELD_3 = 'field3';
    const fieldsForEntity1 = [
        `${MOCK_ENTITY_1}.${MOCK_FIELD_1}`,
        `${MOCK_ENTITY_1}.${MOCK_FIELD_2}`,
    ];
    const optionalFieldsForEntity1 = [`${MOCK_ENTITY_1}.${MOCK_FIELD_3}`];
    const fieldsForEntity2 = [`${MOCK_ENTITY_2}.${MOCK_FIELD_1}`];
    const optionalFieldsForEntity2 = [`${MOCK_ENTITY_2}.${MOCK_FIELD_2}`];

    it('when input config contains only fields with multiple entities', () => {
        const inputConfig: GetRecordsConfig = {
            records: [
                {
                    recordIds: ['mockRecordId1', 'mockRecordId2'],
                    fields: fieldsForEntity1,
                },
                {
                    recordIds: ['mockRecordId3'],
                    fields: fieldsForEntity2,
                },
            ],
        };
        expect(createResourceParams(inputConfig)).toStrictEqual({
            queryParams: {
                fields: [...fieldsForEntity1, ...fieldsForEntity2],
                optionalFields: [],
            },
            urlParams: {
                recordIds: ['mockRecordId1', 'mockRecordId2', 'mockRecordId3'],
            },
        });
    });

    it('when input config contains only optionalFields with multiple entities', () => {
        const inputConfig: GetRecordsConfig = {
            records: [
                {
                    recordIds: ['mockRecordId1', 'mockRecordId2'],
                    optionalFields: optionalFieldsForEntity1,
                },
                {
                    recordIds: ['mockRecordId3'],
                    optionalFields: optionalFieldsForEntity2,
                },
            ],
        };
        expect(createResourceParams(inputConfig)).toStrictEqual({
            queryParams: {
                fields: [],
                optionalFields: [...optionalFieldsForEntity1, ...optionalFieldsForEntity2],
            },
            urlParams: {
                recordIds: ['mockRecordId1', 'mockRecordId2', 'mockRecordId3'],
            },
        });
    });

    it('when input contains a combination of fields and optionalFields with multiple entities', () => {
        const inputConfig: GetRecordsConfig = {
            records: [
                {
                    recordIds: ['mockRecordId1', 'mockRecordId2'],
                    fields: fieldsForEntity1,
                    optionalFields: optionalFieldsForEntity1,
                },
                {
                    recordIds: ['mockRecordId3'],
                    fields: fieldsForEntity2,
                },
                {
                    recordIds: ['mockRecordId4'],
                    optionalFields: optionalFieldsForEntity2,
                },
            ],
        };
        expect(createResourceParams(inputConfig)).toStrictEqual({
            queryParams: {
                fields: [...fieldsForEntity1, ...fieldsForEntity2],
                optionalFields: [...optionalFieldsForEntity1, ...optionalFieldsForEntity2],
            },
            urlParams: {
                recordIds: ['mockRecordId1', 'mockRecordId2', 'mockRecordId3', 'mockRecordId4'],
            },
        });
    });
});
