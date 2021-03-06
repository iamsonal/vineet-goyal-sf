import type {
    AdapterFactory,
    Luvio,
    FetchResponse,
    FulfilledSnapshot,
    StoreLookup,
    Snapshot,
    AdapterRequestContext,
    CoercedAdapterRequestContext,
    DispatchResourceRequestContext,
} from '@luvio/engine';

import type { RecordCollectionRepresentation } from '../../generated/types/RecordCollectionRepresentation';
import type { AdapterValidationConfig } from '../../generated/adapters/adapter-utils';
import { untrustedIsObject } from '../../generated/adapters/adapter-utils';
import type { GetLookupRecordsConfig } from '../../generated/adapters/getLookupRecords';
import { validateAdapterConfig } from '../../generated/adapters/getLookupRecords';
import type { FieldId } from '../../primitives/FieldId';
import { getFieldId } from '../../primitives/FieldId';
import { isSpanningRecord } from '../../selectors/record';
import type { ObjectId } from '../../primitives/ObjectId';
import type { ResourceRequestConfig } from '../../generated/resources/getUiApiLookupsByFieldApiNameAndObjectApiNameAndTargetApiName';
import getLookupRecordsResourceRequest, {
    keyBuilder,
    getResponseCacheKeys,
} from '../../generated/resources/getUiApiLookupsByFieldApiNameAndObjectApiNameAndTargetApiName';
import { deepFreeze } from '../../util/deep-freeze';
import type { RecordRepresentation } from '../../generated/types/RecordRepresentation';
import { isPromise } from '../../util/promise';

interface GetLookupRecordsConfigRequestParams {
    q?: string;
    page?: number;
    pageSize?: number;
    dependentFieldBindings?: string[];
    searchType?: 'Recent' | 'Search' | 'TypeAhead';
    sourceRecordId?: string;
}

interface GetLookupRecordsAdapterConfig {
    fieldApiName: string | FieldId;
    targetApiName: string | ObjectId;
    requestParams?: GetLookupRecordsConfigRequestParams;
}

const paramNames: AdapterValidationConfig = {
    displayName: 'getLookupRecords',
    parameters: {
        required: ['fieldApiName', 'targetApiName'],
        optional: ['requestParams'],
    },
};

function coerceRequestParams(untrusted: unknown): GetLookupRecordsConfigRequestParams {
    if (!untrustedIsObject<GetLookupRecordsAdapterConfig>(untrusted)) {
        return {};
    }
    const coercedConfig: GetLookupRecordsConfigRequestParams = {};
    const requestParams = untrusted.requestParams || {};
    const dependentFieldBindings = requestParams.dependentFieldBindings;
    if (dependentFieldBindings !== undefined) {
        coercedConfig.dependentFieldBindings = dependentFieldBindings;
    }

    const page = requestParams.page;
    if (page !== undefined) {
        coercedConfig.page = page;
    }

    const pageSize = requestParams.pageSize;
    if (pageSize !== undefined) {
        coercedConfig.pageSize = pageSize;
    }

    const q = requestParams.q;
    if (q !== undefined) {
        coercedConfig.q = q;
    }

    const searchType = requestParams.searchType;
    if (searchType !== undefined) {
        coercedConfig.searchType = searchType;
    }

    const sourceRecordId = requestParams.sourceRecordId;
    if (sourceRecordId !== undefined) {
        coercedConfig.sourceRecordId = sourceRecordId;
    }

    return coercedConfig;
}

function coerceConfigWithDefaults(untrusted: unknown): GetLookupRecordsConfig | null {
    const config = validateAdapterConfig(untrusted, paramNames);
    if (config === null) {
        return config;
    }

    const coercedRequestParams = coerceRequestParams(untrusted);
    const { objectApiName, fieldApiName } = getFieldId(config.fieldApiName);

    return {
        ...config,
        objectApiName,
        fieldApiName,
        ...coercedRequestParams,
    };
}

function removeEtags(recordRep: RecordRepresentation) {
    const { fields } = recordRep;

    delete (recordRep as Partial<RecordRepresentation>).eTag;
    delete (recordRep as Partial<RecordRepresentation>).weakEtag;

    Object.keys(fields).forEach((fieldName) => {
        const { value: nestedValue } = fields[fieldName];
        if (isSpanningRecord(nestedValue)) {
            removeEtags(nestedValue);
        }
    });
}

export function buildNetworkSnapshot(
    luvio: Luvio,
    config: GetLookupRecordsConfig,
    options?: DispatchResourceRequestContext
) {
    const { objectApiName, fieldApiName, targetApiName } = config;
    const resourceParams: ResourceRequestConfig = {
        urlParams: {
            objectApiName,
            fieldApiName,
            targetApiName,
        },
        queryParams: {
            page: config.page,
            pageSize: config.pageSize,
            q: config.q,
            searchType: config.searchType,
            dependentFieldBindings: config.dependentFieldBindings,
            sourceRecordId: config.sourceRecordId,
        },
    };
    const request = getLookupRecordsResourceRequest(resourceParams);

    return luvio.dispatchResourceRequest<RecordCollectionRepresentation>(request, options).then(
        (response) => {
            return luvio.handleSuccessResponse(
                () => {
                    // TODO [W-7235112]: remove this hack to never ingest lookup responses that
                    // avoids issues caused by them not being real RecordRepresentations
                    const key = keyBuilder(resourceParams);
                    const { body } = response;
                    const { records } = body;
                    for (let i = 0, len = records.length; i < len; i += 1) {
                        removeEtags(records[i]);
                    }
                    deepFreeze(body);
                    return {
                        state: 'Fulfilled',
                        recordId: key,
                        variables: {},
                        seenRecords: {},
                        select: {
                            recordId: key,
                            node: {
                                kind: 'Fragment',
                            },
                            variables: {},
                        },
                        data: body,
                    } as FulfilledSnapshot<RecordCollectionRepresentation, {}>;
                },
                () => {
                    return getResponseCacheKeys(resourceParams, response.body);
                }
            );
        },
        (err: FetchResponse<unknown>) => {
            return luvio.handleErrorResponse(() => {
                return luvio.errorSnapshot(err);
            });
        }
    );
}

type BuildSnapshotContext = {
    config: GetLookupRecordsConfig;
    luvio: Luvio;
};

function buildCachedSnapshot(
    _context: BuildSnapshotContext,
    _storeLookup: StoreLookup<RecordCollectionRepresentation>
): undefined {
    return;
}

function buildNetworkSnapshotCachePolicy(
    context: BuildSnapshotContext,
    coercedAdapterRequestContext: CoercedAdapterRequestContext
): Promise<Snapshot<RecordCollectionRepresentation>> {
    const { networkPriority, requestCorrelator } = coercedAdapterRequestContext;

    const dispatchOptions: DispatchResourceRequestContext = {
        resourceRequestContext: {
            requestCorrelator,
        },
    };

    if (networkPriority !== 'normal') {
        dispatchOptions.overrides = {
            priority: networkPriority,
        };
    }
    return buildNetworkSnapshot(context.luvio, context.config, dispatchOptions);
}

export const factory: AdapterFactory<GetLookupRecordsConfig, RecordCollectionRepresentation> = (
    luvio: Luvio
) => {
    return (
        untrustedConfig: unknown,
        requestContext?: AdapterRequestContext
    ):
        | Promise<Snapshot<RecordCollectionRepresentation>>
        | Snapshot<RecordCollectionRepresentation>
        | null => {
        const config = coerceConfigWithDefaults(untrustedConfig);
        if (config === null) {
            return null;
        }

        const refresh = {
            config,
            resolve: () => buildNetworkSnapshot(luvio, config),
        };

        const promiseOrSnapshot = luvio.applyCachePolicy(
            requestContext || {},
            { config, luvio },
            buildCachedSnapshot,
            buildNetworkSnapshotCachePolicy
        );

        if (isPromise(promiseOrSnapshot)) {
            return promiseOrSnapshot.then((snapshot) => {
                snapshot.refresh = refresh;
                return snapshot;
            });
        }

        promiseOrSnapshot.refresh = refresh;
        return promiseOrSnapshot;
    };
};
