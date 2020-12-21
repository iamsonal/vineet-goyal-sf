import * as aura from 'aura';
import networkAdapter from '../main';
import { UI_API_BASE_URI } from '../middlewares/uiapi-base';
import { buildResourceRequest } from './test-utils';
import tokenBucket from '../utils/tokenBucket';

jest.mock('@salesforce/lds-instrumentation', () => {
    const spies = {
        incrementNetworkRateLimitExceededCount: jest.fn(),
    };

    return {
        incrementGetRecordNormalInvokeCount: () => {},
        registerLdsCacheStats: () => {},
        incrementNetworkRateLimitExceededCount: spies.incrementNetworkRateLimitExceededCount,
        __spies: spies,
    };
});

import { __spies as instrumentationSpies } from '@salesforce/lds-instrumentation';
tokenBucket.take = jest.fn();

describe('rate limiting event', () => {
    beforeEach(() => {
        instrumentationSpies.incrementNetworkRateLimitExceededCount.mockClear();
        tokenBucket.take.mockClear();
    });
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

        jest.spyOn(aura, 'executeGlobalController').mockReturnValue(Promise.resolve());
        for (let i = 0; i < 3; i++) {
            networkAdapter(buildResourceRequest(request));
        }
        expect(instrumentationSpies.incrementNetworkRateLimitExceededCount).toHaveBeenCalledTimes(
            1
        );
    });
});
