import { GetApexInvoker, GenerateGetApexWireAdapter } from './main';
import { createWireAdapterConstructor, createLDSAdapter, refresh } from '@salesforce/lds-bindings';

// export for @salesforce/apex
const REFRESH_APEX = 'refreshApex';
export const refreshApex = function<D>(data: D) {
    refresh(data, REFRESH_APEX);
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
    const invokeApexImperative: any = createLDSAdapter(adapterName, lds =>
        GetApexInvoker(lds, {
            namespace,
            classname,
            method,
            isContinuation,
        })
    );
    invokeApexImperative.adapter = createWireAdapterConstructor(adapterName, lds =>
        GenerateGetApexWireAdapter(lds, { namespace, classname, method, isContinuation })
    );
    return invokeApexImperative;
};

export { getSObjectValue } from './lds-apex-static-utils';
