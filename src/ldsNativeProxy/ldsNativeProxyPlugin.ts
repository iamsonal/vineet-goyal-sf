// TODO: pull in interface as devDependency from lds-native-nimbus plugin on npm
// instead of having it in the engine package
import { LdsProxyAdapter } from '@salesforce-lds/engine';

export function getLdsNativeProxyPlugin(): LdsProxyAdapter {
    // The native container that uses the lds-proxy nimbus plugin will
    // put the javascript piece of the plugin on the window object.

    const ldsProxyPlugin = (window as any).LdsProxyAdapter as LdsProxyAdapter;

    // TODO: once LDS Native Proxy is no longer behind the isMobileLwcOfflineEnabled
    // gate then remove the following if check
    if (ldsProxyPlugin === undefined) {
        return {} as LdsProxyAdapter;
    }

    return ldsProxyPlugin;
}
