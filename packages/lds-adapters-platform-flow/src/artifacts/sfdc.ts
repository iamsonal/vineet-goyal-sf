import type { Luvio } from '@luvio/engine';
import { createLDSAdapter } from '@salesforce/lds-bindings';
import { withDefaultLuvio } from '@salesforce/lds-default-luvio';
import {
    navigateFlowAdapterFactory,
    adapterName as navigateFlow__adapterName,
} from '../adapters/navigateFlow';
import {
    resumeFlowAdapterFactory,
    adapterName as resumeFlow__adapterName,
} from '../adapters/resumeFlow';
import {
    startFlowAdapterFactory,
    adapterName as startFlow__adapterName,
} from '../adapters/startFlow';

let navigateFlow: any;
let resumeFlow: any;
let startFlow: any;

function bindExportsTo(luvio: Luvio): { [key: string]: any } {
    return {
        navigateFlow: createLDSAdapter(
            luvio,
            navigateFlow__adapterName,
            navigateFlowAdapterFactory
        ),
        resumeFlow: createLDSAdapter(luvio, resumeFlow__adapterName, resumeFlowAdapterFactory),
        startFlow: createLDSAdapter(luvio, startFlow__adapterName, startFlowAdapterFactory),
    };
}

withDefaultLuvio((luvio: Luvio) => {
    ({ navigateFlow, resumeFlow, startFlow } = bindExportsTo(luvio));
});

export { navigateFlow, resumeFlow, startFlow };
