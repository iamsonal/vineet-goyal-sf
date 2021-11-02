import timekeeper from 'timekeeper';
import GetFields from '../lwc/get-fields';
import { getMock as globalGetMock, setupElement } from 'test-util';
import {
    mockGetFieldsNetworkOnce,
    mockGetFieldsNetworkErrorOnce,
} from 'analytics-data-service-test-util';

const MOCK_PREFIX = 'wire/getFields/__karma__/data/';
const MOCK_ID = 'c08fdb87-a196-46aa-8b44-5ad6e9e253c4';
const MOCK_OBJECT = 'Account';

const CONFIG = { id: MOCK_ID, sourceObjectName: MOCK_OBJECT };

const TTL = 5000;

function getMock(filename) {
    return globalGetMock(MOCK_PREFIX + filename);
}

describe('basic', () => {
    it('gets data fields', async () => {
        const mock = getMock('fields');
        mockGetFieldsNetworkOnce(CONFIG, mock);

        const el = await setupElement(CONFIG, GetFields);
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
        mockGetFieldsNetworkErrorOnce(CONFIG, mock);

        const el = await setupElement(CONFIG, GetFields);
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
        mockGetFieldsNetworkOnce(CONFIG, {
            reject: true,
            data: mock,
        });

        const el = await setupElement(CONFIG, GetFields);
        expect(el.pushCount()).toBe(1);
        expect(el.getWiredError()).toEqual(mock);

        const el2 = await setupElement(CONFIG, GetFields);
        expect(el2.pushCount()).toBe(1);
        expect(el2.getWiredError()).toEqual(mock);
    });
});

describe('caching', () => {
    it('returns cached result when cached data is available', async () => {
        const mock = getMock('fields');
        mockGetFieldsNetworkOnce(CONFIG, mock);

        // populate cache
        await setupElement(CONFIG, GetFields);

        // second component should have the cached data without hitting network
        const element = await setupElement(CONFIG, GetFields);

        expect(element.getWiredData()).toEqual(mock);
    });

    it('retrieves data from network when cached data is expired', async () => {
        const mock = getMock('fields');
        const updatedData = getMock('fields-updated');
        mockGetFieldsNetworkOnce(CONFIG, [mock, updatedData]);

        // populate cache
        await setupElement(CONFIG, GetFields);

        // expire cache
        timekeeper.travel(Date.now() + TTL + 1);

        // second component should retrieve from network with updated data
        const element = await setupElement(CONFIG, GetFields);

        expect(element.getWiredData()).toEqual(updatedData);
    });
});
