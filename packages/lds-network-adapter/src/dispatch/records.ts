import { ResourceRequest } from '@luvio/engine';
import { UI_API_BASE_URI } from '../uiapi-base';
import { Dispatcher, defaultDispatcher } from './main';

const UIAPI_RECORDS_PATH = `${UI_API_BASE_URI}/records`;

const getRecordDispatcher: Dispatcher = (req) => {
    return defaultDispatcher(req);
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
