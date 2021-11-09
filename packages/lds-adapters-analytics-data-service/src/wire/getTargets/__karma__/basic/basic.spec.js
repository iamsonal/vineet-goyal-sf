import timekeeper from 'timekeeper';
import GetTargets from '../lwc/get-targets';
import { getMock as globalGetMock, setupElement } from 'test-util';
import {
    mockGetTargetsNetworkOnce,
    mockGetTargetsNetworkErrorOnce,
} from 'analytics-data-service-test-util';

const MOCK_PREFIX = 'wire/getTargets/__karma__/data/';

const TTL = 5000;

const CONNECTION_ID = 'some_id';

function getMock(filename) {
    return globalGetMock(MOCK_PREFIX + filename);
}

describe('basic', () => {
    it('gets data targets', async () => {
        const mock = getMock('targets');
        const config = {};
        mockGetTargetsNetworkOnce(config, mock);

        const el = await setupElement(config, GetTargets);
        expect(el.pushCount()).toBe(1);
        expect(el.getWiredData()).toEqual(mock);
    });

    it('displays error when network request 404s', async () => {
        const mock = {
            ok: false,
            status: 404,
            statusText: 'NOT_FOUND',
            body: [
                {
                    errorCode: 'NOT_FOUND',
                    message: 'The requested resource does not exist',
                },
            ],
        };
        const config = {};
        mockGetTargetsNetworkErrorOnce(config, mock);

        const el = await setupElement(config, GetTargets);
        expect(el.pushCount()).toBe(1);
        expect(el.getWiredError()).toEqual(mock);
    });

    it('should cause a cache hit on query after server returned 404', async () => {
        const mock = {
            ok: false,
            status: 404,
            statusText: 'NOT_FOUND',
            body: [
                {
                    errorCode: 'NOT_FOUND',
                    message: 'The requested resource does not exist',
                },
            ],
        };
        const config = {};
        mockGetTargetsNetworkOnce(config, {
            reject: true,
            data: mock,
        });

        const el = await setupElement(config, GetTargets);
        expect(el.pushCount()).toBe(1);
        expect(el.getWiredError()).toEqual(mock);

        const el2 = await setupElement(config, GetTargets);
        expect(el2.pushCount()).toBe(1);
        expect(el2.getWiredError()).toEqual(mock);
    });
});

describe('caching', () => {
    it('returns cached result when cached data is available', async () => {
        const mock = getMock('targets');
        const config = {};
        mockGetTargetsNetworkOnce(config, mock);

        // populate cache
        await setupElement(config, GetTargets);

        // second component should have the cached data without hitting network
        const element = await setupElement(config, GetTargets);

        expect(element.getWiredData()).toEqual(mock);
    });

    it('retrieves data from network when cached data is expired', async () => {
        const mock = getMock('targets');
        const updatedData = getMock('targets-updated');
        const config = {};
        mockGetTargetsNetworkOnce(config, [mock, updatedData]);

        // populate cache
        await setupElement(config, GetTargets);

        // expire cache
        timekeeper.travel(Date.now() + TTL + 1);

        // second component should retrieve from network with updated data
        const element = await setupElement(config, GetTargets);

        expect(element.getWiredData()).toEqual(updatedData);
    });
});

describe('basic with query param', () => {
    it('gets data targets', async () => {
        const mock = getMock('targets');
        const config = { connectionId: CONNECTION_ID };
        mockGetTargetsNetworkOnce(config, mock);

        const el = await setupElement(config, GetTargets);
        expect(el.pushCount()).toBe(1);
        expect(el.getWiredData()).toEqual(mock);
    });

    it('displays error when network request 404s', async () => {
        const mock = {
            ok: false,
            status: 404,
            statusText: 'NOT_FOUND',
            body: [
                {
                    errorCode: 'NOT_FOUND',
                    message: 'The requested resource does not exist',
                },
            ],
        };
        const config = { connectionId: CONNECTION_ID };
        mockGetTargetsNetworkErrorOnce(config, mock);

        const el = await setupElement(config, GetTargets);
        expect(el.pushCount()).toBe(1);
        expect(el.getWiredError()).toEqual(mock);
    });

    it('should cause a cache hit on query after server returned 404', async () => {
        const mock = {
            ok: false,
            status: 404,
            statusText: 'NOT_FOUND',
            body: [
                {
                    errorCode: 'NOT_FOUND',
                    message: 'The requested resource does not exist',
                },
            ],
        };
        const config = { connectionId: CONNECTION_ID };
        mockGetTargetsNetworkOnce(config, {
            reject: true,
            data: mock,
        });

        const el = await setupElement(config, GetTargets);
        expect(el.pushCount()).toBe(1);
        expect(el.getWiredError()).toEqual(mock);

        const el2 = await setupElement(config, GetTargets);
        expect(el2.pushCount()).toBe(1);
        expect(el2.getWiredError()).toEqual(mock);
    });
});

describe('caching with query param', () => {
    it('returns cached result when cached data is available', async () => {
        const mock = getMock('targets');
        const config = { connectionId: CONNECTION_ID };
        mockGetTargetsNetworkOnce(config, mock);

        // populate cache
        await setupElement(config, GetTargets);

        // second component should have the cached data without hitting network
        const element = await setupElement(config, GetTargets);

        expect(element.getWiredData()).toEqual(mock);
    });

    it('retrieves data from network when cached data is expired', async () => {
        const mock = getMock('targets');
        const updatedData = getMock('targets-updated');
        const config = { connectionId: CONNECTION_ID };
        mockGetTargetsNetworkOnce(config, [mock, updatedData]);

        // populate cache
        await setupElement(config, GetTargets);

        // expire cache
        timekeeper.travel(Date.now() + TTL + 1);

        // second component should retrieve from network with updated data
        const element = await setupElement(config, GetTargets);

        expect(element.getWiredData()).toEqual(updatedData);
    });
});
