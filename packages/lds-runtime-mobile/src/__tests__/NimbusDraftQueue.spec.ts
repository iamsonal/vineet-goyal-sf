import { ResourceRequest } from '@ldsjs/engine';
import { NimbusDraftQueue } from '../NimbusDraftQueue';
import { DraftQueue as DraftQueueProxy } from '@mobileplatform/nimbus-plugin-lds';
import { JSONStringify } from '../utils/language';
import { DraftAction, DraftActionStatus } from '@salesforce/lds-drafts';

export function mockNimbusDraftQueueGlobal() {
    const mock: DraftQueueProxy = {
        enqueue: jest.fn(),
        getActionsForTags: jest.fn(),
    };
    global.__nimbus = {
        ...(global.__nimbus ?? {}),
        plugins: {
            ...(global.__nimbus?.plugins ?? {}),
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

const draftAction: DraftAction<any> = {
    status: DraftActionStatus.Pending,
    id: 'foo',
    tag: 'foo',
    request: resourceRequest,
};

describe('NimbusDraftQueue', () => {
    describe('enqueue', () => {
        it('serializes the request', () => {
            const nimbusMock = mockNimbusDraftQueueGlobal();

            const nimbusQueue = new NimbusDraftQueue();
            const tag = 'foo';
            nimbusQueue.enqueue(resourceRequest, tag);
            expect(nimbusMock.enqueue).toBeCalledTimes(1);
            expect((nimbusMock.enqueue as jest.Mock<any>).mock.calls[0][0]).toEqual(
                JSONStringify(resourceRequest)
            );
            expect((nimbusMock.enqueue as jest.Mock<any>).mock.calls[0][1]).toEqual(tag);
        });

        it('deserializes the action', async () => {
            const nimbusMock = mockNimbusDraftQueueGlobal();

            nimbusMock.enqueue = jest
                .fn()
                .mockImplementation(
                    (_action: string, _tag: string, success: (result: string) => void) => {
                        success(JSONStringify(draftAction));
                    }
                );
            const nimbusQueue = new NimbusDraftQueue();
            const tag = 'foo';
            const action = await nimbusQueue.enqueue(resourceRequest, tag);
            expect(action).toEqual(draftAction);
        });

        it('deserializes error', async () => {
            const nimbusMock = mockNimbusDraftQueueGlobal();
            const error = {
                message: 'bad luck',
            };
            nimbusMock.enqueue = jest
                .fn()
                .mockImplementation((_action: string, _tag: string, _onSuccess, onError) => {
                    onError(JSONStringify(error));
                });
            const nimbusQueue = new NimbusDraftQueue();
            await expect(nimbusQueue.enqueue(resourceRequest, 'foo')).rejects.toEqual(error);
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
        it('throws error', async () => {
            const nimbusQueue = new NimbusDraftQueue();
            expect(nimbusQueue.registerDraftQueueCompletedListener).toThrow();
        });
    });
});
