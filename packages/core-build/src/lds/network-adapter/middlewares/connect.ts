import { ResourceRequest } from '@ldsjs/engine';
import { dispatchAction, DispatchActionConfig } from './utils';
import { ACTION_CONFIG, CONNECT_BASE_URI } from './connect-base';

enum ConnectController {
    GetCommunityNavigationMenu = 'NavigationMenuController.getCommunityNavigationMenu',
}

export const COMMUNITIES_NAVIGATION_MENU_PATH = new RegExp(
    `${CONNECT_BASE_URI}/communities/([A-Z0-9]){15,18}/navigation-menu`,
    'gi'
);

export function getCommunityNavigationMenu(resourceRequest: ResourceRequest): Promise<any> {
    let controller = ConnectController.GetCommunityNavigationMenu;
    const actionConfig: DispatchActionConfig = {
        action: ACTION_CONFIG,
    };

    const { urlParams, queryParams } = resourceRequest;
    const params = { ...urlParams, ...queryParams };

    return dispatchAction(controller, params, actionConfig);
}
