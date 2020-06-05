import { StoreLink, IngestPath, LDS, Store } from '@ldsjs/engine';
import {
    RecordRepresentationNormalized,
    RecordRepresentation,
    TTL,
    validate,
    KeyParams,
    keyBuilder,
    keyBuilderFromType as generatedKeyBuilderFromType,
    normalize,
    select,
    equals,
    deepFreeze,
    ingest as generatedIngest,
} from '../../generated/types/RecordRepresentation';
import { createLink } from '../../generated/types/type-utils';
import { keyPrefix } from '../../generated/adapters/adapter-utils';
import { default as helpers_RecordRepresentation_merge_default } from '../../helpers/RecordRepresentation/merge';

export {
    RecordRepresentationNormalized,
    RecordRepresentation,
    TTL,
    validate,
    KeyParams,
    keyBuilder,
    normalize,
    select,
    equals,
    deepFreeze,
};

const VIEW_ENTITY_API_NAME = 'Name';
const VIEW_ENTITY_KEY_PREFIX = `${keyPrefix}RecordViewEntityRepresentation:${VIEW_ENTITY_API_NAME}:`;

export const keyBuilderFromType: typeof generatedKeyBuilderFromType = function RecordRepresentationKeyBuilderFromType(
    object: RecordRepresentation
) {
    const { apiName, id } = object;
    if (apiName === VIEW_ENTITY_API_NAME) {
        return VIEW_ENTITY_KEY_PREFIX + id;
    }

    return generatedKeyBuilderFromType(object);
};

export const ingest: typeof generatedIngest = function RecordRepresentationIngest(
    input: RecordRepresentation,
    path: IngestPath,
    lds: LDS,
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
