import { throttle } from '../utils/utils';

describe('throttle', () => {
    it('called on first invoke', () => {
        const mockFn = jest.fn();
        const throttledMockFunc = throttle(mockFn, 100);
        throttledMockFunc();
        expect(mockFn).toHaveBeenCalledTimes(1);
    });
    it('only called once with 5 calls while waiting', () => {
        const mockFn = jest.fn();
        const throttledMockFunc = throttle(mockFn, 100);
        throttledMockFunc();
        throttledMockFunc();
        throttledMockFunc();
        throttledMockFunc();
        throttledMockFunc();
        expect(mockFn).toHaveBeenCalledTimes(1);
    });
    it('callable again after setTimeout callback executes', () => {
        jest.useFakeTimers();
        const mockFn = jest.fn();
        const throttledMockFunc = throttle(mockFn, 100);
        throttledMockFunc();
        expect(mockFn).toHaveBeenCalledTimes(1);
        throttledMockFunc();
        expect(mockFn).toHaveBeenCalledTimes(1);
        jest.runAllTimers();
        throttledMockFunc();
        expect(mockFn).toHaveBeenCalledTimes(2);
    });
});
