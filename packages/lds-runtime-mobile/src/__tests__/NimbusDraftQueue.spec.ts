import { ResourceRequest } from '@luvio/engine';
import { NimbusDraftQueue } from '../NimbusDraftQueue';
import { DraftQueue as DraftQueueProxy } from '@mobileplatform/nimbus-plugin-lds';
import { JSONParse, JSONStringify } from '../utils/language';
import { DraftAction, DraftActionStatus } from '@salesforce/lds-drafts';
import { LDS_ACTION_HANDLER_ID } from '@salesforce/lds-drafts/src/actionHandlers/LDSActionHandler';

export function mockNimbusDraftQueueGlobal() {
    const mock: DraftQueueProxy = {
        enqueue: jest.fn(),
        getActionsForTags: jest.fn(),
    };
    global.__nimbus = {
        ...(global.__nimbus || {}),
        plugins: {
            ...(global.__nimbus?.plugins || {}),
            LdsDraftQueue: mock,
        },
    } as any;

    return mock;
}

export function resetNimbusDraftQueueGlobal() {
    global.__nimbus.plugins.LdsDraftQueue = undefined;
}

const resourceRequest: ResourceRequest = {
    baseUri: '/base/uri',
    basePath: '/foo/123',
    method: 'get',
    body: {},
    headers: { 'Foo-Header': 'Bar' },
    queryParams: { q1: 'q1Value', q2: 'q2Value' },
    urlParams: { id: '123' },
};

const draftAction: DraftAction<any, ResourceRequest> = {
    status: DraftActionStatus.Pending,
    id: 'foo',
    targetId: 'fooId',
    tag: 'foo',
    data: resourceRequest,
    timestamp: 12345,
    metadata: {},
    handler: LDS_ACTION_HANDLER_ID,
};

describe('NimbusDraftQueue', () => {
    describe('enqueue', () => {
        it('serializes the request', () => {
            const nimbusMock = mockNimbusDraftQueueGlobal();

            const nimbusQueue = new NimbusDraftQueue();
            const tag = 'foo';
            const targetId = 'fooId';
            nimbusQueue.enqueue({
                data: resourceRequest,
                tag,
                targetId,
                handler: LDS_ACTION_HANDLER_ID,
            });
            expect(nimbusMock.enqueue).toBeCalledTimes(1);
            expect(JSONParse((nimbusMock.enqueue as jest.Mock<any>).mock.calls[0][0])).toEqual({
                tag: tag,
                targetId: targetId,
                data: resourceRequest,
                handler: LDS_ACTION_HANDLER_ID,
            });
            expect((nimbusMock.enqueue as jest.Mock<any>).mock.calls[0][1]).toEqual(tag);
            expect((nimbusMock.enqueue as jest.Mock<any>).mock.calls[0][2]).toEqual(targetId);
        });

        it('deserializes the action', async () => {
            const nimbusMock = mockNimbusDraftQueueGlobal();

            nimbusMock.enqueue = jest
                .fn()
                .mockImplementation(
                    (
                        _action: string,
                        _tag: string,
                        _targetId: string,
                        success: (result: string) => void
                    ) => {
                        success(JSONStringify(draftAction));
                    }
                );
            const nimbusQueue = new NimbusDraftQueue();
            const tag = 'foo';
            const targetId = 'fooId';
            const action = await nimbusQueue.enqueue({
                data: resourceRequest,
                tag,
                targetId,
                handler: LDS_ACTION_HANDLER_ID,
            });
            expect(action).toEqual(draftAction);
        });

        it('deserializes error', async () => {
            const nimbusMock = mockNimbusDraftQueueGlobal();
            const error = {
                message: 'bad luck',
            };
            nimbusMock.enqueue = jest
                .fn()
                .mockImplementation(
                    (_action: string, _tag: string, _targetId: string, _onSuccess, onError) => {
                        onError(JSONStringify(error));
                    }
                );
            const nimbusQueue = new NimbusDraftQueue();
            await expect(
                nimbusQueue.enqueue({
                    data: resourceRequest,
                    tag: 'foo',
                    targetId: 'fooId',
                    handler: LDS_ACTION_HANDLER_ID,
                })
            ).rejects.toEqual(error);
        });
    });

    describe('getActionsForTags', () => {
        it('serializes map to string array', async () => {
            const nimbusMock = mockNimbusDraftQueueGlobal();
            const nimbusQueue = new NimbusDraftQueue();
            nimbusQueue.getActionsForTags({ '1': true, '2': true });
            expect((nimbusMock.getActionsForTags as jest.Mock<any>).mock.calls[0][0]).toEqual([
                '1',
                '2',
            ]);
        });

        it('deserializes map', async () => {
            const nimbusMock = mockNimbusDraftQueueGlobal();
            const map = {
                '1': [draftAction],
            };
            nimbusMock.getActionsForTags = jest
                .fn()
                .mockImplementation((_keys, onSuccess, _onError) => {
                    onSuccess(JSONStringify(map));
                });
            const nimbusQueue = new NimbusDraftQueue();
            const mapResult = await nimbusQueue.getActionsForTags({ '1': true, '2': true });
            expect(mapResult).toEqual(map);
        });

        it('deserializes error', async () => {
            const nimbusMock = mockNimbusDraftQueueGlobal();
            const error = {
                message: 'bad luck',
            };
            nimbusMock.getActionsForTags = jest
                .fn()
                .mockImplementation((_keys, _onSuccess, onError) => {
                    onError(JSONStringify(error));
                });
            const nimbusQueue = new NimbusDraftQueue();
            await expect(nimbusQueue.getActionsForTags({ '1': true, '2': true })).rejects.toEqual(
                error
            );
        });
    });

    describe('processNextAction', () => {
        it('rejects with error', async () => {
            const nimbusQueue = new NimbusDraftQueue();
            await expect(nimbusQueue.processNextAction()).rejects.toBe(
                'Cannot call processNextAction from the NimbusDraftQueue'
            );
        });
    });

    describe('registerDraftQueueCompletedListener', () => {
        it('no-ops', async () => {
            const nimbusQueue = new NimbusDraftQueue();
            const listener = jest.fn();

            nimbusQueue.registerOnChangedListener(listener);

            expect(listener).toHaveBeenCalledTimes(0);
        });
    });

    it('rejects on removeDraftAction', async () => {
        const nimbusQueue = new NimbusDraftQueue();
        await expect(nimbusQueue.removeDraftAction('1')).rejects.toEqual(
            'Cannot call removeDraftAction from the NimbusDraftQueue'
        );
    });
    it('rejects on startQueue', async () => {
        const nimbusQueue = new NimbusDraftQueue();
        await expect(nimbusQueue.startQueue()).rejects.toEqual(
            'Cannot call startQueue from the NimbusDraftQueue'
        );
    });

    it('rejects on stopQueue', async () => {
        const nimbusQueue = new NimbusDraftQueue();
        await expect(nimbusQueue.stopQueue()).rejects.toEqual(
            'Cannot call stopQueue from the NimbusDraftQueue'
        );
    });

    it('rejects on replaceAction', async () => {
        const nimbusQueue = new NimbusDraftQueue();
        await expect(nimbusQueue.replaceAction('1', '2')).rejects.toEqual(
            'Cannot call replaceAction from the NimbusDraftQueue'
        );
    });

    it('rejects on setMetadata', async () => {
        const nimbusQueue = new NimbusDraftQueue();
        await expect(nimbusQueue.setMetadata('1', { '1': '2' })).rejects.toBe(
            'Cannot call setMetadata from the NimbusDraftQueue'
        );
    });

    describe('getQueueActions', () => {
        it('deserializes queue', async () => {
            const nimbusMock = mockNimbusDraftQueueGlobal();
            const queue = [draftAction];
            nimbusMock.callProxyMethod = jest
                .fn()
                .mockImplementation((_name, _args, onSuccess, _onError) => {
                    onSuccess(JSONStringify(queue));
                });
            const nimbusQueue = new NimbusDraftQueue();
            const queueResult = await nimbusQueue.getQueueActions();
            expect(queueResult).toEqual(queue);
        });

        it('deserializes error', async () => {
            const nimbusMock = mockNimbusDraftQueueGlobal();
            const error = {
                message: 'bad luck',
            };
            nimbusMock.callProxyMethod = jest
                .fn()
                .mockImplementation((_name, _args, _onSuccess, onError) => {
                    onError(JSONStringify(error));
                });
            const nimbusQueue = new NimbusDraftQueue();
            await expect(nimbusQueue.getQueueActions()).rejects.toEqual(error);
        });
    });
});
