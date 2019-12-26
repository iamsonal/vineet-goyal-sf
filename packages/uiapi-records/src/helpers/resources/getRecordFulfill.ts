import { ResourceRequest } from '@salesforce-lds/engine';
import { isSuperset } from '../../util/records';
import { ArrayIsArray, ObjectKeys } from '../../util/language';

export default function fulfill(existing: ResourceRequest, incoming: ResourceRequest): boolean {
    // early out if incoming isn't a request only for fields and optionalFields
    const { queryParams, headers, path } = incoming;
    const { path: existingPath, headers: existingHeaders } = existing;

    if (queryParams.layoutTypes !== undefined) {
        return false;
    }

    if (existingPath !== path) {
        return false;
    }

    const headersKeys = ObjectKeys(headers);
    const headersKeyLength = headersKeys.length;
    if (headersKeyLength !== ObjectKeys(existingHeaders).length) {
        return false;
    }

    for (let i = 0, len = headersKeyLength; i < len; i++) {
        let key = headersKeys[i];
        if (headers[key] !== existingHeaders[key]) {
            return false;
        }
    }

    // TODO W-6900100 - handle when incoming.fields are only in existing.optionalFields, and
    // existing's response doesn't include those fields. We need to detect this then
    // re-issue the request to get the relevant error response.

    const existingFieldsUnion = unionFields(
        existing.queryParams.fields,
        existing.queryParams.optionalFields
    );
    const incomingFieldsUnion = unionFields(queryParams.fields, queryParams.optionalFields);
    return isSuperset(existingFieldsUnion, incomingFieldsUnion);
}

function unionFields(fields: any, optionalFields: any): Array<string> {
    const fieldsArray = ArrayIsArray(fields) ? fields : [];
    const optionalFieldsArray = ArrayIsArray(optionalFields) ? optionalFields : [];
    return [...fieldsArray, ...optionalFieldsArray];
}
