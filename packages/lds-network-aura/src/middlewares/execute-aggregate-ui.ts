import { HttpStatusCode } from '@luvio/engine';
import { DispatchActionConfig } from './utils';
import { AuraFetchResponse } from '../AuraFetchResponse';
import { executeGlobalController } from 'aura';
import { RecordRepresentation } from '@salesforce/lds-adapters-uiapi';
import { InstrumentationCallbacks } from './utils';

interface AggregateUiParams {
    input: {
        compositeRequest: CompositeRequest[];
    };
}

export interface CompositeRequest {
    url: string;
    referenceId: string;
}

type CompositeResponse<T> =
    | {
          body: T;
          httpStatusCode: HttpStatusCode.Ok;
      }
    | {
          message: string;
          httpStatusCode: Exclude<HttpStatusCode, HttpStatusCode.Ok>;
      };

interface CompositeResponseEnvelope<T> {
    compositeResponse: CompositeResponse<T>[];
}

/** Invoke executeAggregateUi Aura controller.  This is only to be used with large getRecord requests that
 *  would otherwise cause a query length exception.
 */
export function dispatchSplitRecordAggregateUiAction(
    endpoint: string,
    params: AggregateUiParams,
    config: DispatchActionConfig = {},
    _recordId: string,
    _instrumentationCallbacks: InstrumentationCallbacks = {}
): Promise<AuraFetchResponse<unknown>> {
    const { action: actionConfig } = config;

    return executeGlobalController(endpoint, params, actionConfig).then(
        (body: CompositeResponseEnvelope<RecordRepresentation>) => {
            // TODO [W-10432188]: move to lds-network-adapter
            // if (instrumentationCallbacks.resolveFn) {
            //     instrumentationCallbacks.resolveFn({
            //         body,
            //         params: { recordId },
            //     });
            // }
            // stuff it into FetchResponse to be handled by lds-network-adapter
            return new AuraFetchResponse(HttpStatusCode.Ok, body);
        },
        (err) => {
            // TODO [W-10432188]: move to lds-network-adapter
            // if (instrumentationCallbacks && instrumentationCallbacks.rejectFn) {
            //     instrumentationCallbacks.rejectFn({
            //         err,
            //         params: { recordId },
            //     });
            // }

            // Handle ConnectInJava exception shapes
            if (err.data !== undefined && err.data.statusCode !== undefined) {
                const { data } = err;
                throw new AuraFetchResponse(data.statusCode, data);
            }

            // Handle all the other kind of errors
            throw new AuraFetchResponse(HttpStatusCode.ServerError, {
                error: err.message,
            });
        }
    );
}
