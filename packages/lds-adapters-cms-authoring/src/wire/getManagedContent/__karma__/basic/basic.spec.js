import {
    getMock as globalGetMock,
    setupElement,
    assertNetworkCallCount,
    resetNetworkStub,
} from 'test-util';
import {
    mockGetManagedContent,
    mockGetManagedContentErrorOnce,
    expireManagedContent,
} from 'cms-authoring-test-util';
import GetManagedContent from '../lwc/get-managed-content';
import GetManagedContentWithContentkey from '../lwc/get-managed-content-with-contentkey';

const MOCK_PREFIX = 'wire/getManagedContent/__karma__/data/';

const TEST_CONFIG = {
    contentKeyOrId: 'MCMOEXXY57SNBAJID2SYYWJO45LM',
    version: '5OUxx0000004DMqGAM',
    language: 'en_US',
};
const TEST_CONFIG2 = {
    contentKeyOrId: 'MCMOEXXY57SNBAJID2SYYWJO45LM',
};
const MOCK_ERROR = {
    ok: false,
    status: 404,
    statusText: 'Not Found',
    body: [
        {
            errorCode: 'NOT_FOUND',
            message: 'The requested resource does not exist',
        },
    ],
};
const ERROR_DATA = {
    reject: true,
    data: MOCK_ERROR,
};

function getMock(filename) {
    return globalGetMock(MOCK_PREFIX + filename);
}

describe('basic', () => {
    it('get managed content for contentKeyOrId', async () => {
        const mock = getMock('content');
        mockGetManagedContent(TEST_CONFIG, mock);

        const el = await setupElement(TEST_CONFIG, GetManagedContent);
        expect(el.pushCount()).toBe(1);
        expect(el.content).toEqual(mock);
    });

    it(
        'request for primary managed content document with the content key and language params hits the cache ' +
            'if it was loaded before only using contnet key',
        async () => {
            const enUSContent = getMock('content');
            mockGetManagedContent({ contentKeyOrId: 'MCMOEXXY57SNBAJID2SYYWJO45LM' }, enUSContent);

            // Get managed content document using only content key.
            // It should return primary variant and cache it using "content key + language" as a cache key even though
            // managed content document was requested with content key only.
            const el1 = await setupElement(
                { contentKeyOrId: 'MCMOEXXY57SNBAJID2SYYWJO45LM' },
                GetManagedContent
            );
            expect(el1.pushCount()).toBe(1);
            expect(el1.content).toEqual(enUSContent);

            // Get the same managed content, but this time provide primary language in addition to the content key.
            // No server request should be made and managed content document should be retrieved from cache since it was cached
            // with "content key + language" as a cache key after previous request.
            const el2 = await setupElement(
                { contentKeyOrId: 'MCMOEXXY57SNBAJID2SYYWJO45LM', language: 'en_US' },
                GetManagedContent
            );
            expect(el2.pushCount()).toBe(1);
            expect(el2.content).toEqual(enUSContent);
        }
    );

    it(
        'request for primary managed content document with the content key sends server request even ' +
            'if it was loaded before using contnet key and language params',
        async () => {
            const enUSContent = getMock('content');
            mockGetManagedContent(
                { contentKeyOrId: 'MCMOEXXY57SNBAJID2SYYWJO45LM', language: 'en_US' },
                enUSContent
            );

            // Get primary managed content document using content key and language.
            // It should return primary managed content document and cache it using "content key + language".
            const el1 = await setupElement(
                { contentKeyOrId: 'MCMOEXXY57SNBAJID2SYYWJO45LM', language: 'en_US' },
                GetManagedContent
            );
            expect(el1.pushCount()).toBe(1);
            expect(el1.content).toEqual(enUSContent);

            assertNetworkCallCount();

            resetNetworkStub();

            mockGetManagedContent({ contentKeyOrId: 'MCMOEXXY57SNBAJID2SYYWJO45LM' }, enUSContent);

            // Get the same managed content, but this time provide only content key.
            // Server request should be made, since previos request was cached with "content key + language", and this request provides only content key.
            const el2 = await setupElement(
                { contentKeyOrId: 'MCMOEXXY57SNBAJID2SYYWJO45LM' },
                GetManagedContentWithContentkey
            );
            expect(el2.pushCount()).toBe(1);
            expect(el2.content).toEqual(enUSContent);

            assertNetworkCallCount();
        }
    );

    it('seconds request for translated managed content document is cache hit', async () => {
        const esESContent = getMock('content-es_ES');
        mockGetManagedContent(
            { contentKeyOrId: 'MCMOEXXY57SNBAJID2SYYWJO45LM', language: 'es_ES' },
            esESContent
        );

        const el1 = await setupElement(
            { contentKeyOrId: 'MCMOEXXY57SNBAJID2SYYWJO45LM', language: 'es_ES' },
            GetManagedContent
        );
        expect(el1.pushCount()).toBe(1);
        expect(el1.content).toEqual(esESContent);

        const el2 = await setupElement(
            { contentKeyOrId: 'MCMOEXXY57SNBAJID2SYYWJO45LM', language: 'es_ES' },
            GetManagedContent
        );
        expect(el2.pushCount()).toBe(1);
        expect(el2.content).toEqual(esESContent);
    });

    it('every translated managed content document request is a server request, and then a cache hit', async () => {
        const esESContent = getMock('content-es_ES');
        const enUSContent = getMock('content');
        mockGetManagedContent(
            { contentKeyOrId: 'MCMOEXXY57SNBAJID2SYYWJO45LM', language: 'es_ES' },
            esESContent
        );
        mockGetManagedContent(
            { contentKeyOrId: 'MCMOEXXY57SNBAJID2SYYWJO45LM', language: 'en_US' },
            enUSContent
        );

        const el1 = await setupElement(
            { contentKeyOrId: 'MCMOEXXY57SNBAJID2SYYWJO45LM', language: 'en_US' },
            GetManagedContent
        );
        expect(el1.pushCount()).toBe(1);
        expect(el1.content).toEqual(enUSContent);

        const el2 = await setupElement(
            { contentKeyOrId: 'MCMOEXXY57SNBAJID2SYYWJO45LM', language: 'en_US' },
            GetManagedContent
        );
        expect(el2.pushCount()).toBe(1);
        expect(el2.content).toEqual(enUSContent);

        const el3 = await setupElement(
            { contentKeyOrId: 'MCMOEXXY57SNBAJID2SYYWJO45LM', language: 'es_ES' },
            GetManagedContent
        );
        expect(el3.pushCount()).toBe(1);
        expect(el3.content).toEqual(esESContent);

        const el4 = await setupElement(
            { contentKeyOrId: 'MCMOEXXY57SNBAJID2SYYWJO45LM', language: 'es_ES' },
            GetManagedContent
        );
        expect(el4.pushCount()).toBe(1);
        expect(el4.content).toEqual(esESContent);
    });

    it('get managed content for contentKeyOrId without language and version params', async () => {
        const mock = getMock('content');
        mockGetManagedContent(TEST_CONFIG2, mock);

        const el = await setupElement(TEST_CONFIG2, GetManagedContentWithContentkey);
        expect(el.pushCount()).toBe(1);
        expect(el.content).toEqual(mock);
    });

    it('does not fetch a second time, i.e. cache hit, for another component with same config', async () => {
        const mock = getMock('content');

        // Mock network request once only
        mockGetManagedContent(TEST_CONFIG, mock);

        const el = await setupElement(TEST_CONFIG, GetManagedContent);
        expect(el.pushCount()).toBe(1);
        expect(el.content).toEqual(mock);

        // second element should receive a value from LDS
        // even though it only mocked the network request once
        const el2 = await setupElement(TEST_CONFIG, GetManagedContent);
        expect(el2.pushCount()).toBe(1);
        expect(el2.content).toEqual(mock);
    });

    it('fetches a second time, i.e. cache miss for another component with different config', async () => {
        const mock = getMock('content');
        const mock2 = getMock('content2');

        const config2 = {
            contentKeyOrId: 'MCIR7L42KO6BEALHEB5AFFSU3GUY',
            version: '5OUxx0000004H0eGAE',
            language: 'en_US',
        };

        mockGetManagedContent(TEST_CONFIG, mock);
        mockGetManagedContent(config2, mock2);

        const el1 = await setupElement(TEST_CONFIG, GetManagedContent);
        expect(el1.content).toEqual(mock);

        const el2 = await setupElement(config2, GetManagedContent);
        expect(el2.content).toEqual(mock2);

        // Each element receive 1 push
        expect(el1.pushCount()).toBe(1);
        expect(el2.pushCount()).toBe(1);
    });

    it('should hit network if contentKeyOrId is available but expired', async () => {
        const mock = getMock('content');

        mockGetManagedContent(TEST_CONFIG, [mock, mock]);

        const el1 = await setupElement(TEST_CONFIG, GetManagedContent);
        expect(el1.pushCount()).toBe(1);
        expect(el1.content).toEqualSnapshotWithoutEtags(mock);

        expireManagedContent();

        const el2 = await setupElement(TEST_CONFIG, GetManagedContent);
        expect(el2.pushCount()).toBe(1);
        expect(el2.content).toEqualSnapshotWithoutEtags(mock);

        // el1 should not have received new value
        expect(el1.pushCount()).toBe(1);
    });

    it('should display error when network request returns 404s', async () => {
        mockGetManagedContentErrorOnce(TEST_CONFIG, MOCK_ERROR);

        const el = await setupElement(TEST_CONFIG, GetManagedContent);
        expect(el.pushCount()).toBe(1);
        expect(el.getError()).toEqual(MOCK_ERROR);
    });

    it('should cause a cache hit when content is queried after server returned 404', async () => {
        mockGetManagedContent(TEST_CONFIG, [ERROR_DATA]);

        const el1 = await setupElement(TEST_CONFIG, GetManagedContent);
        expect(el1.getError()).toEqual(MOCK_ERROR);
        expect(el1.getError()).toBeImmutable();

        const el2 = await setupElement(TEST_CONFIG, GetManagedContent);
        expect(el2.getError()).toEqual(MOCK_ERROR);
        expect(el2.getError()).toBeImmutable();
    });

    it('should refetch content when ingested contentKeyOrId error TTLs out', async () => {
        const mock = getMock('content');

        mockGetManagedContent(TEST_CONFIG, [ERROR_DATA, mock]);

        const el1 = await setupElement(TEST_CONFIG, GetManagedContent);
        expect(el1.getError()).toEqual(MOCK_ERROR);

        expireManagedContent();

        const el2 = await setupElement(TEST_CONFIG, GetManagedContent);
        expect(el2.getError()).toBeUndefined();
        expect(el2.content).toEqual(mock);
    });
});
