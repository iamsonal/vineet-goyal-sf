import { Adapter, Luvio } from '@luvio/engine';
import { createImperativeAdapter } from '../imperativeAdapter';
import { flushPromises } from '@salesforce/lds-jest';

describe('imperativeAdapter', () => {
    describe('invoke', () => {
        it('should return a custom error when called with invalid config', () => {
            const metadata = {
                apiFamily: 'test',
                name: 'foo',
            };
            const customError = {
                data: undefined,
                error: {
                    ok: false,
                    status: 400,
                    statusText: 'INVALID_CONFIG',
                    body: undefined,
                    headers: {},
                },
            };
            const mockAdapter = jest.fn().mockReturnValue(null);
            const callback = jest.fn();
            const adapter = createImperativeAdapter(
                {} as Luvio,
                mockAdapter as Adapter<unknown, unknown>,
                metadata
            );

            adapter.invoke({}, {}, callback);

            expect(callback).toHaveBeenCalledWith(customError);
        });

        it('should call the callback when data is resolved synchronously from cache', () => {
            const snapshot = {
                data: 'mock',
                recordId: '',
                state: 'Fulfilled',
            };
            const metadata = {
                apiFamily: 'test',
                name: 'adapter',
            };
            const mockAdapter = jest.fn().mockReturnValue(snapshot);
            const callback = jest.fn();
            const adapter = createImperativeAdapter(
                {} as Luvio,
                mockAdapter as Adapter<unknown, unknown>,
                metadata
            );

            adapter.invoke({}, {}, callback);

            expect(callback).toHaveBeenCalledWith({
                data: snapshot.data,
                error: undefined,
            });
        });

        it('should call the callback when data is resolved from network', async () => {
            const snapshot = {
                data: 'mock',
                recordId: '',
                state: 'Fulfilled',
            };
            const metadata = {
                apiFamily: 'test',
                name: 'adapter',
            };
            const snapshotPromise = Promise.resolve(snapshot);
            const mockAdapter = jest.fn().mockReturnValue(snapshotPromise);
            const callback = jest.fn();
            const adapter = createImperativeAdapter(
                {} as Luvio,
                mockAdapter as Adapter<unknown, unknown>,
                metadata
            );

            adapter.invoke({}, {}, callback);
            await flushPromises();

            expect(callback).toHaveBeenCalledWith({
                data: snapshot.data,
                error: undefined,
            });
        });

        it('should call the callback when error is resolved from cache', () => {
            const snapshot = {
                error: 'mock',
                recordId: '',
                state: 'Error',
            };
            const metadata = {
                apiFamily: 'test',
                name: 'adapter',
            };
            const mockAdapter = jest.fn().mockReturnValue(snapshot);
            const callback = jest.fn();
            const adapter = createImperativeAdapter(
                {} as Luvio,
                mockAdapter as Adapter<unknown, unknown>,
                metadata
            );

            adapter.invoke({}, {}, callback);

            expect(callback).toHaveBeenCalledWith({
                data: undefined,
                error: snapshot.error,
            });
        });

        it('should call the callback when error is resolved from network', async () => {
            const snapshot = {
                error: 'mock',
                recordId: '',
                state: 'Error',
            };
            const metadata = {
                apiFamily: 'test',
                name: 'adapter',
            };
            const snapshotPromise = Promise.resolve(snapshot);
            const mockAdapter = jest.fn().mockReturnValue(snapshotPromise);
            const callback = jest.fn();
            const adapter = createImperativeAdapter(
                {} as Luvio,
                mockAdapter as Adapter<unknown, unknown>,
                metadata
            );

            adapter.invoke({}, {}, callback);
            await flushPromises();

            expect(callback).toHaveBeenCalledWith({
                data: undefined,
                error: snapshot.error,
            });
        });
    });

    describe('subscribe', () => {
        const dataSnapshot = {
            data: 'mock',
            recordId: '',
            state: 'Fulfilled',
        };
        const pendingSnapshot = {
            data: undefined,
            recordId: '',
            state: 'Pending',
        };
        const metadata = {
            apiFamily: 'test',
            name: 'adapter',
        };
        const customError = {
            data: undefined,
            error: {
                ok: false,
                status: 400,
                statusText: 'INVALID_CONFIG',
                body: undefined,
                headers: {},
            },
        };
        const callback = jest.fn();
        const unsubMock = jest.fn();
        const luvio = {
            storeSubscribe: jest.fn().mockReturnValue(unsubMock),
        };

        it('should return an unsubscribe when called with invalid config', () => {
            const mockAdapter = jest.fn().mockReturnValue(null);
            const imperativeAdapter = createImperativeAdapter(
                {} as Luvio,
                mockAdapter as Adapter<unknown, unknown>,
                metadata
            );

            const unsub = imperativeAdapter.subscribe({}, {}, callback);
            unsub();

            expect(callback).toHaveBeenCalledWith(customError);
            expect(unsubMock).not.toHaveBeenCalled();
        });

        it('should return an unsubscribe when invalid config is resolved asynchronously', async () => {
            const mockAdapter = jest.fn().mockReturnValue(Promise.resolve(null));
            const imperativeAdapter = createImperativeAdapter(
                {} as Luvio,
                mockAdapter as Adapter<unknown, unknown>,
                metadata
            );

            const unsub = imperativeAdapter.subscribe({}, {}, callback);
            await flushPromises();
            unsub();

            expect(callback).toHaveBeenCalledWith(customError);
            expect(unsubMock).not.toHaveBeenCalled();
        });

        it('should unsubscribe successfully when cache hit', () => {
            const mockAdapter = jest.fn().mockReturnValue(dataSnapshot);
            const imperativeAdapter = createImperativeAdapter(
                luvio as unknown as Luvio,
                mockAdapter as Adapter<unknown, unknown>,
                metadata
            );

            const unsub = imperativeAdapter.subscribe({}, {}, callback);
            unsub();

            expect(callback).toHaveBeenCalledWith({
                data: dataSnapshot.data,
                error: undefined,
            });
            expect(callback).toHaveBeenCalledTimes(1);
            expect(unsubMock).toHaveBeenCalledTimes(1);
            unsub();
            expect(unsubMock).toHaveBeenCalledTimes(1);
        });

        it('should unsubscribe successfully when cache miss', async () => {
            const snapshotPromise = Promise.resolve(dataSnapshot);
            const mockAdapter = jest.fn().mockReturnValue(snapshotPromise);
            const imperativeAdapter = createImperativeAdapter(
                luvio as unknown as Luvio,
                mockAdapter as Adapter<unknown, unknown>,
                metadata
            );

            const unsub = imperativeAdapter.subscribe({}, {}, callback);
            await flushPromises();
            unsub();

            expect(callback).toHaveBeenCalledWith({
                data: dataSnapshot.data,
                error: undefined,
            });
            expect(unsubMock).toHaveBeenCalledTimes(1);
            unsub();
            expect(unsubMock).toHaveBeenCalledTimes(1);
        });

        it('should call the callback with updated snapshot when cache hit and luvio store broadcast', async () => {
            const luvio = {
                storeSubscribe: jest.fn().mockImplementation(async (dataSnapshot, cb) => {
                    await flushPromises();
                    cb({
                        ...dataSnapshot,
                        data: 'mock2',
                    });
                }),
            };
            const mockAdapter = jest.fn().mockReturnValue(dataSnapshot);
            const imperativeAdapter = createImperativeAdapter(
                luvio as unknown as Luvio,
                mockAdapter as Adapter<unknown, unknown>,
                metadata
            );

            imperativeAdapter.subscribe({}, {}, callback);

            expect(callback).toHaveBeenCalledWith({
                data: dataSnapshot.data,
                error: undefined,
            });
            expect(callback).toHaveBeenCalledTimes(1);

            await flushPromises();

            expect(callback).toHaveBeenCalledWith({
                data: 'mock2',
                error: undefined,
            });
            expect(callback).toHaveBeenCalledTimes(2);
        });

        it('should call the callback with updated snapshot when cache miss and luvio store broadcast', async () => {
            const luvio = {
                storeSubscribe: jest.fn().mockImplementation(async (dataSnapshot, cb) => {
                    await flushPromises();
                    cb({
                        ...dataSnapshot,
                        data: 'mock2',
                    });
                }),
            };
            const snapshotPromise = Promise.resolve(dataSnapshot);
            const mockAdapter = jest.fn().mockReturnValue(snapshotPromise);
            const imperativeAdapter = createImperativeAdapter(
                luvio as unknown as Luvio,
                mockAdapter as Adapter<unknown, unknown>,
                metadata
            );

            imperativeAdapter.subscribe({}, {}, callback);
            await flushPromises();

            expect(callback).toHaveBeenCalledWith({
                data: dataSnapshot.data,
                error: undefined,
            });
            expect(callback).toHaveBeenCalledTimes(1);

            await flushPromises();

            expect(callback).toHaveBeenCalledWith({
                data: 'mock2',
                error: undefined,
            });
            expect(callback).toHaveBeenCalledTimes(2);
        });

        it('should create a new intance of subscription for each invocation', () => {
            const mockAdapter = jest.fn().mockReturnValue(dataSnapshot);
            const imperativeAdapter = createImperativeAdapter(
                luvio as unknown as Luvio,
                mockAdapter as Adapter<unknown, unknown>,
                metadata
            );

            const unsub1 = imperativeAdapter.subscribe({}, {}, callback);
            const unsub2 = imperativeAdapter.subscribe({}, {}, callback);

            unsub1();
            expect(unsubMock).toHaveBeenCalledTimes(1);
            unsub1();
            expect(unsubMock).toHaveBeenCalledTimes(1);
            unsub2();
            expect(unsubMock).toHaveBeenCalledTimes(2);
            unsub2();
            expect(unsubMock).toHaveBeenCalledTimes(2);
        });

        it('should not invoke the callback when unsubscribed before receiving a snapshot', async () => {
            const snapshotPromise = Promise.resolve(dataSnapshot);
            const mockAdapter = jest.fn().mockReturnValue(snapshotPromise);
            const imperativeAdapter = createImperativeAdapter(
                luvio as unknown as Luvio,
                mockAdapter as Adapter<unknown, unknown>,
                metadata
            );

            const unsub = imperativeAdapter.subscribe({}, {}, callback);
            unsub();
            await flushPromises();
            unsub();

            expect(callback).not.toHaveBeenCalled();
            expect(unsubMock).not.toHaveBeenCalled();
        });

        it('should not invoke callback but subscribe to pending snapshot resolved synchronously from cache', () => {
            const mockAdapter = jest.fn().mockReturnValue(pendingSnapshot);
            const imperativeAdapter = createImperativeAdapter(
                luvio as unknown as Luvio,
                mockAdapter as Adapter<unknown, unknown>,
                metadata
            );

            imperativeAdapter.subscribe({}, {}, callback);

            expect(callback).not.toHaveBeenCalled();
            expect(luvio.storeSubscribe).toHaveBeenCalledWith(
                pendingSnapshot,
                expect.any(Function)
            );
            expect(luvio.storeSubscribe).toHaveBeenCalledTimes(1);
        });

        it('should not invoke callback but subscribe to pending snapshot resolved from network', async () => {
            const snapshotPromise = Promise.resolve(pendingSnapshot);
            const mockAdapter = jest.fn().mockReturnValue(snapshotPromise);
            const imperativeAdapter = createImperativeAdapter(
                luvio as unknown as Luvio,
                mockAdapter as Adapter<unknown, unknown>,
                metadata
            );

            imperativeAdapter.subscribe({}, {}, callback);
            await flushPromises();

            expect(callback).not.toHaveBeenCalled();
            expect(luvio.storeSubscribe).toHaveBeenCalledWith(
                pendingSnapshot,
                expect.any(Function)
            );
            expect(luvio.storeSubscribe).toHaveBeenCalledTimes(1);
        });

        it('should not invoke the callback when luvio store broadcast yields a pending snapshot', async () => {
            const luvio = {
                storeSubscribe: jest.fn().mockImplementation(async (_snapshot, cb) => {
                    await flushPromises();
                    cb(pendingSnapshot);
                }),
            };
            const mockAdapter = jest.fn().mockReturnValue(dataSnapshot);
            const imperativeAdapter = createImperativeAdapter(
                luvio as unknown as Luvio,
                mockAdapter as Adapter<unknown, unknown>,
                metadata
            );

            imperativeAdapter.subscribe({}, {}, callback);

            expect(callback).toHaveBeenCalledTimes(1);
            await flushPromises();
            expect(callback).toHaveBeenCalledTimes(1);
        });

        afterEach(() => {
            jest.clearAllMocks();
        });
    });
});
