import { deepFreeze } from '../../util/deep-freeze';
import type { Luvio, Snapshot, FetchResponse } from '@luvio/engine';
import {
    updateRecordAvatar_ConfigPropertyNames as updateRecordAvatarConfigProperties,
    validateAdapterConfig,
} from '../../generated/adapters/updateRecordAvatar';
import type { AbstractRecordAvatarRepresentation } from '../../generated/types/AbstractRecordAvatarRepresentation';
import {
    keyBuilderFromType,
    getTypeCacheKeys,
} from '../../generated/types/AbstractRecordAvatarRepresentation';
import type { ResourceRequestConfig } from '../../generated/resources/postUiApiRecordAvatarsAssociationByRecordId';
import postUiApiRecordAvatarsAssociationByRecordId from '../../generated/resources/postUiApiRecordAvatarsAssociationByRecordId';
import type { PhotoRecordAvatarRepresentation } from '../../generated/types/PhotoRecordAvatarRepresentation';
import {
    select as photoSelector,
    ingest as photoIngest,
} from '../../generated/types/PhotoRecordAvatarRepresentation';
import type { ThemeRecordAvatarRepresentation } from '../../generated/types/ThemeRecordAvatarRepresentation';
import {
    select as themeSelector,
    ingest as themeIngest,
} from '../../generated/types/ThemeRecordAvatarRepresentation';

export const factory = (luvio: Luvio) => {
    return (untrustedConfig: unknown): Promise<Snapshot<AbstractRecordAvatarRepresentation>> => {
        const config = validateAdapterConfig(untrustedConfig, updateRecordAvatarConfigProperties);
        if (config === null) {
            // eslint-disable-next-line @salesforce/lds/no-error-in-production
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
            (response) => {
                const { body } = response;
                const key = keyBuilderFromType(body);

                return luvio.handleSuccessResponse(
                    () => {
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
                            // eslint-disable-next-line @salesforce/lds/no-error-in-production
                            throw new Error('Unsupported avatar type');
                        }

                        // TODO [W-6804405]: support unions on fragments (only supported on links today)
                        const snapshot = luvio.storeLookup<AbstractRecordAvatarRepresentation>({
                            recordId: key,
                            node: selectors(),
                            variables: {},
                        });

                        luvio.storeBroadcast();

                        return snapshot;
                    },
                    () => getTypeCacheKeys(body, () => key)
                );
            },
            (err: FetchResponse<{ error: string }>) => {
                deepFreeze(err);
                throw err;
            }
        );
    };
};
