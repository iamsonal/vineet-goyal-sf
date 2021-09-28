import { nimbusDraftQueue } from '../nimbusDraftQueue';
import { flushPromises } from './utils';
import { draftQueue } from '../draftQueueImplementation';
import { JSONStringify } from '../language';
describe('nimbusDraftQueue', () => {
    describe('callProxyMethod', () => {
        it('calls getQueueActions with no parameters', async () => {
            const successSpy = jest.fn();
            const errorSpy = jest.fn();
            nimbusDraftQueue.callProxyMethod(
                'getQueueActions',
                JSONStringify([]),
                successSpy,
                errorSpy
            );

            await flushPromises();

            expect(successSpy).toBeCalledWith(JSON.stringify([]));
            expect(errorSpy).toBeCalledTimes(0);
        });

        it('calls getActionsForTags with parameters', async () => {
            const successSpy = jest.fn();
            const errorSpy = jest.fn();
            nimbusDraftQueue.callProxyMethod(
                'getActionsForTags',
                JSON.stringify([{ a: true, b: true, c: true }]),
                successSpy,
                errorSpy
            );

            await flushPromises();

            expect(successSpy).toBeCalledWith(JSON.stringify({ a: [], b: [], c: [] }));
            expect(errorSpy).toBeCalledTimes(0);
        });

        it('calls error callback for function that does not exist', () => {
            const successSpy = jest.fn();
            const errorSpy = jest.fn();
            nimbusDraftQueue.callProxyMethod(
                'noExist',
                JSON.stringify(['a', 'b', 'c']),
                successSpy,
                errorSpy
            );

            expect(errorSpy).toBeCalledWith(
                JSONStringify({
                    message: 'Method does not exist on the draft queue',
                })
            );
            expect(successSpy).toBeCalledTimes(0);
        });

        it('calls error callback for function that is not on allow list', () => {
            const successSpy = jest.fn();
            const errorSpy = jest.fn();
            nimbusDraftQueue.callProxyMethod(
                'replaceAction',
                JSON.stringify(['a', 'b', 'c']),
                successSpy,
                errorSpy
            );

            expect(errorSpy).toBeCalledWith(
                JSONStringify({
                    message: 'Method replaceAction is not available for proxy invocation',
                })
            );
            expect(successSpy).toBeCalledTimes(0);
        });

        it('calls error callback when not passing in an array', () => {
            const successSpy = jest.fn();
            const errorSpy = jest.fn();
            nimbusDraftQueue.callProxyMethod(
                'getActionsForTags',
                JSON.stringify({ a: true, b: true }),
                successSpy,
                errorSpy
            );

            expect(errorSpy).toBeCalledWith(
                JSONStringify({ message: 'expected array argument list' })
            );
        });

        // test disabled because replaceAction is not on allow list, enable if ever on allow list
        xit('calls replaceAction with two arguments', () => {
            const spy = jest.spyOn(draftQueue, 'replaceAction');

            nimbusDraftQueue.callProxyMethod(
                'replaceAction',
                JSON.stringify(['a', 'b']),
                jest.fn(),
                jest.fn()
            );

            expect(spy).toBeCalledWith('a', 'b');
        });

        // test disabled because getQueueState is not on allowlist, enable if ever on allowlist
        xit('calls synchronous getQueueState', () => {
            const successCallback = jest.fn();
            nimbusDraftQueue.callProxyMethod('getQueueState', null, successCallback, jest.fn());

            expect(successCallback).toBeCalledWith(JSONStringify('stopped'));
        });
    });
});
