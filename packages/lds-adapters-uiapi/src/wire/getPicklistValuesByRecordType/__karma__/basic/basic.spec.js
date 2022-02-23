import { getMock as globalGetMock, setupElement } from 'test-util';
import {
    MASTER_RECORD_TYPE_ID,
    expirePicklistValues,
    expirePicklistValuesCollection,
    mockGetPicklistValuesNetwork,
} from 'uiapi-test-util';

import GetPicklistValuesByRecordType from '../lwc/get-picklist-values-by-record-type';
import GetPicklistValues from '../../../../raml-artifacts/getPicklistValues/__karma__/lwc/get-picklist-values';

const MOCK_PREFIX = 'wire/getPicklistValuesByRecordType/__karma__/basic/data/';

function getMock(filename) {
    return globalGetMock(MOCK_PREFIX + filename);
}

describe('picklist values by record type', () => {
    it('should make http request when data is not present', async () => {
        const mock = getMock('picklist-Account-MasterRecordTypeId');

        const config = {
            objectApiName: 'Account',
            recordTypeId: MASTER_RECORD_TYPE_ID,
        };

        mockGetPicklistValuesNetwork(config, mock);

        const elm = await setupElement(config, GetPicklistValuesByRecordType);

        expect(elm.pushCount()).toBe(1);
        expect(elm.getWiredData()).toEqualSnapshotWithoutEtags(mock);
    });

    it('should not make http request when data is present', async () => {
        const mock = getMock('picklist-Account-MasterRecordTypeId');

        const config = {
            objectApiName: 'Account',
            recordTypeId: MASTER_RECORD_TYPE_ID,
        };

        mockGetPicklistValuesNetwork(config, mock);

        const wireA = await setupElement(config, GetPicklistValuesByRecordType);

        expect(wireA.pushCount()).toBe(1);
        expect(wireA.getWiredData()).toEqualSnapshotWithoutEtags(mock);

        const wireB = await setupElement(config, GetPicklistValuesByRecordType);

        expect(wireB.pushCount()).toBe(1);
        expect(wireB.getWiredData()).toEqualSnapshotWithoutEtags(mock);

        // wireA should not have received a new value
        expect(wireA.pushCount()).toBe(1);
    });

    it('should make http request when data is expired', async () => {
        const mock = getMock('picklist-Account-MasterRecordTypeId');

        const config = {
            objectApiName: 'Account',
            recordTypeId: MASTER_RECORD_TYPE_ID,
        };

        mockGetPicklistValuesNetwork(config, [mock, mock]);

        const wireA = await setupElement(config, GetPicklistValuesByRecordType);

        expect(wireA.pushCount()).toBe(1);
        expect(wireA.getWiredData()).toEqualSnapshotWithoutEtags(mock);

        expirePicklistValuesCollection();

        const wireB = await setupElement(config, GetPicklistValuesByRecordType);

        expect(wireB.pushCount()).toBe(1);
        expect(wireB.getWiredData()).toEqualSnapshotWithoutEtags(mock);

        // wireA should not have received a new value
        expect(wireA.pushCount()).toBe(1);
    });

    it('should not make extra http request for picklist value when picklist value by record type is in store', async () => {
        const picklistValueConfig = {
            fieldApiName: 'Account.Type',
            recordTypeId: MASTER_RECORD_TYPE_ID,
        };

        const mock = getMock('picklist-Account-MasterRecordTypeId');

        const config = {
            objectApiName: 'Account',
            recordTypeId: MASTER_RECORD_TYPE_ID,
        };

        mockGetPicklistValuesNetwork(config, mock);

        const wireA = await setupElement(config, GetPicklistValuesByRecordType);

        expect(wireA.pushCount()).toBe(1);

        await setupElement(picklistValueConfig, GetPicklistValues);

        // Should not have received new value
        expect(wireA.pushCount()).toBe(1);
    });

    it('should not emit new value when underlying picklist value is refreshed but is unchanged', async () => {
        const picklistValueMock = getMock(`picklist-Account-MasterRecordTypeId-fieldApiName-Type`);
        const picklistValueConfig = {
            fieldApiName: 'Account.Type',
            recordTypeId: MASTER_RECORD_TYPE_ID,
        };

        mockGetPicklistValuesNetwork(picklistValueConfig, [picklistValueMock, picklistValueMock]);

        await setupElement(picklistValueConfig, GetPicklistValues);

        const mock = getMock('picklist-Account-MasterRecordTypeId');

        const config = {
            objectApiName: 'Account',
            recordTypeId: MASTER_RECORD_TYPE_ID,
        };

        mockGetPicklistValuesNetwork(config, mock);

        const picklistValuesByRecordTypeWire = await setupElement(
            config,
            GetPicklistValuesByRecordType
        );
        expect(picklistValuesByRecordTypeWire.pushCount()).toBe(1);

        expirePicklistValues();

        await setupElement(picklistValueConfig, GetPicklistValues);

        // should not have received new value
        expect(picklistValuesByRecordTypeWire.pushCount()).toBe(1);
    });

    it('should emit new value when underlying picklist value is refreshed and is changed', async () => {
        const picklistValueMock = getMock('picklist-Account-MasterRecordTypeId-fieldApiName-Type');
        const picklistValueConfig = {
            fieldApiName: 'Account.Type',
            recordTypeId: MASTER_RECORD_TYPE_ID,
        };

        const changed = getMock('picklist-Account-MasterRecordTypeId-fieldApiName-Type');
        changed.eTag = 'changed';
        changed.controllerValues.Aloha = 6;

        mockGetPicklistValuesNetwork(picklistValueConfig, [picklistValueMock, changed]);

        await setupElement(picklistValueConfig, GetPicklistValues);

        const mock = getMock('picklist-Account-MasterRecordTypeId');

        const config = {
            objectApiName: 'Account',
            recordTypeId: MASTER_RECORD_TYPE_ID,
        };

        mockGetPicklistValuesNetwork(config, mock);

        const picklistValuesByRecordTypeWire = await setupElement(
            config,
            GetPicklistValuesByRecordType
        );
        expect(picklistValuesByRecordTypeWire.pushCount()).toBe(1);

        expirePicklistValues();

        await setupElement(picklistValueConfig, GetPicklistValues);

        // should have received new value
        expect(picklistValuesByRecordTypeWire.pushCount()).toBe(2);
    });

    it('bad objectApiName emits error', async () => {
        const mock = getMock('picklist-Account-bad-objectApiName');

        const config = {
            objectApiName: 'Invalid',
            recordTypeId: MASTER_RECORD_TYPE_ID,
        };

        mockGetPicklistValuesNetwork(config, { reject: true, data: { body: mock } });

        const elm = await setupElement(config, GetPicklistValuesByRecordType);

        expect(elm.getWiredError()).toContainErrorBody(mock);
    });

    describe('refresh', () => {
        it('should refresh picklist values by record type', async () => {
            const mock = getMock('picklist-Account-MasterRecordTypeId');
            const refreshed = getMock('picklist-Account-MasterRecordTypeId');
            refreshed.eTag = refreshed.eTag.replace(/^.{3}/, '999');
            const key = Object.keys(refreshed.picklistFieldValues)[0];
            const picklistValues = refreshed.picklistFieldValues[key];
            picklistValues.eTag = picklistValues.eTag.replace(/^.{3}/, '999');
            picklistValues.values.shift();

            const config = {
                objectApiName: 'Account',
                recordTypeId: MASTER_RECORD_TYPE_ID,
            };

            mockGetPicklistValuesNetwork(config, [mock, refreshed]);

            const element = await setupElement(config, GetPicklistValuesByRecordType);
            expect(element.pushCount()).toBe(1);
            expect(element.getWiredData()).toEqualSnapshotWithoutEtags(mock);

            await element.refresh();

            expect(element.pushCount()).toBe(2);
            expect(element.getWiredData()).toEqualSnapshotWithoutEtags(refreshed);
        });
    });
});
