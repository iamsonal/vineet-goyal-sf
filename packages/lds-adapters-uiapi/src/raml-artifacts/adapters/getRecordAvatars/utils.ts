import type { Fragment, Luvio, Selector } from '@luvio/engine';
import { keyPrefix } from '../../../generated/adapters/adapter-utils';
import type { GetRecordAvatarsConfig as BaseGetRecordAvatarsConfig } from '../../../generated/adapters/getRecordAvatars';
import { selectChildren as selectChildrenAbstractRecordAvatarBatchRepresentation } from '../../../generated/types/AbstractRecordAvatarBatchRepresentation';

// All of the avatars are ingested into
// the same top level object
export const KEY = `${keyPrefix}RecordAvatarsBulk`;

// The config object is overridden here in order to pass along the uncached record IDs
// to a custom implementation of buildNetworkSnapshot which in turn uses this list
// to implement custom network dedupe logic based on this list and an internal list of
// outstanding network requests.
export interface GetRecordAvatarsConfig extends BaseGetRecordAvatarsConfig {
    uncachedRecordIds?: Array<string>;
}

export type BuildSnapshotContext = {
    luvio: Luvio;
    config: GetRecordAvatarsConfig;
    uncachedRecordIds?: string[];
};

export function recordAvatarsFragment(recordIds: string[]): Fragment {
    return {
        kind: 'Fragment',
        private: [],
        selections: recordIds.map((recordId: string) => {
            return {
                kind: 'Link',
                name: recordId,
                fragment: selectChildrenAbstractRecordAvatarBatchRepresentation(),
            };
        }),
    };
}

export function recordAvatarsSelector(recordIds: string[]): Selector {
    return {
        recordId: KEY,
        node: recordAvatarsFragment(recordIds),
        variables: {},
    };
}
