import { Selector, Luvio } from '@luvio/engine';
import {
    RecordLayoutUserStateRepresentation,
    keyBuilder,
    select,
} from '../../../generated/types/RecordLayoutUserStateRepresentation';
import { buildNetworkSnapshot } from './buildNetworkSnapshot';
import { GetLayoutUserStateConfig } from './getLayoutUserStateConfig';

export function buildCachedSnapshot(luvio: Luvio, config: GetLayoutUserStateConfig) {
    const { objectApiName, recordTypeId, layoutType, mode } = config;
    const key = keyBuilder({
        apiName: objectApiName,
        recordTypeId,
        layoutType,
        mode,
    });

    const selector: Selector = {
        recordId: key,
        node: select(),
        variables: {},
    };

    return luvio.storeLookup<RecordLayoutUserStateRepresentation>(selector, {
        config,
        resolve: () => buildNetworkSnapshot(luvio, config),
    });
}
