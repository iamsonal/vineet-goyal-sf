import timekeeper from 'timekeeper';
import { throttle } from '../throttle';

describe('throttle', () => {
    it('limits the frequency of the function invocation to the rate', () => {
        const mockFn = jest.fn();
        const target = throttle(2, 500, mockFn);
        for (let i = 0; i < 5; i++) {
            target();
        }
        expect(mockFn).toHaveBeenCalledTimes(2);
    });

    it('supports optional allow and drop functions', () => {
        const allowFn = jest.fn();
        const dropFn = jest.fn();
        const target = throttle(2, 500, jest.fn(), {
            allowFunction: allowFn,
            dropFunction: dropFn,
        });
        for (let i = 0; i < 5; i++) {
            target();
        }
        expect(allowFn).toHaveBeenCalledTimes(2);
        expect(dropFn).toHaveBeenCalledTimes(3);
    });

    it('allows function invocation after timeLimit expires', () => {
        const mockFn = jest.fn();
        const target = throttle(2, 500, mockFn);
        target();
        target();
        target();
        expect(mockFn).toHaveBeenCalledTimes(2);
        timekeeper.travel(Date.now() + 501);
        target();
        expect(mockFn).toHaveBeenCalledTimes(3);
    });

    it('throws when called with non positive invokeLimit', () => {
        expect(() => throttle(0, 500, jest.fn())).toThrowError(
            'only supports throttling with positive invokeLimit and timeLimit'
        );
    });

    it('throws when called with non positive timeLimit', () => {
        expect(() => throttle(2, 0, jest.fn())).toThrowError(
            'only supports throttling with positive invokeLimit and timeLimit'
        );
    });
});
