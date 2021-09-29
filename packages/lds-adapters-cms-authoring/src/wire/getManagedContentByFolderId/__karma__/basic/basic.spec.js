import { getMock as globalGetMock, setupElement } from 'test-util';
import {
    mockGetManagedContentByFolderId,
    mockGetManagedContentByFolderIdErrorOnce,
    expireGetManagedContentByFolderId,
} from 'cms-authoring-test-util';
import GetManagedContentByFolderId from '../lwc/get-managed-content-by-folder-id';

const MOCK_PREFIX = 'wire/getManagedContentByFolderId/__karma__/data/';

function getMock(filename) {
    return globalGetMock(MOCK_PREFIX + filename);
}

describe('basic', () => {
    it('get managed content belonging to a given folderId', async () => {
        const mock = getMock('content');
        const config = { folderId: mock.folderId };
        mockGetManagedContentByFolderId(config, mock);
        const el = await setupElement(config, GetManagedContentByFolderId);
        expect(el.pushCount()).toBe(1);
        expect(el.getData()).toEqual(mock);
    });

    it('does not fetch a second time, i.e. cache hit, for another component with same config', async () => {
        const mock = getMock('content');
        const config = { folderId: mock.folderId };

        // Mock network request once only
        mockGetManagedContentByFolderId(config, mock);

        const el = await setupElement(config, GetManagedContentByFolderId);
        expect(el.pushCount()).toBe(1);
        expect(el.getData()).toEqual(mock);

        // second element should receive a value from LDS
        // even though it only mocked the network request once
        const el2 = await setupElement(config, GetManagedContentByFolderId);
        expect(el2.pushCount()).toBe(1);
        expect(el2.getData()).toEqual(mock);
    });

    it('fetches a second time, i.e. cache miss for another component with different config', async () => {
        const mock = getMock('content');
        const config = { folderId: mock.folderId };

        const mock2 = getMock('content2');
        const config2 = { folderId: mock2.folderId };

        mockGetManagedContentByFolderId(config, mock);
        mockGetManagedContentByFolderId(config2, mock2);

        const el1 = await setupElement(config, GetManagedContentByFolderId);
        expect(el1.getData()).toEqual(mock);

        const el2 = await setupElement(config2, GetManagedContentByFolderId);
        expect(el2.getData()).toEqual(mock2);

        // Each element receive 1 push
        expect(el1.pushCount()).toBe(1);
        expect(el2.pushCount()).toBe(1);
    });

    it('should hit network if content is available but expired', async () => {
        const mock = getMock('content');
        const config = { folderId: mock.folderId };

        mockGetManagedContentByFolderId(config, [mock, mock]);

        const el1 = await setupElement(config, GetManagedContentByFolderId);

        expect(el1.pushCount()).toBe(1);
        expect(el1.getData()).toEqualSnapshotWithoutEtags(mock);

        expireGetManagedContentByFolderId();

        const el2 = await setupElement(config, GetManagedContentByFolderId);

        expect(el2.pushCount()).toBe(1);
        expect(el2.getData()).toEqualSnapshotWithoutEtags(mock);

        // el1 should not have received new value
        expect(el1.pushCount()).toBe(1);
    });

    it('displays error when network request returns 404s', async () => {
        const mock = getMock('content');
        const config = { folderId: mock.folderId };
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

        mockGetManagedContentByFolderIdErrorOnce(config, mockError);

        const el = await setupElement(config, GetManagedContentByFolderId);
        expect(el.pushCount()).toBe(1);
        expect(el.getError()).toEqual(mockError);
    });

    it('should cause a cache hit when content is queried for, after server returned 404', async () => {
        const mock = getMock('content');
        const config = { folderId: mock.folderId };
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

        mockGetManagedContentByFolderId(config, {
            reject: true,
            data: mockError,
        });

        const el = await setupElement(config, GetManagedContentByFolderId);

        expect(el.getError()).toEqual(mockError);
        expect(el.getError()).toBeImmutable();

        const el2 = await setupElement(config, GetManagedContentByFolderId);
        expect(el2.getError()).toEqual(mockError);
        expect(el2.getError()).toBeImmutable();
    });

    it('should refetch content when ingested content error TTLs out', async () => {
        const mock = getMock('content');
        const config = { folderId: mock.folderId };

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

        mockGetManagedContentByFolderId(config, [
            {
                reject: true,
                data: mockError,
            },
            mock,
        ]);

        const el1 = await setupElement(config, GetManagedContentByFolderId);
        expect(el1.getError()).toEqual(mockError);

        expireGetManagedContentByFolderId();

        const el2 = await setupElement(config, GetManagedContentByFolderId);
        expect(el2.getError()).toBeUndefined();
        expect(el2.getData()).toEqual(mock);
    });
});
