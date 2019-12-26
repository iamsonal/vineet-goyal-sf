import {
    AdapterFactory,
    LDS,
    PathSelection,
    Selector,
    FetchResponse,
} from '@salesforce-lds/engine';

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
import { ObjectId } from '../../primitives/ObjectId';
import getLookupRecordsResourceRequest from '../../generated/resources/getUiApiLookupsByObjectApiNameAndFieldApiNameAndTargetApiName';
import { buildSelectionFromRecord } from '../../selectors/record';
import { isFulfilledSnapshot } from '../../util/snapshot';

interface GetLookupRecordsConfigRequestParams {
    q?: string;
    page?: number;
    pageSize?: number;
    dependentFieldBindings?: string[];
    searchType?: 'Recent' | 'Search' | 'TypeAhead';
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

function getDataPaths(resp: RecordCollectionRepresentation): PathSelection[] {
    const record = resp.records[0];
    let recordSelections: PathSelection[] = [];
    if (record !== undefined) {
        recordSelections = buildSelectionFromRecord(record);
    }

    return [
        {
            kind: 'Scalar',
            name: 'count',
        },
        {
            kind: 'Scalar',
            name: 'currentPageToken',
        },
        {
            kind: 'Scalar',
            name: 'currentPageUrl',
        },
        {
            kind: 'Scalar',
            name: 'nextPageToken',
        },
        {
            kind: 'Scalar',
            name: 'nextPageUrl',
        },
        {
            kind: 'Scalar',
            name: 'previousPageToken',
        },
        {
            kind: 'Scalar',
            name: 'previousPageUrl',
        },
        {
            kind: 'Link',
            name: 'records',
            plural: true,
            selections: recordSelections,
        },
    ];
}

function getSelectorKey(lookupRecordsKey: string) {
    return `${lookupRecordsKey}__selector`;
}

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

function network(lds: LDS, config: GetLookupRecordsConfig) {
    const { objectApiName, fieldApiName, targetApiName } = config;
    const request = getLookupRecordsResourceRequest({
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
        },
    });
    const cachedSelectorKey = getSelectorKey(request.key);

    return lds.dispatchResourceRequest<RecordCollectionRepresentation>(request).then(
        response => {
            const { body } = response;

            const paths = getDataPaths(body);
            const sel: Selector = {
                recordId: request.key,
                node: {
                    kind: 'Fragment',
                    selections: paths,
                },
                variables: {},
            };

            lds.storePublish(cachedSelectorKey, sel);
            lds.storeIngest(request.key, request, body);
            lds.storeBroadcast();

            return lds.storeLookup<RecordCollectionRepresentation>(sel);
        },
        (err: FetchResponse<unknown>) => {
            lds.storeIngestFetchResponse(request.key, err);
            lds.storeBroadcast();
            return lds.errorSnapshot(err);
        }
    );
}

function cache(lds: LDS, config: GetLookupRecordsConfig) {
    const request = getLookupRecordsResourceRequest({
        urlParams: {
            objectApiName: config.objectApiName,
            fieldApiName: config.fieldApiName,
            targetApiName: config.targetApiName,
        },
        queryParams: {
            page: config.page,
            pageSize: config.pageSize,
            q: config.q,
            searchType: config.searchType,
            dependentFieldBindings: config.dependentFieldBindings,
        },
    });

    const cachedSelectorKey = getSelectorKey(request.key);
    const cacheSel = lds.storeLookup<Selector>({
        recordId: cachedSelectorKey,
        node: {
            kind: 'Fragment',
            opaque: true,
        },
        variables: {},
    });

    if (isFulfilledSnapshot(cacheSel)) {
        const cacheData = lds.storeLookup<RecordCollectionRepresentation>(cacheSel.data);

        // CACHE HIT
        if (isFulfilledSnapshot(cacheData)) {
            return cacheData;
        }
    }

    return null;
}

export const factory: AdapterFactory<GetLookupRecordsConfig, RecordCollectionRepresentation> = (
    lds: LDS
) => {
    return refreshable(
        function(untrusted: unknown) {
            const config = coerceConfigWithDefaults(untrusted);
            if (config === null) {
                return null;
            }
            const cacheSnapshot = cache(lds, config);
            if (cacheSnapshot !== null) {
                return cacheSnapshot;
            }

            return network(lds, config);
        },
        (untrusted: unknown) => {
            const config = coerceConfigWithDefaults(untrusted);
            if (config === null) {
                throw new Error('Refresh should not be called with partial configuration');
            }
            return network(lds, config);
        }
    );
};
