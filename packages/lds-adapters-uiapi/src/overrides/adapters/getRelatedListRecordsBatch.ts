import {
    AdapterValidationConfig,
    Untrusted,
    ArrayIsArray,
    untrustedIsObject,
    validateConfig,
    areRequiredParametersPresent,
} from '../../generated/adapters/adapter-utils';
import {
    buildInMemorySnapshot,
    buildNetworkSnapshot,
    GetRelatedListRecordsBatchConfig as GeneratedGetRelatedListRecordBatchConfig,
} from '../../generated/adapters/getRelatedListRecordsBatch';
import { Luvio, Snapshot, AdapterFactory } from '@luvio/engine';
import { RelatedListRecordCollectionBatchRepresentation } from '../../generated/types/RelatedListRecordCollectionBatchRepresentation';

export { adapterName } from '../../generated/adapters/getRelatedListRecordsBatch';

export const getRelatedListRecordsBatch_ConfigPropertyNames: AdapterValidationConfig = {
    displayName: 'getRelatedListRecordsBatch',
    parameters: {
        required: ['parentRecordId', 'relatedLists'],
        optional: [],
    },
};

interface RelatedListRecordsConfig {
    relatedListId: string;
    fields?: string[];
    optionalFields?: string[];
    pageSize?: number;
    sortBy?: string[];
    // pageToken: string; TODO: need support for this on backend to enable.
}

export interface GetRelatedListRecordsBatchConfig {
    parentRecordId: string;
    relatedLists: Array<RelatedListRecordsConfig>;
}

export function coerceActualAdapterConfigToGeneratedRepresentation(
    config: GetRelatedListRecordsBatchConfig
): GeneratedGetRelatedListRecordBatchConfig {
    var relatedListIds: Array<string> = [];
    var fields: Array<string> = [];
    var optionalFields: Array<string> = [];
    var pageSize: Array<string> = [];
    var sortBy: Array<string> = [];

    config.relatedLists.forEach(relatedList => {
        relatedListIds.push(relatedList.relatedListId);
        if (!!relatedList.fields && relatedList.fields.length) {
            fields.push(relatedList.relatedListId + ':' + relatedList.fields.join());
        }
        if (!!relatedList.optionalFields && relatedList.optionalFields.length) {
            optionalFields.push(
                relatedList.relatedListId + ':' + relatedList.optionalFields.join()
            );
        }
        if (relatedList.pageSize) {
            pageSize.push(relatedList.relatedListId + ':' + relatedList.pageSize);
        }
        if (!!relatedList.sortBy && relatedList.sortBy.length) {
            sortBy.push(relatedList.relatedListId + ':' + relatedList.sortBy.join());
        }
    });
    const fieldsParam = fields.join(';');
    const optionalFieldsParam = optionalFields.join(';');
    const pageSizeParam = pageSize.join(';');
    const sortByParam = sortBy.join(';');

    return {
        parentRecordId: config.parentRecordId,
        relatedListIds: relatedListIds,
        fields: fieldsParam,
        optionalFields: optionalFieldsParam,
        pageSize: pageSizeParam,
        sortBy: sortByParam,
    };
}

export function typeCheckConfig(
    untrustedConfig: Untrusted<GetRelatedListRecordsBatchConfig>
): Untrusted<GetRelatedListRecordsBatchConfig> {
    const config = {} as Untrusted<GetRelatedListRecordsBatchConfig>;

    const untrustedConfig_parentRecordId = untrustedConfig.parentRecordId;
    if (typeof untrustedConfig_parentRecordId === 'string') {
        config.parentRecordId = untrustedConfig_parentRecordId;
    }

    const untrustedConfig_relatedLists = untrustedConfig.relatedLists;
    if (ArrayIsArray(untrustedConfig_relatedLists)) {
        const untrustedConfig_relatedLists_array: Array<RelatedListRecordsConfig> = [];
        for (let i = 0, arrayLength = untrustedConfig_relatedLists.length; i < arrayLength; i++) {
            const untrustedConfig_relatedListIds_item = untrustedConfig_relatedLists[i];
            if (typeof untrustedConfig_relatedListIds_item === 'object') {
                // Not sure if this inner type checking is necessary?
                const untrustedConfig_fields = untrustedConfig_relatedListIds_item.fields;
                if (ArrayIsArray(untrustedConfig_fields)) {
                    const untrustedConfig_fields_array: Array<string> = [];
                    for (
                        let i = 0, arrayLength = untrustedConfig_fields.length;
                        i < arrayLength;
                        i++
                    ) {
                        const untrustedConfig_fields_item = untrustedConfig_fields[i];
                        if (typeof untrustedConfig_fields_item === 'string') {
                            untrustedConfig_fields_array.push(untrustedConfig_fields_item);
                        }
                    }

                    untrustedConfig_relatedListIds_item.fields = untrustedConfig_fields_array;
                }

                const untrustedConfig_optionalFields =
                    untrustedConfig_relatedListIds_item.optionalFields;
                if (ArrayIsArray(untrustedConfig_optionalFields)) {
                    const untrustedConfig_optionalFields_array: Array<string> = [];
                    for (
                        let i = 0, arrayLength = untrustedConfig_optionalFields.length;
                        i < arrayLength;
                        i++
                    ) {
                        const untrustedConfig_optionalFields_item =
                            untrustedConfig_optionalFields[i];
                        if (typeof untrustedConfig_optionalFields_item === 'string') {
                            untrustedConfig_optionalFields_array.push(
                                untrustedConfig_optionalFields_item
                            );
                        }
                    }

                    untrustedConfig_relatedListIds_item.optionalFields = untrustedConfig_optionalFields_array;
                }

                const untrustedConfig_pageSize = untrustedConfig_relatedListIds_item.pageSize;
                if (untrustedConfig_pageSize) {
                    if (typeof untrustedConfig_pageSize === 'number') {
                        untrustedConfig_relatedListIds_item.pageSize = untrustedConfig_pageSize;
                    } else {
                        //Not a number here, set pagesize to undefined
                        untrustedConfig_relatedListIds_item.pageSize = undefined;
                    }
                }

                const untrustedConfig_sortBy = untrustedConfig_relatedListIds_item.sortBy;
                if (ArrayIsArray(untrustedConfig_sortBy)) {
                    const untrustedConfig_sortBy_array: Array<string> = [];
                    for (
                        let i = 0, arrayLength = untrustedConfig_sortBy.length;
                        i < arrayLength;
                        i++
                    ) {
                        const untrustedConfig_sortBy_item = untrustedConfig_sortBy[i];
                        if (typeof untrustedConfig_sortBy_item === 'string') {
                            untrustedConfig_sortBy_array.push(untrustedConfig_sortBy_item);
                        }
                    }

                    untrustedConfig_relatedListIds_item.sortBy = untrustedConfig_sortBy_array;
                }

                untrustedConfig_relatedLists_array.push(untrustedConfig_relatedListIds_item);
            }
        }

        config.relatedLists = untrustedConfig_relatedLists_array;
    }
    return config;
}

export const getRelatedListRecordsBatchAdapterFactory: AdapterFactory<
    GetRelatedListRecordsBatchConfig,
    RelatedListRecordCollectionBatchRepresentation
> = (luvio: Luvio) =>
    function getRelatedListRecordsBatch(
        untrustedConfig: unknown
    ):
        | Promise<Snapshot<RelatedListRecordCollectionBatchRepresentation, any>>
        | Snapshot<RelatedListRecordCollectionBatchRepresentation, any>
        | null {
        const config = validateAdapterConfig(
            untrustedConfig,
            getRelatedListRecordsBatch_ConfigPropertyNames
        );

        // Invalid or incomplete config
        if (config === null) {
            return null;
        }

        const coercedConfig = coerceActualAdapterConfigToGeneratedRepresentation(config);

        const cacheSnapshot = buildInMemorySnapshot(luvio, coercedConfig);

        // Cache Hit
        if (luvio.snapshotAvailable(cacheSnapshot) === true) {
            return cacheSnapshot;
        }

        return buildNetworkSnapshot(luvio, coercedConfig);
    };

// HUGE BLOCK OF COPY PASTED CODE:
// WE NEED TO DO THIS SO THAT THE ADAPTER CAN USE OUR OVERWRITTEN FUNCTIONS
// PLEASE DO NOT CHANGE ANYTHING HERE...
export function validateAdapterConfig(
    untrustedConfig: unknown,
    configPropertyNames: AdapterValidationConfig
): GetRelatedListRecordsBatchConfig | null {
    if (!untrustedIsObject<GetRelatedListRecordsBatchConfig>(untrustedConfig)) {
        return null;
    }

    if (process.env.NODE_ENV !== 'production') {
        validateConfig<GetRelatedListRecordsBatchConfig>(untrustedConfig, configPropertyNames);
    }

    const config = typeCheckConfig(untrustedConfig);

    if (
        !areRequiredParametersPresent<GetRelatedListRecordsBatchConfig>(config, configPropertyNames)
    ) {
        return null;
    }

    return config;
}
