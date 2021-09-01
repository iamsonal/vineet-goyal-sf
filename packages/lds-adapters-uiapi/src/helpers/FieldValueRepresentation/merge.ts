import { FieldValueRepresentationNormalized } from '../../generated/types/FieldValueRepresentation';
import { Luvio, IngestPath } from '@luvio/engine';
import { RecordRepresentationNormalized } from '../../generated/types/RecordRepresentation';
import { instrumentation } from '../../instrumentation';

interface LightningInteractionSchema {
    kind: 'interaction';
    target: string;
    scope: string;
    context: unknown;
    eventSource: string;
    eventType: string;
    attributes: unknown;
}

export default function merge(
    existing: FieldValueRepresentationNormalized | undefined,
    incoming: FieldValueRepresentationNormalized,
    luvio: Luvio,
    path: IngestPath
): FieldValueRepresentationNormalized {
    if (existing === undefined) {
        return incoming;
    }

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
    if (
        incoming.displayValue === null &&
        incoming.value !== null &&
        existing.displayValue !== null
    ) {
        incoming.displayValue = existing.displayValue;

        instrumentation.nullDisplayValueConflict(
            (path.parent!.data as RecordRepresentationNormalized).apiName,
            path.propertyName
        );
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
