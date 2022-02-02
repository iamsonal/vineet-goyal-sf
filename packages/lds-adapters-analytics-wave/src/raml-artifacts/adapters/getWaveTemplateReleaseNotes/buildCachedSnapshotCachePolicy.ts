import { Luvio, Snapshot, StoreLookup } from '@luvio/engine';
import {
    buildCachedSnapshotCachePolicy as generatedBuildCachedSnapshotCachePolicy,
    GetWaveTemplateReleaseNotesConfig,
} from '../../../generated/adapters/getWaveTemplateReleaseNotes';
import { TemplateReleaseNotesRepresentation } from '../../../generated/types/TemplateReleaseNotesRepresentation';
import { templateNameToIdCache } from '../../utils/templateNameToIdCache';

export function buildCachedSnapshotCachePolicy(
    context: { luvio: Luvio; config: GetWaveTemplateReleaseNotesConfig },
    storeLookup: StoreLookup<TemplateReleaseNotesRepresentation>
): Snapshot<TemplateReleaseNotesRepresentation> {
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
