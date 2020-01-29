import { RecordCreateDefaultRecordRepresentationNormalized } from '../../generated/types/RecordCreateDefaultRecordRepresentation';
import { LDS, IngestPath } from '@salesforce-lds/engine';

export default function merge(
    existing: RecordCreateDefaultRecordRepresentationNormalized | undefined,
    incoming: RecordCreateDefaultRecordRepresentationNormalized,
    _lds: LDS,
    _path: IngestPath
): RecordCreateDefaultRecordRepresentationNormalized {
    if (existing === undefined) {
        return incoming;
    }

    // Merge RecordCreateDefaultRecordRepresentationNormalized record field values together
    return {
        ...incoming,
        fields: {
            ...existing.fields,
            ...incoming.fields,
        },
    };
}
