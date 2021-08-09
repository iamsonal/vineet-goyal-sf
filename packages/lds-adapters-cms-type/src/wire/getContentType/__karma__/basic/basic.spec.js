import { getMock as globalGetMock, setupElement } from 'test-util';
import {
    mockgetContentType,
    mockgetContentTypeErrorOnce,
    expireContentType,
} from 'cms-type-test-util';
import ContentType from '../lwc/content-type';

const MOCK_PREFIX = 'wire/getContentType/__karma__/data/';
const TEST_CONFIG = {
    contentTypeFQN: 'news',
};

function getMock(filename) {
    return globalGetMock(MOCK_PREFIX + filename);
}

describe('basic', () => {
    it('get contenttype for given contenttype fqn', async () => {
        const mock = getMock('contentType');
        mockgetContentType(TEST_CONFIG, mock);
        const el = await setupElement(TEST_CONFIG, ContentType);
        expect(el.pushCount()).toBe(1);
        expect(el.contentType).toEqual(mock);
    });

    it('does not fetch a second time, i.e. cache hit, for another component with same config', async () => {
        const mock = getMock('contentType');

        // Mock network request once only
        mockgetContentType(TEST_CONFIG, mock);

        const el = await setupElement(TEST_CONFIG, ContentType);
        expect(el.pushCount()).toBe(1);
        expect(el.contentType).toEqual(mock);

        // second element should receive a value from LDS
        // even though it only mocked the network request once
        const el2 = await setupElement(TEST_CONFIG, ContentType);
        expect(el2.pushCount()).toBe(1);
        expect(el2.contentType).toEqual(mock);
    });

    it('fetches a second time, i.e. cache miss for another component with different config', async () => {
        const mock = getMock('contentType');

        const config2 = {
            contentTypeFQN: 'blog',
        };

        mockgetContentType(TEST_CONFIG, mock);
        mockgetContentType(config2, mock);

        const el1 = await setupElement(TEST_CONFIG, ContentType);
        expect(el1.contentType).toEqual(mock);

        const el2 = await setupElement(config2, ContentType);
        expect(el2.contentType).toEqual(mock);

        // Each element receive 1 push
        expect(el1.pushCount()).toBe(1);
        expect(el2.pushCount()).toBe(1);
    });

    it('should hit network if contentType is available but expired', async () => {
        const mock = getMock('contentType');

        mockgetContentType(TEST_CONFIG, [mock, mock]);

        const el1 = await setupElement(TEST_CONFIG, ContentType);

        expect(el1.pushCount()).toBe(1);
        expect(el1.contentType).toEqualSnapshotWithoutEtags(mock);

        expireContentType();

        const el2 = await setupElement(TEST_CONFIG, ContentType);

        expect(el2.pushCount()).toBe(1);
        expect(el2.contentType).toEqualSnapshotWithoutEtags(mock);

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

        mockgetContentTypeErrorOnce(TEST_CONFIG, mock);

        const el = await setupElement(TEST_CONFIG, ContentType);
        expect(el.pushCount()).toBe(1);
        expect(el.getError()).toEqual(mock);
    });

    it('should cause a cache hit when a contentType is queried after server returned 404', async () => {
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

        mockgetContentType(TEST_CONFIG, [
            {
                reject: true,
                data: mockError,
            },
        ]);

        const elm = await setupElement(TEST_CONFIG, ContentType);
        expect(elm.getError()).toEqual(mockError);
        expect(elm.getError()).toBeImmutable();

        const secondElm = await setupElement(TEST_CONFIG, ContentType);
        expect(secondElm.getError()).toEqual(mockError);
        expect(secondElm.getError()).toBeImmutable();
    });

    it('should refetch contenttype when ingested contentType error TTLs out', async () => {
        const contentTypeMock = getMock('contentType');

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

        mockgetContentType(TEST_CONFIG, [
            {
                reject: true,
                data: mockError,
            },
            contentTypeMock,
        ]);

        const elm = await setupElement(TEST_CONFIG, ContentType);
        expect(elm.getError()).toEqual(mockError);

        expireContentType();

        const secondElm = await setupElement(TEST_CONFIG, ContentType);
        expect(secondElm.getError()).toBeUndefined();
        expect(secondElm.contentType).toEqual(contentTypeMock);
    });
});
