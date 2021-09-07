import { createResourceRequest as resources_postConnectInteractionRuntimeNavigateFlowByFlowDevName_createResourceRequest } from '../generated/resources/postConnectInteractionRuntimeNavigateFlowByFlowDevName';
import {
    Luvio as $64$luvio_engine_Luvio,
    ResourceRequestOverride as $64$luvio_engine_ResourceRequestOverride,
} from '@luvio/engine';
import {
    FlowRuntimeResponseRepresentation as types_FlowRuntimeResponseRepresentation_FlowRuntimeResponseRepresentation,
    deepFreeze,
} from '../generated/types/FlowRuntimeResponseRepresentation';
import {
    NavigateFlowConfig,
    createResourceParams,
    navigateFlow_ConfigPropertyNames,
    validateAdapterConfig,
} from '../generated/adapters/navigateFlow';

export { adapterName } from '../generated/adapters/navigateFlow';

export function buildNetworkSnapshot(
    luvio: $64$luvio_engine_Luvio,
    config: NavigateFlowConfig,
    override?: $64$luvio_engine_ResourceRequestOverride
): Promise<types_FlowRuntimeResponseRepresentation_FlowRuntimeResponseRepresentation> {
    const resourceParams = createResourceParams(config);
    const request =
        resources_postConnectInteractionRuntimeNavigateFlowByFlowDevName_createResourceRequest(
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
                // We want to throw these exceptions to be caught in the runtime layer
                // eslint-disable-next-line @salesforce/lds/no-error-in-production
                throw new Error(response.body.message || response.body.error || response.body);
            }
        );
}

export const navigateFlowAdapterFactory: any = (luvio: $64$luvio_engine_Luvio) =>
    function flowRuntime__navigateFlow(
        untrustedConfig: unknown
    ): Promise<types_FlowRuntimeResponseRepresentation_FlowRuntimeResponseRepresentation> | null {
        const config = validateAdapterConfig(untrustedConfig, navigateFlow_ConfigPropertyNames);

        // Invalid or incomplete config
        if (config === null) {
            return null;
        }

        return buildNetworkSnapshot(luvio, config);
    };
