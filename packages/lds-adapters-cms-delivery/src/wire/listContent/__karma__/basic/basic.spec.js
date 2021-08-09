import { getMock as globalGetMock, setupElement } from 'test-util';
import {
    mockListContent,
    mockListContentErrorOnce,
    expireContentList,
    clearContentListCache,
} from '../../../../../karma/cms-delivery-test-util';
import ListContent from '../lwc/list-content';

const MOCK_PREFIX = 'wire/listContent/__karma__/data/';
const TEST_CONFIG = { communityId: '0DBxx0000004DgCGAU' };

function getMock(filename) {
    return globalGetMock(MOCK_PREFIX + filename);
}

describe('basic', () => {
    it('fetches content successfully using a valid configuration(communityId)', async () => {
        const mock = getMock('contentList');

        mockListContent(TEST_CONFIG, mock);

        const el = await setupElement(TEST_CONFIG, ListContent);
        expect(el.pushCount()).toBe(1);
        expect(el.contentList).toEqual(mock);
    });

    it('makes single network call for multiple wire function invocations', async () => {
        const mock = getMock('contentList');

        // Mock network request once only
        mockListContent(TEST_CONFIG, mock);

        const el = await setupElement(TEST_CONFIG, ListContent);
        expect(el.pushCount()).toBe(1);
        expect(el.contentList).toEqual(mock);

        // second element should receive a value from LDS
        // even though it only mocked the network request once
        const el2 = await setupElement(TEST_CONFIG, ListContent);
        expect(el2.pushCount()).toBe(1);
        expect(el2.contentList).toEqual(mock);
    });

    it('makes two network calls for two wire function invocations with different config', async () => {
        const mock = getMock('contentList');

        const config2 = { communityId: '0DB0987654321' };

        mockListContent(TEST_CONFIG, mock);
        mockListContent(config2, mock);

        const el1 = await setupElement(TEST_CONFIG, ListContent);
        expect(el1.contentList).toEqual(mock);

        const el2 = await setupElement(config2, ListContent);
        expect(el2.contentList).toEqual(mock);

        // Each element receive 1 push
        expect(el1.pushCount()).toBe(1);
        expect(el2.pushCount()).toBe(1);
    });

    it('makes two network calls when time elapsed > TTL', async () => {
        const mock = getMock('contentList');

        mockListContent(TEST_CONFIG, [mock, mock]);

        const el1 = await setupElement(TEST_CONFIG, ListContent);

        expect(el1.pushCount()).toBe(1);
        expect(el1.contentList).toEqualSnapshotWithoutEtags(mock);

        expireContentList();

        const el2 = await setupElement(TEST_CONFIG, ListContent);

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

        mockListContentErrorOnce(TEST_CONFIG, mock);

        const el = await setupElement(TEST_CONFIG, ListContent);
        expect(el.pushCount()).toBe(1);
        expect(el.getError()).toEqual(mock);
    });

    it('causes a cache hit when a contentList is queried after server returned 404', async () => {
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

        mockListContent(TEST_CONFIG, [
            {
                reject: true,
                data: mockError,
            },
        ]);

        const elm = await setupElement(TEST_CONFIG, ListContent);
        expect(elm.getError()).toEqual(mockError);
        expect(elm.getError()).toBeImmutable();

        const secondElm = await setupElement(TEST_CONFIG, ListContent);
        expect(secondElm.getError()).toEqual(mockError);
        expect(secondElm.getError()).toBeImmutable();
    });

    it('causes a cache miss when a contentList is queried again after server returned 404, and cache is cleared', async () => {
        const contentListMock = getMock('contentList');

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

        mockListContent(TEST_CONFIG, [
            {
                reject: true,
                data: mockError,
            },
            contentListMock,
        ]);

        const elm = await setupElement(TEST_CONFIG, ListContent);
        expect(elm.getError()).toEqual(mockError);

        clearContentListCache();

        const secondElm = await setupElement(TEST_CONFIG, ListContent);
        expect(secondElm.getError()).toBeUndefined();
        expect(secondElm.contentList).toEqual(contentListMock);
    });

    it('fetches content successfully with heterogenous published content', async () => {
        const mock = getMock('mixedContentList');

        mockListContent(TEST_CONFIG, mock);

        const el = await setupElement(TEST_CONFIG, ListContent);
        expect(el.pushCount()).toBe(1);
        expect(el.contentList).toEqual(mock);
    });

    it('fetches content successfully with no published content', async () => {
        const mock = getMock('contentListEmpty');

        mockListContent(TEST_CONFIG, mock);

        const el = await setupElement(TEST_CONFIG, ListContent);
        expect(el.pushCount()).toBe(1);
        expect(el.contentList).toEqual(mock);
    });

    it('fetches content successfully with topics assigned to content items', async () => {
        const mock = getMock('contentListWithTopics');

        mockListContent(TEST_CONFIG, mock);

        const el = await setupElement(TEST_CONFIG, ListContent);
        expect(el.pushCount()).toBe(1);
        expect(el.contentList).toEqual(mock);
    });
});
