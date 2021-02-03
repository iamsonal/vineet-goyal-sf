import { mockNimbusNetworkGlobal, MockNimbusAdapter } from './MockNimbusNetworkAdapter';
import { NimbusNetworkAdapter as network } from '../NimbusNetworkAdapter';

describe('NimbusNetworkAdapter tests', () => {
    it('filters out empty arrays from query params', () => {
        const sendSpy = jest.fn();
        const mock = new MockNimbusAdapter();
        mock.sendRequest = sendSpy;
        mockNimbusNetworkGlobal(mock);
        const originalQueryParams = {
            A: 'a',
            B: 2,
            C: ['c', 'cc', 'ccc'],
            D: [],
        };
        network({
            method: 'get',
            body: undefined,
            basePath: '',
            baseUri: '',
            urlParams: {},
            headers: {},
            queryParams: originalQueryParams,
        });

        const queryParams = sendSpy.mock.calls[0][0].queryParams;

        expect(queryParams['A']).toEqual('a');
        expect(queryParams['B']).toEqual('2');
        expect(queryParams['C']).toEqual('c,cc,ccc');
        expect(queryParams['D']).toBeUndefined();
    });
});
