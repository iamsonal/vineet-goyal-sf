import { deepFreeze } from '../../util/deep-freeze';
import { Luvio, Snapshot, FetchResponse } from '@luvio/engine';
import {
    updateRecordAvatar_ConfigPropertyNames as updateRecordAvatarConfigProperties,
    validateAdapterConfig,
} from '../../generated/adapters/updateRecordAvatar';
import {
    AbstractRecordAvatarRepresentation,
    keyBuilderFromType,
} from '../../generated/types/AbstractRecordAvatarRepresentation';
import postUiApiRecordAvatarsAssociationByRecordId, {
    ResourceRequestConfig,
} from '../../generated/resources/postUiApiRecordAvatarsAssociationByRecordId';
import {
    select as photoSelector,
    PhotoRecordAvatarRepresentation,
    ingest as photoIngest,
} from '../../generated/types/PhotoRecordAvatarRepresentation';
import {
    select as themeSelector,
    ThemeRecordAvatarRepresentation,
    ingest as themeIngest,
} from '../../generated/types/ThemeRecordAvatarRepresentation';

export const factory = (luvio: Luvio) => {
    return (untrustedConfig: unknown): Promise<Snapshot<AbstractRecordAvatarRepresentation>> => {
        const config = validateAdapterConfig(untrustedConfig, updateRecordAvatarConfigProperties);
        if (config === null) {
            throw new Error('updateRecordAvatar invalid configuration');
        }
        const resourceParams: ResourceRequestConfig = {
            urlParams: {
                recordId: config.recordId,
            },
            body: {
                externalId: config.externalId,
                blueMasterId: config.blueMasterId,
                profileName: config.profileName,
                photoUrl: config.photoUrl,
                actionType: config.actionType,
            },
        };
        const request = postUiApiRecordAvatarsAssociationByRecordId(resourceParams);
        return luvio.dispatchResourceRequest<AbstractRecordAvatarRepresentation>(request).then(
            response => {
                const { body } = response;
                const key = keyBuilderFromType(body);
                let selectors;
                if (body.type === 'Theme') {
                    selectors = themeSelector;
                    luvio.storeIngest<ThemeRecordAvatarRepresentation>(
                        key,
                        themeIngest,
                        body as ThemeRecordAvatarRepresentation
                    );
                } else if (body.type === 'Photo') {
                    selectors = photoSelector;
                    luvio.storeIngest<PhotoRecordAvatarRepresentation>(
                        key,
                        photoIngest,
                        body as PhotoRecordAvatarRepresentation
                    );
                } else {
                    throw new Error('Unsupported avatar type');
                }

                luvio.storeBroadcast();
                // TODO W-6804405 - support unions on fragments (only supported on links today)
                return luvio.storeLookup<AbstractRecordAvatarRepresentation>({
                    recordId: key,
                    node: selectors(),
                    variables: {},
                });
            },
            (err: FetchResponse<{ error: string }>) => {
                deepFreeze(err);
                throw err;
            }
        );
    };
};
