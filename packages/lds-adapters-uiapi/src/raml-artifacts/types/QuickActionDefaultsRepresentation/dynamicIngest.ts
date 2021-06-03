import { IngestPath, Luvio, Store, StoreLink } from '@luvio/engine';
import {
    validate,
    DynamicIngestParams,
    keyBuilderFromType,
    QuickActionDefaultsRepresentation,
    QuickActionDefaultsRepresentationNormalized,
    dynamicNormalize,
    dynamicIngest as generatedDynamicIngest,
    equals,
} from '../../../generated/types/QuickActionDefaultsRepresentation';
import { createLink } from '../../../generated/types/type-utils';

function merge(
    existing: QuickActionDefaultsRepresentationNormalized | undefined,
    incoming: QuickActionDefaultsRepresentationNormalized
) {
    if (existing === undefined) {
        return incoming;
    }

    // Merge QuickActionDefaultsRepresentation field values together
    return {
        ...incoming,
        fields: {
            ...existing.fields,
            ...incoming.fields,
        },
    };
}

export const dynamicIngest: typeof generatedDynamicIngest = (ingestParams: DynamicIngestParams) => {
    return function QuickActionDefaultsRepresentationIngest(
        input: QuickActionDefaultsRepresentation,
        path: IngestPath,
        luvio: Luvio,
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
        const existingRecord = store.records[key];
        // do not ingest locked records
        if (existingRecord !== undefined && existingRecord.__type === 'locked') {
            path.state.result.type = 'locked';
            return createLink(key);
        }

        let incomingRecord = dynamicNormalize(ingestParams)(
            input,
            store.records[key],
            {
                fullPath: key,
                parent: path.parent,
                propertyName: path.propertyName,
                state: path.state,
            } as IngestPath,
            luvio,
            store,
            timestamp
        );
        incomingRecord = merge(existingRecord, incomingRecord);

        if (existingRecord === undefined || equals(existingRecord, incomingRecord) === false) {
            luvio.storePublish(key, incomingRecord);
        }

        luvio.storeSetExpiration(key, timestamp + 900000);

        return createLink(key);
    };
};
