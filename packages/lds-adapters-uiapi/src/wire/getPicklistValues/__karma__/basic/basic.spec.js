import { flushPromises, getMock as globalGetMock, setupElement, stripEtags } from 'test-util';
import {
    MASTER_RECORD_TYPE_ID,
    expirePicklistValues,
    mockGetPicklistValuesNetwork,
} from 'uiapi-test-util';
import { getPicklistValues_imperative } from 'lds-adapters-uiapi';

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

    it('verifies a 404 request because of a bad fieldApiName results in observable emitting a 404 error', async () => {
        const mock = getMock('picklist-Account-bad-fieldApiName');
        const mockError = {
            ok: false,
            status: 404,
            statusText: 'NOT_FOUND',
            body: mock,
        };
        const config = {
            fieldApiName: 'Account.BadField',
            recordTypeId: MASTER_RECORD_TYPE_ID,
        };

        mockGetPicklistValuesNetwork(config, { reject: true, data: mockError });
        const elm = await setupElement(config, GetPicklistValues);
        expect(elm.getWiredError()).toEqual(mockError);
        expect(elm.getWiredError()).toBeImmutable();
    });

    it('verifies a 404 request because of a bad objectApiName results in observable emitting a 404 error', async () => {
        const mock = getMock('picklist-Account-bad-objectApiName');
        const mockError = {
            ok: false,
            status: 404,
            statusText: 'NOT_FOUND',
            body: mock,
        };

        const config = {
            fieldApiName: 'BadObjectName.Type',
            recordTypeId: MASTER_RECORD_TYPE_ID,
        };

        mockGetPicklistValuesNetwork(config, { reject: true, data: mockError });
        const elm = await setupElement(config, GetPicklistValues);
        expect(elm.getWiredError()).toEqual(mockError);
        expect(elm.getWiredError()).toBeImmutable();
    });

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

    describe('getPicklistValues_imperative', () => {
        it('uses caller-supplied cache policy', async () => {
            const mock1 = getMock('picklist-Account-MasterRecordTypeId-fieldApiName-Type');
            const mock2 = getMock('picklist-Account-MasterRecordTypeId-fieldApiName-Type');
            mock2.eTag = mock2.eTag + '999';
            mock2.values = mock2.values.slice(1, mock2.values.length);

            const config = {
                fieldApiName: 'Account.Type',
                recordTypeId: MASTER_RECORD_TYPE_ID,
            };

            mockGetPicklistValuesNetwork(config, [mock1, mock2]);

            const callback = jasmine.createSpy();

            // populate cache with mock1
            getPicklistValues_imperative.invoke(config, undefined, callback);
            await flushPromises();

            callback.calls.reset();

            // should emit mock1 from cache, then make network call & emit mock2
            getPicklistValues_imperative.subscribe(
                config,
                { cachePolicy: { type: 'cache-and-network' } },
                callback
            );
            await flushPromises();

            expect(callback).toHaveBeenCalledTimes(2);
            expect(callback.calls.argsFor(0)).toEqual([
                { data: stripEtags(mock1), error: undefined },
            ]);
            expect(callback.calls.argsFor(1)).toEqual([
                { data: stripEtags(mock2), error: undefined },
            ]);
        });
    });
});
