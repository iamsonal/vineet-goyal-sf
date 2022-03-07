import type { Luvio, Snapshot, StoreLookup } from '@luvio/engine';
import type { GetWaveTemplateConfig } from '../../../generated/adapters/getWaveTemplate';
import { buildCachedSnapshotCachePolicy as generatedBuildCachedSnapshotCachePolicy } from '../../../generated/adapters/getWaveTemplate';
import type { TemplateRepresentation } from '../../../generated/types/TemplateRepresentation';
import { templateNameToIdCache } from '../../utils/templateNameToIdCache';

export function buildCachedSnapshotCachePolicy(
    context: { luvio: Luvio; config: GetWaveTemplateConfig },
    storeLookup: StoreLookup<TemplateRepresentation>
): Snapshot<TemplateRepresentation> {
    const { config, luvio } = context;
    // see if templateIdOrApiName is a name for which we have the id and, if so, return that snapshot
    const id = templateNameToIdCache.get(config.templateIdOrApiName);
    if (id && id !== config.templateIdOrApiName) {
        return generatedBuildCachedSnapshotCachePolicy(
            { luvio, config: { templateIdOrApiName: id } },
            storeLookup
        );
    }
    // otherwise, check it as normal against the id snapshots
    return generatedBuildCachedSnapshotCachePolicy(context, storeLookup);
}
