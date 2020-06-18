import { lds } from '@salesforce/lds-runtime-web';

import { setupMetadataWatcher } from './metadata';

setupMetadataWatcher(lds);

export { lds };
