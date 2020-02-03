import { getMock as globalGetMock, setupElement } from 'test-util';
import { mockGetRecordNetwork, mockGetRecordUiNetwork } from 'uiapi-test-util';

import RecordFields from '../lwc/record-fields';
import RecordLayoutTypes from '../lwc/record-layout-types';
import RecordFieldsLayoutTypes from '../lwc/record-fields-layout-types';

function fieldId(objectApiName, fieldApiName) {
    return {
        objectApiName,
        fieldApiName,
    };
}

const MOCK_PREFIX = 'wire/getRecord/__karma__/config/data/';

function getMock(filename) {
    return globalGetMock(MOCK_PREFIX + filename);
}

describe('recordId', () => {
    [
        { type: 'undefined', recordId: undefined },
        { type: 'null', recordId: null },
        { type: 'an invalid Id', recordId: 'INVALID_ID' },
    ].forEach(({ type, recordId }) => {
        it(`gets no data when required param recordId is ${type}`, async () => {
            const config = {
                recordId,
                fields: ['Opportunity.Name'],
            };

            const element = await setupElement(config, RecordFields);
            expect(element.pushCount()).toBe(0);
        });
    });

    it('transforms recordId from 15 char format to 18 char format', async () => {
        const mockData = getMock('record-Opportunity-fields-Opportunity.Name');
        const recordId18 = mockData.id;
        const recordId15 = recordId18.slice(0, 15);

        const networkParams = {
            recordId: recordId18,
            fields: ['Opportunity.Name'],
        };
        mockGetRecordNetwork(networkParams, mockData);

        const config = {
            recordId: recordId15,
            fields: ['Opportunity.Name'],
        };
        const element = await setupElement(config, RecordFields);

        expect(element.getWiredData()).toEqualSnapshotWithoutEtags(mockData);
    });
});

describe('fields', () => {
    [
        { type: 'string', fields: 'Opportunity.Name' },
        { type: 'string[]', fields: ['Opportunity.Name'] },
        { type: 'FieldId', fields: fieldId('Opportunity', 'Name') },
        { type: 'FieldId[]', fields: [fieldId('Opportunity', 'Name')] },
    ].forEach(testCase => {
        it(`gets record with required field as ${testCase.type}`, async () => {
            const mockData = getMock('record-Opportunity-fields-Opportunity.Name');
            const params = {
                recordId: mockData.id,
                fields: ['Opportunity.Name'],
            };
            mockGetRecordNetwork(params, mockData);

            const element = await setupElement(
                {
                    ...params,
                    fields: testCase.fields,
                },
                RecordFields
            );

            expect(element.getWiredData()).toEqualSnapshotWithoutEtags(mockData);
        });
    });

    [
        { type: 'string', optionalFields: 'Opportunity.Name' },
        { type: 'string[]', optionalFields: ['Opportunity.Name'] },
        { type: 'FieldId', optionalFields: fieldId('Opportunity', 'Name') },
        { type: 'FieldId[]', optionalFields: [fieldId('Opportunity', 'Name')] },
    ].forEach(testCase => {
        it(`gets record with optionalFields as ${testCase.type}`, async () => {
            const mockData = getMock('record-Opportunity-fields-Opportunity.Name');
            const params = {
                recordId: mockData.id,
                optionalFields: ['Opportunity.Name'],
            };
            mockGetRecordNetwork(params, mockData);

            const element = await setupElement(
                {
                    ...params,
                    optionalFields: testCase.optionalFields,
                },
                RecordFields
            );

            expect(element.getWiredData()).toEqualSnapshotWithoutEtags(mockData);
        });
    });

    [
        {
            param: 'fields',
            actual: ['Opportunity.Name', 'Opportunity.Id', 'Opportunity.Name'],
            expected: ['Opportunity.Id', 'Opportunity.Name'],
        },
        {
            param: 'optionalFields',
            actual: ['Opportunity.Name', 'Opportunity.Id', 'Opportunity.Name'],
            expected: ['Opportunity.Id', 'Opportunity.Name'],
        },
    ].forEach(({ param, actual, expected }) => {
        it(`deduplicate and sort ${param}`, async () => {
            const mockData = getMock('record-Opportunity-fields-Opportunity.Id,Opportunity.Name');
            const networkParams = {
                recordId: mockData.id,
                [param]: expected,
            };
            mockGetRecordNetwork(networkParams, mockData);

            const config = {
                ...networkParams,
                [param]: actual,
            };
            const element = await setupElement(config, RecordFields);

            expect(element.getWiredData()).toEqualSnapshotWithoutEtags(mockData);
        });
    });

    it('requests with fields when fields and optionalFields have same value', async () => {
        const mockData = getMock('record-Opportunity-fields-Opportunity.Name');
        const networkParams = {
            recordId: mockData.id,
            fields: ['Opportunity.Name'],
        };
        mockGetRecordNetwork(networkParams, mockData);

        const config = {
            ...networkParams,
            optionalFields: ['Opportunity.Name'],
        };
        const element = await setupElement(config, RecordFields);

        expect(element.getWiredData()).toEqualSnapshotWithoutEtags(mockData);
    });
});

describe('layoutTypes', () => {
    [
        { type: 'undefined', layoutTypes: undefined },
        { type: 'null', layoutTypes: null },
        { type: 'an empty string', layoutTypes: '' },
    ].forEach((type, layoutTypes) => {
        it(`treats as incomplete config when layoutTypes is ${type}`, async () => {
            const config = {
                recordId: '00hRM000002vUcGYAU',
                layoutTypes,
            };
            const element = await setupElement(config, RecordLayoutTypes);

            expect(element.pushCount()).toEqual(0);
        });
    });

    [
        { type: 'an invalid value', layoutTypes: 'invalid' },
        { type: 'an array with invalid value', layoutTypes: ['invalid'] },
    ].forEach(({ type, layoutTypes }) => {
        it(`requests with invalid value when layoutTypes is ${type}`, async () => {
            const mockError = getMock('recordUi-layoutTypes-Invalid-modes-View');
            const recordId = '00hRM000002vUcGYAU';
            const networkParams = {
                recordIds: [recordId],
                layoutTypes: ['invalid'],
            };
            mockGetRecordUiNetwork(networkParams, { reject: true, data: mockError });

            const config = {
                recordId,
                layoutTypes,
            };
            const element = await setupElement(config, RecordLayoutTypes);

            expect(element.getWiredError()).toContainErrorResponse(mockError);
        });
    });

    it('request with layoutTypes if fields and layoutTypes both represent', async () => {
        const mockData = getMock('recordUi-layoutTypes-Full-modes-View');
        const mockRecord = mockData.records[Object.keys(mockData.records)[0]];
        const recordId = mockRecord.id;
        const networkParams = {
            recordIds: [recordId],
            layoutTypes: ['Full'],
            modes: ['View'],
        };
        mockGetRecordUiNetwork(networkParams, mockData);

        const config = {
            recordId,
            layoutTypes: ['Full'],
            fields: ['Opportunity.Name'],
        };
        const element = await setupElement(config, RecordFieldsLayoutTypes);

        expect(element.getWiredData()).toEqualSnapshotWithoutEtags(mockRecord);
    });
});

describe('modes', () => {
    [
        { type: 'undefined', modes: undefined },
        { type: 'null', modes: null },
    ].forEach(({ type, modes }) => {
        it(`requests layout with View mode when modes is ${type}`, async () => {
            const mockData = getMock('recordUi-layoutTypes-Full-modes-View');
            const mockRecord = mockData.records[Object.keys(mockData.records)[0]];
            const recordId = mockRecord.id;
            const networkParams = {
                recordIds: [recordId],
                layoutTypes: ['Full'],
                modes: ['View'],
            };
            mockGetRecordUiNetwork(networkParams, mockData);

            const config = {
                recordId,
                layoutTypes: ['Full'],
                modes,
            };
            const element = await setupElement(config, RecordLayoutTypes);

            expect(element.getWiredData()).toEqualSnapshotWithoutEtags(mockRecord);
        });
    });

    it('treats as incomplete config when modes is an empty string', async () => {
        const config = {
            recordIds: ['00hRM000002vUcGYAU'],
            layoutTypes: ['Full'],
            modes: '',
        };
        const element = await setupElement(config, RecordLayoutTypes);

        expect(element.pushCount()).toEqual(0);
    });

    [
        { type: 'an invalid value', modes: 'Invalid' },
        { type: 'an array with invalid value', modes: ['Invalid'] },
    ].forEach(({ type, modes }) => {
        it(`requests with invalid value when modes is ${type}`, async () => {
            const mockError = getMock('recordUi-layoutTypes-Invalid-modes-View');
            const recordId = '00hRM000002vUcGYAU';
            const networkParams = {
                recordIds: [recordId],
                layoutTypes: ['Full'],
                modes: ['Invalid'],
            };
            mockGetRecordUiNetwork(networkParams, { reject: true, data: mockError });

            const config = {
                recordId,
                layoutTypes: ['Full'],
                modes,
            };
            const element = await setupElement(config, RecordLayoutTypes);

            expect(element.getWiredError()).toContainErrorResponse(mockError);
        });
    });
});
