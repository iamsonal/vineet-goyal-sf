import { LDS, PathSelection, Snapshot } from '@ldsjs/engine';
import { buildInMemorySnapshot as getObjectInfoCache } from '../../generated/adapters/getObjectInfo';
import { GetRecordUiConfig } from '../../generated/adapters/getRecordUi';
import { ObjectInfoRepresentation } from '../../generated/types/ObjectInfoRepresentation';
import {
    keyBuilder as recordLayoutRepresentationKeyBuilder,
    RecordLayoutRepresentation,
    select as recordLayoutRepresentationSelect,
} from '../../generated/types/RecordLayoutRepresentation';
import {
    keyBuilder as recordRepresentationKeyBuilder,
    RecordRepresentation,
} from '../../generated/types/RecordRepresentation';
import { RecordUiRepresentation } from '../../generated/types/RecordUiRepresentation';
import { LayoutMode } from '../../primitives/LayoutMode';
import { LayoutType } from '../../primitives/LayoutType';
import { RecordLayoutFragment, getRecordTypeId } from '../../util/records';
import { getQualifiedFieldApiNamesFromLayout } from '../../util/layouts';
import { isErrorSnapshot, isFulfilledSnapshot, isUnfulfilledSnapshot } from '../../util/snapshot';
import { dedupe } from '../../validation/utils';
import { factory as getRecordUiFactory, network as getRecordUiNetwork } from '../getRecordUi';
import { cache as getRecordByFieldsCache, getRecordByFields } from './GetRecordFields';

const DEFAULT_MODE = LayoutMode.View;

const layoutSelections = recordLayoutRepresentationSelect();

export interface GetRecordLayoutTypeConfig {
    recordId: string;
    layoutTypes: LayoutType[];
    modes?: LayoutMode[];
    optionalFields?: string[];
}

export function refresh(lds: LDS, config: GetRecordLayoutTypeConfig) {
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

    return getRecordUiNetwork(lds, recordUiConfig).then(response => {
        if (isErrorSnapshot(response)) {
            return lds.errorSnapshot(response.error);
        }

        if (isUnfulfilledSnapshot(response)) {
            throw new Error('RecordUi adapter resolved with a snapshot with missing data');
        }

        const { layoutMap, objectInfo } = getLayoutMapAndObjectInfo(recordId, response.data);
        const fields = getFieldsFromLayoutMap(layoutMap, objectInfo);
        return getRecordByFieldsCache(lds, {
            recordId,
            fields,
            modes,
        });
    });
}

// Makes a request directly to /record-ui/{recordIds}
function fetchRecordLayout(
    lds: LDS,
    recordId: string,
    layoutTypes: LayoutType[],
    modes: LayoutMode[],
    optionalFields?: string[]
) {
    const recordUiConfig: GetRecordUiConfig = {
        recordIds: [recordId],
        layoutTypes,
        modes,
        optionalFields,
    };
    const recordUiAdapter = getRecordUiFactory(lds);
    const recordUiSnapshotOrPromise = recordUiAdapter(recordUiConfig);
    if (isPromise(recordUiSnapshotOrPromise)) {
        return recordUiSnapshotOrPromise.then(snapshot => {
            return processRecordUiRepresentation(lds, recordId, modes, snapshot);
        });
    }

    if (process.env.NODE_ENV !== 'production') {
        if (recordUiSnapshotOrPromise === null) {
            throw new Error('RecordUi adapter synchronously resolved with a null snapshot');
        }
    }

    return processRecordUiRepresentation(lds, recordId, modes, recordUiSnapshotOrPromise!);
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
    lds: LDS,
    recordId: string,
    modes: LayoutMode[],
    snapshot: Snapshot<RecordUiRepresentation>
) {
    if (isErrorSnapshot(snapshot)) {
        return lds.errorSnapshot(snapshot.error);
    }
    if (isUnfulfilledSnapshot(snapshot)) {
        throw new Error('RecordUi adapter resolved with a snapshot with missing data');
    }
    const { layoutMap, objectInfo } = getLayoutMapAndObjectInfo(recordId, snapshot.data);
    return getRecord(lds, recordId, layoutMap, objectInfo);
}

function isPromise<D>(value: D | Promise<D> | null): value is Promise<D> {
    // check for Thenable due to test frameworks using custom Promise impls
    return value !== null && (value as any).then !== undefined;
}

function lookupObjectInfo(lds: LDS, apiName: string): ObjectInfoRepresentation | null {
    const snapshot = getObjectInfoCache(lds, { objectApiName: apiName });
    return isFulfilledSnapshot(snapshot) ? snapshot.data : null;
}

interface RecordLayoutRepresentationMap {
    [layoutType: string]: {
        [mode: string]: RecordLayoutRepresentation;
    };
}

function lookupLayouts(
    lds: LDS,
    apiName: string,
    recordTypeId: string,
    layoutTypes: LayoutType[],
    modes: LayoutMode[]
): RecordLayoutRepresentationMap | null {
    const map: RecordLayoutRepresentationMap = {};

    for (let i = 0; i < layoutTypes.length; i += 1) {
        const layoutType = layoutTypes[i];
        let layoutMap = map[layoutType];
        if (layoutMap === undefined) {
            layoutMap = map[layoutType] = {};
        }

        for (let m = 0; m < modes.length; m += 1) {
            const mode = modes[m];

            const key = recordLayoutRepresentationKeyBuilder({
                apiName,
                recordTypeId,
                layoutType,
                mode,
            });

            const snapshot = lds.storeLookup<RecordLayoutRepresentation>({
                recordId: key,
                node: layoutSelections,
                variables: {},
            });

            // Cache hit
            if (isFulfilledSnapshot(snapshot)) {
                layoutMap[mode] = snapshot.data!;
            } else {
                return null;
            }
        }
    }

    return map;
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
    lds: LDS,
    recordId: string,
    layoutMap: RecordLayoutRepresentationMap,
    objectInfo: ObjectInfoRepresentation
): Promise<Snapshot<RecordRepresentation>> | Snapshot<RecordRepresentation> {
    const fields = getFieldsFromLayoutMap(layoutMap, objectInfo);

    // We know what fields we need so delegate to getRecordByFields
    // This should be a cache hit because we just fetched the record-ui
    return getRecordByFields(lds, {
        recordId,
        fields,
    });
}

export function getRecordLayoutType(
    lds: LDS,
    config: GetRecordLayoutTypeConfig
): Snapshot<RecordRepresentation> | Promise<Snapshot<RecordRepresentation>> {
    const { recordId, layoutTypes, modes: configModes, optionalFields } = config;
    const modes = configModes === undefined ? [DEFAULT_MODE] : configModes;
    const storeKey = recordRepresentationKeyBuilder({ recordId });
    const recordSnapshot = lds.storeLookup<RecordLayoutFragment>({
        recordId: storeKey,
        node: {
            kind: 'Fragment',
            selections: recordLayoutFragmentSelector,
        },
        variables: {},
    });
    // If we haven't seen the record then go to the server
    if (!isFulfilledSnapshot(recordSnapshot)) {
        return fetchRecordLayout(lds, recordId, layoutTypes, modes, optionalFields);
    }

    const record = recordSnapshot.data;
    const { apiName } = record;
    const objectInfo = lookupObjectInfo(lds, apiName);
    // If we do not have object info in cache, call record-ui endpoint directly
    if (objectInfo === null) {
        return fetchRecordLayout(lds, recordId, layoutTypes, modes, optionalFields);
    }

    const recordTypeId = getRecordTypeId(record);
    const layoutMap = lookupLayouts(lds, apiName, recordTypeId, layoutTypes, modes);
    // It takes one xhr per layout to load so if there are missing layouts
    // give up and call record-ui endpoint directly
    if (layoutMap === null) {
        return fetchRecordLayout(lds, recordId, layoutTypes, modes, optionalFields);
    }

    return getRecord(lds, recordId, layoutMap, objectInfo);
}
