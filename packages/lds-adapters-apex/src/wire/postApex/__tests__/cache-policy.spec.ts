import { Environment, FulfilledSnapshot, Luvio, Store, CachePolicyNoCache } from '@luvio/engine';

import { invoker as postApexInvokerFactory } from '../index';
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

describe('postApex adapter', () => {
    const mockReturnedData = jest.fn() as unknown as FulfilledSnapshot<any>;

    describe('calls luvio.applyCachePolicy', () => {
        it('when caller supplies requestContext', async () => {
            const luvio = buildLuvio();
            const invoker = postApexInvokerFactory(luvio, invokerParams);
            const applyCachePolicySpy = jest
                .spyOn(luvio, 'applyCachePolicy')
                .mockResolvedValue({ data: mockReturnedData } as FulfilledSnapshot<any>);

            const cachePolicy: CachePolicyNoCache = { type: 'no-cache' };
            const adapterRequestContext = { cachePolicy };
            const data = await invoker({}, adapterRequestContext);

            expect(data).toBe(mockReturnedData);

            expect(applyCachePolicySpy).toHaveBeenCalledTimes(1);
            // ensure the first parameter was the cache policy
            expect(applyCachePolicySpy.mock.calls[0][0]).toEqual(adapterRequestContext);
        });

        it('when caller DOES NOT supply requestContext', async () => {
            const luvio = buildLuvio();
            const invoker = postApexInvokerFactory(luvio, invokerParams);
            const applyCachePolicySpy = jest
                .spyOn(luvio, 'applyCachePolicy')
                .mockResolvedValue({ data: mockReturnedData } as FulfilledSnapshot<any>);

            const data = await invoker({});

            expect(data).toBe(mockReturnedData);

            expect(applyCachePolicySpy).toHaveBeenCalledTimes(1);
        });
    });
});
