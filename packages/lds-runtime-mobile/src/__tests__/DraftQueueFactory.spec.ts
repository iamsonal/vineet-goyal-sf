import { DurableStore } from '@ldsjs/environments';
import { DurableDraftQueue } from '@salesforce/lds-drafts';

import { buildLdsDraftQueue } from '../DraftQueueFactory';
import { NimbusDraftQueue } from '../NimbusDraftQueue';
import { mockNimbusDraftQueueGlobal, resetNimbusDraftQueueGlobal } from './NimbusDraftQueue.spec';

describe('configureLdsDraftQueue', () => {
    it('returns NimbusDraftQueue if nimbus plugin is defined', () => {
        // define the nimbus plugin
        mockNimbusDraftQueueGlobal();

        const draftQueue = buildLdsDraftQueue(jest.fn(), (jest.fn() as unknown) as DurableStore);

        expect(draftQueue).toBeInstanceOf(NimbusDraftQueue);
    });

    it('returns DurableDraftQueue if nimbus plugin not defined', () => {
        // ensure nimbus plugin not defined
        resetNimbusDraftQueueGlobal();

        const draftQueue = buildLdsDraftQueue(jest.fn(), (jest.fn() as unknown) as DurableStore);

        expect(draftQueue).toBeInstanceOf(DurableDraftQueue);
    });
});
