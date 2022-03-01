import {
    URL_BASE,
    mockDeleteManagedContentVariant,
    mockDeleteManagedContentVariantErrorOnce,
    mockGetManagedContentVariant,
} from '../../../../../karma/cms-authoring-test-util';
import GetManagedContentVariant from '../../../getManagedContentVariant/__karma__/lwc/get-managed-content-variant';
import { deleteManagedContentVariant } from 'lds-adapters-cms-authoring';
import { getMock as globalGetMock, setupElement, flushPromises } from 'test-util';
import { karmaNetworkAdapter } from 'lds-engine';

const MOCK_PREFIX = 'wire/deleteManagedContentVariant/__karma__/data/';
const MOCK_INPUT = {
    variantId: '9Psxx0000004CKKCA2',
};

function getMock(filename) {
    return globalGetMock(MOCK_PREFIX + filename);
}

describe('deleteManagedContentVariant - basic', () => {
    it('sends request for delete variant over network with the given variantId', async () => {
        const config = {
            variantId: MOCK_INPUT.variantId,
        };
        mockDeleteManagedContentVariant(config);
        await deleteManagedContentVariant(config);
        const expected = {
            basePath: `${URL_BASE}/cms/contents/variants/${config.variantId}`,
            method: 'delete',
            urlParams: { variantId: MOCK_INPUT.variantId },
        };
        expect(karmaNetworkAdapter.firstCall.args[0]).toEqual(jasmine.objectContaining(expected));
    });

    it('evicts managedContentVariant from cache on deleting variant', async () => {
        // 1. Mock getManagedContentVariant calls: First GET call should retrieve successfully. Second GET call should return not found from server.
        const mockGetVariant = getMock('getManagedContentVariantResponse');
        const mockGetVariantError = {
            ok: false,
            status: 404,
            statusText: 'NOT_FOUND',
            body: getMock('deleteManagedContentVariantNotExistResponse'),
        };
        const config = {
            variantId: MOCK_INPUT.variantId,
        };
        mockGetManagedContentVariant(config, [
            mockGetVariant,
            {
                reject: true,
                data: mockGetVariantError,
            },
        ]);
        mockDeleteManagedContentVariant(config);

        // 2. First successful GET on ManagedContentVariant call will populate the cache
        const el = await setupElement(config, GetManagedContentVariant);

        // 3. Delete the managedContentVariant
        await deleteManagedContentVariant(config);

        // 4. Wait for existing LWC components to get rendered
        await flushPromises();

        // 5. Assert that getManagedContentVariant should now return error
        expect(el.pushCount()).toBe(2);
        expect(el.getError()).toEqual(mockGetVariantError);
        expect(el.getError()).toBeImmutable();
    });
});

describe('deleteManagedContentVariant - errors', () => {
    it('rejects when server returns an error on delete', async () => {
        const mockError = getMock('deleteManagedContentVariantErrorResponse');
        const config = {
            variantId: MOCK_INPUT.variantId,
        };

        mockDeleteManagedContentVariantErrorOnce(config, mockError);

        try {
            await deleteManagedContentVariant(config);
            fail('deleteManagedContentVariant did not throw an error when expected to');
        } catch (e) {
            expect(e).toEqual(mockError);
        }
    });

    it('does not evict cache when server returns an error on delete', async () => {
        // 1. Mock getManagedContentVariant with no error
        const mockGetVariant = getMock('getManagedContentVariantResponse');
        const config = {
            variantId: MOCK_INPUT.variantId,
        };
        mockGetManagedContentVariant(config, mockGetVariant);

        // 2. Mock deleteManagedContentVariant with error
        const mockError = getMock('deleteManagedContentVariantErrorResponse');
        mockDeleteManagedContentVariantErrorOnce(config, {
            reject: true,
            data: {
                body: mockError,
            },
        });

        // 3. Create GetManagedContentVariant component such that GET call will populate the cache
        await setupElement(config, GetManagedContentVariant);

        try {
            // 4. Invoke deleteManagedContentVariant for failure
            await deleteManagedContentVariant(config);
            fail('deleteManagedContentVariant did not throw an error when expected to');
        } catch (e) {
            // Delete should fail
        }

        // 5. Assert that getManagedContentVariant still emits data from cache
        const element = await setupElement(config, GetManagedContentVariant);
        expect(element.variant).toEqualSnapshotWithoutEtags(mockGetVariant);
    });
});
