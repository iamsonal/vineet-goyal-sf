import {
    AdapterRequestContext,
    Luvio,
    PathSelection,
    Snapshot,
    SnapshotRefresh,
    StoreLookup,
} from '@luvio/engine';
import {
    buildCachedSnapshot as buildCachedSnapshot_GetRecordFields,
    buildNetworkSnapshot as buildNetworkSnapshot_GetRecordFields,
    buildRecordSelector,
    getRecordByFields,
} from './GetRecordFields';
import { buildCachedSnapshotCachePolicy as buildCachedSnapshotCachePolicy_getObjectInfo } from '../../generated/adapters/getObjectInfo';
import { ObjectInfoRepresentation } from '../../generated/types/ObjectInfoRepresentation';
import {
    keyBuilder as keyBuilder_RecordLayoutRepresentation,
    RecordLayoutRepresentation,
    select as select_RecordLayoutRepresentation,
} from '../../generated/types/RecordLayoutRepresentation';
import {
    keyBuilder as keyBuilder_RecordRepresentation,
    RecordRepresentation,
} from '../../generated/types/RecordRepresentation';
import { RecordUiRepresentation } from '../../generated/types/RecordUiRepresentation';
import { buildNetworkSnapshot as buildNetworkSnapshot_getRecordUi } from '../getRecordUi';
import { LayoutMode } from '../../primitives/LayoutMode';
import { LayoutType } from '../../primitives/LayoutType';
import { ObjectKeys } from '../../util/language';
import { getQualifiedFieldApiNamesFromLayout } from '../../util/layouts';
import { getRecordTypeId, RecordLayoutFragment } from '../../util/records';
import {
    isErrorSnapshot,
    isFulfilledSnapshot,
    isStaleSnapshot,
    isUnfulfilledSnapshot,
} from '../../util/snapshot';
import { dedupe } from '../../validation/utils';
import { isPromise } from '../../util/promise';

const DEFAULT_MODE = LayoutMode.View;

const layoutSelections = select_RecordLayoutRepresentation();

export interface GetRecordLayoutTypeConfig {
    recordId: string;
    layoutTypes: LayoutType[];
    modes?: LayoutMode[];
    optionalFields?: string[];
}

function buildSnapshotRefresh(
    luvio: Luvio,
    config: GetRecordLayoutTypeConfig
): SnapshotRefresh<RecordRepresentation> {
    return {
        config,
        resolve: () => refresh(luvio, config),
    };
}

function refresh(
    luvio: Luvio,
    config: GetRecordLayoutTypeConfig
): Promise<Snapshot<RecordRepresentation>> {
    const {
        recordId,
        layoutTypes,
        modes: configModes,
        optionalFields: configOptionalFields,
    } = config;
    const modes = configModes === undefined ? [DEFAULT_MODE] : configModes;
    const optionalFields = configOptionalFields === undefined ? [] : configOptionalFields;
    const recordUiConfig = {
        recordIds: [recordId],
        layoutTypes,
        modes,
        optionalFields,
    };

    return buildNetworkSnapshot_getRecordUi(luvio, recordUiConfig).then((snapshot) => {
        const refresh = buildSnapshotRefresh(luvio, config);
        if (isErrorSnapshot(snapshot)) {
            var recordKey = keyBuilder_RecordRepresentation({ recordId });
            luvio.storeIngestError(recordKey, snapshot);
            luvio.storeBroadcast();
            return luvio.errorSnapshot(snapshot.error, refresh);
        }

        if (isUnfulfilledSnapshot(snapshot)) {
            if (process.env.NODE_ENV !== 'production') {
                throw new Error(
                    `RecordUi adapter resolved with a snapshot with missing data, missingPaths: ${ObjectKeys(
                        snapshot.missingPaths
                    )}`
                );
            }
        }

        const { data } = snapshot;
        if (data === undefined) {
            // eslint-disable-next-line @salesforce/lds/no-error-in-production
            throw new Error(
                `RecordUi adapter resolved with a ${snapshot.state} snapshot with undefined data`
            );
        }
        const { layoutMap, objectInfo } = getLayoutMapAndObjectInfo(recordId, data);
        const fields = getFieldsFromLayoutMap(layoutMap, objectInfo);
        return buildCachedSnapshot_GetRecordFields(
            luvio,
            {
                recordId,
                fields,
                optionalFields,
            },
            refresh
        );
    });
}

function getLayoutMapAndObjectInfo(recordId: string, data: RecordUiRepresentation) {
    const { objectInfos, layouts, records } = data;
    const record = records[recordId];
    const { apiName } = record;
    const objectInfo = objectInfos[apiName];

    const recordTypeId = getRecordTypeId(record);
    const layoutMap = layouts[apiName][recordTypeId];

    return {
        layoutMap,
        objectInfo,
    };
}

function processRecordUiRepresentation(
    luvio: Luvio,
    refresh: SnapshotRefresh<RecordRepresentation>,
    recordId: string,
    modes: LayoutMode[],
    snapshot: Snapshot<RecordUiRepresentation>,
    optionalFields?: string[]
) {
    if (isErrorSnapshot(snapshot)) {
        return luvio.errorSnapshot(snapshot.error, refresh);
    }
    if (isUnfulfilledSnapshot(snapshot)) {
        if (process.env.NODE_ENV !== 'production') {
            throw new Error(
                `RecordUi adapter resolved with a snapshot with missing data, missingPaths: ${ObjectKeys(
                    snapshot.missingPaths
                )}`
            );
        }
    }

    const { data } = snapshot;
    if (data === undefined) {
        // eslint-disable-next-line @salesforce/lds/no-error-in-production
        throw new Error(
            `RecordUi adapter resolved with a ${snapshot.state} snapshot with undefined data`
        );
    }

    const { layoutMap, objectInfo } = getLayoutMapAndObjectInfo(recordId, data);
    return getRecord(luvio, refresh, recordId, layoutMap, objectInfo, optionalFields);
}

interface RecordLayoutRepresentationMap {
    [layoutType: string]: {
        [mode: string]: RecordLayoutRepresentation;
    };
}

/**
 * Given a set of layout types & modes, construct:
 *
 *    { <type> => { <mode> => RecordLayoutRepresentation }}
 *
 * Returns null if storeLookup cannot locate any of the layouts.
 */
function lookupLayouts(
    storeLookup: StoreLookup<RecordLayoutRepresentation>,
    apiName: string,
    recordTypeId: string,
    layoutTypes: LayoutType[],
    modes: LayoutMode[]
): [RecordLayoutRepresentationMap | null, boolean] {
    const map: RecordLayoutRepresentationMap = {};
    let stale = false;

    for (let i = 0; i < layoutTypes.length; i += 1) {
        const layoutType = layoutTypes[i];
        let layoutMap = map[layoutType];
        if (layoutMap === undefined) {
            layoutMap = map[layoutType] = {};
        }

        for (let m = 0; m < modes.length; m += 1) {
            const mode = modes[m];

            const key = keyBuilder_RecordLayoutRepresentation({
                objectApiName: apiName,
                recordTypeId,
                layoutType,
                mode,
            });

            const snapshot = storeLookup({
                recordId: key,
                node: layoutSelections,
                variables: {},
            });

            // Cache hit
            if (snapshot.data === undefined) {
                return [null, false];
            }

            stale = stale || isStaleSnapshot(snapshot);

            layoutMap[mode] = snapshot.data!;
        }
    }

    return [map, stale];
}

const recordLayoutFragmentSelector: PathSelection[] = [
    {
        name: 'apiName',
        kind: 'Scalar',
    },
    {
        name: 'recordTypeId',
        kind: 'Scalar',
    },
];

function getFieldsFromLayoutMap(
    layoutMap: RecordLayoutRepresentationMap,
    objectInfo: ObjectInfoRepresentation
): string[] {
    let fields: string[] = [];
    const layoutTypes = Object.keys(layoutMap);
    for (let i = 0, layoutTypesLen = layoutTypes.length; i < layoutTypesLen; i += 1) {
        const layoutType = layoutTypes[i];
        const modesMap = layoutMap[layoutType];
        const modes = Object.keys(modesMap);
        for (let m = 0, modesLen = modes.length; m < modesLen; m += 1) {
            const mode = modes[m];
            const modeKeys = getQualifiedFieldApiNamesFromLayout(modesMap[mode], objectInfo);
            fields = fields.concat(modeKeys);
        }
    }
    return dedupe(fields).sort();
}

function getRecord(
    luvio: Luvio,
    refresh: SnapshotRefresh<RecordRepresentation>,
    recordId: string,
    layoutMap: RecordLayoutRepresentationMap,
    objectInfo: ObjectInfoRepresentation,
    configOptionalFields?: string[]
): Promise<Snapshot<RecordRepresentation>> | Snapshot<RecordRepresentation> {
    const fields = getFieldsFromLayoutMap(layoutMap, objectInfo);
    const optionalFields =
        configOptionalFields === undefined ? [] : dedupe(configOptionalFields).sort();

    // We know what fields we need so delegate to getRecordByFields
    // This should be a cache hit because we just fetched the record-ui
    const recordSnapshotOrPromise = getRecordByFields(luvio, {
        recordId,
        fields,
        optionalFields,
    });

    // attach a record layout refresh
    if (isPromise(recordSnapshotOrPromise)) {
        recordSnapshotOrPromise.then((snapshot) => {
            snapshot.refresh = refresh;
            return snapshot;
        });
    } else {
        recordSnapshotOrPromise.refresh = refresh;
    }

    return recordSnapshotOrPromise;
}

type BuildSnapshotContext = {
    config: GetRecordLayoutTypeConfig;
    luvio: Luvio;
    fields?: string[];
};

/**
 * Attempts to construct the requested RecordRepresentation from the L1 store using
 * the record's type, layouts, and object info to generate the set of fields that
 * need to be included.
 *
 * @returns Snapshot (possibly incomplete) for the record, undefined if the prerequisite
 *     information was not found in L1
 */
function buildCachedSnapshot(
    context: BuildSnapshotContext,
    storeLookup: StoreLookup<any>
): Snapshot<RecordRepresentation> | undefined {
    const { config, luvio } = context;

    // get cached copy of the record
    const { recordId } = config;
    const storeKey = keyBuilder_RecordRepresentation({ recordId });
    const recordSnapshot = (storeLookup as StoreLookup<RecordLayoutFragment>)({
        recordId: storeKey,
        node: {
            kind: 'Fragment',
            private: [],
            selections: recordLayoutFragmentSelector,
        },
        variables: {},
    });

    // bail if we don't have the record
    if (recordSnapshot.data === undefined) {
        return;
    }

    const record = recordSnapshot.data;
    const { apiName } = record;

    // lookup object info for the record
    const objectInfoSnapshot = buildCachedSnapshotCachePolicy_getObjectInfo(
        {
            config: {
                objectApiName: apiName,
            },
            luvio,
        },
        storeLookup
    );

    // bail if we don't have object info that matches this record
    if (!objectInfoSnapshot || !objectInfoSnapshot.data) {
        return;
    }

    // try to load all the requested layouts from cache
    const recordTypeId = getRecordTypeId(record);
    const modes = config.modes === undefined ? [DEFAULT_MODE] : config.modes;
    const [layoutMap, layoutMapIsStale] = lookupLayouts(
        storeLookup,
        apiName,
        recordTypeId,
        config.layoutTypes,
        modes
    );

    // bail if any of the layouts were missing
    if (layoutMap === null) {
        return;
    }

    // transform the layouts & object info into a set of fields
    const fields = getFieldsFromLayoutMap(layoutMap, objectInfoSnapshot.data);
    const optionalFields =
        config.optionalFields === undefined ? [] : dedupe(config.optionalFields).sort();

    // borrow GetRecordFields' logic to construct the RecordRepresentation with the necessary fields
    const sel = buildRecordSelector(recordId, fields, optionalFields);
    const recordRepSnapshot = storeLookup(sel, buildSnapshotRefresh(luvio, config));

    if (isFulfilledSnapshot(recordRepSnapshot)) {
        // mark snapshot as stale if any of the information used to construct it was stale
        if (
            isStaleSnapshot(recordSnapshot) ||
            isStaleSnapshot(objectInfoSnapshot) ||
            layoutMapIsStale
        ) {
            recordRepSnapshot.state = 'Stale' as typeof recordRepSnapshot.state;
        }
    }
    // allow buildNetworkSnappsho() to use GetRecordFields if we were just missing some fields in L1
    else if (isUnfulfilledSnapshot(recordRepSnapshot)) {
        context.fields = fields;
    }

    // return however much of the record we were able to find in L1; cache policy decides if we
    // should consult L2 or go to network
    return recordRepSnapshot;
}

function buildNetworkSnapshot(
    context: BuildSnapshotContext
): Promise<Snapshot<RecordRepresentation>> {
    const { config, luvio } = context;
    const { recordId } = config;
    const optionalFields =
        config.optionalFields === undefined ? [] : dedupe(config.optionalFields).sort();

    const refresh = buildSnapshotRefresh(luvio, config);

    // if we were able to map the layouts to a set of fields then use GetRecordFields
    // to send a request for just those fields
    if (context.fields !== undefined) {
        const recordConfig = {
            recordId,
            fields: context.fields,
            optionalFields,
        };

        return buildNetworkSnapshot_GetRecordFields(luvio, recordConfig).then((snapshot) => {
            snapshot.refresh = refresh;
            return snapshot;
        });
    }

    // otherwise fallback to getRecordUi to get the full set of information
    const modes = config.modes !== undefined ? config.modes : [DEFAULT_MODE];

    const recordUiConfig = {
        recordIds: [recordId],
        layoutTypes: config.layoutTypes,
        modes,
        optionalFields,
    };

    return buildNetworkSnapshot_getRecordUi(luvio, recordUiConfig).then((snapshot) =>
        processRecordUiRepresentation(luvio, refresh, recordId, modes, snapshot, optionalFields)
    );
}

export function getRecordLayoutType(
    luvio: Luvio,
    config: GetRecordLayoutTypeConfig,
    requestContext?: AdapterRequestContext
): Snapshot<RecordRepresentation> | Promise<Snapshot<RecordRepresentation>> {
    return luvio.applyCachePolicy(
        requestContext || {},
        { config, luvio },
        buildCachedSnapshot,
        buildNetworkSnapshot
    );
}
