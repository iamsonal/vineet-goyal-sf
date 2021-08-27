import { Luvio, Store } from '@luvio/engine';
import { getInstrumentation } from 'o11y/client';

const NAMESPACE = 'lds-runtime-mobile';
const instr = getInstrumentation(NAMESPACE);

/**
 * Initialize the instrumentation and instrument the LDS instance and the Store.
 *
 * @param luvio The Luvio instance to instrument.
 * @param store The Store to instrument.
 */
export function setupInstrumentation(luvio: Luvio, _store: Store): void {
    instrumentMethods(luvio, ['storeBroadcast', 'storeIngest', 'storeLookup']);

    // TODO [W-9782972]: part of internal instrumentation work
    //setStoreScheduler(store);
}

// pass in class, obj, what have you, with the method you want to wrap to collect duration metrics
// e.g. pass in Luvio with ['storeBroadcast', 'storeIngest', 'storeLookup']
function instrumentMethods(obj: any, methods: string[]): void {
    for (let i = 0, len = methods.length; i < len; i++) {
        const method = methods[i];
        const originalMethod = obj[method];

        obj[method] = function (...args: any[]): any {
            const act = instr.startActivity(method);
            const res = originalMethod.call(this, ...args);
            act.stop();

            return res;
        };
    }
}
