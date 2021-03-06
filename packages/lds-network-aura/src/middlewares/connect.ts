import type { ApiFamily } from './utils';
import { registerApiFamilyRoutes } from './utils';
import {
    CONNECT_BASE_URI,
    COMMERCE_BASE_URI,
    GUIDANCE_BASE_URI,
    WAVE_BASE_URI,
    ADATS_CATALOG_BASE_URI,
    ADATS_SYNC_BASE_URI,
    CMS_BASE_URI,
    CMS_NON_CONNECT_BASE_URI,
    SCALECENTER_BASE_URI,
    INTERACTION_BASE_URI,
    BILLING_BASE_URI,
    EXPLAINABILITY_BASE_URI,
    SITES_BASE_URI,
    CIB_BASE_URI,
    RCG_TENANTMANAGEMENT_BASE_URI,
    IDENTITY_VERIFICATION_BASE_URI,
    CLM_BASE_URI,
    PSS_SOCIAL_CARE_BASE_URI,
    LEARNING_CONTENT_PLATFORM_BASE_URI,
    SMART_DATA_DISCOVERY_BASE_URI,
    ASSETCREATION_BASE_URI,
} from './connect-base';

const COMMUNITIES_MICROBATCHING_PATH = new RegExp(
    `${CONNECT_BASE_URI}/communities/([A-Z0-9]){15,18}/microbatching`,
    'i'
);

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

const GET_GUIDANCE_ASSISTANT_PATH = new RegExp(`${GUIDANCE_BASE_URI}/([A-Z0-9_]){2,80}$`, 'i');

const GET_LEARNING_CONTENT_PLATFORM_PATH = new RegExp(
    `${LEARNING_CONTENT_PLATFORM_BASE_URI}/featured-item/list$`,
    'i'
);
const GET_LEARNING_CONTENT_PLATFORM_RELATED_LIST_PATH = new RegExp(
    `${LEARNING_CONTENT_PLATFORM_BASE_URI}/featured-item/list/related$`,
    'i'
);
const GET_LEARNING_CONTENT_PLATFORM_RECOMMENDED_LIST_PATH = new RegExp(
    `${LEARNING_CONTENT_PLATFORM_BASE_URI}/featured-item/list/recommended$`,
    'i'
);

const GET_GUIDANCE_ASSISTANT_TARGET_PATH = new RegExp(
    `${GUIDANCE_BASE_URI}/([A-Z0-9_]){2,80}/info$`,
    'i'
);

const GET_GUIDANCE_ASSISTANT_LIST_PATH = new RegExp(
    `${GUIDANCE_BASE_URI}/([A-Z0-9_]){2,80}/list$`,
    'i'
);

const GET_GUIDANCE_QUESTIONNAIRE_PATH = new RegExp(
    `${GUIDANCE_BASE_URI}/questionnaire/([A-Z0-9_]){2,80}$`,
    'i'
);

const GET_GUIDANCE_QUESTIONNAIRES_PATH = new RegExp(
    `${GUIDANCE_BASE_URI}/([A-Z0-9_]){2,80}/questionnaires$`,
    'i'
);

const GET_GUIDANCE_STEP_PATH = new RegExp(`${GUIDANCE_BASE_URI}/step/([A-Z0-9_]){2,80}$`, 'i');

const GET_GUIDANCE_INITIALIZE_PATH = new RegExp(
    `${GUIDANCE_BASE_URI}/([A-Z0-9_]){2,80}/initialize$`,
    'i'
);

const ADATS_CONNECTORS_PATH = new RegExp(`${ADATS_SYNC_BASE_URI}/connectors$`, 'i');
const ADATS_CONNECTOR_PATH = new RegExp(`${ADATS_SYNC_BASE_URI}/connectors/[A-Z0-9_-]`, 'i');
const ADATS_CONNECTIONS_PATH = new RegExp(`${ADATS_SYNC_BASE_URI}/connections$`, 'i');
const ADATS_CONNECTION_PATH = new RegExp(
    `${ADATS_SYNC_BASE_URI}/connections/([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})$`,
    'i'
);
const ADATS_SOURCE_OBJECTS_PATH = new RegExp(
    `${ADATS_SYNC_BASE_URI}/connections/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/source-objects$`,
    'i'
);
const ADATS_SOURCE_OBJECT_PATH = new RegExp(
    `${ADATS_SYNC_BASE_URI}/connections/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/source-objects/(.[^/]{1,255})$`,
    'i'
);
const ADATS_FIELDS_PATH = new RegExp(
    `${ADATS_SYNC_BASE_URI}/connections/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/source-objects/(.[^/]{1,255})/fields$`,
    'i'
);

const ADATS_TARGETS_PATH = new RegExp(`${ADATS_SYNC_BASE_URI}/targets$`, 'i');
const ADATS_TARGET_PATH = new RegExp(
    `${ADATS_SYNC_BASE_URI}/targets/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$`,
    'i'
);

const ADATS_CATALOG_DATABASES_PATH = new RegExp(`${ADATS_CATALOG_BASE_URI}/databases$`, 'i');
const ADATS_CATALOG_DATABASE_PATH = new RegExp(
    `${ADATS_CATALOG_BASE_URI}/databases/[a-zA-Z0-9_-]+$`,
    'i'
);

const ADATS_CATALOG_SCHEMAS_PATH = new RegExp(`${ADATS_CATALOG_BASE_URI}/schemas$`, 'i');
const ADATS_CATALOG_SCHEMA_PATH = new RegExp(
    `${ADATS_CATALOG_BASE_URI}/schemas/[a-zA-Z.0-9_-]+$`,
    'i'
);

const ADATS_CATALOG_TABLES_PATH = new RegExp(`${ADATS_CATALOG_BASE_URI}/tables$`, 'i');
const ADATS_CATALOG_TABLE_PATH = new RegExp(`${ADATS_CATALOG_BASE_URI}/tables/[a-zA-Z.0-9_-]+$`);

const STORIES_PATH = new RegExp(`${SMART_DATA_DISCOVERY_BASE_URI}/stories$`, 'i');

const ADATS_GRANTS_PATH = new RegExp(`${ADATS_CATALOG_BASE_URI}/grants$`);

const ANALYTICS_LIMITS_PATH = new RegExp(`${WAVE_BASE_URI}/limits$`, 'i');

const DATA_CONNECTORS_PATH = new RegExp(`${WAVE_BASE_URI}/dataconnectors$`, 'i');

const DATA_CONNECTOR_PATH = new RegExp(`${WAVE_BASE_URI}/dataconnectors/([A-Z0-9]){15,18}$`, 'i');

const DATA_CONNECTOR_SOURCE_OBJECTS_PATH = new RegExp(
    `${WAVE_BASE_URI}/dataconnectors/([A-Z0-9]){15,18}/sourceObjects$`,
    'i'
);

const DATA_CONNECTOR_SOURCE_OBJECT_PATH = new RegExp(
    `${WAVE_BASE_URI}/dataconnectors/([A-Z0-9]){15,18}/sourceObjects/.{1,255}$`,
    'i'
);

const DATA_CONNECTOR_SOURCE_OBJECT_PREVIEW_PATH = new RegExp(
    `${WAVE_BASE_URI}/dataconnectors/([A-Z0-9]){15,18}/sourceObjects/.{1,255}/dataPreview$`,
    'i'
);

const DATA_CONNECTOR_SOURCE_FIELDS_PATH = new RegExp(
    `${WAVE_BASE_URI}/dataconnectors/([A-Z0-9]){15,18}/sourceObjects/.{1,255}/fields$`,
    'i'
);

const INGEST_DATA_CONNECTOR_PATH = new RegExp(
    `${WAVE_BASE_URI}/dataconnectors/([A-Z0-9_]){15,18}/ingest$`,
    'i'
);

const DATA_CONNECTOR_STATUS_PATH = new RegExp(
    `${WAVE_BASE_URI}/dataconnectors/([A-Z0-9_]){15,18}/status$`,
    'i'
);

const DATA_CONNECTOR_TYPES_PATH = new RegExp(`${WAVE_BASE_URI}/dataConnectorTypes$`, 'i');

const DATAFLOWS_PATH = new RegExp(`${WAVE_BASE_URI}/dataflows$`, 'i');

const DATAFLOW_JOBS_PATH = new RegExp(`${WAVE_BASE_URI}/dataflowjobs$`, 'i');

const DATAFLOW_JOB_PATH = new RegExp(`${WAVE_BASE_URI}/dataflowjobs/([A-Z0-9]){15,18}$`, 'i');

const DATAFLOW_JOB_NODES_PATH = new RegExp(
    `${WAVE_BASE_URI}/dataflowjobs/([A-Z0-9]){15,18}/nodes$`,
    'i'
);

const DATAFLOW_JOB_NODE_PATH = new RegExp(
    `${WAVE_BASE_URI}/dataflowjobs/([A-Z0-9]){15,18}/nodes/([A-Z0-9]){15,18}$`,
    'i'
);

const EXECUTE_QUERY_PATH = new RegExp(`${WAVE_BASE_URI}/query`, 'i');

const EXECUTE_SOQL_QUERY_PATH = new RegExp(`${WAVE_BASE_URI}/soql`, 'i');

const RECIPES_PATH = new RegExp(`${WAVE_BASE_URI}/recipes$`, 'i');

const RECIPE_PATH = new RegExp(`${WAVE_BASE_URI}/recipes/([A-Z0-9]){15,18}$`, 'i');

const RECIPE_NOTIFICATION_PATH = new RegExp(
    `${WAVE_BASE_URI}/recipes/([A-Z0-9]){15,18}/notification$`,
    'i'
);

const REPLICATED_DATASETS_PATH = new RegExp(`${WAVE_BASE_URI}/replicatedDatasets$`, 'i');

const REPLICATED_DATASET_PATH = new RegExp(
    `${WAVE_BASE_URI}/replicatedDatasets/([A-Z0-9]){15,18}$`,
    'i'
);

const REPLICATED_FIELDS_PATH = new RegExp(
    `${WAVE_BASE_URI}/replicatedDatasets/([A-Z0-9]){15,18}/fields$`,
    'i'
);

const SCHEDULE_PATH = new RegExp(`${WAVE_BASE_URI}/asset/([A-Z0-9]){15,18}/schedule$`, 'i');

const DATASETS_PATH = new RegExp(`${WAVE_BASE_URI}/datasets$`, 'i');

const DATASET_PATH = new RegExp(`${WAVE_BASE_URI}/datasets/([A-Z0-9_]){1,80}$`, 'i');

const DATASET_VERSIONS_PATH = new RegExp(
    `${WAVE_BASE_URI}/datasets/([A-Z0-9_]){1,80}/versions$`,
    'i'
);

const DATASET_VERSION_PATH = new RegExp(
    `${WAVE_BASE_URI}/datasets/([A-Z0-9_]){1,80}/versions/([A-Z0-9_]){15,18}$`,
    'i'
);

const SECURITY_COVERAGE_DATASET_VERSION_PATH = new RegExp(
    `${WAVE_BASE_URI}/security/coverage/datasets/([A-Z0-9_]){1,80}/versions/([A-Z0-9_]){15,18}$`,
    'i'
);

const XMD_PATH = new RegExp(
    `${WAVE_BASE_URI}/datasets/([A-Z0-9_]){1,80}/versions/([A-Z0-9_]){15,18}/xmds/[A-Z]+$`,
    'i'
);

const DEPENDENCIES_PATH = new RegExp(`${WAVE_BASE_URI}/dependencies/([A-Z0-9]){15,18}$`, 'i');

const WAVE_FOLDERS_PATH = new RegExp(`${WAVE_BASE_URI}/folders$`, 'i');

const WAVE_TEMPLATES_PATH = new RegExp(`${WAVE_BASE_URI}/templates$`, 'i');

const WAVE_TEMPLATE_PATH = new RegExp(`${WAVE_BASE_URI}/templates/([A-Z0-9_]){1,80}$`, 'i');

const WAVE_TEMPLATE_CONFIG_PATH = new RegExp(
    `${WAVE_BASE_URI}/templates/([A-Z0-9_]){1,80}/configuration$`,
    'i'
);

const WAVE_TEMPLATE_RELEASE_NOTES_PATH = new RegExp(
    `${WAVE_BASE_URI}/templates/([A-Z0-9_]){1,80}/releasenotes$`,
    'i'
);

const GET_CONTENT_TYPE_INTERNAL_PATH = new RegExp(
    `${CMS_BASE_URI}/content-types/([A-Z0-9_]){1,80}$`,
    'i'
);

const GET_MANAGED_CONTENT_VARIANT_PATH = new RegExp(
    `${CMS_BASE_URI}/contents/variants/([A-Z0-9_]){1,80}$`,
    'i'
);

const GET_MANAGED_CONTENT_FOLDER_ITEMS_PATH = new RegExp(
    `${CMS_BASE_URI}/folders/([A-Z0-9]){15,18}/items$`,
    'i'
);

const GET_MANAGED_CONTENT_PATH = new RegExp(`${CMS_BASE_URI}/contents/([A-Z0-9_]){1,80}$`, 'i');

const REPLACE_MANAGED_CONTENT_VARIANT_PATH = GET_MANAGED_CONTENT_VARIANT_PATH;

const DELETE_MANAGED_CONTENT_VARIANT_PATH = GET_MANAGED_CONTENT_VARIANT_PATH;

const LIST_CONTENT_INTERNAL_PATH = new RegExp(
    `${CONNECT_BASE_URI}/communities/([A-Z0-9]){15,18}/managed-content/delivery/contents`,
    'i'
);

const LIST_CONTENT_PATH = new RegExp(
    `${CONNECT_BASE_URI}/communities/([A-Z0-9]){15,18}/managed-content/delivery`,
    'i'
);

const GET_COLLECTION_ITEMS_FOR_SITE = new RegExp(
    `${CONNECT_BASE_URI}/sites/([A-Z0-9]){15,18}/cms/delivery/collections/([A-Z0-9]){1,28}$`,
    'i'
);

const GET_COLLECTION_METADATA_FOR_SITE = new RegExp(
    `${CONNECT_BASE_URI}/sites/([A-Z0-9]){15,18}/cms/delivery/collections/([A-Z0-9]){1,28}/metadata$`,
    'i'
);

const GET_COLLECTION_ITEMS_FOR_CHANNEL = new RegExp(
    `${CONNECT_BASE_URI}/cms/delivery/channels/([A-Z0-9]){15,18}/collections/([A-Z0-9]){1,28}$`,
    'i'
);

const GET_COLLECTION_METADATA_FOR_CHANNEL = new RegExp(
    `${CONNECT_BASE_URI}/cms/delivery/channels/([A-Z0-9]){15,18}/collections/([A-Z0-9]){1,28}/metadata$`,
    'i'
);

const CREATE_DEPLOYMENT_PATH = new RegExp(`${CMS_NON_CONNECT_BASE_URI}/deployments`, 'i');

const UNPUBLISH_MANAGED_CONTENT_PATH = new RegExp(`${CMS_BASE_URI}/contents/unpublish`, 'i');

const CREATE_MANAGED_CONTENT_PATH = new RegExp(`${CMS_BASE_URI}/contents`, 'i');

const RECORD_SEO_PROPERTIES_PATH = new RegExp(
    `${CONNECT_BASE_URI}/communities/([A-Z0-9]){15,18}/seo/properties/([^\\s]){1,128}`,
    'i'
);

const GET_ORCHESTRATION_INSTANCE_COLLECTION_PATH = new RegExp(
    `${CONNECT_BASE_URI}/interaction/orchestration/instances$`,
    'i'
);

const SITES_SEARCH_PATH = new RegExp(`${CONNECT_BASE_URI}/sites/([A-Z0-9]){15,18}/search`, 'i');

const INTERACTION_RUNTIME_RUN_FLOW_PATH = new RegExp(
    `^${INTERACTION_BASE_URI}/runtime/startFlow$`,
    'i'
);
const INTERACTION_RUNTIME_NAVIGATE_FLOW_PATH = new RegExp(
    `^${INTERACTION_BASE_URI}/runtime/navigateFlow$`,
    'i'
);
const INTERACTION_RUNTIME_RESUME_FLOW_PATH = new RegExp(
    `^${INTERACTION_BASE_URI}/runtime/resumeFlow$`,
    'i'
);

const POST_BATCH_PAYMENTS_SCHEDULERS_PATH = new RegExp(
    `${BILLING_BASE_URI}/batch/payments/schedulers`,
    'i'
);

const POST_BATCH_INVOICES_SCHEDULERS_PATH = new RegExp(
    `${BILLING_BASE_URI}/batch/invoices/schedulers`,
    'i'
);

const EXPLAINABILITY_ACTION_LOG_PATH = new RegExp(`${EXPLAINABILITY_BASE_URI}/action-logs$`, 'i');

const DECISION_MATRIX_COLUMNS_PATH = new RegExp(
    `${CONNECT_BASE_URI}/omnistudio/decision-matrices/([A-Z0-9]){1,18}/columns`,
    'i'
);

const DECISION_MATRIX_ROWS_PATH = new RegExp(
    `${CONNECT_BASE_URI}/omnistudio/decision-matrices/([A-Z0-9]){1,18}/versions/([A-Z0-9]){1,18}/rows`,
    'i'
);

const SCALE_CENTER_GET_METRICS_PATH = new RegExp(`${SCALECENTER_BASE_URI}/metrics/query`, 'i');

const GET_DECISION_MATRIC_DETAILS_PATH = new RegExp(
    `${CONNECT_BASE_URI}/omnistudio/decision-matrices/([A-Z0-9]){1,18}$`,
    'i'
);

const GET_DECISION_TABLE_DETAILS_PATH = new RegExp(
    `${CONNECT_BASE_URI}/omnistudio/decision-tables/([A-Z0-9]){15,18}$`,
    'i'
);

const GET_CALC_PROC_VERSION_DETAILS_PATH = new RegExp(
    `${CONNECT_BASE_URI}/omnistudio/evaluation-services/version-definitions/([A-Z0-9]){1,18}$`,
    'i'
);

const GET_CALC_PROC_DETAILS_PATH = new RegExp(
    `${CONNECT_BASE_URI}/omnistudio/evaluation-services/([A-Z0-9]){1,18}$`,
    'i'
);

const POST_CALC_PROC_VERSION_DETAILS_PATH = new RegExp(
    `${CONNECT_BASE_URI}/omnistudio/evaluation-services/version-definitions$`,
    'i'
);

const SEARCH_CALCULATION_PROCEDURES_DETAILS_PATH = new RegExp(
    `${CONNECT_BASE_URI}/omnistudio/evaluation-services$`,
    'i'
);

const SIMULATION_EVALUATION_SERVICE_PATH = new RegExp(
    `${CONNECT_BASE_URI}/omnistudio/evaluation-services/version-definitions/([A-Z0-9]){1,18}/simulation$`,
    'i'
);

const SEARCH_DECISION_MATRICES_PATH = new RegExp(
    `${CONNECT_BASE_URI}/omnistudio/decision-matrices`,
    'i'
);

const SEARCH_DECISION_TABLES_PATH = new RegExp(
    `${CONNECT_BASE_URI}/omnistudio/decision-tables`,
    'i'
);

const SEARCH_GOAL_DEFINITIONS_PATH = new RegExp(
    `${CONNECT_BASE_URI}/socialcare/goal-definitions`,
    'i'
);

const GET_CASE_SERVICE_PLAN_PATH = new RegExp(
    `${PSS_SOCIAL_CARE_BASE_URI}/case-service-plans/([A-Z0-9]{15,18})$`,
    'i'
);

const SEARCH_ACTIVE_BENEFITS_PATH = new RegExp(`${CONNECT_BASE_URI}/socialcare/benefits`, 'i');

const GET_SERVICE_PLAN_TEMPLATE_DETAILS = new RegExp(
    `${CONNECT_BASE_URI}/socialcare/serviceplan-templates/([A-Z0-9]){15,18}$`,
    'i'
);

const POST_SERVICE_PLAN_TEMPLATE_DETAILS = new RegExp(
    `${CONNECT_BASE_URI}/socialcare/serviceplan-templates/([A-Z0-9]){15,18}/actions/([A-Z]){1,128}`,
    'i'
);

const POST_CASE_SERVICE_PLAN_DETAILS = new RegExp(
    `${CONNECT_BASE_URI}/socialcare/case-service-plans`,
    'i'
);

const MARKETING_INTEGRATION_GET_FORM_PATH = new RegExp(
    `${SITES_BASE_URI}/([A-Z0-9]){15,18}/marketing-integration/forms/([A-Z0-9]){15,18}$`,
    'i'
);

const MARKETING_INTEGRATION_SUBMIT_FORM_PATH = new RegExp(
    `${SITES_BASE_URI}/([A-Z0-9]){15,18}/marketing-integration/forms/([A-Z0-9]){15,18}/data`,
    'i'
);

const MARKETING_INTEGRATION_SAVE_FORM_PATH = new RegExp(
    `${SITES_BASE_URI}/([A-Z0-9]){15,18}/marketing-integration/forms$`,
    'i'
);

const JOIN_CHIME_MEETING_PATH = new RegExp(
    `${CONNECT_BASE_URI}/health/video-visits/chime-meeting`,
    'i'
);

const LEAVE_CHIME_MEETING_PATH = new RegExp(
    `${CONNECT_BASE_URI}/health/video-visits/leave-chime-meeting`,
    'i'
);

const HPI_SCORE_PATH = new RegExp(`${CONNECT_BASE_URI}/health/uhs/actions`, 'i');

const GET_PATIENT_LIST_SCORE = new RegExp(`${CONNECT_BASE_URI}/health/uhslist/[A-Z0-9_-]`, 'i');

const GET_PATIENT_SCORE_APEX_PATH = new RegExp(
    `${CONNECT_BASE_URI}/health/uhsscore/apexinterface`,
    'i'
);

const GET_TAGS_BY_RECORD_PATH = new RegExp(
    `${CONNECT_BASE_URI}/interest-tags/assignments/entity/([A-Z0-9_]){1,80}$`,
    'i'
);

const GET_RECORDS_BY_TAGID_PATH = new RegExp(
    `${CONNECT_BASE_URI}/interest-tags/assignments/tag/([A-Z0-9_]){1,80}$`,
    'i'
);

const GET_TAGS_BY_CATEGORYID_PATH = new RegExp(`${CONNECT_BASE_URI}/interest-tags/tags$`, 'i');

const GET_CATEGORIES_BY_TAGID_PATH = new RegExp(
    `${CONNECT_BASE_URI}/interest-tags/categories$`,
    'i'
);

const LOYALTY_PROGRAM_PROCESS_RULE = new RegExp(
    `${CONNECT_BASE_URI}/loyalty/programs/([A-Z0-9_]){1,80}/processes/([A-Z0-9_]){1,80}/rule/([A-Z0-9_]){1,80}$`,
    'i'
);

const CIB_GET_CONTACTS_INTERACTIONS_PATH = new RegExp(
    `${CIB_BASE_URI}/contacts-interactions$`,
    'i'
);

const CIB_GET_INTERACTION_INSIGHTS_PATH = new RegExp(
    `${CIB_BASE_URI}/interaction-insights/([A-Z0-9]){15,18}$`,
    'i'
);

const CIB_GET_DEAL_PARTIES_PATH = new RegExp(
    `${CIB_BASE_URI}/deal-parties/([A-Z0-9]){15,18}$`,
    'i'
);
const CLM_CONTRACT_URI_PATH = new RegExp(
    `${CLM_BASE_URI}/contract/([A-Z0-9]){15,18}/contract-document-version$`,
    'i'
);
const CLM_GET_DOCUMENT_URI_PATH = new RegExp(`${CLM_BASE_URI}/document-templates$`, 'i');
const CLM_CONTRACT_CHECKIN_URI_PATH = new RegExp(
    `${CLM_BASE_URI}/contract-document-version/([A-Z0-9]){1,18}/checkIn$`,
    'i'
);
const CLM_CONTRACT_UNLOCK_URI_PATH = new RegExp(
    `${CLM_BASE_URI}/contract-document-version/([A-Z0-9]){1,18}/unlock$`,
    'i'
);
const UPLOAD_REFERENCE_DATA_PATH = new RegExp(
    `${CONNECT_BASE_URI}/sustainability/reference-data/([A-Z]){2,40}/upload$`,
    'i'
);
const BEI_PATH = new RegExp(
    `${CONNECT_BASE_URI}/sustainability/bei/recalculate/([A-Z0-9]){1,18}$`,
    'i'
);
const RCG_TPM_MANAGEMENT_PATH = new RegExp(
    `${RCG_TENANTMANAGEMENT_BASE_URI}/tenant-registration$`,
    'i'
);

const RECALCULATE_PATH = new RegExp(
    `${CONNECT_BASE_URI}/sustainability/footprint-calculation/recalculate`,
    'i'
);

const LOCK_RECORD_PATH = new RegExp(
    `${CONNECT_BASE_URI}/sustainability/record-locking/lock/([A-Z0-9]){1,18}$`,
    'i'
);

const UNLOCK_RECORD_PATH = new RegExp(
    `${CONNECT_BASE_URI}/sustainability/record-locking/unlock/([A-Z0-9]){1,18}$`,
    'i'
);

const IDENTIFY_VERIFICATION_BUILD_CONTEXT_PATH = new RegExp(
    `${IDENTITY_VERIFICATION_BASE_URI}/build-context/([A-Za-z0-9])+`,
    'i'
);

const DGF_DATE_ISSUE_PATH = new RegExp(
    `${CONNECT_BASE_URI}/sustainability/dgf/identify-date-issues`,
    'i'
);

const DGF_DATAGAP_PATH = new RegExp(
    `${CONNECT_BASE_URI}/sustainability/dgf/compute-datagap-fillers`,
    'i'
);

const IDENTIFY_VERIFICATION_SEARCH_PATH = new RegExp(
    `${IDENTITY_VERIFICATION_BASE_URI}/search`,
    'i'
);

const IDENTIFY_VERIFICATION_VERIFY_RECORD_PATH = new RegExp(
    `${IDENTITY_VERIFICATION_BASE_URI}/verification`,
    'i'
);

const TIMELINE_PATH = new RegExp(
    `${CONNECT_BASE_URI}/timeline/([A-Z0-9]){15,18}/timeline-definitions/([A-Za-z0-9_]){1,255}/events`,
    'i'
);

const AI_ACCELERATOR_PREDICTIONS = new RegExp(`${CONNECT_BASE_URI}/aiaccelerator/predictions`, 'i');

const GET_STARTER_TEMPLATE_BYID_PATH = new RegExp(
    `${ASSETCREATION_BASE_URI}/starter-templates/([A-Z0-9]){1,18}$`,
    'i'
);

const GET_STARTER_TEMPLATES_PATH = new RegExp(`${ASSETCREATION_BASE_URI}/starter-templates$`, 'i');

const POST_ASSET_OBJECT_PATH = new RegExp(`${ASSETCREATION_BASE_URI}/objects`, 'i');

const connect: ApiFamily = {
    predictions: {
        method: 'post',
        predicate: (path) =>
            path.startsWith(CONNECT_BASE_URI) && AI_ACCELERATOR_PREDICTIONS.test(path),
        transport: {
            controller: 'AIAcceleratorConnectFamilyController.predictions',
        },
    },
    lockRecord: {
        method: 'put',
        predicate: (path) => path.startsWith(CONNECT_BASE_URI) && LOCK_RECORD_PATH.test(path),
        transport: {
            controller: 'SustainabilityFamilyController.lockRecord',
        },
    },
    unlockRecord: {
        method: 'put',
        predicate: (path) => path.startsWith(CONNECT_BASE_URI) && UNLOCK_RECORD_PATH.test(path),
        transport: {
            controller: 'SustainabilityFamilyController.unlockRecord',
        },
    },
    dgfDateIssue: {
        method: 'post',
        predicate: (path) => path.startsWith(CONNECT_BASE_URI) && DGF_DATE_ISSUE_PATH.test(path),
        transport: {
            controller: 'SustainabilityFamilyController.identifyDateIssues',
        },
    },
    dgfDataGap: {
        method: 'post',
        predicate: (path) => path.startsWith(CONNECT_BASE_URI) && DGF_DATAGAP_PATH.test(path),
        transport: {
            controller: 'SustainabilityFamilyController.computeDataGapFillers',
        },
    },

    ingestRecord: {
        method: 'post',
        predicate: (path: string) =>
            path.startsWith(CONNECT_BASE_URI) && COMMUNITIES_MICROBATCHING_PATH.test(path),
        transport: {
            controller: 'CommunitiesController.ingestRecord',
        },
    },

    getCommunityNavigationMenu: {
        method: 'get',
        predicate: (path: string) =>
            path.startsWith(CONNECT_BASE_URI) && COMMUNITIES_NAVIGATION_MENU_PATH.test(path),
        transport: {
            controller: 'NavigationMenuController.getCommunityNavigationMenu',
        },
    },
    getManagedContent: {
        method: 'get',
        predicate: (path: string) =>
            path.startsWith(CMS_BASE_URI) && GET_MANAGED_CONTENT_PATH.test(path),
        transport: {
            controller: 'ManagedContentController.getManagedContent',
        },
    },
    getManagedContentVariant: {
        method: 'get',
        predicate: (path: string) =>
            path.startsWith(CMS_BASE_URI) && GET_MANAGED_CONTENT_VARIANT_PATH.test(path),
        transport: {
            controller: 'ManagedContentController.getManagedContentVariant',
        },
    },
    getManagedContentByFolderId: {
        method: 'get',
        predicate: (path: string) =>
            path.startsWith(CMS_BASE_URI) && GET_MANAGED_CONTENT_FOLDER_ITEMS_PATH.test(path),
        transport: {
            controller: 'ManagedContentController.getManagedContentSpaceFolderItems',
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
    unpublishManagedContent: {
        method: 'post',
        predicate: (path: string) =>
            path.startsWith(CMS_BASE_URI) && UNPUBLISH_MANAGED_CONTENT_PATH.test(path),
        transport: {
            controller: 'ManagedContentController.unpublish',
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
    getCollectionItemsForSite: {
        method: 'get',
        predicate: (path: string) =>
            path.startsWith(CONNECT_BASE_URI) && GET_COLLECTION_ITEMS_FOR_SITE.test(path),
        transport: {
            controller: 'ManagedContentDeliveryController.getCollectionItemsForSite',
        },
    },
    getCollectionMetadataForSite: {
        method: 'get',
        predicate: (path: string) =>
            path.startsWith(CONNECT_BASE_URI) && GET_COLLECTION_METADATA_FOR_SITE.test(path),
        transport: {
            controller: 'ManagedContentDeliveryController.getCollectionMetadataForSite',
        },
    },
    getCollectionItemsForChannel: {
        method: 'get',
        predicate: (path: string) =>
            path.startsWith(CONNECT_BASE_URI) && GET_COLLECTION_ITEMS_FOR_CHANNEL.test(path),
        transport: {
            controller: 'ManagedContentDeliveryController.getCollectionItemsForChannel',
        },
    },
    getCollectionMetadataForChannel: {
        method: 'get',
        predicate: (path: string) =>
            path.startsWith(CONNECT_BASE_URI) && GET_COLLECTION_METADATA_FOR_CHANNEL.test(path),
        transport: {
            controller: 'ManagedContentDeliveryController.getCollectionMetadataForChannel',
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
    createManagedContent: {
        method: 'post',
        predicate: (path: string) =>
            path.startsWith(CMS_BASE_URI) && CREATE_MANAGED_CONTENT_PATH.test(path),
        transport: {
            controller: 'ManagedContentController.createManagedContent',
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
    getOrchestrationInstanceCollection: {
        method: 'get',
        predicate: (path: string) =>
            path.startsWith(CONNECT_BASE_URI) &&
            GET_ORCHESTRATION_INSTANCE_COLLECTION_PATH.test(path),
        transport: {
            controller: 'OrchestrationController.getOrchestrationInstanceCollection',
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
    getDecisionMatrixColumns: {
        method: 'get',
        predicate: (path: string) =>
            path.startsWith(CONNECT_BASE_URI) && DECISION_MATRIX_COLUMNS_PATH.test(path),
        transport: {
            controller: 'InteractionDecisionMatrixController.getColumns',
        },
    },
    getDecisionMatrixRows: {
        method: 'get',
        predicate: (path: string) =>
            path.startsWith(CONNECT_BASE_URI) && DECISION_MATRIX_ROWS_PATH.test(path),
        transport: {
            controller: 'InteractionDecisionMatrixController.getRows',
        },
    },
    saveDecisionMatrixColumns: {
        method: 'post',
        predicate: (path: string) =>
            path.startsWith(CONNECT_BASE_URI) && DECISION_MATRIX_COLUMNS_PATH.test(path),
        transport: {
            controller: 'InteractionDecisionMatrixController.saveColumns',
        },
    },
    saveDecisionMatrixRows: {
        method: 'post',
        predicate: (path: string) =>
            path.startsWith(CONNECT_BASE_URI) && DECISION_MATRIX_ROWS_PATH.test(path),
        transport: {
            controller: 'InteractionDecisionMatrixController.saveRows',
        },
    },
    getDecisionMatrixDetails: {
        method: 'get',
        predicate: (path: string) =>
            path.startsWith(CONNECT_BASE_URI) && GET_DECISION_MATRIC_DETAILS_PATH.test(path),
        transport: {
            controller: 'InteractionCalculationProceduresController.getDecisionMatrixDetails',
        },
    },
    getDecisionTableDetails: {
        method: 'get',
        predicate: (path: string) =>
            path.startsWith(CONNECT_BASE_URI) && GET_DECISION_TABLE_DETAILS_PATH.test(path),
        transport: {
            controller: 'InteractionCalculationProceduresController.getDecisionTableDetails',
        },
    },
    getCalcProcVersionDetails: {
        method: 'get',
        predicate: (path: string) =>
            path.startsWith(CONNECT_BASE_URI) && GET_CALC_PROC_VERSION_DETAILS_PATH.test(path),
        transport: {
            controller: 'InteractionCalculationProceduresController.getCalcProcVersionDefinition',
        },
    },
    activateCalcProcedureVersion: {
        method: 'patch',
        predicate: (path: string) =>
            path.startsWith(CONNECT_BASE_URI) && GET_CALC_PROC_VERSION_DETAILS_PATH.test(path),
        transport: {
            controller: 'InteractionCalculationProceduresController.activateCalcProcedureVersion',
        },
    },
    getCalcProcDetails: {
        method: 'get',
        predicate: (path: string) =>
            path.startsWith(CONNECT_BASE_URI) && GET_CALC_PROC_DETAILS_PATH.test(path),
        transport: {
            controller: 'InteractionCalculationProceduresController.getCalcProcDetails',
        },
    },
    postCalcProcVersionDetails: {
        method: 'post',
        predicate: (path: string) =>
            path.startsWith(CONNECT_BASE_URI) && POST_CALC_PROC_VERSION_DETAILS_PATH.test(path),
        transport: {
            controller: 'InteractionCalculationProceduresController.createRule',
        },
    },
    searchCalculationProcedure: {
        method: 'get',
        predicate: (path: string) =>
            path.startsWith(CONNECT_BASE_URI) &&
            SEARCH_CALCULATION_PROCEDURES_DETAILS_PATH.test(path),
        transport: {
            controller: 'InteractionCalculationProceduresController.searchCalculationProcedure',
        },
    },
    simulateEvaluationService: {
        method: 'patch',
        predicate: (path: string) =>
            path.startsWith(CONNECT_BASE_URI) && SIMULATION_EVALUATION_SERVICE_PATH.test(path),
        transport: {
            controller: 'InteractionCalculationProceduresController.simulateEvaluationService',
        },
    },
    replaceManagedContentVariant: {
        method: 'put',
        predicate: (path: string) =>
            path.startsWith(CMS_BASE_URI) && REPLACE_MANAGED_CONTENT_VARIANT_PATH.test(path),
        transport: {
            controller: 'ManagedContentController.replaceManagedContentVariant',
        },
    },
    deleteManagedContentVariant: {
        method: 'delete',
        predicate: (path: string) =>
            path.startsWith(CMS_BASE_URI) && DELETE_MANAGED_CONTENT_VARIANT_PATH.test(path),
        transport: {
            controller: 'ManagedContentController.deleteManagedContentVariant',
        },
    },
    searchDecisionMatrixByName: {
        method: 'get',
        predicate: (path: string) =>
            path.startsWith(CONNECT_BASE_URI) && SEARCH_DECISION_MATRICES_PATH.test(path),
        transport: {
            controller: 'InteractionCalculationProceduresController.searchDecisionMatrixByName',
        },
    },
    searchDecisionTableByName: {
        method: 'get',
        predicate: (path: string) =>
            path.startsWith(CONNECT_BASE_URI) && SEARCH_DECISION_TABLES_PATH.test(path),
        transport: {
            controller: 'InteractionCalculationProceduresController.searchDecisionTableByName',
        },
    },
    getSimulationInputVariables: {
        method: 'get',
        predicate: (path: string) =>
            path.startsWith(CONNECT_BASE_URI) && SIMULATION_EVALUATION_SERVICE_PATH.test(path),
        transport: {
            controller: 'InteractionCalculationProceduresController.getSimulationInputVariables',
        },
    },
    searchGoalDefinitionByName: {
        method: 'get',
        predicate: (path: string) =>
            path.startsWith(CONNECT_BASE_URI) && SEARCH_GOAL_DEFINITIONS_PATH.test(path),
        transport: {
            controller: 'PublicSectorFamilyController.searchGoalDefinitionByName',
        },
    },
    searchActiveBenefitsByName: {
        method: 'get',
        predicate: (path: string) =>
            path.startsWith(CONNECT_BASE_URI) && SEARCH_ACTIVE_BENEFITS_PATH.test(path),
        transport: {
            controller: 'PublicSectorFamilyController.getActiveBenefitsByNameSearch',
        },
    },
    getCaseServicePlan: {
        method: 'get',
        predicate: (path: string) =>
            path.startsWith(CONNECT_BASE_URI) && GET_CASE_SERVICE_PLAN_PATH.test(path),
        transport: {
            controller: 'PublicSectorFamilyController.getCaseServicePlan',
        },
    },
    getSPTWithChildRecords: {
        method: 'get',
        predicate: (path: string) =>
            path.startsWith(CONNECT_BASE_URI) && GET_SERVICE_PLAN_TEMPLATE_DETAILS.test(path),
        transport: {
            controller: 'PublicSectorFamilyController.getSPTWithChildRecords',
        },
    },
    postServicePlanTemplateDetails: {
        method: 'post',
        predicate: (path: string) =>
            path.startsWith(CONNECT_BASE_URI) && POST_SERVICE_PLAN_TEMPLATE_DETAILS.test(path),
        transport: {
            controller: 'PublicSectorFamilyController.associateSPTChildRecords',
        },
    },
    postCaseServicePlanDetails: {
        method: 'post',
        predicate: (path: string) =>
            path.startsWith(CONNECT_BASE_URI) && POST_CASE_SERVICE_PLAN_DETAILS.test(path),
        transport: {
            controller: 'PublicSectorFamilyController.createOrUpdateCaseServicePlan',
        },
    },
    getProgramProcessRule: {
        method: 'get',
        predicate: (path: string) =>
            path.startsWith(CONNECT_BASE_URI) && LOYALTY_PROGRAM_PROCESS_RULE.test(path),
        transport: {
            controller: 'LoyaltyEngineConnectController.getProgramProcessRule',
        },
    },
    upsertProgramProcessRule: {
        method: 'post',
        predicate: (path: string) =>
            path.startsWith(CONNECT_BASE_URI) && LOYALTY_PROGRAM_PROCESS_RULE.test(path),
        transport: {
            controller: 'LoyaltyEngineConnectController.upsertProgramProcessRule',
        },
    },
    getExplainabilityActionLogs: {
        method: 'get',
        predicate: (path) =>
            path.startsWith(EXPLAINABILITY_BASE_URI) && EXPLAINABILITY_ACTION_LOG_PATH.test(path),
        transport: {
            controller: 'ExplainabilityServiceController.getExplainabilityActionLogs',
        },
    },
    storeExplainabilityActionLog: {
        method: 'post',
        predicate: (path) =>
            path.startsWith(EXPLAINABILITY_BASE_URI) && EXPLAINABILITY_ACTION_LOG_PATH.test(path),
        transport: {
            controller: 'ExplainabilityServiceController.storeExplainabilityActionLog',
        },
    },
    getContactsInteractions: {
        method: 'get',
        predicate: (path) =>
            path.startsWith(CIB_BASE_URI) && CIB_GET_CONTACTS_INTERACTIONS_PATH.test(path),
        transport: {
            controller: 'CibController.getContactsInteractions',
        },
    },
    getInteractionInsights: {
        method: 'get',
        predicate: (path) =>
            path.startsWith(CIB_BASE_URI) && CIB_GET_INTERACTION_INSIGHTS_PATH.test(path),
        transport: {
            controller: 'CibController.getInteractionInsights',
        },
    },
    getDealParties: {
        method: 'get',
        predicate: (path) => path.startsWith(CIB_BASE_URI) && CIB_GET_DEAL_PARTIES_PATH.test(path),
        transport: {
            controller: 'CibController.getDealParties',
        },
    },
    getContractDocumentVersion: {
        method: 'get',
        predicate: (path) => path.startsWith(CLM_BASE_URI) && CLM_CONTRACT_URI_PATH.test(path),
        transport: {
            controller: 'ClmController.getContractDocumentVersion',
        },
    },
    getTemplates: {
        method: 'get',
        predicate: (path) => path.startsWith(CLM_BASE_URI) && CLM_GET_DOCUMENT_URI_PATH.test(path),
        transport: {
            controller: 'ClmController.getTemplates',
        },
    },
    checkIn: {
        method: 'patch',
        predicate: (path) =>
            path.startsWith(CLM_BASE_URI) && CLM_CONTRACT_CHECKIN_URI_PATH.test(path),
        transport: {
            controller: 'ClmController.checkIn',
        },
    },
    unlock: {
        method: 'patch',
        predicate: (path) =>
            path.startsWith(CLM_BASE_URI) && CLM_CONTRACT_UNLOCK_URI_PATH.test(path),
        transport: {
            controller: 'ClmController.unlock',
        },
    },
    uploadReferenceData: {
        method: 'post',
        predicate: (path) =>
            path.startsWith(CONNECT_BASE_URI) && UPLOAD_REFERENCE_DATA_PATH.test(path),
        transport: {
            controller: 'SustainabilityFamilyController.uploadReferenceData',
        },
    },
    bei: {
        method: 'post',
        predicate: (path) => path.startsWith(CONNECT_BASE_URI) && BEI_PATH.test(path),
        transport: {
            controller: 'SustainabilityFamilyController.performBuildingEnergyIntensityCalculation',
        },
    },
    recalculate: {
        method: 'post',
        predicate: (path) => path.startsWith(CONNECT_BASE_URI) && RECALCULATE_PATH.test(path),
        transport: {
            controller:
                'SustainabilityFamilyController.performSustainabilityFootprintCalculationOnRecord',
        },
    },
    getTenantRegistrationStatus: {
        method: 'get',
        predicate: (path) =>
            path.startsWith(RCG_TENANTMANAGEMENT_BASE_URI) && RCG_TPM_MANAGEMENT_PATH.test(path),
        transport: {
            controller: 'RCGTenantManagementController.getTenantRegistrationStatus',
        },
    },
    updateTenantCertificate: {
        method: 'put',
        predicate: (path) =>
            path.startsWith(RCG_TENANTMANAGEMENT_BASE_URI) && RCG_TPM_MANAGEMENT_PATH.test(path),
        transport: {
            controller: 'RCGTenantManagementController.updateTenantCertificate',
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

const scalecenter: ApiFamily = {
    queryMetrics: {
        method: 'get',
        predicate: (path: string) => SCALE_CENTER_GET_METRICS_PATH.test(path),
        transport: {
            controller: 'ScaleCenterController.queryMetrics',
        },
    },
};

const learningContentPlatform: ApiFamily = {
    getFeaturedItems: {
        method: 'get',
        predicate: (path: string) =>
            path.startsWith(LEARNING_CONTENT_PLATFORM_BASE_URI) &&
            GET_LEARNING_CONTENT_PLATFORM_PATH.test(path),
        transport: {
            controller: 'LearningContentPlatformController.getFeaturedItems',
        },
    },
    getFeaturedItemsRelatedList: {
        method: 'get',
        predicate: (path: string) =>
            path.startsWith(LEARNING_CONTENT_PLATFORM_BASE_URI) &&
            GET_LEARNING_CONTENT_PLATFORM_RELATED_LIST_PATH.test(path),
        transport: {
            controller: 'LearningContentPlatformController.getFeaturedItemsRelatedList',
        },
    },
    getFeaturedItemsRecommendedList: {
        method: 'get',
        predicate: (path: string) =>
            path.startsWith(LEARNING_CONTENT_PLATFORM_BASE_URI) &&
            GET_LEARNING_CONTENT_PLATFORM_RECOMMENDED_LIST_PATH.test(path),
        transport: {
            controller: 'LearningContentPlatformController.getFeaturedItemsRecommendedList',
        },
    },
};

const guidance: ApiFamily = {
    getGuidanceAssistantTarget: {
        method: 'get',
        predicate: (path: string) =>
            path.startsWith(GUIDANCE_BASE_URI) && GET_GUIDANCE_ASSISTANT_TARGET_PATH.test(path),
        transport: {
            controller: 'LightningExperienceAssistantPlatformController.getAssistantTarget',
        },
    },
    getGuidanceAssistantList: {
        method: 'get',
        predicate: (path: string) =>
            path.startsWith(GUIDANCE_BASE_URI) && GET_GUIDANCE_ASSISTANT_LIST_PATH.test(path),
        transport: {
            controller: 'LightningExperienceAssistantPlatformController.getAssistantList',
        },
    },
    saveGuidanceAssistantList: {
        method: 'patch',
        predicate: (path: string) =>
            path.startsWith(GUIDANCE_BASE_URI) && GET_GUIDANCE_ASSISTANT_LIST_PATH.test(path),
        transport: {
            controller: 'LightningExperienceAssistantPlatformController.saveAssistantList',
        },
    },
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
            controller: 'LightningExperienceAssistantPlatformController.getQuestionnaires',
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
    evaluateStep: {
        method: 'patch',
        predicate: (path: string) =>
            path.startsWith(GUIDANCE_BASE_URI) && GET_GUIDANCE_STEP_PATH.test(path),
        transport: {
            controller: 'LightningExperienceAssistantPlatformController.evaluateStep',
        },
    },
    initialize: {
        method: 'put',
        predicate: (path: string) =>
            path.startsWith(GUIDANCE_BASE_URI) && GET_GUIDANCE_INITIALIZE_PATH.test(path),
        transport: {
            controller: 'LightningExperienceAssistantPlatformController.initialize',
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
    deleteDataConnector: {
        method: 'delete',
        predicate: (path: string) =>
            path.startsWith(WAVE_BASE_URI) && DATA_CONNECTOR_PATH.test(path),
        transport: {
            controller: 'WaveController.deleteDataConnector',
        },
    },
    getDataConnectorSourceFields: {
        method: 'get',
        predicate: (path: string) =>
            path.startsWith(WAVE_BASE_URI) && DATA_CONNECTOR_SOURCE_FIELDS_PATH.test(path),
        transport: {
            controller: 'WaveController.getDataConnectorSourceFields',
        },
    },
    getDataConnectorSourceObjects: {
        method: 'get',
        predicate: (path: string) =>
            path.startsWith(WAVE_BASE_URI) && DATA_CONNECTOR_SOURCE_OBJECTS_PATH.test(path),
        transport: {
            controller: 'WaveController.getDataConnectorSourceObjects',
        },
    },
    getDataConnectorSourceObject: {
        method: 'get',
        predicate: (path: string) =>
            path.startsWith(WAVE_BASE_URI) && DATA_CONNECTOR_SOURCE_OBJECT_PATH.test(path),
        transport: {
            controller: 'WaveController.getDataConnectorSourceObject',
        },
    },
    getDataConnectorSourceObjectDataPreviewWithFields: {
        method: 'post',
        predicate: (path: string) =>
            path.startsWith(WAVE_BASE_URI) && DATA_CONNECTOR_SOURCE_OBJECT_PREVIEW_PATH.test(path),
        transport: {
            controller: 'WaveController.getDataConnectorSourceObjectDataPreviewWithFields',
        },
    },
    ingestDataConnector: {
        method: 'post',
        predicate: (path: string) =>
            path.startsWith(WAVE_BASE_URI) && INGEST_DATA_CONNECTOR_PATH.test(path),
        transport: {
            controller: 'WaveController.ingestDataConnector',
        },
    },
    getDataConnectorStatus: {
        method: 'get',
        predicate: (path: string) =>
            path.startsWith(WAVE_BASE_URI) && DATA_CONNECTOR_STATUS_PATH.test(path),
        transport: {
            controller: 'WaveController.getDataConnectorStatus',
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
    getDataflows: {
        method: 'get',
        predicate: (path: string) => path.startsWith(WAVE_BASE_URI) && DATAFLOWS_PATH.test(path),
        transport: {
            controller: 'WaveController.getDataflows',
        },
    },
    getDependencies: {
        method: 'get',
        predicate: (path: string) => path.startsWith(WAVE_BASE_URI) && DEPENDENCIES_PATH.test(path),
        transport: {
            controller: 'WaveController.getDependencies',
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
    updateRecipe: {
        method: 'patch',
        predicate: (path: string) => path.startsWith(WAVE_BASE_URI) && RECIPE_PATH.test(path),
        transport: {
            controller: 'WaveController.updateRecipe',
        },
    },
    getRecipes: {
        method: 'get',
        predicate: (path: string) => path.startsWith(WAVE_BASE_URI) && RECIPES_PATH.test(path),
        transport: {
            controller: 'WaveController.getRecipes',
        },
    },
    getRecipeNotification: {
        method: 'get',
        predicate: (path: string) =>
            path.startsWith(WAVE_BASE_URI) && RECIPE_NOTIFICATION_PATH.test(path),
        transport: {
            controller: 'WaveController.getRecipeNotification',
        },
    },
    updateRecipeNotification: {
        method: 'put',
        predicate: (path: string) =>
            path.startsWith(WAVE_BASE_URI) && RECIPE_NOTIFICATION_PATH.test(path),
        transport: {
            controller: 'WaveController.updateRecipeNotification',
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
    updateDataset: {
        method: 'patch',
        predicate: (path: string) => path.startsWith(WAVE_BASE_URI) && DATASET_PATH.test(path),
        transport: {
            controller: 'WaveController.updateDataset',
        },
    },
    getDatasets: {
        method: 'get',
        predicate: (path: string) => path.startsWith(WAVE_BASE_URI) && DATASETS_PATH.test(path),
        transport: {
            controller: 'WaveController.getDatasets',
        },
    },
    getDatasetVersion: {
        method: 'get',
        predicate: (path: string) =>
            path.startsWith(WAVE_BASE_URI) && DATASET_VERSION_PATH.test(path),
        transport: {
            controller: 'WaveController.getDatasetVersion',
        },
    },
    updateDatasetVersion: {
        method: 'patch',
        predicate: (path: string) =>
            path.startsWith(WAVE_BASE_URI) && DATASET_VERSION_PATH.test(path),
        transport: {
            controller: 'WaveController.updateDatasetVersion',
        },
    },
    createDatasetVersion: {
        method: 'post',
        predicate: (path: string) =>
            path.startsWith(WAVE_BASE_URI) && DATASET_VERSIONS_PATH.test(path),
        transport: {
            controller: 'WaveController.createDatasetVersion',
        },
    },
    getSecurityCoverageDatasetVersion: {
        method: 'get',
        predicate: (path: string) =>
            path.startsWith(WAVE_BASE_URI) && SECURITY_COVERAGE_DATASET_VERSION_PATH.test(path),
        transport: {
            controller: 'WaveController.getSecurityCoverageDatasetVersion',
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
    getWaveTemplates: {
        method: 'get',
        predicate: (path: string) =>
            path.startsWith(WAVE_BASE_URI) && WAVE_TEMPLATES_PATH.test(path),
        transport: {
            controller: 'WaveController.getWaveTemplates',
        },
    },
    getWaveTemplate: {
        method: 'get',
        predicate: (path: string) =>
            path.startsWith(WAVE_BASE_URI) && WAVE_TEMPLATE_PATH.test(path),
        transport: {
            controller: 'WaveController.getWaveTemplate',
        },
    },
    getWaveTemplateConfig: {
        method: 'get',
        predicate: (path: string) =>
            path.startsWith(WAVE_BASE_URI) && WAVE_TEMPLATE_CONFIG_PATH.test(path),
        transport: {
            controller: 'WaveController.getWaveTemplateConfig',
        },
    },
    getWaveTemplateReleaseNotes: {
        method: 'get',
        predicate: (path: string) =>
            path.startsWith(WAVE_BASE_URI) && WAVE_TEMPLATE_RELEASE_NOTES_PATH.test(path),
        transport: {
            controller: 'WaveController.getWaveTemplateReleaseNotes',
        },
    },
};
const analyticsPrivate: ApiFamily = {
    executeSoqlQueryPost: {
        method: 'post',
        predicate: (path: string) =>
            path.startsWith(WAVE_BASE_URI) && EXECUTE_SOQL_QUERY_PATH.test(path),
        transport: {
            controller: 'WaveController.executeSoqlQueryPost',
        },
    },
};
const adats: ApiFamily = {
    getConnectors: {
        method: 'get',
        predicate: (path: string) => {
            return path.startsWith(ADATS_SYNC_BASE_URI) && ADATS_CONNECTORS_PATH.test(path);
        },
        transport: {
            controller: 'AdatsController.getConnectors',
        },
    },
    getConnector: {
        method: 'get',
        predicate: (path: string) =>
            path.startsWith(ADATS_SYNC_BASE_URI) && ADATS_CONNECTOR_PATH.test(path),
        transport: {
            controller: 'AdatsController.getConnector',
        },
    },
    getConnections: {
        method: 'get',
        predicate: (path: string) =>
            path.startsWith(ADATS_SYNC_BASE_URI) && ADATS_CONNECTIONS_PATH.test(path),
        transport: {
            controller: 'AdatsController.getConnections',
        },
    },
    getConnection: {
        method: 'get',
        predicate: (path: string) =>
            path.startsWith(ADATS_SYNC_BASE_URI) && ADATS_CONNECTION_PATH.test(path),
        transport: {
            controller: 'AdatsController.getConnection',
        },
    },
    createConnection: {
        method: 'post',
        predicate: (path: string) =>
            path.startsWith(ADATS_SYNC_BASE_URI) && ADATS_CONNECTIONS_PATH.test(path),
        transport: {
            controller: 'AdatsController.createConnection',
        },
    },
    getConnectionSourceObjects: {
        method: 'get',
        predicate: (path: string) =>
            path.startsWith(ADATS_SYNC_BASE_URI) && ADATS_SOURCE_OBJECTS_PATH.test(path),
        transport: {
            controller: 'AdatsController.getConnectionSourceObjects',
        },
    },
    getConnectionSourceObject: {
        method: 'get',
        predicate: (path: string) =>
            path.startsWith(ADATS_SYNC_BASE_URI) && ADATS_SOURCE_OBJECT_PATH.test(path),
        transport: {
            controller: 'AdatsController.getConnectionSourceObject',
        },
    },
    getFields: {
        method: 'get',
        predicate: (path: string) =>
            path.startsWith(ADATS_SYNC_BASE_URI) && ADATS_FIELDS_PATH.test(path),
        transport: {
            controller: 'AdatsController.getFields',
        },
    },
    getTargets: {
        method: 'get',
        predicate: (path: string) =>
            path.startsWith(ADATS_SYNC_BASE_URI) && ADATS_TARGETS_PATH.test(path),
        transport: {
            controller: 'AdatsController.getTargets',
        },
    },
    getTarget: {
        method: 'get',
        predicate: (path: string) =>
            path.startsWith(ADATS_SYNC_BASE_URI) && ADATS_TARGET_PATH.test(path),
        transport: {
            controller: 'AdatsController.getTarget',
        },
    },
    createTarget: {
        method: 'post',
        predicate: (path: string) =>
            path.startsWith(ADATS_SYNC_BASE_URI) && ADATS_TARGETS_PATH.test(path),
        transport: {
            controller: 'AdatsController.createTarget',
        },
    },
    deleteTarget: {
        method: 'delete',
        predicate: (path: string) =>
            path.startsWith(ADATS_SYNC_BASE_URI) && ADATS_TARGET_PATH.test(path),
        transport: {
            controller: 'AdatsController.deleteTarget',
        },
    },
    updateTarget: {
        method: 'patch',
        predicate: (path: string) =>
            path.startsWith(ADATS_SYNC_BASE_URI) && ADATS_TARGET_PATH.test(path),
        transport: {
            controller: 'AdatsController.updateTarget',
        },
    },
    getCatalogDatabases: {
        method: 'get',
        predicate: (path: string) =>
            path.startsWith(ADATS_CATALOG_BASE_URI) && ADATS_CATALOG_DATABASES_PATH.test(path),
        transport: {
            controller: 'AdatsController.getCatalogDatabases',
        },
    },
    getCatalogDatabase: {
        method: 'get',
        predicate: (path: string) =>
            path.startsWith(ADATS_CATALOG_BASE_URI) && ADATS_CATALOG_DATABASE_PATH.test(path),
        transport: {
            controller: 'AdatsController.getCatalogDatabase',
        },
    },
    getCatalogSchemas: {
        method: 'get',
        predicate: (path: string) =>
            path.startsWith(ADATS_CATALOG_BASE_URI) && ADATS_CATALOG_SCHEMAS_PATH.test(path),
        transport: {
            controller: 'AdatsController.getCatalogSchemas',
        },
    },
    getCatalogSchema: {
        method: 'get',
        predicate: (path: string) =>
            path.startsWith(ADATS_CATALOG_BASE_URI) && ADATS_CATALOG_SCHEMA_PATH.test(path),
        transport: {
            controller: 'AdatsController.getCatalogSchema',
        },
    },
    getCatalogTables: {
        method: 'get',
        predicate: (path: string) =>
            path.startsWith(ADATS_CATALOG_BASE_URI) && ADATS_CATALOG_TABLES_PATH.test(path),
        transport: {
            controller: 'AdatsController.getCatalogTables',
        },
    },
    getCatalogTable: {
        method: 'get',
        predicate: (path: string) =>
            path.startsWith(ADATS_CATALOG_BASE_URI) && ADATS_CATALOG_TABLE_PATH.test(path),
        transport: {
            controller: 'AdatsController.getCatalogTable',
        },
    },
    deleteCatalogTable: {
        method: 'delete',
        predicate: (path: string) =>
            path.startsWith(ADATS_CATALOG_BASE_URI) && ADATS_CATALOG_TABLE_PATH.test(path),
        transport: {
            controller: 'AdatsController.deleteCatalogTable',
        },
    },
    getCatalogGrants: {
        method: 'get',
        predicate: (path: string) =>
            path.startsWith(ADATS_CATALOG_BASE_URI) && ADATS_GRANTS_PATH.test(path),
        transport: {
            controller: 'AdatsController.getCatalogGrants',
        },
    },
    createCatalogGrants: {
        method: 'post',
        predicate: (path: string) =>
            path.startsWith(ADATS_CATALOG_BASE_URI) && ADATS_GRANTS_PATH.test(path),
        transport: {
            controller: 'AdatsController.createCatalogGrants',
        },
    },
};

const smartDataDiscovery: ApiFamily = {
    getStories: {
        method: 'get',
        predicate: (path: string) =>
            path.startsWith(SMART_DATA_DISCOVERY_BASE_URI) && STORIES_PATH.test(path),
        transport: {
            controller: 'SmartDataDiscoveryController.getStories',
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

const billing: ApiFamily = {
    createPaymentsBatchScheduler: {
        method: 'post',
        predicate: (path: string) =>
            path.startsWith(BILLING_BASE_URI) && POST_BATCH_PAYMENTS_SCHEDULERS_PATH.test(path),
        transport: {
            controller: 'BillingBatchApplicationController.createPaymentsBatchScheduler',
        },
    },
    createInvoicesBatchScheduler: {
        method: 'post',
        predicate: (path: string) =>
            path.startsWith(BILLING_BASE_URI) && POST_BATCH_INVOICES_SCHEDULERS_PATH.test(path),
        transport: {
            controller: 'BatchInvoiceApplicationController.createBatchInvoiceScheduler',
        },
    },
};

const marketingIntegration = {
    getForm: {
        method: 'get',
        predicate: (path: string) =>
            path.startsWith(SITES_BASE_URI) && MARKETING_INTEGRATION_GET_FORM_PATH.test(path),
        transport: {
            controller: 'MarketingIntegrationController.getForm',
        },
    },
    submitForm: {
        method: 'post',
        predicate: (path: string) =>
            path.startsWith(SITES_BASE_URI) && MARKETING_INTEGRATION_SUBMIT_FORM_PATH.test(path),
        transport: {
            controller: 'MarketingIntegrationController.submitForm',
        },
    },
    saveForm: {
        method: 'post',
        predicate: (path: string) =>
            path.startsWith(SITES_BASE_URI) && MARKETING_INTEGRATION_SAVE_FORM_PATH.test(path),
        transport: {
            controller: 'MarketingIntegrationController.saveForm',
        },
    },
};

const videovisits: ApiFamily = {
    chimeMeeting: {
        method: 'post',
        predicate: (path: string) =>
            path.startsWith(CONNECT_BASE_URI) && JOIN_CHIME_MEETING_PATH.test(path),
        transport: {
            controller: 'VideoVisitController.chimeMeeting',
        },
    },
    leaveChimeMeeting: {
        method: 'put',
        predicate: (path: string) =>
            path.startsWith(CONNECT_BASE_URI) && LEAVE_CHIME_MEETING_PATH.test(path),
        transport: {
            controller: 'VideoVisitController.leaveChimeMeeting',
        },
    },
};

const hpiscore: ApiFamily = {
    getActionsDetails: {
        method: 'get',
        transport: {
            controller: 'HolisticPatientIndexController.getActionsDetails',
        },
        predicate: (path: string) => path.startsWith(CONNECT_BASE_URI) && HPI_SCORE_PATH.test(path),
    },
    getMorePatientScores: {
        method: 'get',
        transport: {
            controller: 'HolisticPatientIndexController.getMorePatientScores',
        },
        predicate: (path: string) =>
            path.startsWith(CONNECT_BASE_URI) && GET_PATIENT_LIST_SCORE.test(path),
    },
    getApexInterfaceStatus: {
        method: 'get',
        transport: {
            controller: 'HolisticPatientIndexController.getApexInterfaceStatus',
        },
        predicate: (path: string) =>
            path.startsWith(CONNECT_BASE_URI) && GET_PATIENT_SCORE_APEX_PATH.test(path),
    },
};

const interesttagging: ApiFamily = {
    getTagsByRecordId: {
        method: 'get',
        predicate: (path: string) =>
            path.startsWith(CONNECT_BASE_URI) && GET_TAGS_BY_RECORD_PATH.test(path),
        transport: {
            controller: 'InterestTaggingFamilyController.getTagsByRecordId',
        },
    },
    getInterestTagEntityAssignments: {
        method: 'get',
        predicate: (path: string) =>
            path.startsWith(CONNECT_BASE_URI) && GET_RECORDS_BY_TAGID_PATH.test(path),
        transport: {
            controller: 'InterestTaggingFamilyController.getInterestTagEntityAssignments',
        },
    },
    getTagsByCategoryId: {
        method: 'get',
        predicate: (path) =>
            path.startsWith(CONNECT_BASE_URI) && GET_TAGS_BY_CATEGORYID_PATH.test(path),
        transport: {
            controller: 'InterestTaggingFamilyController.getTagsByCategoryId',
        },
    },
    getTagCategoriesByTagId: {
        method: 'get',
        predicate: (path) =>
            path.startsWith(CONNECT_BASE_URI) && GET_CATEGORIES_BY_TAGID_PATH.test(path),
        transport: {
            controller: 'InterestTaggingFamilyController.getTagCategoriesByTagId',
        },
    },
};

const identityVerification: ApiFamily = {
    buildVerificationContext: {
        method: 'post',
        predicate: (path: string) =>
            path.startsWith(CONNECT_BASE_URI) &&
            IDENTIFY_VERIFICATION_BUILD_CONTEXT_PATH.test(path),
        transport: {
            controller: 'IdentityVerificationController.buildVerificationContext',
        },
    },

    searchRecords: {
        method: 'post',
        predicate: (path: string) =>
            path.startsWith(CONNECT_BASE_URI) && IDENTIFY_VERIFICATION_SEARCH_PATH.test(path),
        transport: {
            controller: 'IdentityVerificationController.searchRecords',
        },
    },

    identityVerification: {
        method: 'post',
        predicate: (path: string) =>
            path.startsWith(CONNECT_BASE_URI) &&
            IDENTIFY_VERIFICATION_VERIFY_RECORD_PATH.test(path),
        transport: {
            controller: 'IdentityVerificationController.identityVerification',
        },
    },
};

const timeline: ApiFamily = {
    getTimelineData: {
        method: 'get',
        predicate: (path: string) => path.startsWith(CONNECT_BASE_URI) && TIMELINE_PATH.test(path),
        transport: {
            controller: 'TimelineController.getTimelineData',
        },
    },
};

const assetCreation: ApiFamily = {
    getStarterTemplates: {
        method: 'get',
        predicate: (path) =>
            path.startsWith(ASSETCREATION_BASE_URI) && GET_STARTER_TEMPLATES_PATH.test(path),
        transport: {
            controller: 'AssetCreationController.getStarterTemplates',
        },
    },

    getStarterTemplateById: {
        method: 'get',
        predicate: (path) =>
            path.startsWith(ASSETCREATION_BASE_URI) && GET_STARTER_TEMPLATE_BYID_PATH.test(path),
        transport: {
            controller: 'AssetCreationController.getStarterTemplateById',
        },
    },

    createAsset: {
        method: 'post',
        predicate: (path: string) =>
            path.startsWith(ASSETCREATION_BASE_URI) && POST_ASSET_OBJECT_PATH.test(path),
        transport: {
            controller: 'AssetCreationController.createAsset',
        },
    },
};
registerApiFamilyRoutes(connect);
registerApiFamilyRoutes(commerce);
registerApiFamilyRoutes(guidance);
registerApiFamilyRoutes(analytics);
registerApiFamilyRoutes(analyticsPrivate);
registerApiFamilyRoutes(adats);
registerApiFamilyRoutes(scalecenter);
registerApiFamilyRoutes(flow);
registerApiFamilyRoutes(billing);
registerApiFamilyRoutes(marketingIntegration);
registerApiFamilyRoutes(videovisits);
registerApiFamilyRoutes(interesttagging);
registerApiFamilyRoutes(identityVerification);
registerApiFamilyRoutes(hpiscore);
registerApiFamilyRoutes(learningContentPlatform);
registerApiFamilyRoutes(timeline);
registerApiFamilyRoutes(smartDataDiscovery);
registerApiFamilyRoutes(assetCreation);
