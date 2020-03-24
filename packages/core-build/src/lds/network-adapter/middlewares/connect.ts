import { ApiFamily, registerApiFamilyRoutes } from './utils';
import { CONNECT_BASE_URI, COMMERCE_BASE_URI } from './connect-base';

const COMMUNITIES_NAVIGATION_MENU_PATH = new RegExp(
    `${CONNECT_BASE_URI}/communities/([A-Z0-9]){15,18}/navigation-menu`,
    'i'
);

const GET_PRODUCT_PATH = new RegExp(
    `${COMMERCE_BASE_URI}/webstores/([A-Z0-9]){15,18}/products/([A-Z0-9]){15,18}`,
    'i'
);

const GET_PRODUCT_CATEGORY_PATH_PATH = new RegExp(
    `${COMMERCE_BASE_URI}/webstores/([A-Z0-9]){15,18}/product-category-path/product-categories/([A-Z0-9]){15,18}`,
    'i'
);

const PRODUCT_SEARCH_PATH = new RegExp(
    `${COMMERCE_BASE_URI}/webstores/([A-Z0-9]){15,18}/search/product-search`,
    'i'
);

const GET_PRODUCT_PRICE_PATH = new RegExp(
    `${COMMERCE_BASE_URI}/webstores/([A-Z0-9]){15,18}/pricing/products/([A-Z0-9]){15,18}`,
    'i'
);

const connect: ApiFamily = {
    getCommunityNavigationMenu: {
        method: 'get',
        predicate: (path: string) =>
            path.startsWith(CONNECT_BASE_URI) && COMMUNITIES_NAVIGATION_MENU_PATH.test(path),
        transport: {
            controller: 'NavigationMenuController.getCommunityNavigationMenu',
            action: {
                background: false,
                hotspot: true,
                longRunning: false,
            },
        },
    },
    getProduct: {
        method: 'get',
        predicate: (path: string) =>
            path.startsWith(COMMERCE_BASE_URI) && GET_PRODUCT_PATH.test(path),
        transport: {
            controller: 'CommerceCatalogController.getProduct',
            action: {
                background: false,
                hotspot: true,
                longRunning: false,
            },
        },
    },
    getProductCategoryPath: {
        method: 'get',
        predicate: (path: string) =>
            path.startsWith(COMMERCE_BASE_URI) && GET_PRODUCT_CATEGORY_PATH_PATH.test(path),
        transport: {
            controller: 'CommerceCatalogController.getProductCategoryPath',
            action: {
                background: false,
                hotspot: true,
                longRunning: false,
            },
        },
    },
    getProductPrice: {
        method: 'get',
        predicate: (path: string) =>
            path.startsWith(COMMERCE_BASE_URI) && GET_PRODUCT_PRICE_PATH.test(path),
        transport: {
            controller: 'CommerceStorePricingController.getProductPrice',
            action: {
                background: false,
                hotspot: true,
                longRunning: false,
            },
        },
    },
    productSearch: {
        method: 'post',
        predicate: (path: string) =>
            path.startsWith(COMMERCE_BASE_URI) && PRODUCT_SEARCH_PATH.test(path),
        transport: {
            controller: 'CommerceProductSearchController.productSearch',
            action: {
                background: false,
                hotspot: true,
                longRunning: false,
            },
        },
    },
};

registerApiFamilyRoutes(connect);
