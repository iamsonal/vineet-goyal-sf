import { getMock as globalGetMock, setupElement } from 'test-util';
import {
    mockListContentInternal,
    mockListContentInternalErrorOnce,
    expireContentList,
    clearContentListCache,
} from 'cms-delivery-test-util';
import ListContentInternal from '../lwc/list-content-internal';

const MOCK_PREFIX = 'wire/listContentInternal/__karma__/data/';
const TEST_CONFIG = { communityId: '0DB1234567890' };

function getMock(filename) {
    return globalGetMock(MOCK_PREFIX + filename);
}

describe('basic', () => {
    it('gets list of content for given communityId', async () => {
        const mock = getMock('contentList');

        mockListContentInternal(TEST_CONFIG, mock);

        const el = await setupElement(TEST_CONFIG, ListContentInternal);
        expect(el.pushCount()).toBe(1);
        expect(el.contentList).toEqual(mock);
    });

    it('does not fetch a second time, i.e. cache hit, for another component with same config', async () => {
        const mock = getMock('contentList');

        // Mock network request once only
        mockListContentInternal(TEST_CONFIG, mock);

        const el = await setupElement(TEST_CONFIG, ListContentInternal);
        expect(el.pushCount()).toBe(1);
        expect(el.contentList).toEqual(mock);

        // second element should receive a value from LDS
        // even though it only mocked the network request once
        const el2 = await setupElement(TEST_CONFIG, ListContentInternal);
        expect(el2.pushCount()).toBe(1);
        expect(el2.contentList).toEqual(mock);
    });

    it('fetches a second time, i.e. cache miss for another component with different config', async () => {
        const mock = getMock('contentList');

        const config2 = { communityId: '0DB0987654321' };

        mockListContentInternal(TEST_CONFIG, mock);
        mockListContentInternal(config2, mock);

        const el1 = await setupElement(TEST_CONFIG, ListContentInternal);
        expect(el1.contentList).toEqual(mock);

        const el2 = await setupElement(config2, ListContentInternal);
        expect(el2.contentList).toEqual(mock);

        // Each element receive 1 push
        expect(el1.pushCount()).toBe(1);
        expect(el2.pushCount()).toBe(1);
    });

    it('should hit network if contentList is available but expired', async () => {
        const mock = getMock('contentList');

        mockListContentInternal(TEST_CONFIG, [mock, mock]);

        const el1 = await setupElement(TEST_CONFIG, ListContentInternal);

        expect(el1.pushCount()).toBe(1);
        expect(el1.contentList).toEqualSnapshotWithoutEtags(mock);

        expireContentList();

        const el2 = await setupElement(TEST_CONFIG, ListContentInternal);

        expect(el2.pushCount()).toBe(1);
        expect(el2.contentList).toEqualSnapshotWithoutEtags(mock);

        // el2 should not have received new value
        expect(el2.pushCount()).toBe(1);
    });

    it('displays error when network request returns 404s', async () => {
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

        mockListContentInternalErrorOnce(TEST_CONFIG, mock);

        const el = await setupElement(TEST_CONFIG, ListContentInternal);
        expect(el.pushCount()).toBe(1);
        expect(el.getError().body).toEqual(mock);
    });

    it('should cause a cache hit when a contentList is queried after server returned 404', async () => {
        const mockError = [
            {
                errorCode: 'NOT_FOUND',
                message: 'The requested resource does not exist',
            },
        ];

        mockListContentInternal(TEST_CONFIG, [
            {
                reject: true,
                status: 404,
                statusText: 'Not Found',
                ok: false,
                data: mockError,
            },
        ]);

        const expectedError = {
            status: 404,
            statusText: 'Not Found',
            ok: false,
            body: [
                {
                    errorCode: 'NOT_FOUND',
                    message: 'The requested resource does not exist',
                },
            ],
        };

        const elm = await setupElement(TEST_CONFIG, ListContentInternal);
        expect(elm.getError()).toEqual(expectedError);
        expect(elm.getError()).toBeImmutable();

        const secondElm = await setupElement(TEST_CONFIG, ListContentInternal);
        expect(secondElm.getError()).toEqual(expectedError);
        expect(secondElm.getError()).toBeImmutable();
    });

    it('should refetch contentList when ingested contentList error TTLs out', async () => {
        const contentListMock = getMock('contentList');

        const mockError = [
            {
                errorCode: 'NOT_FOUND',
                message: 'The requested resource does not exist',
            },
        ];

        mockListContentInternal(TEST_CONFIG, [
            {
                reject: true,
                status: 404,
                statusText: 'Not Found',
                ok: false,
                data: mockError,
            },
            contentListMock,
        ]);

        const expectedError = {
            status: 404,
            statusText: 'Not Found',
            ok: false,
            body: mockError,
        };

        const elm = await setupElement(TEST_CONFIG, ListContentInternal);
        expect(elm.getError()).toEqual(expectedError);

        clearContentListCache();

        const secondElm = await setupElement(TEST_CONFIG, ListContentInternal);
        expect(secondElm.getError()).toBeUndefined();
        expect(secondElm.contentList).toEqual(contentListMock);
    });
});
