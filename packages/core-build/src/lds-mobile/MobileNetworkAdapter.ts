import { ResourceRequest, FetchResponse, NetworkAdapter } from '@ldsjs/engine';

/* eslint-disable no-implicit-globals */
declare global {
    namespace __nimbus {
        namespace plugins {
            namespace lds {
                function network(
                    request: ResourceRequest,
                    callback: (response: FetchResponse<any>) => void,
                    error: (response: FetchResponse<any>) => void
                ): any;
            }
        }
    }
}

export const BridgeNetworkProvider: NetworkAdapter = (
    request: ResourceRequest
): Promise<FetchResponse<any>> => {
    return new Promise((resolve, reject) => {
        __nimbus.plugins.lds.network(
            request,
            (response: FetchResponse<any>) => {
                resolve(response);
            },
            (error: FetchResponse<any>) => {
                reject(error);
            }
        );
    });
};
