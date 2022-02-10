import {
    createResourceRequest as resources_postConnectInteractionRuntimeStartFlow_createResourceRequest,
    getResponseCacheKeys,
} from '../generated/resources/postConnectInteractionRuntimeStartFlow';
import type {
    Luvio as $64$luvio_engine_Luvio,
    ResourceRequestOverride as $64$luvio_engine_ResourceRequestOverride,
} from '@luvio/engine';
import type { FlowRuntimeResponseRepresentation as types_FlowRuntimeResponseRepresentation_FlowRuntimeResponseRepresentation } from '../generated/types/FlowRuntimeResponseRepresentation';
import { deepFreeze } from '../generated/types/FlowRuntimeResponseRepresentation';
import type { StartFlowConfig } from '../generated/adapters/startFlow';
import {
    createResourceParams,
    validateAdapterConfig,
    startFlow_ConfigPropertyNames,
} from '../generated/adapters/startFlow';

export { adapterName } from '../generated/adapters/startFlow';

export function buildNetworkSnapshot(
    luvio: $64$luvio_engine_Luvio,
    config: StartFlowConfig,
    override?: $64$luvio_engine_ResourceRequestOverride
): Promise<types_FlowRuntimeResponseRepresentation_FlowRuntimeResponseRepresentation> {
    const resourceParams = createResourceParams(config);
    const request =
        resources_postConnectInteractionRuntimeStartFlow_createResourceRequest(resourceParams);
    return luvio
        .dispatchResourceRequest<types_FlowRuntimeResponseRepresentation_FlowRuntimeResponseRepresentation>(
            request,
            override
        )
        .then(
            (response: any) => {
                return luvio.handleSuccessResponse(
                    () => {
                        deepFreeze(response.body);
                        return response.body;
                    },
                    () => {
                        return getResponseCacheKeys(resourceParams, response.body);
                    }
                );
            },
            (response: any) => {
                return luvio.handleErrorResponse(() => {
                    // We want to throw these exceptions to be caught in the runtime layer
                    // eslint-disable-next-line @salesforce/lds/no-error-in-production
                    throw new Error(response.body.message || response.body.error || response.body);
                });
            }
        );
}

export const startFlowAdapterFactory: any = (luvio: $64$luvio_engine_Luvio) =>
    function flowRuntime__startFlow(
        untrustedConfig: unknown
    ): Promise<types_FlowRuntimeResponseRepresentation_FlowRuntimeResponseRepresentation> | null {
        const config = validateAdapterConfig(untrustedConfig, startFlow_ConfigPropertyNames);

        // Invalid or incomplete config
        if (config === null) {
            return null;
        }

        return buildNetworkSnapshot(luvio, config);
    };
