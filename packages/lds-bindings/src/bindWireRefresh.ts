import { Luvio } from '@luvio/engine';
import { bindWireRefresh as luvioBindWireRefresh } from '@luvio/lwc-luvio';
import { instrumentation } from './instrumentation';

export let refresh: (data: any, apiFamily: string) => Promise<undefined> | undefined;

export function bindWireRefresh(luvio: Luvio) {
    const wireRefresh = luvioBindWireRefresh(luvio);
    refresh = (data: any, apiFamily: string) => {
        instrumentation.refreshCalled(apiFamily);
        return wireRefresh(data);
    };
}
