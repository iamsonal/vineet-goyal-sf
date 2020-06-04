import { getMock as globalGetMock, setupElement } from 'test-util';
import { mockGetRecordTemplateCreateNetwork } from 'uiapi-test-util';

import GetRecordTemplateCreate from '../lwc/get-record-template-create';

const MOCK_PREFIX = 'wire/getRecordTemplateCreate/__karma__/config/data/';

function getMock(filename) {
    return globalGetMock(MOCK_PREFIX + filename);
}

describe('objectApiName', () => {
    [undefined, null].forEach(value => {
        it(`should not make a network request if required param objectApiName is '${value}'`, async () => {
            const config = {
                objectApiName: value,
            };

            const elm = await setupElement(config, GetRecordTemplateCreate);
            expect(elm.pushCount()).toBe(0);
        });
    });

    it('should make correct HTTP request for ObjectId objectApiName', async () => {
        const mock = getMock('record-template-create-Account');

        const config = {
            objectApiName: 'Account',
        };

        mockGetRecordTemplateCreateNetwork(config, mock);

        const elm = await setupElement(config, GetRecordTemplateCreate);

        expect(elm.pushCount()).toBe(1);
        expect(elm.getWiredData()).toEqualSnapshotWithoutEtags(mock);
    });
});

describe('recordTypeId', () => {
    [undefined, null].forEach(value => {
        it(`requests with undefined if recordTypeId is ${value}`, async () => {
            const mock = getMock('record-template-create-Account');

            const networkParams = {
                objectApiName: 'Account',
                recordTypeId: undefined,
            };
            mockGetRecordTemplateCreateNetwork(networkParams, mock);

            const config = {
                objectApiName: 'Account',
                recordTypeId: value,
            };
            const elm = await setupElement(config, GetRecordTemplateCreate);
            expect(elm.pushCount()).toBe(1);
            expect(elm.getWiredData()).toEqualSnapshotWithoutEtags(mock);
        });
    });

    it('should make correct HTTP request for valid recordTypeId', async () => {
        const mock = getMock('record-template-create-Account');

        const config = {
            objectApiName: 'Account',
            recordTypeId: '012RM00000025SOYAY',
        };

        mockGetRecordTemplateCreateNetwork(config, mock);

        const elm = await setupElement(config, GetRecordTemplateCreate);

        expect(elm.pushCount()).toBe(1);
        expect(elm.getWiredData()).toEqualSnapshotWithoutEtags(mock);
    });

    it('should not error if recordType is null in response', async () => {
        const mock = getMock('record-template-create-Account');
        mock.record.recordTypeId = null;

        const config = {
            objectApiName: 'Account',
            recordTypeId: '012RM00000025SOYAY',
        };

        mockGetRecordTemplateCreateNetwork(config, mock);

        const elm = await setupElement(config, GetRecordTemplateCreate);

        expect(elm.pushCount()).toBe(1);
        expect(elm.getWiredData()).toEqualSnapshotWithoutEtags(mock);
    });
});

describe('optionalFields', () => {
    [undefined, null].forEach(value => {
        it(`requests with undefined if optionalFields is ${value}`, async () => {
            const mock = getMock('record-template-create-Account');

            const config = {
                objectApiName: 'Account',
                optionalFields: value,
            };

            const networkParams = {
                ...config,
                optionalFields: undefined,
            };
            mockGetRecordTemplateCreateNetwork(networkParams, mock);

            const elm = await setupElement(config, GetRecordTemplateCreate);
            expect(elm.pushCount()).toBe(1);
            expect(elm.getWiredData()).toEqualSnapshotWithoutEtags(mock);
        });
    });

    it('should make correct HTTP request for valid optionalFields', async () => {
        const mock = getMock('record-template-create-Account-optionalFields-Name');

        const config = {
            objectApiName: 'Account',
            optionalFields: ['Account.Name'],
        };

        mockGetRecordTemplateCreateNetwork(config, mock);

        const elm = await setupElement(config, GetRecordTemplateCreate);

        expect(elm.pushCount()).toBe(1);
        expect(elm.getWiredData()).toEqualSnapshotWithoutEtags(mock);
    });

    it('coerces string type optionalFields to array', async () => {
        const mock = getMock('record-template-create-Account-optionalFields-Name');

        const config = {
            objectApiName: 'Account',
            optionalFields: 'Account.Name',
        };

        const networkParams = {
            ...config,
            optionalFields: ['Account.Name'],
        };
        mockGetRecordTemplateCreateNetwork(networkParams, mock);

        const elm = await setupElement(config, GetRecordTemplateCreate);
        expect(elm.pushCount()).toBe(1);
        expect(elm.getWiredData()).toEqualSnapshotWithoutEtags(mock);
    });
});
