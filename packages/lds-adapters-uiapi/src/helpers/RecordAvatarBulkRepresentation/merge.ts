import type { RecordAvatarBulkMapRepresentationNormalized } from '../../generated/types/RecordAvatarBulkMapRepresentation';
import type { Luvio, IngestPath } from '@luvio/engine';

export default function merge(
    existing: RecordAvatarBulkMapRepresentationNormalized | undefined,
    incoming: RecordAvatarBulkMapRepresentationNormalized,
    _luvio: Luvio,
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
