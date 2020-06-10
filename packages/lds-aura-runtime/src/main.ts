import { lds } from '@salesforce/lds-web-runtime';

import { setupMetadataWatcher } from './metadata';

setupMetadataWatcher(lds);

export { lds };
