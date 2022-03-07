import timekeeper from 'timekeeper';
import GetConnectionSourceObjects from '../lwc/get-connection-source-objects';
import { getMock as globalGetMock, setupElement, updateElement } from 'test-util';
import {
    mockGetConnectionSourceObjectsNetworkOnce,
    mockGetConnectionSourceObjectsNetworkErrorOnce,
} from 'analytics-data-service-test-util';

const MOCK_PREFIX = 'wire/getConnectionSourceObjects/__karma__/data/';
const id = 'c08fdb87-a196-46aa-8b44-5ad6e9e253c4';
const TTL = 5000;

function getMock(filename) {
    return globalGetMock(MOCK_PREFIX + filename);
}

describe('basic', () => {
    it('gets connection source objects', async () => {
        const mock = getMock('connection-source-objects');
        const config = { id };
        mockGetConnectionSourceObjectsNetworkOnce(config, mock);

        const el = await setupElement(config, GetConnectionSourceObjects);
        expect(el.pushCount()).toBe(1);
        expect(el.getWiredData()).toEqual(mock);
    });

    it('gets connection source objects with params', async () => {
        const mock = getMock('connection-source-objects-with-params');
        const config = {
            id,
            page: 0,
            pageSize: 2,
            q: '',
        };
        mockGetConnectionSourceObjectsNetworkOnce(config, mock);

        const el = await setupElement(config, GetConnectionSourceObjects);
        expect(el.pushCount()).toBe(1);
        expect(el.getWiredData()).toEqual(mock);
    });

    it('does not fetch a second time', async () => {
        const mock = getMock('connection-source-objects');
        const config = { id };
        mockGetConnectionSourceObjectsNetworkOnce(config, mock);

        const el = await setupElement(config, GetConnectionSourceObjects);
        expect(el.pushCount()).toBe(1);
        expect(el.getWiredData()).toEqual(mock);

        const el2 = await setupElement(config, GetConnectionSourceObjects);
        expect(el2.pushCount()).toBe(1);
        expect(el2.getWiredData()).toEqual(mock);
    });

    it('fetch a second time after TTL expires', async () => {
        const mock = getMock('connection-source-objects');
        const config = { id };
        mockGetConnectionSourceObjectsNetworkOnce(config, [mock, mock]);

        const el = await setupElement(config, GetConnectionSourceObjects);
        expect(el.pushCount()).toBe(1);
        expect(el.getWiredData()).toEqual(mock);

        timekeeper.travel(Date.now() + TTL + 1);

        await updateElement(el, config);
        expect(el.pushCount()).toBe(2);
        expect(el.getWiredData()).toEqual(mock);
    });

    it('does not fetch on individual source object if the collection has already been retrieved', async () => {
        const mock = getMock('connection-source-objects');
        const config = { id };
        mockGetConnectionSourceObjectsNetworkOnce(config, mock);

        const el = await setupElement(config, GetConnectionSourceObjects);
        expect(el.pushCount()).toBe(1);
        expect(el.getWiredData()).toEqual(mock);

        const config2 = {
            id: 'c08fdb87-a196-46aa-8b44-5ad6e9e253c4',
            name: 'Account',
        };
        const el2 = await setupElement(config2, GetConnectionSourceObjects);
        expect(el2.pushCount()).toBe(1);
        expect(el2.getWiredData().sourceObjects.length).toBe(2);
        expect(el2.getWiredData().sourceObjects[0].name).toEqual(config2.name);
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
        const config = { id };
        mockGetConnectionSourceObjectsNetworkErrorOnce(config, mock);

        const el = await setupElement(config, GetConnectionSourceObjects);
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
        const config = { id };
        mockGetConnectionSourceObjectsNetworkOnce(config, [
            {
                reject: true,
                status: 404,
                statusText: 'Not Found',
                ok: false,
                data: mock,
            },
        ]);

        const el = await setupElement(config, GetConnectionSourceObjects);
        expect(el.pushCount()).toBe(1);
        expect(el.getWiredError()).toEqual(mock);

        const el2 = await setupElement(config, GetConnectionSourceObjects);
        expect(el2.pushCount()).toBe(1);
        expect(el2.getWiredError()).toEqual(mock);
    });
});
