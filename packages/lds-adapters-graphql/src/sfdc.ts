import { Luvio } from '@luvio/engine';
import {
    AdapterMetadata,
    createInstrumentedAdapter,
    createLDSAdapter,
    createWireAdapterConstructor,
} from '@salesforce/lds-bindings';
import { withDefaultLuvio } from '@salesforce/lds-default-luvio';
import { adapterName, graphQLAdapterFactory } from './main';
import { apiFamilyName } from './util/adapter';

let graphQL: any;
let graphQLImperative: any;

const adapterMetadata: AdapterMetadata = {
    apiFamily: apiFamilyName,
    name: adapterName,
};

withDefaultLuvio((luvio: Luvio) => {
    const ldsAdapter = createLDSAdapter(luvio, apiFamilyName, graphQLAdapterFactory);

    graphQL = createWireAdapterConstructor(
        luvio,
        createInstrumentedAdapter(ldsAdapter, adapterMetadata),
        adapterMetadata
    );
    graphQLImperative = ldsAdapter;
});

export { graphQL, graphQLImperative };
