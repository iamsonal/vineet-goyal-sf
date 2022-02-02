import { Luvio, Snapshot, StoreLookup } from '@luvio/engine';
import {
    buildCachedSnapshotCachePolicy as generatedBuildCachedSnapshotCachePolicy,
    GetWaveTemplateConfigConfig,
} from '../../../generated/adapters/getWaveTemplateConfig';
import { TemplateConfigurationRepresentation } from '../../../generated/types/TemplateConfigurationRepresentation';
import { templateNameToIdCache } from '../../utils/templateNameToIdCache';

export function buildCachedSnapshotCachePolicy(
    context: { luvio: Luvio; config: GetWaveTemplateConfigConfig },
    storeLookup: StoreLookup<TemplateConfigurationRepresentation>
): Snapshot<TemplateConfigurationRepresentation> {
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
