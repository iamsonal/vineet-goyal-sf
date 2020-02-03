import {
    NativeAdapter,
    AdapterFactory,
    LDS,
    PathSelection,
    Selector,
    FetchResponse,
} from '@ldsjs/engine';
import {
    getPicklistValuesByRecordTypeNativeAdapterFactory,
    GetPicklistValuesByRecordTypeConfig as GetPicklistValuesConfig,
    validateAdapterConfig,
    getPicklistValuesByRecordType_ConfigPropertyNames,
} from '../../generated/adapters/getPicklistValuesByRecordType';
import getUiApiObjectInfoPicklistValuesByObjectApiNameAndRecordTypeId from '../../generated/resources/getUiApiObjectInfoPicklistValuesByObjectApiNameAndRecordTypeId';
import { PicklistValuesCollectionRepresentation } from '../../generated/types/PicklistValuesCollectionRepresentation';
import { path as picklistValuePathSelection } from '../getPicklistValues';
import { ObjectKeys } from '../../util/language';
import { isFulfilledSnapshot } from '../../util/snapshot';
import { refreshable } from '../../generated/adapters/adapter-utils';

function select(picklistNames: string[]): PathSelection[] {
    return [
        {
            kind: 'Object',
            name: 'picklistFieldValues',
            selections: picklistNames.map(name => {
                return {
                    kind: 'Link',
                    name,
                    selections: picklistValuePathSelection,
                };
            }),
        },
    ];
}

function network(lds: LDS, config: GetPicklistValuesConfig) {
    const { objectApiName, recordTypeId } = config;
    const request = getUiApiObjectInfoPicklistValuesByObjectApiNameAndRecordTypeId({
        urlParams: {
            objectApiName,
            recordTypeId,
        },
    });
    const selectorKey = request.key + '__selector';

    return lds.dispatchResourceRequest<PicklistValuesCollectionRepresentation>(request).then(
        response => {
            const { body } = response;

            const picklistFieldValueNames = ObjectKeys(body.picklistFieldValues);
            const sel: Selector = {
                recordId: request.key,
                node: {
                    kind: 'Fragment',
                    selections: select(picklistFieldValueNames),
                },
                variables: {},
            };

            // Remember the selector
            lds.storePublish(selectorKey, sel);
            lds.storeIngest(request.key, request, body);
            lds.storeBroadcast();

            return lds.storeLookup<PicklistValuesCollectionRepresentation>(sel);
        },
        (err: FetchResponse<unknown>) => {
            lds.storeIngestFetchResponse(request.key, err);
            lds.storeBroadcast();
            return lds.errorSnapshot(err);
        }
    );
}

function cache(lds: LDS, config: GetPicklistValuesConfig) {
    const request = getUiApiObjectInfoPicklistValuesByObjectApiNameAndRecordTypeId({
        urlParams: {
            objectApiName: config.objectApiName,
            recordTypeId: config.recordTypeId,
        },
    });
    const selectorKey = request.key + '__selector';

    const selectorSnapshot = lds.storeLookup<Selector>({
        recordId: selectorKey,
        node: {
            kind: 'Fragment',
            opaque: true,
        },
        variables: {},
    });

    // We've seen the response for this request before
    if (isFulfilledSnapshot(selectorSnapshot)) {
        const cacheSnapshot = lds.storeLookup<PicklistValuesCollectionRepresentation>(
            selectorSnapshot.data
        );

        // Cache hit
        if (isFulfilledSnapshot(cacheSnapshot)) {
            return cacheSnapshot;
        }
    }

    return null;
}

export const factory: AdapterFactory<
    GetPicklistValuesConfig,
    PicklistValuesCollectionRepresentation
> = (lds: LDS) => {
    return refreshable(
        (untrusted: unknown) => {
            const config = validateAdapterConfig(
                untrusted,
                getPicklistValuesByRecordType_ConfigPropertyNames
            );
            if (config === null) {
                return null;
            }

            const snapshot = cache(lds, config);
            if (snapshot !== null) {
                return snapshot;
            }

            return network(lds, config);
        },
        (untrusted: unknown) => {
            const config = validateAdapterConfig(
                untrusted,
                getPicklistValuesByRecordType_ConfigPropertyNames
            );
            if (config === null) {
                throw new Error('Refresh should not be called with partial configuration');
            }

            return network(lds, config);
        }
    );
};

export const nativeFactory = (config: GetPicklistValuesConfig): NativeAdapter | null => {
    return getPicklistValuesByRecordTypeNativeAdapterFactory(config);
};
