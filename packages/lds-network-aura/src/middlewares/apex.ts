import { HttpStatusCode, ResourceRequest } from '@luvio/engine';
import { ActionConfig, executeGlobalController } from 'aura';
import { AuraFetchResponse } from '../AuraFetchResponse';
import appRouter from '../router';

const APEX_BASE_URI = '/apex';
const ApexController = 'ApexActionController.execute';

function executeApex(resourceRequest: ResourceRequest): Promise<any> {
    const { body } = resourceRequest;
    return dispatchApexAction(ApexController, body, {
        background: false,
        hotspot: false,
        longRunning: body.isContinuation,
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
            //  headers: { cacheable }
            //  body: returnValue
            return new AuraFetchResponse(
                HttpStatusCode.Ok,
                body.returnValue === undefined ? null : body.returnValue,
                // Headers expects properties of [name: string]: string
                // However this is a synthetic header and we want to keep the boolean
                { cacheable: body.cacheable as any }
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

appRouter.post((path: string) => path === APEX_BASE_URI, executeApex);
