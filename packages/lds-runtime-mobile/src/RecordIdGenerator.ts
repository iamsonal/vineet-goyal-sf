const Checksum = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ012345';
const Base62 = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz';

// This is largest number that can be represented by 7 base-62 chars. We rollover
// on this value
const Rollover = 3521614606207;

// The 15-char or 18-char Salesforce record gives us 12 characters for the
// unique id. Breaking down the 18-char id, we have:
//
//   prefix client-id timestamp     checksum
//   +-----+---------+-------------+-----+
//   |P|P|P|C|C|C|C|C|T|T|T|T|T|T|T|S|S|S|
//   +-----+---------+-------------+-----+
//
// where:
//    P - prefix
//    C - client id, 5 base-62 chars supports 916,132,831 clients
//    T - timestamp, 7 base-62 chars is 3,521,614,606,207 which
//        in UNIX epoch is Aug 05 2081 giving us support for
//        61 years (starting date Jan 01 2020).
//    S - checksum

function timestamp(): number {
    return new Date().getTime() % Rollover;
}

function waitNextMilliSeconds(currentTimestamp: number, lastTimestamp: number): number {
    let current = currentTimestamp;
    while (current <= lastTimestamp) {
        current = timestamp();
    }
    return current;
}

function numberAs7CharRecordId(value: number): string {
    let buffer = numberAsBase62(value);
    buffer = '0'.repeat(7 - buffer.length) + buffer;
    return buffer;
}

function numberAsBase62(value: number): string {
    let v = value;
    let buffer = '';
    while (v > 0) {
        const rem = v % 62;
        buffer = Base62[rem] + buffer;
        v = Math.floor(v / 62);
    }
    return buffer;
}

function recordIdWithChecksum(recordId: string): string {
    const a = reverse(recordId.substring(0, 5));
    const b = reverse(recordId.substring(5, 10));
    const c = reverse(recordId.substring(10, 15));

    let n1 = 0,
        n2 = 0,
        n3 = 0;
    for (let i = 0; i < 5; ++i) {
        const a1 = a[i].charCodeAt(0);
        const b1 = b[i].charCodeAt(0);
        const c1 = c[i].charCodeAt(0);
        if (a1 >= 65 && a1 <= 90) n1 |= 1; // A..Z
        n1 <<= 1;

        if (b1 >= 65 && b1 <= 90) n2 |= 1; // A..Z
        n2 <<= 1;

        if (c1 >= 65 && c1 <= 90) n3 |= 1; // A..Z
        n3 <<= 1;
    }
    n1 >>= 1;
    n2 >>= 1;
    n3 >>= 1;

    return recordId + Checksum[n1] + Checksum[n2] + Checksum[n3];
}

function reverse(value: string): string {
    return value.split('').reverse().join('');
}

function base62AsNumber(value: string): number {
    let result = 0;
    for (const c of value) {
        const code = c.charCodeAt(0);
        if (code >= 48 && code <= 57) {
            // 0..9
            result = result * 62 + (code - 48);
        } else if (code >= 65 && code <= 90) {
            // A..Z
            result = result * 62 + (code - 65 + 10);
        } else if (code >= 97 && code <= 122) {
            // a..z
            result = result * 62 + (code - 97 + 36);
        }
    }
    return result;
}

function isGenerated(recordId: string, id: string): boolean | never {
    if (recordId === undefined || (recordId.length !== 15 && recordId.length !== 18)) {
        return false;
    }

    const clientId = recordId.substring(3, 8);
    return id === clientId;
}

export const recordIdGenerator = (id: string) => {
    if (id === undefined || (id.length !== 15 && id.length !== 18)) {
        throw Error('user id must be 15 or 18 chars');
    }
    const clientId = id.substring(10, 15);
    let lastTimestamp = timestamp();
    return {
        /**
         * Returns a new record id with the provided prefix
         */
        newRecordId: (prefix: string) => {
            if (prefix === undefined || prefix.length !== 3) {
                throw Error('Missing or prefix is not 3 characters long');
            }
            lastTimestamp = waitNextMilliSeconds(timestamp(), lastTimestamp);
            const id = prefix + clientId + numberAs7CharRecordId(lastTimestamp);
            return recordIdWithChecksum(id);
        },
        /**
         * Returns true if the recordId was generated using this generator; false otherwise
         */
        isGenerated: (recordId: string) => {
            return isGenerated(recordId, clientId);
        },
        /**
         * Returns a number value of when the record was generated.
         * Throws if the recordId passed is invalid or the recordId was not generated.
         */
        recordGenerationTime: (recordId: string) => {
            if (recordId === undefined || (recordId.length !== 15 && recordId.length !== 18)) {
                throw Error('record id must be 15 or 18 chars');
            }

            if (!isGenerated(recordId, clientId)) {
                throw Error('record id not generated');
            }

            const timestamp = recordId.substring(8, 15);
            return base62AsNumber(timestamp);
        },
    };
};
