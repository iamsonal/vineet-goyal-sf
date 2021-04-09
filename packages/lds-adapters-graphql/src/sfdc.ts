import { createWireAdapterConstructor } from '@salesforce/lds-bindings';

import { adapterApiFamily } from './constants';
import { adapterName, graphQLAdapterFactory } from './main';

const graphQL = createWireAdapterConstructor(graphQLAdapterFactory, {
    apiFamily: adapterApiFamily,
    name: adapterName,
});

export { graphQL };
