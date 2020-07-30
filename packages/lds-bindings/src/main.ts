import { bindWireRefresh } from '@ldsjs/lwc-lds';
import { lds } from '@salesforce/lds-runtime-web';

export * from './common';

export const refresh = bindWireRefresh(lds);
