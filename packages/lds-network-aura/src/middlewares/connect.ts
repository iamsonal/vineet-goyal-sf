import { ApiFamily, registerApiFamilyRoutes } from './utils';
import {
    CONNECT_BASE_URI,
    COMMERCE_BASE_URI,
    GUIDANCE_BASE_URI,
    WAVE_BASE_URI,
    CMS_BASE_URI,
    CMS_NON_CONNECT_BASE_URI,
    INTERACTION_BASE_URI,
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

const GET_GUIDANCE_QUESTIONNAIRES_PATH = new RegExp(
    `${GUIDANCE_BASE_URI}/assistant/([A-Z0-9_]){1,64}/questionnaires$`,
    'i'
);

const GET_GUIDANCE_SCENARIOS_PATH = new RegExp(
    `${GUIDANCE_BASE_URI}/assistant/([A-Z0-9_]){1,64}/scenarios$`,
    'i'
);

const ANALYTICS_LIMITS_PATH = new RegExp(`${WAVE_BASE_URI}/limits$`, 'i');

const DATA_CONNECTORS_PATH = new RegExp(`${WAVE_BASE_URI}/dataconnectors$`, 'i');

const DATA_CONNECTOR_PATH = new RegExp(`${WAVE_BASE_URI}/dataconnectors/([A-Z0-9_]){15,18}$`, 'i');

const DATA_CONNECTOR_TYPES_PATH = new RegExp(`${WAVE_BASE_URI}/dataConnectorTypes$`, 'i');

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

const EXECUTE_QUERY_PATH = new RegExp(`${WAVE_BASE_URI}/query`, 'i');

const RECIPES_PATH = new RegExp(`${WAVE_BASE_URI}/recipes$`, 'i');

const RECIPE_PATH = new RegExp(`${WAVE_BASE_URI}/recipes/([A-Z0-9_]){15,18}$`, 'i');

const REPLICATED_DATASETS_PATH = new RegExp(`${WAVE_BASE_URI}/replicatedDatasets$`, 'i');

const REPLICATED_DATASET_PATH = new RegExp(
    `${WAVE_BASE_URI}/replicatedDatasets/([A-Z0-9_]){15,18}$`,
    'i'
);

const REPLICATED_FIELDS_PATH = new RegExp(
    `${WAVE_BASE_URI}/replicatedDatasets/([A-Z0-9_]){15,18}/fields$`,
    'i'
);

const SCHEDULE_PATH = new RegExp(`${WAVE_BASE_URI}/asset/([A-Z0-9_]){15,18}/schedule$`, 'i');

const DATASETS_PATH = new RegExp(`${WAVE_BASE_URI}/datasets$`, 'i');

const DATASET_PATH = new RegExp(`${WAVE_BASE_URI}/datasets/([A-Z0-9_]){1,80}$`, 'i');

const XMD_PATH = new RegExp(
    `${WAVE_BASE_URI}/datasets/([A-Z0-9_]){1,80}/versions/([A-Z0-9_]){15,18}/xmds/[A-Z]+$`,
    'i'
);

const WAVE_FOLDERS_PATH = new RegExp(`${WAVE_BASE_URI}/folders$`, 'i');

const GET_CONTENT_TYPE_INTERNAL_PATH = new RegExp(
    `${CMS_BASE_URI}/content-types/([A-Z0-9_]){1,80}$`,
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

const CREATE_DEPLOYMENT_PATH = new RegExp(`${CMS_NON_CONNECT_BASE_URI}/deployments`, 'i');

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
const SITES_SEARCH_PATH = new RegExp(`${CONNECT_BASE_URI}/sites/([A-Z0-9]){15,18}/search`, 'i');

const INTERACTION_RUNTIME_RUN_FLOW_PATH = new RegExp(
    `^${INTERACTION_BASE_URI}/runtime/.+/startFlow$`,
    'i'
);
const INTERACTION_RUNTIME_NAVIGATE_FLOW_PATH = new RegExp(
    `^${INTERACTION_BASE_URI}/runtime/.+/navigateFlow$`,
    'i'
);
const INTERACTION_RUNTIME_RESUME_FLOW_PATH = new RegExp(
    `^${INTERACTION_BASE_URI}/runtime/.+/resumeFlow$`,
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
    getContentType: {
        method: 'get',
        predicate: (path: string) =>
            path.startsWith(CMS_BASE_URI) && GET_CONTENT_TYPE_INTERNAL_PATH.test(path),
        transport: {
            controller: 'ManagedContentTypeController.getContentTypeSchema',
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
    createDeployment: {
        method: 'post',
        predicate: (path: string) =>
            path.startsWith(CMS_NON_CONNECT_BASE_URI) && CREATE_DEPLOYMENT_PATH.test(path),
        transport: {
            controller: 'ManagedContentController.createDeployment',
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
            controller: 'OrchestrationController.getOrchestrationInstance',
        },
    },
    getOrchestrationInstanceCollection: {
        method: 'get',
        predicate: (path: string) =>
            path.startsWith(CONNECT_BASE_URI) &&
            GET_ORCHESTRATION_INSTANCE_COLLECTION_PATH.test(path),
        transport: {
            controller: 'OrchestrationController.getOrchestrationInstanceCollection',
        },
    },
    publishOrchestrationEvent: {
        method: 'post',
        predicate: (path: string) =>
            path.startsWith(CONNECT_BASE_URI) && PUBLISH_ORCHESTRATION_EVENT_PATH.test(path),
        transport: {
            controller: 'OrchestrationController.publishOrchestrationEvent',
        },
    },
    searchSite: {
        method: 'get',
        predicate: (path: string) =>
            path.startsWith(CONNECT_BASE_URI) && SITES_SEARCH_PATH.test(path),
        transport: {
            controller: 'SitesController.searchSite',
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
    getGuidanceQuestionnaires: {
        method: 'get',
        predicate: (path: string) =>
            path.startsWith(GUIDANCE_BASE_URI) && GET_GUIDANCE_QUESTIONNAIRES_PATH.test(path),
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
    getGuidanceScenarios: {
        method: 'get',
        predicate: (path: string) =>
            path.startsWith(GUIDANCE_BASE_URI) && GET_GUIDANCE_SCENARIOS_PATH.test(path),
        transport: {
            controller: 'LightningExperienceAssistantPlatformController.getActiveScenarios',
        },
    },

    updateGuidanceScenarios: {
        method: 'patch',
        predicate: (path: string) =>
            path.startsWith(GUIDANCE_BASE_URI) && GET_GUIDANCE_SCENARIOS_PATH.test(path),
        transport: {
            controller: 'LightningExperienceAssistantPlatformController.saveScenarios',
        },
    },
};

const analytics: ApiFamily = {
    executeQuery: {
        method: 'post',
        predicate: (path: string) =>
            path.startsWith(WAVE_BASE_URI) && EXECUTE_QUERY_PATH.test(path),
        transport: {
            controller: 'WaveController.executeQueryByInputRep',
        },
    },
    getAnalyticsLimits: {
        method: 'get',
        predicate: (path: string) =>
            path.startsWith(WAVE_BASE_URI) && ANALYTICS_LIMITS_PATH.test(path),
        transport: {
            controller: 'WaveController.getAnalyticsLimits',
        },
    },
    getDataConnectors: {
        method: 'get',
        predicate: (path: string) =>
            path.startsWith(WAVE_BASE_URI) && DATA_CONNECTORS_PATH.test(path),
        transport: {
            controller: 'WaveController.getDataConnectors',
        },
    },
    createDataConnector: {
        method: 'post',
        predicate: (path: string) =>
            path.startsWith(WAVE_BASE_URI) && DATA_CONNECTORS_PATH.test(path),
        transport: {
            controller: 'WaveController.createDataConnector',
        },
    },
    getDataConnector: {
        method: 'get',
        predicate: (path: string) =>
            path.startsWith(WAVE_BASE_URI) && DATA_CONNECTOR_PATH.test(path),
        transport: {
            controller: 'WaveController.getDataConnector',
        },
    },
    updateDataConnector: {
        method: 'patch',
        predicate: (path: string) =>
            path.startsWith(WAVE_BASE_URI) && DATA_CONNECTOR_PATH.test(path),
        transport: {
            controller: 'WaveController.updateDataConnector',
        },
    },
    getDataConnectorTypes: {
        method: 'get',
        predicate: (path: string) =>
            path.startsWith(WAVE_BASE_URI) && DATA_CONNECTOR_TYPES_PATH.test(path),
        transport: {
            controller: 'WaveController.getDataConnectorTypes',
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
    getSchedule: {
        method: 'get',
        predicate: (path: string) => path.startsWith(WAVE_BASE_URI) && SCHEDULE_PATH.test(path),
        transport: {
            controller: 'WaveController.getSchedule',
        },
    },
    updateSchedule: {
        method: 'put',
        predicate: (path: string) => path.startsWith(WAVE_BASE_URI) && SCHEDULE_PATH.test(path),
        transport: {
            controller: 'WaveController.updateSchedule',
        },
    },
    getDataset: {
        method: 'get',
        predicate: (path: string) => path.startsWith(WAVE_BASE_URI) && DATASET_PATH.test(path),
        transport: {
            controller: 'WaveController.getDataset',
        },
    },
    deleteDataset: {
        method: 'delete',
        predicate: (path: string) => path.startsWith(WAVE_BASE_URI) && DATASET_PATH.test(path),
        transport: {
            controller: 'WaveController.deleteDataset',
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
    createReplicatedDataset: {
        method: 'post',
        predicate: (path: string) =>
            path.startsWith(WAVE_BASE_URI) && REPLICATED_DATASETS_PATH.test(path),
        transport: {
            controller: 'WaveController.createReplicatedDataset',
        },
    },
    getReplicatedDataset: {
        method: 'get',
        predicate: (path: string) =>
            path.startsWith(WAVE_BASE_URI) && REPLICATED_DATASET_PATH.test(path),
        transport: {
            controller: 'WaveController.getReplicatedDataset',
        },
    },
    updateReplicatedDataset: {
        method: 'patch',
        predicate: (path: string) =>
            path.startsWith(WAVE_BASE_URI) && REPLICATED_DATASET_PATH.test(path),
        transport: {
            controller: 'WaveController.updateReplicatedDataset',
        },
    },
    deleteReplicatedDataset: {
        method: 'delete',
        predicate: (path: string) =>
            path.startsWith(WAVE_BASE_URI) && REPLICATED_DATASET_PATH.test(path),
        transport: {
            controller: 'WaveController.deleteReplicatedDataset',
        },
    },
    getReplicatedFields: {
        method: 'get',
        predicate: (path: string) =>
            path.startsWith(WAVE_BASE_URI) && REPLICATED_FIELDS_PATH.test(path),
        transport: {
            controller: 'WaveController.getReplicatedFields',
        },
    },
    updateReplicatedFields: {
        method: 'patch',
        predicate: (path: string) =>
            path.startsWith(WAVE_BASE_URI) && REPLICATED_FIELDS_PATH.test(path),
        transport: {
            controller: 'WaveController.updateReplicatedFields',
        },
    },
    getWaveFolders: {
        method: 'get',
        predicate: (path: string) => path.startsWith(WAVE_BASE_URI) && WAVE_FOLDERS_PATH.test(path),
        transport: {
            controller: 'WaveController.getWaveFolders',
        },
    },
};

const flow: ApiFamily = {
    startFlow: {
        method: 'post',
        predicate: (path) =>
            path.startsWith(INTERACTION_BASE_URI) && INTERACTION_RUNTIME_RUN_FLOW_PATH.test(path),
        transport: {
            controller: 'FlowRuntimeConnectController.startFlow',
        },
    },
    navigateFlow: {
        method: 'post',
        predicate: (path) =>
            path.startsWith(INTERACTION_BASE_URI) &&
            INTERACTION_RUNTIME_NAVIGATE_FLOW_PATH.test(path),
        transport: {
            controller: 'FlowRuntimeConnectController.navigateFlow',
        },
    },
    resumeFlow: {
        method: 'post',
        predicate: (path) =>
            path.startsWith(INTERACTION_BASE_URI) &&
            INTERACTION_RUNTIME_RESUME_FLOW_PATH.test(path),
        transport: {
            controller: 'FlowRuntimeConnectController.resumeFlow',
        },
    },
};

registerApiFamilyRoutes(connect);
registerApiFamilyRoutes(commerce);
registerApiFamilyRoutes(guidance);
registerApiFamilyRoutes(analytics);
registerApiFamilyRoutes(flow);
