import {
    DraftActionStatus,
    DraftQueue,
    DraftQueueChangeListener,
    DraftQueueState,
} from '../DraftQueue';
import { DraftActionOperationType, DraftManager } from '../DraftManager';
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
                operationType: DraftActionOperationType.Delete,
                state: DraftActionStatus.Pending,
                timestamp: DEFAULT_TIME_STAMP,
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

        it('returns error state items', async () => {
            const errorItem = createErrorDraftAction('123', 'mock');
            mockDraftQueue.getQueueActions = () => Promise.resolve([errorItem]);
            mockDraftQueue.getQueueState = () => DraftQueueState.Error;

            const subject = await manager.getQueue();
            expect(subject.queueState).toEqual(DraftQueueState.Error);
            expect(subject.items[0]).toMatchObject({
                state: DraftActionStatus.Error,
                error: 'SOMETHING WENT WRONG',
            });
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
            expect.assertions(2);
            manager.registerDraftQueueChangedListener((state, completed) => {
                expect(state).toBeDefined();
                expect(completed).toBeUndefined();
            });
            await globalDraftQueueListener();
        });

        it('calls multiple subscribed listeners', async () => {
            expect.assertions(4);
            manager.registerDraftQueueChangedListener((state, completed) => {
                expect(state).toBeDefined();
                expect(completed).toBeUndefined();
            });

            manager.registerDraftQueueChangedListener((state, completed) => {
                expect(state).toBeDefined();
                expect(completed).toBeUndefined();
            });

            await globalDraftQueueListener();
        });

        it('does not call unsubscribed listeners', async () => {
            expect.assertions(2);
            const unsub = manager.registerDraftQueueChangedListener((state, completed) => {
                expect(state).toBeDefined();
                expect(completed).toBeUndefined();
            });
            await globalDraftQueueListener();
            unsub();
            await globalDraftQueueListener();
        });

        it('sends a completed draft action to listeners', async () => {
            expect.assertions(2);
            manager.registerDraftQueueChangedListener((state, completed) => {
                expect(state).toBeDefined();
                expect(completed).toBeDefined();
            });
            const completedAction = createCompletedDraftAction('mock123', 'mockKey', 1);
            await globalDraftQueueListener(completedAction);
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
                operationType: DraftActionOperationType.Delete,
                state: DraftActionStatus.Pending,
                timestamp: DEFAULT_TIME_STAMP,
            });

            expect(removeSpy).toBeCalledWith(actionID);
        });
    });

    describe('queue', () => {
        it('starts when startQueue is called', async () => {
            manager.startQueue();
            expect(mockDraftQueue.startQueue).toBeCalledTimes(1);
        });

        it('stops when stopQueue is called', async () => {
            manager.stopQueue();
            expect(mockDraftQueue.stopQueue).toBeCalledTimes(1);
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
