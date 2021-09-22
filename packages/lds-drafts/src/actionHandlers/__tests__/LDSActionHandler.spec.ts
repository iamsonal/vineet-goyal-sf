import {
    buildErrorMockPayload,
    buildMockNetworkAdapter,
    buildSuccessMockPayload,
    MockPayload,
} from '@luvio/adapter-test-library';
import { ResourceRequest } from '@luvio/engine';
import {
    LDSAction,
    CompletedDraftAction,
    DraftAction,
    DraftActionStatus,
    PendingDraftAction,
    ProcessActionResult,
    QueueOperation,
    QueueOperationType,
} from '../../DraftQueue';
import { ActionHandler } from '../ActionHandler';
import { ldsActionHandler, LDS_ACTION_HANDLER_ID } from '../LDSActionHandler';

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

const DEFAULT_DELETE_REQUEST: ResourceRequest = {
    method: 'delete',
    basePath: '/blah',
    baseUri: 'blahuri',
    body: null,
    queryParams: {},
    urlParams: {},
    headers: {},
};

describe('LDSActionHandler', () => {
    describe('handle', () => {
        function setupHandler(
            payload: MockPayload[],
            success: (
                action: CompletedDraftAction<unknown, ResourceRequest>
            ) => Promise<void> = jest.fn(),
            failure: (
                action: DraftAction<unknown, ResourceRequest>,
                retry: boolean
            ) => Promise<void> = jest.fn()
        ) {
            return ldsActionHandler(buildMockNetworkAdapter(payload), jest.fn(), success, failure);
        }
        it('handles success and success function called', async () => {
            const draftAction: PendingDraftAction<unknown, ResourceRequest> = {
                id: '1234',
                data: DEFAULT_PATCH_REQUEST,
                handler: LDS_ACTION_HANDLER_ID,
                metadata: {},
                status: DraftActionStatus.Pending,
                tag: '1234',
                targetId: '1234',
                timestamp: Date.now(),
            };
            let wasCalled = false;
            const success = (
                _action: CompletedDraftAction<unknown, ResourceRequest>
            ): Promise<void> => {
                wasCalled = true;
                return Promise.resolve();
            };

            const args: MockPayload['networkArgs'] = {
                method: 'patch',
                basePath: '/blah',
            };
            const successPayload: MockPayload = buildSuccessMockPayload(args, {});
            const subject = setupHandler([successPayload], success);
            await expect(subject.handle(draftAction)).resolves.toBe(
                ProcessActionResult.ACTION_SUCCEEDED
            );
            expect(wasCalled).toBe(true);
        });

        it('handles failure with a network error returned', async () => {
            const draftAction: PendingDraftAction<unknown, ResourceRequest> = {
                id: '1234',
                data: DEFAULT_PATCH_REQUEST,
                handler: LDS_ACTION_HANDLER_ID,
                metadata: {},
                status: DraftActionStatus.Pending,
                tag: '1234',
                targetId: '1234',
                timestamp: Date.now(),
            };
            let wasCalled = false;
            const failure = (
                _action: DraftAction<unknown, ResourceRequest>,
                retry: boolean
            ): Promise<void> => {
                wasCalled = true;
                expect(retry).toBe(false);
                return Promise.resolve();
            };

            const createArgs: MockPayload['networkArgs'] = {
                method: 'patch',
                basePath: '/blah',
            };
            const payload: MockPayload = buildErrorMockPayload(createArgs, {}, 1, 'some failure');
            const subject = setupHandler([payload], undefined, failure);
            await expect(subject.handle(draftAction)).resolves.toBe(
                ProcessActionResult.ACTION_ERRORED
            );
            expect(wasCalled).toBe(true);
        });

        it('handles failure when network times out to retry', async () => {
            const draftAction: PendingDraftAction<unknown, ResourceRequest> = {
                id: '1234',
                data: DEFAULT_PATCH_REQUEST,
                handler: LDS_ACTION_HANDLER_ID,
                metadata: {},
                status: DraftActionStatus.Pending,
                tag: '1234',
                targetId: '1234',
                timestamp: Date.now(),
            };
            let wasCalled = false;
            const failure = (
                _action: DraftAction<unknown, ResourceRequest>,
                retry: boolean
            ): Promise<void> => {
                wasCalled = true;
                expect(retry).toBe(true);
                return Promise.resolve();
            };

            const subject = setupHandler([], undefined, failure);
            await expect(subject.handle(draftAction)).resolves.toBe(
                ProcessActionResult.NETWORK_ERROR
            );
            expect(wasCalled).toBe(true);
        });
    });

    describe('buildPendingAction', () => {
        let handler: ActionHandler<ResourceRequest>;

        beforeEach(() => {
            handler = ldsActionHandler(
                buildMockNetworkAdapter([]),
                jest.fn(),
                jest.fn(),
                jest.fn()
            );
        });
        it('throws error when post and already in queue', async () => {
            const action: LDSAction<ResourceRequest> = {
                data: DEFAULT_POST_REQUEST,
                handler: LDS_ACTION_HANDLER_ID,
                tag: '1234',
                targetId: '1234',
                targetApiName: 'Account',
            };
            const draft: PendingDraftAction<unknown, ResourceRequest> = {
                data: DEFAULT_POST_REQUEST,
                handler: LDS_ACTION_HANDLER_ID,
                tag: '1234',
                targetId: '1234',
                id: '1234',
                metadata: {},
                status: DraftActionStatus.Pending,
                timestamp: Date.now(),
            };
            expect(() => {
                handler.buildPendingAction(action, [draft]);
            }).toThrowError('Cannot enqueue a POST draft action with an existing tag');
        });

        it('throws error when delete and already in queue', async () => {
            const action: LDSAction<ResourceRequest> = {
                data: DEFAULT_DELETE_REQUEST,
                handler: LDS_ACTION_HANDLER_ID,
                tag: '1234',
                targetId: '1234',
                targetApiName: 'Account',
            };
            const draft: PendingDraftAction<unknown, ResourceRequest> = {
                data: DEFAULT_DELETE_REQUEST,
                handler: LDS_ACTION_HANDLER_ID,
                tag: '1234',
                targetId: '1234',
                id: '1234',
                metadata: {},
                status: DraftActionStatus.Pending,
                timestamp: Date.now(),
            };
            expect(() => {
                handler.buildPendingAction(action, [draft]);
            }).toThrowError('Cannot enqueue a draft action for a deleted record');
        });

        it('returns pending draft action', async () => {
            const action: LDSAction<ResourceRequest> = {
                data: DEFAULT_DELETE_REQUEST,
                handler: LDS_ACTION_HANDLER_ID,
                tag: '1234',
                targetId: '1234',
                targetApiName: 'Account',
            };

            const subject = handler.buildPendingAction(action, []);
            expect(subject).toMatchObject({
                data: {
                    basePath: '/blah',
                    baseUri: 'blahuri',
                    body: null,
                    headers: {},
                    method: 'delete',
                    queryParams: {},
                    urlParams: {},
                },
                handler: 'LDS_ACTION_HANDLER',
                metadata: {},
                status: 'pending',
                tag: '1234',
                targetId: '1234',
            });
        });

        it('adds object type to metadata', async () => {
            const action: LDSAction<ResourceRequest> = {
                data: DEFAULT_DELETE_REQUEST,
                handler: LDS_ACTION_HANDLER_ID,
                tag: '1234',
                targetId: '1234',
                targetApiName: 'Account',
            };

            const subject = handler.buildPendingAction(action, []);
            expect(subject).toMatchObject({
                data: {
                    basePath: '/blah',
                    baseUri: 'blahuri',
                    body: null,
                    headers: {},
                    method: 'delete',
                    queryParams: {},
                    urlParams: {},
                },
                handler: 'LDS_ACTION_HANDLER',
                metadata: { LDS_ACTION_METADATA_API_NAME: 'Account' },
                status: 'pending',
                tag: '1234',
                targetId: '1234',
            });
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
            id: 'baz__DraftAction__buz',
        };

        const deleteQueueOperation: QueueOperation = {
            type: QueueOperationType.Delete,
            id: 'one__DraftAction__1',
        };

        const createAction = { id: '100', tag: 'myTag', data: { method: 'post' } };
        const updateAction = { id: '100', tag: 'myTag', data: { method: 'patch' } };

        function setupHandler(operations: QueueOperation[] = []) {
            const networkAdapter = buildMockNetworkAdapter([]);
            return ldsActionHandler(
                networkAdapter,
                jest.fn().mockReturnValue(operations),
                jest.fn().mockReturnValue({ canonicalKey: 'canonical_1', draftKey: 'draft_1' }),
                jest.fn()
            );
        }

        it('produces delete operation for create action', async () => {
            const storeOperations = setupHandler().queueOperationsForCompletedDraft(
                [],
                createAction as any
            );

            expect(storeOperations).toEqual([
                {
                    type: 'delete',
                    id: createAction.id,
                },
            ]);
        });

        it('produces delete for update action', async () => {
            const storeOperations = setupHandler().queueOperationsForCompletedDraft(
                [],
                updateAction as any
            );

            expect(storeOperations).toEqual([
                {
                    type: 'delete',
                    id: updateAction.id,
                },
            ]);
        });

        it('does not include QueueOperations for an update', async () => {
            const storeOperations = setupHandler([
                addQueueOperation,
            ]).queueOperationsForCompletedDraft([], updateAction as any);

            expect(storeOperations).toEqual([
                {
                    type: 'delete',
                    id: updateAction.id,
                },
            ]);
        });

        it('does include QueueOperations for a create', async () => {
            const queueOperations = setupHandler([
                addQueueOperation,
                updateQueueOperation,
                deleteQueueOperation,
            ]).queueOperationsForCompletedDraft([], createAction as any);

            expect(queueOperations).toEqual([
                addQueueOperation,
                updateQueueOperation,
                deleteQueueOperation,
                {
                    type: 'delete',
                    id: createAction.id,
                },
            ]);
        });
    });

    describe('replaceAction', () => {
        let handler: ActionHandler<ResourceRequest>;

        beforeEach(() => {
            handler = ldsActionHandler(
                buildMockNetworkAdapter([]),
                jest.fn(),
                jest.fn(),
                jest.fn()
            );
        });

        const actionOne: DraftAction<unknown, ResourceRequest> = {
            data: DEFAULT_PATCH_REQUEST,
            handler: LDS_ACTION_HANDLER_ID,
            id: '1234',
            metadata: {},
            status: DraftActionStatus.Pending,
            tag: '1234',
            targetId: '1234',
            timestamp: Date.now(),
        };

        const actionTwo: DraftAction<unknown, ResourceRequest> = {
            data: DEFAULT_PATCH_REQUEST,
            handler: LDS_ACTION_HANDLER_ID,
            id: '4321',
            metadata: {},
            status: DraftActionStatus.Pending,
            tag: '4321',
            targetId: '4321',
            timestamp: Date.now(),
        };

        it('throws error because action(s) are missing', async () => {
            expect(() => {
                handler.replaceAction('1234', '4321', undefined, []);
            }).toThrow('One or both actions does not exist');
        });

        it('throws error because action already uploading', async () => {
            expect(() => {
                handler.replaceAction(actionOne.id, actionOne.id, actionOne.id, [
                    actionOne,
                    actionTwo,
                ]);
            }).toThrow('Cannot replace an draft action that is uploading');
        });

        it('throws error because actions are not the same target', async () => {
            expect(() => {
                handler.replaceAction(actionOne.id, actionTwo.id, undefined, [
                    actionOne,
                    actionTwo,
                ]);
            }).toThrow('Cannot swap actions targeting different targets');
        });

        it('throws error because replacing action is not pending', async () => {
            const replacing: DraftAction<unknown, ResourceRequest> = {
                ...actionTwo,
                tag: '1234',
                status: DraftActionStatus.Uploading,
            };
            expect(() => {
                handler.replaceAction(actionOne.id, replacing.id, undefined, [
                    actionOne,
                    replacing,
                ]);
            }).toThrow('Cannot replace with a non-pending action');
        });

        it('throws error because actions are not the same kind of handler', async () => {
            const replacing: DraftAction<unknown, ResourceRequest> = {
                ...actionTwo,
                tag: '1234',
                handler: 'custom',
            };
            expect(() => {
                handler.replaceAction(actionOne.id, replacing.id, undefined, [
                    actionOne,
                    replacing,
                ]);
            }).toThrow('Incompatable Action types to replace one another');
        });

        it('returns the objects to replace', async () => {
            const replacing: DraftAction<unknown, ResourceRequest> = {
                ...actionTwo,
                tag: '1234',
            };
            const subject = handler.replaceAction(actionOne.id, replacing.id, undefined, [
                actionOne,
                replacing,
            ]);
            expect(subject).toMatchObject({
                actionToReplace: {
                    data: {
                        basePath: '/blah',
                        baseUri: 'blahuri',
                        body: null,
                        headers: {},
                        method: 'patch',
                        queryParams: {},
                        urlParams: {},
                    },
                    handler: 'LDS_ACTION_HANDLER',
                    id: '1234',
                    metadata: {},
                    status: 'pending',
                    tag: '1234',
                    targetId: '1234',
                },
                original: {
                    data: {
                        basePath: '/blah',
                        baseUri: 'blahuri',
                        body: null,
                        headers: {},
                        method: 'patch',
                        queryParams: {},
                        urlParams: {},
                    },
                    handler: 'LDS_ACTION_HANDLER',
                    id: '1234',
                    metadata: {},
                    status: 'pending',
                    tag: '1234',
                    targetId: '1234',
                },
                replacingAction: {
                    data: {
                        basePath: '/blah',
                        baseUri: 'blahuri',
                        body: null,
                        headers: {},
                        method: 'patch',
                        queryParams: {},
                        urlParams: {},
                    },
                    handler: 'LDS_ACTION_HANDLER',
                    id: '4321',
                    metadata: {},
                    status: 'pending',
                    tag: '1234',
                    targetId: '4321',
                },
            });
        });
    });
});
