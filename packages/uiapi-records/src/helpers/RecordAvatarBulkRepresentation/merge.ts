import { RecordAvatarBulkRepresentationNormalized } from '../../generated/types/RecordAvatarBulkRepresentation';
import { LDS, IngestPath } from '@salesforce-lds/engine';

export default function merge(
    existing: RecordAvatarBulkRepresentationNormalized | undefined,
    incoming: RecordAvatarBulkRepresentationNormalized,
    _lds: LDS,
    _path: IngestPath
): RecordAvatarBulkRepresentationNormalized {
    if (existing === undefined) {
        return incoming;
    }

    // Merge RecordRepresentation field values together
    return {
        ...existing,
        ...incoming,
    };
}
