import {
    AdapterFactory,
    Luvio,
    PathSelection,
    Selector,
    FetchResponse,
    SnapshotRefresh,
} from '@luvio/engine';
import { validateAdapterConfig } from '../../generated/adapters/getRecordCreateDefaults';
import getUiApiRecordDefaultsCreateByObjectApiName, {
    ResourceRequestConfig,
    keyBuilder,
} from '../../generated/resources/getUiApiRecordDefaultsCreateByObjectApiName';
import { createResourceParams } from '../../generated/adapters/getRecordCreateDefaults';
import {
    RecordDefaultsRepresentation,
    ingest,
} from '../../generated/types/RecordDefaultsRepresentation';
import { select as recordLayoutRepresentationSelect } from '../../generated/types/RecordLayoutRepresentation';
import { select as objectInfoRepresentationSelect } from '../../generated/types/ObjectInfoRepresentation';
import { FormFactor } from '../../primitives/FormFactor';
import { buildSelectionFromRecord } from '../../selectors/record';
import { MASTER_RECORD_TYPE_ID } from '../../util/layout';
import {
    GetRecordCreateDefaultsConfig,
    getRecordCreateDefaults_ConfigPropertyNames,
} from '../../generated/adapters/getRecordCreateDefaults';
import { isFulfilledSnapshot } from '../../util/snapshot';

const layoutSelections = recordLayoutRepresentationSelect();
const objectInfoSelections = objectInfoRepresentationSelect();

function buildSelector(resp: RecordDefaultsRepresentation): PathSelection[] {
    const recordSelections = buildSelectionFromRecord(resp.record);

    return [
        {
            kind: 'Link',
            name: 'layout',
            nullable: true,
            fragment: layoutSelections,
        },
        {
            kind: 'Link',
            name: 'objectInfos',
            map: true,
            fragment: objectInfoSelections,
        },
        {
            kind: 'Link',
            name: 'record',
            fragment: {
                kind: 'Fragment',
                private: [],
                selections: recordSelections,
            },
        },
    ];
}

type GetRecordCreateDefaultsConfigWithDefaults = Required<GetRecordCreateDefaultsConfig>;

function buildSnapshotRefresh(
    luvio: Luvio,
    config: GetRecordCreateDefaultsConfigWithDefaults
): SnapshotRefresh<RecordDefaultsRepresentation> {
    return {
        config,
        resolve: () => buildNetworkSnapshot(luvio, config),
    };
}

export function buildNetworkSnapshot(
    luvio: Luvio,
    config: GetRecordCreateDefaultsConfigWithDefaults
) {
    const params: ResourceRequestConfig = createResourceParams(config);
    const request = getUiApiRecordDefaultsCreateByObjectApiName(params);

    const key = keyBuilder(params);
    const selectorKey = `${key}__selector`;

    return luvio.dispatchResourceRequest<RecordDefaultsRepresentation>(request).then(
        response => {
            const { body } = response;
            const cacheSelector: Selector = {
                recordId: key,
                node: {
                    kind: 'Fragment',
                    private: [],
                    selections: buildSelector(body),
                },
                variables: {},
            };

            luvio.storePublish(selectorKey, cacheSelector);
            luvio.storeIngest(key, ingest, body);
            luvio.storeBroadcast();
            return luvio.storeLookup<RecordDefaultsRepresentation>(
                cacheSelector,
                buildSnapshotRefresh(luvio, config)
            );
        },
        (err: FetchResponse<unknown>) => {
            const errorSnapshot = luvio.errorSnapshot(err, buildSnapshotRefresh(luvio, config));
            luvio.storeIngestError(key, errorSnapshot);
            luvio.storeBroadcast();
            return errorSnapshot;
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

export function buildInMemorySnapshot(
    luvio: Luvio,
    config: GetRecordCreateDefaultsConfigWithDefaults
) {
    const params: ResourceRequestConfig = createResourceParams(config);
    const key = keyBuilder(params);

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
    const cacheSnapshot = luvio.storeLookup<Selector>({
        recordId: selectorKey,
        node: {
            kind: 'Fragment',
            private: [],
            opaque: true,
        },
        variables: {},
    });

    // We've seen this request before
    if (isFulfilledSnapshot(cacheSnapshot)) {
        const snapshot = luvio.storeLookup<RecordDefaultsRepresentation>(
            cacheSnapshot.data,
            buildSnapshotRefresh(luvio, config)
        );

        // Cache hit
        if (luvio.snapshotAvailable(snapshot)) {
            return snapshot;
        }
    }

    return null;
}

export const factory: AdapterFactory<
    GetRecordCreateDefaultsConfig,
    RecordDefaultsRepresentation
> = (luvio: Luvio) =>
    function getRecordCreateDefaults(untrusted: unknown) {
        const config = coerceConfigWithDefaults(untrusted);
        if (config === null) {
            return null;
        }

        const snapshot = buildInMemorySnapshot(luvio, config);
        if (snapshot !== null) {
            return snapshot;
        }
        return buildNetworkSnapshot(luvio, config);
    };
