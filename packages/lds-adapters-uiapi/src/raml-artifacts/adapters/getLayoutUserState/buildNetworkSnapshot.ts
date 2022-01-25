import {
    Snapshot,
    ResourceRequestOverride,
    Luvio,
    FetchResponse,
    ResourceResponse,
} from '@luvio/engine';
import {
    RecordLayoutUserStateRepresentation,
    keyBuilder,
} from '../../../generated/types/RecordLayoutUserStateRepresentation';
import { GetLayoutUserStateConfig } from './getLayoutUserStateConfig';
import { default as resources_getUiApiLayoutUserStateByObjectApiName_default } from '../../../generated/resources/getUiApiLayoutUserStateByObjectApiName';
import { buildInMemorySnapshot } from './buildInMemorySnapshot';
import { ingest } from '../../../generated/types/RecordLayoutUserStateRepresentation';

export function buildNetworkSnapshot(
    luvio: Luvio,
    config: GetLayoutUserStateConfig,
    override?: ResourceRequestOverride
): Promise<Snapshot<RecordLayoutUserStateRepresentation>> {
    const { request, key } = prepareRequest(config);

    return luvio
        .dispatchResourceRequest<RecordLayoutUserStateRepresentation>(request, override)
        .then(
            (response) => {
                return onResourceResponseSuccess(luvio, config, key, response);
            },
            (error: FetchResponse<unknown>) => {
                return onResourceResponseError(luvio, config, key, error);
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
    const snapshot = buildInMemorySnapshot(luvio, config);
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

    const request = resources_getUiApiLayoutUserStateByObjectApiName_default({
        urlParams: { objectApiName: config.objectApiName },
        queryParams: {
            layoutType: config.layoutType,
            mode: config.mode,
            recordTypeId: config.recordTypeId,
        },
    });

    return { request, key };
}
