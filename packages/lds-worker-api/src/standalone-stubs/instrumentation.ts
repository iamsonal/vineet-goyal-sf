// TODO [TD-0081508]: once that TD is fulfilled we can probably change this file
export const instrumentation = {
    instrumentAdapter(createFunction: Function, _metadata: any) {
        return createFunction;
    },
};

export function incrementGetRecordNotifyChangeAllowCount() {}
export function incrementGetRecordNotifyChangeDropCount() {}
export function refreshApiEvent() {}
export function instrumentGraphqlAdapter(createFunction: Function, _metadata: any) {
    return createFunction;
}
export function setupInstrumentation(_luvio: any, _store: any) {}
export function instrumentLuvio(_context: unknown) {}

export const REFRESH_UIAPI_KEY = 'refreshUiApi';

export const METRIC_KEYS = {};
export const O11Y_NAMESPACE_LDS_MOBILE = 'lds-mobile';
export const withInstrumentation = () => undefined;
export class MetricsReporter {
    reportGraphqlQueryParseError() {}
}
