import { ResourceRequest } from '@luvio/engine';
import * as aura from 'aura';
import networkAdapter from '../main';
import { UI_API_BASE_URI } from '../middlewares/uiapi-base';

function buildResourceRequest(resourceRequest: Partial<ResourceRequest>): ResourceRequest {
    return {
        method: resourceRequest.method || 'get',
        baseUri: UI_API_BASE_URI,
        basePath: resourceRequest.basePath || '/test',
        body: resourceRequest.body || {},
        queryParams: resourceRequest.queryParams || {},
        urlParams: resourceRequest.urlParams || {},
        headers: resourceRequest.headers || {},
        ingest: (() => {}) as any,
        fulfill: resourceRequest.fulfill || undefined,
    };
}

beforeEach(() => {
    // Make sure to reset the executeGlobalController mock between each test.
    if (jest.isMockFunction(aura.executeGlobalController)) {
        aura.executeGlobalController.mockReset();
    }
});

describe('non-GET request', () => {
    it('does not dedupe non-GET requests', async () => {
        const request = buildResourceRequest({
            method: 'post',
            baseUri: '',
            basePath: '/records',
            body: {
                apiName: 'Test__c',
                fields: [],
            },
        });
        const fn = jest.spyOn(aura, 'executeGlobalController').mockImplementation(() => {
            return new Promise(resolve => {
                setTimeout(() =>
                    resolve({
                        id: '1234',
                        apiName: 'Test__c',
                        fields: {},
                    })
                );
            });
        });
        await Promise.all([networkAdapter(request), networkAdapter(request)]);
        expect(fn).toHaveBeenCalledTimes(2);
    });
});

describe('identical GET request', () => {
    it('dedupes inflight GET requests', async () => {
        const request = buildResourceRequest({ method: 'get', basePath: '/records/1234' });
        const fn = jest.spyOn(aura, 'executeGlobalController').mockImplementation(() => {
            return new Promise(resolve => {
                setTimeout(() => resolve({}));
            });
        });
        const [response1, response2] = await Promise.all([
            networkAdapter(request),
            networkAdapter(request),
        ]);

        expect(fn).toHaveBeenCalledTimes(1);
        // verify each response is a new copy
        expect(response1 === response2).toBe(false);
    });

    it('does not clone for non-deduped request', async () => {
        const request = buildResourceRequest({ method: 'get', basePath: '/records/1234' });
        const fn = jest.spyOn(aura, 'executeGlobalController').mockImplementation(() => {
            return new Promise(resolve => {
                setTimeout(() => resolve({}));
            });
        });

        const mockJsonParse = jest.spyOn(JSON, 'parse').mockImplementation(() => {});

        await networkAdapter(request);
        expect(fn).toHaveBeenCalledTimes(1);
        expect(mockJsonParse).toHaveBeenCalledTimes(0);

        mockJsonParse.mockRestore();
    });

    it('does not propagate mutation to deduped request', async () => {
        const request = buildResourceRequest({ method: 'get', basePath: '/records/1234' });
        const ret = { foo: 'bar' };
        const fn = jest.spyOn(aura, 'executeGlobalController').mockImplementation(() => {
            return new Promise(resolve => {
                setTimeout(() => resolve(ret));
            });
        });

        const [, response2] = await Promise.all([
            networkAdapter(request).then(res => {
                res.body.foo = 'mutated by first request';
            }),
            networkAdapter(request),
            networkAdapter(request).then(res => {
                res.body.foo = 'mutated by last request';
            }),
        ]);

        expect(fn).toHaveBeenCalledTimes(1);
        expect(response2.body.foo).toBe('bar');
    });
});

describe('identical GET request per fulfill', () => {
    it('dedupes inflight GET requests when fulfill returns true', async () => {
        const fn = jest.spyOn(aura, 'executeGlobalController').mockImplementation(() => {
            return new Promise(resolve => {
                setTimeout(() => resolve({}));
            });
        });

        const request1 = buildResourceRequest({ method: 'get', basePath: '/records/1234' });
        const request2 = buildResourceRequest({
            method: 'get',
            basePath: '/records/5678',
            fulfill: () => {
                return true;
            },
        });
        await Promise.all([networkAdapter(request1), networkAdapter(request2)]);

        expect(fn).toHaveBeenCalledTimes(1);
    });

    it('does not dedupe inflight GET requests when fulfill returns false', async () => {
        const fn = jest.spyOn(aura, 'executeGlobalController').mockImplementation(() => {
            return new Promise(resolve => {
                setTimeout(() => resolve({}));
            });
        });

        // providing fulfill() here to verify request2's fulfill() is used
        const request1 = buildResourceRequest({
            method: 'get',
            basePath: '/records/1234',
            fulfill: () => {
                return true;
            },
        });
        const request2 = buildResourceRequest({
            method: 'get',
            basePath: '/records/5678',
            fulfill: () => {
                return false;
            },
        });
        await Promise.all([networkAdapter(request1), networkAdapter(request2)]);

        expect(fn).toHaveBeenCalledTimes(2);
    });
});
