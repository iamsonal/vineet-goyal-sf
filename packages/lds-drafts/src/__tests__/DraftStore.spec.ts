import { DurableStoreDraftStore } from '../DraftStore';
import { MockDurableStore } from '@luvio/adapter-test-library';

describe('DraftStore', () => {
    describe('DurableDraftStore', () => {
        describe('writeAction', () => {
            it('writes a durable store entry for a draft action', async () => {
                const durableStore = new MockDurableStore();
                const draftQueue = new DurableStoreDraftStore(durableStore);

                await draftQueue.writeAction({
                    tag: 'tag-foo',
                    id: 'id-foo',
                    status: 'pending',
                } as any);
                expect(durableStore.segments['DRAFT']['tag-foo__DraftAction__id-foo'].data).toEqual(
                    { tag: 'tag-foo', id: 'id-foo', status: 'pending' }
                );
            });
        });

        describe('getAllDrafts', () => {
            it('reads all draft action entries from the store and extracts the actions', async () => {
                const durableStore = new MockDurableStore();
                const draftQueue = new DurableStoreDraftStore(durableStore);
                await draftQueue.writeAction({
                    tag: 'tag-foo',
                    id: 'id-foo-1',
                    status: 'pending',
                } as any);
                await draftQueue.writeAction({
                    tag: 'tag-foo',
                    id: 'id-foo-2',
                    status: 'pending',
                } as any);

                const result = await draftQueue.getAllDrafts();
                expect(result.length).toBe(2);
            });
            it('handles the empty case', async () => {
                const durableStore = {
                    getAllEntries: jest.fn().mockResolvedValue({}),
                } as any;
                const draftQueue = new DurableStoreDraftStore(durableStore);
                const result = await draftQueue.getAllDrafts();
                expect(result.length).toBe(0);
            });
            it('handles the undefined case', async () => {
                const durableStore = {
                    getAllEntries: jest.fn().mockResolvedValue(undefined),
                } as any;
                const draftQueue = new DurableStoreDraftStore(durableStore);
                const result = await draftQueue.getAllDrafts();
                expect(result.length).toBe(0);
            });
        });

        describe('deleteDrafts', () => {
            it('evicts entries from durable store', async () => {
                const durableStore = new MockDurableStore();
                const draftQueue = new DurableStoreDraftStore(durableStore);
                await draftQueue.writeAction({
                    tag: 'tag-foo',
                    id: 'id-foo-1',
                    status: 'pending',
                } as any);
                await draftQueue.writeAction({
                    tag: 'tag-foo',
                    id: 'id-foo-2',
                    status: 'pending',
                } as any);

                const result = await draftQueue.getAllDrafts();
                expect(result.length).toBe(2);
                await draftQueue.deleteDrafts(['tag-foo__DraftAction__id-foo-1']);
                const result2 = await draftQueue.getAllDrafts();
                expect(result2.length).toBe(1);
            });

            it('it short circuits empty array', async () => {
                const durableStore = new MockDurableStore();
                durableStore.evictEntries = jest.fn();
                const draftQueue = new DurableStoreDraftStore(durableStore);

                await draftQueue.deleteDrafts([]);
                expect(durableStore.evictEntries).toBeCalledTimes(0);
            });
        });
    });
});
