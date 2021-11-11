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

describe('postApex adapter calls luvio.applyCachePolicy', () => {
    const mockReturnedData = jest.fn() as unknown as FulfilledSnapshot<any>;

    describe('calls luvio.applyCachePolicy', () => {
        it('when caller supplies cache policy', async () => {
            const luvio = buildLuvio();
            const invoker = postApexInvokerFactory(luvio, invokerParams);
            const applyCachePolicySpy = jest
                .spyOn(luvio, 'applyCachePolicy')
                .mockResolvedValue({ data: mockReturnedData } as FulfilledSnapshot<any>);

            const cachePolicy: CachePolicyNoCache = { type: 'no-cache' };
            const data = await invoker({}, { cachePolicy });

            expect(data).toBe(mockReturnedData);

            expect(applyCachePolicySpy).toHaveBeenCalledTimes(1);
            // ensure the first parameter was the cache policy
            expect(applyCachePolicySpy.mock.calls[0][0]).toBe(cachePolicy);
        });
    });

    // TODO [W-10164140]: this test will go away and a new test should be added to ensure
    // the network-only cache policy is passed in when a request is not cacheable
    describe('does NOT call luvio.applyCachePolicy', () => {
        it('when caller DOES NOT supply cache policy', async () => {
            const luvio = buildLuvio();
            const invoker = postApexInvokerFactory(luvio, invokerParams);
            const applyCachePolicySpy = jest.spyOn(luvio, 'applyCachePolicy');
            const dispatchResourceRequestSpy = jest
                .spyOn(luvio, 'dispatchResourceRequest')
                .mockResolvedValue({
                    body: {},
                    headers: {},
                    ok: true,
                    status: 200,
                    statusText: '',
                });

            await invoker({});

            expect(applyCachePolicySpy).toHaveBeenCalledTimes(0);
            expect(dispatchResourceRequestSpy).toHaveBeenCalledTimes(1);
        });
    });
});
