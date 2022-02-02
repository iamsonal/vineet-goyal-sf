import * as gqlApi from 'force/ldsAdaptersGraphql';
import { storeEval } from 'native/ldsEngineMobile';

export function initializeStoreEval() {
    gqlApi.configuration.setStoreEval(storeEval);
}
