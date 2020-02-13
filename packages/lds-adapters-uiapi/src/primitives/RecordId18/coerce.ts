import { isString } from '../../validation/utils';

const RECORD_ID_DECODER = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456';

/**
 * Converts to 18-char record ids. Details at http://sfdc.co/bnBMvm.
 * @param value A 15- or 18-char record id.
 * @returns An 18-char record id, and throws error if an invalid record id was provided.
 */
export default function getRecordId18(value: unknown): string | undefined {
    if (!isString(value)) {
        return undefined;
    } else if (value.length === 18) {
        return value;
    } else if (value.length === 15) {
        // Add the 3 character suffix
        let recordId = value;
        for (let offset = 0; offset < 15; offset += 5) {
            let decodeValue = 0;
            for (let bit = 0; bit < 5; bit++) {
                const c = value[offset + bit];
                if (c >= 'A' && c <= 'Z') {
                    decodeValue += 1 << bit;
                }
            }
            recordId += RECORD_ID_DECODER[decodeValue];
        }
        return recordId;
    }
    return undefined;
}
