import { Environment, FulfilledSnapshot, Luvio, Store, CachePolicyNoCache } from '@luvio/engine';

import { factory } from '../index';
import { ApexInvokerParams } from '../../../util/shared';

const invokerParams: ApexInvokerParams = {
    namespace: '',
    classname: 'ContactController',
    method: 'getContactList',
    isContinuation: false,
};

function buildLuvio() {
    const luvio = new Luvio(new Environment(new Store(), jest.fn()));

    return luvio;
}

describe('getApex adapter', () => {
    describe('calls luvio.applyCachePolicy', () => {
        const mockReturnedSnapshot = jest.fn() as unknown as FulfilledSnapshot<any>;

        it('when caller supplies cache policy', async () => {
            const luvio = buildLuvio();
            const adapter = factory(luvio, invokerParams);
            const applyCachePolicySpy = jest
                .spyOn(luvio, 'applyCachePolicy')
                .mockResolvedValue(mockReturnedSnapshot);

            const cachePolicy: CachePolicyNoCache = { type: 'no-cache' };
            const snapshot = await adapter({}, { cachePolicy });

            expect(snapshot).toBe(mockReturnedSnapshot);

            expect(applyCachePolicySpy).toHaveBeenCalledTimes(1);
            // ensure the first parameter was the cache policy
            expect(applyCachePolicySpy.mock.calls[0][0]).toBe(cachePolicy);
        });

        it('when caller DOES NOT supply cache policy', async () => {
            const luvio = buildLuvio();
            const adapter = factory(luvio, invokerParams);
            const applyCachePolicySpy = jest
                .spyOn(luvio, 'applyCachePolicy')
                .mockResolvedValue(mockReturnedSnapshot);

            const snapshot = await adapter({});

            expect(snapshot).toBe(mockReturnedSnapshot);

            expect(applyCachePolicySpy).toHaveBeenCalledTimes(1);
            // if no requestContext given then it should pass an undefined cache policy
            expect(applyCachePolicySpy.mock.calls[0][0]).toBe(undefined);
        });
    });
});
