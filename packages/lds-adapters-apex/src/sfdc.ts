import { GetApexInvoker, GenerateGetApexWireAdapter } from './main';
import { REFRESH_APEX_KEY } from '@salesforce/lds-instrumentation';
import {
    bindWireRefresh,
    createWireAdapterConstructor,
    createLDSAdapter,
    refresh,
} from '@salesforce/lds-bindings';
import { Luvio } from '@luvio/engine';
import { withDefaultLuvio } from '@salesforce/lds-default-luvio';

// export for @salesforce/apex
export const refreshApex: typeof refresh = function <D>(data: D) {
    return refresh(data, REFRESH_APEX_KEY);
};

let luvio: Luvio;
withDefaultLuvio((_luvio) => {
    luvio = _luvio;
    bindWireRefresh(luvio);
});

/**
 * Apex
 */
export const getApexInvoker = function (
    namespace: string,
    classname: string,
    method: string,
    isContinuation: boolean
) {
    if (luvio === undefined) {
        throw new Error('cannot create Apex adapter before default luvio is set');
    }

    const adapterName = `getApex_${namespace}_${classname}_${method}_${isContinuation}`;
    const invokeApexImperative: any = createLDSAdapter(luvio, adapterName, (luvio) =>
        GetApexInvoker(luvio, {
            namespace,
            classname,
            method,
            isContinuation,
        })
    );
    invokeApexImperative.adapter = createWireAdapterConstructor(
        luvio,
        (luvio) =>
            GenerateGetApexWireAdapter(luvio, { namespace, classname, method, isContinuation }),
        { apiFamily: 'Apex', name: adapterName }
    );
    return invokeApexImperative;
};

export { getSObjectValue } from './lds-apex-static-utils';
