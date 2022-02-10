import { configuration } from 'force/ldsAdaptersGraphql';
import { storeEval } from 'native/ldsEngineMobile';

export function initializeStoreEval() {
    configuration.setStoreEval(storeEval);
}
