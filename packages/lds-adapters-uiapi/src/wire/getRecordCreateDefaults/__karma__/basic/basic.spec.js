import { getRecordCreateDefaults_imperative } from 'lds-adapters-uiapi';
import {
    flushPromises,
    getMock as globalGetMock,
    setupElement,
    updateElement,
    stripEtags,
} from 'test-util';
import {
    expireLayout,
    expireRecordDefaultsRepresentation,
    expireObjectInfo,
    mockGetLayoutNetwork,
    mockGetObjectInfoNetwork,
    mockGetRecordCreateDefaultsNetwork,
} from 'uiapi-test-util';

import GetLayout from '../../../../raml-artifacts/adapters/getLayout/__karma__/lwc/get-layout';
import GetObjectInfo from '../../../getObjectInfo/__karma__/lwc/object-basic';
import GetRecordCreateDefaults from '../lwc/get-record-create-defaults';

const MOCK_PREFIX = 'wire/getRecordCreateDefaults/__karma__/basic/data/';

function getMock(filename) {
    return globalGetMock(MOCK_PREFIX + filename);
}

describe('getRecordCreateDefaults', () => {
    it('should make correct HTTP request for string objectApiName', async () => {
        const mock = getMock('record-defaults-create-Account');

        const config = {
            objectApiName: 'Account',
        };

        mockGetRecordCreateDefaultsNetwork(config, mock);

        const elm = await setupElement(config, GetRecordCreateDefaults);

        expect(elm.pushCount()).toBe(1);
        expect(elm.getWiredData()).toEqualSnapshotWithoutEtags(mock);
    });

    it('should make correct HTTP request for string objectApiName and formFactor', async () => {
        const mock = getMock('record-defaults-create-Account');

        const config = {
            objectApiName: 'Account',
            formFactor: 'Large',
        };

        mockGetRecordCreateDefaultsNetwork(config, mock);

        const elm = await setupElement(config, GetRecordCreateDefaults);

        expect(elm.pushCount()).toBe(1);
        expect(elm.getWiredData()).toEqualSnapshotWithoutEtags(mock);
    });

    it('should make correct HTTP request for string objectApiName and optionalFields', async () => {
        const mock = getMock('record-defaults-create-Account-optionalFields-Account.YearStarted');

        const config = {
            objectApiName: 'Account',
            optionalFields: ['Account.YearStarted'],
        };

        mockGetRecordCreateDefaultsNetwork(config, mock);

        const elm = await setupElement(config, GetRecordCreateDefaults);

        expect(elm.pushCount()).toBe(1);
        expect(elm.getWiredData()).toEqualSnapshotWithoutEtags(mock);
    });

    it('should result in cache hit when defaults have already been loaded', async () => {
        const mock = getMock('record-defaults-create-Account');

        const config = {
            objectApiName: 'Account',
        };

        mockGetRecordCreateDefaultsNetwork(config, mock);

        const wireA = await setupElement(config, GetRecordCreateDefaults);

        expect(wireA.pushCount()).toBe(1);
        expect(wireA.getWiredData()).toEqualSnapshotWithoutEtags(mock);

        const wireB = await setupElement(config, GetRecordCreateDefaults);

        expect(wireB.pushCount()).toBe(1);
        expect(wireB.getWiredData()).toEqualSnapshotWithoutEtags(mock);

        // wireA should not have received new data
        expect(wireA.pushCount()).toBe(1);
    });

    it('should make HTTP request when created defaults have expired', async () => {
        const mock = getMock('record-defaults-create-Account');

        const config = {
            objectApiName: 'Account',
        };

        mockGetRecordCreateDefaultsNetwork(config, [mock, mock]);

        const wireA = await setupElement(config, GetRecordCreateDefaults);

        expect(wireA.pushCount()).toBe(1);
        expect(wireA.getWiredData()).toEqualSnapshotWithoutEtags(mock);
        expireRecordDefaultsRepresentation();

        const wireB = await setupElement(config, GetRecordCreateDefaults);

        expect(wireB.pushCount()).toBe(1);
        expect(wireB.getWiredData()).toEqualSnapshotWithoutEtags(mock);

        // wireA should not have received new data
        expect(wireA.pushCount()).toBe(1);
    });

    it('should not refresh when a related object info is retrieved but it not changed', async () => {
        const mockRecordCreateDefaults = getMock('record-defaults-create-Account');
        const mockObjectInfo = getMock('object-info-Account');

        const config = {
            objectApiName: 'Account',
        };

        mockGetRecordCreateDefaultsNetwork(config, mockRecordCreateDefaults);
        const wireGetRecordCreateDefaults = await setupElement(config, GetRecordCreateDefaults);
        expect(wireGetRecordCreateDefaults.pushCount()).toBe(1);

        expireObjectInfo();
        mockGetObjectInfoNetwork(config, mockObjectInfo);

        await setupElement(config, GetObjectInfo);

        expect(wireGetRecordCreateDefaults.pushCount()).toBe(1);
    });

    it('should emit correctly when layout is null', async () => {
        const mock = getMock('record-defaults-Partner');

        const config = {
            objectApiName: 'Partner',
        };

        mockGetRecordCreateDefaultsNetwork(config, mock);

        const elm = await setupElement(config, GetRecordCreateDefaults);
        expect(elm.pushCount()).toBe(1);
        expect(elm.getWiredData()).toEqualSnapshotWithoutEtags(mock);
    });

    it('should cache correctly when layout is null', async () => {
        const mock = getMock('record-defaults-Partner');

        const config = {
            objectApiName: 'Partner',
        };

        mockGetRecordCreateDefaultsNetwork(config, mock);

        const wireA = await setupElement(config, GetRecordCreateDefaults);
        expect(wireA.pushCount()).toBe(1);
        expect(wireA.getWiredData()).toEqualSnapshotWithoutEtags(mock);

        const wireB = await setupElement(config, GetRecordCreateDefaults);

        expect(wireB.pushCount()).toBe(1);
        expect(wireB.getWiredData()).toEqualSnapshotWithoutEtags(mock);

        // wireA should not have received new data
        expect(wireA.pushCount()).toBe(1);
    });

    it('should make correct HTTP requests for multiple requests on same entity with different optionalFields', async () => {
        const mockA = getMock('record-defaults-create-Account-optionalFields-Account.YearStarted');
        const mockB = getMock('record-defaults-create-Account-optionalFields-Account.Test');
        const configA = {
            objectApiName: 'Account',
            optionalFields: ['Account.YearStarted'],
        };
        const configB = {
            objectApiName: 'Account',
            optionalFields: ['Account.Test'],
        };

        mockGetRecordCreateDefaultsNetwork(configA, mockA);
        mockGetRecordCreateDefaultsNetwork(configB, mockB);

        const elmA = await setupElement(configA, GetRecordCreateDefaults);
        const elmB = await setupElement(configB, GetRecordCreateDefaults);

        // Without the fix added in W-7081913, this test would fail because the network mocks would be hit more than once.
        expect(elmA.pushCount()).toBe(1);
        expect(elmA.getWiredData()).toEqualSnapshotWithoutEtags(mockA);
        expect(elmB.pushCount()).toBe(1);
        expect(elmB.getWiredData()).toEqualSnapshotWithoutEtags(mockB);
    });
});

describe('getRecordCreateDefaults refreshes', () => {
    it('when a related object info changes', async () => {
        const mockRecordCreateDefaults = getMock('record-defaults-create-Account');
        const mockObjectInfo = getMock('object-info-Account');
        mockObjectInfo.eTag = 'e7c7f7e02c57bdcfa9d751b5a508f907';
        mockObjectInfo.updateable = false;

        const config = {
            objectApiName: 'Account',
        };

        mockGetRecordCreateDefaultsNetwork(config, mockRecordCreateDefaults);
        const wireGetRecordCreateDefaults = await setupElement(config, GetRecordCreateDefaults);
        expect(wireGetRecordCreateDefaults.pushCount()).toBe(1);

        expireObjectInfo();
        mockGetObjectInfoNetwork(config, mockObjectInfo);

        await setupElement(config, GetObjectInfo);

        expect(wireGetRecordCreateDefaults.pushCount()).toBe(2);
    });

    it('when a related layout changes', async () => {
        const mockRecordCreateDefaults = getMock('record-defaults-create-Account');
        const mockLayout = getMock('layout-Account-Full-Create');
        mockLayout.eTag = 'e7c7f7e02c57bdcfa9d751b5a508f907';
        mockLayout.sections[0].collapsible = true;

        const config = {
            objectApiName: 'Account',
        };

        mockGetRecordCreateDefaultsNetwork(config, mockRecordCreateDefaults);
        const wireGetRecordCreateDefaults = await setupElement(config, GetRecordCreateDefaults);
        expect(wireGetRecordCreateDefaults.pushCount()).toBe(1);

        expireLayout();

        const layoutConfig = {
            objectApiName: 'Account',
            layoutType: mockLayout.layoutType,
            mode: mockLayout.mode,
            recordTypeId: mockRecordCreateDefaults.record.recordTypeId,
        };
        mockGetLayoutNetwork(layoutConfig, mockLayout);

        await setupElement(layoutConfig, GetLayout);

        expect(wireGetRecordCreateDefaults.pushCount()).toBe(2);
    });

    it('when recordTypeId changes', async () => {
        const mockRecordCreateDefaults1 = getMock(
            'record-defaults-create-TestEntity__c-recordTypeId-1'
        );
        const config1 = {
            objectApiName: mockRecordCreateDefaults1.record.apiName,
            recordTypeId: mockRecordCreateDefaults1.record.recordTypeId,
        };

        mockGetRecordCreateDefaultsNetwork(config1, mockRecordCreateDefaults1);
        const wireGetRecordCreateDefaults = await setupElement(config1, GetRecordCreateDefaults);
        expect(wireGetRecordCreateDefaults.pushCount()).toBe(1);
        expect(wireGetRecordCreateDefaults.getWiredData()).toEqualSnapshotWithoutEtags(
            mockRecordCreateDefaults1
        );

        const mockRecordCreateDefaults2 = getMock(
            'record-defaults-create-TestEntity__c-recordTypeId-2'
        );
        const config2 = {
            objectApiName: mockRecordCreateDefaults2.record.apiName,
            recordTypeId: mockRecordCreateDefaults2.record.recordTypeId,
        };

        mockGetRecordCreateDefaultsNetwork(config2, mockRecordCreateDefaults2);

        await updateElement(wireGetRecordCreateDefaults, config2);

        expect(wireGetRecordCreateDefaults.pushCount()).toBe(2);
        expect(wireGetRecordCreateDefaults.getWiredData()).toEqualSnapshotWithoutEtags(
            mockRecordCreateDefaults2
        );

        await updateElement(wireGetRecordCreateDefaults, config1);

        expect(wireGetRecordCreateDefaults.pushCount()).toBe(3);
        expect(wireGetRecordCreateDefaults.getWiredData()).toEqualSnapshotWithoutEtags(
            mockRecordCreateDefaults1
        );
    });
});

describe('related wire', () => {
    it('does not refresh when getRecordCreateDefaults brings back no change to object info', async () => {
        const mockRecordCreateDefaults = getMock('record-defaults-create-Account');
        const mockObjectInfo = getMock('object-info-Account');

        const config = {
            objectApiName: 'Account',
        };
        mockGetObjectInfoNetwork(config, mockObjectInfo);
        mockGetRecordCreateDefaultsNetwork(config, mockRecordCreateDefaults);

        const wireObjectInfo = await setupElement(config, GetObjectInfo);
        expect(wireObjectInfo.pushCount()).toBe(1);

        await setupElement(config, GetRecordCreateDefaults);

        expect(wireObjectInfo.pushCount()).toBe(1);
    });

    it('does not refresh when getRecordCreateDefaults requests invalid optional field', async () => {
        const mockRecordCreateDefaults = getMock('record-defaults-create-Account');

        const config = {
            objectApiName: 'Account',
            optionalFields: ['Account.InvalidField'],
        };
        mockGetRecordCreateDefaultsNetwork(config, mockRecordCreateDefaults);

        const wireGetRecordCreateDefaults = await setupElement(config, GetRecordCreateDefaults);
        expect(wireGetRecordCreateDefaults.pushCount()).toBe(1);
        const wireGetRecordCreateDefaults2 = await setupElement(config, GetRecordCreateDefaults);
        expect(wireGetRecordCreateDefaults.pushCount()).toBe(1);
        expect(wireGetRecordCreateDefaults2.pushCount()).toBe(1);
    });

    it('refreshes when getRecordCreateDefaults brings back an updated object info', async () => {
        const mockRecordCreateDefaults = getMock('record-defaults-create-Account');
        const mockObjectInfo = getMock('object-info-Account');
        mockObjectInfo.eTag = 'e7c7f7e02c57bdcfa9d751b5a508f907';
        mockObjectInfo.updateable = false;

        const config = {
            objectApiName: 'Account',
        };
        mockGetObjectInfoNetwork(config, mockObjectInfo);
        mockGetRecordCreateDefaultsNetwork(config, mockRecordCreateDefaults);

        const wireObjectInfo = await setupElement(config, GetObjectInfo);
        expect(wireObjectInfo.pushCount()).toBe(1);

        await setupElement(config, GetRecordCreateDefaults);

        expect(wireObjectInfo.pushCount()).toBe(2);
    });

    it('does not refresh when getRecordCreateDefaults brings back no change to layout', async () => {
        const mockRecordCreateDefaults = getMock('record-defaults-create-Account');
        const mockLayout = getMock('layout-Account-Full-Create');

        const config = {
            objectApiName: 'Account',
        };
        mockGetRecordCreateDefaultsNetwork(config, mockRecordCreateDefaults);

        const layoutConfig = {
            objectApiName: 'Account',
            layoutType: mockLayout.layoutType,
            mode: mockLayout.mode,
            recordTypeId: mockRecordCreateDefaults.record.recordTypeId,
        };
        mockGetLayoutNetwork(layoutConfig, mockLayout);

        const wireGetLayout = await setupElement(layoutConfig, GetLayout);

        expect(wireGetLayout.pushCount()).toBe(1);

        await setupElement(config, GetRecordCreateDefaults);

        expect(wireGetLayout.pushCount()).toBe(1);
    });

    it('refreshes when getRecordCreateDefaults brings back an update to layout', async () => {
        const mockRecordCreateDefaults = getMock('record-defaults-create-Account');
        const mockLayout = getMock('layout-Account-Full-Create');
        mockLayout.eTag = 'e7c7f7e02c57bdcfa9d751b5a508f907';
        mockLayout.sections[0].collapsible = true;

        const config = {
            objectApiName: 'Account',
        };
        mockGetRecordCreateDefaultsNetwork(config, mockRecordCreateDefaults);

        const layoutConfig = {
            objectApiName: 'Account',
            layoutType: mockLayout.layoutType,
            mode: mockLayout.mode,
            recordTypeId: mockRecordCreateDefaults.record.recordTypeId,
        };
        mockGetLayoutNetwork(layoutConfig, mockLayout);

        const wireGetLayout = await setupElement(layoutConfig, GetLayout);

        expect(wireGetLayout.pushCount()).toBe(1);

        await setupElement(config, GetRecordCreateDefaults);

        expect(wireGetLayout.pushCount()).toBe(2);
    });
});

describe('refresh', () => {
    it('should refresh get record create defaults', async () => {
        const mock = getMock('record-defaults-create-Account');
        const refreshed = getMock('record-defaults-create-Account');
        refreshed.layout.eTag = refreshed.layout.eTag + '999';
        refreshed.layout.sections[0].collapsible = !refreshed.layout.sections[0].collapsible;

        const config = {
            objectApiName: 'Account',
        };

        mockGetRecordCreateDefaultsNetwork(config, [mock, refreshed]);

        const element = await setupElement(config, GetRecordCreateDefaults);

        expect(element.pushCount()).toBe(1);
        expect(element.getWiredData()).toEqualSnapshotWithoutEtags(mock);

        await element.refresh();

        expect(element.pushCount()).toBe(2);
        expect(element.getWiredData()).toEqualSnapshotWithoutEtags(refreshed);
    });
});

describe('getRecordCreateDefaults_imperative', () => {
    it('uses caller-supplied cache policy', async () => {
        const mock1 = getMock('record-defaults-create-Account');
        const mock2 = getMock('record-defaults-create-Account');
        mock2.layout.eTag = mock2.layout.eTag + '999';
        mock2.layout.sections[0].collapsible = !mock2.layout.sections[0].collapsible;

        const config = {
            objectApiName: 'Account',
        };

        mockGetRecordCreateDefaultsNetwork(config, [mock1, mock2]);

        const callback = jasmine.createSpy();

        // populate cache with mock1
        getRecordCreateDefaults_imperative.invoke(config, undefined, callback);
        await flushPromises();

        callback.calls.reset();

        // should emit mock1 from cache, then make network call & emit mock2
        getRecordCreateDefaults_imperative.subscribe(
            config,
            { cachePolicy: { type: 'cache-and-network' } },
            callback
        );
        await flushPromises();

        expect(callback).toHaveBeenCalledTimes(2);
        expect(callback.calls.argsFor(0)).toEqual([{ data: stripEtags(mock1), error: undefined }]);
        expect(callback.calls.argsFor(1)).toEqual([{ data: stripEtags(mock2), error: undefined }]);
    });
});
