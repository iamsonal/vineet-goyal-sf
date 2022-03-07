import type { Luvio } from '@luvio/engine';
import { bindWireRefresh as luvioBindWireRefresh } from '@luvio/lwc-luvio';
import { instrumentation } from './instrumentation';

export type refreshApiNames = {
    refreshApex: string;
    refreshUiApi: string;
};
export let refresh: (data: any, apiFamily: keyof refreshApiNames) => Promise<undefined> | undefined;

export function bindWireRefresh(luvio: Luvio) {
    const wireRefresh = luvioBindWireRefresh(luvio);
    refresh = (data: any, apiFamily: keyof refreshApiNames) => {
        instrumentation.refreshCalled(apiFamily);
        return wireRefresh(data);
    };
}
