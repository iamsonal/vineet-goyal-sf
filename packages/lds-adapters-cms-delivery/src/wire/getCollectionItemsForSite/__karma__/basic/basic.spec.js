import { getMock as globalGetMock, setupElement } from 'test-util';
import {
    mockCollectionItemsForSiteMatcher,
    mockCollectionItemsForSiteMatcherErrorOnce,
    clearContentListCache,
    expireContentList,
} from '../../../../../karma/cms-delivery-test-util';
import GetCollectionItemsForSite from '../lwc/get-collection-items-for-site';

const MOCK_PREFIX = 'wire/getCollectionItemsForSite/__karma__/data/';
const TEST_CONFIG = {
    siteId: '0DMT300000000idOAA',
    collectionKeyOrId: 'MC3XKWIYJC2JHUDDJB3LKZHG4ICM',
};

function getMock(filename) {
    return globalGetMock(MOCK_PREFIX + filename);
}

describe('basic', () => {
    it('fetches content successfully using a valid configuration', async () => {
        const mock = getMock('collectionItemsForSite');

        mockCollectionItemsForSiteMatcher(TEST_CONFIG, mock);

        const el = await setupElement(TEST_CONFIG, GetCollectionItemsForSite);
        expect(el.pushCount()).toBe(1);
        expect(el.collectionItemsForSite).toEqual(mock);
    });

    it('makes single network call for multiple wire function invocations', async () => {
        const mock = getMock('collectionItemsForSite');

        // Mock network request once only
        mockCollectionItemsForSiteMatcher(TEST_CONFIG, mock);

        const el = await setupElement(TEST_CONFIG, GetCollectionItemsForSite);
        expect(el.pushCount()).toBe(1);
        expect(el.collectionItemsForSite).toEqual(mock);

        // second element should receive a value from LDS
        // even though it only mocked the network request once
        const el2 = await setupElement(TEST_CONFIG, GetCollectionItemsForSite);
        expect(el2.pushCount()).toBe(1);
        expect(el2.collectionItemsForSite).toEqual(mock);
    });

    it('fetches a second time, i.e. cache miss for another component with different config', async () => {
        const mock = getMock('collectionItemsForSite');

        const config2 = {
            siteId: '0DMT300000001J8OAI',
            collectionKeyOrId: 'MC3XKWIYJC2JHUDDJB3LKZHG4ICM',
        };

        mockCollectionItemsForSiteMatcher(TEST_CONFIG, mock);
        mockCollectionItemsForSiteMatcher(config2, mock);

        const el1 = await setupElement(TEST_CONFIG, GetCollectionItemsForSite);
        expect(el1.collectionItemsForSite).toEqual(mock);

        const el2 = await setupElement(config2, GetCollectionItemsForSite);
        expect(el2.collectionItemsForSite).toEqual(mock);

        // Each element receive 1 push
        expect(el1.pushCount()).toBe(1);
        expect(el2.pushCount()).toBe(1);
    });

    it('makes two network calls when time elapsed > TTL', async () => {
        const mock = getMock('collectionItemsForSite');

        mockCollectionItemsForSiteMatcher(TEST_CONFIG, [mock, mock]);

        const el1 = await setupElement(TEST_CONFIG, GetCollectionItemsForSite);

        expect(el1.pushCount()).toBe(1);
        expect(el1.collectionItemsForSite).toEqualSnapshotWithoutEtags(mock);

        expireContentList();

        const el2 = await setupElement(TEST_CONFIG, GetCollectionItemsForSite);

        expect(el2.pushCount()).toBe(1);
        expect(el2.collectionItemsForSite).toEqualSnapshotWithoutEtags(mock);

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

        mockCollectionItemsForSiteMatcherErrorOnce(TEST_CONFIG, mock);

        const el = await setupElement(TEST_CONFIG, GetCollectionItemsForSite);
        expect(el.pushCount()).toBe(1);
        expect(el.getError()).toEqual(mock);
    });

    it('causes a cache hit when a collectionItems are queried after server returned 404', async () => {
        const mockError = {
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

        mockCollectionItemsForSiteMatcher(TEST_CONFIG, [
            {
                reject: true,
                data: mockError,
            },
        ]);

        const elm = await setupElement(TEST_CONFIG, GetCollectionItemsForSite);
        expect(elm.getError()).toEqual(mockError);
        expect(elm.getError()).toBeImmutable();

        const secondElm = await setupElement(TEST_CONFIG, GetCollectionItemsForSite);
        expect(secondElm.getError()).toEqual(mockError);
        expect(secondElm.getError()).toBeImmutable();
    });

    it('causes a cache miss when a collectionItems are queried again after server returned 404, and cache is cleared', async () => {
        const collectionItemsForSiteMock = getMock('collectionItemsForSite');

        const mockError = {
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

        mockCollectionItemsForSiteMatcher(TEST_CONFIG, [
            {
                reject: true,
                data: mockError,
            },
            collectionItemsForSiteMock,
        ]);

        const elm = await setupElement(TEST_CONFIG, GetCollectionItemsForSite);
        expect(elm.getError()).toEqual(mockError);

        clearContentListCache();

        const secondElm = await setupElement(TEST_CONFIG, GetCollectionItemsForSite);
        expect(secondElm.getError()).toBeUndefined();
        expect(secondElm.collectionItemsForSite).toEqual(collectionItemsForSiteMock);
    });
});
