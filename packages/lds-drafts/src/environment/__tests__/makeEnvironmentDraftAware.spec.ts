import { MockDurableStore } from '@luvio/adapter-test-library';
import { DefaultDurableSegment, DurableStoreOperationType } from '@luvio/environments';
import { HttpStatusCode } from '@luvio/engine';
import { DraftQueueEventType } from '../../DraftQueue';
import { DraftActionStatus } from '../../main';
import { LDS_ACTION_HANDLER_ID } from '../../actionHandlers/LDSActionHandler';
import { DRAFT_RECORD_ID, flushPromises, RECORD_ID } from '../../__tests__/test-utils';
import {
    MockDraftQueue,
    setupDraftEnvironment,
    STORE_KEY_DRAFT_RECORD,
    STORE_KEY_RECORD,
} from './test-utils';

describe('makeEnvironmentDraftAware', () => {
    it('does not start the draft queue', async () => {
        const { draftQueue } = await setupDraftEnvironment();
        expect(draftQueue.startQueue).toBeCalledTimes(0);
    });

    describe('dispatchResourceRequest', () => {
        it('does not intercept non record endpoints', async () => {
            const { draftEnvironment, network } = await setupDraftEnvironment();
            await draftEnvironment.dispatchResourceRequest({
                baseUri: '/services/data/v54.0',
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

    describe('draft action complete', () => {
        // TODO [W-9863485]: This unit test will fail when the work item gets fixed and then
        // this test can go away
        it('calls store dealloc', async () => {
            const { draftQueue, baseEnvironment } = await setupDraftEnvironment();
            const mockStoreDealloc = jest.fn();

            baseEnvironment.storeDealloc = mockStoreDealloc;
            const listeners = (draftQueue as MockDraftQueue).listeners;
            expect(listeners).toBeDefined();
            expect(listeners.size).toBeGreaterThan(0);
            for (const listener of listeners) {
                listener({
                    type: DraftQueueEventType.ActionCompleting,
                    action: {
                        status: DraftActionStatus.Completed,
                        id: '',
                        targetId: '',
                        tag: '',
                        timestamp: 1234,
                        metadata: {},
                        data: {},
                        handler: LDS_ACTION_HANDLER_ID,
                        response: {
                            status: HttpStatusCode.Ok,
                            body: {},
                            statusText: '',
                            ok: true,
                            headers: {},
                        },
                    },
                });
            }
            await flushPromises();
            expect(mockStoreDealloc).toBeCalled();
        });
    });

    describe('registerOnChangeListener', () => {
        it('redirect entries added to the durable store invokes the injected mapping function', async () => {
            const { durableStore, registerDraftIdMapping } = await setupDraftEnvironment();
            durableStore.getEntries = jest.fn().mockResolvedValue({
                [STORE_KEY_RECORD]: {
                    data: {
                        draftId: DRAFT_RECORD_ID,
                        canonicalId: RECORD_ID,
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
            expect(registerDraftIdMapping).toBeCalledTimes(1);
            expect(registerDraftIdMapping).toBeCalledWith(DRAFT_RECORD_ID, RECORD_ID);
        });

        it('draft record removed after mapping is configured', async () => {
            const { durableStore, registerDraftIdMapping } = await setupDraftEnvironment();
            durableStore.evictEntries = jest.fn();

            durableStore.getEntries = jest.fn().mockResolvedValue({
                [STORE_KEY_RECORD]: {
                    data: {
                        draftId: DRAFT_RECORD_ID,
                        canonicalId: RECORD_ID,
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
            expect(registerDraftIdMapping).toBeCalledTimes(1);
            expect(durableStore.evictEntries).toBeCalledTimes(1);
            expect(durableStore.evictEntries).toBeCalledWith(
                [STORE_KEY_DRAFT_RECORD],
                DefaultDurableSegment
            );
        });
    });
});
