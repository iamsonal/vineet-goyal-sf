import { GetApexInvoker, GenerateGetApexWireAdapter } from './main';
import { REFRESH_APEX_KEY } from '@salesforce/lds-instrumentation';
import { createWireAdapterConstructor, createLDSAdapter, refresh } from '@salesforce/lds-bindings';

// export for @salesforce/apex
export const refreshApex: typeof refresh = function<D>(data: D) {
    return refresh(data, REFRESH_APEX_KEY);
};

/**
 * Apex
 */
export const getApexInvoker = function(
    namespace: string,
    classname: string,
    method: string,
    isContinuation: boolean
) {
    const adapterName = `getApex_${namespace}_${classname}_${method}_${isContinuation}`;
    const invokeApexImperative: any = createLDSAdapter(adapterName, luvio =>
        GetApexInvoker(luvio, {
            namespace,
            classname,
            method,
            isContinuation,
        })
    );
    invokeApexImperative.adapter = createWireAdapterConstructor(adapterName, luvio =>
        GenerateGetApexWireAdapter(luvio, { namespace, classname, method, isContinuation })
    );
    return invokeApexImperative;
};

export { getSObjectValue } from './lds-apex-static-utils';
