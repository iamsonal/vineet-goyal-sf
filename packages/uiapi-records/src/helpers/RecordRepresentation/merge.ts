import { LDS, IngestPath, StoreRecordError } from '@salesforce-lds/engine';
import {
    RecordRepresentationNormalized,
    RecordRepresentation,
} from '../../generated/types/RecordRepresentation';
import { network as getRecordFieldsNetwork } from '../../wire/getRecord/GetRecordFields';
import { extractTrackedFields, isSuperset, isSupportedEntity } from '../../util/records';
import { ObjectKeys } from '../../util/language';

// This function sets fields that we are refreshing to pending
// These values will go into the store
function mergePendingFields(
    newRecord: RecordRepresentationNormalized,
    oldRecord: RecordRepresentationNormalized
): RecordRepresentationNormalized {
    // TODO W-6900046 - avoid casting to any by updating
    // RecordRepresentationNormalized['fields'] to include `pending:true` property
    const mergedFields = { ...newRecord.fields } as any;
    const merged = { ...newRecord, fields: mergedFields };

    const existingFields = ObjectKeys(oldRecord.fields);
    for (let i = 0, len = existingFields.length; i < len; i += 1) {
        const spanningFieldName = existingFields[i];

        if (newRecord.fields[spanningFieldName] === undefined) {
            // TODO W-6900046 - fix above casting issue so we're not stuffing arbitrary things
            // into RecordRepresentationNormalized['fields']
            mergedFields[spanningFieldName] = {
                __ref: undefined,
                pending: true,
            };
        }
    }

    return merged;
}

// This method gets called
// when incoming record has a higher version
// than the record that is currently in the store
function mergeAndRefreshHigherVersionRecord(
    lds: LDS,
    incoming: RecordRepresentationNormalized,
    existing: RecordRepresentationNormalized,
    incomingQualifiedApiNames: string[],
    existingQualifiedApiNames: string[]
): RecordRepresentationNormalized {
    // If the higher version (incoming) does not contain a superset of fields as existing
    // then we need to refresh to get updated versions of fields in existing
    if (isSuperset(incomingQualifiedApiNames, existingQualifiedApiNames) === false) {
        // If this is an unsupported entity, do NOT attempt to go to the network
        // Simply merge what we have and move on
        if (isSupportedEntity(incoming.apiName) === false) {
            return mergeRecordFields(incoming, existing);
        }

        getRecordFieldsNetwork(lds, {
            recordId: incoming.id,
            optionalFields: incomingQualifiedApiNames,
        });

        // We want to mark fields in the store as pending
        // Because we don't want to emit any data to components
        return mergePendingFields(incoming, existing);
    }

    return incoming;
}

// This method gets called
// when incoming record has a lower version
// than the record that is currently in the store
function mergeAndRefreshLowerVersionRecord(
    lds: LDS,
    incoming: RecordRepresentationNormalized,
    existing: RecordRepresentationNormalized,
    incomingQualifiedApiNames: string[],
    existingQualifiedApiNames: string[]
): RecordRepresentationNormalized {
    // If the higher version (existing) does not have a superset of fields as incoming
    // then we need to refresh to get updated versions of fields on incoming
    if (isSuperset(existingQualifiedApiNames, incomingQualifiedApiNames) === false) {
        // If this is an unsupported entity, do NOT attempt to go to the network
        // Simply merge what we have and move on
        if (isSupportedEntity(incoming.apiName) === false) {
            return mergeRecordFields(existing, incoming);
        }

        const merged = mergePendingFields(existing, incoming);
        getRecordFieldsNetwork(lds, {
            recordId: incoming.id,
            optionalFields: incomingQualifiedApiNames,
        });
        return merged;
    }

    return existing;
}

function mergeRecordConflict(
    lds: LDS,
    incoming: RecordRepresentationNormalized,
    existing: RecordRepresentationNormalized
) {
    const { apiName } = incoming;
    const incomingNode = lds.wrapNormalizedGraphNode<
        RecordRepresentationNormalized,
        RecordRepresentation
    >(incoming);
    const existingNode = lds.wrapNormalizedGraphNode<
        RecordRepresentationNormalized,
        RecordRepresentation
    >(existing);
    const incomingQualifiedApiNames = extractTrackedFields(incomingNode, apiName);
    const existingQualifiedApiNames = extractTrackedFields(existingNode, apiName);

    if (incoming.weakEtag > existing.weakEtag) {
        return mergeAndRefreshHigherVersionRecord(
            lds,
            incoming,
            existing,
            incomingQualifiedApiNames,
            existingQualifiedApiNames
        );
    }

    return mergeAndRefreshLowerVersionRecord(
        lds,
        incoming,
        existing,
        incomingQualifiedApiNames,
        existingQualifiedApiNames
    );
}

function getNotNull(recordAValue: string | null, recordBValue: string | null): string | null {
    return recordAValue === null ? recordBValue : recordAValue;
}

function mergeRecordFields(
    recordA: RecordRepresentationNormalized,
    recordB: RecordRepresentationNormalized
): RecordRepresentationNormalized {
    const lastModifiedDate = getNotNull(recordA.lastModifiedDate, recordB.lastModifiedDate);
    const lastModifiedById = getNotNull(recordA.lastModifiedById, recordB.lastModifiedById);
    const systemModstamp = getNotNull(recordA.systemModstamp, recordB.systemModstamp);
    return {
        ...recordA,
        fields: {
            ...recordB.fields,
            ...recordA.fields,
        },
        lastModifiedDate,
        lastModifiedById,
        systemModstamp,
    };
}

function isErrorEntry(
    entry: RecordRepresentationNormalized | StoreRecordError
): entry is StoreRecordError {
    return (entry as StoreRecordError).__type === 'error';
}

export default function merge(
    existing: RecordRepresentationNormalized | undefined | StoreRecordError,
    incoming: RecordRepresentationNormalized,
    lds: LDS,
    _path: IngestPath
): RecordRepresentationNormalized {
    if (existing === undefined || isErrorEntry(existing)) {
        return incoming;
    }

    // TODO - handle merging of records that change apiName
    // if (existing.apiName !== incoming.apiName) {
    //     if (process.env.NODE_ENV === 'production') {
    //         lds.log(`API Name changed from ${existing.apiName} to ${incoming.apiName}`);
    //     } else {
    //         throw new Error('API Name cannot be different for merging records.');
    //     }
    // }

    // TODO W-6900085 - UIAPI returns weakEtag=0 when the record is >2 levels nested. For now
    // we treat the record as mergeable.
    if (
        incoming.weakEtag !== 0 &&
        existing.weakEtag !== 0 &&
        incoming.weakEtag !== existing.weakEtag
    ) {
        return mergeRecordConflict(lds, incoming, existing);
    }

    return mergeRecordFields(incoming, existing);
}
