import type { ResourceRequest } from '@luvio/engine';
import { UI_API_BASE_URI } from './uiapi-base';
import { buildUiApiParams, dispatchAction } from './utils';
import appRouter from '../router';

enum UiApiAppsController {
    GetNavItems = 'AppsController.getNavItems',
}

const UIAPI_NAV_ITEMS_PATH = `${UI_API_BASE_URI}/nav-items`;

function getNavItems(resourceRequest: ResourceRequest): Promise<any> {
    const {
        queryParams: { formFactor, page, pageSize, navItemNames },
    } = resourceRequest;

    const params = buildUiApiParams(
        {
            formFactor,
            page,
            pageSize,
            navItemNames,
        },
        resourceRequest
    );

    return dispatchAction(UiApiAppsController.GetNavItems, params);
}

appRouter.get((path: string) => path.startsWith(UIAPI_NAV_ITEMS_PATH), getNavItems);
