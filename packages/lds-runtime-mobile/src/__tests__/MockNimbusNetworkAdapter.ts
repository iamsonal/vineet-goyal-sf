import { NetworkAdapter, NetworkError, Request, Response } from '@mobileplatform/nimbus-plugin-lds';

export function mockNimbusNetworkGlobal(adapter: MockNimbusAdapter) {
    global.__nimbus = {
        ...(global.__nimbus || {}),
        plugins: {
            ...(global.__nimbus?.plugins || {}),
            LdsNetworkAdapter: adapter,
        },
    } as any;
}

export class MockNimbusAdapter implements NetworkAdapter {
    private mockResponses: Response[] = [];
    public sentRequests: Request[] = [];

    setMockResponse(mockResponse: Response) {
        this.mockResponses = [mockResponse];
    }

    setMockResponses(mockResponses: Response[]) {
        this.mockResponses = mockResponses;
    }

    sendRequest(
        request: Request,
        onResponse: (response: Response) => void,
        onError: (error: NetworkError) => void
    ): Promise<string> {
        this.sentRequests.push(request);
        const mockResponse = this.mockResponses.shift();
        if (mockResponse === undefined) {
            onError({ type: 'unspecified', message: 'response not set' });
        } else {
            onResponse(mockResponse);
        }
        return Promise.resolve('mocked cancel token');
    }

    cancelRequest(_token: string): void {
        throw new Error('Method not implemented.');
    }
}
