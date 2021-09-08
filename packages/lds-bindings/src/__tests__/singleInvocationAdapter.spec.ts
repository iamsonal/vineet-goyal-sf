import { Adapter } from '@luvio/engine';
import { createSingleInvocationAdapter } from '../singleInvocationAdapter';

function flushPromises() {
    return new Promise((resolve) => setImmediate(resolve));
}

describe('createSingleInvocationAdapter', () => {
    it('should return a custom error when called with invalid config', () => {
        const metadata = {
            apiFamily: 'test',
            name: 'foo',
        };
        const customError = {
            code: 199,
            message: `Adapter: ${metadata.name} called with invalid config`,
        };
        const mockAdapter = jest.fn().mockReturnValue(null);
        const callback = jest.fn();
        const adapter = createSingleInvocationAdapter(
            mockAdapter as Adapter<unknown, unknown>,
            metadata
        );

        adapter(callback, {});

        expect(callback).toHaveBeenCalledWith(customError);
    });

    it('should call the callback when data is resolved from cache', () => {
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
        const adapter = createSingleInvocationAdapter(
            mockAdapter as Adapter<unknown, unknown>,
            metadata
        );

        adapter(callback, {});

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
        const adapter = createSingleInvocationAdapter(
            mockAdapter as Adapter<unknown, unknown>,
            metadata
        );

        adapter(callback, {});
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
        const adapter = createSingleInvocationAdapter(
            mockAdapter as Adapter<unknown, unknown>,
            metadata
        );

        adapter(callback, {});

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
        const adapter = createSingleInvocationAdapter(
            mockAdapter as Adapter<unknown, unknown>,
            metadata
        );

        adapter(callback, {});
        await flushPromises();

        expect(callback).toHaveBeenCalledWith({
            data: undefined,
            error: snapshot.error,
        });
    });
});
