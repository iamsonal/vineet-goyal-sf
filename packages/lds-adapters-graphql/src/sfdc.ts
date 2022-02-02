import { Luvio } from '@luvio/engine';
import {
    AdapterMetadata,
    createImperativeAdapter,
    createInstrumentedAdapter,
    createLDSAdapter,
    createWireAdapterConstructor,
} from '@salesforce/lds-bindings';
import { withDefaultLuvio } from '@salesforce/lds-default-luvio';
import { adapterName, graphQLAdapterFactory, configuration } from './main';
import { namespace } from './util/adapter';

let graphQL: any;
let unstable_graphQL_imperative: any;
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
    unstable_graphQL_imperative = createImperativeAdapter(
        luvio,
        createInstrumentedAdapter(ldsAdapter, adapterMetadata),
        adapterMetadata
    );
    graphQLImperative = ldsAdapter;
});

export { graphQL, unstable_graphQL_imperative, graphQLImperative, configuration };
