import { FetchResponse, NetworkAdapter, ResourceRequest } from '@luvio/engine';
import { RecordRepresentation } from '@salesforce/lds-adapters-uiapi';
import { ArrayIsArray, ArrayPrototypePush } from '../../utils/language';
import {
    buildAggregateUiUrl,
    CompositeRequest,
    CompositeResponseEnvelope,
    MAX_STRING_LENGTH_PER_CHUNK,
    mergeRecordFields,
    shouldUseAggregateUiForFields,
} from './utils';

export const RECORD_ENDPOINT_REGEX = /^\/ui-api\/records\/?(([a-zA-Z0-9]+))?$/;
const referenceId = 'LDS_Records_AggregateUi';

/**
 * merge the aggregate ui child responses into a single record representation
 * @param response
 * @returns the merged record
 */
export function mergeAggregateUiResponse(
    response: FetchResponse<CompositeResponseEnvelope<RecordRepresentation>>
): FetchResponse<RecordRepresentation> {
    const { body } = response;
    if (
        body === null ||
        body === undefined ||
        body.compositeResponse === undefined ||
        body.compositeResponse.length === 0
    ) {
        // We shouldn't even get into this state - a 200 with no body?
        throw new Error('No response body in executeAggregateUi found');
    }

    const merged = body.compositeResponse.reduce((seed: null | RecordRepresentation, resp) => {
        if (seed === null) {
            return resp.body;
        }

        return mergeRecordFields(seed, resp.body);
    }, null) as RecordRepresentation;

    return {
        ...response,
        body: merged,
    };
}

export function buildGetRecordByFieldsCompositeRequest(
    resourceRequest: ResourceRequest,
    recordsCompositeRequest: {
        fieldsArray: Array<string>;
        optionalFieldsArray: Array<string>;
        fieldsLength: number;
        optionalFieldsLength: number;
    }
): CompositeRequest[] {
    const {
        fieldsArray,
        optionalFieldsArray,
        fieldsLength,
        optionalFieldsLength,
    } = recordsCompositeRequest;
    // Formula:  # of fields per chunk = floor( max length per chunk / avg field length)
    const averageFieldStringLength = Math.floor(
        (fieldsLength + optionalFieldsLength) / (fieldsArray.length + optionalFieldsArray.length)
    );
    const fieldsPerChunk = Math.floor(MAX_STRING_LENGTH_PER_CHUNK / averageFieldStringLength);

    const fieldsChunks: string[][] = [];
    const optionalFieldsChunks: string[][] = [];

    for (let i = 0, len = fieldsArray.length; i < len; i += fieldsPerChunk) {
        const newChunk = <string[]>fieldsArray.slice(i, i + fieldsPerChunk);
        ArrayPrototypePush.call(fieldsChunks, newChunk);
    }

    for (let i = 0, len = optionalFieldsArray.length; i < len; i += fieldsPerChunk) {
        const newChunk = <string[]>optionalFieldsArray.slice(i, i + fieldsPerChunk);
        ArrayPrototypePush.call(optionalFieldsChunks, newChunk);
    }

    const compositeRequest: CompositeRequest[] = [];

    for (let i = 0, len = fieldsChunks.length; i < len; i += 1) {
        const fieldChunk = fieldsChunks[i];
        const url = buildAggregateUiUrl(
            {
                fields: fieldChunk,
            },
            resourceRequest
        );

        ArrayPrototypePush.call(compositeRequest, {
            url,
            referenceId: `${referenceId}_fields_${i}`,
        });
    }

    for (let i = 0, len = optionalFieldsChunks.length; i < len; i += 1) {
        const fieldChunk = optionalFieldsChunks[i];
        const url = buildAggregateUiUrl(
            {
                optionalFields: fieldChunk,
            },
            resourceRequest
        );

        ArrayPrototypePush.call(compositeRequest, {
            url,
            referenceId: `${referenceId}_optionalFields_${i}`,
        });
    }

    return compositeRequest;
}

/**
 * Checks if a resource request is a GET method on the record endpoint
 * @param request the resource request
 */
function isRequestForGetRecord(request: ResourceRequest) {
    const { basePath, method } = request;
    return RECORD_ENDPOINT_REGEX.test(basePath) && method === 'get';
}

function createAggregateUiRequest(
    resourceRequest: ResourceRequest,
    fieldsArray: string[],
    optionalFieldsArray: string[],
    fieldsString: string,
    optionalFieldsString: string
) {
    const compositeRequest = buildGetRecordByFieldsCompositeRequest(resourceRequest, {
        fieldsArray,
        optionalFieldsArray,
        fieldsLength: fieldsString.length,
        optionalFieldsLength: optionalFieldsString.length,
    });

    const aggregateUiPostBody = { compositeRequest };

    const aggregateResourceRequest: ResourceRequest = {
        method: 'post',
        baseUri: resourceRequest.baseUri,
        basePath: '/ui-api/aggregate-ui',
        body: aggregateUiPostBody,
        queryParams: {},
        headers: {},
        urlParams: {},
    };
    return aggregateResourceRequest;
}

export function makeNetworkBatchGetRecordFields(networkAdapter: NetworkAdapter): NetworkAdapter {
    return (resourceRequest: ResourceRequest) => {
        // only handle GETs on record endpoint
        if (isRequestForGetRecord(resourceRequest) === false) {
            return networkAdapter(resourceRequest);
        }

        const {
            queryParams: { fields, optionalFields },
        } = resourceRequest;

        // only handle requests with fields or optional fields
        if (fields === undefined && optionalFields === undefined) {
            return networkAdapter(resourceRequest);
        }

        const fieldsArray: string[] =
            fields !== undefined && ArrayIsArray(fields) ? (fields as string[]) : [];

        const optionalFieldsArray: string[] =
            optionalFields !== undefined && ArrayIsArray(optionalFields)
                ? (optionalFields as string[])
                : [];

        // if fields and optional fields are empty delegate request
        if (fieldsArray.length === 0 && optionalFieldsArray.length === 0) {
            return networkAdapter(resourceRequest);
        }

        const fieldsString = fieldsArray.join(',');
        const optionalFieldsString = optionalFieldsArray.join(',');

        if (shouldUseAggregateUiForFields(fieldsString, optionalFieldsString) === false) {
            return networkAdapter(resourceRequest);
        }

        const compositeRequest = createAggregateUiRequest(
            resourceRequest,
            fieldsArray,
            optionalFieldsArray,
            fieldsString,
            optionalFieldsString
        );

        return networkAdapter(compositeRequest).then(response => {
            return mergeAggregateUiResponse(
                response as FetchResponse<CompositeResponseEnvelope<RecordRepresentation>>
            );
        });
    };
}
