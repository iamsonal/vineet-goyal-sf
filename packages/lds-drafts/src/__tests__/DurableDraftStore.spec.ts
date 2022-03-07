import { DurableDraftStore } from '../DurableDraftStore';
import { MockDurableStore } from '@luvio/adapter-test-library';
import { DRAFT_SEGMENT } from '../main';
import { flushPromises } from './test-utils';
import { ObjectKeys } from '../utils/language';
import { QueueOperationType } from '../DraftQueue';
import { DurableStoreOperationType } from '@luvio/environments';

describe('DraftStore', () => {
    describe('DurableDraftStore', () => {
        describe('writeAction', () => {
            it('writes a durable store entry for a draft action', async () => {
                const durableStore = new MockDurableStore();
                const draftStore = new DurableDraftStore(durableStore);

                await draftStore.writeAction({
                    tag: 'tag-foo',
                    id: 'id-foo',
                    status: 'pending',
                } as any);
                expect(
                    (await durableStore.persistence.get('DRAFT'))['tag-foo__DraftAction__id-foo']
                        .data
                ).toEqual({ tag: 'tag-foo', id: 'id-foo', status: 'pending' });
            });

            it('read actions immediates after write action waits for sync', async () => {
                const durableStore = new MockDurableStore();
                const draftStore = new DurableDraftStore(durableStore);
                let dq = await draftStore.getAllDrafts();
                expect(dq.length).toBe(0);

                // do not await
                draftStore.writeAction({
                    tag: 'tag-foo',
                    id: 'id-foo',
                    status: 'pending',
                } as any);

                dq = await draftStore.getAllDrafts();
                expect(dq.length).toBe(1);
            });

            it('concurrent writes wait for draft store to sync', async () => {
                const durableStore = new MockDurableStore();
                const draftStore = new DurableDraftStore(durableStore);
                let dq = await draftStore.getAllDrafts();
                expect(dq.length).toBe(0);

                // do not await
                draftStore.writeAction({
                    tag: 'tag-foo',
                    id: 'id-foo-1',
                    status: 'pending',
                } as any);

                // do not await
                draftStore.writeAction({
                    tag: 'tag-foo',
                    id: 'id-foo-2',
                    status: 'pending',
                } as any);

                dq = await draftStore.getAllDrafts();
                expect(dq.length).toBe(2);
            });
        });

        describe('getAllDrafts', () => {
            it('reads all draft action entries from the store and extracts the actions', async () => {
                const durableStore = new MockDurableStore();
                const draftStore = new DurableDraftStore(durableStore);
                await draftStore.writeAction({
                    tag: 'tag-foo',
                    id: 'id-foo-1',
                    status: 'pending',
                } as any);
                await draftStore.writeAction({
                    tag: 'tag-foo',
                    id: 'id-foo-2',
                    status: 'pending',
                } as any);

                const result = await draftStore.getAllDrafts();
                expect(result.length).toBe(2);
            });
            it('handles the empty case', async () => {
                const durableStore = {
                    getAllEntries: jest.fn().mockResolvedValue({}),
                } as any;
                const draftStore = new DurableDraftStore(durableStore);
                const result = await draftStore.getAllDrafts();
                expect(result.length).toBe(0);
            });
            it('handles the undefined case', async () => {
                const durableStore = {
                    getAllEntries: jest.fn().mockResolvedValue(undefined),
                } as any;
                const draftStore = new DurableDraftStore(durableStore);
                const result = await draftStore.getAllDrafts();
                expect(result.length).toBe(0);
            });
            it('concurrent reads only hit durable store once', async () => {
                const durableStore = new MockDurableStore();
                const draftStore = new DurableDraftStore(durableStore);
                await draftStore.writeAction({
                    tag: 'tag-foo',
                    id: 'id-foo-1',
                    status: 'pending',
                } as any);

                const durableSpy = jest.spyOn(durableStore, 'getAllEntries');
                const actionsPromise1 = draftStore.getAllDrafts();
                const actionsPromise2 = draftStore.getAllDrafts();
                const results = await Promise.all([actionsPromise1, actionsPromise2]);
                expect(results[0]).toEqual(results[1]);
                expect(durableSpy).toBeCalledTimes(0);
            });
        });

        describe('deleteDrafts', () => {
            it('evicts entries from durable store', async () => {
                const durableStore = new MockDurableStore();
                const spy = jest.spyOn(durableStore, 'evictEntries');
                const draftStore = new DurableDraftStore(durableStore);
                await draftStore.writeAction({
                    tag: 'tag-foo',
                    id: 'id-foo-1',
                    status: 'pending',
                } as any);
                await draftStore.writeAction({
                    tag: 'tag-foo',
                    id: 'id-foo-2',
                    status: 'pending',
                } as any);

                const result = await draftStore.getAllDrafts();
                expect(result.length).toBe(2);
                await draftStore.deleteDraft('id-foo-1');
                const result2 = await draftStore.getAllDrafts();
                expect(result2.length).toBe(1);
                expect(spy).toBeCalledWith(['tag-foo__DraftAction__id-foo-1'], DRAFT_SEGMENT);
            });

            it('read actions immediately after delete action waits for sync', async () => {
                const durableStore = new MockDurableStore();
                let draftStore = new DurableDraftStore(durableStore);

                await draftStore.writeAction({
                    tag: 'tag-foo',
                    id: 'id-foo',
                    status: 'pending',
                } as any);

                await draftStore.writeAction({
                    tag: 'tag-bar',
                    id: 'id-bar',
                    status: 'pending',
                } as any);

                let dq = await draftStore.getAllDrafts();
                expect(dq.length).toBe(2);

                // recreate draft store
                draftStore = new DurableDraftStore(durableStore);

                // do not await
                draftStore.deleteDraft('id-bar');

                dq = await draftStore.getAllDrafts();
                expect(dq.length).toBe(1);
            });
        });

        describe('completeAction', () => {
            it('queue operations get converted to durable store operations', async () => {
                const durableStore = new MockDurableStore();

                let draftStore = new DurableDraftStore(durableStore);

                const actionId = 'id-foo';

                const action = {
                    tag: 'tag-foo',
                    id: actionId,
                    status: 'pending',
                } as any;

                await draftStore.writeAction(action);

                // observe batch
                durableStore.batchOperations = jest.fn().mockResolvedValue({});

                await draftStore.completeAction(
                    [{ type: QueueOperationType.Delete, id: actionId }],
                    undefined
                );

                expect(durableStore.batchOperations).toBeCalledWith([
                    {
                        ids: ['tag-foo__DraftAction__id-foo'],
                        type: DurableStoreOperationType.EvictEntries,
                        segment: DRAFT_SEGMENT,
                    },
                ]);
            });

            it('mapping gets persisted to the durable store', async () => {
                const durableStore = new MockDurableStore();

                let draftStore = new DurableDraftStore(durableStore);

                const actionId = 'id-foo';
                const canonical = 'id-bar';

                const action = {
                    tag: 'tag-foo',
                    id: actionId,
                    status: 'pending',
                } as any;

                await draftStore.writeAction(action);

                // observe batch
                durableStore.batchOperations = jest.fn().mockResolvedValue({});

                await draftStore.completeAction([], {
                    draftId: actionId,
                    canonicalId: canonical,
                });

                expect(durableStore.batchOperations).toBeCalledWith([
                    {
                        type: 'setEntries',
                        segment: 'DRAFT_ID_MAPPINGS',
                        entries: {
                            'DraftIdMapping::id-foo::id-bar': {
                                data: {
                                    canonicalId: 'id-bar',
                                    draftId: 'id-foo',
                                },
                            },
                        },
                    },
                ]);
            });
        });

        describe('draft queue revive', () => {
            it('revives draft queue from durable store', async () => {
                const durableStore = new MockDurableStore();
                let draftStore = new DurableDraftStore(durableStore);

                await draftStore.writeAction({
                    tag: 'tag-foo',
                    id: 'id-foo',
                    status: 'pending',
                } as any);

                await draftStore.writeAction({
                    tag: 'tag-bar',
                    id: 'id-bar',
                    status: 'pending',
                } as any);

                let dq = await draftStore.getAllDrafts();
                expect(dq.length).toBe(2);

                // recreate draft store
                draftStore = new DurableDraftStore(durableStore);

                // peek private queue
                expect(ObjectKeys((draftStore as any).draftStore).length).toBe(0);

                await flushPromises();

                // peek private queue
                expect(ObjectKeys((draftStore as any).draftStore).length).toBe(2);
            });
        });
    });
});
