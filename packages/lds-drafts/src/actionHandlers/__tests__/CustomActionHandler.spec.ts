import {
    CompletedDraftAction,
    DraftAction,
    DraftActionStatus,
    ProcessActionResult,
} from '../../DraftQueue';
import {
    CustomActionData,
    CustomActionErrorType,
    CustomActionExecutor,
    customActionHandler,
    CustomActionResult,
    CustomActionResultType,
} from '../CustomActionHandler';

const DEFAULT_CUSTOM_ACTION: DraftAction<unknown, CustomActionData> = {
    data: { some: 'data' },
    handler: 'custom',
    id: '1234',
    metadata: {},
    status: DraftActionStatus.Pending,
    targetId: '1234',
    tag: '1234',
    timestamp: Date.now(),
};

describe('CustomActionHandler', () => {
    function setupHandler(
        executor: CustomActionExecutor = jest.fn(),
        success: (
            action: CompletedDraftAction<unknown, CustomActionData>
        ) => Promise<void> = jest.fn(),
        failure: (
            action: DraftAction<unknown, CustomActionData>,
            retry: boolean
        ) => Promise<void> = jest.fn()
    ) {
        return customActionHandler(executor, success, failure);
    }
    describe('handle', () => {
        it('notifies the executor and gets success response', async () => {
            let executorCalled = false;
            let completionCalled = false;
            const executor = (
                _action: DraftAction<unknown, unknown>,
                completed: (result: CustomActionResult) => void
            ) => {
                executorCalled = true;
                completed({
                    id: '1234',
                    type: CustomActionResultType.SUCCESS,
                });
            };
            const handler = setupHandler(
                executor,
                (_action: CompletedDraftAction<unknown, CustomActionData>) => {
                    completionCalled = true;
                    return Promise.resolve();
                }
            );

            const subject = await handler.handle(DEFAULT_CUSTOM_ACTION);
            expect(subject).toBe(ProcessActionResult.CUSTOM_ACTION_WAITING);
            expect(executorCalled).toBe(true);
            expect(completionCalled).toBe(true);
        });

        it('notifies the executor and gets failure response to not retry', async () => {
            let executorCalled = false;
            let completionCalled = false;
            const executor = (
                _action: DraftAction<unknown, unknown>,
                completed: (result: CustomActionResult) => void
            ) => {
                executorCalled = true;
                completed({
                    id: '1234',
                    type: CustomActionResultType.FAILURE,
                    error: {
                        type: CustomActionErrorType.CLIENT_ERROR,
                        message: 'error',
                    },
                });
            };
            const handler = setupHandler(
                executor,
                undefined,
                (_action: DraftAction<unknown, CustomActionData>, retry: boolean) => {
                    completionCalled = true;
                    expect(retry).toBe(false);
                    return Promise.resolve();
                }
            );

            const subject = await handler.handle(DEFAULT_CUSTOM_ACTION);
            expect(subject).toBe(ProcessActionResult.CUSTOM_ACTION_WAITING);
            expect(executorCalled).toBe(true);
            expect(completionCalled).toBe(true);
        });

        it('notifies the executor and gets failure response to retry', async () => {
            let executorCalled = false;
            let completionCalled = false;
            const executor = (
                _action: DraftAction<unknown, unknown>,
                completed: (result: CustomActionResult) => void
            ) => {
                executorCalled = true;
                completed({
                    id: '1234',
                    type: CustomActionResultType.FAILURE,
                    error: {
                        type: CustomActionErrorType.NETWORK_ERROR,
                        message: 'error',
                    },
                });
            };
            const handler = setupHandler(
                executor,
                undefined,
                (_action: DraftAction<unknown, CustomActionData>, retry: boolean) => {
                    completionCalled = true;
                    expect(retry).toBe(true);
                    return Promise.resolve();
                }
            );

            const subject = await handler.handle(DEFAULT_CUSTOM_ACTION);
            expect(subject).toBe(ProcessActionResult.CUSTOM_ACTION_WAITING);
            expect(executorCalled).toBe(true);
            expect(completionCalled).toBe(true);
        });
    });
    describe('buildPendingAction', () => {
        it('builds pending draft action', async () => {
            const handler = setupHandler();
            const subject = handler.buildPendingAction(
                {
                    data: { some: 'data' },
                    handler: 'custom',
                    tag: '1234',
                    targetId: '1234',
                },
                []
            );

            expect(subject).toMatchObject({
                data: {
                    some: 'data',
                },
                handler: 'custom',
                metadata: {
                    some: 'data',
                },
                status: 'pending',
                tag: '1234',
                targetId: '1234',
            });
        });
    });
    describe('storeOperationsForUploadedDraft', () => {
        it('returns operation', async () => {
            const handler = setupHandler();
            const subject = handler.queueOperationsForCompletedDraft<unknown>([], {
                ...DEFAULT_CUSTOM_ACTION,
                status: DraftActionStatus.Completed,
            } as CompletedDraftAction<unknown, CustomActionData>);
            expect(subject).toStrictEqual([{ id: DEFAULT_CUSTOM_ACTION.id, type: 'delete' }]);
        });
    });
    describe('replaceAction', () => {
        it('should always throw, it isnt supported', async () => {
            const handler = setupHandler();
            expect(() => {
                handler.replaceAction('1234', '4321', undefined, [DEFAULT_CUSTOM_ACTION]);
            }).toThrow('1234 does not support action replacing. You can only delete 1234');
        });
    });
});
