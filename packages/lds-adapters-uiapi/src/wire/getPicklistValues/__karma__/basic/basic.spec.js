import { getMock as globalGetMock, setupElement } from 'test-util';
import {
    MASTER_RECORD_TYPE_ID,
    expirePicklistValues,
    mockGetPicklistValuesNetwork,
} from 'uiapi-test-util';

import GetPicklistValues from '../lwc/get-picklist-values';

const MOCK_PREFIX = 'wire/getPicklistValues/__karma__/basic/data/';

function getMock(filename) {
    return globalGetMock(MOCK_PREFIX + filename);
}

describe('picklist values', () => {
    it('should make http request when data is not present', async () => {
        const mock = getMock('picklist-Account-MasterRecordTypeId-fieldApiName-Type');

        const config = {
            fieldApiName: 'Account.Type',
            recordTypeId: MASTER_RECORD_TYPE_ID,
        };

        mockGetPicklistValuesNetwork(config, mock);

        const elm = await setupElement(config, GetPicklistValues);

        expect(elm.pushCount()).toBe(1);
        expect(elm.getWiredData()).toEqualSnapshotWithoutEtags(mock);
    });

    it('should make http request when config is FieldId object', async () => {
        const mock = getMock('picklist-Account-MasterRecordTypeId-fieldApiName-Type');

        const config = {
            fieldApiName: {
                objectApiName: 'Account',
                fieldApiName: 'Type',
            },
            recordTypeId: MASTER_RECORD_TYPE_ID,
        };

        mockGetPicklistValuesNetwork(config, mock);

        const elm = await setupElement(config, GetPicklistValues);

        expect(elm.pushCount()).toBe(1);
        expect(elm.getWiredData()).toEqualSnapshotWithoutEtags(mock);
    });

    it('should not make http request when data is present', async () => {
        const mock = getMock('picklist-Account-MasterRecordTypeId-fieldApiName-Type');

        const config = {
            recordTypeId: MASTER_RECORD_TYPE_ID,
            fieldApiName: 'Account.Type',
        };

        mockGetPicklistValuesNetwork(config, mock);

        const wireA = await setupElement(config, GetPicklistValues);

        expect(wireA.pushCount()).toBe(1);
        expect(wireA.getWiredData()).toEqualSnapshotWithoutEtags(mock);

        const wireB = await setupElement(config, GetPicklistValues);

        expect(wireB.pushCount()).toBe(1);
        expect(wireB.getWiredData()).toEqualSnapshotWithoutEtags(mock);
    });

    it('should request picklist value after expiration', async () => {
        const mock = getMock('picklist-Account-MasterRecordTypeId-fieldApiName-Type');

        const config = {
            recordTypeId: MASTER_RECORD_TYPE_ID,
            fieldApiName: 'Account.Type',
        };

        mockGetPicklistValuesNetwork(config, [mock, mock]);

        const wireA = await setupElement(config, GetPicklistValues);

        expect(wireA.pushCount()).toBe(1);
        expect(wireA.getWiredData()).toEqualSnapshotWithoutEtags(mock);

        expirePicklistValues();

        const wireB = await setupElement(config, GetPicklistValues);

        expect(wireB.pushCount()).toBe(1);
        expect(wireB.getWiredData()).toEqualSnapshotWithoutEtags(mock);

        // wireA should not receive new value
        expect(wireA.pushCount()).toBe(1);
    });

    it('should push new values when eTag has changed', async () => {
        const mock = getMock('picklist-Account-MasterRecordTypeId-fieldApiName-Type');
        const secondMock = getMock('picklist-Account-MasterRecordTypeId-fieldApiName-Type');

        secondMock.eTag = 'changed';

        // Change something so snapshot change detection will let this pass
        secondMock.controllerValues.Aloha = 5;

        const config = {
            recordTypeId: MASTER_RECORD_TYPE_ID,
            fieldApiName: 'Account.Type',
        };

        mockGetPicklistValuesNetwork(config, [mock, secondMock]);

        const wireA = await setupElement(config, GetPicklistValues);

        expect(wireA.pushCount()).toBe(1);
        expect(wireA.getWiredData()).toEqualSnapshotWithoutEtags(mock);

        expirePicklistValues();

        const wireB = await setupElement(config, GetPicklistValues);

        expect(wireB.pushCount()).toBe(1);
        expect(wireB.getWiredData()).toEqualSnapshotWithoutEtags(secondMock);

        // wireA should receive new value
        expect(wireA.pushCount()).toBe(2);
        expect(wireA.getWiredData()).toEqualSnapshotWithoutEtags(secondMock);
    });

    it('bad fieldApiName emits error', async () => {
        const mock = getMock('picklist-Account-bad-fieldApiName');

        const config = {
            fieldApiName: 'Account.TypeFoo',
            recordTypeId: MASTER_RECORD_TYPE_ID,
        };

        mockGetPicklistValuesNetwork(config, { reject: true, data: mock });

        const elm = await setupElement(config, GetPicklistValues);

        expect(elm.getWiredError()).toContainErrorResponse(mock);
    });

    it('bad objectApiName emits error', async () => {
        const mock = getMock('picklist-Account-bad-objectApiName');

        const config = {
            fieldApiName: 'AccountFoo.Type',
            recordTypeId: MASTER_RECORD_TYPE_ID,
        };

        mockGetPicklistValuesNetwork(config, { reject: true, data: mock });

        const elm = await setupElement(config, GetPicklistValues);

        expect(elm.getWiredError()).toContainErrorResponse(mock);
    });

    // currently no forking logic on 304 (yet)
    xit('304 correctly handled for single picklist field');
    xit(
        'verifies a 404 request because of a bad field api name results in observable emitting a 404 error'
    );
    xit(
        'verifies a 404 request because of a bad object api name results in observable emitting a 404 error'
    );

    describe('refresh', () => {
        it('should refresh get picklist values', async () => {
            const mock = getMock('picklist-Account-MasterRecordTypeId-fieldApiName-Type');
            const refreshed = getMock('picklist-Account-MasterRecordTypeId-fieldApiName-Type');
            refreshed.eTag = refreshed.eTag + '999';
            refreshed.values = refreshed.values.slice(1, refreshed.values.length);

            const config = {
                recordTypeId: MASTER_RECORD_TYPE_ID,
                fieldApiName: 'Account.Type',
            };

            mockGetPicklistValuesNetwork(config, [mock, refreshed]);

            const element = await setupElement(config, GetPicklistValues);

            expect(element.pushCount()).toBe(1);
            expect(element.getWiredData()).toEqualSnapshotWithoutEtags(mock);

            await element.refresh();

            expect(element.pushCount()).toBe(2);
            expect(element.getWiredData()).toEqualSnapshotWithoutEtags(refreshed);
        });
    });
});
