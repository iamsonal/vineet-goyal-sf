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
    setMockNetworkPayloads,
} from '@luvio/adapter-test-library';
import { ObjectKeys } from '../utils/language';
import { createPatchRequest, createPostRequest, flushPromises, RECORD_ID } from './test-utils';
import { ResourceRequest } from '@luvio/engine';
import { getRecordIdFromRecordRequest, getRecordKeyFromRecordRequest } from '../utils/records';
import {
    LDS_ACTION_HANDLER_ID,
    LDS_ACTION_METADATA_API_NAME,
} from '../actionHandlers/LDSActionHandler';
import { ActionHandler } from '../actionHandlers/ActionHandler';
import {
    CustomActionExecutor,
    CustomActionResult,
    CustomActionResultType,
} from '../actionHandlers/CustomActionHandler';
import { DurableDraftStore } from '../DurableDraftStore';

const MockHandler: ActionHandler<string> = {
    buildPendingAction: jest.fn(),
    handle: jest.fn(),
    replaceAction: jest.fn(),
    queueOperationsForCompletedDraft: jest.fn(),
    getRedirectMapping: jest.fn(),
};

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
            const draftStore = new DurableDraftStore(durableStore);
            const draftQueue = new DurableDraftQueue(draftStore, network, mockQueuePostHandler);

            const state = draftQueue.getQueueState();
            expect(state).toEqual(DraftQueueState.Stopped);
        });

        it('changes when start and stop called', async () => {
            const network = buildMockNetworkAdapter([]);
            const durableStore = new MockDurableStore();
            const draftStore = new DurableDraftStore(durableStore);
            const draftQueue = new DurableDraftQueue(draftStore, network, mockQueuePostHandler);
            expect(draftQueue.getQueueState()).toEqual(DraftQueueState.Stopped);
            await draftQueue.startQueue();
            expect(draftQueue.getQueueState()).toEqual(DraftQueueState.Started);
        });

        it('starts a new action when added to the queue in started state', async (done) => {
            const network = jest.fn().mockResolvedValue({});
            const durableStore = new MockDurableStore();
            const draftStore = new DurableDraftStore(durableStore);
            const draftQueue = new DurableDraftQueue(draftStore, network, mockQueuePostHandler);
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

            await draftQueue.enqueue({
                data: DEFAULT_PATCH_REQUEST,
                tag: draftId,
                targetId: draftId,
                targetApiName: 'Account',
                handler: LDS_ACTION_HANDLER_ID,
            });
        });

        it('starts a new action when one completes when in started state', async (done) => {
            const network = jest.fn().mockResolvedValue({});
            const durableStore = new MockDurableStore();
            const draftStore = new DurableDraftStore(durableStore);
            const draftQueue = new DurableDraftQueue(draftStore, network, mockQueuePostHandler);
            const listener = (event: DraftQueueEvent): Promise<void> => {
                if (event.type === DraftQueueEventType.ActionCompleted) {
                    done();
                }
                return Promise.resolve();
            };
            draftQueue.registerOnChangedListener(listener);
            const draftId = 'fooId';
            const draftIdTwo = 'barId';

            await draftQueue.enqueue({
                data: DEFAULT_PATCH_REQUEST,
                tag: draftId,
                targetId: draftId,
                targetApiName: 'Account',
                handler: LDS_ACTION_HANDLER_ID,
            });
            await draftQueue.enqueue({
                data: DEFAULT_PATCH_REQUEST,
                tag: draftIdTwo,
                targetId: draftId,
                targetApiName: 'Account',
                handler: LDS_ACTION_HANDLER_ID,
            });
            draftQueue.startQueue();
        });

        it('retries an item that encounteres a network error', async (done) => {
            const request = {
                method: 'patch',
                basePath: '/blah',
                baseUri: 'blahuri',
                body: null,
                queryParams: {},
                urlParams: {},
                headers: {},
            };

            const args: MockPayload['networkArgs'] = {
                method: 'patch',
                basePath: '/blah',
            };
            const successPayload: MockPayload = buildSuccessMockPayload(args, {});

            const network = buildMockNetworkAdapter([successPayload]);
            setNetworkConnectivity(network, ConnectivityState.Offline);
            const durableStore = new MockDurableStore();
            const draftStore = new DurableDraftStore(durableStore);
            const draftQueue = new DurableDraftQueue(draftStore, network, mockQueuePostHandler);
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

            await draftQueue.enqueue({
                data: request,
                tag: DEFAULT_TAG,
                targetId: 'targetId',
                targetApiName: 'Account',
                handler: LDS_ACTION_HANDLER_ID,
            });
        });
    });

    describe('retry', () => {
        it('interval goes to zero on startQueue', async () => {
            const network = buildMockNetworkAdapter([]);
            setNetworkConnectivity(network, ConnectivityState.Offline);
            const durableStore = new MockDurableStore();
            const draftStore = new DurableDraftStore(durableStore);
            const draftQueue = new DurableDraftQueue(draftStore, network, mockQueuePostHandler);
            const anyDraftQueue = draftQueue as any;
            anyDraftQueue.retryIntervalMilliseconds = 10000000;
            await draftQueue.startQueue();
            expect(anyDraftQueue.retryIntervalMilliseconds).toEqual(0);
        });

        it('interval goes to zero on success', async (done) => {
            const createArgs: MockPayload['networkArgs'] = {
                method: 'patch',
                basePath: '/blah',
            };
            const successPayload: MockPayload = buildSuccessMockPayload(createArgs, {});
            const network = buildMockNetworkAdapter([successPayload]);
            const durableStore = new MockDurableStore();
            const draftStore = new DurableDraftStore(durableStore);
            const draftQueue = new DurableDraftQueue(draftStore, network, mockQueuePostHandler);
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

            await draftQueue.enqueue({
                data: DEFAULT_PATCH_REQUEST,
                tag: draftId,
                targetId: draftId,
                targetApiName: 'Account',
                handler: LDS_ACTION_HANDLER_ID,
            });
        });
    });

    describe('addHandler', () => {
        let draftQueue: DurableDraftQueue;

        beforeEach(() => {
            const network = buildMockNetworkAdapter([]);
            const durableStore = new MockDurableStore();
            const draftStore = new DurableDraftStore(durableStore);
            draftQueue = new DurableDraftQueue(draftStore, network, mockQueuePostHandler);
        });

        it('it adds a handler', async () => {
            await draftQueue.addHandler('123', MockHandler);

            const subject = (draftQueue as any).handlers;
            expect(ObjectKeys(subject).length).toBe(2);
            expect(subject['123']).toBe(MockHandler);
        });

        it('throws if handler already exists', async () => {
            await draftQueue.addHandler('123', MockHandler);
            await expect(draftQueue.addHandler('123', MockHandler)).rejects.toBe(
                'Unable to add handler to id: 123 because it already exists.'
            );
        });
    });

    describe('removeHandler', () => {
        let draftQueue: DurableDraftQueue;

        beforeEach(() => {
            const network = buildMockNetworkAdapter([]);
            const durableStore = new MockDurableStore();
            const draftStore = new DurableDraftStore(durableStore);
            draftQueue = new DurableDraftQueue(draftStore, network, mockQueuePostHandler);
        });

        it('removes handler if it exists', async () => {
            await draftQueue.addHandler('123', MockHandler);
            expect(ObjectKeys((draftQueue as any).handlers).length).toBe(2);

            await draftQueue.removeHandler('123');
            expect(ObjectKeys((draftQueue as any).handlers).length).toBe(1);
        });

        it('does nothing if handler doesnt exist', async () => {
            expect(ObjectKeys((draftQueue as any).handlers).length).toBe(1);
            await draftQueue.removeHandler('123');
            expect(ObjectKeys((draftQueue as any).handlers).length).toBe(1);
        });
    });

    describe('addCustomHandler', () => {
        let draftQueue: DurableDraftQueue;

        beforeEach(() => {
            const network = buildMockNetworkAdapter([]);
            const durableStore = new MockDurableStore();
            const draftStore = new DurableDraftStore(durableStore);
            draftQueue = new DurableDraftQueue(draftStore, network, mockQueuePostHandler);
        });

        it('adds custom handler to handlers', async () => {
            const callback: CustomActionExecutor = (
                _action: DraftAction<unknown, unknown>,
                _completed: (result: CustomActionResult) => void
            ) => {};

            expect(ObjectKeys((draftQueue as any).handlers).length).toBe(1);
            await draftQueue.addCustomHandler('custom', callback);
            expect(ObjectKeys((draftQueue as any).handlers).length).toBe(2);
            await draftQueue.addCustomHandler('custom2', callback);
            expect(ObjectKeys((draftQueue as any).handlers).length).toBe(3);
        });

        it('rejects if handler id already exists', async () => {
            const callback: CustomActionExecutor = (
                _action: DraftAction<unknown, unknown>,
                _completed: (result: CustomActionResult) => void
            ) => {};

            expect(ObjectKeys((draftQueue as any).handlers).length).toBe(1);
            await draftQueue.addCustomHandler('custom', callback);
            expect(ObjectKeys((draftQueue as any).handlers).length).toBe(2);
            await expect(draftQueue.addCustomHandler('custom', callback)).rejects.toBe(
                'Unable to add handler to id: custom because it already exists.'
            );
            expect(ObjectKeys((draftQueue as any).handlers).length).toBe(2);
        });

        it('gets a callback', async () => {
            const myAction: PendingDraftAction<unknown, unknown> = {
                data: undefined,
                handler: 'custom',
                id: '1234',
                metadata: {},
                status: DraftActionStatus.Pending,
                tag: '1234',
                targetId: '1234',
                timestamp: Date.now(),
            };

            const callback: CustomActionExecutor = (
                action: DraftAction<unknown, unknown>,
                completed: (result: CustomActionResult) => void
            ) => {
                expect(action).toBe(myAction);
                completed({
                    id: '1234',
                    type: CustomActionResultType.SUCCESS,
                });
            };

            await draftQueue.addCustomHandler('custom', callback);
            callback(myAction, (result) => {
                expect(result).toStrictEqual({
                    id: '1234',
                    type: CustomActionResultType.SUCCESS,
                });
            });
        });
    });

    describe('enqueue', () => {
        it('throws error if no handler exists for action', async () => {
            const network = buildMockNetworkAdapter([]);
            const durableStore = new MockDurableStore();
            const draftStore = new DurableDraftStore(durableStore);
            const draftQueue = new DurableDraftQueue(draftStore, network, mockQueuePostHandler);
            await expect(
                draftQueue.enqueue({
                    data: {},
                    tag: 'fooId',
                    targetId: 'fooId',
                    targetApiName: 'Account',
                    handler: 'unknown',
                })
            ).rejects.toBe('No handler for unknown');
        });

        it('creates timestamp in the draft action when created', async () => {
            jest.spyOn(global.Date, 'now').mockImplementationOnce(() => {
                return 12345;
            });

            const network = buildMockNetworkAdapter([]);
            const durableStore = new MockDurableStore();
            const draftStore = new DurableDraftStore(durableStore);
            const draftQueue = new DurableDraftQueue(draftStore, network, mockQueuePostHandler);
            const draftId = 'fooId';

            const action = await draftQueue.enqueue({
                data: DEFAULT_PATCH_REQUEST,
                tag: draftId,
                targetId: draftId,
                targetApiName: 'Account',
                handler: LDS_ACTION_HANDLER_ID,
            });

            expect(action.timestamp).toEqual(12345);
        });

        it('cannot create post action on record that already exists', async () => {
            const network = buildMockNetworkAdapter([]);
            const durableStore = new MockDurableStore();
            const draftStore = new DurableDraftStore(durableStore);
            const draftQueue = new DurableDraftQueue(draftStore, network, mockQueuePostHandler);
            const draftId = 'fooId';

            await draftQueue.enqueue({
                data: DEFAULT_POST_REQUEST,
                tag: draftId,
                targetId: draftId,
                targetApiName: 'Account',
                handler: LDS_ACTION_HANDLER_ID,
            });

            await expect(
                draftQueue.enqueue({
                    data: DEFAULT_POST_REQUEST,
                    tag: draftId,
                    targetId: draftId,
                    targetApiName: 'Account',
                    handler: LDS_ACTION_HANDLER_ID,
                })
            ).rejects.toThrowError('Cannot enqueue a POST draft action with an existing tag');
        });
        it('cannot publish draft action after a delete action is added', async () => {
            const network = buildMockNetworkAdapter([]);
            const durableStore = new MockDurableStore();
            const draftStore = new DurableDraftStore(durableStore);
            const draftQueue = new DurableDraftQueue(draftStore, network, mockQueuePostHandler);
            const draftId = 'fooId';

            await draftQueue.enqueue({
                data: {
                    method: 'post',
                    basePath: 'blah',
                    baseUri: 'blahuri',
                    body: null,
                    queryParams: {},
                    urlParams: {},
                    headers: {},
                },
                tag: draftId,
                targetId: draftId,
                targetApiName: 'Account',
                handler: LDS_ACTION_HANDLER_ID,
            });

            await draftQueue.enqueue({
                data: {
                    method: 'delete',
                    basePath: 'blah',
                    baseUri: 'blahuri',
                    body: null,
                    queryParams: {},
                    urlParams: {},
                    headers: {},
                },
                tag: draftId,
                targetId: draftId,
                targetApiName: 'Account',
                handler: LDS_ACTION_HANDLER_ID,
            });

            await expect(
                draftQueue.enqueue({
                    data: {
                        method: 'patch',
                        basePath: 'blah',
                        baseUri: 'blahuri',
                        body: null,
                        queryParams: {},
                        urlParams: {},
                        headers: {},
                    },
                    tag: draftId,
                    targetId: draftId,
                    targetApiName: 'Account',
                    handler: LDS_ACTION_HANDLER_ID,
                })
            ).rejects.toThrowError('Cannot enqueue a draft action for a deleted record');
        });

        it('calls the draft store when enqueuing', async () => {
            const network = buildMockNetworkAdapter([]);
            const durableStore = new MockDurableStore();
            const draftStore = new DurableDraftStore(durableStore);
            const draftQueue = new DurableDraftQueue(draftStore, network, mockQueuePostHandler);

            await draftQueue.enqueue({
                data: createPatchRequest(),
                tag: DEFAULT_TAG,
                targetId: 'targetId',
                targetApiName: 'Account',
                handler: LDS_ACTION_HANDLER_ID,
            });
            const allEntries = await draftStore.getAllDrafts();
            expect(ObjectKeys(allEntries).length).toEqual(1);
        });

        it('creates two draft actions when editing the same record', async () => {
            const network = buildMockNetworkAdapter([]);
            const durableStore = new MockDurableStore();
            const draftStore = new DurableDraftStore(durableStore);
            const draftQueue = new DurableDraftQueue(draftStore, network, mockQueuePostHandler);

            await draftQueue.enqueue({
                data: createPatchRequest(),
                tag: DEFAULT_TAG,
                targetId: 'targetId',
                targetApiName: 'Account',
                handler: LDS_ACTION_HANDLER_ID,
            });
            const secondPatch = createPatchRequest();
            secondPatch.body.fields.Name = 'Acme 2';
            await draftQueue.enqueue({
                data: secondPatch,
                tag: DEFAULT_TAG,
                targetId: 'targetId',
                targetApiName: 'Account',
                handler: LDS_ACTION_HANDLER_ID,
            });
            const allEntries = await draftStore.getAllDrafts();
            expect(ObjectKeys(allEntries).length).toEqual(2);

            const allActions = await draftQueue.getActionsForTags({ [DEFAULT_TAG]: true });
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
            const draftStore = new DurableDraftStore(durableStore);
            const draftQueue = new DurableDraftQueue(draftStore, network, mockQueuePostHandler);
            const request = createPatchRequest();
            const tag = getRecordKeyFromRecordRequest(request);
            const targetId = getRecordIdFromRecordRequest(request);

            const action = await draftQueue.enqueue({
                data: request,
                tag,
                targetId,
                targetApiName: 'Account',
                handler: LDS_ACTION_HANDLER_ID,
            });

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
            const draftStore = new DurableDraftStore(durableStore);
            const draftQueue = new DurableDraftQueue(draftStore, network, mockQueuePostHandler);
            setNetworkConnectivity(network, ConnectivityState.Offline);

            await draftQueue.enqueue({
                data: createPostRequest(),
                tag: DEFAULT_TAG,
                targetId: 'targetId',
                targetApiName: 'Account',
                handler: LDS_ACTION_HANDLER_ID,
            });

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
            const draftStore = new DurableDraftStore(durableStore);
            const draftQueue = new DurableDraftQueue(draftStore, network, mockQueuePostHandler);
            setNetworkConnectivity(network, ConnectivityState.Offline);

            await draftQueue.enqueue({
                data: createPostRequest(),
                tag: DEFAULT_TAG,
                targetId: 'targetId',
                targetApiName: 'Account',
                handler: LDS_ACTION_HANDLER_ID,
            });
            await draftQueue.enqueue({
                data: createPostRequest(),
                tag: 'testTagTwo',
                targetId: 'targetIdTwo',
                targetApiName: 'Account',
                handler: LDS_ACTION_HANDLER_ID,
            });

            const actions = await draftQueue.getActionsForTags({
                [DEFAULT_TAG]: true,
                testTagTwo: true,
            });
            expect(actions['testTagTwo'].length).toEqual(1);
            expect(actions[DEFAULT_TAG].length).toEqual(1);
        });

        it('rehydrates queue from draft store', async () => {
            const network = buildMockNetworkAdapter([]);
            const durableStore = new MockDurableStore();
            const draftStore = new DurableDraftStore(durableStore);
            const draftQueue = new DurableDraftQueue(draftStore, network, mockQueuePostHandler);

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
            } as any;
            await draftStore.writeAction(testAction);

            const actions = await draftQueue.getActionsForTags({ testActionTag: true });
            expect(actions['testActionTag'][0]).toStrictEqual(testAction);
        });

        it('sorts draft actions into correct order', async () => {
            const network = buildMockNetworkAdapter([]);
            const durableStore = new MockDurableStore();
            const draftStore = new DurableDraftStore(durableStore);
            const draftQueue = new DurableDraftQueue(draftStore, network, mockQueuePostHandler);

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
            } as any;
            const testActionTwo = {
                id: 123457,
                status: DraftActionStatus.Pending,
                tag: 'testActionTag',
                request,
                data: {},
            } as any;
            draftStore.writeAction(testAction);
            draftStore.writeAction(testActionTwo);

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
            const draftStore = new DurableDraftStore(durableStore);
            const draftQueue = new DurableDraftQueue(draftStore, network, mockQueuePostHandler);

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
            const draftStore = new DurableDraftStore(durableStore);
            const batchOperationsSpy = jest.spyOn(durableStore, 'batchOperations');

            const draftQueue = new DurableDraftQueue(draftStore, network, mockQueuePostHandler);
            await draftQueue.enqueue({
                data: DEFAULT_PATCH_REQUEST,
                tag: DEFAULT_TAG,
                targetId: 'targetId',
                targetApiName: 'Account',
                handler: LDS_ACTION_HANDLER_ID,
            });

            const allDrafts = await draftStore.getAllDrafts();
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

        it('successful action calls draft store when completed and passes queue operations and mapping', async () => {
            const createArgs: MockPayload['networkArgs'] = {
                method: 'post',
                basePath: '/blah',
            };
            const successPayload: MockPayload = buildSuccessMockPayload(createArgs, {
                id: 'bar',
            });
            const network = buildMockNetworkAdapter([successPayload]);
            const durableStore = new MockDurableStore();
            const draftStore = new DurableDraftStore(durableStore);
            draftStore.completeAction = jest.fn();

            const mockQueueOperations: QueueOperation[] = [];

            const draftQueue = new DurableDraftQueue(
                draftStore,
                network,
                jest.fn().mockReturnValue(mockQueueOperations)
            );
            const enqueued = await draftQueue.enqueue({
                data: DEFAULT_POST_REQUEST,
                tag: DEFAULT_TAG,
                targetId: 'foo',
                targetApiName: 'Account',
                handler: LDS_ACTION_HANDLER_ID,
            });
            const result = await draftQueue.processNextAction();
            expect(result).toEqual(ProcessActionResult.ACTION_SUCCEEDED);
            expect(draftStore.completeAction).toBeCalledWith(
                [{ type: 'delete', id: enqueued.id }],
                { draftId: 'foo', canonicalId: 'bar' }
            );
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
            const draftStore = new DurableDraftStore(durableStore);
            draftQueue = new DurableDraftQueue(draftStore, mockNetwork, mockQueuePostHandler);
            await draftQueue.enqueue({
                data: DEFAULT_PATCH_REQUEST,
                tag: DEFAULT_TAG,
                targetId: 'targetId',
                targetApiName: 'Account',
                handler: LDS_ACTION_HANDLER_ID,
            });

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
            const draftStore = new DurableDraftStore(durableStore);
            const draftQueue = new DurableDraftQueue(draftStore, network, mockQueuePostHandler);

            await draftQueue.enqueue({
                data: request,
                tag: DEFAULT_TAG,
                targetId: 'targetId',
                targetApiName: 'Account',
                handler: LDS_ACTION_HANDLER_ID,
            });
            const result = await draftQueue.processNextAction();

            expect(result).toEqual(ProcessActionResult.ACTION_ERRORED);
            let allDrafts = await draftStore.getAllDrafts();
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
            const draftStore = new DurableDraftStore(durableStore);
            const draftQueue = new DurableDraftQueue(draftStore, network, mockQueuePostHandler);

            await draftQueue.enqueue({
                data: request,
                tag: DEFAULT_TAG,
                targetId: 'targetId',
                targetApiName: 'Account',
                handler: LDS_ACTION_HANDLER_ID,
            });
            const result = await draftQueue.processNextAction();

            expect(result).toEqual(ProcessActionResult.ACTION_ERRORED);
            const drafts = await draftStore.getAllDrafts();
            expect(drafts[0]).toMatchObject({ timestamp: 12345 });
        });

        it('network error puts action back in pending', async () => {
            const args: MockPayload['networkArgs'] = {
                method: 'patch',
                basePath: '/blah',
            };
            const successPayload: MockPayload = buildSuccessMockPayload(args, {});
            const network = buildMockNetworkAdapter([successPayload]);
            setNetworkConnectivity(network, ConnectivityState.Offline);
            const durableStore = new MockDurableStore();
            const draftStore = new DurableDraftStore(durableStore);
            const draftQueue = new DurableDraftQueue(draftStore, network, mockQueuePostHandler);

            const action1 = await draftQueue.enqueue({
                data: DEFAULT_PATCH_REQUEST,
                tag: 'tag1',
                targetId: 'targetIdOne',
                targetApiName: 'Account',
                handler: LDS_ACTION_HANDLER_ID,
            });
            // put a couple more actions in the queue to ensure ordering is maintained
            await draftQueue.enqueue({
                data: DEFAULT_PATCH_REQUEST,
                tag: 'tag2',
                targetId: 'targetIdTwo',
                targetApiName: 'Account',
                handler: LDS_ACTION_HANDLER_ID,
            });
            await draftQueue.enqueue({
                data: DEFAULT_PATCH_REQUEST,
                tag: 'tag3',
                targetId: 'targetIdThree',
                targetApiName: 'Account',
                handler: LDS_ACTION_HANDLER_ID,
            });

            const result = await draftQueue.processNextAction();

            expect(result).toEqual(ProcessActionResult.NETWORK_ERROR);

            const allDrafts = await draftStore.getAllDrafts();
            expect(allDrafts.length).toEqual(3);
            const action = allDrafts[0];
            expect(action.status).toEqual(DraftActionStatus.Pending);
            expect(action).toEqual(action1);

            setNetworkConnectivity(network, ConnectivityState.Online);
        });

        it('processes actions in the right order', async () => {
            const network = jest.fn().mockResolvedValue({});
            const durableStore = new MockDurableStore();
            const draftStore = new DurableDraftStore(durableStore);
            const draftQueue = new DurableDraftQueue(draftStore, network, mockQueuePostHandler);

            const firstRequest = { ...DEFAULT_PATCH_REQUEST, basePath: '/z' };
            const secondRequest = { ...DEFAULT_PATCH_REQUEST, basePath: '/a' };
            await draftQueue.enqueue({
                data: firstRequest,
                tag: 'z',
                targetId: 'targetIdOne',
                targetApiName: 'Account',
                handler: LDS_ACTION_HANDLER_ID,
            });
            await draftQueue.enqueue({
                data: secondRequest,
                tag: 'a',
                targetId: 'targetIdTwo',
                targetApiName: 'Account',
                handler: LDS_ACTION_HANDLER_ID,
            });

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
                const draftStore = new DurableDraftStore(durableStore);

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
                    id: 'buz',
                });

                const draftQueue = new DurableDraftQueue(
                    draftStore,
                    network,
                    jest.fn().mockReturnValue(mockQueueOperations)
                );
                await draftQueue.enqueue({
                    data: DEFAULT_POST_REQUEST,
                    tag: DEFAULT_TAG,
                    targetId: 'fooId',
                    targetApiName: 'Account',
                    handler: LDS_ACTION_HANDLER_ID,
                });
                const result = await draftQueue.processNextAction();
                expect(result).toEqual(ProcessActionResult.ACTION_SUCCEEDED);
                const drafts = await draftStore.getAllDrafts();
                expect(drafts.length).toBe(2);
                expect(drafts).toEqual([
                    {
                        id: 'foo',
                        tag: 'bar',
                    },
                    {
                        id: 'buz',
                        tag: 'baz',
                    },
                ]);
            });

            it('inserts draft mapping', async () => {
                const createArgs: MockPayload['networkArgs'] = {
                    method: 'post',
                    basePath: '/blah',
                };
                const successPayload: MockPayload = buildSuccessMockPayload(createArgs, {
                    id: 'bar',
                });
                const network = buildMockNetworkAdapter([successPayload]);
                const durableStore = new MockDurableStore();
                const draftStore = new DurableDraftStore(durableStore);

                const mockQueueOperations: QueueOperation[] = [];

                const draftQueue = new DurableDraftQueue(
                    draftStore,
                    network,
                    jest.fn().mockReturnValue(mockQueueOperations)
                );
                await draftQueue.enqueue({
                    data: DEFAULT_POST_REQUEST,
                    tag: DEFAULT_TAG,
                    targetId: 'foo',
                    targetApiName: 'Account',
                    handler: LDS_ACTION_HANDLER_ID,
                });
                const result = await draftQueue.processNextAction();
                expect(result).toEqual(ProcessActionResult.ACTION_SUCCEEDED);
                expect(
                    durableStore.segments[DRAFT_ID_MAPPINGS_SEGMENT]['DraftIdMapping::foo::bar']
                ).toBeDefined();
            });

            it('doesnt store uploading draft actions', async () => {
                expect.assertions(3);
                const draftId = 'fooId';
                let foundStatus = '';
                let foundId = '';
                const durableStore = new MockDurableStore();
                const draftStore = new DurableDraftStore(durableStore);
                const network = jest.fn().mockImplementation(() => {
                    const draftKey = ObjectKeys(durableStore.segments[DRAFT_SEGMENT])[0];
                    const draftEntry = durableStore.segments[DRAFT_SEGMENT][draftKey] as any;
                    expect(draftEntry).toBeDefined();
                    foundId = draftEntry.data.targetId;
                    foundStatus = draftEntry.data.status;
                    return Promise.resolve(undefined);
                });
                const draftQueue = new DurableDraftQueue(draftStore, network, mockQueuePostHandler);
                await draftQueue.enqueue({
                    data: DEFAULT_PATCH_REQUEST,
                    tag: draftId,
                    targetId: draftId,
                    targetApiName: 'Account',
                    handler: LDS_ACTION_HANDLER_ID,
                });
                await draftQueue.processNextAction();
                expect(foundStatus).toBe(DraftActionStatus.Pending);
                expect(foundId).toBe(draftId);
            });

            it('reports action as uploading while being processed in the network adapter', async () => {
                let action: DraftAction<unknown, unknown> = undefined;
                const durableStore = new MockDurableStore();
                const draftStore = new DurableDraftStore(durableStore);
                const network = jest.fn();
                const draftQueue = new DurableDraftQueue(draftStore, network, mockQueuePostHandler);
                network.mockImplementation(async () => {
                    const actions = await draftQueue.getQueueActions();
                    action = actions[0];
                });
                const draftId = 'fooId';
                await draftQueue.enqueue({
                    data: DEFAULT_PATCH_REQUEST,
                    tag: draftId,
                    targetId: draftId,
                    targetApiName: 'Account',
                    handler: LDS_ACTION_HANDLER_ID,
                });
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
            const draftStore = new DurableDraftStore(durableStore);
            const draftQueue = new DurableDraftQueue(draftStore, network, mockQueuePostHandler);
            const listener = jest.fn();
            draftQueue.registerOnChangedListener(listener);
            const draftId = 'fooId';
            await draftQueue.enqueue({
                data: DEFAULT_PATCH_REQUEST,
                tag: draftId,
                targetId: draftId,
                targetApiName: 'Account',
                handler: LDS_ACTION_HANDLER_ID,
            });
            expect(listener).toBeCalledTimes(2);
            expect(listener.mock.calls[0][0].type).toBe(DraftQueueEventType.ActionAdding);
            expect(listener.mock.calls[1][0].type).toBe(DraftQueueEventType.ActionAdded);
        });

        it('is called when item removed', async () => {
            const network = buildMockNetworkAdapter([]);
            const durableStore = new MockDurableStore();
            const draftStore = new DurableDraftStore(durableStore);
            const draftQueue = new DurableDraftQueue(draftStore, network, mockQueuePostHandler);
            const draftAction = await draftQueue.enqueue({
                data: DEFAULT_PATCH_REQUEST,
                tag: DEFAULT_TAG,
                targetId: 'targetId',
                targetApiName: 'Account',
                handler: LDS_ACTION_HANDLER_ID,
            });

            let deletingCalled = false;
            let deletedCalled = false;
            draftQueue.registerOnChangedListener((event): Promise<void> => {
                if (event.type === DraftQueueEventType.ActionDeleting) {
                    deletingCalled = true;
                } else if (event.type === DraftQueueEventType.ActionDeleted) {
                    deletedCalled = true;
                }
                return Promise.resolve();
            });

            await draftQueue.removeDraftAction(draftAction.id);
            expect(deletingCalled).toBe(true);
            expect(deletedCalled).toBe(true);
        });

        it('is called when item completes', async () => {
            const network = jest.fn().mockResolvedValue({});
            const durableStore = new MockDurableStore();
            const draftStore = new DurableDraftStore(durableStore);
            const draftQueue = new DurableDraftQueue(draftStore, network, mockQueuePostHandler);
            const listener = jest.fn();
            draftQueue.registerOnChangedListener(listener);
            const firstRequest = { ...DEFAULT_PATCH_REQUEST, basePath: '/z' };
            await draftQueue.enqueue({
                data: firstRequest,
                tag: 'z',
                targetId: 'targetId',
                targetApiName: 'Account',
                handler: LDS_ACTION_HANDLER_ID,
            });
            await draftQueue.processNextAction();
            expect(listener).toBeCalledTimes(5);
            expect(listener.mock.calls[0][0].type).toBe(DraftQueueEventType.ActionAdding);
            expect(listener.mock.calls[1][0].type).toBe(DraftQueueEventType.ActionAdded);
            expect(listener.mock.calls[2][0].type).toBe(DraftQueueEventType.ActionRunning);
            expect(listener.mock.calls[3][0].type).toBe(DraftQueueEventType.ActionCompleting);
            expect(listener.mock.calls[4][0].type).toBe(DraftQueueEventType.ActionCompleted);
        });

        it('is called when item errors', async () => {
            const listenerSpy = jest.fn();
            const args: MockPayload['networkArgs'] = {
                method: 'patch',
                basePath: '/z',
            };
            const successPayload: MockPayload = buildSuccessMockPayload(args, {});
            const network = buildMockNetworkAdapter([]);
            const durableStore = new MockDurableStore();
            const draftStore = new DurableDraftStore(durableStore);
            const draftQueue = new DurableDraftQueue(draftStore, network, mockQueuePostHandler);
            draftQueue.registerOnChangedListener(listenerSpy);
            const firstRequest = { ...DEFAULT_PATCH_REQUEST, basePath: '/z' };
            await draftQueue.enqueue({
                data: firstRequest,
                tag: 'z',
                targetId: 'targetId',
                targetApiName: 'Account',
                handler: LDS_ACTION_HANDLER_ID,
            });
            await draftQueue.startQueue();
            await draftQueue.stopQueue();
            expect(listenerSpy).toBeCalledTimes(6);
            expect(listenerSpy.mock.calls[0][0].type).toBe(DraftQueueEventType.ActionAdding);
            expect(listenerSpy.mock.calls[1][0].type).toBe(DraftQueueEventType.ActionAdded);
            // Queue state changes
            expect(listenerSpy.mock.calls[2][0].type).toBe(DraftQueueEventType.QueueStateChanged);
            expect(listenerSpy.mock.calls[2][0].state).toBe(DraftQueueState.Started);
            expect(listenerSpy.mock.calls[3][0].type).toBe(DraftQueueEventType.ActionRunning);
            expect(listenerSpy.mock.calls[4][0].type).toBe(DraftQueueEventType.ActionRetrying);
            // Queue state changes
            expect(listenerSpy.mock.calls[5][0].type).toBe(DraftQueueEventType.QueueStateChanged);
            expect(listenerSpy.mock.calls[5][0].state).toBe(DraftQueueState.Stopped);

            //set a response so it isnt in a loop
            setMockNetworkPayloads(network, [successPayload]);
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
            status: DraftActionStatus.Pending,
            handler: LDS_ACTION_HANDLER_ID,
        };

        const setup = (testActions: DraftAction<unknown, unknown>[] = []) => {
            const durableStore = new MockDurableStore();
            const draftStore = new DurableDraftStore(durableStore);
            const evictSpy = jest.spyOn(durableStore, 'evictEntries');

            const draftQueue = new DurableDraftQueue(
                draftStore,
                buildMockNetworkAdapter([]),
                mockQueuePostHandler
            );

            // reset the durable store's draft segment before each test
            durableStore.segments[DRAFT_SEGMENT] = {};
            testActions.forEach((testAction) => {
                draftStore.writeAction(testAction);
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
            const testAction: UploadingDraftAction<unknown, unknown> = {
                ...baseAction,
                status: DraftActionStatus.Uploading,
                data: undefined,
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
            const testAction: PendingDraftAction<unknown, unknown> = {
                ...baseAction,
                status: DraftActionStatus.Pending,
                data: DEFAULT_PATCH_REQUEST,
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
            const testAction1: PendingDraftAction<unknown, unknown> = {
                ...baseAction,
                id: '101',
                tag: 'UiApi::RecordRepresentation:target110',
                targetId: 'target110',
                data: DEFAULT_POST_REQUEST,
                status: DraftActionStatus.Pending,
            };
            const testAction2: PendingDraftAction<unknown, unknown> = {
                ...baseAction,
                id: '102',
                tag: 'UiApi::RecordRepresentation:target110',
                targetId: 'target110',
                data: { ...DEFAULT_PATCH_REQUEST, basePath: '/basePath/target110' },
                status: DraftActionStatus.Pending,
            };
            const testAction3: PendingDraftAction<unknown, unknown> = {
                ...baseAction,
                id: '103',
                tag: 'UiApi::RecordRepresentation:target110',
                targetId: 'target110',
                data: { ...DEFAULT_PATCH_REQUEST, basePath: '/basePath/target110' },
                status: DraftActionStatus.Pending,
            };
            const testAction4: PendingDraftAction<unknown, unknown> = {
                ...baseAction,
                id: '104',
                tag: 'UiApi::RecordRepresentation:target140',
                targetId: 'target140',
                status: DraftActionStatus.Pending,
                data: undefined,
            };
            const testAction5: PendingDraftAction<unknown, unknown> = {
                ...baseAction,
                id: '105',
                tag: 'UiApi::RecordRepresentation:target150',
                targetId: 'target150',
                status: DraftActionStatus.Pending,
                data: undefined,
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
            expect(evictSpy).toBeCalledWith([expectedId1, expectedId2, expectedId3], 'DRAFT');
        });

        it('does not delete related draft edits on draft-edit delete', async () => {
            const testAction1: PendingDraftAction<unknown, unknown> = {
                ...baseAction,
                id: '101',
                tag: 'UiApi::RecordRepresentation:target110',
                targetId: 'target110',
                data: DEFAULT_POST_REQUEST,
                status: DraftActionStatus.Pending,
            };
            const testAction2: PendingDraftAction<unknown, unknown> = {
                ...baseAction,
                id: '102',
                tag: 'UiApi::RecordRepresentation:target110',
                targetId: 'target110',
                data: { ...DEFAULT_PATCH_REQUEST, basePath: '/basePath/target110' },
                status: DraftActionStatus.Pending,
            };
            const testAction3: PendingDraftAction<unknown, unknown> = {
                ...baseAction,
                id: '103',
                tag: 'UiApi::RecordRepresentation:target110',
                targetId: 'target110',
                data: { ...DEFAULT_PATCH_REQUEST, basePath: '/basePath/target110' },
                status: DraftActionStatus.Pending,
            };
            const testAction4: PendingDraftAction<unknown, unknown> = {
                ...baseAction,
                id: '104',
                tag: 'UiApi::RecordRepresentation:target140',
                targetId: 'target140',
                status: DraftActionStatus.Pending,
                data: undefined,
            };
            const testAction5: PendingDraftAction<unknown, unknown> = {
                ...baseAction,
                id: '105',
                tag: 'UiApi::RecordRepresentation:target150',
                targetId: 'target150',
                status: DraftActionStatus.Pending,
                data: undefined,
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
            const errorAction: ErrorDraftAction<unknown, unknown> = {
                ...baseAction,
                status: DraftActionStatus.Error,
                error: 'some error',
                data: DEFAULT_PATCH_REQUEST,
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
            const draftStore = new DurableDraftStore(durableStore);
            const draftQueue = new DurableDraftQueue(draftStore, network, mockQueuePostHandler);
            const draftTag = 'UiAPI::RecordRepresentation::fooId';
            const actionOne = await draftQueue.enqueue({
                data: UPDATE_REQUEST,
                tag: draftTag,
                targetId: 'targetId',
                targetApiName: 'Account',
                handler: LDS_ACTION_HANDLER_ID,
            });
            const actionTwo = await draftQueue.enqueue({
                data: UPDATE_REQUEST,
                tag: draftTag,
                targetId: 'targetId',
                targetApiName: 'Account',
                handler: LDS_ACTION_HANDLER_ID,
            });
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
            const draftStore = new DurableDraftStore(durableStore);
            const draftQueue = new DurableDraftQueue(draftStore, network, mockQueuePostHandler);
            const draftTag = 'UiAPI::RecordRepresentation::fooId';
            const actionOne = await draftQueue.enqueue({
                data: UPDATE_REQUEST,
                tag: draftTag,
                targetId: 'targetId',
                targetApiName: 'Account',
                handler: LDS_ACTION_HANDLER_ID,
            });
            const secondUpdate = { ...UPDATE_REQUEST };
            secondUpdate.baseUri = 'secondTestURI';
            const actionTwo = await draftQueue.enqueue({
                data: secondUpdate,
                tag: draftTag,
                targetId: 'targetId',
                targetApiName: 'Account',
                handler: LDS_ACTION_HANDLER_ID,
            });
            let actions = await draftQueue.getQueueActions();
            expect(actions.length).toBe(2);
            let deletingCalled = false;
            let deletedCalled = false;
            let updatingCalled = false;
            let updatedCalled = false;
            draftQueue.registerOnChangedListener((event): Promise<void> => {
                if (event.type === DraftQueueEventType.ActionDeleting) {
                    expect(event.action.data).toEqual(secondUpdate);
                    deletingCalled = true;
                } else if (event.type === DraftQueueEventType.ActionDeleted) {
                    expect(event.action.data).toEqual(secondUpdate);
                    deletedCalled = true;
                } else if (event.type === DraftQueueEventType.ActionUpdating) {
                    expect(event.action.data).toEqual(UPDATE_REQUEST);
                    updatingCalled = true;
                } else if (event.type === DraftQueueEventType.ActionUpdated) {
                    expect(event.action.data).toEqual(secondUpdate);
                    updatedCalled = true;
                }
                return Promise.resolve();
            });

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
            const draftStore = new DurableDraftStore(durableStore);
            const draftQueue = new DurableDraftQueue(draftStore, network, mockQueuePostHandler);
            const draftTag = 'UiAPI::RecordRepresentation::fooId';
            const actionOne = await draftQueue.enqueue({
                data: UPDATE_REQUEST,
                tag: draftTag,
                targetId: 'targetId',
                targetApiName: 'Account',
                handler: LDS_ACTION_HANDLER_ID,
            });
            await draftQueue.enqueue({
                data: UPDATE_REQUEST,
                tag: draftTag,
                targetId: 'fooId',
                targetApiName: 'Account',
                handler: LDS_ACTION_HANDLER_ID,
            });
            let actions = await draftQueue.getQueueActions();
            expect(actions.length).toBe(2);
            let result = draftQueue.replaceAction(actionOne.id, actionOne.id);
            await expect(result).rejects.toBe('Swapped and swapping action ids cannot be the same');
        });
        it('rejects on non-existent draft', async () => {
            const network = buildMockNetworkAdapter([]);
            const durableStore = new MockDurableStore();
            const draftStore = new DurableDraftStore(durableStore);
            const draftQueue = new DurableDraftQueue(draftStore, network, mockQueuePostHandler);
            const draftTag = 'UiAPI::RecordRepresentation::fooId';
            const actionOne = await draftQueue.enqueue({
                data: UPDATE_REQUEST,
                tag: draftTag,
                targetId: 'fooId',
                targetApiName: 'Account',
                handler: LDS_ACTION_HANDLER_ID,
            });
            const result = draftQueue.replaceAction(actionOne.id, 'blah');
            await expect(result).rejects.toThrowError('One or both actions does not exist');
        });

        it('rejects on non-matching target ids', async () => {
            const network = buildMockNetworkAdapter([]);
            const durableStore = new MockDurableStore();
            const draftStore = new DurableDraftStore(durableStore);
            const draftQueue = new DurableDraftQueue(draftStore, network, mockQueuePostHandler);
            const draftTag = 'UiAPI::RecordRepresentation::fooId';
            const draftTagTwo = 'UiAPI::RecordRepresentation::barId';
            const actionOne = await draftQueue.enqueue({
                data: UPDATE_REQUEST,
                tag: draftTag,
                targetId: 'fooId',
                targetApiName: 'Account',
                handler: LDS_ACTION_HANDLER_ID,
            });
            const actionTwo = await draftQueue.enqueue({
                data: UPDATE_REQUEST,
                tag: draftTagTwo,
                targetId: 'barId',
                targetApiName: 'Account',
                handler: LDS_ACTION_HANDLER_ID,
            });
            let actions = await draftQueue.getQueueActions();
            expect(actions.length).toBe(2);
            const result = draftQueue.replaceAction(actionOne.id, actionTwo.id);
            await expect(result).rejects.toThrowError(
                'Cannot swap actions targeting different targets'
            );
        });

        it('does not swap an in progress draft', async () => {
            const network = buildMockNetworkAdapter([]);
            const durableStore = new MockDurableStore();
            const draftStore = new DurableDraftStore(durableStore);
            const firstId = '0';
            const secondId = '1';
            const inProgressAction: PendingDraftAction<unknown, unknown> = {
                id: firstId,
                targetId: firstId,
                status: DraftActionStatus.Pending,
                data: createPatchRequest(),
                tag: 'UiAPI::RecordRepresentation::fooId',
                timestamp: Date.now(),
                metadata: {},
                handler: LDS_ACTION_HANDLER_ID,
            };
            const pendingAction: PendingDraftAction<unknown, unknown> = {
                id: secondId,
                targetId: secondId,
                status: DraftActionStatus.Pending,
                data: createPatchRequest(),
                tag: 'UiAPI::RecordRepresentation::fooId',
                timestamp: Date.now(),
                metadata: {},
                handler: LDS_ACTION_HANDLER_ID,
            };
            await draftStore.writeAction(inProgressAction);
            await draftStore.writeAction(pendingAction);

            const draftQueue = new DurableDraftQueue(draftStore, network, mockQueuePostHandler);
            // uploadingActionId is private, but we need to set it to
            // mock the uploading action
            (draftQueue as any).uploadingActionId = firstId;
            let actions = await draftQueue.getQueueActions();
            expect(actions.length).toBe(2);
            let result = draftQueue.replaceAction(actions[0].id, actions[1].id);
            await expect(result).rejects.toThrowError(
                'Cannot replace an draft action that is uploading'
            );
        });

        it('rejects when replacing with a non-pending action', async () => {
            const network = buildMockNetworkAdapter([]);
            const durableStore = new MockDurableStore();
            const draftStore = new DurableDraftStore(durableStore);
            const firstId = '0';
            const secondId = '1';
            const pendingAction: PendingDraftAction<unknown, unknown> = {
                id: firstId,
                targetId: firstId,
                status: DraftActionStatus.Pending,
                data: createPatchRequest(),
                tag: 'UiAPI::RecordRepresentation::fooId',
                timestamp: Date.now(),
                metadata: {},
                handler: LDS_ACTION_HANDLER_ID,
            };

            const nonPendingAction: ErrorDraftAction<unknown, unknown> = {
                id: secondId,
                targetId: secondId,
                status: DraftActionStatus.Error,
                data: createPatchRequest(),
                tag: 'UiAPI::RecordRepresentation::fooId',
                timestamp: Date.now(),
                error: {},
                metadata: {},
                handler: LDS_ACTION_HANDLER_ID,
            };
            await draftStore.writeAction(pendingAction);
            await draftStore.writeAction(nonPendingAction);

            const draftQueue = new DurableDraftQueue(draftStore, network, mockQueuePostHandler);
            let actions = await draftQueue.getQueueActions();
            expect(actions.length).toBe(2);
            let result = draftQueue.replaceAction(actions[0].id, actions[1].id);
            await expect(result).rejects.toThrowError('Cannot replace with a non-pending action');
        });

        it('rejects when trying to replace a POST action', async () => {
            const network = buildMockNetworkAdapter([]);
            const durableStore = new MockDurableStore();
            const draftStore = new DurableDraftStore(durableStore);
            const firstId = '0';
            const secondId = '1';
            const pendingAction: PendingDraftAction<unknown, unknown> = {
                id: firstId,
                targetId: firstId,
                status: DraftActionStatus.Pending,
                data: createPostRequest(),
                tag: 'UiAPI::RecordRepresentation::fooId',
                timestamp: Date.now(),
                metadata: {},
                handler: LDS_ACTION_HANDLER_ID,
            };

            const nonPendingAction: PendingDraftAction<unknown, unknown> = {
                id: secondId,
                targetId: secondId,
                status: DraftActionStatus.Pending,
                data: createPatchRequest(),
                tag: 'UiAPI::RecordRepresentation::fooId',
                timestamp: Date.now(),
                metadata: {},
                handler: LDS_ACTION_HANDLER_ID,
            };
            await draftStore.writeAction(pendingAction);
            await draftStore.writeAction(nonPendingAction);

            const draftQueue = new DurableDraftQueue(draftStore, network, mockQueuePostHandler);
            let actions = await draftQueue.getQueueActions();
            expect(actions.length).toBe(2);
            let result = draftQueue.replaceAction(actions[0].id, actions[1].id);
            await expect(result).rejects.toThrowError('Cannot replace a POST action');
        });

        it('sets a replaced item to pending', async () => {
            const network = buildMockNetworkAdapter([]);
            const durableStore = new MockDurableStore();
            const draftStore = new DurableDraftStore(durableStore);
            const firstId = '0';
            const secondId = '1';
            const inProgressAction: ErrorDraftAction<unknown, unknown> = {
                id: firstId,
                targetId: firstId,
                status: DraftActionStatus.Error,
                data: createPatchRequest(),
                tag: 'UiAPI::RecordRepresentation::fooId',
                timestamp: Date.now(),
                metadata: {},
                error: {},
                handler: LDS_ACTION_HANDLER_ID,
            };

            let secondPatchRequest = createPatchRequest();
            secondPatchRequest.body.fields.Name = 'Second Name';
            const pendingAction: PendingDraftAction<unknown, unknown> = {
                id: secondId,
                targetId: secondId,
                status: DraftActionStatus.Pending,
                data: secondPatchRequest,
                tag: 'UiAPI::RecordRepresentation::fooId',
                timestamp: Date.now(),
                metadata: {},
                handler: LDS_ACTION_HANDLER_ID,
            };

            await draftStore.writeAction(inProgressAction);
            await draftStore.writeAction(pendingAction);

            const draftQueue = new DurableDraftQueue(draftStore, network, mockQueuePostHandler);
            let actions = await draftQueue.getQueueActions();
            expect(actions.length).toBe(2);
            const actionToReplace = actions[0] as DraftAction<unknown, ResourceRequest>;
            expect(actionToReplace.data.body.fields.Name).toBe('Acme');

            const replacingAction = actions[1] as DraftAction<unknown, ResourceRequest>;
            expect(replacingAction.data.body.fields.Name).toBe('Second Name');

            let result = (await draftQueue.replaceAction(
                actionToReplace.id,
                replacingAction.id
            )) as DraftAction<unknown, ResourceRequest>;
            expect(result.status).toBe(DraftActionStatus.Pending);
            expect(result.data.body.fields.Name).toBe('Second Name');
        });

        it('does not start queue while replacing an action', async () => {
            const network = buildMockNetworkAdapter([
                buildSuccessMockPayload(DEFAULT_PATCH_REQUEST, {}),
            ]);
            const durableStore = new MockDurableStore();
            const draftStore = new DurableDraftStore(durableStore);
            const draftQueue = new DurableDraftQueue(draftStore, network, mockQueuePostHandler);
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
            const actionOne = await draftQueue.enqueue({
                data: UPDATE_REQUEST,
                tag: draftTag,
                targetId: 'fooId',
                targetApiName: 'Account',
                handler: LDS_ACTION_HANDLER_ID,
            });
            const actionTwo = await draftQueue.enqueue({
                data: UPDATE_REQUEST,
                tag: draftTag,
                targetId: 'fooId',
                targetApiName: 'Account',
                handler: LDS_ACTION_HANDLER_ID,
            });
            let actions = await draftQueue.getQueueActions();
            expect(actions.length).toBe(2);
            await draftQueue.replaceAction(actionOne.id, actionTwo.id);
            expect(processNextSpy).toBeCalledTimes(1);
            expect(draftQueue.getQueueState()).toBe(DraftQueueState.Started);
        });

        it('does not start the queue if stop is called during replace', async () => {
            const network = buildMockNetworkAdapter([]);
            const durableStore = new MockDurableStore();
            const draftStore = new DurableDraftStore(durableStore);
            const draftQueue = new DurableDraftQueue(draftStore, network, mockQueuePostHandler);
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
            const actionOne = await draftQueue.enqueue({
                data: UPDATE_REQUEST,
                tag: draftTag,
                targetId: 'fooId',
                targetApiName: 'Account',
                handler: LDS_ACTION_HANDLER_ID,
            });
            const actionTwo = await draftQueue.enqueue({
                data: UPDATE_REQUEST,
                tag: draftTag,
                targetId: 'fooId',
                targetApiName: 'Account',
                handler: LDS_ACTION_HANDLER_ID,
            });
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
            const draftStore = new DurableDraftStore(durableStore);
            const draftQueue = new DurableDraftQueue(draftStore, network, mockQueuePostHandler);
            let secondReplace: Promise<DraftAction<unknown, unknown>>;
            let evictSpy = jest.fn(() => {
                secondReplace = draftQueue.replaceAction('foo', 'bar');
                return Promise.resolve();
            });
            durableStore.evictEntries = evictSpy;
            const draftTag = 'UiAPI::RecordRepresentation::fooId';
            const actionOne = await draftQueue.enqueue({
                data: UPDATE_REQUEST,
                tag: draftTag,
                targetId: 'fooId',
                targetApiName: 'Account',
                handler: LDS_ACTION_HANDLER_ID,
            });
            const actionTwo = await draftQueue.enqueue({
                data: UPDATE_REQUEST,
                tag: draftTag,
                targetId: 'fooId',
                targetApiName: 'Account',
                handler: LDS_ACTION_HANDLER_ID,
            });
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
            const draftStore = new DurableDraftStore(durableStore);
            const draftQueue = new DurableDraftQueue(draftStore, network, mockQueuePostHandler);

            const errorAction: ErrorDraftAction<unknown, unknown> = {
                id: '123456',
                targetId: 'testTargetId',
                tag: 'testActionTag',
                data: DEFAULT_PATCH_REQUEST,
                timestamp: 2,
                metadata: {},
                status: DraftActionStatus.Error,
                error: 'mock error',
                handler: LDS_ACTION_HANDLER_ID,
            };

            const pendingAction: PendingDraftAction<unknown, unknown> = {
                id: '654321',
                targetId: 'testTargetId',
                tag: 'testActionTag',
                data: DEFAULT_PATCH_REQUEST,
                timestamp: 2,
                metadata: {},
                status: DraftActionStatus.Pending,
                handler: LDS_ACTION_HANDLER_ID,
            };

            await draftStore.writeAction(errorAction);
            await draftStore.writeAction(pendingAction);

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
            const draftStore = new DurableDraftStore(durableStore);
            const draftQueue = new DurableDraftQueue(draftStore, network, mockQueuePostHandler);
            const draftId = 'fooId';
            let action = (await draftQueue.enqueue({
                data: DEFAULT_PATCH_REQUEST,
                tag: draftId,
                targetId: 'fooId',
                targetApiName: 'Account',
                handler: LDS_ACTION_HANDLER_ID,
            })) as DraftAction<unknown, unknown>;
            expect(ObjectKeys(action.metadata).length).toBe(1);
            expect(action.metadata[LDS_ACTION_METADATA_API_NAME]).toBe('Account');

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
            const draftStore = new DurableDraftStore(durableStore);
            const draftQueue = new DurableDraftQueue(draftStore, network, mockQueuePostHandler);
            const draftId = 'fooId';
            let action = (await draftQueue.enqueue({
                data: request,
                tag: draftId,
                targetId: 'fooId',
                targetApiName: 'Account',
                handler: LDS_ACTION_HANDLER_ID,
            })) as DraftAction<unknown, unknown>;
            expect(ObjectKeys(action.metadata).length).toBe(1);
            expect(action.metadata[LDS_ACTION_METADATA_API_NAME]).toBe('Account');
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
            const draftStore = new DurableDraftStore(durableStore);
            const draftQueue = new DurableDraftQueue(draftStore, network, mockQueuePostHandler);
            const draftId = 'fooId';
            let action = await draftQueue.enqueue({
                data: DEFAULT_PATCH_REQUEST,
                tag: draftId,
                targetId: 'fooId',
                targetApiName: 'Account',
                handler: LDS_ACTION_HANDLER_ID,
            });
            expect(ObjectKeys(action.metadata).length).toBe(1);
            expect(action.metadata[LDS_ACTION_METADATA_API_NAME]).toBe('Account');

            const newMetadata = { foo: ['bar', 'baz'] } as any;
            let result = draftQueue.setMetadata(action.id, newMetadata);
            await expect(result).rejects.toBe('Cannot save incompatible metadata');
        });

        it('rejects on non-existent action', async () => {
            const network = buildMockNetworkAdapter([]);
            const durableStore = new MockDurableStore();
            const draftStore = new DurableDraftStore(durableStore);
            const draftQueue = new DurableDraftQueue(draftStore, network, mockQueuePostHandler);
            const draftId = 'fooId';
            const newMetadata = { foo: 'bar', anotherItem: 'anotherValue' };
            const result = draftQueue.setMetadata(draftId, newMetadata);
            await expect(result).rejects.toBe('cannot save metadata to non-existent action');
        });

        it('calls listener when saving', async () => {
            const network = buildMockNetworkAdapter([]);
            const durableStore = new MockDurableStore();
            const draftStore = new DurableDraftStore(durableStore);
            const draftQueue = new DurableDraftQueue(draftStore, network, mockQueuePostHandler);
            const draftId = 'fooId';
            const newMetadata = { foo: 'bar', anotherItem: 'anotherValue' };
            let updatingCalled = false;
            let updatedCalled = false;
            draftQueue.registerOnChangedListener((event): Promise<void> => {
                if (event.type === DraftQueueEventType.ActionUpdating) {
                    updatingCalled = true;
                    expect(ObjectKeys(action.metadata).length).toBe(1);
                    expect(action.metadata[LDS_ACTION_METADATA_API_NAME]).toBe('Account');
                } else if (event.type === DraftQueueEventType.ActionUpdated) {
                    updatedCalled = true;
                    expect(event.action.metadata).toBe(newMetadata);
                }
                return Promise.resolve();
            });
            let action = (await draftQueue.enqueue({
                data: DEFAULT_PATCH_REQUEST,
                tag: draftId,
                targetId: draftId,
                targetApiName: 'Account',
                handler: LDS_ACTION_HANDLER_ID,
            })) as DraftAction<unknown, unknown>;
            expect(ObjectKeys(action.metadata).length).toBe(1);
            expect(action.metadata[LDS_ACTION_METADATA_API_NAME]).toBe('Account');

            await draftQueue.setMetadata(action.id, newMetadata);
            const actions = await draftQueue.getQueueActions();
            expect(actions.length).toBe(1);
            action = actions[0];
            expect(action.metadata).toEqual(newMetadata);
            expect(updatedCalled).toBe(true);
            expect(updatingCalled).toBe(true);
        });

        it('does not allow overwriting target api name', async () => {
            const network = buildMockNetworkAdapter([]);
            const durableStore = new MockDurableStore();
            const draftStore = new DurableDraftStore(durableStore);
            const draftQueue = new DurableDraftQueue(draftStore, network, mockQueuePostHandler);
            const draftId = 'fooId';
            const newMetadata = {
                foo: 'bar',
                anotherItem: 'anotherValue',
                LDS_ACTION_METADATA_API_NAME: 'garbage',
            };

            let action = (await draftQueue.enqueue({
                data: DEFAULT_PATCH_REQUEST,
                tag: draftId,
                targetId: draftId,
                targetApiName: 'Account',
                handler: LDS_ACTION_HANDLER_ID,
            })) as DraftAction<unknown, unknown>;
            expect(ObjectKeys(action.metadata).length).toBe(1);
            expect(action.metadata[LDS_ACTION_METADATA_API_NAME]).toBe('Account');

            await draftQueue.setMetadata(action.id, newMetadata);
            const actions = await draftQueue.getQueueActions();
            expect(actions.length).toBe(1);
            action = actions[0];
            let expectedMetadata = newMetadata;
            expectedMetadata[LDS_ACTION_METADATA_API_NAME] = 'Account';
            expect(action.metadata).toEqual(expectedMetadata);
        });
    });
});
