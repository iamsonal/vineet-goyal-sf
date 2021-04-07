import { getEnvironmentSetting, EnvironmentSettings } from '@salesforce/lds-environment-settings';
import { InstrumentationRejectCallback, InstrumentationResolveCallback } from './utils';

export enum CrudEventType {
    CREATE = 'create',
    DELETE = 'delete',
    READ = 'read',
    UPDATE = 'update',
}

export enum CrudEventState {
    ERROR = 'ERROR',
    SUCCESS = 'SUCCESS',
}

export const forceRecordTransactionsDisabled: boolean | undefined = getEnvironmentSetting(
    EnvironmentSettings.ForceRecordTransactionsDisabled
);

export interface RecordInstrumentationCallbacks {
    createRecordRejectFunction: InstrumentationRejectCallback;
    createRecordResolveFunction: InstrumentationResolveCallback;
    deleteRecordRejectFunction: InstrumentationRejectCallback;
    deleteRecordResolveFunction: InstrumentationResolveCallback;
    getRecordAggregateRejectFunction: InstrumentationRejectCallback;
    getRecordAggregateResolveFunction: InstrumentationResolveCallback;
    getRecordRejectFunction: InstrumentationRejectCallback;
    getRecordResolveFunction: InstrumentationResolveCallback;
    updateRecordRejectFunction: InstrumentationRejectCallback;
    updateRecordResolveFunction: InstrumentationResolveCallback;
}

export interface RelatedListInstrumentationCallbacks {
    getRelatedListRecordsRejectFunction: InstrumentationRejectCallback;
    getRelatedListRecordsResolveFunction: InstrumentationResolveCallback;
    getRelatedListRecordsBatchRejectFunction: InstrumentationRejectCallback;
    getRelatedListRecordsBatchResolveFunction: InstrumentationResolveCallback;
}