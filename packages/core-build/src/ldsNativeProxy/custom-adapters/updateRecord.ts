import { LDSNative } from '@ldsjs/engine';
import {
    UpdateRecord_Native,
    untrustedIsObject,
    UpdateRecordConfig,
    UpdateRecordClientOptions,
    RecordRepresentation,
} from '@salesforce-lds-api/uiapi-records';

// Adapter factories are ideally generated from RAML, but some exports need to support
// their pre-224 behavior on the platform, so this function captures that for the
// updateRecord function.  The platform version takes in a 2nd parameter to capture
// the IfModifiedSince header, so this is where we munge that all together into
// a nice little config object that the RAML generated version can handle.
export function coreCompliantUpdateRecordFactory(ldsNative: LDSNative) {
    const updateRecordAdapter = ldsNative.register(UpdateRecord_Native);
    return (untrusted: unknown, clientOptions?: unknown): Promise<RecordRepresentation> => {
        let config = null;

        // get record id from fields
        if (
            untrustedIsObject<UpdateRecordConfig>(untrusted) &&
            untrustedIsObject(untrusted.fields)
        ) {
            config = { recordId: untrusted.fields.Id, ...untrusted };
        }

        // get ifModifiedSince header from clientOptions
        if (
            config !== null &&
            untrustedIsObject<UpdateRecordClientOptions>(clientOptions) &&
            typeof clientOptions.ifUnmodifiedSince === 'string'
        ) {
            config.ifUnmodifiedSince = clientOptions.ifUnmodifiedSince;
        }

        return updateRecordAdapter(config);
    };
}
