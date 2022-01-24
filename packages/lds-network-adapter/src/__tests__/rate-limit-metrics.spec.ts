import platformNetworkAdapter from '../main';
import { UI_API_BASE_URI } from '../uiapi-base';
import { buildResourceRequest } from './test-utils';
import tokenBucket from '../token-bucket';

import { instrumentation } from '../instrumentation';

const instrumentationSpies = {
    networkRateLimitExceeded: jest.spyOn(instrumentation, 'networkRateLimitExceeded'),
};

tokenBucket.take = jest.fn();
beforeEach(() => {
    instrumentationSpies.networkRateLimitExceeded.mockClear();
    tokenBucket.take.mockClear();
});
describe('rate limiting event', () => {
    it('increments rate limit counter when the network calls exceeds bucket capacity', async () => {
        tokenBucket.take
            .mockReturnValueOnce(true)
            .mockReturnValueOnce(true)
            .mockReturnValueOnce(false);

        const request = {
            method: 'get',
            baseUri: UI_API_BASE_URI,
            basePath: `/records/1234`,
            urlParams: {
                recordId: '1234',
            },
            queryParams: {
                fields: ['Id'],
            },
        };
        const returnValue = {
            status: 200,
            body: {},
        };
        const fn = jest.fn().mockResolvedValue(returnValue);

        for (let i = 0; i < 3; i++) {
            await platformNetworkAdapter(fn)(buildResourceRequest(request));
        }
        expect(instrumentationSpies.networkRateLimitExceeded).toHaveBeenCalledTimes(1);
    });
});
