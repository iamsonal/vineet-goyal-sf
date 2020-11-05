import { DraftAction, DraftActionStatus, ProcessActionResult } from '../DraftQueue';
import { DurableDraftQueue, DraftDurableSegment } from '../DurableDraftQueue';
import {
    MockDurableStore,
    buildMockNetworkAdapter,
    getMockNetworkAdapterCallCount,
    MockPayload,
    buildSuccessMockPayload,
    buildErrorMockPayload,
    setNetworkConnectivity,
    ConnectivityState,
} from '@ldsjs/adapter-test-library';
import { ObjectKeys } from '../utils/language';
import { DurableStoreEntry, DurableStoreEntries } from '@ldsjs/environments';
import { createPatchRequest, createPostRequest } from './test-utils';
import { ResourceRequest } from '@ldsjs/engine';

const DEFAULT_REQUEST: ResourceRequest = {
    method: 'post',
    basePath: '/blah',
    baseUri: 'blahuri',
    body: null,
    queryParams: {},
    urlParams: {},
    headers: {},
};
const DEFAULT_TAG = 'test-tag1';

describe('DurableDraftQueue', () => {
    describe('enqueue', () => {
        it('cannot create post action on record that already exists', async () => {
            const network = buildMockNetworkAdapter([]);
            const durableStore = new MockDurableStore();
            const draftQueue = new DurableDraftQueue(durableStore, network);
            const draftId = 'fooId';

            await draftQueue.enqueue(DEFAULT_REQUEST, draftId);

            await expect(draftQueue.enqueue(DEFAULT_REQUEST, draftId)).rejects.toEqual(
                Error('Cannot enqueue a POST draft action with an existing tag')
            );
        });
        it('cannot publish draft action after a delete action is added', async () => {
            const network = buildMockNetworkAdapter([]);
            const durableStore = new MockDurableStore();
            const draftQueue = new DurableDraftQueue(durableStore, network);
            const draftId = 'fooId';

            await draftQueue.enqueue(
                {
                    method: 'post',
                    basePath: 'blah',
                    baseUri: 'blahuri',
                    body: null,
                    queryParams: {},
                    urlParams: {},
                    headers: {},
                },
                draftId
            );

            await draftQueue.enqueue(
                {
                    method: 'delete',
                    basePath: 'blah',
                    baseUri: 'blahuri',
                    body: null,
                    queryParams: {},
                    urlParams: {},
                    headers: {},
                },
                draftId
            );

            await expect(
                draftQueue.enqueue(
                    {
                        method: 'patch',
                        basePath: 'blah',
                        baseUri: 'blahuri',
                        body: null,
                        queryParams: {},
                        urlParams: {},
                        headers: {},
                    },
                    draftId
                )
            ).rejects.toEqual(Error('Cannot enqueue a draft action for a deleted record'));
        });

        it('calls the durable store when enqueuing', async () => {
            const network = buildMockNetworkAdapter([]);
            const durableStore = new MockDurableStore();
            const draftQueue = new DurableDraftQueue(durableStore, network);

            await draftQueue.enqueue(createPatchRequest(), DEFAULT_TAG);
            const allEntries = await durableStore.getAllEntries(DraftDurableSegment);
            expect(ObjectKeys(allEntries).length).toEqual(1);
        });

        it('creates two draft actions when editing the same record', async () => {
            const network = buildMockNetworkAdapter([]);
            const durableStore = new MockDurableStore();
            const draftStore = new DurableDraftQueue(durableStore, network);

            await draftStore.enqueue(createPatchRequest(), DEFAULT_TAG);
            const secondPatch = createPatchRequest();
            secondPatch.body.fields.Name = 'Acme 2';
            await draftStore.enqueue(secondPatch, DEFAULT_TAG);
            const allEntries = await durableStore.getAllEntries(DraftDurableSegment);
            expect(ObjectKeys(allEntries).length).toEqual(2);

            const allActions = await draftStore.getActionsForTags({ [DEFAULT_TAG]: true });
            expect(allActions[DEFAULT_TAG].length).toEqual(2);
            const firstAction = allActions[DEFAULT_TAG][0];
            const secondAction = allActions[DEFAULT_TAG][1];
            expect(firstAction.status).toEqual(DraftActionStatus.Pending);
            expect(secondAction.status).toEqual(DraftActionStatus.Pending);
            expect(parseInt(firstAction.id)).toBeLessThan(parseInt(secondAction.id));
        });
    });

    describe('getActionsForTags', () => {
        it('can enqueue multiple draft actions', async () => {
            const network = buildMockNetworkAdapter([]);
            const durableStore = new MockDurableStore();
            const draftQueue = new DurableDraftQueue(durableStore, network);
            setNetworkConnectivity(network, ConnectivityState.Offline);

            await draftQueue.enqueue(createPostRequest(), DEFAULT_TAG);
            await draftQueue.enqueue(createPostRequest(), 'testTagTwo');

            const actions = await draftQueue.getActionsForTags({
                [DEFAULT_TAG]: true,
                testTagTwo: true,
            });
            expect(actions['testTagTwo'].length).toEqual(1);
            expect(actions[DEFAULT_TAG].length).toEqual(1);
        });

        it('rehydrates queue from durable store', async () => {
            const network = buildMockNetworkAdapter([]);
            const durableStore = new MockDurableStore();
            const draftQueue = new DurableDraftQueue(durableStore, network);

            const request = {
                method: 'post',
                basePath: 'blah',
                baseUri: 'blahuri',
                body: null,
                queryParams: {},
                urlParams: {},
                headers: {},
            };
            const testAction = {
                id: 123456,
                status: DraftActionStatus.Pending,
                tag: 'testActionTag',
                request,
                data: {},
            };
            const entry: DurableStoreEntry = { data: testAction };
            durableStore.segments[DraftDurableSegment] = {};
            durableStore.segments[DraftDurableSegment]['123456'] = entry;

            const actions = await draftQueue.getActionsForTags({ testActionTag: true });
            expect(actions['testActionTag'][0]).toStrictEqual(testAction);
        });

        it('sorts draft actions into correct order', async () => {
            const network = buildMockNetworkAdapter([]);
            const durableStore = new MockDurableStore();
            const draftQueue = new DurableDraftQueue(durableStore, network);

            const request = {
                method: 'post',
                basePath: 'blah',
                baseUri: 'blahuri',
                body: null,
                queryParams: {},
                urlParams: {},
                headers: {},
            };
            const testAction = {
                id: 123456,
                status: DraftActionStatus.Pending,
                tag: 'testActionTag',
                request,
                data: {},
            };
            const testActionTwo = {
                id: 123457,
                status: DraftActionStatus.Pending,
                tag: 'testActionTag',
                request,
                data: {},
            };
            const entry: DurableStoreEntry = { data: testAction };
            const entryTwo: DurableStoreEntry = { data: testActionTwo };
            // the durable key order shouldn't matter so reverse it
            const entryID = '2';
            const entryTwoID = '1';
            const entries: DurableStoreEntries = { [entryTwoID]: entryTwo, [entryID]: entry };
            durableStore.setEntries(entries, DraftDurableSegment);

            const actions = await draftQueue.getActionsForTags({ testActionTag: true });
            const testActions = actions['testActionTag'];
            expect(testActions).toBeDefined();
            expect(testActions[0].id).toEqual(123456);
            expect(testActions[1].id).toEqual(123457);
        });
    });

    describe('processNextAction', () => {
        it('empty queue resolves to NO_ACTION_TO_PROCESS result', async () => {
            const network = buildMockNetworkAdapter([]);
            const durableStore = new MockDurableStore();
            const draftQueue = new DurableDraftQueue(durableStore, network);

            const result = await draftQueue.processNextAction();
            expect(result).toEqual(ProcessActionResult.NO_ACTION_TO_PROCESS);
        });

        it('successful action results in ACTION_SUCCEEDED result', async () => {
            const createArgs: MockPayload['networkArgs'] = {
                method: 'post',
                basePath: '/blah',
            };
            const successPayload: MockPayload = buildSuccessMockPayload(createArgs, {});
            const network = buildMockNetworkAdapter([successPayload]);
            const durableStore = new MockDurableStore();
            const evictSpy = jest.spyOn(durableStore, 'evictEntries');

            const draftQueue = new DurableDraftQueue(durableStore, network);
            await draftQueue.enqueue(DEFAULT_REQUEST, DEFAULT_TAG);

            const allDrafts = await durableStore.getAllEntries(DraftDurableSegment);
            expect(ObjectKeys(allDrafts).length).toEqual(1);

            const result = await draftQueue.processNextAction();
            expect(result).toEqual(ProcessActionResult.ACTION_SUCCEEDED);
            const callCount = getMockNetworkAdapterCallCount(network);
            expect(callCount).toEqual(1);
            expect(evictSpy).toBeCalledTimes(1);
        });

        it('returns ACTION_ALREADY_PROCESSING if network request is in flight', async () => {
            expect.assertions(3);
            let draftQueue: DurableDraftQueue;
            // mock the network, have network call kick off 2nd processNextAction call
            const mockNetwork = jest.fn().mockImplementation(async () => {
                await expect(draftQueue.processNextAction()).resolves.toEqual(
                    ProcessActionResult.ACTION_ALREADY_PROCESSING
                );
                return {};
            });

            const durableStore = new MockDurableStore();
            draftQueue = new DurableDraftQueue(durableStore, mockNetwork);
            await draftQueue.enqueue(DEFAULT_REQUEST, DEFAULT_TAG);

            const firstCallResult = await draftQueue.processNextAction();
            expect(firstCallResult).toEqual(ProcessActionResult.ACTION_SUCCEEDED);
            expect(mockNetwork).toBeCalledTimes(1);
        });

        it('non-2xx network result returns ACTION_ERRORED result and blocks subsequent calls', async () => {
            const request = {
                method: 'post',
                basePath: '/blah',
                baseUri: 'blahuri',
                body: null,
                queryParams: {},
                urlParams: {},
                headers: {},
            };

            const errorPayload: MockPayload = buildErrorMockPayload(
                request,
                {},
                400,
                'BAD_REQUEST'
            );
            const network = buildMockNetworkAdapter([errorPayload]);
            const durableStore = new MockDurableStore();
            const draftQueue = new DurableDraftQueue(durableStore, network);

            await draftQueue.enqueue(request, DEFAULT_TAG);
            const result = await draftQueue.processNextAction();

            expect(result).toEqual(ProcessActionResult.ACTION_ERRORED);
            let allDrafts = await durableStore.getAllEntries(DraftDurableSegment);
            expect(ObjectKeys(allDrafts).length).toEqual(1);

            // now subsequent calls should result in blocked response (make 2 calls to be sure)
            await expect(draftQueue.processNextAction()).resolves.toBe(
                ProcessActionResult.BLOCKED_ON_ERROR
            );
            await expect(draftQueue.processNextAction()).resolves.toBe(
                ProcessActionResult.BLOCKED_ON_ERROR
            );
        });

        it('network error puts action back in pending', async () => {
            const network = buildMockNetworkAdapter([]);
            setNetworkConnectivity(network, ConnectivityState.Offline);
            const durableStore = new MockDurableStore();
            const draftQueue = new DurableDraftQueue(durableStore, network);

            const action1 = await draftQueue.enqueue(DEFAULT_REQUEST, 'tag1');
            // put a couple more actions in the queue to ensure ordering is maintained
            await draftQueue.enqueue(DEFAULT_REQUEST, 'tag2');
            await draftQueue.enqueue(DEFAULT_REQUEST, 'tag3');

            const result = await draftQueue.processNextAction();

            expect(result).toEqual(ProcessActionResult.NETWORK_ERROR);

            const allDrafts = await durableStore.getAllEntries(DraftDurableSegment);
            const durableEntryKeys = Object.keys(allDrafts).sort();
            expect(durableEntryKeys.length).toEqual(3);
            const actionFromDurable = allDrafts[durableEntryKeys[0]].data as DraftAction<any>;
            expect(actionFromDurable.status).toEqual(DraftActionStatus.Pending);
            expect(actionFromDurable).toEqual(action1);
        });

        it('processes actions in the right order', async () => {
            const network = jest.fn().mockResolvedValue({});
            const durableStore = new MockDurableStore();
            const draftQueue = new DurableDraftQueue(durableStore, network);

            const firstRequest = { ...DEFAULT_REQUEST, basePath: '/z' };
            const secondRequest = { ...DEFAULT_REQUEST, basePath: '/a' };
            await draftQueue.enqueue(firstRequest, 'z');
            await draftQueue.enqueue(secondRequest, 'a');

            await draftQueue.processNextAction();
            expect(network).toBeCalledWith(firstRequest);

            await draftQueue.processNextAction();
            expect(network).toBeCalledWith(secondRequest);
        });
    });
});
