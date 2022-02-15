import {
    createResourceRequest as resources_postConnectInteractionRuntimeNavigateFlow_createResourceRequest,
    getResponseCacheKeys,
} from '../generated/resources/postConnectInteractionRuntimeNavigateFlow';
import type {
    Luvio as $64$luvio_engine_Luvio,
    DispatchResourceRequestContext,
} from '@luvio/engine';
import type { FlowRuntimeResponseRepresentation as types_FlowRuntimeResponseRepresentation_FlowRuntimeResponseRepresentation } from '../generated/types/FlowRuntimeResponseRepresentation';
import { deepFreeze } from '../generated/types/FlowRuntimeResponseRepresentation';
import type { NavigateFlowConfig } from '../generated/adapters/navigateFlow';
import {
    createResourceParams,
    navigateFlow_ConfigPropertyNames,
    validateAdapterConfig,
} from '../generated/adapters/navigateFlow';

export { adapterName } from '../generated/adapters/navigateFlow';

export function buildNetworkSnapshot(
    luvio: $64$luvio_engine_Luvio,
    config: NavigateFlowConfig,
    context?: DispatchResourceRequestContext
): Promise<types_FlowRuntimeResponseRepresentation_FlowRuntimeResponseRepresentation> {
    const resourceParams = createResourceParams(config);
    const request =
        resources_postConnectInteractionRuntimeNavigateFlow_createResourceRequest(resourceParams);
    return luvio
        .dispatchResourceRequest<types_FlowRuntimeResponseRepresentation_FlowRuntimeResponseRepresentation>(
            request,
            context
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
