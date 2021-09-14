import { ResourceRequest } from '@luvio/engine';
import platformNetworkAdapter from '../main';
import { buildResourceRequest } from './test-utils';

function testControllerInput(request: Partial<ResourceRequest>, expectedResponseBody?) {
    test('invokes the right controller', async () => {
        const fn = jest
            .fn()
            .mockResolvedValueOnce(
                expectedResponseBody ? { body: expectedResponseBody } : { body: {} }
            );
        const fullReq = buildResourceRequest(request);
        await platformNetworkAdapter(fn)(fullReq);

        expect(fn).toHaveBeenCalledWith(fullReq);
    });
}

function testRejectFetchResponse(request: Partial<ResourceRequest>) {
    test('rejects an instance of FetchError the controller throws', async () => {
        const fn = jest.fn().mockRejectedValueOnce({
            data: {
                statusCode: 400,
                message: 'Invalid request',
            },
        });

        const { rejects } = await expect(platformNetworkAdapter(fn)(buildResourceRequest(request)));

        rejects.toMatchObject({
            status: 400,
            body: {
                statusCode: 400,
                message: 'Invalid request',
            },
        });
    });
}

function testResolveResponse(request: Partial<ResourceRequest>, response: any) {
    test('resolves the controller response', async () => {
        const returnValue = {
            status: 200,
            body: response,
        };
        const fn = jest.fn().mockResolvedValueOnce(returnValue);
        const res = await platformNetworkAdapter(fn)(buildResourceRequest(request));

        expect(res).toBe(returnValue);
    });
}

describe('routes', () => {
    describe('get /some-random/{api}', () => {
        testControllerInput({
            method: 'get',
            baseUri: '/base-uri',
            basePath: '/some-random/api',
            urlParams: {
                api: 'api',
            },
        });

        testRejectFetchResponse({
            method: 'get',
            baseUri: '/base-uri',
            basePath: '/some-random/api',
            urlParams: {
                api: 'api',
            },
        });

        testResolveResponse(
            {
                method: 'get',
                baseUri: '/base-uri',
                basePath: '/some-random/api',
                urlParams: {
                    api: 'api',
                },
            },
            {
                id: 'hello',
                title: 'world',
            }
        );
    });
});
