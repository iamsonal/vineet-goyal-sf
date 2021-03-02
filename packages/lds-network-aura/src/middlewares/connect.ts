import { ApiFamily, registerApiFamilyRoutes } from './utils';
import {
    CONNECT_BASE_URI,
    COMMERCE_BASE_URI,
    GUIDANCE_BASE_URI,
    WAVE_BASE_URI,
} from './connect-base';

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
    `${GUIDANCE_BASE_URI}/assistant/([A-Z0-9_]){1,64}$`,
    'i'
);

const GET_GUIDANCE_QUESTIONNAIRE_PATH = new RegExp(
    `${GUIDANCE_BASE_URI}/assistant/([A-Z0-9_]){1,64}/questionnaire/([A-Z0-9_]){2,32}$`,
    'i'
);

const GET_GUIDANCE_ACTIVE_QUESTIONNAIRES_PATH = new RegExp(
    `${GUIDANCE_BASE_URI}/assistant/([A-Z0-9_]){1,64}/questionnaires$`,
    'i'
);

const GET_GUIDANCE_ACTIVE_SCENARIOS_PATH = new RegExp(
    `${GUIDANCE_BASE_URI}/assistant/([A-Z0-9_]){1,64}/scenarios$`,
    'i'
);

const ANALYTICS_LIMITS_PATH = new RegExp(`${WAVE_BASE_URI}/limits$`, 'i');

const DATAFLOW_JOBS_PATH = new RegExp(`${WAVE_BASE_URI}/dataflowjobs$`, 'i');

const DATAFLOW_JOB_PATH = new RegExp(`${WAVE_BASE_URI}/dataflowjobs/([A-Z0-9_]){15,18}$`, 'i');

const DATAFLOW_JOB_NODES_PATH = new RegExp(
    `${WAVE_BASE_URI}/dataflowjobs/([A-Z0-9_]){15,18}/nodes$`,
    'i'
);

const DATAFLOW_JOB_NODE_PATH = new RegExp(
    `${WAVE_BASE_URI}/dataflowjobs/([A-Z0-9_]){15,18}/nodes/([A-Z0-9_]){15,18}$`,
    'i'
);

const RECIPES_PATH = new RegExp(`${WAVE_BASE_URI}/recipes$`, 'i');

const RECIPE_PATH = new RegExp(`${WAVE_BASE_URI}/recipes/([A-Z0-9_]){15,18}$`, 'i');

const REPLICATED_DATASETS_PATH = new RegExp(`${WAVE_BASE_URI}/replicatedDatasets$`, 'i');

const DATASETS_PATH = new RegExp(`${WAVE_BASE_URI}/datasets$`, 'i');

const DATASET_PATH = new RegExp(`${WAVE_BASE_URI}/datasets/([A-Z0-9_]){1,80}$`, 'i');

const XMD_PATH = new RegExp(
    `${WAVE_BASE_URI}/datasets/([A-Z0-9_]){1,80}/versions/([A-Z0-9_]){15,18}/xmds/[A-Z]+$`,
    'i'
);

const LIST_CONTENT_INTERNAL_PATH = new RegExp(
    `${CONNECT_BASE_URI}/communities/([A-Z0-9]){15,18}/managed-content/delivery/contents`,
    'i'
);

const LIST_CONTENT_PATH = new RegExp(
    `${CONNECT_BASE_URI}/communities/([A-Z0-9]){15,18}/managed-content/delivery`,
    'i'
);

const RECORD_SEO_PROPERTIES_PATH = new RegExp(
    `${CONNECT_BASE_URI}/communities/([A-Z0-9]){15,18}/seo/properties/([^\\s]){1,128}`,
    'i'
);

const PUBLISH_ORCHESTRATION_EVENT_PATH = new RegExp(
    `${CONNECT_BASE_URI}/interaction/orchestration/events$`,
    'i'
);
const GET_ORCHESTRATION_INSTANCE_COLLECTION_PATH = new RegExp(
    `${CONNECT_BASE_URI}/interaction/orchestration/instances$`,
    'i'
);
const GET_ORCHESTRATION_INSTANCE_PATH = new RegExp(
    `${CONNECT_BASE_URI}/interaction/orchestration/instances/([A-Z0-9]){15,18}$`,
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
    listContentInternal: {
        method: 'get',
        predicate: (path: string) =>
            path.startsWith(CONNECT_BASE_URI) && LIST_CONTENT_INTERNAL_PATH.test(path),
        transport: {
            controller: 'ManagedContentController.getPublishedManagedContentListByContentKey',
        },
    },
    listContent: {
        method: 'get',
        predicate: (path: string) =>
            path.startsWith(CONNECT_BASE_URI) && LIST_CONTENT_PATH.test(path),
        transport: {
            controller: 'ManagedContentController.getManagedContentByTopicsAndContentKeys',
        },
    },
    getRecordSeoProperties: {
        method: 'get',
        predicate: (path: string) =>
            path.startsWith(CONNECT_BASE_URI) && RECORD_SEO_PROPERTIES_PATH.test(path),
        transport: {
            controller: 'SeoPropertiesController.getRecordSeoProperties',
        },
    },
    getOrchestrationInstance: {
        method: 'get',
        predicate: (path: string) =>
            path.startsWith(CONNECT_BASE_URI) && GET_ORCHESTRATION_INSTANCE_PATH.test(path),
        transport: {
            controller: 'InteractionOrchestrator.getOrchestrationInstance',
        },
    },
    getOrchestrationInstanceCollection: {
        method: 'get',
        predicate: (path: string) =>
            path.startsWith(CONNECT_BASE_URI) &&
            GET_ORCHESTRATION_INSTANCE_COLLECTION_PATH.test(path),
        transport: {
            controller: 'InteractionOrchestrator.getOrchestrationInstanceCollection',
        },
    },
    publishOrchestrationEvent: {
        method: 'post',
        predicate: (path: string) =>
            path.startsWith(CONNECT_BASE_URI) && PUBLISH_ORCHESTRATION_EVENT_PATH.test(path),
        transport: {
            controller: 'InteractionOrchestrator.publishOrchestrationEvent',
        },
    },
};

const commerce: ApiFamily = {
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
    getGuidanceActiveScenarios: {
        method: 'get',
        predicate: (path: string) =>
            path.startsWith(GUIDANCE_BASE_URI) && GET_GUIDANCE_ACTIVE_SCENARIOS_PATH.test(path),
        transport: {
            controller: 'LightningExperienceAssistantPlatformController.getActiveScenarios',
        },
    },
};

const analytics: ApiFamily = {
    getAnalyticsLimits: {
        method: 'get',
        predicate: (path: string) =>
            path.startsWith(WAVE_BASE_URI) && ANALYTICS_LIMITS_PATH.test(path),
        transport: {
            controller: 'WaveController.getAnalyticsLimits',
        },
    },
    createDataflowJob: {
        method: 'post',
        predicate: (path: string) =>
            path.startsWith(WAVE_BASE_URI) && DATAFLOW_JOBS_PATH.test(path),
        transport: {
            controller: 'WaveController.startDataflow',
        },
    },
    getDataflowJobs: {
        method: 'get',
        predicate: (path: string) =>
            path.startsWith(WAVE_BASE_URI) && DATAFLOW_JOBS_PATH.test(path),
        transport: {
            controller: 'WaveController.getDataflowJobs',
        },
    },
    getDataflowJob: {
        method: 'get',
        predicate: (path: string) => path.startsWith(WAVE_BASE_URI) && DATAFLOW_JOB_PATH.test(path),
        transport: {
            controller: 'WaveController.getDataflowJob',
        },
    },
    updateDataflowJob: {
        method: 'patch',
        predicate: (path: string) => path.startsWith(WAVE_BASE_URI) && DATAFLOW_JOB_PATH.test(path),
        transport: {
            controller: 'WaveController.updateDataflowJob',
        },
    },
    getDataflowJobNodes: {
        method: 'get',
        predicate: (path: string) =>
            path.startsWith(WAVE_BASE_URI) && DATAFLOW_JOB_NODES_PATH.test(path),
        transport: {
            controller: 'WaveController.getDataflowJobNodes',
        },
    },
    getDataflowJobNode: {
        method: 'get',
        predicate: (path: string) =>
            path.startsWith(WAVE_BASE_URI) && DATAFLOW_JOB_NODE_PATH.test(path),
        transport: {
            controller: 'WaveController.getDataflowJobNode',
        },
    },
    getRecipe: {
        method: 'get',
        predicate: (path: string) => path.startsWith(WAVE_BASE_URI) && RECIPE_PATH.test(path),
        transport: {
            controller: 'WaveController.getRecipe',
        },
    },
    getRecipes: {
        method: 'get',
        predicate: (path: string) => path.startsWith(WAVE_BASE_URI) && RECIPES_PATH.test(path),
        transport: {
            controller: 'WaveController.getRecipes',
        },
    },
    getDataset: {
        method: 'get',
        predicate: (path: string) => path.startsWith(WAVE_BASE_URI) && DATASET_PATH.test(path),
        transport: {
            controller: 'WaveController.getDataset',
        },
    },
    getDatasets: {
        method: 'get',
        predicate: (path: string) => path.startsWith(WAVE_BASE_URI) && DATASETS_PATH.test(path),
        transport: {
            controller: 'WaveController.getDatasets',
        },
    },
    getXmd: {
        method: 'get',
        predicate: (path: string) => path.startsWith(WAVE_BASE_URI) && XMD_PATH.test(path),
        transport: {
            controller: 'WaveController.getXmd',
        },
    },
    deleteRecipe: {
        method: 'delete',
        predicate: (path: string) => path.startsWith(WAVE_BASE_URI) && RECIPE_PATH.test(path),
        transport: {
            controller: 'WaveController.deleteRecipe',
        },
    },
    getReplicatedDatasets: {
        method: 'get',
        predicate: (path: string) =>
            path.startsWith(WAVE_BASE_URI) && REPLICATED_DATASETS_PATH.test(path),
        transport: {
            controller: 'WaveController.getReplicatedDatasets',
        },
    },
};

registerApiFamilyRoutes(connect);
registerApiFamilyRoutes(commerce);
registerApiFamilyRoutes(guidance);
registerApiFamilyRoutes(analytics);
