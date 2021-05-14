import { MockDurableStore } from '@luvio/adapter-test-library';
import { DurableStoreOperationType } from '@luvio/environments';
import { flushPromises } from '../../__tests__/test-utils';
import { setupDraftEnvironment, STORE_KEY_DRAFT_RECORD, STORE_KEY_RECORD } from './test-utils';

describe('makeEnvironmentDraftAware', () => {
    it('does not start the draft queue', async () => {
        const { draftQueue } = setupDraftEnvironment();
        expect(draftQueue.startQueue).toBeCalledTimes(0);
    });

    describe('dispatchResourceRequest', () => {
        it('does not intercept non record endpoints', async () => {
            const { draftEnvironment, network } = setupDraftEnvironment();
            await draftEnvironment.dispatchResourceRequest({
                baseUri: '/services/data/v53.0',
                basePath: `/ui-api/not-record-endpoint`,
                method: 'patch',
                body: {},
                urlParams: {},
                queryParams: {},
                headers: {},
            });
            expect(network).toBeCalledTimes(1);
        });
    });

    describe('registerOnChangeListener', () => {
        it('redirect entries added to the durable store invokes the injected mapping function', async () => {
            const { durableStore, registerDraftKeyMapping } = setupDraftEnvironment();
            durableStore.getEntries = jest.fn().mockResolvedValue({
                [STORE_KEY_RECORD]: {
                    data: {
                        draftKey: STORE_KEY_DRAFT_RECORD,
                        canonicalKey: STORE_KEY_RECORD,
                    },
                },
            });
            const listeners = (durableStore as unknown as MockDurableStore).listeners;
            for (const listener of listeners) {
                listener([
                    {
                        ids: [STORE_KEY_RECORD],
                        segment: 'DRAFT_ID_MAPPINGS',
                        type: DurableStoreOperationType.SetEntries,
                    },
                ]);
            }
            await flushPromises();
            expect(registerDraftKeyMapping).toBeCalledTimes(1);
            expect(registerDraftKeyMapping.mock.calls[0]).toEqual([
                STORE_KEY_DRAFT_RECORD,
                STORE_KEY_RECORD,
            ]);
        });
    });
});
