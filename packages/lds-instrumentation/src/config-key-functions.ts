import { ArrayIsArray } from './utils/language';

function sortedArrayString(value: string[]): string {
    return value
        .slice(0)
        .sort()
        .join(',');
}

function getValue(value: any): string {
    return ArrayIsArray(value) ? sortedArrayString(value) : value;
}

export function getLayoutConfigKey(config: any): string {
    return `getLayout:${config.objectApiName}:${config.formFactor}:${config.layoutType}:${config.mode}:${config.recordTypeId}`;
}

export function getLayoutUserStateConfigKey(config: any): string {
    return `getLayoutUserState:${config.objectApiName}:${config.formFactor}:${config.layoutType}:${config.mode}:${config.recordTypeId}`;
}

export function getListUiConfigKey(config: any): string {
    return `getListUi:${config.listViewId}:${config.pageSize}`;
}

export function getLookupRecordsConfigKey(config: any): string {
    let requestParams: any = {};
    if (config.requestParams !== undefined) {
        requestParams = {
            dependentFieldBindings: config.requestParams.dependentFieldBindings,
            pageParam: config.requestParams.pageParam,
            pageSize: config.requestParams.pageSize,
            q: config.requestParams.q,
            searchType: config.requestParams.searchType,
            sourceRecordId: config.requestParams.sourceRecordId,
        };
    }

    if (typeof config.fieldApiName === 'string') {
        const idx = config.fieldApiName.indexOf('.');
        return `getLookupRecords:${config.fieldApiName.substring(
            0,
            idx
        )}:${config.fieldApiName.substring(idx + 1)}:${config.targetApiName}:${getValue(
            requestParams.dependentFieldBindings
        )}:${getValue(requestParams.pageParam)}:${getValue(requestParams.pageSize)}:${getValue(
            requestParams.q
        )}:${getValue(requestParams.searchType)}:${getValue(requestParams.sourceRecordId)}`;
    } else if (typeof config.fieldApiName === 'object') {
        return `getLookupRecords:${config.fieldApiName.objectApiName}:${
            config.fieldApiName.fieldApiName
        }:${config.targetApiName}:${getValue(requestParams.dependentFieldBindings)}:${getValue(
            requestParams.pageParam
        )}:${getValue(requestParams.pageSize)}:${getValue(requestParams.q)}:${getValue(
            requestParams.searchType
        )}:${getValue(requestParams.sourceRecordId)}`;
    }
    return 'getLookupRecords:invalidFieldApiNameConfig';
}

export function getLookupActionsConfigKey(config: any): string {
    return `getLookupActions:${getValue(config.objectApiNames)}:${getValue(config.actionTypes)}:${
        config.formFactor
    }:${getValue(config.sections)}`;
}
export function getObjectInfoConfigKey(config: any): string {
    return `getObjectInfo:${config.objectApiName}`;
}

export function getPicklistValuesConfigKey(config: any): string {
    if (typeof config.fieldApiName === 'string') {
        const idx = config.fieldApiName.indexOf('.');
        return `getPicklistValues:${config.fieldApiName.substring(
            0,
            idx
        )}:${config.fieldApiName.substring(idx + 1)}:${config.recordTypeId}`;
    } else if (typeof config.fieldApiName === 'object') {
        return `getPicklistValues:${config.fieldApiName.objectApiName}:${config.fieldApiName.fieldApiName}:${config.recordTypeId}`;
    }
    return 'getPicklistValues:invalidFieldApiNameConfig';
}

export function getPicklistValuesByRecordTypeConfigKey(config: any): string {
    return `getPicklistValuesByRecordType:${config.objectApiName}:${config.recordTypeId}`;
}

export function getRecordAvatarsConfigKey(config: any): string {
    return `getRecordAvatars:${getValue(config.recordIds)}:${config.formFactor}`;
}

export function getRecordConfigKey(config: any): string {
    return `getRecord:${config.recordId}:${getValue(config.fields)}:${getValue(
        config.optionalFields
    )}:${getValue(config.modes)}:${getValue(config.layoutTypes)}`;
}

export function getRecordCreateDefaultsConfigKey(config: any): string {
    return `getRecordCreateDefaults:${config.objectApiName}:${config.formFactor}:${
        config.recordTypeId
    }:${getValue(config.optionalFields)}`;
}

export function getRecordUiConfigKey(config: any): string {
    return `getRecordUi:${getValue(config.recordIds)}:${getValue(config.layoutTypes)}:${getValue(
        config.modes
    )}:${getValue(config.optionalFields)}`;
}
