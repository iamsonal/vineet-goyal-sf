import { AdapterFactory, LDS, PathSelection, Selector, FetchResponse } from '@ldsjs/engine';
import { validateAdapterConfig } from '../../generated/adapters/getRecordCreateDefaults';
import getUiApiRecordDefaultsCreateByObjectApiName from '../../generated/resources/getUiApiRecordDefaultsCreateByObjectApiName';
import { RecordDefaultsRepresentation } from '../../generated/types/RecordDefaultsRepresentation';
import { select as recordLayoutRepresentationSelect } from '../../generated/types/RecordLayoutRepresentation';
import { select as objectInfoRepresentationSelect } from '../../generated/types/ObjectInfoRepresentation';
import { FormFactor } from '../../primitives/FormFactor';
import { buildSelectionFromRecord } from '../../selectors/record';
import { MASTER_RECORD_TYPE_ID } from '../../util/layout';
import {
    GetRecordCreateDefaultsConfig,
    getRecordCreateDefaults_ConfigPropertyNames,
} from './../../generated/adapters/getRecordCreateDefaults';
import { isFulfilledSnapshot } from '../../util/snapshot';
import { refreshable } from '../../generated/adapters/adapter-utils';

const layoutSelections = recordLayoutRepresentationSelect();
const objectInfoSelections = objectInfoRepresentationSelect();

function buildSelector(resp: RecordDefaultsRepresentation): PathSelection[] {
    const recordSelections = buildSelectionFromRecord(resp.record);

    return [
        {
            kind: 'Link',
            name: 'layout',
            nullable: true,
            selections: layoutSelections.selections,
        },
        {
            kind: 'Link',
            name: 'objectInfos',
            map: true,
            selections: objectInfoSelections.selections,
        },
        {
            kind: 'Link',
            name: 'record',
            selections: recordSelections,
        },
    ];
}

type GetRecordCreateDefaultsConfigWithDefaults = Required<GetRecordCreateDefaultsConfig>;

export function buildNetworkSnapshot(lds: LDS, config: GetRecordCreateDefaultsConfigWithDefaults) {
    const { formFactor, optionalFields, recordTypeId } = config;
    const request = getUiApiRecordDefaultsCreateByObjectApiName({
        urlParams: {
            objectApiName: config.objectApiName,
        },
        queryParams: {
            formFactor,
            optionalFields,
            recordTypeId,
        },
    });

    const { key } = request;
    const selectorKey = `${key}__selector`;

    return lds.dispatchResourceRequest<RecordDefaultsRepresentation>(request).then(
        response => {
            const { body } = response;

            // TODO W-6399239 - fix API so we don't have to augment the response with request details in order
            // to support refresh. these are never emitted out per (private).
            if (body.layout !== null) {
                body.layout.apiName = config.objectApiName;
                body.layout.recordTypeId = recordTypeId;
            }

            const cacheSelector: Selector = {
                recordId: key,
                node: {
                    kind: 'Fragment',
                    selections: buildSelector(body),
                },
                variables: {},
            };

            lds.storePublish(selectorKey, cacheSelector);
            lds.storeIngest(key, request, body);
            lds.storeBroadcast();
            return lds.storeLookup<RecordDefaultsRepresentation>(cacheSelector);
        },
        (err: FetchResponse<unknown>) => {
            lds.storeIngestFetchResponse(key, err);
            lds.storeBroadcast();
            return lds.errorSnapshot(err);
        }
    );
}

function coerceConfigWithDefaults(
    untrusted: unknown
): GetRecordCreateDefaultsConfigWithDefaults | null {
    const config = validateAdapterConfig(untrusted, getRecordCreateDefaults_ConfigPropertyNames);
    if (config === null) {
        return null;
    }

    let formFactor = config.formFactor;
    if (formFactor === undefined) {
        if ((untrusted as GetRecordCreateDefaultsConfig).formFactor === undefined) {
            formFactor = FormFactor.Large;
        } else {
            return null;
        }
    }

    const recordTypeId =
        config.recordTypeId === undefined ? MASTER_RECORD_TYPE_ID : config.recordTypeId;
    const optionalFields = config.optionalFields === undefined ? [] : config.optionalFields;

    return {
        ...config,
        formFactor,
        recordTypeId,
        optionalFields,
    };
}

export function buildInMemorySnapshot(lds: LDS, config: GetRecordCreateDefaultsConfigWithDefaults) {
    const { formFactor, optionalFields, recordTypeId } = config;
    const request = getUiApiRecordDefaultsCreateByObjectApiName({
        urlParams: {
            objectApiName: config.objectApiName,
        },
        queryParams: {
            formFactor,
            optionalFields,
            recordTypeId,
        },
    });

    const { key } = request;

    const selectorKey = `${key}__selector`;

    /**
     * getRecordCreateDefaults returns a value that includes a map of ObjectInfos,
     * a layout and a record. The returned record includes fields that are not
     * known to the client. Because we don't know what the return shape will be,
     * we have to store a selector from a previous response and see if we can
     * extract those values back out.
     *
     * cacheSnapshot is the cached selector from a previous request. It is just
     * a stashed selector
     */
    const cacheSnapshot = lds.storeLookup<Selector>({
        recordId: selectorKey,
        node: {
            kind: 'Fragment',
            opaque: true,
        },
        variables: {},
    });

    // We've seen this request before
    if (isFulfilledSnapshot(cacheSnapshot)) {
        const snapshot = lds.storeLookup<RecordDefaultsRepresentation>(cacheSnapshot.data);

        // Cache hit
        if (isFulfilledSnapshot(snapshot)) {
            return snapshot;
        }
    }

    return null;
}

export const factory: AdapterFactory<
    GetRecordCreateDefaultsConfig,
    RecordDefaultsRepresentation
> = (lds: LDS) => {
    return refreshable(
        (untrusted: unknown) => {
            const config = coerceConfigWithDefaults(untrusted);
            if (config === null) {
                return null;
            }

            const snapshot = buildInMemorySnapshot(lds, config);
            if (snapshot !== null) {
                return snapshot;
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
