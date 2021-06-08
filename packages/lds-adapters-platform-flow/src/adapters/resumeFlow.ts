import { createResourceRequest as resources_postConnectInteractionRuntimeResumeFlowByFlowDevName_createResourceRequest } from '../generated/resources/postConnectInteractionRuntimeResumeFlowByFlowDevName';
import {
    Luvio as $64$luvio_engine_Luvio,
    ResourceRequestOverride as $64$luvio_engine_ResourceRequestOverride,
} from '@luvio/engine';
import {
    FlowRuntimeResponseRepresentation as types_FlowRuntimeResponseRepresentation_FlowRuntimeResponseRepresentation,
    deepFreeze,
} from '../generated/types/FlowRuntimeResponseRepresentation';
import {
    ResumeFlowConfig,
    createResourceParams,
    resumeFlow_ConfigPropertyNames,
    validateAdapterConfig,
} from '../generated/adapters/resumeFlow';

export { adapterName } from '../generated/adapters/resumeFlow';

export function buildNetworkSnapshot(
    luvio: $64$luvio_engine_Luvio,
    config: ResumeFlowConfig,
    override?: $64$luvio_engine_ResourceRequestOverride
): Promise<types_FlowRuntimeResponseRepresentation_FlowRuntimeResponseRepresentation> {
    const resourceParams = createResourceParams(config);
    const request =
        resources_postConnectInteractionRuntimeResumeFlowByFlowDevName_createResourceRequest(
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
                throw new Error(response.body.message || response.body);
            }
        );
}

export const resumeFlowAdapterFactory: any = (luvio: $64$luvio_engine_Luvio) =>
    function flowRuntime__resumeFlow(
        untrustedConfig: unknown
    ): Promise<types_FlowRuntimeResponseRepresentation_FlowRuntimeResponseRepresentation> | null {
        const config = validateAdapterConfig(untrustedConfig, resumeFlow_ConfigPropertyNames);

        // Invalid or incomplete config
        if (config === null) {
            return null;
        }

        return buildNetworkSnapshot(luvio, config);
    };