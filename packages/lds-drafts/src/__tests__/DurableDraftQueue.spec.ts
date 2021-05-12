import {
    DraftAction,
    DraftActionStatus,
    PendingDraftAction,
    UploadingDraftAction,
    DraftQueueState,
    ProcessActionResult,
    DraftQueueEventType,
    DraftQueueEvent,
    QueueOperation,
    QueueOperationType,
    ErrorDraftAction,
} from '../DraftQueue';
import {
    DurableDraftQueue,
    DRAFT_SEGMENT,
    DRAFT_ID_MAPPINGS_SEGMENT,
    generateUniqueDraftActionId,
} from '../DurableDraftQueue';
import {
    MockDurableStore,
    buildMockNetworkAdapter,
    getMockNetworkAdapterCallCount,
    MockPayload,
    buildSuccessMockPayload,
    buildErrorMockPayload,
    setNetworkConnectivity,
    ConnectivityState,
} from '@luvio/adapter-test-library';
import { ObjectKeys } from '../utils/language';
import { DurableStoreEntry, DurableStoreEntries } from '@luvio/environments';
import { createPatchRequest, createPostRequest, flushPromises, RECORD_ID } from './test-utils';
import { ResourceRequest } from '@luvio/engine';
import {
    buildDraftDurableStoreKey,
    getRecordIdFromRecordRequest,
    getRecordKeyFromRecordRequest,
} from '../utils/records';

const DEFAULT_PATCH_REQUEST: ResourceRequest = {
    method: 'patch',
    basePath: '/blah',
    baseUri: 'blahuri',
    body: null,
    queryParams: {},
    urlParams: {},
    headers: {},
};

const DEFAULT_POST_REQUEST: ResourceRequest = {
    method: 'post',
    basePath: '/blah',
    baseUri: 'blahuri',
    body: null,
    queryParams: {},
    urlParams: {},
    headers: {},
};
const UPDATE_REQUEST: ResourceRequest = {
    method: 'patch',
    basePath: '/blah',
    baseUri: 'blahuri',
    body: null,
    queryParams: {},
    urlParams: {},
    headers: {},
};
const DEFAULT_TAG = 'UiApi::RecordRepresentation:Res1D505SS6iztdRYA';

const mockQueuePostHandler = jest.fn().mockResolvedValue([]);
const mockDraftIdHandler = jest.fn().mockRejectedValue({ canonicalKey: 'foo', draftKey: 'bar' });

describe('DurableDraftQueue', () => {
    it('creates unique ids', () => {
        const createdIds: string[] = [];
        for (let i = 0; i < 1000; i++) {
            const newId = generateUniqueDraftActionId(createdIds);
            createdIds.push(newId);
        }
        const len = createdIds.length;
        for (let i = 0; i < len; i++) {
            const id = createdIds[i];
            expect(createdIds.indexOf(id)).toBe(i);
            expect(createdIds.lastIndexOf(id)).toBe(i);
        }
    });

    describe('state', () => {
        it('begins in Stopped state', async () => {
            const network = buildMockNetworkAdapter([]);
            const durableStore = new MockDurableStore();
            const draftQueue = new DurableDraftQueue(
                durableStore,
                network,
                mockQueuePostHandler,
                mockDraftIdHandler
            );

            const state = draftQueue.getQueueState();
            expect(state).toEqual(DraftQueueState.Stopped);
        });

        it('changes when start and stop called', async () => {
            const network = buildMockNetworkAdapter([]);
            const durableStore = new MockDurableStore();
            const draftQueue = new DurableDraftQueue(
                durableStore,
                network,
                mockQueuePostHandler,
                mockDraftIdHandler
            );
            expect(draftQueue.getQueueState()).toEqual(DraftQueueState.Stopped);
            await draftQueue.startQueue();
            expect(draftQueue.getQueueState()).toEqual(DraftQueueState.Started);
        });

        it('starts a new action when added to the queue in started state', async done => {
            const network = jest.fn().mockResolvedValue({});
            const durableStore = new MockDurableStore();
            const draftQueue = new DurableDraftQueue(
                durableStore,
                network,
                mockQueuePostHandler,
                mockDraftIdHandler
            );
            draftQueue.startQueue();
            let changedCount = 0;
            const listener = (event: DraftQueueEvent): Promise<void> => {
                changedCount += 1;
                if (changedCount === 2) {
                    expect(event.type).toBe(DraftQueueEventType.ActionAdded);
                    draftQueue.stopQueue();
                    done();
                }
                return Promise.resolve();
            };
            draftQueue.registerOnChangedListener(listener);
            const draftId = 'fooId';

            await draftQueue.enqueue(DEFAULT_PATCH_REQUEST, draftId, draftId);
        });

        it('starts a new action when one completes when in started state', async done => {
            const network = jest.fn().mockResolvedValue({});
            const durableStore = new MockDurableStore();
            const draftQueue = new DurableDraftQueue(
                durableStore,
                network,
                mockQueuePostHandler,
                mockDraftIdHandler
            );
            const listener = (event: DraftQueueEvent): Promise<void> => {
                if (event.type === DraftQueueEventType.ActionCompleted) {
                    done();
                }
                return Promise.resolve();
            };
            draftQueue.registerOnChangedListener(listener);
            const draftId = 'fooId';
            const draftIdTwo = 'barId';

            await draftQueue.enqueue(DEFAULT_PATCH_REQUEST, draftId, draftId);
            await draftQueue.enqueue(DEFAULT_PATCH_REQUEST, draftIdTwo, draftId);
            draftQueue.startQueue();
        });

        it('retries an item that encounteres a network error', async done => {
            const request = {
                method: 'patch',
                basePath: '/blah',
                baseUri: 'blahuri',
                body: null,
                queryParams: {},
                urlParams: {},
                headers: {},
            };

            const network = buildMockNetworkAdapter([]);
            setNetworkConnectivity(network, ConnectivityState.Offline);
            const durableStore = new MockDurableStore();
            const draftQueue = new DurableDraftQueue(
                durableStore,
                network,
                mockQueuePostHandler,
                mockDraftIdHandler
            );
            const anyDraftQueue = draftQueue as any;
            anyDraftQueue.retryIntervalMilliseconds = 1;
            draftQueue.startQueue();
            let changedCount = 0;
            const listener = async (event: DraftQueueEvent): Promise<void> => {
                const { type } = event;
                const state = draftQueue.getQueueState();

                changedCount += 1;
                // Adding
                // Added
                // Running
                // Retrying
                // Running
                if (changedCount === 1) {
                    expect(type).toBe(DraftQueueEventType.ActionAdding);
                    expect(state).toEqual(DraftQueueState.Started);
                }
                if (changedCount === 2) {
                    expect(type).toBe(DraftQueueEventType.ActionAdded);
                    expect(state).toEqual(DraftQueueState.Started);
                }
                if (changedCount === 3) {
                    expect(type).toBe(DraftQueueEventType.ActionRunning);
                    expect(state).toEqual(DraftQueueState.Started);
                }
                if (changedCount === 4) {
                    expect(type).toBe(DraftQueueEventType.ActionRetrying);
                    expect(state).toEqual(DraftQueueState.Waiting);
                    setNetworkConnectivity(network, ConnectivityState.Online);
                }
                if (changedCount === 5) {
                    expect(type).toBe(DraftQueueEventType.ActionRunning);
                    draftQueue.stopQueue();
                    done();
                }
                return Promise.resolve();
            };
            draftQueue.registerOnChangedListener(listener);

            await draftQueue.enqueue(request, DEFAULT_TAG, 'targetId');
        });
    });

    describe('retry', () => {
        it('interval goes to zero on startQueue', async () => {
            const network = buildMockNetworkAdapter([]);
            setNetworkConnectivity(network, ConnectivityState.Offline);
            const durableStore = new MockDurableStore();
            const draftQueue = new DurableDraftQueue(
                durableStore,
                network,
                mockQueuePostHandler,
                mockDraftIdHandler
            );
            const anyDraftQueue = draftQueue as any;
            anyDraftQueue.retryIntervalMilliseconds = 10000000;
            await draftQueue.startQueue();
            expect(anyDraftQueue.retryIntervalMilliseconds).toEqual(0);
        });

        it('interval goes to zero on success', async done => {
            const createArgs: MockPayload['networkArgs'] = {
                method: 'patch',
                basePath: '/blah',
            };
            const successPayload: MockPayload = buildSuccessMockPayload(createArgs, {});
            const network = buildMockNetworkAdapter([successPayload]);
            const durableStore = new MockDurableStore();
            const draftQueue = new DurableDraftQueue(
                durableStore,
                network,
                mockQueuePostHandler,
                mockDraftIdHandler
            );
            const anyDraftQueue = draftQueue as any;
            await draftQueue.startQueue();
            anyDraftQueue.retryIntervalMilliseconds = 10000;
            const listener = (event: DraftQueueEvent): Promise<void> => {
                if (event.type === DraftQueueEventType.ActionCompleted) {
                    expect(anyDraftQueue.retryIntervalMilliseconds).toEqual(0);
                    done();
                }
                return Promise.resolve();
            };
            draftQueue.registerOnChangedListener(listener);
            const draftId = 'fooId';

            await draftQueue.enqueue(DEFAULT_PATCH_REQUEST, draftId, draftId);
        });
    });

    describe('enqueue', () => {
        it('creates timestamp in the draft action when created', async () => {
            jest.spyOn(global.Date, 'now').mockImplementationOnce(() => {
                return 12345;
            });

            const network = buildMockNetworkAdapter([]);
            const durableStore = new MockDurableStore();
            const draftQueue = new DurableDraftQueue(
                durableStore,
                network,
                mockQueuePostHandler,
                mockDraftIdHandler
            );
            const draftId = 'fooId';

            const action = await draftQueue.enqueue(DEFAULT_PATCH_REQUEST, draftId, draftId);

            expect(action.timestamp).toEqual(12345);
        });

        it('cannot create post action on record that already exists', async () => {
            const network = buildMockNetworkAdapter([]);
            const durableStore = new MockDurableStore();
            const draftQueue = new DurableDraftQueue(
                durableStore,
                network,
                mockQueuePostHandler,
                mockDraftIdHandler
            );
            const draftId = 'fooId';

            await draftQueue.enqueue(DEFAULT_POST_REQUEST, draftId, draftId);

            await expect(
                draftQueue.enqueue(DEFAULT_POST_REQUEST, draftId, draftId)
            ).rejects.toEqual(Error('Cannot enqueue a POST draft action with an existing tag'));
        });
        it('cannot publish draft action after a delete action is added', async () => {
            const network = buildMockNetworkAdapter([]);
            const durableStore = new MockDurableStore();
            const draftQueue = new DurableDraftQueue(
                durableStore,
                network,
                mockQueuePostHandler,
                mockDraftIdHandler
            );
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
                draftId,
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
                draftId,
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
                    draftId,
                    draftId
                )
            ).rejects.toEqual(Error('Cannot enqueue a draft action for a deleted record'));
        });

        it('calls the durable store when enqueuing', async () => {
            const network = buildMockNetworkAdapter([]);
            const durableStore = new MockDurableStore();
            const draftQueue = new DurableDraftQueue(
                durableStore,
                network,
                mockQueuePostHandler,
                mockDraftIdHandler
            );

            await draftQueue.enqueue(createPatchRequest(), DEFAULT_TAG, 'targetId');
            const allEntries = await durableStore.getAllEntries(DRAFT_SEGMENT);
            expect(ObjectKeys(allEntries).length).toEqual(1);
        });

        it('creates two draft actions when editing the same record', async () => {
            const network = buildMockNetworkAdapter([]);
            const durableStore = new MockDurableStore();
            const draftStore = new DurableDraftQueue(
                durableStore,
                network,
                mockQueuePostHandler,
                mockDraftIdHandler
            );

            await draftStore.enqueue(createPatchRequest(), DEFAULT_TAG, 'targetId');
            const secondPatch = createPatchRequest();
            secondPatch.body.fields.Name = 'Acme 2';
            await draftStore.enqueue(secondPatch, DEFAULT_TAG, 'targetId');
            const allEntries = await durableStore.getAllEntries(DRAFT_SEGMENT);
            expect(ObjectKeys(allEntries).length).toEqual(2);

            const allActions = await draftStore.getActionsForTags({ [DEFAULT_TAG]: true });
            expect(allActions[DEFAULT_TAG].length).toEqual(2);
            const firstAction = allActions[DEFAULT_TAG][0];
            const secondAction = allActions[DEFAULT_TAG][1];
            expect(firstAction.status).toEqual(DraftActionStatus.Pending);
            expect(secondAction.status).toEqual(DraftActionStatus.Pending);
            expect(parseInt(firstAction.id)).toBeLessThan(parseInt(secondAction.id));
        });

        it('populates targetId', async () => {
            const network = buildMockNetworkAdapter([]);
            const durableStore = new MockDurableStore();
            const draftQueue = new DurableDraftQueue(
                durableStore,
                network,
                mockQueuePostHandler,
                mockDraftIdHandler
            );
            const request = createPatchRequest();
            const tag = getRecordKeyFromRecordRequest(request);
            const targetId = getRecordIdFromRecordRequest(request);

            const action = await draftQueue.enqueue(request, tag, targetId);

            expect(action.targetId).toEqual(RECORD_ID);
        });
    });

    describe('getActionsForTags', () => {
        it('fetches the original timestamp from when created enqueue', async () => {
            jest.spyOn(global.Date, 'now').mockImplementationOnce(() => {
                return 12345;
            });

            const network = buildMockNetworkAdapter([]);
            const durableStore = new MockDurableStore();
            const draftQueue = new DurableDraftQueue(
                durableStore,
                network,
                mockQueuePostHandler,
                mockDraftIdHandler
            );
            setNetworkConnectivity(network, ConnectivityState.Offline);

            await draftQueue.enqueue(createPostRequest(), DEFAULT_TAG, 'targetId');

            const actions = await draftQueue.getActionsForTags({
                [DEFAULT_TAG]: true,
            });
            expect(actions).toMatchObject({
                [DEFAULT_TAG]: [{ timestamp: 12345 }],
            });
        });

        it('can enqueue multiple draft actions', async () => {
            const network = buildMockNetworkAdapter([]);
            const durableStore = new MockDurableStore();
            const draftQueue = new DurableDraftQueue(
                durableStore,
                network,
                mockQueuePostHandler,
                mockDraftIdHandler
            );
            setNetworkConnectivity(network, ConnectivityState.Offline);

            await draftQueue.enqueue(createPostRequest(), DEFAULT_TAG, 'targetId');
            await draftQueue.enqueue(createPostRequest(), 'testTagTwo', 'targetIdTwo');

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
            const draftQueue = new DurableDraftQueue(
                durableStore,
                network,
                mockQueuePostHandler,
                mockDraftIdHandler
            );

            const request = {
                method: 'patch',
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
                metadata: { foo: 'bar' },
            };
            const entry: DurableStoreEntry = { data: testAction };
            durableStore.segments[DRAFT_SEGMENT] = {};
            durableStore.segments[DRAFT_SEGMENT]['123456'] = entry;

            const actions = await draftQueue.getActionsForTags({ testActionTag: true });
            expect(actions['testActionTag'][0]).toStrictEqual(testAction);
        });

        it('sorts draft actions into correct order', async () => {
            const network = buildMockNetworkAdapter([]);
            const durableStore = new MockDurableStore();
            const draftQueue = new DurableDraftQueue(
                durableStore,
                network,
                mockQueuePostHandler,
                mockDraftIdHandler
            );

            const request = {
                method: 'patch',
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
            const entries: DurableStoreEntries<unknown> = {
                [entryTwoID]: entryTwo,
                [entryID]: entry,
            };
            durableStore.setEntries(entries, DRAFT_SEGMENT);

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
            const draftQueue = new DurableDraftQueue(
                durableStore,
                network,
                mockQueuePostHandler,
                mockDraftIdHandler
            );

            const result = await draftQueue.processNextAction();
            expect(result).toEqual(ProcessActionResult.NO_ACTION_TO_PROCESS);
        });

        it('successful action results in ACTION_SUCCEEDED result', async () => {
            const createArgs: MockPayload['networkArgs'] = {
                method: 'patch',
                basePath: '/blah',
            };
            const successPayload: MockPayload = buildSuccessMockPayload(createArgs, {});
            const network = buildMockNetworkAdapter([successPayload]);
            const durableStore = new MockDurableStore();
            const batchOperationsSpy = jest.spyOn(durableStore, 'batchOperations');

            const draftQueue = new DurableDraftQueue(
                durableStore,
                network,
                mockQueuePostHandler,
                mockDraftIdHandler
            );
            await draftQueue.enqueue(DEFAULT_PATCH_REQUEST, DEFAULT_TAG, 'targetId');

            const allDrafts = await durableStore.getAllEntries(DRAFT_SEGMENT);
            expect(ObjectKeys(allDrafts).length).toEqual(1);

            const result = await draftQueue.processNextAction();
            expect(result).toEqual(ProcessActionResult.ACTION_SUCCEEDED);
            const callCount = getMockNetworkAdapterCallCount(network);
            expect(callCount).toEqual(1);

            const evictCallOperations = batchOperationsSpy.mock.calls[1][0];
            const { type, segment } = evictCallOperations[0];
            expect(evictCallOperations.length).toEqual(1);
            expect(type).toEqual('evictEntries');
            expect(segment).toEqual(DRAFT_SEGMENT);
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
            draftQueue = new DurableDraftQueue(
                durableStore,
                mockNetwork,
                mockQueuePostHandler,
                mockDraftIdHandler
            );
            await draftQueue.enqueue(DEFAULT_PATCH_REQUEST, DEFAULT_TAG, 'targetId');

            const firstCallResult = await draftQueue.processNextAction();
            expect(firstCallResult).toEqual(ProcessActionResult.ACTION_SUCCEEDED);
            expect(mockNetwork).toBeCalledTimes(1);
        });

        it('non-2xx network result returns ACTION_ERRORED result and blocks subsequent calls', async () => {
            const request = {
                method: 'patch',
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
            const draftQueue = new DurableDraftQueue(
                durableStore,
                network,
                mockQueuePostHandler,
                mockDraftIdHandler
            );

            await draftQueue.enqueue(request, DEFAULT_TAG, 'targetId');
            const result = await draftQueue.processNextAction();

            expect(result).toEqual(ProcessActionResult.ACTION_ERRORED);
            let allDrafts = await durableStore.getAllEntries(DRAFT_SEGMENT);
            expect(ObjectKeys(allDrafts).length).toEqual(1);

            // now subsequent calls should result in blocked response (make 2 calls to be sure)
            await expect(draftQueue.processNextAction()).resolves.toBe(
                ProcessActionResult.BLOCKED_ON_ERROR
            );
            await expect(draftQueue.processNextAction()).resolves.toBe(
                ProcessActionResult.BLOCKED_ON_ERROR
            );
        });

        it('action is errored but retains original timestamp', async () => {
            jest.spyOn(global.Date, 'now').mockImplementationOnce(() => {
                return 12345;
            });

            const request = {
                method: 'patch',
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
            const draftQueue = new DurableDraftQueue(
                durableStore,
                network,
                mockQueuePostHandler,
                mockDraftIdHandler
            );

            const { id } = await draftQueue.enqueue(request, DEFAULT_TAG, 'targetId');
            const result = await draftQueue.processNextAction();
            const entryId = buildDraftDurableStoreKey(DEFAULT_TAG, id);

            expect(result).toEqual(ProcessActionResult.ACTION_ERRORED);
            const draft = await durableStore.getEntries([entryId], DRAFT_SEGMENT);
            expect(draft[entryId]).toMatchObject({
                data: { timestamp: 12345 },
            });
        });

        it('network error puts action back in pending', async () => {
            const network = buildMockNetworkAdapter([]);
            setNetworkConnectivity(network, ConnectivityState.Offline);
            const durableStore = new MockDurableStore();
            const draftQueue = new DurableDraftQueue(
                durableStore,
                network,
                mockQueuePostHandler,
                mockDraftIdHandler
            );

            const action1 = await draftQueue.enqueue(DEFAULT_PATCH_REQUEST, 'tag1', 'targetIdOne');
            // put a couple more actions in the queue to ensure ordering is maintained
            await draftQueue.enqueue(DEFAULT_PATCH_REQUEST, 'tag2', 'targetIdTwo');
            await draftQueue.enqueue(DEFAULT_PATCH_REQUEST, 'tag3', 'targetIdThree');

            const result = await draftQueue.processNextAction();

            expect(result).toEqual(ProcessActionResult.NETWORK_ERROR);

            const allDrafts = await durableStore.getAllEntries(DRAFT_SEGMENT);
            const durableEntryKeys = Object.keys(allDrafts).sort();
            expect(durableEntryKeys.length).toEqual(3);
            const actionFromDurable = allDrafts[durableEntryKeys[0]].data as DraftAction<any>;
            expect(actionFromDurable.status).toEqual(DraftActionStatus.Pending);
            expect(actionFromDurable).toEqual(action1);
        });

        it('processes actions in the right order', async () => {
            const network = jest.fn().mockResolvedValue({});
            const durableStore = new MockDurableStore();
            const draftQueue = new DurableDraftQueue(
                durableStore,
                network,
                mockQueuePostHandler,
                mockDraftIdHandler
            );

            const firstRequest = { ...DEFAULT_PATCH_REQUEST, basePath: '/z' };
            const secondRequest = { ...DEFAULT_PATCH_REQUEST, basePath: '/a' };
            await draftQueue.enqueue(firstRequest, 'z', 'targetIdOne');
            await draftQueue.enqueue(secondRequest, 'a', 'targetIdTwo');

            await draftQueue.processNextAction();
            expect(network).toBeCalledWith(firstRequest);

            await draftQueue.processNextAction();
            expect(network).toBeCalledWith(secondRequest);
        });

        // test cases for how the draft queue behaves after a POST action has succesfully uploaded
        describe('on POST success', () => {
            it('executes queue actions', async () => {
                const createArgs: MockPayload['networkArgs'] = {
                    method: 'post',
                    basePath: '/blah',
                };
                const successPayload: MockPayload = buildSuccessMockPayload(createArgs, {});
                const network = buildMockNetworkAdapter([successPayload]);
                const durableStore = new MockDurableStore();

                const mockQueueOperations: QueueOperation[] = [];
                mockQueueOperations.push({
                    type: QueueOperationType.Add,
                    action: {
                        id: 'foo',
                        tag: 'bar',
                    } as any,
                });
                mockQueueOperations.push({
                    type: QueueOperationType.Update,
                    action: {
                        id: 'buz',
                        tag: 'baz',
                    } as any,
                    key: 'baz__DraftAction__buz',
                });

                const draftQueue = new DurableDraftQueue(
                    durableStore,
                    network,
                    jest.fn().mockReturnValue(mockQueueOperations),
                    jest.fn().mockReturnValue({ canonicalKey: 'foo', draftKey: 'bar' })
                );
                await draftQueue.enqueue(DEFAULT_POST_REQUEST, DEFAULT_TAG, 'fooId');
                const result = await draftQueue.processNextAction();
                expect(result).toEqual(ProcessActionResult.ACTION_SUCCEEDED);
                expect(durableStore.segments['DRAFT']['bar__DraftAction__foo']).toBeDefined();
                expect(durableStore.segments['DRAFT']['baz__DraftAction__buz']).toBeDefined();
            });

            it('inserts draft mapping', async () => {
                const createArgs: MockPayload['networkArgs'] = {
                    method: 'post',
                    basePath: '/blah',
                };
                const successPayload: MockPayload = buildSuccessMockPayload(createArgs, {});
                const network = buildMockNetworkAdapter([successPayload]);
                const durableStore = new MockDurableStore();

                const mockQueueOperations: QueueOperation[] = [];

                const draftQueue = new DurableDraftQueue(
                    durableStore,
                    network,
                    jest.fn().mockReturnValue(mockQueueOperations),
                    jest.fn().mockReturnValue({ canonicalKey: 'foo', draftKey: 'bar' })
                );
                await draftQueue.enqueue(DEFAULT_POST_REQUEST, DEFAULT_TAG, 'fooId');
                const result = await draftQueue.processNextAction();
                expect(result).toEqual(ProcessActionResult.ACTION_SUCCEEDED);
                expect(
                    durableStore.segments[DRAFT_ID_MAPPINGS_SEGMENT]['DraftIdMapping::bar::foo']
                ).toBeDefined();
            });

            it('doesnt store uploading draft actions', async () => {
                expect.assertions(3);
                const draftId = 'fooId';
                let foundStatus = '';
                let foundId = '';
                const durableStore = new MockDurableStore();
                const network = jest.fn().mockImplementation(() => {
                    const draftKey = ObjectKeys(durableStore.segments[DRAFT_SEGMENT])[0];
                    const draftEntry = durableStore.segments[DRAFT_SEGMENT][draftKey] as any;
                    expect(draftEntry).toBeDefined();
                    foundId = draftEntry.data.targetId;
                    foundStatus = draftEntry.data.status;
                    return Promise.resolve(undefined);
                });
                const draftQueue = new DurableDraftQueue(
                    durableStore,
                    network,
                    mockQueuePostHandler,
                    mockDraftIdHandler
                );
                await draftQueue.enqueue(DEFAULT_PATCH_REQUEST, draftId, draftId);
                await draftQueue.processNextAction();
                expect(foundStatus).toBe(DraftActionStatus.Pending);
                expect(foundId).toBe(draftId);
            });

            it('reports action as uploading while being processed in the network adapter', async () => {
                let action: DraftAction<unknown> = undefined;
                const durableStore = new MockDurableStore();
                const network = jest.fn();
                const draftQueue = new DurableDraftQueue(
                    durableStore,
                    network,
                    mockQueuePostHandler,
                    mockDraftIdHandler
                );
                network.mockImplementation(async () => {
                    const actions = await draftQueue.getQueueActions();
                    action = actions[0];
                });
                const draftId = 'fooId';
                await draftQueue.enqueue(DEFAULT_PATCH_REQUEST, draftId, draftId);
                await draftQueue.processNextAction();
                expect(action).toBeDefined();
                expect(action.status).toBe(DraftActionStatus.Uploading);
            });
        });
    });

    describe('queue change listener', () => {
        it('is called when item added', async () => {
            const network = buildMockNetworkAdapter([]);
            const durableStore = new MockDurableStore();
            const draftQueue = new DurableDraftQueue(
                durableStore,
                network,
                mockQueuePostHandler,
                mockDraftIdHandler
            );
            const listener = jest.fn();
            draftQueue.registerOnChangedListener(listener);
            const draftId = 'fooId';
            await draftQueue.enqueue(DEFAULT_PATCH_REQUEST, draftId, draftId);
            expect(listener).toBeCalledTimes(2);
            expect(listener.mock.calls[0][0].type).toBe(DraftQueueEventType.ActionAdding);
            expect(listener.mock.calls[1][0].type).toBe(DraftQueueEventType.ActionAdded);
        });

        it('is called when item removed', async () => {
            const network = buildMockNetworkAdapter([]);
            const durableStore = new MockDurableStore();
            const draftQueue = new DurableDraftQueue(
                durableStore,
                network,
                mockQueuePostHandler,
                mockDraftIdHandler
            );
            const draftAction = await draftQueue.enqueue(
                DEFAULT_PATCH_REQUEST,
                DEFAULT_TAG,
                'targetId'
            );

            let deletingCalled = false;
            let deletedCalled = false;
            draftQueue.registerOnChangedListener(
                (event): Promise<void> => {
                    if (event.type === DraftQueueEventType.ActionDeleting) {
                        deletingCalled = true;
                    } else if (event.type === DraftQueueEventType.ActionDeleted) {
                        deletedCalled = true;
                    }
                    return Promise.resolve();
                }
            );

            await draftQueue.removeDraftAction(draftAction.id);
            expect(deletingCalled).toBe(true);
            expect(deletedCalled).toBe(true);
        });

        it('is called when item completes', async () => {
            const network = jest.fn().mockResolvedValue({});
            const durableStore = new MockDurableStore();
            const draftQueue = new DurableDraftQueue(
                durableStore,
                network,
                mockQueuePostHandler,
                mockDraftIdHandler
            );
            const listener = jest.fn();
            draftQueue.registerOnChangedListener(listener);
            const firstRequest = { ...DEFAULT_PATCH_REQUEST, basePath: '/z' };
            await draftQueue.enqueue(firstRequest, 'z', 'targetId');
            await draftQueue.processNextAction();
            expect(listener).toBeCalledTimes(5);
            expect(listener.mock.calls[0][0].type).toBe(DraftQueueEventType.ActionAdding);
            expect(listener.mock.calls[1][0].type).toBe(DraftQueueEventType.ActionAdded);
            expect(listener.mock.calls[2][0].type).toBe(DraftQueueEventType.ActionRunning);
            expect(listener.mock.calls[3][0].type).toBe(DraftQueueEventType.ActionCompleting);
            expect(listener.mock.calls[4][0].type).toBe(DraftQueueEventType.ActionCompleted);
        });

        it('is called when item errors', async () => {
            const completedSpy = jest.fn();
            const network = buildMockNetworkAdapter([]);
            const durableStore = new MockDurableStore();
            const draftQueue = new DurableDraftQueue(
                durableStore,
                network,
                mockQueuePostHandler,
                mockDraftIdHandler
            );
            draftQueue.registerOnChangedListener(completedSpy);
            const firstRequest = { ...DEFAULT_PATCH_REQUEST, basePath: '/z' };
            await draftQueue.enqueue(firstRequest, 'z', 'targetId');
            await draftQueue.startQueue();
            expect(completedSpy).toBeCalledTimes(4);
            expect(completedSpy.mock.calls[0][0].type).toBe(DraftQueueEventType.ActionAdding);
            expect(completedSpy.mock.calls[1][0].type).toBe(DraftQueueEventType.ActionAdded);
            expect(completedSpy.mock.calls[2][0].type).toBe(DraftQueueEventType.ActionRunning);
            expect(completedSpy.mock.calls[3][0].type).toBe(DraftQueueEventType.ActionRetrying);
            await draftQueue.stopQueue();
        });
    });

    describe('removeDraftAction', () => {
        const baseTag = 'UiApi::RecordRepresentation:Res1D505SS6iztdRYA';
        const baseAction = {
            id: '123456',
            targetId: 'testTargetId',
            tag: baseTag,
            request: DEFAULT_PATCH_REQUEST,
            timestamp: 2,
            metadata: {},
        };

        const setup = (testActions: DraftAction<unknown>[] = []) => {
            const durableStore = new MockDurableStore();
            const evictSpy = jest.spyOn(durableStore, 'evictEntries');

            const draftQueue = new DurableDraftQueue(
                durableStore,
                buildMockNetworkAdapter([]),
                mockQueuePostHandler,
                mockDraftIdHandler
            );

            // reset the durable store's draft segment before each test
            durableStore.segments[DRAFT_SEGMENT] = {};
            testActions.forEach(testAction => {
                durableStore.segments[DRAFT_SEGMENT][
                    buildDraftDurableStoreKey(testAction.tag, testAction.id)
                ] = { data: testAction };
            });

            return { draftQueue, evictSpy, durableStore };
        };

        it('throws an error if no draft action with the ID exists', async () => {
            const { draftQueue } = setup();
            await expect(draftQueue.removeDraftAction('noSuchId')).rejects.toThrowError(
                'No removable action with id noSuchId'
            );
        });

        it('throws an error if the removed action is uploading', async () => {
            const testAction: UploadingDraftAction<unknown> = {
                ...baseAction,
                status: DraftActionStatus.Uploading,
            };

            const { draftQueue } = setup([testAction]);
            // uploadingActionId is private, but we need to set it to
            // mock the uploading action
            (draftQueue as any).uploadingActionId = testAction.id;
            await expect(draftQueue.removeDraftAction(testAction.id)).rejects.toThrowError(
                'Cannot remove an uploading draft action with ID 123456'
            );
        });

        it('calls evict entries with correct durable store key', async () => {
            const testAction: PendingDraftAction<unknown> = {
                ...baseAction,
                status: DraftActionStatus.Pending,
            };

            const { draftQueue, evictSpy, durableStore } = setup([testAction]);
            evictSpy.mockImplementation((ids, segment) => {
                const expectedId = `${baseTag}__DraftAction__123456`;
                expect(ids).toEqual([expectedId]);
                expect(segment).toEqual('DRAFT');
                durableStore.segments[DRAFT_SEGMENT] = undefined;
                return Promise.resolve();
            });

            await draftQueue.removeDraftAction(testAction.id);
        });

        it('deletes related draft edits on draft-create delete', async () => {
            const testAction1: PendingDraftAction<unknown> = {
                ...baseAction,
                id: '101',
                tag: 'UiApi::RecordRepresentation:target110',
                targetId: 'target110',
                request: DEFAULT_POST_REQUEST,
                status: DraftActionStatus.Pending,
            };
            const testAction2: PendingDraftAction<unknown> = {
                ...baseAction,
                id: '102',
                tag: 'UiApi::RecordRepresentation:target110',
                targetId: 'target110',
                request: { ...DEFAULT_PATCH_REQUEST, basePath: '/basePath/target110' },
                status: DraftActionStatus.Pending,
            };
            const testAction3: PendingDraftAction<unknown> = {
                ...baseAction,
                id: '103',
                tag: 'UiApi::RecordRepresentation:target110',
                targetId: 'target110',
                request: { ...DEFAULT_PATCH_REQUEST, basePath: '/basePath/target110' },
                status: DraftActionStatus.Pending,
            };
            const testAction4: PendingDraftAction<unknown> = {
                ...baseAction,
                id: '104',
                tag: 'UiApi::RecordRepresentation:target140',
                targetId: 'target140',
                status: DraftActionStatus.Pending,
            };
            const testAction5: PendingDraftAction<unknown> = {
                ...baseAction,
                id: '105',
                tag: 'UiApi::RecordRepresentation:target150',
                targetId: 'target150',
                status: DraftActionStatus.Pending,
            };

            const { draftQueue, evictSpy } = setup([
                testAction1,
                testAction2,
                testAction3,
                testAction4,
                testAction5,
            ]);

            const expectedId1 = `UiApi::RecordRepresentation:target110__DraftAction__101`;
            const expectedId2 = `UiApi::RecordRepresentation:target110__DraftAction__102`;
            const expectedId3 = `UiApi::RecordRepresentation:target110__DraftAction__103`;

            await draftQueue.removeDraftAction(testAction1.id);
            expect(evictSpy).toBeCalledWith([expectedId2, expectedId3, expectedId1], 'DRAFT');
        });

        it('does not delete related draft edits on draft-edit delete', async () => {
            const testAction1: PendingDraftAction<unknown> = {
                ...baseAction,
                id: '101',
                tag: 'UiApi::RecordRepresentation:target110',
                targetId: 'target110',
                request: DEFAULT_POST_REQUEST,
                status: DraftActionStatus.Pending,
            };
            const testAction2: PendingDraftAction<unknown> = {
                ...baseAction,
                id: '102',
                tag: 'UiApi::RecordRepresentation:target110',
                targetId: 'target110',
                request: { ...DEFAULT_PATCH_REQUEST, basePath: '/basePath/target110' },
                status: DraftActionStatus.Pending,
            };
            const testAction3: PendingDraftAction<unknown> = {
                ...baseAction,
                id: '103',
                tag: 'UiApi::RecordRepresentation:target110',
                targetId: 'target110',
                request: { ...DEFAULT_PATCH_REQUEST, basePath: '/basePath/target110' },
                status: DraftActionStatus.Pending,
            };
            const testAction4: PendingDraftAction<unknown> = {
                ...baseAction,
                id: '104',
                tag: 'UiApi::RecordRepresentation:target140',
                targetId: 'target140',
                status: DraftActionStatus.Pending,
            };
            const testAction5: PendingDraftAction<unknown> = {
                ...baseAction,
                id: '105',
                tag: 'UiApi::RecordRepresentation:target150',
                targetId: 'target150',
                status: DraftActionStatus.Pending,
            };

            const { draftQueue, evictSpy } = setup([
                testAction1,
                testAction2,
                testAction3,
                testAction4,
                testAction5,
            ]);

            const expectedId3 = `UiApi::RecordRepresentation:target110__DraftAction__103`;

            await draftQueue.removeDraftAction(testAction3.id);
            expect(evictSpy).toBeCalledWith([expectedId3], 'DRAFT');
        });

        it('restarts queue if removing an errored item', async () => {
            const errorAction: ErrorDraftAction<unknown> = {
                ...baseAction,
                status: DraftActionStatus.Error,
                error: 'some error',
            };

            const { draftQueue, evictSpy, durableStore } = setup([errorAction]);
            evictSpy.mockImplementation((_ids, _segment) => {
                durableStore.segments[DRAFT_SEGMENT] = undefined;
                return Promise.resolve();
            });
            await expect(draftQueue.startQueue()).rejects.toBe(undefined);
            expect(draftQueue.getQueueState()).toEqual(DraftQueueState.Error);
            await draftQueue.removeDraftAction(errorAction.id);

            expect(draftQueue.getQueueState()).toEqual(DraftQueueState.Started);
        });
    });

    describe('swap action', () => {
        it('swaps correctly', async () => {
            const success = buildSuccessMockPayload(DEFAULT_PATCH_REQUEST, {});
            const network = buildMockNetworkAdapter([success]);
            const durableStore = new MockDurableStore();
            const draftQueue = new DurableDraftQueue(
                durableStore,
                network,
                mockQueuePostHandler,
                mockDraftIdHandler
            );
            const draftTag = 'UiApi::RecordRepresentation:Res1D505SS6iztdRYA';
            const actionOne = await draftQueue.enqueue(UPDATE_REQUEST, draftTag, 'targetId');
            const actionTwo = await draftQueue.enqueue(UPDATE_REQUEST, draftTag, 'targetId');
            let actions = await draftQueue.getQueueActions();
            expect(actions.length).toBe(2);
            await draftQueue.replaceAction(actionOne.id, actionTwo.id);
            actions = await draftQueue.getQueueActions();
            expect(actions.length).toBe(1);
            const action = actions[0];
            expect(action.id).toBe(actionOne.id);
        });

        it('calls listeners when swapping', async () => {
            const success = buildSuccessMockPayload(DEFAULT_PATCH_REQUEST, {});
            const network = buildMockNetworkAdapter([success]);
            const durableStore = new MockDurableStore();
            const draftQueue = new DurableDraftQueue(
                durableStore,
                network,
                mockQueuePostHandler,
                mockDraftIdHandler
            );
            const draftTag = 'UiApi::RecordRepresentation:fooId';
            const actionOne = await draftQueue.enqueue(UPDATE_REQUEST, draftTag, 'targetId');
            const secondUpdate = { ...UPDATE_REQUEST };
            secondUpdate.baseUri = 'secondTestURI';
            const actionTwo = await draftQueue.enqueue(secondUpdate, draftTag, 'targetId');
            let actions = await draftQueue.getQueueActions();
            expect(actions.length).toBe(2);
            let deletingCalled = false;
            let deletedCalled = false;
            let updatingCalled = false;
            let updatedCalled = false;
            draftQueue.registerOnChangedListener(
                (event): Promise<void> => {
                    if (event.type === DraftQueueEventType.ActionDeleting) {
                        expect(event.action.request).toEqual(secondUpdate);
                        deletingCalled = true;
                    } else if (event.type === DraftQueueEventType.ActionDeleted) {
                        expect(event.action.request).toEqual(secondUpdate);
                        deletedCalled = true;
                    } else if (event.type === DraftQueueEventType.ActionUpdating) {
                        expect(event.action.request).toEqual(UPDATE_REQUEST);
                        updatingCalled = true;
                    } else if (event.type === DraftQueueEventType.ActionUpdated) {
                        expect(event.action.request).toEqual(secondUpdate);
                        updatedCalled = true;
                    }
                    return Promise.resolve();
                }
            );

            await draftQueue.replaceAction(actionOne.id, actionTwo.id);
            expect(deletingCalled).toBe(true);
            expect(deletedCalled).toBe(true);
            expect(updatingCalled).toBe(true);
            expect(updatedCalled).toBe(true);

            await flushPromises();
        });

        it('rejects on equal draft action ids', async () => {
            const network = buildMockNetworkAdapter([]);
            const durableStore = new MockDurableStore();
            const draftQueue = new DurableDraftQueue(
                durableStore,
                network,
                mockQueuePostHandler,
                mockDraftIdHandler
            );
            const draftTag = 'UiAPI::RecordRepresentation::fooId';
            const actionOne = await draftQueue.enqueue(UPDATE_REQUEST, draftTag, 'targetId');
            await draftQueue.enqueue(UPDATE_REQUEST, draftTag, 'fooId');
            let actions = await draftQueue.getQueueActions();
            expect(actions.length).toBe(2);
            let result = draftQueue.replaceAction(actionOne.id, actionOne.id);
            await expect(result).rejects.toBe('Swapped and swapping action ids cannot be the same');
        });
        it('rejects on non-existent draft', async () => {
            const network = buildMockNetworkAdapter([]);
            const durableStore = new MockDurableStore();
            const draftQueue = new DurableDraftQueue(
                durableStore,
                network,
                mockQueuePostHandler,
                mockDraftIdHandler
            );
            const draftTag = 'UiAPI::RecordRepresentation::fooId';
            const actionOne = await draftQueue.enqueue(UPDATE_REQUEST, draftTag, 'fooId');
            const result = draftQueue.replaceAction(actionOne.id, 'blah');
            await expect(result).rejects.toBe('One or both actions does not exist');
        });

        it('rejects on non-matching target ids', async () => {
            const network = buildMockNetworkAdapter([]);
            const durableStore = new MockDurableStore();
            const draftQueue = new DurableDraftQueue(
                durableStore,
                network,
                mockQueuePostHandler,
                mockDraftIdHandler
            );
            const draftTag = 'UiAPI::RecordRepresentation::fooId';
            const draftTagTwo = 'UiAPI::RecordRepresentation::barId';
            const actionOne = await draftQueue.enqueue(UPDATE_REQUEST, draftTag, 'fooId');
            const actionTwo = await draftQueue.enqueue(UPDATE_REQUEST, draftTagTwo, 'barId');
            let actions = await draftQueue.getQueueActions();
            expect(actions.length).toBe(2);
            const result = draftQueue.replaceAction(actionOne.id, actionTwo.id);
            await expect(result).rejects.toBe('Cannot swap actions targeting different targets');
        });

        it('does not swap an in progress draft', async () => {
            const network = buildMockNetworkAdapter([]);
            const durableStore = new MockDurableStore();
            const firstId = '0';
            const secondId = '1';
            const firstDurableId = 'firstDurable';
            const secondDurableId = 'secondDurable';
            const inProgressAction: PendingDraftAction<unknown> = {
                id: firstId,
                targetId: firstId,
                status: DraftActionStatus.Pending,
                request: createPatchRequest(),
                tag: 'UiAPI::RecordRepresentation::fooId',
                timestamp: Date.now(),
                metadata: {},
            };
            const firstEntry: DurableStoreEntry = { data: inProgressAction };
            const pendingAction: PendingDraftAction<unknown> = {
                id: secondId,
                targetId: secondId,
                status: DraftActionStatus.Pending,
                request: createPatchRequest(),
                tag: 'UiAPI::RecordRepresentation::fooId',
                timestamp: Date.now(),
                metadata: {},
            };
            const secondEntry: DurableStoreEntry = { data: pendingAction };
            let entries: DurableStoreEntries<unknown> = { [firstDurableId]: firstEntry };
            await durableStore.setEntries(entries, DRAFT_SEGMENT);
            entries = { [secondDurableId]: secondEntry };
            await durableStore.setEntries(entries, DRAFT_SEGMENT);

            const draftQueue = new DurableDraftQueue(
                durableStore,
                network,
                mockQueuePostHandler,
                mockDraftIdHandler
            );
            // uploadingActionId is private, but we need to set it to
            // mock the uploading action
            (draftQueue as any).uploadingActionId = firstId;
            let actions = await draftQueue.getQueueActions();
            expect(actions.length).toBe(2);
            let result = draftQueue.replaceAction(actions[0].id, actions[1].id);
            await expect(result).rejects.toBe('Cannot replace an draft action that is uploading');
        });

        it('rejects when replacing with a non-pending action', async () => {
            const network = buildMockNetworkAdapter([]);
            const durableStore = new MockDurableStore();
            const firstId = '0';
            const secondId = '1';
            const firstDurableId = 'firstDurable';
            const secondDurableId = 'secondDurable';
            const pendingAction: PendingDraftAction<unknown> = {
                id: firstId,
                targetId: firstId,
                status: DraftActionStatus.Pending,
                request: createPatchRequest(),
                tag: 'UiAPI::RecordRepresentation::fooId',
                timestamp: Date.now(),
                metadata: {},
            };
            const firstEntry: DurableStoreEntry = { data: pendingAction };
            const nonPendingAction: ErrorDraftAction<unknown> = {
                id: secondId,
                targetId: secondId,
                status: DraftActionStatus.Error,
                request: createPatchRequest(),
                tag: 'UiAPI::RecordRepresentation::fooId',
                timestamp: Date.now(),
                error: {},
                metadata: {},
            };
            const secondEntry: DurableStoreEntry = { data: nonPendingAction };
            let entries: DurableStoreEntries<unknown> = { [firstDurableId]: firstEntry };
            await durableStore.setEntries(entries, DRAFT_SEGMENT);
            entries = { [secondDurableId]: secondEntry };
            await durableStore.setEntries(entries, DRAFT_SEGMENT);

            const draftQueue = new DurableDraftQueue(
                durableStore,
                network,
                mockQueuePostHandler,
                mockDraftIdHandler
            );
            let actions = await draftQueue.getQueueActions();
            expect(actions.length).toBe(2);
            let result = draftQueue.replaceAction(actions[0].id, actions[1].id);
            await expect(result).rejects.toBe('Cannot replace with a non-pending action');
        });

        it('sets a replaced item to pending', async () => {
            const network = buildMockNetworkAdapter([]);
            const durableStore = new MockDurableStore();
            const firstId = '0';
            const secondId = '1';
            const firstDurableId = 'firstDurable';
            const secondDurableId = 'secondDurable';
            const inProgressAction: ErrorDraftAction<unknown> = {
                id: firstId,
                targetId: firstId,
                status: DraftActionStatus.Error,
                request: createPatchRequest(),
                tag: 'UiApi::RecordRepresentation:fooId',
                timestamp: Date.now(),
                metadata: {},
                error: {},
            };
            const firstEntry: DurableStoreEntry = { data: inProgressAction };
            let secondPatchRequest = createPatchRequest();
            secondPatchRequest.body.fields.Name = 'Second Name';
            const pendingAction: PendingDraftAction<unknown> = {
                id: secondId,
                targetId: secondId,
                status: DraftActionStatus.Pending,
                request: secondPatchRequest,
                tag: 'UiApi::RecordRepresentation:fooId',
                timestamp: Date.now(),
                metadata: {},
            };
            const secondEntry: DurableStoreEntry = { data: pendingAction };
            let entries: DurableStoreEntries<unknown> = { [firstDurableId]: firstEntry };
            await durableStore.setEntries(entries, DRAFT_SEGMENT);
            entries = { [secondDurableId]: secondEntry };
            await durableStore.setEntries(entries, DRAFT_SEGMENT);

            const draftQueue = new DurableDraftQueue(
                durableStore,
                network,
                mockQueuePostHandler,
                mockDraftIdHandler
            );
            let actions = await draftQueue.getQueueActions();
            expect(actions.length).toBe(2);
            const actionToReplace = actions[0];
            expect(actionToReplace.request.body.fields.Name).toBe('Acme');
            const replacingAction = actions[1];
            expect(replacingAction.request.body.fields.Name).toBe('Second Name');
            let result = await draftQueue.replaceAction(actionToReplace.id, replacingAction.id);
            expect(result.status).toBe(DraftActionStatus.Pending);
            expect(result.request.body.fields.Name).toBe('Second Name');
        });

        it('does not start queue while replacing an action', async () => {
            const network = buildMockNetworkAdapter([
                buildSuccessMockPayload(DEFAULT_PATCH_REQUEST, {}),
            ]);
            const durableStore = new MockDurableStore();
            const draftQueue = new DurableDraftQueue(
                durableStore,
                network,
                mockQueuePostHandler,
                mockDraftIdHandler
            );
            let processNextSpy = jest.fn(() => {
                return Promise.resolve(ProcessActionResult.ACTION_SUCCEEDED);
            });
            draftQueue.processNextAction = processNextSpy;
            let evictSpy = jest.fn(() => {
                // eslint-disable-next-line jest/valid-expect-in-promise
                draftQueue.startQueue().then(() => {
                    return Promise.resolve();
                });
                expect(processNextSpy).toBeCalledTimes(0);
                return Promise.resolve();
            });
            durableStore.evictEntries = evictSpy;
            const draftTag = 'UiApi::RecordRepresentation:fooId';
            const actionOne = await draftQueue.enqueue(UPDATE_REQUEST, draftTag, 'fooId');
            const actionTwo = await draftQueue.enqueue(UPDATE_REQUEST, draftTag, 'fooId');
            let actions = await draftQueue.getQueueActions();
            expect(actions.length).toBe(2);
            await draftQueue.replaceAction(actionOne.id, actionTwo.id);
            expect(processNextSpy).toBeCalledTimes(1);
            expect(draftQueue.getQueueState()).toBe(DraftQueueState.Started);
        });

        it('does not start the queue if stop is called during replace', async () => {
            const network = buildMockNetworkAdapter([]);
            const durableStore = new MockDurableStore();
            const draftQueue = new DurableDraftQueue(
                durableStore,
                network,
                mockQueuePostHandler,
                mockDraftIdHandler
            );
            let stateCallCount = 0;
            draftQueue.getQueueState = jest.fn(() => {
                // Mock the queue being started for just one call
                stateCallCount = stateCallCount + 1;
                if (stateCallCount === 1) {
                    return DraftQueueState.Started;
                } else {
                    const opaque = draftQueue as any;
                    return opaque.state;
                }
            });
            let processNextSpy = jest.fn(() => {
                return Promise.resolve(ProcessActionResult.ACTION_SUCCEEDED);
            });
            draftQueue.processNextAction = processNextSpy;
            let evictSpy = jest.fn(() => {
                // eslint-disable-next-line jest/valid-expect-in-promise
                draftQueue.stopQueue().then(() => {
                    return Promise.resolve();
                });
                expect(processNextSpy).toBeCalledTimes(0);
                return Promise.resolve();
            });
            durableStore.evictEntries = evictSpy;
            let startSpy = jest.fn(() => {
                return Promise.resolve();
            });
            const draftTag = 'UiApi::RecordRepresentation:fooId';
            const actionOne = await draftQueue.enqueue(UPDATE_REQUEST, draftTag, 'fooId');
            const actionTwo = await draftQueue.enqueue(UPDATE_REQUEST, draftTag, 'fooId');
            let actions = await draftQueue.getQueueActions();
            expect(actions.length).toBe(2);
            await draftQueue.replaceAction(actionOne.id, actionTwo.id);
            expect(processNextSpy).toBeCalledTimes(0);
            expect(startSpy).toBeCalledTimes(0);
            expect(draftQueue.getQueueState()).toBe(DraftQueueState.Started);
        });

        it('rejects if replace is called while a replace is in process', async () => {
            const success = buildSuccessMockPayload(DEFAULT_PATCH_REQUEST, {});
            const network = buildMockNetworkAdapter([success]);
            const durableStore = new MockDurableStore();
            const draftQueue = new DurableDraftQueue(
                durableStore,
                network,
                mockQueuePostHandler,
                mockDraftIdHandler
            );
            let secondReplace: Promise<DraftAction<unknown>>;
            let evictSpy = jest.fn(() => {
                secondReplace = draftQueue.replaceAction('foo', 'bar');
                return Promise.resolve();
            });
            durableStore.evictEntries = evictSpy;
            const draftTag = 'UiApi::RecordRepresentation:fooId';
            const actionOne = await draftQueue.enqueue(UPDATE_REQUEST, draftTag, 'fooId');
            const actionTwo = await draftQueue.enqueue(UPDATE_REQUEST, draftTag, 'fooId');
            let actions = await draftQueue.getQueueActions();
            expect(actions.length).toBe(2);
            await draftQueue.replaceAction(actionOne.id, actionTwo.id);
            await expect(secondReplace).rejects.toBe(
                'Cannot replace actions while a replace action is in progress'
            );
        });

        it('restarts the queue if replacing an item while in error state', async () => {
            const success = buildSuccessMockPayload(DEFAULT_PATCH_REQUEST, {});

            const network = buildMockNetworkAdapter([success]);
            const durableStore = new MockDurableStore();
            const draftQueue = new DurableDraftQueue(
                durableStore,
                network,
                mockQueuePostHandler,
                mockDraftIdHandler
            );

            const errorAction: ErrorDraftAction<unknown> = {
                id: '123456',
                targetId: 'testTargetId',
                tag: DEFAULT_TAG,
                request: DEFAULT_PATCH_REQUEST,
                timestamp: 2,
                metadata: {},
                status: DraftActionStatus.Error,
                error: 'mock error',
            };

            const pendingAction: PendingDraftAction<unknown> = {
                id: '654321',
                targetId: 'testTargetId',
                tag: DEFAULT_TAG,
                request: DEFAULT_PATCH_REQUEST,
                timestamp: 2,
                metadata: {},
                status: DraftActionStatus.Pending,
            };

            const entries: DurableStoreEntries<DraftAction<unknown>> = {
                [`${errorAction.tag}__DraftAction__${errorAction.id}`]: { data: errorAction },
                [`${pendingAction.tag}__DraftAction__${pendingAction.id}`]: { data: pendingAction },
            };

            durableStore.setEntries(entries, 'DRAFT');
            let actions = await draftQueue.getQueueActions();
            expect(actions.length).toBe(2);

            await expect(draftQueue.startQueue()).rejects.toBe(undefined);
            expect(draftQueue.getQueueState()).toEqual(DraftQueueState.Error);

            await draftQueue.replaceAction(errorAction.id, pendingAction.id);
            expect(draftQueue.getQueueState()).toEqual(DraftQueueState.Started);
        });
    });

    describe('metadata', () => {
        it('can be saved to an action', async () => {
            const network = buildMockNetworkAdapter([]);
            const durableStore = new MockDurableStore();
            const draftQueue = new DurableDraftQueue(
                durableStore,
                network,
                mockQueuePostHandler,
                mockDraftIdHandler
            );
            const draftId = 'fooId';
            let action = await draftQueue.enqueue(DEFAULT_PATCH_REQUEST, draftId, 'fooId');
            expect(ObjectKeys(action.metadata).length).toBe(0);

            const newMetadata = { foo: 'bar', anotherItem: 'anotherValue' };
            const updated = await draftQueue.setMetadata(action.id, newMetadata);
            const actions = await draftQueue.getQueueActions();
            expect(actions.length).toBe(1);
            action = actions[0];
            expect(action.metadata).toEqual(newMetadata);
            expect(action).toEqual(updated);
        });

        it('isnt overwritten by errored action', async () => {
            const request = DEFAULT_PATCH_REQUEST;
            const newMetadata = { foo: 'bar', anotherItem: 'anotherValue' };
            const network = jest.fn().mockImplementation(async () => {
                await draftQueue.setMetadata(action.id, newMetadata);
                let error = buildErrorMockPayload(request, {}, 400, 'BAD_REQUEST') as any;
                error.status = 400;
                return Promise.reject(error);
            });
            const durableStore = new MockDurableStore();
            const draftQueue = new DurableDraftQueue(
                durableStore,
                network,
                mockQueuePostHandler,
                mockDraftIdHandler
            );
            const draftId = 'fooId';
            let action = await draftQueue.enqueue(request, draftId, 'fooId');
            expect(ObjectKeys(action.metadata).length).toBe(0);
            let actions = await draftQueue.getQueueActions();
            expect(actions.length).toBe(1);
            await draftQueue.processNextAction();
            actions = await draftQueue.getQueueActions();
            expect(actions.length).toBe(1);
            action = actions[0];
            expect(action.metadata).toEqual(newMetadata);
        });

        it('rejects when setting incompatible metadata', async () => {
            const network = buildMockNetworkAdapter([]);
            const durableStore = new MockDurableStore();
            const draftQueue = new DurableDraftQueue(
                durableStore,
                network,
                mockQueuePostHandler,
                mockDraftIdHandler
            );
            const draftId = 'fooId';
            let action = await draftQueue.enqueue(DEFAULT_PATCH_REQUEST, draftId, 'fooId');
            expect(ObjectKeys(action.metadata).length).toBe(0);

            const newMetadata = { foo: ['bar', 'baz'] } as any;
            let result = draftQueue.setMetadata(action.id, newMetadata);
            await expect(result).rejects.toBe('Cannot save incompatible metadata');
        });

        it('rejects on non-existent action', async () => {
            const network = buildMockNetworkAdapter([]);
            const durableStore = new MockDurableStore();
            const draftQueue = new DurableDraftQueue(
                durableStore,
                network,
                mockQueuePostHandler,
                mockDraftIdHandler
            );
            const draftId = 'fooId';
            const newMetadata = { foo: 'bar', anotherItem: 'anotherValue' };
            const result = draftQueue.setMetadata(draftId, newMetadata);
            await expect(result).rejects.toBe('cannot save metadata to non-existent action');
        });

        it('calls listener when saving', async () => {
            const network = buildMockNetworkAdapter([]);
            const durableStore = new MockDurableStore();
            const draftQueue = new DurableDraftQueue(
                durableStore,
                network,
                mockQueuePostHandler,
                mockDraftIdHandler
            );
            const draftId = 'fooId';
            const newMetadata = { foo: 'bar', anotherItem: 'anotherValue' };
            let updatingCalled = false;
            let updatedCalled = false;
            draftQueue.registerOnChangedListener(
                (event): Promise<void> => {
                    if (event.type === DraftQueueEventType.ActionUpdating) {
                        updatingCalled = true;
                        expect(ObjectKeys(event.action.metadata).length).toBe(0);
                    } else if (event.type === DraftQueueEventType.ActionUpdated) {
                        updatedCalled = true;
                        expect(event.action.metadata).toBe(newMetadata);
                    }
                    return Promise.resolve();
                }
            );
            let action = await draftQueue.enqueue(DEFAULT_PATCH_REQUEST, draftId, draftId);
            expect(ObjectKeys(action.metadata).length).toBe(0);

            await draftQueue.setMetadata(action.id, newMetadata);
            const actions = await draftQueue.getQueueActions();
            expect(actions.length).toBe(1);
            action = actions[0];
            expect(action.metadata).toEqual(newMetadata);
            expect(updatedCalled).toBe(true);
            expect(updatingCalled).toBe(true);
        });
    });

    describe('storeOperationsForUploadedDraft', () => {
        const addQueueOperation: QueueOperation = {
            type: QueueOperationType.Add,
            action: {
                id: 'foo',
                tag: 'bar',
            } as any,
        };

        const updateQueueOperation: QueueOperation = {
            type: QueueOperationType.Update,
            action: {
                id: 'buz',
                tag: 'baz',
            } as any,
            key: 'baz__DraftAction__buz',
        };

        const deleteQueueOperation: QueueOperation = {
            type: QueueOperationType.Delete,
            key: 'one__DraftAction__1',
        };

        const evictOperation = {
            ids: ['myTag__DraftAction__100'],
            segment: 'DRAFT',
            type: 'evictEntries',
        };

        const evictOperation2 = {
            ids: ['one__DraftAction__1'],
            segment: 'DRAFT',
            type: 'evictEntries',
        };

        const setOperation = {
            entries: {
                bar__DraftAction__foo: {
                    data: { id: 'foo', tag: 'bar' },
                },
                baz__DraftAction__buz: {
                    data: { id: 'buz', tag: 'baz' },
                },
            },
            segment: 'DRAFT',
            type: 'setEntries',
        };

        const draftIdMappingOperation = {
            entries: {
                ['DraftIdMapping::draft_1::canonical_1']: {
                    data: {
                        canonicalKey: 'canonical_1',
                        draftKey: 'draft_1',
                    },
                    expiration: {
                        fresh: expect.any(Number),
                        stale: expect.any(Number),
                    },
                },
            },
            segment: 'DRAFT_ID_MAPPINGS',
            type: 'setEntries',
        };

        const createAction = { id: '100', tag: 'myTag', request: { method: 'post' } };
        const updateAction = { id: '100', tag: 'myTag', request: { method: 'patch' } };

        const setupDraftQueue = (queueOperations: QueueOperation[] = []) => {
            const durableStore = new MockDurableStore();

            const draftQueue = new DurableDraftQueue(
                durableStore,
                buildMockNetworkAdapter([]),
                jest.fn().mockReturnValue(queueOperations),
                jest.fn().mockReturnValue({ canonicalKey: 'canonical_1', draftKey: 'draft_1' })
            );

            return draftQueue;
        };

        it('produces mapping IDs and evict for create action', async () => {
            const storeOperations = setupDraftQueue().storeOperationsForUploadedDraft(
                [],
                createAction as any
            );

            expect(storeOperations).toEqual([draftIdMappingOperation, evictOperation]);
        });

        it('does not produce mapping IDs for update action', async () => {
            const storeOperations = setupDraftQueue().storeOperationsForUploadedDraft(
                [],
                updateAction as any
            );

            expect(storeOperations).toEqual([evictOperation]);
        });

        it('does not include QueueOperations for an update', async () => {
            const storeOperations = setupDraftQueue([
                addQueueOperation,
            ]).storeOperationsForUploadedDraft([], updateAction as any);

            expect(storeOperations).toEqual([evictOperation]);
        });

        it('does include QueueOperations for a create', async () => {
            const storeOperations = setupDraftQueue([
                addQueueOperation,
                updateQueueOperation,
                deleteQueueOperation,
            ]).storeOperationsForUploadedDraft([], createAction as any);

            expect(storeOperations).toEqual([
                setOperation,
                evictOperation2,
                draftIdMappingOperation,
                evictOperation,
            ]);
        });
    });
});
