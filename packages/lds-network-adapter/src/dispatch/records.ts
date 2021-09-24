import { FetchResponse, HttpStatusCode, ResourceRequest } from '@luvio/engine';
import { ArrayIsArray } from '../language';
import { UI_API_BASE_URI } from '../uiapi-base';
import {
    buildGetRecordByFieldsCompositeRequest,
    dispatchSplitRecordAggregateUiAction,
    GetRecordCompositeRequestParams,
    shouldUseAggregateUiForGetRecord,
} from './execute-aggregate-ui';
import { Dispatcher, defaultDispatcher, SalesforceResourceRequest } from './main';

const UIAPI_RECORDS_PATH = `${UI_API_BASE_URI}/records`;

const QUERY_TOO_COMPLICATED_ERROR_CODE = 'QUERY_TOO_COMPLICATED';

function fetchResponseIsQueryTooComplicated(error: FetchResponse<any>) {
    const { body } = error;

    if (error.status === HttpStatusCode.BadRequest && body !== undefined) {
        return (
            body.statusCode === HttpStatusCode.BadRequest &&
            body.errorCode === QUERY_TOO_COMPLICATED_ERROR_CODE
        );
    }

    return false;
}

/*
 * Takes a ResourceRequest, builds the aggregateUi payload, and dispatches via aggregateUi action
 */
function buildAndDispatchGetRecordAggregateUi(
    req: SalesforceResourceRequest,
    params: GetRecordCompositeRequestParams
): Promise<any> {
    const { networkAdapter, resourceRequest } = req;
    const compositeRequest = buildGetRecordByFieldsCompositeRequest(resourceRequest, params);

    const aggregateUiParams = {
        input: {
            compositeRequest,
        },
    };

    const aggregateUiResourceRequest: ResourceRequest = {
        baseUri: UI_API_BASE_URI,
        basePath: '/aggregate-ui',
        method: 'post',
        urlParams: {},
        body: aggregateUiParams,
        queryParams: {},
        headers: {},
    };

    return dispatchSplitRecordAggregateUiAction(networkAdapter, aggregateUiResourceRequest);
}

const getRecordDispatcher: Dispatcher = (req: SalesforceResourceRequest) => {
    const { resourceRequest, networkAdapter } = req;
    const { queryParams } = resourceRequest;
    const { fields, optionalFields } = queryParams;

    const fieldsArray: string[] =
        fields !== undefined && ArrayIsArray(fields) ? (fields as string[]) : [];

    const optionalFieldsArray: string[] =
        optionalFields !== undefined && Array.isArray(optionalFields)
            ? (optionalFields as string[])
            : [];

    const fieldsString = fieldsArray.join(',');
    const optionalFieldsString = optionalFieldsArray.join(',');
    // Don't submit a megarequest to UIAPI due to SOQL limit reasons.
    // Split and aggregate if needed
    const useAggregateUi: boolean = shouldUseAggregateUiForGetRecord(
        fieldsString,
        optionalFieldsString
    );

    if (useAggregateUi) {
        return buildAndDispatchGetRecordAggregateUi(
            {
                networkAdapter,
                resourceRequest,
            },
            {
                fieldsArray,
                optionalFieldsArray,
                fieldsLength: fieldsArray.length,
                optionalFieldsLength: optionalFieldsArray.length,
            }
        );
    }

    return defaultDispatcher(req).catch((err) => {
        if (fetchResponseIsQueryTooComplicated(err)) {
            // Retry with aggregateUi to see if we can avoid Query Too Complicated
            return buildAndDispatchGetRecordAggregateUi(
                {
                    networkAdapter,
                    resourceRequest,
                },
                {
                    fieldsArray,
                    optionalFieldsArray,
                    fieldsLength: fieldsArray.length,
                    optionalFieldsLength: optionalFieldsArray.length,
                }
            );
        } else {
            throw err;
        }
    });
};

export function matchRecordsHandlers(
    path: string,
    resourceRequest: ResourceRequest
): Dispatcher | null {
    const method = resourceRequest.method.toLowerCase();
    if (method === 'get' && path.startsWith(UIAPI_RECORDS_PATH)) {
        return getRecordDispatcher;
    }

    return null;
}
