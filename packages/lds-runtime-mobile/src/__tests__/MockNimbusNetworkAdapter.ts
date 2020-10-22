import { NetworkAdapter, Request, Response } from '@mobileplatform/nimbus-plugin-lds';

export function mockNimbusNetworkGlobal(adapter: MockNimbusAdapter) {
    global.__nimbus = {
        ...(global.__nimbus ?? {}),
        plugins: {
            ...(global.__nimbus?.plugins ?? {}),
            LdsNetworkAdapter: adapter,
        },
    } as any;
}

export class MockNimbusAdapter implements NetworkAdapter {
    mockResponse: Response;

    setMockResponse(mockResponse: Response) {
        this.mockResponse = mockResponse;
    }
    sendRequest(
        request: Request,
        onResponse: (response: Response) => void,
        _onError: (error: string) => void
    ): Promise<string> {
        onResponse(this.mockResponse);
        return Promise.resolve('mocked cancel token');
    }
    cancelRequest(_token: string): void {
        throw new Error('Method not implemented.');
    }
}
