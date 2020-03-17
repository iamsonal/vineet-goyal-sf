import { ResourceRequest } from '@ldsjs/engine';
import { dispatchAction, DispatchActionConfig } from './utils';
import { ACTION_CONFIG, CONNECT_BASE_URI, COMMERCE_BASE_URI } from './connect-base';

enum ConnectController {
    GetCommunityNavigationMenu = 'NavigationMenuController.getCommunityNavigationMenu',
    GetProduct = 'CommerceCatalogController.getProduct',
    GetProductCategoryPath = 'CommerceCatalogController.getProductCategoryPath',
    ProductSearch = 'CommerceProductSearchController.productSearch',
    GetProductPrice = 'CommerceStorePricingController.getProductPrice',
}

export const COMMUNITIES_NAVIGATION_MENU_PATH = new RegExp(
    `${CONNECT_BASE_URI}/communities/([A-Z0-9]){15,18}/navigation-menu`,
    'i'
);

export const GET_PRODUCT_PATH = new RegExp(
    `${COMMERCE_BASE_URI}/webstores/([A-Z0-9]){15,18}/products/([A-Z0-9]){15,18}`,
    'i'
);

export const GET_PRODUCT_CATEGORY_PATH_PATH = new RegExp(
    `${COMMERCE_BASE_URI}/webstores/([A-Z0-9]){15,18}/product-category-path/product-categories/([A-Z0-9]){15,18}`,
    'i'
);

export const PRODUCT_SEARCH_PATH = new RegExp(
    `${COMMERCE_BASE_URI}/webstores/([A-Z0-9]){15,18}/search/product-search`,
    'i'
);

export const GET_PRODUCT_PRICE_PATH = new RegExp(
    `${COMMERCE_BASE_URI}/webstores/([A-Z0-9]){15,18}/pricing/products/([A-Z0-9]){15,18}`,
    'i'
);

export function getCommunityNavigationMenu(resourceRequest: ResourceRequest): Promise<any> {
    return dispatchConnectAction(ConnectController.GetCommunityNavigationMenu, resourceRequest);
}

export function getProduct(resourceRequest: ResourceRequest): Promise<any> {
    return dispatchConnectAction(ConnectController.GetProduct, resourceRequest);
}

export function getProductCategoryPath(resourceRequest: ResourceRequest): Promise<any> {
    return dispatchConnectAction(ConnectController.GetProductCategoryPath, resourceRequest);
}

export function productSearch(resourceRequest: ResourceRequest): Promise<any> {
    return dispatchConnectAction(ConnectController.ProductSearch, resourceRequest);
}

export function getProductPrice(resourceRequest: ResourceRequest): Promise<any> {
    return dispatchConnectAction(ConnectController.GetProductPrice, resourceRequest);
}

function dispatchConnectAction(controller: ConnectController, resourceRequest: ResourceRequest) {
    const actionConfig: DispatchActionConfig = {
        action: ACTION_CONFIG,
    };

    const { urlParams, queryParams } = resourceRequest;
    const params = { ...urlParams, ...queryParams };

    return dispatchAction(controller, params, actionConfig);
}
