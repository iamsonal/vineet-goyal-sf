import { Luvio } from '@luvio/engine';
import AdsBridge from './ads-bridge';

import { withDefaultLuvio } from '@salesforce/lds-default-luvio';

export let adsBridge: AdsBridge;

withDefaultLuvio((luvio: Luvio) => {
    adsBridge = new AdsBridge(luvio);
});
