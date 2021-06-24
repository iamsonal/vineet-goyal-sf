import {
    AdapterFactory,
    Luvio,
    PathSelection,
    Selector,
    FetchResponse,
    SnapshotRefresh,
    Snapshot,
    AdapterContext,
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
    context: AdapterContext,
    config: GetRecordCreateDefaultsConfigWithDefaults
): SnapshotRefresh<RecordDefaultsRepresentation> {
    return {
        config,
        resolve: () => buildNetworkSnapshot(luvio, context, config),
    };
}

export function buildNetworkSnapshot(
    luvio: Luvio,
    context: AdapterContext,
    config: GetRecordCreateDefaultsConfigWithDefaults
) {
    const params: ResourceRequestConfig = createResourceParams(config);
    const request = getUiApiRecordDefaultsCreateByObjectApiName(params);

    const key = keyBuilder(params);
    const selectorKey = buildSelectorKey(config);

    return luvio.dispatchResourceRequest<RecordDefaultsRepresentation>(request).then(
        (response) => {
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

            context.set(selectorKey, cacheSelector);
            luvio.storeIngest(key, ingest, body);
            const snapshot = luvio.storeLookup<RecordDefaultsRepresentation>(
                cacheSelector,
                buildSnapshotRefresh(luvio, context, config)
            );
            luvio.storeBroadcast();
            return snapshot;
        },
        (err: FetchResponse<unknown>) => {
            const errorSnapshot = luvio.errorSnapshot(
                err,
                buildSnapshotRefresh(luvio, context, config)
            );
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

function buildSelectorKey(config: GetRecordCreateDefaultsConfigWithDefaults) {
    const params: ResourceRequestConfig = createResourceParams(config);
    const key = keyBuilder(params);
    return `${key}__selector`;
}

export function buildInMemorySnapshot(
    sel: Selector,
    luvio: Luvio,
    context: AdapterContext,
    config: GetRecordCreateDefaultsConfigWithDefaults
) {
    return luvio.storeLookup<RecordDefaultsRepresentation>(
        sel,
        buildSnapshotRefresh(luvio, context, config)
    );
}

export const factory: AdapterFactory<GetRecordCreateDefaultsConfig, RecordDefaultsRepresentation> =
    (luvio: Luvio) =>
        luvio.withContext(function getRecordCreateDefaults(
            untrusted: unknown,
            context: AdapterContext
        ) {
            const config = coerceConfigWithDefaults(untrusted);
            if (config === null) {
                return null;
            }

            const selectorKey = buildSelectorKey(config);
            /**
             * getRecordCreateDefaults returns a value that includes a map of ObjectInfos,
             * a layout and a record. The returned record includes fields that are not
             * known to the client. Because we don't know what the return shape will be,
             * we have to store a selector from a previous response and see if we can
             * extract those values back out.
             *
             * store cached selector in the adapter context and if it does not exist
             * we need to fetch it from the network and set it.
             */
            const cachedSelector = context.get<Selector>(selectorKey);
            if (cachedSelector === undefined) {
                return buildNetworkSnapshot(luvio, context, config);
            }

            const snapshot = buildInMemorySnapshot(cachedSelector, luvio, context, config);
            if (luvio.snapshotAvailable(snapshot)) {
                return snapshot;
            }
            return luvio.resolveSnapshot(
                snapshot,
                buildSnapshotRefresh(luvio, context, config)
            ) as Promise<Snapshot<RecordDefaultsRepresentation, any>>;
        });
