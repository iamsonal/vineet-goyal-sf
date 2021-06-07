import { FulfilledSnapshot, Snapshot } from '@luvio/engine';
import { isImmutable, stripProperties } from '@luvio/adapter-test-library';

function isFulfilledSnapshot(
    snapshot: Snapshot<unknown, unknown>
): snapshot is FulfilledSnapshot<unknown, unknown> {
    return snapshot.state === 'Fulfilled';
}

type MatcherResult = { pass: boolean; message: () => string };

// type declarations for custom matchers are in ../types/matcher-types.d.ts - any custom
// matchers must have declaration there or TS will yell at us
export const customMatchers = {
    toEqualFulfilledSnapshotWithData: (
        snapshot: Snapshot<unknown, unknown>,
        expected: any,
        privateProperties?: string[]
    ): MatcherResult => {
        if (isFulfilledSnapshot(snapshot)) {
            const expectedWithoutPrivateProperties = stripProperties(
                expected,
                privateProperties || []
            );
            expect(snapshot.data).toEqual(expectedWithoutPrivateProperties);
            expect(isImmutable(snapshot.data)).toBe(true);
            return { pass: true, message: () => 'Snapshot is a FulfilledSnapshot' };
        }

        return {
            pass: false,
            message: () => 'Actual Snapshot is not a FulfilledSnapshot.',
        };
    },
};
