import { getMock as globalGetMock, setupElement } from 'test-util';
import { expireActions, mockGetRecordCreateActionsNetwork } from 'uiapi-test-util';
import RecordCreateActions from '../lwc/record-create-actions';

const MOCK_PREFIX = 'wire/getRecordCreateActions/__karma__/basic/data/';

function getMock(filename) {
    return globalGetMock(MOCK_PREFIX + filename);
}

describe('basic', () => {
    it('fetches data from network', async () => {
        const mockData = getMock('record-create-actions');
        const config = {
            objectApiName: 'Account',
        };
        mockGetRecordCreateActionsNetwork(config, mockData);

        const element = await setupElement(config, RecordCreateActions);

        expect(element.getWiredData()).toEqualActionsSnapshot(mockData);
    });
});

describe('caching', () => {
    it('returns cached result when cached data is available', async () => {
        const mockData = getMock('record-create-actions');
        const config = {
            objectApiName: 'Account',
        };
        mockGetRecordCreateActionsNetwork(config, mockData);

        // populate cache
        await setupElement(config, RecordCreateActions);

        // second component should have the cached data without hitting network
        const element = await setupElement(config, RecordCreateActions);

        expect(element.getWiredData()).toEqualActionsSnapshot(mockData);
    });

    it('retrieves data from network when cached data is expired', async () => {
        const mockData = getMock('record-create-actions');
        const updatedData = getMock('record-create-actions');
        Object.assign(updatedData, {
            eTag: mockData.eTag + '999',
        });
        const config = {
            objectApiName: 'Account',
        };
        mockGetRecordCreateActionsNetwork(config, [mockData, updatedData]);

        // populate cache
        await setupElement(config, RecordCreateActions);

        // expire cache
        expireActions();

        // second component should retrieve from network with updated data
        const element = await setupElement(config, RecordCreateActions);

        expect(element.getWiredData()).toEqualActionsSnapshot(updatedData);
    });
});

describe('data emit', () => {
    it('emits updated data to wire with same config', async () => {
        const mockData = getMock('record-create-actions');
        const updatedData = getMock('record-create-actions');

        const config = {
            objectApiName: 'Account',
        };
        mockGetRecordCreateActionsNetwork(config, [mockData, updatedData]);

        const element = await setupElement(config, RecordCreateActions);
        expireActions();

        // fetches updated data from network
        await setupElement(config, RecordCreateActions);

        expect(element.pushCount()).toBe(1);
        expect(element.getWiredData()).toEqualActionsSnapshot(updatedData);
    });

    it('should not emit data to wires if data from network is same', async () => {
        const mockData = getMock('record-create-actions');
        const config = {
            objectApiName: 'Account',
        };
        mockGetRecordCreateActionsNetwork(config, [mockData, mockData]);

        const element = await setupElement(config, RecordCreateActions);
        expireActions();

        // fetches updated data from network
        await setupElement(config, RecordCreateActions);

        expect(element.pushCount()).toBe(1);
    });

    it('bad objectApiName emits error', async () => {
        const mockData = getMock('record-create-error');

        const config = {
            objectApiName: 'Invalid',
        };

        mockGetRecordCreateActionsNetwork(config, { reject: true, data: mockData });

        const elm = await setupElement(config, RecordCreateActions);
        expect(elm.getWiredError()).toContainErrorResponse(mockData);
    });

    it('should be a cache hit when ingested 404 does not exceed ttl', async () => {
        const mockError = getMock('record-create-error');

        const config = { objectApiName: 'Account' };
        mockGetRecordCreateActionsNetwork(config, {
            status: 404,
            statusText: 'Not Found',
            ok: false,
            reject: true,
            data: mockError,
        });

        const element = await setupElement(config, RecordCreateActions);

        expect(element.pushCount()).toBe(1);
        expect(element.getWiredError()).toContainErrorResponse(mockError);

        const elementB = await setupElement(config, RecordCreateActions);

        expect(elementB.pushCount()).toBe(1);
        expect(elementB.getWiredError()).toContainErrorResponse(mockError);
    });

    it('should refresh when ingested error exceeds ttl', async () => {
        const mock = getMock('record-create-actions');
        const mockError = getMock('record-create-error');

        const config = { objectApiName: 'Account' };
        mockGetRecordCreateActionsNetwork(config, [
            {
                status: 404,
                statusText: 'Not Found',
                ok: false,
                reject: true,
                data: mockError,
            },
            mock,
        ]);

        const element = await setupElement(config, RecordCreateActions);

        expect(element.pushCount()).toBe(1);
        expect(element.getWiredError()).toContainErrorResponse(mockError);

        expireActions();

        const elementB = await setupElement(config, RecordCreateActions);

        expect(elementB.pushCount()).toBe(1);
        expect(elementB.getWiredError()).toBeUndefined();
        expect(elementB.getWiredData()).toEqualActionsSnapshot(mock);
    });
});
