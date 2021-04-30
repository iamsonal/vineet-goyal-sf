import { Luvio } from '@luvio/engine';
import { createLDSAdapter, createWireAdapterConstructor } from '@salesforce/lds-bindings';
import { withDefaultLuvio } from '@salesforce/lds-default-luvio';

import { adapterApiFamily } from './constants';
import { adapterName, graphQLAdapterFactory } from './main';

let graphQL: any;
let graphQLImperative: any;

withDefaultLuvio((luvio: Luvio) => {
    graphQL = createWireAdapterConstructor(luvio, graphQLAdapterFactory, {
        apiFamily: adapterApiFamily,
        name: adapterName,
    });
    graphQLImperative = createLDSAdapter(luvio, adapterName, graphQLAdapterFactory);
});

export { graphQL, graphQLImperative };
