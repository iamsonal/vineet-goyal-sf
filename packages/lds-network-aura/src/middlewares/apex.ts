import { HttpStatusCode, ResourceRequest } from '@luvio/engine';
import { ActionConfig, executeGlobalController } from 'aura';
import { AuraFetchResponse } from '../AuraFetchResponse';
import appRouter from '../router';

export const LWR_APEX_BASE_URI = '/lwr/apex/v55.0';
const ApexController = 'ApexActionController.execute';
const CACHE_CONTROL = 'Cache-Control';
const X_SFDC_ALLOW_CONTINUATION = 'X-SFDC-Allow-Continuation';
interface apexActionParams {
    namespace: string | null;
    classname: string;
    method: string;
    isContinuation: boolean;
    params: any;
    cacheable: boolean;
}

function splitNamespaceClassname(classname: string): [string | null, string] {
    const split = classname.split('__');
    return split.length > 1 ? [split[0], split[1]] : ['', split[0]];
}

function executePostApex(resourceRequest: ResourceRequest): Promise<any> {
    const { urlParams, body, headers } = resourceRequest;
    const [namespace, classname] = splitNamespaceClassname(urlParams.apexClass as string);
    const params: apexActionParams = {
        namespace,
        classname,
        method: urlParams.apexMethod as string,
        isContinuation: headers[X_SFDC_ALLOW_CONTINUATION] === 'true',
        params: body,
        cacheable: false,
    };
    return dispatchApexAction(ApexController, params, {
        background: false,
        hotspot: false,
        longRunning: params.isContinuation,
    });
}

function executeGetApex(resourceRequest: ResourceRequest): Promise<any> {
    const { urlParams, queryParams, headers } = resourceRequest;
    const [namespace, classname] = splitNamespaceClassname(urlParams.apexClass as string);
    const params: apexActionParams = {
        namespace,
        classname,
        method: urlParams.apexMethod as string,
        isContinuation: headers[X_SFDC_ALLOW_CONTINUATION] === 'true',
        params: queryParams.methodParams,
        cacheable: true,
    };
    return dispatchApexAction(ApexController, params, {
        background: false,
        hotspot: false,
        longRunning: params.isContinuation,
    });
}

// when apex function does not return anything,
// returnValue property would be missing
interface ApexResponse {
    returnValue?: any;
    cacheable: boolean;
}

function dispatchApexAction(
    endpoint: string,
    params: any,
    config?: ActionConfig
): Promise<AuraFetchResponse<unknown>> {
    return executeGlobalController(endpoint, params, config).then(
        (body: ApexResponse) => {
            // massage aura action response to
            //  headers: { 'Cache-Control' }
            //  body: returnValue
            return new AuraFetchResponse(
                HttpStatusCode.Ok,
                body.returnValue === undefined ? null : body.returnValue,
                { [CACHE_CONTROL]: body.cacheable === true ? 'private' : 'no-cache' }
            );
        },
        (err) => {
            // Handle ConnectedInJava exception shapes
            if (err.data !== undefined && err.data.statusCode !== undefined) {
                const { data } = err;
                throw new AuraFetchResponse(data.statusCode, data);
            }

            // Handle all the other kind of errors
            throw new AuraFetchResponse(HttpStatusCode.ServerError, err);
        }
    );
}

appRouter.post((path: string) => path.startsWith(LWR_APEX_BASE_URI), executePostApex);
appRouter.get((path: string) => path.startsWith(LWR_APEX_BASE_URI), executeGetApex);
