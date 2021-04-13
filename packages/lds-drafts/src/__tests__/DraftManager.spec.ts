import {
    DraftActionStatus,
    DraftQueue,
    DraftQueueChangeListener,
    DraftQueueEventType,
    DraftQueueState,
    DraftAction,
} from '../DraftQueue';
import { DraftActionOperationType, DraftManager, DraftQueueOperationType } from '../DraftManager';
import {
    createDeleteDraftAction,
    createCompletedDraftAction,
    createEditDraftAction,
    createErrorDraftAction,
    createPostDraftAction,
    createUnsupportedRequestDraftAction,
    DEFAULT_TIME_STAMP,
} from './test-utils';

let globalDraftQueueListener: DraftQueueChangeListener;

describe('DraftManager', () => {
    let mockDraftQueue: DraftQueue;
    let manager: DraftManager;
    beforeEach(() => {
        mockDraftQueue = MockDraftQueue();
        manager = new DraftManager(mockDraftQueue);
    });

    describe('getQueue', () => {
        it('has queue state stopped', async () => {
            mockDraftQueue.getQueueActions = () => Promise.resolve([]);
            mockDraftQueue.getQueueState = () => DraftQueueState.Stopped;

            const subject = await manager.getQueue();
            expect(subject.queueState).toEqual(DraftQueueState.Stopped);
        });

        it('returns queue state started', async () => {
            mockDraftQueue.getQueueState = () => DraftQueueState.Started;
            mockDraftQueue.getQueueActions = () => Promise.resolve([]);

            const subject = await manager.getQueue();
            expect(subject.queueState).toEqual(DraftQueueState.Started);
        });

        it('returns queue state waiting', async () => {
            mockDraftQueue.getQueueState = () => DraftQueueState.Waiting;
            mockDraftQueue.getQueueActions = () => Promise.resolve([]);

            const subject = await manager.getQueue();
            expect(subject.queueState).toEqual(DraftQueueState.Waiting);
        });

        it('returns queue state error', async () => {
            mockDraftQueue.getQueueState = () => DraftQueueState.Error;
            mockDraftQueue.getQueueActions = () => Promise.resolve([]);

            const subject = await manager.getQueue();
            expect(subject.queueState).toEqual(DraftQueueState.Error);
        });

        it('contains state items', async () => {
            const deleteAction = createDeleteDraftAction('1234', 'mock');
            mockDraftQueue.getQueueActions = () => Promise.resolve([deleteAction]);

            const subject = await manager.getQueue();
            expect(subject.items.length).toEqual(1);
            expect(subject.items[0]).toEqual({
                id: deleteAction.id,
                targetId: '1234',
                operationType: DraftActionOperationType.Delete,
                state: DraftActionStatus.Pending,
                timestamp: DEFAULT_TIME_STAMP,
                metadata: {},
            });
        });

        it('state items to have all types of operation', async () => {
            const deleteAction = createDeleteDraftAction('1234', 'mock');
            const editAction = createEditDraftAction('mock123', 'mockKey', 'hi', 12355);
            const createAction = createPostDraftAction('kcom321', 'hello');
            mockDraftQueue.getQueueActions = () =>
                Promise.resolve([deleteAction, editAction, createAction]);

            const subject = await manager.getQueue();
            expect(subject.items.length).toEqual(3);
            expect(subject.items).toMatchObject([
                { operationType: DraftActionOperationType.Delete },
                { operationType: DraftActionOperationType.Update },
                { operationType: DraftActionOperationType.Create },
            ]);
        });

        it('state items have target id when expected', async () => {
            const editAction = createEditDraftAction('mock123', 'mockKey', 'hi', 12355);
            mockDraftQueue.getQueueActions = () => Promise.resolve([editAction]);
            const result = await manager.getQueue();
            expect(result.items.length).toBe(1);
            const item = result.items[0];
            expect(item.targetId).toBeDefined();
        });

        it('state items have metadata when expected', async () => {
            const editAction = createEditDraftAction('mock123', 'mockKey', 'hi', 12355);
            editAction.metadata = { foo: 'bar' };
            mockDraftQueue.getQueueActions = () => Promise.resolve([editAction]);
            const result = await manager.getQueue();
            expect(result.items.length).toBe(1);
            const item = result.items[0];
            expect(item.metadata).toEqual({ foo: 'bar' });
        });

        it('returns error state items', async () => {
            const errorItem = createErrorDraftAction('123', 'mock');
            mockDraftQueue.getQueueActions = () => Promise.resolve([errorItem]);
            mockDraftQueue.getQueueState = () => DraftQueueState.Error;

            const subject = await manager.getQueue();
            expect(subject.queueState).toEqual(DraftQueueState.Error);
            expect(subject.items[0]).toMatchObject({
                state: DraftActionStatus.Error,
                error: { status: 400, ok: false, headers: {}, statusText: 'SOMETHING WENT WRONG' },
            });
        });

        it('populates error body with a json string', async () => {
            const errorItem = createErrorDraftAction('123', 'mock');
            mockDraftQueue.getQueueActions = () => Promise.resolve([errorItem]);
            mockDraftQueue.getQueueState = () => DraftQueueState.Error;

            const state = await manager.getQueue();
            const action = state.items[0];
            expect(action.error.bodyString).toBe('[{"foo":"bar","one":["two"]}]');
        });

        it('only puts single object body types into an array', async () => {
            const errorItem = createErrorDraftAction('123', 'mock');
            errorItem.error.body = [{ foo: 'bar', one: ['two'] }];
            mockDraftQueue.getQueueActions = () => Promise.resolve([errorItem]);
            mockDraftQueue.getQueueState = () => DraftQueueState.Error;

            const state = await manager.getQueue();
            const action = state.items[0];
            expect(action.error.bodyString).toBe('[{"foo":"bar","one":["two"]}]');
        });

        it('throws error if Request is not supported method', async () => {
            const badRequest = createUnsupportedRequestDraftAction('12345', 'stuff');
            mockDraftQueue.getQueueActions = () => Promise.resolve([badRequest]);

            try {
                await manager.getQueue();
            } catch (error) {
                expect(error.message).toBe(
                    'get is an unsupported request method type for DraftQueue.'
                );
            }
        });
    });

    describe('listener', () => {
        let mockDraftQueue: DraftQueue;
        let manager: DraftManager;
        beforeEach(() => {
            mockDraftQueue = MockDraftQueue();
            manager = new DraftManager(mockDraftQueue);
            const editAction = createEditDraftAction('mock123', 'mockKey', 'hi', 12355);
            mockDraftQueue.getQueueActions = () => Promise.resolve([editAction]);
            mockDraftQueue.getQueueState = () => DraftQueueState.Waiting;
        });

        it('calls subscribed listener', async () => {
            expect.assertions(3);
            const action = createEditDraftAction('mock123', 'mockKey', 'hi', 12355);
            manager.registerDraftQueueChangedListener((state, type, queueItem) => {
                expect(state).toBeDefined();
                expect(type).toBe(DraftQueueOperationType.ItemAdded);
                expect(queueItem).toBeDefined();
            });
            await globalDraftQueueListener({
                type: DraftQueueEventType.ActionAdded,
                action,
            });
        });

        it('calls multiple subscribed listeners', async () => {
            expect.assertions(6);
            const action = createEditDraftAction('mock123', 'mockKey', 'hi', 12355);
            manager.registerDraftQueueChangedListener((state, type, queueItem) => {
                expect(state).toBeDefined();
                expect(type).toBe(DraftQueueOperationType.ItemAdded);
                expect(queueItem).toBeDefined();
            });

            manager.registerDraftQueueChangedListener((state, type, queueItem) => {
                expect(state).toBeDefined();
                expect(type).toBe(DraftQueueOperationType.ItemAdded);
                expect(queueItem).toBeDefined();
            });

            await globalDraftQueueListener({
                type: DraftQueueEventType.ActionAdded,
                action,
            });
        });

        it('does not call unsubscribed listeners', async () => {
            expect.assertions(3);
            const action = createEditDraftAction('mock123', 'mockKey', 'hi', 12355);
            const unsub = manager.registerDraftQueueChangedListener((state, type, queueItem) => {
                expect(state).toBeDefined();
                expect(type).toBe(DraftQueueOperationType.ItemAdded);
                expect(queueItem).toBeDefined();
            });
            await globalDraftQueueListener({
                type: DraftQueueEventType.ActionAdded,
                action,
            });
            unsub();
            await globalDraftQueueListener({
                type: DraftQueueEventType.ActionAdded,
                action,
            });
        });

        it('sends a completed draft action to listeners', async () => {
            expect.assertions(3);
            manager.registerDraftQueueChangedListener((state, type, queueItem) => {
                expect(state).toBeDefined();
                expect(type).toBe(DraftQueueOperationType.ItemCompleted);
                expect(queueItem).toBeDefined();
            });
            const completedAction = createCompletedDraftAction('mock123', 'mockKey', 1);
            await globalDraftQueueListener({
                type: DraftQueueEventType.ActionCompleted,
                action: completedAction,
            });
        });

        it('sends a failed draft action to listeners', async () => {
            manager.registerDraftQueueChangedListener((state, type, queueItem) => {
                expect(state).toBeDefined();
                expect(type).toBe(DraftQueueOperationType.ItemFailed);
                expect(queueItem).toBeDefined();
            });
            const errorAction = createErrorDraftAction('mock123', 'mockKey', 1);
            await globalDraftQueueListener({
                type: DraftQueueEventType.ActionFailed,
                action: errorAction,
            });
        });

        it('sends updated draft action to listners', async () => {
            expect.assertions(3);
            const action = createEditDraftAction('mock123', 'mockKey', 'hi', 12355);
            manager.registerDraftQueueChangedListener((state, type, queueItem) => {
                expect(state).toBeDefined();
                expect(type).toBe(DraftQueueOperationType.ItemUpdated);
                expect(queueItem).toBeDefined();
            });
            await globalDraftQueueListener({
                type: DraftQueueEventType.ActionUpdated,
                action,
            });
        });
    });

    describe('removeDraftAction', () => {
        it('returns the draft queue after removing the draft action', async () => {
            const actionID = 'abc';
            const removeSpy = jest.fn().mockReturnValue(Promise.resolve());
            const deleteAction = createDeleteDraftAction('1234', 'mock');
            mockDraftQueue.getQueueActions = () => Promise.resolve([deleteAction]);
            mockDraftQueue.removeDraftAction = removeSpy;

            const subject = await manager.removeDraftAction(actionID);
            expect(subject.items.length).toEqual(1);
            expect(subject.items[0]).toEqual({
                id: deleteAction.id,
                targetId: '1234',
                operationType: DraftActionOperationType.Delete,
                state: DraftActionStatus.Pending,
                timestamp: DEFAULT_TIME_STAMP,
                metadata: {},
            });

            expect(removeSpy).toBeCalledWith(actionID);
        });
    });

    describe('queue', () => {
        it('starts when startQueue is called', async done => {
            const startSpy = jest.fn(
                (): Promise<void> => {
                    done();
                    return Promise.resolve();
                }
            );
            mockDraftQueue.startQueue = startSpy;
            manager.startQueue();
            expect(mockDraftQueue.startQueue).toBeCalledTimes(1);
        });

        it('stops when stopQueue is called', async done => {
            const stopSpy = jest.fn(
                (): Promise<void> => {
                    done();
                    return Promise.resolve();
                }
            );
            mockDraftQueue.stopQueue = stopSpy;
            manager.stopQueue();
            expect(mockDraftQueue.stopQueue).toBeCalledTimes(1);
        });
    });

    describe('swap action', () => {
        it('successfully swaps actions', async () => {
            const editAction = createEditDraftAction('mock123', 'mockKey', 'hi', 12355);
            const swapSpy = jest.fn(
                (actionId, forActionId): Promise<DraftAction<unknown>> => {
                    expect(actionId).toBe('mockIdOne');
                    expect(forActionId).toBe('mockIdTwo');
                    return Promise.resolve(editAction);
                }
            );
            mockDraftQueue.replaceAction = swapSpy;
            const result = await manager.replaceAction('mockIdOne', 'mockIdTwo');
            expect(result.id).toBe(editAction.id);
            expect(swapSpy).toBeCalledTimes(1);
        });
    });

    describe('metadata', () => {
        it('calls draft queue metadata when saving', async done => {
            const metadataSpy = jest.fn(
                (actionId, metadata): Promise<DraftAction<unknown>> => {
                    expect(actionId).toBe('foo');
                    expect(metadata).toEqual({ bar: 'baz' });
                    done();
                    let action = createPostDraftAction('blah', 'target');
                    action.id = 'foo';
                    action.metadata = metadata;
                    return Promise.resolve(action);
                }
            );
            mockDraftQueue.setMetadata = metadataSpy;
            const updatedItem = await manager.setMetadata('foo', { bar: 'baz' });
            expect(metadataSpy).toBeCalledTimes(1);
            expect(updatedItem.id).toBe('foo');
            expect(updatedItem.metadata.bar).toBe('baz');
        });
    });
});

const MockDraftQueue = jest.fn(
    () =>
        ({
            enqueue: jest.fn(),
            getActionsForTags: jest.fn(),
            processNextAction: jest.fn(),
            getQueueActions: jest.fn(),
            getQueueState: jest.fn(),
            removeDraftAction: jest.fn(),
            startQueue: jest.fn(),
            stopQueue: jest.fn(),
            replaceAction: jest.fn(),
            setMetadata: jest.fn(),
            registerOnChangedListener: jest.fn((listener: DraftQueueChangeListener): (() => Promise<
                void
            >) => {
                globalDraftQueueListener = listener;
                return () => {
                    return Promise.resolve();
                };
            }),
        } as DraftQueue)
);
