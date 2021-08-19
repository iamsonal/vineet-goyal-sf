import { createResourceRequest as resources_postConnectInteractionRuntimeStartFlowByFlowDevName_createResourceRequest } from '../generated/resources/postConnectInteractionRuntimeStartFlowByFlowDevName';
import {
    Luvio as $64$luvio_engine_Luvio,
    ResourceRequestOverride as $64$luvio_engine_ResourceRequestOverride,
} from '@luvio/engine';
import {
    FlowRuntimeResponseRepresentation as types_FlowRuntimeResponseRepresentation_FlowRuntimeResponseRepresentation,
    deepFreeze,
} from '../generated/types/FlowRuntimeResponseRepresentation';
import {
    StartFlowConfig,
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
        resources_postConnectInteractionRuntimeStartFlowByFlowDevName_createResourceRequest(
            resourceParams
        );
    return luvio
        .dispatchResourceRequest<types_FlowRuntimeResponseRepresentation_FlowRuntimeResponseRepresentation>(
            request,
            override
        )
        .then(
            (response: any) => {
                deepFreeze(response.body);
                return response.body;
            },
            (response: any) => {
                if (process.env.NODE_ENV !== 'production') {
                    throw new Error(response.body.message || response.body);
                }
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
