import GetConnectionSourceObject from '../lwc/get-connection-source-object';
import { getMock as globalGetMock, setupElement } from 'test-util';
import {
    mockGetConnectionSourceObjectNetworkOnce,
    mockGetConnectionSourceObjectNetworkErrorOnce,
} from 'analytics-data-service-test-util';

const MOCK_PREFIX = 'wire/getConnectionSourceObject/__karma__/data/';
const config = {
    id: 'c08fdb87-a196-46aa-8b44-5ad6e9e253c4',
    sourceObjectName: 'Account',
};

function getMock(filename) {
    return globalGetMock(MOCK_PREFIX + filename);
}

describe('basic', () => {
    it('gets connection source object', async () => {
        const mock = getMock('connection-source-object');
        mockGetConnectionSourceObjectNetworkOnce(config, mock);

        const el = await setupElement(config, GetConnectionSourceObject);
        expect(el.pushCount()).toBe(1);
        expect(el.getWiredData()).toEqual(mock);
    });

    it('does not fetch a second time', async () => {
        const mock = getMock('connection-source-object');
        mockGetConnectionSourceObjectNetworkOnce(config, mock);

        const el = await setupElement(config, GetConnectionSourceObject);
        expect(el.pushCount()).toBe(1);
        expect(el.getWiredData()).toEqual(mock);

        const el2 = await setupElement(config, GetConnectionSourceObject);
        expect(el2.pushCount()).toBe(1);
        expect(el2.getWiredData()).toEqual(mock);
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
        mockGetConnectionSourceObjectNetworkErrorOnce(config, mock);

        const el = await setupElement(config, GetConnectionSourceObject);
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
        mockGetConnectionSourceObjectNetworkOnce(config, [
            {
                reject: true,
                status: 404,
                statusText: 'Not Found',
                ok: false,
                data: mock,
            },
        ]);

        const el = await setupElement(config, GetConnectionSourceObject);
        expect(el.pushCount()).toBe(1);
        expect(el.getWiredError()).toEqual(mock);

        const el2 = await setupElement(config, GetConnectionSourceObject);
        expect(el2.pushCount()).toBe(1);
        expect(el2.getWiredError()).toEqual(mock);
    });
});
