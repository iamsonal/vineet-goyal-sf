import { deepFreeze } from '../../util/deep-freeze';
import { Snapshot, LDS, FetchResponse, ResourceRequest } from '@salesforce-lds/engine';
import { RecordLayoutUserStateInputRepresentation } from '../../generated/types/RecordLayoutUserStateInputRepresentation';
import {
    cache as cacheLookupGetLayoutUserState,
    GetLayoutUserStateConfigWithDefaults,
    coerceConfigWithDefaults as coerceGetLayoutUserStateConfigWithDefaults,
} from '../getLayoutUserState';
import {
    RecordLayoutUserStateRepresentation,
    keyBuilder,
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
    lds: LDS,
    config: GetLayoutUserStateConfigWithDefaults,
    key: string,
    updateRequest: ResourceRequest
) {
    return lds.dispatchResourceRequest<RecordLayoutUserStateRepresentation>(updateRequest).then(
        response => {
            return ingestAndBroadcast(lds, key, updateRequest, config, response.body);
        },
        (err: FetchResponse<{ error: string }>) => {
            deepFreeze(err);
            throw err;
        }
    );
}

function ingestAndBroadcast(
    lds: LDS,
    key: string,
    request: ResourceRequest,
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

    lds.storeIngest(key, request, body);
    lds.storeBroadcast();
    return cacheLookupGetLayoutUserState(lds, config);
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
    const config = coerceGetLayoutUserStateConfigWithDefaults(untrusted);
    if (config === null) {
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

export const factory = (lds: LDS): UpdateLayoutUserStateAdapter => {
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
            throw new Error(
                `@wire(updateLayoutUserState) invalid configuration ${JSONStringify(untrusted)}`
            );
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

        const cacheSnapshot = cacheLookupGetLayoutUserState(lds, config);
        if (isFulfilledSnapshot(cacheSnapshot)) {
            // Create an optimistic update if we can
            const updatedLayoutUserState = optimisticUpdate(
                cacheSnapshot.data,
                layoutUserStateInput
            );
            if (updatedLayoutUserState !== null) {
                // Ingest optimistic update done client side
                ingestAndBroadcast(lds, key, updateRequest, config, updatedLayoutUserState);
            }
        }

        return updateLayoutUserState(lds, config, key, updateRequest);
    };
};
