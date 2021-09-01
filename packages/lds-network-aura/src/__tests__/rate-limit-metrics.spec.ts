import * as aura from 'aura';
import networkAdapter from '../main';
import { UI_API_BASE_URI } from '../middlewares/uiapi-base';
import { buildResourceRequest } from './test-utils';
import tokenBucket from '../utils/tokenBucket';

jest.mock('@salesforce/lds-instrumentation', () => {
    return {
        registerLdsCacheStats: () => {},
    };
});

import { instrumentation } from '../instrumentation';

const instrumentationSpies = {
    logCrud: jest.spyOn(instrumentation, 'logCrud'),
    getRecordAggregateInvoke: jest.spyOn(instrumentation, 'getRecordAggregateInvoke'),
    getRecordAggregateRetry: jest.spyOn(instrumentation, 'getRecordAggregateRetry'),
    getRecordNormalInvoke: jest.spyOn(instrumentation, 'getRecordNormalInvoke'),
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

        jest.spyOn(aura, 'executeGlobalController').mockReturnValue(Promise.resolve());
        for (let i = 0; i < 3; i++) {
            networkAdapter(buildResourceRequest(request));
        }
        expect(instrumentationSpies.networkRateLimitExceeded).toHaveBeenCalledTimes(1);
    });
});
