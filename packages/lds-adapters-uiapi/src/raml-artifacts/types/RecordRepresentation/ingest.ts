import { IngestPath, Luvio, Store, StoreLink } from '@luvio/engine';
import {
    equals,
    ingest as generatedIngest,
    normalize,
    RecordRepresentation,
    validate,
} from '../../../generated/types/RecordRepresentation';
import { createLink } from '../../../generated/types/type-utils';
import { default as helpers_RecordRepresentation_merge_default } from '../../../helpers/RecordRepresentation/merge';
import { keyBuilderFromType } from './keyBuilderFromType';

export const ingest: typeof generatedIngest = function RecordRepresentationIngest(
    input: RecordRepresentation,
    path: IngestPath,
    lds: Luvio,
    store: Store,
    timestamp: number
): StoreLink {
    if (process.env.NODE_ENV !== 'production') {
        const validateError = validate(input);
        if (validateError !== null) {
            throw validateError;
        }
    }

    const key = keyBuilderFromType(input);

    let incomingRecord = normalize(
        input,
        store.records[key],
        {
            fullPath: key,
            parent: path.parent,
        },
        lds,
        store,
        timestamp
    );
    const existingRecord = store.records[key];

    incomingRecord = helpers_RecordRepresentation_merge_default(
        existingRecord,
        incomingRecord,
        lds,
        path
    );

    if (existingRecord === undefined || equals(existingRecord, incomingRecord) === false) {
        lds.storePublish(key, incomingRecord);
    }

    lds.storeSetExpiration(key, timestamp + 30000);

    return createLink(key);
};
