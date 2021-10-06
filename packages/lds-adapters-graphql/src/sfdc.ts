import { Luvio } from '@luvio/engine';
import {
    AdapterMetadata,
    createImperativeAdapter,
    createInstrumentedAdapter,
    createLDSAdapter,
    createWireAdapterConstructor,
} from '@salesforce/lds-bindings';
import { withDefaultLuvio } from '@salesforce/lds-default-luvio';
import { adapterName, graphQLAdapterFactory } from './main';
import { namespace } from './util/adapter';

let graphQL: any;
let graphQL_imperative: any;
// TODO [W-9992865]: remove this export when lds-worker-api usage has been updated
let graphQLImperative: any;

const adapterMetadata: AdapterMetadata = {
    apiFamily: namespace,
    name: adapterName,
};

withDefaultLuvio((luvio: Luvio) => {
    const ldsAdapter = createLDSAdapter(luvio, namespace, graphQLAdapterFactory);

    graphQL = createWireAdapterConstructor(
        luvio,
        createInstrumentedAdapter(ldsAdapter, adapterMetadata),
        adapterMetadata
    );
    graphQL_imperative = createImperativeAdapter(luvio, ldsAdapter, adapterMetadata);
    graphQLImperative = ldsAdapter;
});

export { graphQL, graphQL_imperative, graphQLImperative };
