import { DraftActionStatus, DraftQueue, DraftQueueState } from '../DraftQueue';
import { DraftActionOperationType, DraftManager } from '../DraftManager';
import {
    createDeleteDraftAction,
    createEditDraftAction,
    createErrorDraftAction,
    createPostDraftAction,
    createUnsupportedRequestDraftAction,
    DEFAULT_TIME_STAMP,
} from './test-utils';

describe('DraftManager', () => {
    let mockDraftQueue: DraftQueue;
    let manager: DraftManager;
    beforeEach(() => {
        mockDraftQueue = MockDraftQueue();
        manager = new DraftManager(mockDraftQueue);
    });

    describe('getCurrentDraftQueueState', () => {
        it('has queue state stopped', async () => {
            mockDraftQueue.getQueueActions = () => Promise.resolve([]);
            mockDraftQueue.getQueueState = () => DraftQueueState.Stopped;

            const subject = await manager.getCurrentDraftQueueState();
            expect(subject.queueState).toEqual(DraftQueueState.Stopped);
        });

        it('returns queue state started', async () => {
            mockDraftQueue.getQueueState = () => DraftQueueState.Started;
            mockDraftQueue.getQueueActions = () => Promise.resolve([]);

            const subject = await manager.getCurrentDraftQueueState();
            expect(subject.queueState).toEqual(DraftQueueState.Started);
        });

        it('returns queue state waiting', async () => {
            mockDraftQueue.getQueueState = () => DraftQueueState.Waiting;
            mockDraftQueue.getQueueActions = () => Promise.resolve([]);

            const subject = await manager.getCurrentDraftQueueState();
            expect(subject.queueState).toEqual(DraftQueueState.Waiting);
        });

        it('returns queue state error', async () => {
            mockDraftQueue.getQueueState = () => DraftQueueState.Error;
            mockDraftQueue.getQueueActions = () => Promise.resolve([]);

            const subject = await manager.getCurrentDraftQueueState();
            expect(subject.queueState).toEqual(DraftQueueState.Error);
        });

        it('contains state items', async () => {
            const deleteAction = createDeleteDraftAction('1234', 'mock');
            mockDraftQueue.getQueueActions = () => Promise.resolve([deleteAction]);

            const subject = await manager.getCurrentDraftQueueState();
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

            const subject = await manager.getCurrentDraftQueueState();
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

            const subject = await manager.getCurrentDraftQueueState();
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
                await manager.getCurrentDraftQueueState();
            } catch (error) {
                expect(error.message).toBe(
                    'get is an unsupported request method type for DraftQueue.'
                );
            }
        });
    });
});

const MockDraftQueue = jest.fn(
    () =>
        ({
            enqueue: jest.fn(),
            getActionsForTags: jest.fn(),
            registerDraftQueueCompletedListener: jest.fn(),
            processNextAction: jest.fn(),
            getQueueActions: jest.fn(),
            getQueueState: jest.fn(),
        } as DraftQueue)
);
