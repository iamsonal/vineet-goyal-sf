import {
    DraftAction,
    DraftActionStatus,
    PendingDraftAction,
    UploadingDraftAction,
    DraftQueueState,
    ProcessActionResult,
    DraftQueueEventType,
    DraftQueueEvent,
    ErrorDraftAction,
} from '../DraftQueue';
import {
    DurableDraftQueue,
    DraftDurableSegment,
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
import { createPatchRequest, createPostRequest } from './test-utils';
import { ResourceRequest } from '@luvio/engine';
import { buildDraftDurableStoreKey } from '../utils/records';

const DEFAULT_REQUEST: ResourceRequest = {
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
const DEFAULT_TAG = 'test-tag1';

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
            const draftQueue = new DurableDraftQueue(durableStore, network);
            const state = draftQueue.getQueueState();
            expect(state).toEqual(DraftQueueState.Stopped);
        });

        it('changes when start and stop called', async () => {
            const network = buildMockNetworkAdapter([]);
            const durableStore = new MockDurableStore();
            const draftQueue = new DurableDraftQueue(durableStore, network);
            expect(draftQueue.getQueueState()).toEqual(DraftQueueState.Stopped);
            await draftQueue.startQueue();
            expect(draftQueue.getQueueState()).toEqual(DraftQueueState.Started);
        });

        it('starts a new action when added to the queue in started state', async done => {
            const network = jest.fn().mockResolvedValue({});
            const durableStore = new MockDurableStore();
            const draftQueue = new DurableDraftQueue(durableStore, network);
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

            await draftQueue.enqueue(DEFAULT_REQUEST, draftId);
        });

        it('starts a new action when one completes when in started state', async done => {
            const network = jest.fn().mockResolvedValue({});
            const durableStore = new MockDurableStore();
            const draftQueue = new DurableDraftQueue(durableStore, network);
            const listener = (event: DraftQueueEvent): Promise<void> => {
                if (event.type === DraftQueueEventType.ActionCompleted) {
                    done();
                }
                return Promise.resolve();
            };
            draftQueue.registerOnChangedListener(listener);
            const draftId = 'fooId';
            const draftIdTwo = 'barId';

            await draftQueue.enqueue(DEFAULT_REQUEST, draftId);
            await draftQueue.enqueue(DEFAULT_REQUEST, draftIdTwo);
            draftQueue.startQueue();
        });

        it('retries an item that encounteres a network error', async done => {
            const request = {
                method: 'post',
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
            const draftQueue = new DurableDraftQueue(durableStore, network);
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

            await draftQueue.enqueue(request, DEFAULT_TAG);
        });
    });

    describe('retry', () => {
        it('interval goes to zero on startQueue', async () => {
            const network = buildMockNetworkAdapter([]);
            setNetworkConnectivity(network, ConnectivityState.Offline);
            const durableStore = new MockDurableStore();
            const draftQueue = new DurableDraftQueue(durableStore, network);
            const anyDraftQueue = draftQueue as any;
            anyDraftQueue.retryIntervalMilliseconds = 10000000;
            await draftQueue.startQueue();
            expect(anyDraftQueue.retryIntervalMilliseconds).toEqual(0);
        });

        it('interval goes to zero on success', async done => {
            const createArgs: MockPayload['networkArgs'] = {
                method: 'post',
                basePath: '/blah',
            };
            const successPayload: MockPayload = buildSuccessMockPayload(createArgs, {});
            const network = buildMockNetworkAdapter([successPayload]);
            const durableStore = new MockDurableStore();
            const draftQueue = new DurableDraftQueue(durableStore, network);
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

            await draftQueue.enqueue(DEFAULT_REQUEST, draftId);
        });
    });

    describe('enqueue', () => {
        it('creates timestamp in the draft action when created', async () => {
            jest.spyOn(global.Date, 'now').mockImplementationOnce(() => {
                return 12345;
            });

            const network = buildMockNetworkAdapter([]);
            const durableStore = new MockDurableStore();
            const draftQueue = new DurableDraftQueue(durableStore, network);
            const draftId = 'fooId';

            const action = await draftQueue.enqueue(DEFAULT_REQUEST, draftId);

            expect(action.timestamp).toEqual(12345);
        });

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
        it('fetches the original timestamp from when created enqueue', async () => {
            jest.spyOn(global.Date, 'now').mockImplementationOnce(() => {
                return 12345;
            });

            const network = buildMockNetworkAdapter([]);
            const durableStore = new MockDurableStore();
            const draftQueue = new DurableDraftQueue(durableStore, network);
            setNetworkConnectivity(network, ConnectivityState.Offline);

            await draftQueue.enqueue(createPostRequest(), DEFAULT_TAG);

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

        it('action is errored but retains original timestamp', async () => {
            jest.spyOn(global.Date, 'now').mockImplementationOnce(() => {
                return 12345;
            });

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

            const { id } = await draftQueue.enqueue(request, DEFAULT_TAG);
            const result = await draftQueue.processNextAction();
            const entryId = buildDraftDurableStoreKey(DEFAULT_TAG, id);

            expect(result).toEqual(ProcessActionResult.ACTION_ERRORED);
            const draft = await durableStore.getEntries([entryId], DraftDurableSegment);
            expect(draft[entryId]).toMatchObject({
                data: { timestamp: 12345 },
            });
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

    describe('queue change listener', () => {
        it('is called when item added', async () => {
            const network = buildMockNetworkAdapter([]);
            const durableStore = new MockDurableStore();
            const draftQueue = new DurableDraftQueue(durableStore, network);
            const listener = jest.fn();
            draftQueue.registerOnChangedListener(listener);
            const draftId = 'fooId';
            await draftQueue.enqueue(DEFAULT_REQUEST, draftId);
            expect(listener).toBeCalledTimes(2);
            expect(listener.mock.calls[0][0].type).toBe(DraftQueueEventType.ActionAdding);
            expect(listener.mock.calls[1][0].type).toBe(DraftQueueEventType.ActionAdded);
        });

        it('is called when item removed', async () => {
            const network = buildMockNetworkAdapter([]);
            const durableStore = new MockDurableStore();
            const draftQueue = new DurableDraftQueue(durableStore, network);
            const draftAction = await draftQueue.enqueue(DEFAULT_REQUEST, DEFAULT_TAG);

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
            const draftQueue = new DurableDraftQueue(durableStore, network);
            const listener = jest.fn();
            draftQueue.registerOnChangedListener(listener);
            const firstRequest = { ...DEFAULT_REQUEST, basePath: '/z' };
            await draftQueue.enqueue(firstRequest, 'z');
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
            const draftQueue = new DurableDraftQueue(durableStore, network);
            draftQueue.registerOnChangedListener(completedSpy);
            const firstRequest = { ...DEFAULT_REQUEST, basePath: '/z' };
            await draftQueue.enqueue(firstRequest, 'z');
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
        const baseAction = {
            id: '123456',
            tag: 'testActionTag',
            request: DEFAULT_REQUEST,
            timestamp: 2,
        };

        const setup = (testAction: DraftAction<unknown> | undefined = undefined) => {
            const durableStore = new MockDurableStore();
            const evictSpy = jest.spyOn(durableStore, 'evictEntries');

            const draftQueue = new DurableDraftQueue(durableStore, buildMockNetworkAdapter([]));

            if (testAction !== undefined) {
                durableStore.segments[DraftDurableSegment] = {
                    [testAction.id]: { data: testAction },
                };
            }

            return { draftQueue, evictSpy };
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

            const { draftQueue } = setup(testAction);
            await expect(draftQueue.removeDraftAction(testAction.id)).rejects.toThrowError(
                'Cannot remove an uploading draft action with ID 123456'
            );
        });

        it('calls evict entries with correct durable store key', async () => {
            const testAction: PendingDraftAction<unknown> = {
                ...baseAction,
                status: DraftActionStatus.Pending,
            };

            const { draftQueue, evictSpy } = setup(testAction);
            await draftQueue.removeDraftAction(testAction.id);
            expect(evictSpy).toBeCalledWith(['testActionTag__DraftAction__123456'], 'DRAFT');
        });
    });

    describe('swap action', () => {
        it('swaps correctly', async () => {
            const network = buildMockNetworkAdapter([]);
            const durableStore = new MockDurableStore();
            const draftQueue = new DurableDraftQueue(durableStore, network);
            const draftTag = 'UiAPI::RecordRepresentation::fooId';
            const actionOne = await draftQueue.enqueue(UPDATE_REQUEST, draftTag);
            const actionTwo = await draftQueue.enqueue(UPDATE_REQUEST, draftTag);
            let actions = await draftQueue.getQueueActions();
            expect(actions.length).toBe(2);
            await draftQueue.replaceAction(actionOne.id, actionTwo.id);
            actions = await draftQueue.getQueueActions();
            expect(actions.length).toBe(1);
            const action = actions[0];
            expect(action.id).toBe(actionOne.id);
        });

        it('calls listeners when swapping', async () => {
            const network = buildMockNetworkAdapter([]);
            const durableStore = new MockDurableStore();
            const draftQueue = new DurableDraftQueue(durableStore, network);
            const draftTag = 'UiAPI::RecordRepresentation::fooId';
            const actionOne = await draftQueue.enqueue(UPDATE_REQUEST, draftTag);
            let secondUpdate = UPDATE_REQUEST;
            secondUpdate.baseUri = 'secondTestURI';
            const actionTwo = await draftQueue.enqueue(secondUpdate, draftTag);
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
        });

        it('rejects on equal draft action ids', async () => {
            const network = buildMockNetworkAdapter([]);
            const durableStore = new MockDurableStore();
            const draftQueue = new DurableDraftQueue(durableStore, network);
            const draftTag = 'UiAPI::RecordRepresentation::fooId';
            const actionOne = await draftQueue.enqueue(UPDATE_REQUEST, draftTag);
            await draftQueue.enqueue(UPDATE_REQUEST, draftTag);
            let actions = await draftQueue.getQueueActions();
            expect(actions.length).toBe(2);
            let result = draftQueue.replaceAction(actionOne.id, actionOne.id);
            await expect(result).rejects.toBe('Swapped and swapping action ids cannot be the same');
        });
        it('rejects on non-existent draft', async () => {
            const network = buildMockNetworkAdapter([]);
            const durableStore = new MockDurableStore();
            const draftQueue = new DurableDraftQueue(durableStore, network);
            const draftTag = 'UiAPI::RecordRepresentation::fooId';
            const actionOne = await draftQueue.enqueue(UPDATE_REQUEST, draftTag);
            const result = draftQueue.replaceAction(actionOne.id, 'blah');
            await expect(result).rejects.toBe('One or both actions does not exist');
        });

        it('rejects on non-matching target ids', async () => {
            const network = buildMockNetworkAdapter([]);
            const durableStore = new MockDurableStore();
            const draftQueue = new DurableDraftQueue(durableStore, network);
            const draftTag = 'UiAPI::RecordRepresentation::fooId';
            const draftTagTwo = 'UiAPI::RecordRepresentation::barId';
            const actionOne = await draftQueue.enqueue(UPDATE_REQUEST, draftTag);
            const actionTwo = await draftQueue.enqueue(UPDATE_REQUEST, draftTagTwo);
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
            const inProgressAction: UploadingDraftAction<unknown> = {
                id: firstId,
                status: DraftActionStatus.Uploading,
                request: createPatchRequest(),
                tag: 'UiAPI::RecordRepresentation::fooId',
                timestamp: Date.now(),
            };
            const firstEntry: DurableStoreEntry = { data: inProgressAction };
            const pendingAction: PendingDraftAction<unknown> = {
                id: secondId,
                status: DraftActionStatus.Pending,
                request: createPatchRequest(),
                tag: 'UiAPI::RecordRepresentation::fooId',
                timestamp: Date.now(),
            };
            const secondEntry: DurableStoreEntry = { data: pendingAction };
            let entries: DurableStoreEntries = { [firstDurableId]: firstEntry };
            await durableStore.setEntries(entries, DraftDurableSegment);
            entries = { [secondDurableId]: secondEntry };
            await durableStore.setEntries(entries, DraftDurableSegment);

            const draftQueue = new DurableDraftQueue(durableStore, network);
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
                status: DraftActionStatus.Pending,
                request: createPatchRequest(),
                tag: 'UiAPI::RecordRepresentation::fooId',
                timestamp: Date.now(),
            };
            const firstEntry: DurableStoreEntry = { data: pendingAction };
            const nonPendingAction: ErrorDraftAction<unknown> = {
                id: secondId,
                status: DraftActionStatus.Error,
                request: createPatchRequest(),
                tag: 'UiAPI::RecordRepresentation::fooId',
                timestamp: Date.now(),
                error: {},
            };
            const secondEntry: DurableStoreEntry = { data: nonPendingAction };
            let entries: DurableStoreEntries = { [firstDurableId]: firstEntry };
            await durableStore.setEntries(entries, DraftDurableSegment);
            entries = { [secondDurableId]: secondEntry };
            await durableStore.setEntries(entries, DraftDurableSegment);

            const draftQueue = new DurableDraftQueue(durableStore, network);
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
                status: DraftActionStatus.Error,
                request: createPatchRequest(),
                tag: 'UiAPI::RecordRepresentation::fooId',
                timestamp: Date.now(),
                error: {},
            };
            const firstEntry: DurableStoreEntry = { data: inProgressAction };
            let secondPatchRequest = createPatchRequest();
            secondPatchRequest.body.fields.Name = 'Second Name';
            const pendingAction: PendingDraftAction<unknown> = {
                id: secondId,
                status: DraftActionStatus.Pending,
                request: secondPatchRequest,
                tag: 'UiAPI::RecordRepresentation::fooId',
                timestamp: Date.now(),
            };
            const secondEntry: DurableStoreEntry = { data: pendingAction };
            let entries: DurableStoreEntries = { [firstDurableId]: firstEntry };
            await durableStore.setEntries(entries, DraftDurableSegment);
            entries = { [secondDurableId]: secondEntry };
            await durableStore.setEntries(entries, DraftDurableSegment);

            const draftQueue = new DurableDraftQueue(durableStore, network);
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
            const network = buildMockNetworkAdapter([]);
            const durableStore = new MockDurableStore();
            const draftQueue = new DurableDraftQueue(durableStore, network);
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
            const draftTag = 'UiAPI::RecordRepresentation::fooId';
            const actionOne = await draftQueue.enqueue(UPDATE_REQUEST, draftTag);
            const actionTwo = await draftQueue.enqueue(UPDATE_REQUEST, draftTag);
            let actions = await draftQueue.getQueueActions();
            expect(actions.length).toBe(2);
            await draftQueue.replaceAction(actionOne.id, actionTwo.id);
            expect(processNextSpy).toBeCalledTimes(1);
            expect(draftQueue.getQueueState()).toBe(DraftQueueState.Started);
        });

        it('does not start the queue if stop is called during replace', async () => {
            const network = buildMockNetworkAdapter([]);
            const durableStore = new MockDurableStore();
            const draftQueue = new DurableDraftQueue(durableStore, network);
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
            const draftTag = 'UiAPI::RecordRepresentation::fooId';
            const actionOne = await draftQueue.enqueue(UPDATE_REQUEST, draftTag);
            const actionTwo = await draftQueue.enqueue(UPDATE_REQUEST, draftTag);
            let actions = await draftQueue.getQueueActions();
            expect(actions.length).toBe(2);
            await draftQueue.replaceAction(actionOne.id, actionTwo.id);
            expect(processNextSpy).toBeCalledTimes(0);
            expect(startSpy).toBeCalledTimes(0);
            expect(draftQueue.getQueueState()).toBe(DraftQueueState.Stopped);
        });

        it('rejects if replace is called while a replace is in process', async () => {
            const network = buildMockNetworkAdapter([]);
            const durableStore = new MockDurableStore();
            const draftQueue = new DurableDraftQueue(durableStore, network);
            let secondReplace: Promise<DraftAction<unknown>>;
            let evictSpy = jest.fn(() => {
                secondReplace = draftQueue.replaceAction('foo', 'bar');
                return Promise.resolve();
            });
            durableStore.evictEntries = evictSpy;
            const draftTag = 'UiAPI::RecordRepresentation::fooId';
            const actionOne = await draftQueue.enqueue(UPDATE_REQUEST, draftTag);
            const actionTwo = await draftQueue.enqueue(UPDATE_REQUEST, draftTag);
            let actions = await draftQueue.getQueueActions();
            expect(actions.length).toBe(2);
            await draftQueue.replaceAction(actionOne.id, actionTwo.id);
            await expect(secondReplace).rejects.toBe(
                'Cannot replace actions while a replace action is in progress'
            );
        });
    });
});
