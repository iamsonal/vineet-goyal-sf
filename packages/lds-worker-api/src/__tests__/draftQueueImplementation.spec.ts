import * as draftQueueExports from '../draftQueueImplementation';

describe('draftQueueImplementation', () => {
    it('exports draftQueue and draftManager', () => {
        expect(draftQueueExports.draftQueue).toBeDefined();
        expect(draftQueueExports.draftManager).toBeDefined();
    });
});
