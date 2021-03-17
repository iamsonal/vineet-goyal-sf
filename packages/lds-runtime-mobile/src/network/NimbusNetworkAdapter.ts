// so eslint doesn't complain about nimbus
/* global __nimbus */

import { ResourceRequest, FetchResponse, NetworkAdapter } from '@luvio/engine';
import { buildNimbusNetworkPluginRequest, buildLdsResponse } from './networkUtils';

import { idleDetector } from 'o11y/client';

const tasker = idleDetector.declareNotifierTaskMulti('NimbusNetworkAdapter');

export const NimbusNetworkAdapter: NetworkAdapter = (
    request: ResourceRequest
): Promise<FetchResponse<any>> => {
    tasker.add();
    return new Promise<FetchResponse<any>>((resolve, reject) => {
        try {
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
                    reject(`Network error: type: ${error.type}, message: ${error.message}`);
                }
            );
        } catch (error) {
            // don't leave promise hanging, catch any errors (eg: if native side
            // returns malformed response) and call reject
            reject(error);
        }
    }).finally(() => tasker.done());
};
