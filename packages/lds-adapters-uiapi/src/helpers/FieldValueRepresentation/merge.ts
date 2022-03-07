import type { FieldValueRepresentationNormalized } from '../../generated/types/FieldValueRepresentation';
import type { Luvio, IngestPath } from '@luvio/engine';
import type { RecordRepresentationNormalized } from '../../generated/types/RecordRepresentation';
import { instrumentation } from '../../instrumentation';

export default function merge(
    existing: FieldValueRepresentationNormalized | undefined,
    incoming: FieldValueRepresentationNormalized,
    _luvio: Luvio,
    path: IngestPath
): FieldValueRepresentationNormalized {
    if (existing === undefined) {
        return incoming;
    }

    fixDisplayValue(existing, incoming, path);

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

function fixDisplayValue(
    existing: FieldValueRepresentationNormalized,
    incoming: FieldValueRepresentationNormalized,
    path: IngestPath
) {
    // Temporary fix for the issue that non-null displayValue gets replaced by null in mistake. (W-8904195)
    // If displayValue and value are both null, it means the field is empty.
    //
    // Couple sources may emit incorrect null displayValue to LDS:
    //   1. ADS may receive records with incorrect null displayValue from RecordGvp and emit to LDS.
    //      This case may affect certain types of fields:
    //      a. Spanning record field.
    //      b. Formattable fields, such as date, currency.
    //   2. AggregateUi endpoint. For some fields, displayValue only gets populated when certain combination
    //      of fields are requested. Currently, LDS handles large record requests with aggregateUi endpoint.
    //      On the network layer, record fields get split into separate chunks. Potentially, when certain
    //      combination of fields gets split into separate chunks, it would result in displayValue getting set
    //      to null.
    //   3. Any resource that returns nested Records, like list-records and list-ui, potentially exhibits this behavior
    //
    // There might be more cases masked by this workaround. We need to be careful when removing this code.
    // It would be required to have some telemetries in prod to verify if any code hits this workaround.

    const incomingValue = incoming.value;
    if (
        existing.displayValue !== null &&
        incoming.displayValue === null &&
        incomingValue !== null
    ) {
        incoming.displayValue = existing.displayValue;

        const isSpanningRecord = typeof incomingValue === 'object';
        instrumentation.nullDisplayValueConflict({
            entityName: (path.parent!.data as RecordRepresentationNormalized).apiName,
            fieldName: path.propertyName as string,
            fieldType: isSpanningRecord ? 'spanning-record' : 'scalar',
            areValuesEqual: isSpanningRecord ? undefined : incomingValue === existing.value,
        });
    }
}
