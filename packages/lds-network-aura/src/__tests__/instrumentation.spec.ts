import * as aura from 'aura';
import networkAdapter from '../main';
import { UI_API_BASE_URI } from '../middlewares/uiapi-base';
import { buildResourceRequest, ERROR_RESPONSE } from './test-utils';
import { instrumentation } from '../instrumentation';

const instrumentationSpies = {
    networkRequest: jest.spyOn(instrumentation, 'networkRequest'),
    networkResponse: jest.spyOn(instrumentation, 'networkResponse'),
};

afterEach(() => {
    jest.resetAllMocks();
});

describe('instrumentation', () => {
    const mockRequest = {
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
    const mockResponse = {
        id: '1234',
        fields: {
            Id: {
                value: '1234',
            },
        },
        apiName: 'Foo',
    };
    describe('networkRequest', () => {
        it('is called when a network request is made', async () => {
            jest.spyOn(aura, 'executeGlobalController').mockResolvedValueOnce(mockResponse);
            await networkAdapter(buildResourceRequest(mockRequest));

            expect(instrumentationSpies.networkRequest).toHaveBeenCalledTimes(1);
        });
    });
    describe('networkResponse', () => {
        it('is called when a successful response is returned', async () => {
            jest.spyOn(aura, 'executeGlobalController').mockResolvedValueOnce(mockResponse);
            await networkAdapter(buildResourceRequest(mockRequest));

            expect(instrumentationSpies.networkResponse).toHaveBeenCalledTimes(1);
            expect(instrumentationSpies.networkResponse).toHaveBeenCalledWith(expect.any(Function));
        });
        it('is called when an error response is returned', async () => {
            jest.spyOn(aura, 'executeGlobalController').mockRejectedValueOnce(ERROR_RESPONSE);
            try {
                await networkAdapter(buildResourceRequest(mockRequest));
                fail('network adapter should throw error');
            } catch (err) {
                expect(instrumentationSpies.networkResponse).toHaveBeenCalledTimes(1);
                expect(instrumentationSpies.networkResponse).toHaveBeenCalledWith(
                    expect.any(Function)
                );
            }
        });
    });
});
