import { getMock as globalGetMock, setupElement } from 'test-util';
import { expireActions, mockGetObjectCreateActionsNetwork } from 'uiapi-test-util';
import ObjectCreateActions from '../lwc/object-create-actions';

const MOCK_PREFIX = 'wire/getObjectCreateActions/__karma__/basic/data/';

function getMock(filename) {
    return globalGetMock(MOCK_PREFIX + filename);
}

describe('basic', () => {
    it('fetches data from network', async () => {
        const mockData = getMock('object-create-actions');
        const config = {
            objectApiName: 'Account',
        };
        mockGetObjectCreateActionsNetwork(config, mockData);

        const element = await setupElement(config, ObjectCreateActions);

        expect(element.getWiredData()).toEqualActionsSnapshot(mockData);
    });
});

describe('caching', () => {
    it('returns cached result when cached data is available', async () => {
        const mockData = getMock('object-create-actions');
        const config = {
            objectApiName: 'Account',
        };
        mockGetObjectCreateActionsNetwork(config, mockData);

        // populate cache
        await setupElement(config, ObjectCreateActions);

        // second component should have the cached data without hitting network
        const element = await setupElement(config, ObjectCreateActions);

        expect(element.getWiredData()).toEqualActionsSnapshot(mockData);
    });

    it('retrieves data from network when cached data is expired', async () => {
        const mockData = getMock('object-create-actions');
        const updatedData = getMock('object-create-actions');
        Object.assign(updatedData, {
            eTag: mockData.eTag + '999',
        });
        const config = {
            objectApiName: 'Account',
        };
        mockGetObjectCreateActionsNetwork(config, [mockData, updatedData]);

        // populate cache
        await setupElement(config, ObjectCreateActions);

        // expire cache
        expireActions();

        // second component should retrieve from network with updated data
        const element = await setupElement(config, ObjectCreateActions);

        expect(element.getWiredData()).toEqualActionsSnapshot(updatedData);
    });
});

describe('data emit', () => {
    it('emits updated data to wire with same config', async () => {
        const mockData = getMock('object-create-actions');
        const updatedData = getMock('object-create-actions');

        const config = {
            objectApiName: 'Account',
        };
        mockGetObjectCreateActionsNetwork(config, [mockData, updatedData]);

        const element = await setupElement(config, ObjectCreateActions);
        expireActions();

        // fetches updated data from network
        await setupElement(config, ObjectCreateActions);

        expect(element.pushCount()).toBe(1);
        expect(element.getWiredData()).toEqualActionsSnapshot(updatedData);
    });

    it('should not emit data to wires if data from network is same', async () => {
        const mockData = getMock('object-create-actions');
        const config = {
            objectApiName: 'Account',
        };
        mockGetObjectCreateActionsNetwork(config, [mockData, mockData]);

        const element = await setupElement(config, ObjectCreateActions);
        expireActions();

        // fetches updated data from network
        await setupElement(config, ObjectCreateActions);

        expect(element.pushCount()).toBe(1);
    });

    it('bad objectApiName emits error', async () => {
        const mockData = getMock('object-create-error');

        const config = {
            objectApiName: 'Invalid',
        };

        mockGetObjectCreateActionsNetwork(config, { reject: true, data: mockData });

        const elm = await setupElement(config, ObjectCreateActions);
        expect(elm.getWiredError()).toContainErrorResponse(mockData);
    });

    it('should be a cache hit when ingested 404 does not exceed ttl', async () => {
        const mockError = getMock('object-create-error');

        const config = { objectApiName: 'Account' };
        mockGetObjectCreateActionsNetwork(config, {
            status: 404,
            statusText: 'Not Found',
            ok: false,
            reject: true,
            data: mockError,
        });

        const element = await setupElement(config, ObjectCreateActions);

        expect(element.pushCount()).toBe(1);
        expect(element.getWiredError()).toContainErrorResponse(mockError);

        const elementB = await setupElement(config, ObjectCreateActions);

        expect(elementB.pushCount()).toBe(1);
        expect(elementB.getWiredError()).toContainErrorResponse(mockError);
    });

    it('should refresh when ingested error exceeds ttl', async () => {
        const mock = getMock('object-create-actions');
        const mockError = getMock('object-create-error');

        const config = { objectApiName: 'Account' };
        mockGetObjectCreateActionsNetwork(config, [
            {
                status: 404,
                statusText: 'Not Found',
                ok: false,
                reject: true,
                data: mockError,
            },
            mock,
        ]);

        const element = await setupElement(config, ObjectCreateActions);

        expect(element.pushCount()).toBe(1);
        expect(element.getWiredError()).toContainErrorResponse(mockError);

        expireActions();

        const elementB = await setupElement(config, ObjectCreateActions);

        expect(elementB.pushCount()).toBe(1);
        expect(elementB.getWiredError()).toBeUndefined();
        expect(elementB.getWiredData()).toEqualActionsSnapshot(mock);
    });
});
