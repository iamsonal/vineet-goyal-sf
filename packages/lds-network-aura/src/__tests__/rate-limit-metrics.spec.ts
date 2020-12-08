import * as aura from 'aura';
import networkAdapter from '../main';
import { UI_API_BASE_URI } from '../middlewares/uiapi-base';
import { buildResourceRequest } from './test-utils';
import timekeeper from 'timekeeper';

jest.mock('@salesforce/lds-instrumentation', () => {
    const spies = {
        logCRUDLightningInteraction: jest.fn(),
        incrementNetworkRateLimitExceededCount: jest.fn(),
    };

    return {
        incrementGetRecordAggregateInvokeCount: () => {},
        incrementGetRecordNormalInvokeCount: () => {},
        registerLdsCacheStats: () => {},
        incrementNetworkRateLimitExceededCount: spies.incrementNetworkRateLimitExceededCount,
        __spies: spies,
    };
});

import { __spies as instrumentationSpies } from '@salesforce/lds-instrumentation';

describe('rate limiting event', () => {
    beforeEach(() => {
        instrumentationSpies.logCRUDLightningInteraction.mockClear();
        instrumentationSpies.incrementNetworkRateLimitExceededCount.mockClear();
        timekeeper.travel(Date.now() + 1000);
    });
    it('increments rate limit counter when the network calls exceeds bucket capacity', async () => {
        const BUCKET_SIZE = 100;
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
        for (let i = 0; i < BUCKET_SIZE + 1; i++) {
            networkAdapter(buildResourceRequest(request));
        }
        expect(instrumentationSpies.incrementNetworkRateLimitExceededCount).toHaveBeenCalledTimes(
            1
        );
    });
    it("doesn't increment rate limit counter when next call is made after a second so the bucket is refilled to capacity", async () => {
        const BUCKET_SIZE = 100;
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
        for (let i = 1; i < BUCKET_SIZE; i++) {
            networkAdapter(buildResourceRequest(request));
        }
        expect(instrumentationSpies.incrementNetworkRateLimitExceededCount).toHaveBeenCalledTimes(
            0
        );

        timekeeper.travel(Date.now() + 1000);
        for (let i = 0; i < BUCKET_SIZE; i++) {
            networkAdapter(buildResourceRequest(request));
        }
        expect(instrumentationSpies.incrementNetworkRateLimitExceededCount).toHaveBeenCalledTimes(
            0
        );
    });
});
