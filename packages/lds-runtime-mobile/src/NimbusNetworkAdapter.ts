import { ResourceRequest, FetchResponse, NetworkAdapter } from '@ldsjs/engine';

// TODO - the lds network nimbus plugin will export and publish it's TS interface
// and then this global declaration can go away
/* eslint-disable no-implicit-globals */
declare global {
    namespace __nimbus {
        namespace plugins {
            namespace LdsNetworkPlugin {
                function makeNetworkRequest(
                    request: ResourceRequest,
                    callback: (response: string) => void,
                    error: (response: string) => void
                ): any;
            }
        }
    }
}

export const NimbusNetworkAdapter: NetworkAdapter = (
    request: ResourceRequest
): Promise<FetchResponse<any>> => {
    return new Promise((resolve, reject) => {
        __nimbus.plugins.LdsNetworkPlugin.makeNetworkRequest(
            request,
            // TODO - once lds nimbus plugins go 2.0 this will change to not be a string
            // but instead be some sort of lds-network-response shape and that response
            // shape won't have to be parsed
            (response: string) => {
                const parsedResponse = JSON.parse(response);
                // the body is stringified (native-side network never parses it)
                const returnResponse = { ...parsedResponse, body: JSON.parse(parsedResponse.body) };

                if (parsedResponse.ok) {
                    resolve(returnResponse);
                } else {
                    reject(returnResponse);
                }
            },
            (error: string) => {
                reject(JSON.parse(error) as FetchResponse<any>);
            }
        );
    });
};
