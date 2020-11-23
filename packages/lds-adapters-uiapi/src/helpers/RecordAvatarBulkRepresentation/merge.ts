import { RecordAvatarBulkMapRepresentationNormalized } from '../../generated/types/RecordAvatarBulkMapRepresentation';
import { Luvio, IngestPath } from '@luvio/engine';

export default function merge(
    existing: RecordAvatarBulkMapRepresentationNormalized | undefined,
    incoming: RecordAvatarBulkMapRepresentationNormalized,
    _lds: Luvio,
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
