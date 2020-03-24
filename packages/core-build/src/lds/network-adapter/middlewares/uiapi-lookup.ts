import { ResourceRequest } from '@ldsjs/engine';
import { UI_API_BASE_URI } from './uiapi-base';
import { buildUiApiParams, dispatchAction } from './utils';
import appRouter from '../router';

const UIAPI_LOOKUP_RECORDS = `${UI_API_BASE_URI}/lookups`;

const LookupRecords = 'LookupController.getLookupRecords';

function lookupRecords(resourceRequest: ResourceRequest): Promise<any> {
    const { urlParams, queryParams } = resourceRequest;

    const params = buildUiApiParams(
        {
            ...urlParams,
            ...queryParams,
        },
        resourceRequest
    );

    return dispatchAction(LookupRecords, params);
}

appRouter.get((path: string) => path.startsWith(UIAPI_LOOKUP_RECORDS), lookupRecords);
