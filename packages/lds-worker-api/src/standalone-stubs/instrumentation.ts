// TODO TD-0081508 - once that TD is fulfilled we can probably change this file
export const instrumentation = {
    instrumentAdapter(createFunction: Function, _metadata: any) {
        return createFunction;
    },
};

export function incrementGetRecordNotifyChangeAllowCount() {}
export function incrementGetRecordNotifyChangeDropCount() {}
export function refreshApiEvent() {}

export const REFRESH_UIAPI_KEY = 'refreshUiApi';
