import { LDS } from '@ldsjs/engine';

import { mark } from './instrumentation';
import { clearStorages } from './storage';

const OBJECT_INFO_PREFIX = 'UiApi::ObjectInfoRepresentation:';

const STORAGE_DROP_MARK_NAME = 'storage-drop';
const STORAGE_DROP_MARK_CONTEXT = {
    reason: 'Object info changed',
};

/**
 * Watch an LDS instance for metadata changes.
 */
export function setupMetadataWatcher(lds: LDS): void {
    // Watch for object info changes. Since we don't have enough information to understand to which
    // extent an object info change may impact the application the only thing we do is to clear all
    // the  persistent storages.
    lds.storeWatch(OBJECT_INFO_PREFIX, entries => {
        for (let i = 0, len = entries.length; i < len; i++) {
            const entry = entries[i];
            const isObjectInfoUpdated = entry.inserted === false;

            if (isObjectInfoUpdated) {
                mark(STORAGE_DROP_MARK_NAME, STORAGE_DROP_MARK_CONTEXT);
                clearStorages().catch(() => {
                    /* noop */
                });

                break;
            }
        }
    });
}
