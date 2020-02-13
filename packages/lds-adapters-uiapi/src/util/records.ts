import { LDS, ProxyGraphNode, GraphNode } from '@ldsjs/engine';
import { FieldRepresentation } from '../generated/types/FieldRepresentation';
import {
    FieldValueRepresentation,
    FieldValueRepresentationNormalized,
} from '../generated/types/FieldValueRepresentation';
import { ObjectInfoRepresentation } from '../generated/types/ObjectInfoRepresentation';
import { RecordInputRepresentation } from '../generated/types/RecordInputRepresentation';
import {
    keyBuilder as recordRepresentationKeyBuilder,
    RecordRepresentation,
    RecordRepresentationNormalized,
} from '../generated/types/RecordRepresentation';
import {
    ArrayPrototypePush,
    ObjectKeys,
    ObjectPrototypeHasOwnProperty,
    StringPrototypeEndsWith,
} from './language';
import { FieldId, splitQualifiedFieldApiName } from '../primitives/FieldId';
import getFieldApiName from '../primitives/FieldId/coerce';
import { dedupe } from '../validation/utils';
import { MASTER_RECORD_TYPE_ID } from './layout';
import { MAX_RECORD_DEPTH } from '../selectors/record';

type FieldValueRepresentationValue = FieldValueRepresentation['value'];

interface FieldValueRepresentationLinkState {
    fields: string[];
}

export interface RecordLayoutFragment {
    apiName: RecordRepresentation['apiName'];
    recordTypeId: RecordRepresentation['recordTypeId'];
}

export function isGraphNode(node: ProxyGraphNode<unknown>): node is GraphNode<unknown> {
    return node !== null && node.type === 'Node';
}

export function extractTrackedFields(
    node: ProxyGraphNode<RecordRepresentationNormalized, RecordRepresentation>,
    parentFieldName: string,
    fieldsList: string[] = [],
    visitedRecordIds: Record<string, boolean> = {},
    depth: number = 0
): string[] {
    // Filter Error and null nodes
    if (!isGraphNode(node) || depth > MAX_RECORD_DEPTH) {
        return [];
    }
    const recordId = node.data.id;

    // Stop the traversal if the key has already been visited, since the fields for this record
    // have already been gathered at this point.
    if (ObjectPrototypeHasOwnProperty.call(visitedRecordIds, recordId)) {
        return fieldsList;
    }

    // The visitedRecordIds object passed to the spanning record is a copy of the original
    // visitedRecordIds + the current record id, since we want to detect circular references within
    // a given path.
    let spanningVisitedRecordIds = {
        ...visitedRecordIds,
        [recordId]: true,
    };

    const fields = node.object('fields');
    const keys = fields.keys();

    for (let i = 0, len = keys.length; i < len; i += 1) {
        const key = keys[i];
        const fieldValueRep = fields.link<
            FieldValueRepresentationNormalized,
            FieldValueRepresentation,
            FieldValueRepresentationLinkState
        >(key);

        const fieldName = `${parentFieldName}.${key}`;
        if (fieldValueRep.isMissing()) {
            ArrayPrototypePush.call(fieldsList, fieldName);
            continue;
        }

        const field = fieldValueRep.follow();

        // Filter Error and null nodes
        if (!isGraphNode(field)) {
            continue;
        }

        if (field.isScalar('value') === false) {
            const spanning = field
                .link<RecordRepresentationNormalized, RecordRepresentation>('value')
                .follow();

            extractTrackedFields(
                spanning,
                fieldName,
                fieldsList,
                spanningVisitedRecordIds,
                depth + 1
            );
        } else {
            const state = fieldValueRep.linkData();
            if (state !== undefined) {
                const { fields } = state;
                for (let s = 0, len = fields.length; s < len; s += 1) {
                    const childFieldName = fields[s];
                    ArrayPrototypePush.call(fieldsList, `${fieldName}.${childFieldName}`);
                }
            } else {
                ArrayPrototypePush.call(fieldsList, fieldName);
            }
        }
    }

    return fieldsList;
}

export function getTrackedFields(
    lds: LDS,
    recordId: string,
    fieldsFromConfig?: string[]
): string[] {
    const key = recordRepresentationKeyBuilder({
        recordId,
    });
    const fieldsList = fieldsFromConfig === undefined ? [] : [...fieldsFromConfig];

    const graphNode = lds.getNode<RecordRepresentationNormalized, RecordRepresentation>(key);
    if (!isGraphNode(graphNode)) {
        return fieldsList;
    }

    const fileName = graphNode.scalar('apiName');
    const fields = extractTrackedFields(graphNode, fileName, fieldsList);

    return dedupe(fields).sort();
}

/**
 * Returns a new object that has a list of fields that has been filtered by
 * edited fields. Only contains fields that have been edited from their original
 * values (excluding Id which is always copied over).
 * @param input The RecordInputRepresentation object to filter.
 * @param original The Record object that contains the original field values.
 * @returns RecordInputRepresentation, see the description
 */
export function createRecordInputFilteredByEditedFields(
    input: RecordInputRepresentation,
    original: RecordRepresentation
): RecordInputRepresentation {
    const filteredRecordInput = getRecordInput();
    // Always copy over any existing id.
    if (original.id) {
        filteredRecordInput.fields.Id = original.id;
    }

    const recordInputFields = input.fields;
    const originalRecordFields = original.fields;
    const recordInputFieldPropertyNames = ObjectKeys(recordInputFields);
    for (let i = 0, len = recordInputFieldPropertyNames.length; i < len; i++) {
        const fieldName = recordInputFieldPropertyNames[i];
        let originalRecordFieldsEntry: FieldValueRepresentation | undefined;
        if (originalRecordFields) {
            originalRecordFieldsEntry = originalRecordFields[fieldName];
        }
        if (
            !originalRecordFieldsEntry ||
            (originalRecordFields &&
                recordInputFields[fieldName] !== originalRecordFieldsEntry.value)
        ) {
            filteredRecordInput.fields[fieldName] = recordInputFields[fieldName];
        }
    }

    return filteredRecordInput;
}

/**
 * Returns an object with its data populated from the given record. All fields
 * with values that aren't nested records will be assigned. This object can be
 * used to create a record.
 * @param record The record that contains the source data.
 * @param objectInfo The ObjectInfo corresponding to the apiName on the record.
 *        If provided, only fields that are createable=true (excluding Id) will
 *        be assigned to the object return value.
 * @returns RecordInputRepresentation See description.
 */
export function generateRecordInputForCreate(
    record: RecordRepresentation,
    objectInfo?: ObjectInfoRepresentation
): RecordInputRepresentation {
    const recordInput = _generateRecordInput(
        record,
        field => field.createable === true,
        objectInfo
    );
    recordInput.apiName = record.apiName;
    // fields.Id is not required for CREATE which might have been copied over,
    // so delete fields.Id
    delete recordInput.fields.Id;
    return recordInput;
}

/**
 * Returns an object with its data populated from the given record. All fields
 * with values that aren't nested records will be assigned. This object can be
 * used to update a record.
 * @param record The record that contains the source data.
 * @param objectInfo The ObjectInfo corresponding to the apiName on the record.
 *        If provided, only fields that are updateable=true (excluding Id) will
 *        be assigned to the object return value.
 * @returns RecordInputRepresentation See description.
 */
export function generateRecordInputForUpdate(
    record: RecordRepresentation,
    objectInfo?: ObjectInfoRepresentation
): RecordInputRepresentation {
    const recordInput = _generateRecordInput(
        record,
        field => field.updateable === true,
        objectInfo
    );
    if (!record.id) {
        throw new Error('record must have id for update');
    }
    // Always copy over any existing id.
    recordInput.fields.Id = record.id;
    return recordInput;
}

function isRecordInputFieldValue(
    unknown: unknown
): unknown is RecordInputRepresentation['fields'][number] {
    const type = typeof unknown;
    return unknown === null || type === 'string' || type === 'number' || type === 'boolean';
}

/**
 * Returns an object with its data populated from the given record. All fields
 * with values that aren't nested records will be assigned.
 * @param record The record that contains the source data.
 * @param copyFieldPredicate predicate to determine if a field should be copied.
 *        Required if "objectInfo" parameter is passed.
 * @param objectInfo The ObjectInfo corresponding to the apiName on the record.
 *        If provided, only fields that match the copyFieldPredicate (excluding
 *        Id) will be assigned to the object return value.
 * @returns RecordInputRepresentation
 */
function _generateRecordInput(
    record: RecordRepresentation,
    copyFieldPredicate?: (field: FieldRepresentation) => boolean,
    objectInfo?: ObjectInfoRepresentation
): RecordInputRepresentation {
    const recordInput = getRecordInput();

    const recordFields = record.fields;
    let objectInfoFields: { [key: string]: FieldRepresentation } | undefined;
    if (objectInfo) {
        objectInfoFields = objectInfo.fields;
    }

    const recordFieldPropertyNames = ObjectKeys(recordFields);
    for (let i = 0, len = recordFieldPropertyNames.length; i < len; i++) {
        const fieldName = recordFieldPropertyNames[i];
        const recordFieldsFieldNameEntry = recordFields[fieldName].value;
        if (isRecordInputFieldValue(recordFieldsFieldNameEntry)) {
            if (objectInfoFields && copyFieldPredicate) {
                const objectInfoFieldsFieldNameValue = objectInfoFields[fieldName];
                if (
                    objectInfoFieldsFieldNameValue &&
                    copyFieldPredicate(objectInfoFieldsFieldNameValue)
                ) {
                    recordInput.fields[fieldName] = recordFieldsFieldNameEntry;
                }
            } else {
                recordInput.fields[fieldName] = recordFieldsFieldNameEntry;
            }
        }
    }

    return recordInput;
}

/**
 * Gets a new Record Input.
 */
export function getRecordInput(): RecordInputRepresentation {
    return {
        apiName: undefined,
        fields: {},
    };
}

/**
 * Gets a field's value from a record.
 * @param record The record.
 * @param field The qualified API name of the field to return.
 * @returns The field's value (which may be a record in the case of spanning
 *          fields), or undefined if the field isn't found.
 */
export function getFieldValue(
    record: RecordRepresentation,
    field: FieldId | string
): FieldValueRepresentationValue | undefined {
    const fieldValueRepresentation = getField(record, field);
    if (fieldValueRepresentation === undefined) {
        return undefined;
    }

    if (isFieldValueRepresentation(fieldValueRepresentation)) {
        return fieldValueRepresentation.value;
    }

    return fieldValueRepresentation;
}

/**
 * Gets a field's display value from a record.
 * @param record The record.
 * @param field The qualified API name of the field to return.
 * @returns The field's display value, or undefined if the field isn't found.
 */
export function getFieldDisplayValue(
    record: RecordRepresentation,
    field: FieldId | string
): FieldValueRepresentationValue | undefined {
    const fieldValueRepresentation = getField(record, field);
    if (fieldValueRepresentation === undefined) {
        return undefined;
    }

    if (isFieldValueRepresentation(fieldValueRepresentation)) {
        return fieldValueRepresentation.displayValue;
    }

    return fieldValueRepresentation;
}

function isFieldValueRepresentation(unknown: unknown): unknown is FieldValueRepresentation {
    if (typeof unknown !== 'object' || unknown === null) {
        return false;
    }

    return 'value' in unknown && 'displayValue' in unknown;
}

function getField(
    record: RecordRepresentation,
    field: FieldId | string
): FieldValueRepresentation | RecordRepresentation | undefined {
    const fieldApiName = getFieldApiName(field);
    if (fieldApiName === undefined) {
        return undefined;
    }
    const unqualifiedField = splitQualifiedFieldApiName(fieldApiName)[1];
    const fields = unqualifiedField.split('.');

    let r = record;
    while (r && r.fields) {
        const f = fields.shift() as string;
        const fvr = r.fields[f];
        if (fvr === undefined) {
            return undefined;
        } else if (fields.length > 0) {
            r = fvr.value as RecordRepresentation;
        } else {
            return fvr;
        }
    }
    return r;
}

export function getRecordTypeId(record: RecordRepresentation | RecordLayoutFragment): string {
    return record.recordTypeId === null ? MASTER_RECORD_TYPE_ID : record.recordTypeId;
}

// This function traverses through a record and marks missing
// optional fields as "missing"
export function markMissingOptionalFields(
    record: ProxyGraphNode<RecordRepresentationNormalized, RecordRepresentation>,
    optionalFields: string[]
): void {
    if (!isGraphNode(record)) {
        return;
    }

    const apiName = record.scalar('apiName');
    for (let a = 0, aLen = optionalFields.length; a < aLen; a++) {
        const parts = optionalFields[a].split('.');
        if (parts[0] === apiName) {
            _markMissingPath(record, parts.slice(1));
        }
    }
}

function markNulledOutPath(
    record: ProxyGraphNode<RecordRepresentationNormalized, RecordRepresentation>,
    path: string[]
) {
    if (!isGraphNode(record)) {
        return;
    }

    const fieldValueRepresentation = record.object('fields');
    const fieldName = path.shift()!;

    if (fieldValueRepresentation.isUndefined(fieldName)) {
        return;
    }

    const link = fieldValueRepresentation.link<
        FieldValueRepresentationNormalized,
        FieldValueRepresentation,
        FieldValueRepresentationLinkState
    >(fieldName);
    const resolved = link.follow();

    if (isGraphNode(resolved) && resolved.isScalar('value') && path.length > 0) {
        const linkState = link.linkData();
        const fields = linkState === undefined ? [] : linkState.fields;
        link.writeLinkData({
            fields: dedupe([...fields, path.join('.')]),
        });
    }
}

export function markNulledOutRequiredFields(
    record: ProxyGraphNode<RecordRepresentationNormalized, RecordRepresentation>,
    fields: string[]
): void {
    if (!isGraphNode(record)) {
        return;
    }

    const apiName = record.scalar('apiName');
    for (let a = 0, aLen = fields.length; a < aLen; a++) {
        const parts = fields[a].split('.');
        if (parts[0] === apiName) {
            markNulledOutPath(record, parts.slice(1));
        }
    }
}

function _markMissingPath(
    record: ProxyGraphNode<RecordRepresentationNormalized, RecordRepresentation>,
    path: string[]
): void {
    // Filter out Error and null nodes
    if (!isGraphNode(record)) {
        return;
    }

    const fieldValueRepresentation = record.object('fields');
    const fieldName = path.shift()!;

    if (fieldValueRepresentation.isUndefined(fieldName) === true) {
        // TODO W-6900046 - remove cast, make RecordRepresentationNormalized['fields'] accept
        // an undefined/non-present __ref if isMissing is present
        fieldValueRepresentation.write(fieldName, {
            __ref: undefined,
            isMissing: true,
        } as any);
        return;
    }

    const link = fieldValueRepresentation.link<
        FieldValueRepresentationNormalized,
        FieldValueRepresentation
    >(fieldName);

    if (link.isPending()) {
        // TODO W-6900046 - remove cast, make RecordRepresentationNormalized['fields'] accept
        // an undefined/non-present __ref if isMissing is present
        fieldValueRepresentation.write(fieldName, {
            __ref: undefined,
            isMissing: true,
        } as any);
    } else if (path.length > 0 && link.isMissing() === false) {
        const fieldValue = link.follow();

        // Filter out Error and null nodes
        if (!isGraphNode(fieldValue)) {
            return;
        }

        // if value is not a scalar, follow the link and mark it as missing
        if (fieldValue.isScalar('value') === false) {
            _markMissingPath(
                fieldValue
                    .link<RecordRepresentationNormalized, RecordRepresentation>('value')
                    .follow(),
                path
            );
        }
    }
}

const CUSTOM_API_NAME_SUFFIX = '__c';

/**
 * A set of the string names of known ui-api supported entities.
 * Source: ui-uisdk-connect-impl-object-whitelist.yaml
 */
export const UIAPI_SUPPORTED_ENTITY_API_NAMES: { [key: string]: true } = {
    Account: true,
    AccountBrand: true,
    AccountContactRelation: true,
    AccountForecast: true,
    AccountForecastPeriodMetric: true,
    AccountPartner: true,
    AccountProductForecast: true,
    AccountProductPeriodForecast: true,
    AccountTeamMember: true,
    ActionCadence: true,
    ActionPlanItem: true,
    ActionPlanTemplate: true,
    ActionPlanTemplateItem: true,
    ActionPlanTemplateItemValue: true,
    ActionPlanTemplateVersion: true,
    Address: true,
    AssessmentTask: true,
    AssessmentTaskOrder: true,
    Asset: true,
    AssetRelationship: true,
    AssignedResource: true,
    AttachedContentNote: true,
    AuthorizedInsuranceLine: true,
    Award: true,
    BCEntityPermission: true,
    BCEntityPermissionSet: true,
    BCFieldPermission: true,
    BCParticipant: true,
    BCParticipantAccess: true,
    BCPermissionSet: true,
    BCRecordAccess: true,
    BCRecordAccessApproval: true,
    BCRelatedParticipant: true,
    BasicDataRecord: true,
    BlockchainAppMember: true,
    BlockchainApplication: true,
    BlockchainEntity: true,
    BlockchainField: true,
    BlockchainMember: true,
    BusinessLicense: true,
    BusinessMilestone: true,
    BusinessProfile: true,
    Campaign: true,
    CampaignMember: true,
    CareBarrier: true,
    CareBarrierType: true,
    CareProgram: true,
    CareProgramEnrollee: true,
    Case: true,
    Claim: true,
    ClaimCase: true,
    ClaimItem: true,
    ClaimParticipant: true,
    Contact: true,
    ContactRequest: true,
    ContentDocument: true,
    ContentNote: true,
    ContentVersion: true,
    ContentWorkspace: true,
    Contract: true,
    ContractContactRole: true,
    ContractLineItem: true,
    CoverageType: true,
    CustomerProperty: true,
    DataExportDefinition: true,
    DeleteEvent: true,
    DigitalSignature: true,
    DistributorAuthorization: true,
    ElectronicMediaGroup: true,
    Employee: true,
    EmployeeCompanyOrganization: true,
    EmployeeJob: true,
    EmployeeJobFamily: true,
    EmployeeJobPosition: true,
    EmployeeWorkerJobPosition: true,
    Entitlement: true,
    EntityArchivingSetup: true,
    EntityMilestone: true,
    EnvironmentHubMember: true,
    Expense: true,
    FtestZosUiPrototypeChild1: true,
    FtestZosUiPrototypeChild2: true,
    FtestZosUiPrototypeParent: true,
    IdentityDocument: true,
    Image: true,
    Individual: true,
    InsuranceClaimAsset: true,
    InsurancePolicy: true,
    InsurancePolicyAsset: true,
    InsurancePolicyCoverage: true,
    InsurancePolicyMemberAsset: true,
    InsurancePolicyParticipant: true,
    InsuranceProfile: true,
    JobProfile: true,
    KnowledgeArticleVersion: true,
    Lead: true,
    LegalEntity: true,
    LicensingRequest: true,
    Location: true,
    LoyaltyProgramCurrency: true,
    LoyaltyProgramMember: true,
    LoyaltyProgramPartner: true,
    LoyaltyTier: true,
    LoyaltyTierGroup: true,
    MaintenanceAsset: true,
    MaintenancePlan: true,
    MaintenanceWorkRule: true,
    MarketSegment: true,
    MarketingAction: true,
    MarketingResource: true,
    Note: true,
    OperatingHours: true,
    Opportunity: true,
    OpportunityLineItem: true,
    OpportunityLineItemSchedule: true,
    OpportunityPartner: true,
    OpportunityTeamMember: true,
    Order: true,
    OrderItem: true,
    OrderItemSummaryChange: true,
    OrderSummary: true,
    OrgMetric: true,
    OrgMetricScanResult: true,
    OrgMetricScanSummary: true,
    Partner: true,
    PersonAccount: true,
    PersonEducation: true,
    PersonEmployment: true,
    PersonLifeEvent: true,
    PriceAdjustmentSchedule: true,
    Pricebook2: true,
    PricebookEntry: true,
    Producer: true,
    ProducerPolicyAssignment: true,
    Product2: true,
    Product2DataTranslation: true,
    ProductCategoryDataTranslation: true,
    ProductCoverage: true,
    ProductMedia: true,
    Quote: true,
    QuoteDocument: true,
    QuoteLineItem: true,
    RecordType: true,
    RegulatoryCode: true,
    ResourceAbsence: true,
    ResourcePreference: true,
    RetailStore: true,
    RetailVisitKpi: true,
    ReturnOrder: true,
    ReturnOrderLineItem: true,
    SSR_IndividualDemo: true,
    SalesAgreement: true,
    SalesAgreementProduct: true,
    SalesAgreementProductSchedule: true,
    SecuritiesHolding: true,
    ServiceAppointment: true,
    ServiceContract: true,
    ServiceCrew: true,
    ServiceCrewMember: true,
    ServiceResource: true,
    ServiceResourceCapacity: true,
    ServiceResourceSkill: true,
    ServiceTerritory: true,
    ServiceTerritoryLocation: true,
    ServiceTerritoryMember: true,
    Shift: true,
    Shipment: true,
    SkillRequirement: true,
    SocialPost: true,
    SurveyInvitation: true,
    SurveyResponse: true,
    SurveySubject: true,
    Tenant: true,
    TimeSheet: true,
    TimeSheetEntry: true,
    TimeSlot: true,
    UsageEntitlement: true,
    UsageEntitlementPeriod: true,
    User: true,
    Visit: true,
    Visitor: true,
    VoiceCall: true,
    WebStoreSearchProdSettings: true,
    WorkOrder: true,
    WorkOrderLineItem: true,
    WorkType: true,
    WorkerCompCoverageClass: true,
};

/**
 * Tells you if an objectApiName is supported by UI API or not.
 * Note: LDS does not currently support all the entities, the list is limited to UI API supported entities
 * @param objectApiName the object API name from a record.
 * @return True if the provided objectApiName is supported in UI API.
 */
export function isSupportedEntity(objectApiName: string): boolean {
    return (
        UIAPI_SUPPORTED_ENTITY_API_NAMES[objectApiName] === true ||
        StringPrototypeEndsWith.call(objectApiName, CUSTOM_API_NAME_SUFFIX)
    );
}

/** Return true if a >= b */
export function isSuperset(a: string[], b: string[]): boolean {
    if (b.length > a.length) {
        return false;
    }

    const aMap: { [key: string]: true } = {};

    // Put all keys from subset into a map
    // so we don't have to use subset.includes which will be slow
    for (let i = 0, len = a.length; i < len; i += 1) {
        aMap[a[i]] = true;
    }

    for (let i = 0, len = b.length; i < len; i += 1) {
        if (aMap[b[i]] === undefined) {
            return false;
        }
    }

    return true;
}
