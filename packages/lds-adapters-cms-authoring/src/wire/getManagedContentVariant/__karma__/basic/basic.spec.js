import { getMock as globalGetMock, setupElement } from 'test-util';
import {
    mockGetManagedContentVariant,
    mockGetManagedContentVariantErrorOnce,
    expireManagedContentVariant,
} from 'cms-authoring-test-util';
import GetManagedContentVariant from '../lwc/get-managed-content-variant';

const MOCK_PREFIX = 'wire/getManagedContentVariant/__karma__/data/';
const TEST_CONFIG = {
    variantId: '9Psxx0000004CKKCA2',
};

function getMock(filename) {
    return globalGetMock(MOCK_PREFIX + filename);
}

describe('basic', () => {
    it('get managed content variant for given variant', async () => {
        const mock = getMock('variant');
        mockGetManagedContentVariant(TEST_CONFIG, mock);
        const el = await setupElement(TEST_CONFIG, GetManagedContentVariant);
        expect(el.pushCount()).toBe(1);
        expect(el.variant).toEqual(mock);
    });

    it('does not fetch a second time, i.e. cache hit, for another component with same config', async () => {
        const mock = getMock('variant');

        // Mock network request once only
        mockGetManagedContentVariant(TEST_CONFIG, mock);

        const el = await setupElement(TEST_CONFIG, GetManagedContentVariant);
        expect(el.pushCount()).toBe(1);
        expect(el.variant).toEqual(mock);

        // second element should receive a value from LDS
        // even though it only mocked the network request once
        const el2 = await setupElement(TEST_CONFIG, GetManagedContentVariant);
        expect(el2.pushCount()).toBe(1);
        expect(el2.variant).toEqual(mock);
    });

    it('fetches a second time, i.e. cache miss for another component with different config', async () => {
        const mock = getMock('variant');

        const config2 = {
            variantId: '9Psxx0000004CKKCA3',
        };

        mockGetManagedContentVariant(TEST_CONFIG, mock);
        mockGetManagedContentVariant(config2, mock);

        const el1 = await setupElement(TEST_CONFIG, GetManagedContentVariant);
        expect(el1.variant).toEqual(mock);

        const el2 = await setupElement(config2, GetManagedContentVariant);
        expect(el2.variant).toEqual(mock);

        // Each element receive 1 push
        expect(el1.pushCount()).toBe(1);
        expect(el2.pushCount()).toBe(1);
    });

    it('should hit network if variant is available but expired', async () => {
        const mock = getMock('variant');

        mockGetManagedContentVariant(TEST_CONFIG, [mock, mock]);

        const el1 = await setupElement(TEST_CONFIG, GetManagedContentVariant);

        expect(el1.pushCount()).toBe(1);
        expect(el1.variant).toEqualSnapshotWithoutEtags(mock);

        expireManagedContentVariant();

        const el2 = await setupElement(TEST_CONFIG, GetManagedContentVariant);

        expect(el2.pushCount()).toBe(1);
        expect(el2.variant).toEqualSnapshotWithoutEtags(mock);

        // el1 should not have received new value
        expect(el1.pushCount()).toBe(1);
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

        mockGetManagedContentVariantErrorOnce(TEST_CONFIG, mock);

        const el = await setupElement(TEST_CONFIG, GetManagedContentVariant);
        expect(el.pushCount()).toBe(1);
        expect(el.getError().body).toEqual(mock);
    });

    it('should cause a cache hit when a variant is queried after server returned 404', async () => {
        const mockError = [
            {
                errorCode: 'NOT_FOUND',
                message: 'The requested resource does not exist',
            },
        ];

        mockGetManagedContentVariant(TEST_CONFIG, [
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

        const elm = await setupElement(TEST_CONFIG, GetManagedContentVariant);
        expect(elm.getError()).toEqual(expectedError);
        expect(elm.getError()).toBeImmutable();

        const secondElm = await setupElement(TEST_CONFIG, GetManagedContentVariant);
        expect(secondElm.getError()).toEqual(expectedError);
        expect(secondElm.getError()).toBeImmutable();
    });

    it('should refetch variant when ingested variant error TTLs out', async () => {
        const variantMock = getMock('variant');

        const mockError = [
            {
                errorCode: 'NOT_FOUND',
                message: 'The requested resource does not exist',
            },
        ];

        mockGetManagedContentVariant(TEST_CONFIG, [
            {
                reject: true,
                status: 404,
                statusText: 'Not Found',
                ok: false,
                data: mockError,
            },
            variantMock,
        ]);

        const expectedError = {
            status: 404,
            statusText: 'Not Found',
            ok: false,
            body: mockError,
        };

        const elm = await setupElement(TEST_CONFIG, GetManagedContentVariant);
        expect(elm.getError()).toEqual(expectedError);

        expireManagedContentVariant();

        const secondElm = await setupElement(TEST_CONFIG, GetManagedContentVariant);
        expect(secondElm.getError()).toBeUndefined();
        expect(secondElm.variant).toEqual(variantMock);
    });
});
