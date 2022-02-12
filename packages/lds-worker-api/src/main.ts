import {
    subscribeToAdapter,
    invokeAdapter,
    invokeAdapterWithMetadata,
    invokeAdapterWithDraftToReplace,
    executeAdapter,
    executeMutatingAdapter,
} from './executeAdapter';
import { nimbusDraftQueue } from './nimbusDraftQueue';
import { draftQueue, draftManager } from './draftQueueImplementation';
import { setUiApiRecordTTL, setMetadataTTL } from './ttl';
import { withDefaultLuvio } from 'native/ldsEngineMobile';
import type { Luvio } from '@luvio/engine';
import { initializeStoreEval } from './storeEval';

if (process.env.NODE_ENV !== 'production') {
    // eslint-disable-next-line no-undef
    withDefaultLuvio((luvio: Luvio) => {
        // eslint-disable-next-line no-undef
        const global = typeof globalThis === 'undefined' ? {} : (globalThis as any);
        global.luvio = luvio;
    });
}

initializeStoreEval();

export {
    subscribeToAdapter,
    invokeAdapter,
    invokeAdapterWithMetadata,
    invokeAdapterWithDraftToReplace,
    executeAdapter,
    executeMutatingAdapter,
    nimbusDraftQueue,
    draftQueue,
    draftManager,
    setUiApiRecordTTL,
    setMetadataTTL,
};
