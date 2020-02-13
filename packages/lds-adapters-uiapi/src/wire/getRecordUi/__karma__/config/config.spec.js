import { flushPromises, getMock as globalGetMock, setupElement } from 'test-util';
import { mockGetRecordUiNetwork } from 'uiapi-test-util';

import RecordUi from '../lwc/record-ui';

function fieldId(objectApiName, fieldApiName) {
    return {
        objectApiName,
        fieldApiName,
    };
}

function getRecordIdFromMock(mock) {
    return Object.keys(mock.records)[0];
}

const MOCK_PREFIX = 'wire/getRecordUi/__karma__/config/data/';

function getMock(filename) {
    return globalGetMock(MOCK_PREFIX + filename);
}

describe('layoutTypes', () => {
    [
        { type: 'undefined', layoutTypes: undefined },
        { type: 'null', layoutTypes: null },
        { type: 'an empty string', layoutTypes: '' },
    ].forEach((type, layoutTypes) => {
        it(`treats as incomplete config when layoutTypes is ${type}`, async () => {
            const config = {
                recordIds: ['00hRM000002vUcGYAU'],
                layoutTypes,
                modes: ['View'],
            };
            const element = await setupElement(config, RecordUi);

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
                modes: ['View'],
            };
            mockGetRecordUiNetwork(networkParams, { reject: true, data: mockError });

            const config = {
                ...networkParams,
                layoutTypes,
            };
            const element = await setupElement(config, RecordUi);

            expect(element.getWiredError()).toContainErrorResponse(mockError);
        });
    });
});

describe('modes', () => {
    [
        { type: 'undefined', modes: undefined },
        { type: 'null', modes: null },
        { type: 'an empty string', modes: '' },
        { type: 'an empty array', modes: [] },
    ].forEach((type, modes) => {
        it(`treats as incomplete config when modes is ${type}`, async () => {
            const config = {
                recordIds: ['00hRM000002vUcGYAU'],
                layoutTypes: ['Full'],
                modes,
            };
            const element = await setupElement(config, RecordUi);

            expect(element.pushCount()).toEqual(0);
        });
    });

    [
        { type: 'an invalid value', modes: 'invalid' },
        { type: 'an array with invalid value', modes: ['invalid'] },
    ].forEach(({ type, modes }) => {
        it(`requests with invalid value when modes is ${type}`, async () => {
            const mockError = getMock('recordUi-layoutTypes-Full-modes-Invalid');
            const recordId = '00hRM000002vUcGYAU';
            const networkParams = {
                recordIds: [recordId],
                layoutTypes: ['Full'],
                modes: ['invalid'],
            };
            mockGetRecordUiNetwork(networkParams, { reject: true, data: mockError });

            const config = {
                ...networkParams,
                modes,
            };
            const element = await setupElement(config, RecordUi);

            expect(element.getWiredError()).toContainErrorResponse(mockError);
        });
    });
});

describe('validation', () => {
    ['recordIds'].forEach(param => {
        it(`gets no data or error when required param ${param} is undefined`, async () => {
            const config = {
                recordIds: '123456789012345678',
                layoutTypes: 'Full',
                modes: 'View',
            };
            config[param] = undefined;

            const element = await setupElement(config, RecordUi);

            expect(element.pushCount()).toBe(0);
        });
    });

    ['recordIds'].forEach(param => {
        it(`gets no data or error when required param ${param} is null`, async () => {
            const config = {
                recordIds: '123456789012345678',
                layoutTypes: 'Full',
                modes: 'View',
            };
            config[param] = null;

            const element = await setupElement(config, RecordUi);

            expect(element.pushCount()).toBe(0);
        });
    });

    ['recordIds'].forEach(param => {
        it(`gets no data or error when required param ${param} is invalid`, async () => {
            const config = {
                recordIds: '123456789012345678',
                layoutTypes: 'Full',
                modes: 'View',
            };
            config[param] = 'InvalidStr';

            const element = await setupElement(config, RecordUi);

            expect(element.pushCount()).toBe(0);
        });
    });
});

describe('coercion', () => {
    [
        {
            type: 'string',
            generate: recordIds => {
                return recordIds;
            },
        },
        {
            type: 'string[]',
            generate: recordIds => {
                return [recordIds];
            },
        },
        {
            type: '15-char string',
            generate: recordIds => {
                return recordIds.slice(0, 15);
            },
        },
        {
            type: '15-char string[]',
            generate: recordIds => {
                return [recordIds.slice(0, 15)];
            },
        },
    ].forEach(testCase => {
        it(`gets recordUi with recordIds as ${testCase.type}`, async () => {
            const mockData = getMock('single-record-Account-layouttypes-Full-modes-View');
            const coercedRecordIds = getRecordIdFromMock(mockData);
            const recordIds = testCase.generate(coercedRecordIds);

            const networkParams = {
                recordIds: coercedRecordIds,
                layoutTypes: ['Full'],
                modes: ['View'],
            };
            mockGetRecordUiNetwork(networkParams, mockData);

            const config = {
                ...networkParams,
                recordIds,
            };
            const element = await setupElement(config, RecordUi);

            expect(element.getWiredData()).toEqualSnapshotWithoutEtags(mockData);
        });
    });

    [
        {
            type: 'string',
            layoutTypes: 'Full',
            modes: 'View',
        },
        {
            type: 'string[]',
            layoutTypes: ['Full'],
            modes: ['View'],
        },
    ].forEach(testCase => {
        it(`gets recordUi with required parameters as ${testCase.type}`, async () => {
            const mockData = getMock('single-record-Account-layouttypes-Full-modes-View');
            const recordIds = getRecordIdFromMock(mockData);
            const params = {
                recordIds,
                layoutTypes: ['Full'],
                modes: ['View'],
            };
            mockGetRecordUiNetwork(params, mockData);

            const config = {
                recordIds,
                layoutTypes: testCase.layoutTypes,
                modes: testCase.modes,
            };
            const element = await setupElement(config, RecordUi);

            expect(element.getWiredData()).toEqualSnapshotWithoutEtags(mockData);
        });
    });

    [
        {
            type: 'string',
            optionalFields: 'Account.Industry',
        },
        {
            type: 'string[]',
            optionalFields: ['Account.Industry'],
        },
        {
            type: 'FieldId',
            optionalFields: fieldId('Account', 'Industry'),
        },
        {
            type: 'FieldId[]',
            optionalFields: [fieldId('Account', 'Industry')],
        },
    ].forEach(testCase => {
        it(`gets recordUi with optionalFields as ${testCase.type}`, async () => {
            const mockData = getMock('single-record-Account-layouttypes-Full-modes-View');
            const recordIds = getRecordIdFromMock(mockData);
            const params = {
                recordIds,
                layoutTypes: ['Full'],
                modes: ['View'],
                optionalFields: ['Account.Industry'],
            };
            mockGetRecordUiNetwork(params, mockData);

            const config = {
                ...params,
                optionalFields: testCase.optionalFields,
            };
            const element = await setupElement(config, RecordUi);

            expect(element.getWiredData()).toEqualSnapshotWithoutEtags(mockData);
        });
    });

    it('deduplicate and sort optionalFields', async () => {
        const mockData = getMock('single-record-Account-layouttypes-Full-modes-View');
        const networkParams = {
            recordIds: getRecordIdFromMock(mockData),
            layoutTypes: ['Full'],
            modes: ['View'],
            optionalFields: ['Account.Fax', 'Account.Industry'],
        };
        mockGetRecordUiNetwork(networkParams, mockData);

        const config = {
            ...networkParams,
            optionalFields: ['Account.Industry', 'Account.Fax', 'Account.Industry'],
        };
        const element = await setupElement(config, RecordUi);

        expect(element.getWiredData()).toEqualSnapshotWithoutEtags(mockData);
    });
});

describe('equality', () => {
    it('gets same snapshot reference when configs are deep equaled', async () => {
        const mockData = getMock('single-record-Account-layouttypes-Full-modes-View');
        const recordIds = getRecordIdFromMock(mockData);
        const config = {
            recordIds,
            layoutTypes: ['Full'],
            modes: ['View'],
            optionalFields: ['Account.Industry'],
        };
        mockGetRecordUiNetwork(config, mockData);

        const element = await setupElement(config, RecordUi);
        const result1 = element.getWiredData();
        expect(element.pushCount()).toBe(1);

        // trigger config update
        element.optionalFields = config.optionalFields.slice();
        await flushPromises();

        expect(element.pushCount()).toBe(2);
        const result2 = element.getWiredData();
        expect(result1).toBe(result2);
    });
});
