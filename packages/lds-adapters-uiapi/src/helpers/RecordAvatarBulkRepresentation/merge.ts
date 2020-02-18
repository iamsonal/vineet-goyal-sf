import { RecordAvatarBulkMapRepresentationNormalized } from '../../generated/types/RecordAvatarBulkMapRepresentation';
import { LDS, IngestPath } from '@ldsjs/engine';

export default function merge(
    existing: RecordAvatarBulkMapRepresentationNormalized | undefined,
    incoming: RecordAvatarBulkMapRepresentationNormalized,
    _lds: LDS,
    _path: IngestPath
): RecordAvatarBulkMapRepresentationNormalized {
    if (existing === undefined) {
        return incoming;
    }

    // Merge RecordRepresentation field values together
    return {
        ...existing,
        ...incoming,
    };
}
