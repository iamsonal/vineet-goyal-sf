import { deepFreeze } from '../../util/deep-freeze';
import { Snapshot, Luvio, FetchResponse, ResourceRequest } from '@luvio/engine';
import { RecordLayoutUserStateInputRepresentation } from '../../generated/types/RecordLayoutUserStateInputRepresentation';
import { buildInMemorySnapshot as cacheLookupGetLayoutUserState } from '../../raml-artifacts/adapters/getLayoutUserState/buildInMemorySnapshot';
import { GetLayoutUserStateConfig as GetLayoutUserStateConfigWithDefaults } from '../../raml-artifacts/adapters/getLayoutUserState/getLayoutUserStateConfig';
import { validateAdapterConfig as coerceGetLayoutUserStateConfigWithDefaults } from '../../raml-artifacts/adapters/getLayoutUserState/validateAdapterConfig';
import { getLayoutUserState_ConfigPropertyNames } from '../../raml-artifacts/adapters/getLayoutUserState/getLayoutUserState_ConfigPropertyNames';
import {
    RecordLayoutUserStateRepresentation,
    keyBuilder,
    ingest,
} from '../../generated/types/RecordLayoutUserStateRepresentation';
import patchUiApiLayoutUserStateByObjectApiName from '../../generated/resources/patchUiApiLayoutUserStateByObjectApiName';
import { validate as validateRecordLayoutUserStateInput } from '../../generated/types/RecordLayoutUserStateInputRepresentation';
import { JSONParse, JSONStringify, ObjectKeys } from '../../util/language';
import { isFulfilledSnapshot } from '../../util/snapshot';
import { RecordLayoutSectionUserStateRepresentation } from '../../generated/types/RecordLayoutSectionUserStateRepresentation';

// Hack method- this should be removed eventually when layoutUserState raml is fixed.
function addAdditionalFieldsForNorming(
    layoutUserState: RecordLayoutUserStateRepresentation,
    apiName: string,
    recordTypeId: string,
    layoutType: string,
    mode: string
) {
    // Hack- adding in this params so record-ui will be able to use normed values.
    layoutUserState.apiName = apiName;
    layoutUserState.recordTypeId = recordTypeId;
    layoutUserState.layoutType = layoutType;
    layoutUserState.mode = mode;
}

function updateLayoutUserState(
    luvio: Luvio,
    config: GetLayoutUserStateConfigWithDefaults,
    key: string,
    updateRequest: ResourceRequest
) {
    return luvio.dispatchResourceRequest<RecordLayoutUserStateRepresentation>(updateRequest).then(
        (response) => {
            return ingestAndBroadcast(luvio, key, config, response.body);
        },
        (err: FetchResponse<{ error: string }>) => {
            deepFreeze(err);
            throw err;
        }
    );
}

function ingestAndBroadcast(
    luvio: Luvio,
    key: string,
    config: GetLayoutUserStateConfigWithDefaults,
    body: RecordLayoutUserStateRepresentation
) {
    addAdditionalFieldsForNorming(
        body,
        config.objectApiName,
        config.recordTypeId,
        config.layoutType,
        config.mode
    );

    luvio.storeIngest(key, ingest, body);
    luvio.storeBroadcast();
    return cacheLookupGetLayoutUserState(luvio, config);
}

function clone(
    userLayoutState: RecordLayoutUserStateRepresentation
): RecordLayoutUserStateRepresentation {
    return JSONParse(JSONStringify(userLayoutState));
}

// Applies optimisticUpdate to layoutUserState
// If the optimistic update can be applied, returns RecordLayoutUserStateRepresentation
// If the optimistic update cannot be applied, returns null
// The optimistic update can be applied only IF the cached layoutUserState has all the sections
// enumerated on the layout user state input
function optimisticUpdate(
    cachedLayoutUserState: RecordLayoutUserStateRepresentation,
    layoutUserStateInput: RecordLayoutUserStateInputRepresentation
): RecordLayoutUserStateRepresentation | null {
    let clonedLayoutUserState!: RecordLayoutUserStateRepresentation;
    let clonedLayoutUserStateSections!: RecordLayoutUserStateRepresentation['sectionUserStates'];
    const { sectionUserStates } = layoutUserStateInput;
    const { sectionUserStates: cachedSectionUserStates } = cachedLayoutUserState;
    const sectionUserStateKeys = ObjectKeys(sectionUserStates);
    for (let i = 0, len = sectionUserStateKeys.length; i < len; i += 1) {
        const sectionId = sectionUserStateKeys[i];
        if (cachedSectionUserStates[sectionId] === undefined) {
            // Cannot update a section that isn't in the cache. Cancel the optimistic update.
            return null;
        }

        if (clonedLayoutUserState === undefined) {
            // We have to clone cachedLayoutUserState because this object is coming from
            // a snapshot, where it is frozen
            clonedLayoutUserState = clone(cachedLayoutUserState);

            // hold onto sectionUserStates from clonedLayoutUserState
            clonedLayoutUserStateSections = clonedLayoutUserState.sectionUserStates;
        }

        // DEV MODE sanity check
        if (process.env.NODE_ENV !== 'production') {
            if (clonedLayoutUserStateSections === undefined) {
                throw new Error(
                    'clonedLayoutUserStateSections is undefined in updateLayoutUserState optimisticUpdate'
                );
            }
        }

        const userState = sectionUserStates[
            sectionId
        ] as RecordLayoutSectionUserStateRepresentation;
        clonedLayoutUserStateSections![sectionId].collapsed = userState.collapsed;
    }

    // DEV MODE sanity check
    if (process.env.NODE_ENV !== 'production') {
        if (clonedLayoutUserState === undefined) {
            throw new Error(
                'clonedLayoutUserState is undefined in updateLayoutUserState optimisticUpdate'
            );
        }
    }

    return clonedLayoutUserState;
}

type UpdateLayoutUserStateAdapter = (
    apiName: unknown,
    recordTypeId: unknown,
    layoutType: unknown,
    mode: unknown,
    layoutUserStateInput: unknown
) => Promise<Snapshot<RecordLayoutUserStateRepresentation>>;

interface UpdateUserLayoutStateConfigWithDefaults extends GetLayoutUserStateConfigWithDefaults {
    layoutUserStateInput: RecordLayoutUserStateInputRepresentation;
}

function coerceConfigWithDefaults(
    untrusted: unknown,
    layoutUserStateInput: unknown
): UpdateUserLayoutStateConfigWithDefaults {
    const config = coerceGetLayoutUserStateConfigWithDefaults(
        untrusted,
        getLayoutUserState_ConfigPropertyNames
    );
    if (config === null) {
        // eslint-disable-next-line @salesforce/lds/no-error-in-production
        throw new Error(
            `@wire(updateLayoutUserState) invalid configuration ${JSONStringify(untrusted)}`
        );
    }

    // This will throw if layoutUserStateInput is not a valid input
    validateRecordLayoutUserStateInput(layoutUserStateInput, 'layoutUserStateInput');

    return {
        ...config,
        layoutUserStateInput: layoutUserStateInput as RecordLayoutUserStateInputRepresentation,
    };
}

export const factory = (luvio: Luvio): UpdateLayoutUserStateAdapter => {
    return (
        untrustedObjectApiName: unknown,
        untrustedRecordTypeId: unknown,
        untrustedLayoutType: unknown,
        untrustedMode: unknown,
        untrustedLayoutUserStateInput: unknown
    ) => {
        const untrusted: unknown = {
            objectApiName: untrustedObjectApiName,
            recordTypeId: untrustedRecordTypeId,
            layoutType: untrustedLayoutType,
            mode: untrustedMode,
        };
        const config = coerceConfigWithDefaults(untrusted, untrustedLayoutUserStateInput);
        if (config === null) {
            if (process.env.NODE_ENV !== 'production') {
                throw new Error(
                    `@wire(updateLayoutUserState) invalid configuration ${JSONStringify(untrusted)}`
                );
            }
        }

        const { objectApiName, layoutType, mode, recordTypeId, layoutUserStateInput } = config;

        const updateRequest = patchUiApiLayoutUserStateByObjectApiName({
            urlParams: {
                objectApiName,
            },
            body: layoutUserStateInput,
            queryParams: {
                layoutType,
                mode,
                recordTypeId,
            },
        });

        const key = keyBuilder({
            apiName: objectApiName,
            recordTypeId,
            layoutType,
            mode,
        });

        const cacheSnapshot = cacheLookupGetLayoutUserState(luvio, config);
        if (isFulfilledSnapshot(cacheSnapshot)) {
            // Create an optimistic update if we can
            const updatedLayoutUserState = optimisticUpdate(
                cacheSnapshot.data,
                layoutUserStateInput
            );
            if (updatedLayoutUserState !== null) {
                // Ingest optimistic update done client side
                ingestAndBroadcast(luvio, key, config, updatedLayoutUserState);
            }
        }

        return updateLayoutUserState(luvio, config, key, updateRequest);
    };
};
