import type {
    Snapshot,
    DispatchResourceRequestContext,
    Luvio,
    FetchResponse,
    ResourceResponse,
} from '@luvio/engine';
import type { RecordLayoutUserStateRepresentation } from '../../../generated/types/RecordLayoutUserStateRepresentation';
import { keyBuilder } from '../../../generated/types/RecordLayoutUserStateRepresentation';
import type { GetLayoutUserStateConfig } from './getLayoutUserStateConfig';

import {
    default as resources_getUiApiLayoutUserStateByObjectApiName_default,
    getResponseCacheKeys,
} from '../../../generated/resources/getUiApiLayoutUserStateByObjectApiName';
import { buildCachedSnapshot } from './buildCachedSnapshot';

import { ingest } from '../../../generated/types/RecordLayoutUserStateRepresentation';

export function buildNetworkSnapshot(
    luvio: Luvio,
    config: GetLayoutUserStateConfig,
    context?: DispatchResourceRequestContext
): Promise<Snapshot<RecordLayoutUserStateRepresentation>> {
    const { resourceParams, request, key } = prepareRequest(config);

    return luvio
        .dispatchResourceRequest<RecordLayoutUserStateRepresentation>(request, context)
        .then(
            (response) => {
                return luvio.handleSuccessResponse(
                    () => {
                        return onResourceResponseSuccess(luvio, config, key, response);
                    },
                    () => {
                        return getResponseCacheKeys(resourceParams, response.body);
                    }
                );
            },
            (error: FetchResponse<unknown>) => {
                return luvio.handleErrorResponse(() =>
                    onResourceResponseError(luvio, config, key, error)
                );
            }
        );
}

function onResourceResponseSuccess(
    luvio: Luvio,
    config: GetLayoutUserStateConfig,
    key: string,
    response: ResourceResponse<RecordLayoutUserStateRepresentation>
) {
    const { body } = response;
    const { recordTypeId, layoutType, mode } = config;
    // Hack- adding in this params so record-ui will be able to use normed values.
    body.apiName = config.objectApiName;
    body.recordTypeId = recordTypeId;
    body.layoutType = layoutType;
    body.mode = mode;
    luvio.storeIngest<RecordLayoutUserStateRepresentation>(key, ingest, body);
    const snapshot = buildCachedSnapshot(luvio, config);
    luvio.storeBroadcast();
    return snapshot;
}

function onResourceResponseError(
    luvio: Luvio,
    config: GetLayoutUserStateConfig,
    key: string,
    error: FetchResponse<unknown>
) {
    const errorSnapshot = luvio.errorSnapshot(error, {
        config,
        resolve: () => buildNetworkSnapshot(luvio, config),
    });
    luvio.storeIngestError(key, errorSnapshot);
    luvio.storeBroadcast();
    return errorSnapshot;
}

function prepareRequest(config: GetLayoutUserStateConfig) {
    const { recordTypeId, layoutType, mode, objectApiName } = config;
    const key = keyBuilder({
        apiName: objectApiName,
        recordTypeId,
        layoutType,
        mode,
    });

    const resourceParams = {
        urlParams: { objectApiName: config.objectApiName },
        queryParams: {
            layoutType: config.layoutType,
            mode: config.mode,
            recordTypeId: config.recordTypeId,
        },
    };

    const request = resources_getUiApiLayoutUserStateByObjectApiName_default(resourceParams);

    return { resourceParams, request, key };
}
