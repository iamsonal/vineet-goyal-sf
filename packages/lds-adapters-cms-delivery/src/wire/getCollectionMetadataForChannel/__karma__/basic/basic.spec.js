import { getMock as globalGetMock, setupElement } from 'test-util';
import {
    mockCollectionMetadtaForChannelMatcher,
    mockCollectionMetadataForChannelMatcherErrorOnce,
    clearContentListCache,
    expireContentList,
} from '../../../../../karma/cms-delivery-test-util';
import GetCollectionMetadataForChannel from '../lwc/get-collection-metadata-for-channel';

const MOCK_PREFIX = 'wire/getCollectionMetadataForChannel/__karma__/data/';
const TEST_CONFIG = {
    channelId: '0apxx0000002KibAAE',
    collectionKeyOrId: 'MC3XKWIYJC2JHUDDJB3LKZHG4ICM',
};

function getMock(filename) {
    return globalGetMock(MOCK_PREFIX + filename);
}

describe('basic', () => {
    it('fetches content successfully using a valid configuration', async () => {
        const mock = getMock('collectionMetadataForChannel');

        mockCollectionMetadtaForChannelMatcher(TEST_CONFIG, mock);

        const el = await setupElement(TEST_CONFIG, GetCollectionMetadataForChannel);
        expect(el.pushCount()).toBe(1);
        expect(el.collectionMetadataForChannel).toEqual(mock);
    });

    it('makes single network call for multiple wire function invocations', async () => {
        const mock = getMock('collectionMetadataForChannel');

        // Mock network request once only
        mockCollectionMetadtaForChannelMatcher(TEST_CONFIG, mock);

        const el = await setupElement(TEST_CONFIG, GetCollectionMetadataForChannel);
        expect(el.pushCount()).toBe(1);
        expect(el.collectionMetadataForChannel).toEqual(mock);

        // second element should receive a value from LDS
        // even though it only mocked the network request once
        const el2 = await setupElement(TEST_CONFIG, GetCollectionMetadataForChannel);
        expect(el2.pushCount()).toBe(1);
        expect(el2.collectionMetadataForChannel).toEqual(mock);
    });

    it('fetches a second time, i.e. cache miss for another component with different config', async () => {
        const mock = getMock('collectionMetadataForChannel');

        const config2 = {
            channelId: '0apT300000000HLIAY',
            collectionKeyOrId: 'MC3XKWIYJC2JHUDDJB3LKZHG4ICM',
        };

        mockCollectionMetadtaForChannelMatcher(TEST_CONFIG, mock);
        mockCollectionMetadtaForChannelMatcher(config2, mock);

        const el1 = await setupElement(TEST_CONFIG, GetCollectionMetadataForChannel);
        expect(el1.collectionMetadataForChannel).toEqual(mock);

        const el2 = await setupElement(config2, GetCollectionMetadataForChannel);
        expect(el2.collectionMetadataForChannel).toEqual(mock);

        // Each element receive 1 push
        expect(el1.pushCount()).toBe(1);
        expect(el2.pushCount()).toBe(1);
    });

    it('makes two network calls when time elapsed > TTL', async () => {
        const mock = getMock('collectionMetadataForChannel');

        mockCollectionMetadtaForChannelMatcher(TEST_CONFIG, [mock, mock]);

        const el1 = await setupElement(TEST_CONFIG, GetCollectionMetadataForChannel);

        expect(el1.pushCount()).toBe(1);
        expect(el1.collectionMetadataForChannel).toEqualSnapshotWithoutEtags(mock);

        expireContentList();

        const el2 = await setupElement(TEST_CONFIG, GetCollectionMetadataForChannel);

        expect(el2.pushCount()).toBe(1);
        expect(el2.collectionMetadataForChannel).toEqualSnapshotWithoutEtags(mock);

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

        mockCollectionMetadataForChannelMatcherErrorOnce(TEST_CONFIG, mock);

        const el = await setupElement(TEST_CONFIG, GetCollectionMetadataForChannel);
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

        mockCollectionMetadtaForChannelMatcher(TEST_CONFIG, [
            {
                reject: true,
                data: mockError,
            },
        ]);

        const elm = await setupElement(TEST_CONFIG, GetCollectionMetadataForChannel);
        expect(elm.getError()).toEqual(mockError);
        expect(elm.getError()).toBeImmutable();

        const secondElm = await setupElement(TEST_CONFIG, GetCollectionMetadataForChannel);
        expect(secondElm.getError()).toEqual(mockError);
        expect(secondElm.getError()).toBeImmutable();
    });

    it('causes a cache miss when a collectionItems are queried again after server returned 404, and cache is cleared', async () => {
        const collectionMetadataForChannelMock = getMock('collectionMetadataForChannel');

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

        mockCollectionMetadtaForChannelMatcher(TEST_CONFIG, [
            {
                reject: true,
                data: mockError,
            },
            collectionMetadataForChannelMock,
        ]);

        const elm = await setupElement(TEST_CONFIG, GetCollectionMetadataForChannel);
        expect(elm.getError()).toEqual(mockError);

        clearContentListCache();

        const secondElm = await setupElement(TEST_CONFIG, GetCollectionMetadataForChannel);
        expect(secondElm.getError()).toBeUndefined();
        expect(secondElm.collectionMetadataForChannel).toEqual(collectionMetadataForChannelMock);
    });
});
