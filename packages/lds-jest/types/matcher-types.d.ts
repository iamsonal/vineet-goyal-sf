/* eslint-disable no-redeclare */

// TS raises errors if you don't add custom matchers to the JestMatchersShape
// so we have this declaration file to do that.

export {};

declare global {
    // have to use jest namespace, declarations will get merged with jest types
    // in node_modules
    namespace jest {
        interface Matchers<R> {
            toEqualFulfilledSnapshotWithData: (expected: any, privateProperties?: string[]) => R;
            toEqualStaleSnapshotWithData: (expected: any, privateProperties?: string[]) => R;
            toHaveBeenCalledWithDataTuple: (expected: any, privateProperties?: string[]) => R;
        }
    }
}
