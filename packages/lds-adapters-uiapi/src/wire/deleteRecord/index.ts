import { LDS, FetchResponse } from '@ldsjs/engine';

import coerceRecordId18 from '../../primitives/RecordId18/coerce';

import { keyBuilder } from '../../generated/types/RecordRepresentation';
import deleteUiApiRecordsByRecordId from '../../generated/resources/deleteUiApiRecordsByRecordId';
import { deepFreeze } from '../../util/deep-freeze';

export const factory = (lds: LDS) => (recordId: unknown) => {
    const coercedRecordId = coerceRecordId18(recordId);

    if (coercedRecordId === undefined) {
        throw new TypeError('Unexpected parameter, expected a Salesforce Record id.');
    }

    const request = deleteUiApiRecordsByRecordId({
        urlParams: {
            recordId: coercedRecordId,
        },
    });

    return lds.dispatchResourceRequest(request).then(
        () => {
            const storeRecordKey = keyBuilder({ recordId: coercedRecordId });

            lds.storeEvict(storeRecordKey);
            lds.storeBroadcast();
        },
        (err: FetchResponse<{ error: string }>) => {
            deepFreeze(err);
            throw err;
        }
    );
};

// TODO W-6703470 - deleteRecord should get generated and this hand-written
// function should put "recordId" into a config object envelope and then
// return the generated adapter factory using that config
export function deleteRecordNativeAdapterFactory(recordId: unknown) {
    const coercedRecordId = coerceRecordId18(recordId);

    return {
        name: 'deleteRecord',
        config: { recordId: coercedRecordId },
    };
}
