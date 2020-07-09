// so eslint doesn't complain about nimbus
/* global __nimbus */

import { ResourceRequest, FetchResponse, NetworkAdapter } from '@ldsjs/engine';

import { buildNimbusNetworkPluginRequest, buildLdsResponse } from './networkUtils';

export const NimbusNetworkAdapter: NetworkAdapter = (
    request: ResourceRequest
): Promise<FetchResponse<any>> => {
    return new Promise((resolve, reject) => {
        __nimbus.plugins.LdsNetworkAdapter.sendRequest(
            buildNimbusNetworkPluginRequest(request),
            response => {
                const ldsResponse = buildLdsResponse(response);

                if (ldsResponse.ok) {
                    resolve(ldsResponse);
                } else {
                    reject(ldsResponse);
                }
            },
            error => {
                reject(JSON.parse(error) as FetchResponse<any>);
            }
        );
    });
};
