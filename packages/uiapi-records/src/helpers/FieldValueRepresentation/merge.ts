import { FieldValueRepresentationNormalized } from '../../generated/types/FieldValueRepresentation';
import { LDS, IngestPath } from '@salesforce-lds/engine';
import { RecordRepresentationNormalized } from '../../generated/types/RecordRepresentation';

export default function merge(
    existing: FieldValueRepresentationNormalized | undefined,
    incoming: FieldValueRepresentationNormalized,
    _lds: LDS,
    path: IngestPath
): FieldValueRepresentationNormalized {
    if (existing === undefined) {
        return incoming;
    }

    // TODO: (W-) add the work item # once the UISDK creates a WI for long term fix.
    // Temporary fix for the issue that non-null displayValue gets replaced by null.
    if (incoming.displayValue === null && existing.displayValue !== null) {
        incoming.displayValue = existing.displayValue;
    }

    const { value } = incoming;
    if (value === null || (value as any).__ref === undefined) {
        // Parent will never be null this field only exists in the context of a RecordRep.
        const parent = path.parent!;

        // It may happen that a parent.exists is null, this is the case when the same field is
        // ingested multiple times in the same ingestion cycle. For example: when the same record
        // is present multiple time in the ingested payload.
        if (parent.existing === undefined) {
            return incoming;
        }

        const existingVersion = (parent.existing as RecordRepresentationNormalized).weakEtag;
        const incomingVersion = (parent.data as RecordRepresentationNormalized).weakEtag;

        if (existingVersion > incomingVersion) {
            return existing;
        }
    }

    return incoming;
}
