import { instrumentMethods } from '../../instrumentation';
import { flushPromises } from '../../__tests__/testUtils';

jest.mock('o11y/client');
import { instrumentation } from 'o11y/client';

beforeEach(() => {
    jest.spyOn(instrumentation, 'trackValue');
});

afterEach(() => {
    jest.clearAllMocks();
});

describe('instrumentMethods', () => {
    it('instruments a single method', () => {
        const foo = {
            bar: jest.fn(),
        };
        instrumentMethods(foo, ['bar']);
        foo.bar();
        expect(instrumentation.trackValue).toHaveBeenCalledTimes(1);
    });
    it('instruments multiple methods', () => {
        const foo = {
            bar: jest.fn(),
            baz: jest.fn(),
        };
        instrumentMethods(foo, ['bar', 'baz']);
        foo.bar();
        foo.baz();
        expect(instrumentation.trackValue).toHaveBeenCalledTimes(2);
    });
    it('instruments an asynchronous method', async () => {
        const bar = jest.fn().mockImplementation(() => {
            return new Promise((resolve) => {
                setTimeout(() => resolve({}));
            });
        });
        const foo = {
            bar,
        };
        instrumentMethods(foo, ['bar']);
        await foo.bar();
        expect(instrumentation.trackValue).toHaveBeenCalledTimes(1);
    });
    it('handles an asynchronous reject', async () => {
        const bar = jest.fn().mockImplementation(() => {
            return new Promise((_resolve, reject) => {
                setTimeout(() => reject());
            });
        });
        const foo = {
            bar,
        };
        instrumentMethods(foo, ['bar']);
        try {
            await foo.bar();
        } catch {
            await flushPromises();
            expect(instrumentation.trackValue).toHaveBeenCalledTimes(1);
        }
    });
    it('handles a synchronous throw', () => {
        const bar = jest.fn().mockImplementation(() => {
            throw new Error('mockError');
        });
        const foo = {
            bar,
        };
        instrumentMethods(foo, ['bar']);
        try {
            foo.bar();
        } catch {
            expect(instrumentation.trackValue).toHaveBeenCalledTimes(1);
        }
    });
});
