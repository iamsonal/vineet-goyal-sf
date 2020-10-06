import { ApiFamily, registerApiFamilyRoutes } from './utils';
import { CONNECT_BASE_URI, COMMERCE_BASE_URI, GUIDANCE_BASE_URI } from './connect-base';

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

const GET_GUIDANCE_ASSISTANT_PATH = new RegExp(
    `${GUIDANCE_BASE_URI}/assistant/([A-Z0-9_]){2,32}$`,
    'i'
);

const GET_GUIDANCE_QUESTIONNAIRE_PATH = new RegExp(
    `${GUIDANCE_BASE_URI}/assistant/([A-Z0-9_]){2,32}/questionnaire/([A-Z0-9_]){2,32}$`,
    'i'
);

const GET_GUIDANCE_ACTIVE_QUESTIONNAIRES_PATH = new RegExp(
    `${GUIDANCE_BASE_URI}/assistant/([A-Z0-9_]){2,32}/questionnaires$`,
    'i'
);

const connect: ApiFamily = {
    getCommunityNavigationMenu: {
        method: 'get',
        predicate: (path: string) =>
            path.startsWith(CONNECT_BASE_URI) && COMMUNITIES_NAVIGATION_MENU_PATH.test(path),
        transport: {
            controller: 'NavigationMenuController.getCommunityNavigationMenu',
        },
    },
    getProduct: {
        method: 'get',
        predicate: (path: string) =>
            path.startsWith(COMMERCE_BASE_URI) && GET_PRODUCT_PATH.test(path),
        transport: {
            controller: 'CommerceCatalogController.getProduct',
        },
    },
    getProductCategoryPath: {
        method: 'get',
        predicate: (path: string) =>
            path.startsWith(COMMERCE_BASE_URI) && GET_PRODUCT_CATEGORY_PATH_PATH.test(path),
        transport: {
            controller: 'CommerceCatalogController.getProductCategoryPath',
        },
    },
    getProductPrice: {
        method: 'get',
        predicate: (path: string) =>
            path.startsWith(COMMERCE_BASE_URI) && GET_PRODUCT_PRICE_PATH.test(path),
        transport: {
            controller: 'CommerceStorePricingController.getProductPrice',
        },
    },
    productSearch: {
        method: 'post',
        predicate: (path: string) =>
            path.startsWith(COMMERCE_BASE_URI) && PRODUCT_SEARCH_PATH.test(path),
        transport: {
            controller: 'CommerceProductSearchController.productSearch',
        },
    },
};

const guidance: ApiFamily = {
    getGuidanceAssistant: {
        method: 'get',
        predicate: (path: string) =>
            path.startsWith(GUIDANCE_BASE_URI) && GET_GUIDANCE_ASSISTANT_PATH.test(path),
        transport: {
            controller: 'LightningExperienceAssistantPlatformController.getAssistant',
        },
    },
    saveGuidanceAssistant: {
        method: 'patch',
        predicate: (path: string) =>
            path.startsWith(GUIDANCE_BASE_URI) && GET_GUIDANCE_ASSISTANT_PATH.test(path),
        transport: {
            controller: 'LightningExperienceAssistantPlatformController.saveAssistant',
        },
    },
    getGuidanceActiveQuestionnaires: {
        method: 'get',
        predicate: (path: string) =>
            path.startsWith(GUIDANCE_BASE_URI) &&
            GET_GUIDANCE_ACTIVE_QUESTIONNAIRES_PATH.test(path),
        transport: {
            controller: 'LightningExperienceAssistantPlatformController.getActiveQuestionnaires',
        },
    },
    getGuidanceQuestionnaire: {
        method: 'get',
        predicate: (path: string) =>
            path.startsWith(GUIDANCE_BASE_URI) && GET_GUIDANCE_QUESTIONNAIRE_PATH.test(path),
        transport: {
            controller: 'LightningExperienceAssistantPlatformController.getQuestionnaire',
        },
    },
    saveGuidanceQuestionnaire: {
        method: 'patch',
        predicate: (path: string) =>
            path.startsWith(GUIDANCE_BASE_URI) && GET_GUIDANCE_QUESTIONNAIRE_PATH.test(path),
        transport: {
            controller: 'LightningExperienceAssistantPlatformController.saveQuestionnaire',
        },
    },
};

registerApiFamilyRoutes(connect);
registerApiFamilyRoutes(guidance);
