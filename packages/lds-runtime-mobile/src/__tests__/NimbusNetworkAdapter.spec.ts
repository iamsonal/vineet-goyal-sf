import { mockNimbusNetworkGlobal, MockNimbusNetworkAdapter } from './MockNimbusNetworkAdapter';
import { NimbusNetworkAdapter as network } from '../network/NimbusNetworkAdapter';

describe('NimbusNetworkAdapter tests', () => {
    it('filters out empty arrays from query params', () => {
        const sendSpy = jest.fn();
        const mock = new MockNimbusNetworkAdapter();
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
            priority: 'normal',
        });

        const queryParams = sendSpy.mock.calls[0][0].queryParams;

        expect(queryParams['A']).toEqual('a');
        expect(queryParams['B']).toEqual('2');
        expect(queryParams['C']).toEqual('c,cc,ccc');
        expect(queryParams['D']).toBeUndefined();
    });

    it('passes the observability context as null when not given', () => {
        // Arrange
        const sendSpy = jest.fn();
        const mock = new MockNimbusNetworkAdapter();
        mock.sendRequest = sendSpy;
        mockNimbusNetworkGlobal(mock);
        network({
            method: 'get',
            body: undefined,
            basePath: '',
            baseUri: '',
            urlParams: {},
            headers: {},
            queryParams: {},
            priority: 'normal',
        });

        // Act
        const { observabilityContext } = sendSpy.mock.calls[0][0];

        // Assert
        expect(observabilityContext).toEqual(null);
    });

    it('passes the observability context', () => {
        // Arrange
        const sendSpy = jest.fn();
        const mock = new MockNimbusNetworkAdapter();
        mock.sendRequest = sendSpy;
        mockNimbusNetworkGlobal(mock);
        network(
            {
                method: 'get',
                body: undefined,
                basePath: '',
                baseUri: '',
                urlParams: {},
                headers: {},
                queryParams: {},
                priority: 'normal',
            },
            {
                requestCorrelator: {
                    observabilityContext: 'foo',
                },
            }
        );

        // Act
        const { observabilityContext } = sendSpy.mock.calls[0][0];

        // Assert
        expect(observabilityContext).toEqual('foo');
    });
});
