// bundling of lds-default-luvio and @luvio/engine for core

import { Environment, Luvio, Store } from '@luvio/engine';
import { setDefaultLuvio } from './main';
import networkAdapter from '@salesforce/lds-network-aura';

declare var $A:
    | {
          getContext: () => {
              getMode: () => string;
          };
      }
    | undefined;

// The code in lds-runtime-aura (force/ldsEngineCreator) depends on Aura module
// services to invoke its LDS initialization logic. Unfortunately, Aura component
// tests do not support module services and have no analogous function. The net
// result is that LDS is never initialized in the iframe that loads the Aura
// component test & any attempts to create an LWC component that uses an LDS
// adapter fail because the wire adapter constructors are undefined (W-9233247).
//
// The code below is the least offensive workaround we could come up with. When
// this code (force/ldsEngine) is loaded via static imports in an Aura component
// test iframe, it will perform a minimal initialization of LDS that allows
// the test to run and access data on the server. The instrumentation and
// configuration initialization steps from lds-runtime-aura are skipped to
// keep the logic simpler & faster.

if (
    typeof $A !== 'undefined' &&
    $A.getContext().getMode().indexOf('AUTOJSTEST') > -1 &&
    typeof window !== 'undefined' &&
    window.location.href.indexOf('auratest/test.app') > -1
) {
    const storeOptions = {
        scheduler: () => {},
    };
    const store = new Store(storeOptions);
    const environment = new Environment(store, networkAdapter);
    const luvio = new Luvio(environment);
    setDefaultLuvio({ luvio });
}

export * from './main';
export * from '@luvio/engine';
