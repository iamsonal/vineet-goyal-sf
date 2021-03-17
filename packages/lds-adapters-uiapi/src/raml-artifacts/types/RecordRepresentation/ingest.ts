import { ingest as generatedIngest } from '../../../generated/types/RecordRepresentation';
import { createRecordIngest } from '../../../util/record-ingest';
import { BLANK_RECORD_FIELDS_TRIE } from '../../../util/records';

export const ingest: typeof generatedIngest = createRecordIngest(
    BLANK_RECORD_FIELDS_TRIE,
    BLANK_RECORD_FIELDS_TRIE
);
