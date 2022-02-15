import {
    createResourceRequest as resources_postConnectInteractionRuntimeResumeFlow_createResourceRequest,
    getResponseCacheKeys,
} from '../generated/resources/postConnectInteractionRuntimeResumeFlow';
import type {
    Luvio as $64$luvio_engine_Luvio,
    DispatchResourceRequestContext,
} from '@luvio/engine';
import type { FlowRuntimeResponseRepresentation as types_FlowRuntimeResponseRepresentation_FlowRuntimeResponseRepresentation } from '../generated/types/FlowRuntimeResponseRepresentation';
import { deepFreeze } from '../generated/types/FlowRuntimeResponseRepresentation';
import type { ResumeFlowConfig } from '../generated/adapters/resumeFlow';
import {
    createResourceParams,
    resumeFlow_ConfigPropertyNames,
    validateAdapterConfig,
} from '../generated/adapters/resumeFlow';

export { adapterName } from '../generated/adapters/resumeFlow';

export function buildNetworkSnapshot(
    luvio: $64$luvio_engine_Luvio,
    config: ResumeFlowConfig,
    options?: DispatchResourceRequestContext
): Promise<types_FlowRuntimeResponseRepresentation_FlowRuntimeResponseRepresentation> {
    const resourceParams = createResourceParams(config);
    const request =
        resources_postConnectInteractionRuntimeResumeFlow_createResourceRequest(resourceParams);
    return luvio
        .dispatchResourceRequest<types_FlowRuntimeResponseRepresentation_FlowRuntimeResponseRepresentation>(
            request,
            options
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
