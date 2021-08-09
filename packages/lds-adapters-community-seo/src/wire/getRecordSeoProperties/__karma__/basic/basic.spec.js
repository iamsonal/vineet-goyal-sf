import GetRecordSeoProperties from '../lwc/get-record-seo-properties';
import { getMock as globalGetMock, setupElement, clearCache } from 'test-util';
import {
    mockGetSeoPropertiesOnce,
    mockGetSeoPropertiesNetworkErrorOnce,
    expireSeoProperties,
    mockGetSeoPropertiesSequence,
} from 'community-seo-test-util';

const MOCK_PREFIX = 'wire/getRecordSeoProperties/__karma__/data/';
const TEST_CONFIG = {
    communityId: 'ABC123',
    recordId: 'something',
    fields: 'field1',
};

function getMock(filename) {
    return globalGetMock(MOCK_PREFIX + filename);
}

describe('basic', () => {
    it('gets basic seo properties', async () => {
        const mock = getMock('seoProperties');
        mockGetSeoPropertiesOnce(TEST_CONFIG, mock);

        const el = await setupElement(TEST_CONFIG, GetRecordSeoProperties);
        expect(el.pushCount()).toBe(1);
        expect(el.getWiredSeoProperties()).toEqual(mock);
    });

    it('does not fetch a second time', async () => {
        const mock = getMock('seoProperties');
        mockGetSeoPropertiesOnce(TEST_CONFIG, mock);

        const el = await setupElement(TEST_CONFIG, GetRecordSeoProperties);
        expect(el.pushCount()).toBe(1);
        expect(el.getWiredSeoProperties()).toEqual(mock);

        // second element should receive a value from LDS
        // even though it only mock the network traffic once
        const el2 = await setupElement(TEST_CONFIG, GetRecordSeoProperties);
        expect(el2.pushCount()).toBe(1);
        expect(el2.getWiredSeoProperties()).toEqual(mock);
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
        mockGetSeoPropertiesNetworkErrorOnce(TEST_CONFIG, mock);

        const el = await setupElement(TEST_CONFIG, GetRecordSeoProperties);
        expect(el.pushCount()).toBe(1);
        expect(el.getError()).toEqual(mock);
    });

    it('fetches a second time, i.e. cache miss for another component with different config', async () => {
        const mock = getMock('seoProperties');

        const config2 = {
            communityId: '0DB0987654321',
            recordId: 'something-else',
            fields: 'field2',
        };

        mockGetSeoPropertiesOnce(TEST_CONFIG, mock);
        mockGetSeoPropertiesOnce(config2, mock);

        const el1 = await setupElement(TEST_CONFIG, GetRecordSeoProperties);
        expect(el1.getWiredSeoProperties()).toEqual(mock);

        const el2 = await setupElement(config2, GetRecordSeoProperties);
        expect(el2.getWiredSeoProperties()).toEqual(mock);

        // Each element receive 1 push
        expect(el1.pushCount()).toBe(1);
        expect(el2.pushCount()).toBe(1);
    });

    it('should hit network if seo properties are available but expired', async () => {
        const mock = getMock('seoProperties');

        mockGetSeoPropertiesSequence(TEST_CONFIG, [mock, mock]);

        const el1 = await setupElement(TEST_CONFIG, GetRecordSeoProperties);
        expect(el1.pushCount()).toBe(1);
        expect(el1.getWiredSeoProperties()).toEqual(mock);

        expireSeoProperties();

        const el2 = await setupElement(TEST_CONFIG, GetRecordSeoProperties);
        expect(el2.pushCount()).toBe(1);
        expect(el2.getWiredSeoProperties()).toEqual(mock);

        // el2 should not have received new value
        expect(el2.pushCount()).toBe(1);
    });

    it('should cause a cache hit when seo properties are queried after server returned 404', async () => {
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

        mockGetSeoPropertiesOnce(TEST_CONFIG, {
            reject: true,
            data: mockError,
        });

        const el1 = await setupElement(TEST_CONFIG, GetRecordSeoProperties);
        expect(el1.getError()).toEqual(mockError);
        expect(el1.getError()).toBeImmutable();

        const el2 = await setupElement(TEST_CONFIG, GetRecordSeoProperties);
        expect(el2.getError()).toEqual(mockError);
        expect(el2.getError()).toBeImmutable();
    });

    it('should refetch seo properties when ingested properties error TTLs out', async () => {
        const mock = getMock('seoProperties');

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

        mockGetSeoPropertiesSequence(TEST_CONFIG, [
            {
                reject: true,
                data: mockError,
            },
            mock,
        ]);

        const el1 = await setupElement(TEST_CONFIG, GetRecordSeoProperties);
        expect(el1.getError()).toEqual(mockError);

        clearCache();

        const el2 = await setupElement(TEST_CONFIG, GetRecordSeoProperties);
        expect(el2.error).toBeUndefined();
        expect(el2.getWiredSeoProperties()).toEqual(mock);
    });
});
