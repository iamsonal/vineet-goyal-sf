import { LDS } from '@ldsjs/engine';
import { ingestRecord, ingestObjectInfo } from '@salesforce/lds-adapters-uiapi';

export function createRecord(config: any = {}) {
    return {
        apiName: 'Test__c',
        childRelationships: {},
        lastModifiedById: null,
        lastModifiedDate: null,
        recordTypeId: null,
        recordTypeInfo: null,
        systemModstamp: null,
        weakEtag: 0,
        eTag: '123456',
        fields: {},
        ...config,
    };
}

export function createObjectInfo(config: any = {}) {
    return {
        apiName: 'Test__c',
        associateEntityType: null,
        associateParentEntity: null,
        childRelationships: [],
        createable: true,
        custom: true,
        defaultRecordTypeId: null,
        deletable: true,
        dependentFields: {},
        feedEnabled: true,
        fields: {},
        keyPrefix: '00X',
        label: 'test',
        labelPlural: 'tests',
        layoutable: true,
        mruEnabled: true,
        nameFields: [],
        queryable: true,
        recordTypeInfos: {},
        searchable: true,
        themeInfo: null,
        updateable: true,
        eTag: '123456',
        ...config,
    };
}

export function getRecordResourceRequest() {
    return {
        ingest: ingestRecord,
    } as any;
}

export function addRecord(lds: LDS, data: any) {
    const resourceRequest = getRecordResourceRequest();
    lds.storeIngest('', resourceRequest, data);
    lds.storeBroadcast();
}

export function addObjectInfo(lds: LDS, data: any) {
    const resourceRequest = {
        ingest: ingestObjectInfo,
    } as any;

    lds.storeIngest('', resourceRequest, data);
    lds.storeBroadcast();
}