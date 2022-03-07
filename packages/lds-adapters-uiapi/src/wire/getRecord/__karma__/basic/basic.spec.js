import { getRecord_imperative } from 'lds-adapters-uiapi';
import { flushPromises, getMock as globalGetMock, setupElement, stripEtags } from 'test-util';
import { mockGetRecordNetwork } from 'uiapi-test-util';

import RecordFields from '../lwc/record-fields';

const MOCK_PREFIX = 'wire/getRecord/__karma__/basic/data/';

function getMock(filename) {
    return globalGetMock(MOCK_PREFIX + filename);
}

describe('basic', () => {
    it('fetches data from network', async () => {
        const mockData = getMock('record-Account-fields-Account.Id,Account.Name');
        const config = {
            recordId: mockData.id,
            fields: ['Account.Id', 'Account.Name'],
        };
        mockGetRecordNetwork(config, mockData);

        const element = await setupElement(config, RecordFields);

        expect(element.getWiredData()).toEqualSnapshotWithoutEtags(mockData);
    });

    it('fetch record which does not support record type', async () => {
        const mockData = getMock('record-User-fields-User.Id,User.Name');
        const config = {
            recordId: mockData.id,
            fields: ['User.Id', 'User.Name'],
        };
        mockGetRecordNetwork(config, mockData);

        const element = await setupElement(config, RecordFields);

        expect(element.getWiredData()).toEqualSnapshotWithoutEtags(mockData);
    });
});

describe('getRecord_imperative', () => {
    // TODO [W-9803760]: enable when cache-and-network policy is available
    it('uses caller-supplied cache policy when a record is requested with fields', async () => {
        const mockData1 = getMock('record-Account-fields-Account.Id,Account.Name');
        const config = {
            recordId: mockData1.id,
            fields: ['Account.Id', 'Account.Name'],
        };

        const mockData2 = getMock('record-Account-fields-Account.Id,Account.Name');
        mockData2.fields.Name.value = 'updated';
        mockData2.weakEtag += 1;

        mockGetRecordNetwork(config, [mockData1, mockData2]);

        const callback = jasmine.createSpy();

        // populate cache with mockData1
        getRecord_imperative.invoke(config, {}, callback);
        await flushPromises();

        callback.calls.reset();

        // should emit mockRecordUiData1 from cache, then make network call & emit mockRecordUiData2
        getRecord_imperative.subscribe(
            config,
            { cachePolicy: { type: 'cache-and-network' } },
            callback
        );
        await flushPromises();

        expect(callback).toHaveBeenCalledTimes(2);
        expect(callback.calls.argsFor(0)).toEqual([
            { data: stripEtags(mockData1), error: undefined },
        ]);
        expect(callback.calls.argsFor(1)).toEqual([
            { data: stripEtags(mockData2), error: undefined },
        ]);
    });
});
