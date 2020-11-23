import { AdapterFactory, Luvio, FetchResponse, FulfilledSnapshot } from '@luvio/engine';

import { RecordCollectionRepresentation } from '../../generated/types/RecordCollectionRepresentation';
import {
    AdapterValidationConfig,
    untrustedIsObject,
    refreshable,
} from '../../generated/adapters/adapter-utils';
import {
    validateAdapterConfig,
    GetLookupRecordsConfig,
} from '../../generated/adapters/getLookupRecords';
import { getFieldId, FieldId } from '../../primitives/FieldId';
import { isSpanningRecord } from '../../selectors/record';
import { ObjectId } from '../../primitives/ObjectId';
import getLookupRecordsResourceRequest, {
    keyBuilder,
    ResourceRequestConfig,
} from '../../generated/resources/getUiApiLookupsByFieldApiNameAndObjectApiNameAndTargetApiName';
import { deepFreeze } from '../../util/deep-freeze';
import { RecordRepresentation } from '../../generated/types/RecordRepresentation';

interface GetLookupRecordsConfigRequestParams {
    q?: string;
    pageParam?: number;
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

    const pageParam = requestParams.pageParam;
    if (pageParam !== undefined) {
        coercedConfig.pageParam = pageParam;
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

    delete recordRep.eTag;
    delete recordRep.weakEtag;

    Object.keys(fields).forEach(fieldName => {
        const { value: nestedValue } = fields[fieldName];
        if (isSpanningRecord(nestedValue)) {
            removeEtags(nestedValue);
        }
    });
}

export function buildNetworkSnapshot(lds: Luvio, config: GetLookupRecordsConfig) {
    const { objectApiName, fieldApiName, targetApiName } = config;
    const resourceParams: ResourceRequestConfig = {
        urlParams: {
            objectApiName,
            fieldApiName,
            targetApiName,
        },
        queryParams: {
            pageParam: config.pageParam,
            pageSize: config.pageSize,
            q: config.q,
            searchType: config.searchType,
            dependentFieldBindings: config.dependentFieldBindings,
            sourceRecordId: config.sourceRecordId,
        },
    };
    const request = getLookupRecordsResourceRequest(resourceParams);

    return lds.dispatchResourceRequest<RecordCollectionRepresentation>(request).then(
        response => {
            // TODO W-7235112 - remove this hack to never ingest lookup responses that
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
        (err: FetchResponse<unknown>) => {
            return lds.errorSnapshot(err);
        }
    );
}

export const factory: AdapterFactory<GetLookupRecordsConfig, RecordCollectionRepresentation> = (
    lds: Luvio
) => {
    return refreshable(
        function(untrusted: unknown) {
            const config = coerceConfigWithDefaults(untrusted);
            if (config === null) {
                return null;
            }
            return buildNetworkSnapshot(lds, config);
        },
        (untrusted: unknown) => {
            const config = coerceConfigWithDefaults(untrusted);
            if (config === null) {
                throw new Error('Refresh should not be called with partial configuration');
            }
            return buildNetworkSnapshot(lds, config);
        }
    );
};
